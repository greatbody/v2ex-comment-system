/**
 * V2EX 外挂评论系统 - Cloudflare Worker
 *
 * API 路由:
 *   GET  /api/comments?topic_id=xxx          获取帖子评论
 *   POST /api/comments                       发表评论
 *   GET  /api/health                          健康检查
 *
 * 安全措施:
 *   - 严格 CORS，仅允许 v2ex.com 来源
 *   - user_key 格式校验 (32位hex md5)
 *   - 内容长度限制 & XSS 过滤
 *   - 频率限制 (每用户每分钟最多5条)
 *   - 请求体大小限制
 */

const ALLOWED_ORIGINS = [
  'https://www.v2ex.com',
  'https://v2ex.com',
  'https://cn.v2ex.com',
  'https://hk.v2ex.com',
  'https://jp.v2ex.com',
  'https://global.v2ex.com',
];

const MAX_CONTENT_LENGTH = 2000;
const MAX_NICKNAME_LENGTH = 20;
const RATE_LIMIT_WINDOW = 60;  // 秒
const RATE_LIMIT_MAX = 5;      // 每窗口最大请求数
const MAX_BODY_SIZE = 4096;    // 请求体最大字节数
const USER_KEY_REGEX = /^[0-9a-f]{32}$/;
const TOPIC_ID_REGEX = /^\d{1,10}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return handleCORS(origin);
    }

    let response;
    try {
      switch (true) {
        case url.pathname === '/api/health' && request.method === 'GET':
          response = jsonResponse({ status: 'ok', timestamp: Date.now() });
          break;

        case url.pathname === '/api/comments' && request.method === 'GET':
          response = await handleGetComments(url, env);
          break;

        case url.pathname === '/api/comments' && request.method === 'POST':
          response = await handlePostComment(request, env);
          break;

        default:
          response = jsonResponse({ error: 'Not Found' }, 404);
      }
    } catch (err) {
      console.error('Unhandled error:', err);
      response = jsonResponse({ error: 'Internal Server Error' }, 500);
    }

    // 附加 CORS 头
    return addCORSHeaders(response, origin);
  },
};

// ─── CORS ────────────────────────────────────────────────

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

function handleCORS(origin) {
  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Key',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    },
  });
}

function addCORSHeaders(response, origin) {
  const newHeaders = new Headers(response.headers);
  if (isAllowedOrigin(origin)) {
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Vary', 'Origin');
  }
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}

// ─── 获取评论 ────────────────────────────────────────────

async function handleGetComments(url, env) {
  const topicId = url.searchParams.get('topic_id');
  if (!topicId || !TOPIC_ID_REGEX.test(topicId)) {
    return jsonResponse({ error: 'Invalid topic_id' }, 400);
  }

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('page_size') || '50', 10)));
  const offset = (page - 1) * pageSize;

  // 查询评论
  const { results } = await env.DB.prepare(
    `SELECT id, topic_id, user_key, nickname, content, created_at, parent_id
     FROM comments
     WHERE topic_id = ?
     ORDER BY created_at ASC
     LIMIT ? OFFSET ?`
  )
    .bind(topicId, pageSize, offset)
    .all();

  // 查询总数
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM comments WHERE topic_id = ?`
  )
    .bind(topicId)
    .first();

  return jsonResponse({
    comments: results.map(sanitizeComment),
    total: countResult.total,
    page,
    page_size: pageSize,
  });
}

// ─── 发表评论 ────────────────────────────────────────────

async function handlePostComment(request, env) {
  // 检查 Content-Type
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) {
    return jsonResponse({ error: 'Content-Type must be application/json' }, 400);
  }

  // 检查请求体大小
  const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return jsonResponse({ error: 'Request body too large' }, 413);
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return jsonResponse({ error: 'Request body too large' }, 413);
    }
    body = JSON.parse(text);
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { topic_id, user_key, nickname, content, parent_id } = body;

  // ── 参数校验 ──
  if (!topic_id || !TOPIC_ID_REGEX.test(String(topic_id))) {
    return jsonResponse({ error: 'Invalid topic_id' }, 400);
  }

  if (!user_key || !USER_KEY_REGEX.test(user_key)) {
    return jsonResponse({ error: 'Invalid user_key (must be 32-char hex md5)' }, 400);
  }

  // 同时从 header 和 body 校验 user_key 一致性
  const headerKey = request.headers.get('X-User-Key');
  if (headerKey && headerKey !== user_key) {
    return jsonResponse({ error: 'user_key mismatch between header and body' }, 400);
  }

  if (!content || typeof content !== 'string') {
    return jsonResponse({ error: 'Content is required' }, 400);
  }

  const sanitizedContent = sanitizeInput(content.trim());
  if (sanitizedContent.length === 0 || sanitizedContent.length > MAX_CONTENT_LENGTH) {
    return jsonResponse({
      error: `Content length must be between 1 and ${MAX_CONTENT_LENGTH} characters`,
    }, 400);
  }

  const sanitizedNickname = sanitizeInput(
    (nickname || '匿名用户').trim()
  ).slice(0, MAX_NICKNAME_LENGTH);

  // parent_id 校验
  if (parent_id !== undefined && parent_id !== null) {
    if (!Number.isInteger(parent_id) || parent_id < 1) {
      return jsonResponse({ error: 'Invalid parent_id' }, 400);
    }
    // 检查父评论是否存在且属于同一帖子
    const parentComment = await env.DB.prepare(
      `SELECT id FROM comments WHERE id = ? AND topic_id = ?`
    )
      .bind(parent_id, String(topic_id))
      .first();
    if (!parentComment) {
      return jsonResponse({ error: 'Parent comment not found in this topic' }, 404);
    }
  }

  // ── 频率限制 ──
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - RATE_LIMIT_WINDOW;

  // 清理旧记录
  await env.DB.prepare(
    `DELETE FROM rate_limits WHERE timestamp < ?`
  ).bind(windowStart).run();

  // 统计当前窗口内的请求数
  const rateResult = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM rate_limits WHERE user_key = ? AND action = 'comment' AND timestamp >= ?`
  ).bind(user_key, windowStart).first();

  if (rateResult.cnt >= RATE_LIMIT_MAX) {
    return jsonResponse({
      error: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} comments per ${RATE_LIMIT_WINDOW} seconds.`,
    }, 429);
  }

  // 记录本次请求
  await env.DB.prepare(
    `INSERT INTO rate_limits (user_key, action, timestamp) VALUES (?, 'comment', ?)`
  ).bind(user_key, now).run();

  // ── 计算 IP hash (隐私保护，不存原始IP) ──
  const cfIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashString(cfIP + user_key);

  // ── 插入评论 ──
  const result = await env.DB.prepare(
    `INSERT INTO comments (topic_id, user_key, nickname, content, ip_hash, parent_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      String(topic_id),
      user_key,
      sanitizedNickname,
      sanitizedContent,
      ipHash,
      parent_id || null
    )
    .run();

  // 查询刚插入的评论
  const newComment = await env.DB.prepare(
    `SELECT id, topic_id, user_key, nickname, content, created_at, parent_id
     FROM comments WHERE id = ?`
  )
    .bind(result.meta.last_row_id)
    .first();

  return jsonResponse({
    comment: sanitizeComment(newComment),
  }, 201);
}

// ─── 工具函数 ────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/**
 * 过滤 XSS：转义 HTML 特殊字符
 */
function sanitizeInput(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * 输出评论时隐藏 user_key 的中间部分
 */
function sanitizeComment(comment) {
  return {
    ...comment,
    user_key: comment.user_key.slice(0, 6) + '****' + comment.user_key.slice(-4),
  };
}

/**
 * SHA-256 哈希，取前32位hex
 */
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
