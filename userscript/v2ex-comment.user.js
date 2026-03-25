// ==UserScript==
// @name         V2EX 外挂评论系统
// @namespace    https://github.com/greatbody/v2ex-comment-system
// @version      1.0.0
// @description  在 V2EX 帖子页面左侧显示独立评论系统，数据存储在 Cloudflare D1
// @author       greatbody
// @match        https://www.v2ex.com/t/*
// @match        https://v2ex.com/t/*
// @match        https://cn.v2ex.com/t/*
// @match        https://hk.v2ex.com/t/*
// @match        https://jp.v2ex.com/t/*
// @match        https://global.v2ex.com/t/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      v2ex-comment-worker.sunruicode.workers.dev
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ════════════════════════════════════════════════════════
  // 配置 - 部署后将此 URL 改为你的 Worker 地址
  // ════════════════════════════════════════════════════════
  const API_BASE = 'https://v2ex-comment-worker.sunruicode.workers.dev';

  // ════════════════════════════════════════════════════════
  // 工具函数
  // ════════════════════════════════════════════════════════

  /**
   * MD5 实现 (纯 JS，无依赖)
   * 来源: Joseph Myers 的公共域 MD5 实现，精简版
   */
  function md5(string) {
    function md5cycle(x, k) {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[1], 21, -57434055);
      a = ii(a, b, c, d, k[8], 6, 1700485571);
      d = ii(d, a, b, c, k[15], 10, -1894986606);
      c = ii(c, d, a, b, k[6], 15, -1051523);
      b = ii(b, c, d, a, k[13], 21, -2054922799);
      a = ii(a, b, c, d, k[4], 6, 1873313359);
      d = ii(d, a, b, c, k[11], 10, -30611744);
      c = ii(c, d, a, b, k[2], 15, -1560198380);
      b = ii(b, c, d, a, k[9], 21, 1309151649);
      a = ii(a, b, c, d, k[0], 6, -145523070);
      d = ii(d, a, b, c, k[7], 10, -1120210379);
      c = ii(c, d, a, b, k[14], 15, 718787259);
      b = ii(b, c, d, a, k[5], 21, -343485551);
      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
    function md5blk(s) {
      const md5blks = [];
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] =
          s.charCodeAt(i) +
          (s.charCodeAt(i + 1) << 8) +
          (s.charCodeAt(i + 2) << 16) +
          (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    function md5str(s) {
      const n = s.length;
      let state = [1732584193, -271733879, -1732584194, 271733878];
      let i;
      for (i = 64; i <= n; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < s.length; i++) {
        tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
      }
      tail[i >> 2] |= 0x80 << (i % 4 << 3);
      if (i > 55) {
        md5cycle(state, tail);
        for (i = 0; i < 16; i++) tail[i] = 0;
      }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }
    function rhex(n) {
      const hex = '0123456789abcdef';
      let s = '';
      for (let j = 0; j < 4; j++) {
        s += hex.charAt((n >> (j * 8 + 4)) & 0x0f) + hex.charAt((n >> (j * 8)) & 0x0f);
      }
      return s;
    }
    function add32(a, b) {
      return (a + b) & 0xffffffff;
    }
    const result = md5str(string);
    return rhex(result[0]) + rhex(result[1]) + rhex(result[2]) + rhex(result[3]);
  }

  // ════════════════════════════════════════════════════════
  // 浏览器指纹采集
  // ════════════════════════════════════════════════════════

  function collectFingerprint() {
    const components = [];

    // User Agent
    components.push(navigator.userAgent);

    // 屏幕信息
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

    // 时区
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // 语言
    components.push(navigator.language);
    components.push((navigator.languages || []).join(','));

    // 平台
    components.push(navigator.platform);

    // 硬件并发数
    components.push(String(navigator.hardwareConcurrency || 'unknown'));

    // 设备内存 (Chrome)
    components.push(String(navigator.deviceMemory || 'unknown'));

    // Canvas 指纹
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('V2EX Comment Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('V2EX Comment Fingerprint', 4, 17);
      components.push(canvas.toDataURL());
    } catch {
      components.push('canvas-unavailable');
    }

    // WebGL 渲染器
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
        }
      }
    } catch {
      components.push('webgl-unavailable');
    }

    // 触摸支持
    components.push(String(navigator.maxTouchPoints || 0));

    return components.join('|||');
  }

  /**
   * 生成用户唯一 Key：浏览器指纹 + GUID，取 MD5
   */
  function generateUserKey() {
    // 生成 GUID v4
    const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    const fingerprint = collectFingerprint();
    const raw = fingerprint + '::' + guid + '::' + Date.now();
    return md5(raw);
  }

  /**
   * 获取或创建用户 Key
   */
  function getUserKey() {
    let key = GM_getValue('v2ex_comment_user_key', null);
    if (!key || !/^[0-9a-f]{32}$/.test(key)) {
      key = generateUserKey();
      GM_setValue('v2ex_comment_user_key', key);
    }
    return key;
  }

  /**
   * 获取/设置昵称
   */
  function getNickname() {
    return GM_getValue('v2ex_comment_nickname', '匿名用户');
  }
  function setNickname(name) {
    GM_setValue('v2ex_comment_nickname', name.trim().slice(0, 20) || '匿名用户');
  }

  // ════════════════════════════════════════════════════════
  // Key 导入导出
  // ════════════════════════════════════════════════════════

  function exportKey() {
    const data = {
      version: 1,
      user_key: getUserKey(),
      nickname: getNickname(),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v2ex-comment-key-${data.user_key.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importKey() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.user_key || !/^[0-9a-f]{32}$/.test(data.user_key)) {
            alert('[V2EX评论] 导入失败：无效的 user_key 格式');
            return;
          }
          if (
            !confirm(
              `确认导入此身份？\n\nKey: ${data.user_key.slice(0, 6)}****${data.user_key.slice(-4)}\n昵称: ${data.nickname || '匿名用户'}\n导出时间: ${data.exported_at || '未知'}\n\n警告：导入后当前身份将被覆盖！`
            )
          ) {
            return;
          }
          GM_setValue('v2ex_comment_user_key', data.user_key);
          if (data.nickname) {
            setNickname(data.nickname);
          }
          alert('[V2EX评论] 导入成功，页面即将刷新');
          location.reload();
        } catch {
          alert('[V2EX评论] 导入失败：文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // 注册油猴菜单
  GM_registerMenuCommand('导出身份 Key', exportKey);
  GM_registerMenuCommand('导入身份 Key', importKey);

  // ════════════════════════════════════════════════════════
  // API 请求封装
  // ════════════════════════════════════════════════════════

  function apiRequest(method, path, data) {
    return new Promise((resolve, reject) => {
      const opts = {
        method,
        url: API_BASE + path,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Key': getUserKey(),
        },
        responseType: 'json',
        onload(resp) {
          if (resp.status >= 200 && resp.status < 300) {
            const result =
              typeof resp.response === 'string'
                ? JSON.parse(resp.response)
                : resp.response;
            resolve(result);
          } else {
            const err =
              typeof resp.response === 'string'
                ? JSON.parse(resp.response)
                : resp.response;
            reject(err);
          }
        },
        onerror(err) {
          reject({ error: 'Network error', detail: err });
        },
      };
      if (data) {
        opts.data = JSON.stringify(data);
      }
      GM_xmlhttpRequest(opts);
    });
  }

  // ════════════════════════════════════════════════════════
  // 提取帖子 ID
  // ════════════════════════════════════════════════════════

  function getTopicId() {
    const match = location.pathname.match(/^\/t\/(\d+)/);
    return match ? match[1] : null;
  }

  // ════════════════════════════════════════════════════════
  // 样式注入
  // ════════════════════════════════════════════════════════

  function injectStyles() {
    const css = `
      #v2ex-ext-comment-panel {
        position: fixed;
        left: 12px;
        top: 80px;
        width: 280px;
        max-height: calc(100vh - 100px);
        background: #fff;
        border: 1px solid #e2e2e2;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: #333;
        transition: opacity 0.2s;
      }

      #v2ex-ext-comment-panel.collapsed {
        max-height: 40px;
        overflow: hidden;
      }

      .v2ex-ext-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        user-select: none;
        background: #fafafa;
        border-radius: 8px 8px 0 0;
      }

      .v2ex-ext-header-title {
        font-weight: 600;
        font-size: 13px;
        color: #333;
      }

      .v2ex-ext-header-badge {
        background: #4a90d9;
        color: #fff;
        font-size: 11px;
        padding: 1px 6px;
        border-radius: 10px;
        margin-left: 6px;
      }

      .v2ex-ext-header-toggle {
        font-size: 16px;
        color: #999;
        transition: transform 0.2s;
      }

      .collapsed .v2ex-ext-header-toggle {
        transform: rotate(180deg);
      }

      .v2ex-ext-comments {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
        max-height: calc(100vh - 300px);
      }

      .v2ex-ext-comments::-webkit-scrollbar {
        width: 4px;
      }
      .v2ex-ext-comments::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 2px;
      }

      .v2ex-ext-comment-item {
        padding: 8px 12px;
        border-bottom: 1px solid #f5f5f5;
      }
      .v2ex-ext-comment-item:last-child {
        border-bottom: none;
      }

      .v2ex-ext-comment-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .v2ex-ext-comment-author {
        font-weight: 500;
        color: #4a90d9;
        font-size: 12px;
      }

      .v2ex-ext-comment-time {
        font-size: 11px;
        color: #aaa;
      }

      .v2ex-ext-comment-content {
        color: #444;
        line-height: 1.5;
        word-break: break-word;
      }

      .v2ex-ext-comment-reply-tag {
        font-size: 11px;
        color: #999;
        margin-bottom: 2px;
      }

      .v2ex-ext-empty {
        text-align: center;
        color: #bbb;
        padding: 24px 12px;
        font-size: 13px;
      }

      .v2ex-ext-form {
        padding: 10px 12px;
        border-top: 1px solid #f0f0f0;
        background: #fafafa;
        border-radius: 0 0 8px 8px;
      }

      .v2ex-ext-form-row {
        margin-bottom: 8px;
      }

      .v2ex-ext-form input[type="text"],
      .v2ex-ext-form textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 6px 8px;
        font-size: 12px;
        font-family: inherit;
        resize: vertical;
        outline: none;
        transition: border-color 0.2s;
      }
      .v2ex-ext-form input[type="text"]:focus,
      .v2ex-ext-form textarea:focus {
        border-color: #4a90d9;
      }

      .v2ex-ext-form textarea {
        min-height: 60px;
        max-height: 120px;
      }

      .v2ex-ext-form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .v2ex-ext-btn {
        background: #4a90d9;
        color: #fff;
        border: none;
        border-radius: 4px;
        padding: 5px 14px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .v2ex-ext-btn:hover {
        background: #357abd;
      }
      .v2ex-ext-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .v2ex-ext-btn-secondary {
        background: transparent;
        color: #999;
        border: 1px solid #ddd;
      }
      .v2ex-ext-btn-secondary:hover {
        background: #f5f5f5;
        color: #666;
      }

      .v2ex-ext-char-count {
        font-size: 11px;
        color: #aaa;
      }

      .v2ex-ext-error {
        color: #e74c3c;
        font-size: 12px;
        padding: 4px 0;
      }

      .v2ex-ext-loading {
        text-align: center;
        padding: 16px;
        color: #aaa;
      }

      .v2ex-ext-footer {
        padding: 6px 12px;
        border-top: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .v2ex-ext-footer-info {
        font-size: 10px;
        color: #ccc;
      }

      .v2ex-ext-key-actions {
        display: flex;
        gap: 6px;
      }

      .v2ex-ext-key-btn {
        font-size: 10px;
        color: #aaa;
        cursor: pointer;
        text-decoration: underline;
        background: none;
        border: none;
        padding: 0;
      }
      .v2ex-ext-key-btn:hover {
        color: #4a90d9;
      }

      /* 响应式：屏幕太窄时隐藏 */
      @media (max-width: 1280px) {
        #v2ex-ext-comment-panel {
          display: none;
        }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ════════════════════════════════════════════════════════
  // UI 构建与交互
  // ════════════════════════════════════════════════════════

  function formatTime(isoStr) {
    try {
      const d = new Date(isoStr + (isoStr.endsWith('Z') ? '' : 'Z'));
      const now = new Date();
      const diff = (now - d) / 1000;
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } catch {
      return isoStr;
    }
  }

  function escapeForDisplay(str) {
    // 内容已在服务端做了 HTML 转义，这里直接返回
    return str;
  }

  function buildPanel(topicId) {
    const panel = document.createElement('div');
    panel.id = 'v2ex-ext-comment-panel';

    panel.innerHTML = `
      <div class="v2ex-ext-header">
        <div>
          <span class="v2ex-ext-header-title">外挂评论</span>
          <span class="v2ex-ext-header-badge" id="v2ex-ext-count">0</span>
        </div>
        <span class="v2ex-ext-header-toggle" id="v2ex-ext-toggle">▼</span>
      </div>
      <div class="v2ex-ext-comments" id="v2ex-ext-comments">
        <div class="v2ex-ext-loading">加载中...</div>
      </div>
      <div class="v2ex-ext-form" id="v2ex-ext-form">
        <div class="v2ex-ext-form-row">
          <input type="text" id="v2ex-ext-nickname" placeholder="昵称（可选）"
                 maxlength="20" value="${escapeForDisplay(getNickname())}" />
        </div>
        <div class="v2ex-ext-form-row">
          <textarea id="v2ex-ext-content" placeholder="写点什么..." maxlength="2000"></textarea>
        </div>
        <div class="v2ex-ext-form-actions">
          <span class="v2ex-ext-char-count"><span id="v2ex-ext-charcount">0</span>/2000</span>
          <button class="v2ex-ext-btn" id="v2ex-ext-submit">发表</button>
        </div>
        <div class="v2ex-ext-error" id="v2ex-ext-error" style="display:none;"></div>
      </div>
      <div class="v2ex-ext-footer">
        <span class="v2ex-ext-footer-info">ID: ${getUserKey().slice(0, 6)}****</span>
        <div class="v2ex-ext-key-actions">
          <button class="v2ex-ext-key-btn" id="v2ex-ext-export">导出</button>
          <button class="v2ex-ext-key-btn" id="v2ex-ext-import">导入</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // ── 折叠/展开 ──
    const header = panel.querySelector('.v2ex-ext-header');
    header.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
    });

    // ── 字符计数 ──
    const contentEl = document.getElementById('v2ex-ext-content');
    const charCount = document.getElementById('v2ex-ext-charcount');
    contentEl.addEventListener('input', () => {
      charCount.textContent = contentEl.value.length;
    });

    // ── 保存昵称 ──
    const nicknameEl = document.getElementById('v2ex-ext-nickname');
    nicknameEl.addEventListener('change', () => {
      setNickname(nicknameEl.value);
    });

    // ── 提交评论 ──
    const submitBtn = document.getElementById('v2ex-ext-submit');
    const errorEl = document.getElementById('v2ex-ext-error');

    submitBtn.addEventListener('click', async () => {
      const content = contentEl.value.trim();
      if (!content) {
        showError('请输入评论内容');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';
      errorEl.style.display = 'none';

      try {
        const nickname = nicknameEl.value.trim() || '匿名用户';
        setNickname(nickname);

        const result = await apiRequest('POST', '/api/comments', {
          topic_id: topicId,
          user_key: getUserKey(),
          nickname,
          content,
          parent_id: currentReplyTo,
        });

        // 追加到列表
        appendComment(result.comment);
        contentEl.value = '';
        charCount.textContent = '0';
        currentReplyTo = null;
        updateReplyHint();

        // 更新计数
        const badge = document.getElementById('v2ex-ext-count');
        badge.textContent = parseInt(badge.textContent) + 1;

        // 滚到底部
        const commentsEl = document.getElementById('v2ex-ext-comments');
        commentsEl.scrollTop = commentsEl.scrollHeight;
      } catch (err) {
        showError(err.error || '发表失败，请重试');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '发表';
      }
    });

    // ── 快捷键 Ctrl+Enter 提交 ──
    contentEl.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        submitBtn.click();
      }
    });

    // ── 导入导出 ──
    document.getElementById('v2ex-ext-export').addEventListener('click', (e) => {
      e.stopPropagation();
      exportKey();
    });
    document.getElementById('v2ex-ext-import').addEventListener('click', (e) => {
      e.stopPropagation();
      importKey();
    });

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    }
  }

  let currentReplyTo = null;

  function updateReplyHint() {
    const existing = document.getElementById('v2ex-ext-reply-hint');
    if (currentReplyTo) {
      if (!existing) {
        const hint = document.createElement('div');
        hint.id = 'v2ex-ext-reply-hint';
        hint.style.cssText =
          'font-size:11px;color:#4a90d9;padding:4px 0;cursor:pointer;';
        hint.textContent = `回复 #${currentReplyTo} (点击取消)`;
        hint.addEventListener('click', () => {
          currentReplyTo = null;
          updateReplyHint();
        });
        const form = document.getElementById('v2ex-ext-form');
        form.insertBefore(hint, form.firstChild);
      } else {
        existing.textContent = `回复 #${currentReplyTo} (点击取消)`;
      }
    } else if (existing) {
      existing.remove();
    }
  }

  function appendComment(comment) {
    const commentsEl = document.getElementById('v2ex-ext-comments');
    // 移除空状态
    const empty = commentsEl.querySelector('.v2ex-ext-empty');
    if (empty) empty.remove();
    const loading = commentsEl.querySelector('.v2ex-ext-loading');
    if (loading) loading.remove();

    const item = document.createElement('div');
    item.className = 'v2ex-ext-comment-item';

    let replyTag = '';
    if (comment.parent_id) {
      replyTag = `<div class="v2ex-ext-comment-reply-tag">回复 #${comment.parent_id}</div>`;
    }

    item.innerHTML = `
      ${replyTag}
      <div class="v2ex-ext-comment-meta">
        <span class="v2ex-ext-comment-author">${escapeForDisplay(comment.nickname)}</span>
        <span class="v2ex-ext-comment-time">${formatTime(comment.created_at)}</span>
      </div>
      <div class="v2ex-ext-comment-content">${escapeForDisplay(comment.content)}</div>
    `;

    // 点击回复
    item.style.cursor = 'pointer';
    item.title = '点击回复';
    item.addEventListener('click', () => {
      currentReplyTo = comment.id;
      updateReplyHint();
      document.getElementById('v2ex-ext-content').focus();
    });

    commentsEl.appendChild(item);
  }

  function renderComments(comments) {
    const commentsEl = document.getElementById('v2ex-ext-comments');
    commentsEl.innerHTML = '';

    if (!comments || comments.length === 0) {
      commentsEl.innerHTML = '<div class="v2ex-ext-empty">暂无评论，来抢沙发</div>';
      return;
    }

    comments.forEach((c) => appendComment(c));
  }

  // ════════════════════════════════════════════════════════
  // 主流程
  // ════════════════════════════════════════════════════════

  async function main() {
    const topicId = getTopicId();
    if (!topicId) return;

    // 确保 user_key 存在
    getUserKey();

    // 注入样式
    injectStyles();

    // 构建面板
    buildPanel(topicId);

    // 加载评论
    try {
      const data = await apiRequest('GET', `/api/comments?topic_id=${topicId}`);
      renderComments(data.comments);
      document.getElementById('v2ex-ext-count').textContent = data.total;
    } catch (err) {
      const commentsEl = document.getElementById('v2ex-ext-comments');
      commentsEl.innerHTML = `<div class="v2ex-ext-error" style="padding:12px;text-align:center;">加载失败: ${err.error || '网络错误'}</div>`;
    }
  }

  main();
})();
