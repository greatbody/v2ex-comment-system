# V2EX 外挂评论系统

在 V2EX 帖子页面左侧显示独立评论系统。数据存储在 Cloudflare D1，通过油猴脚本在浏览器端执行。

## 项目结构

```
v2ex-comment-system/
├── worker/                  # Cloudflare Worker (后端 API)
│   ├── src/index.js         # Worker 主逻辑
│   ├── schema.sql           # D1 数据库建表语句
│   ├── wrangler.toml        # Wrangler 部署配置
│   └── package.json
├── userscript/              # 油猴脚本 (前端)
│   └── v2ex-comment.user.js
└── README.md
```

## 部署步骤

### 1. 部署 Cloudflare Worker

```bash
cd worker
npm install

# 创建 D1 数据库
wrangler d1 create v2ex-comments

# 将输出的 database_id 填入 wrangler.toml

# 初始化数据库表
npm run db:init

# 本地开发
npm run dev

# 部署到 Cloudflare
npm run deploy
```

部署成功后会得到 Worker URL，形如 `https://v2ex-comment-worker.<subdomain>.workers.dev`。

### 2. 安装油猴脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 `userscript/v2ex-comment.user.js`
3. 将文件中 `API_BASE` 的值修改为你的 Worker URL
4. 在 Tampermonkey 中新建脚本，粘贴内容并保存
5. 打开任意 V2EX 帖子页面，左侧会出现评论面板

## 功能特性

- **独立评论系统**：不依赖 V2EX 账号，可匿名评论
- **浏览器指纹身份**：基于浏览器指纹 + GUID 生成 MD5 作为用户唯一标识
- **身份导入/导出**：支持将身份 Key 导出为 JSON 文件，在其他浏览器导入
- **回复功能**：点击评论可回复
- **快捷键**：`Ctrl+Enter` 快速提交
- **折叠面板**：点击标题栏可折叠/展开

## 安全措施

| 层面 | 措施 |
|------|------|
| CORS | 严格限制 Origin，仅允许 `*.v2ex.com` 域名 |
| XSS | 服务端对所有输入做 HTML 实体转义 |
| 请求伪造 | user_key 在 Header 和 Body 双重校验 |
| 频率限制 | 每用户每分钟最多 5 条评论 |
| 请求体限制 | 最大 4KB |
| 输入校验 | topic_id 纯数字、user_key 32位hex、内容最长2000字 |
| IP 隐私 | 仅存储 IP 的 SHA-256 哈希，不存原始 IP |
| 安全头 | `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY` |

## 用户身份管理

首次使用时，脚本会自动采集浏览器指纹（Canvas、WebGL、屏幕分辨率、时区等）并结合随机 GUID 生成 MD5 哈希作为用户唯一 Key。

- **导出**：油猴菜单 → "导出身份 Key"，或面板底部"导出"按钮
- **导入**：油猴菜单 → "导入身份 Key"，或面板底部"导入"按钮

## API 文档

### GET /api/comments

查询帖子评论。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic_id | string | 是 | V2EX 帖子 ID |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 50，最大 50 |

### POST /api/comments

发表评论。

```json
{
  "topic_id": "1120000",
  "user_key": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  "nickname": "匿名用户",
  "content": "评论内容",
  "parent_id": null
}
```

Header 需携带 `X-User-Key` 与 body 中的 `user_key` 一致。

### GET /api/health

健康检查端点。
