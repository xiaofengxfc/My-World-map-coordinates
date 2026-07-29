-- 分类系统 - 替代预设维度
-- category 为自定义分类，可为空（默认未分类）

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  x REAL NOT NULL,
  y REAL NOT NULL DEFAULT 64,
  z REAL NOT NULL,
  description TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at);
