-- D1 数据库表结构
-- 部署前需执行: npx wrangler d1 execute mc-coords --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK(dimension IN ('overworld', 'nether', 'end')),
  x REAL NOT NULL,
  y REAL NOT NULL DEFAULT 64,
  z REAL NOT NULL,
  description TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_dimension ON locations(dimension);
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at);
