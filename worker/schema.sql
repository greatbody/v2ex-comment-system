-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id TEXT NOT NULL,
  user_key TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '匿名用户',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_hash TEXT,
  parent_id INTEGER DEFAULT NULL,
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);

-- 索引：按帖子查询评论
CREATE INDEX IF NOT EXISTS idx_comments_topic ON comments(topic_id, created_at);

-- 索引：按用户查询
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_key);

-- 频率限制表
CREATE TABLE IF NOT EXISTS rate_limits (
  user_key TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  PRIMARY KEY (user_key, action, timestamp)
);

-- 清理过期的频率限制记录
CREATE INDEX IF NOT EXISTS idx_rate_limits_ts ON rate_limits(timestamp);
