-- 三维坐标记录：一个条目包含主世界/下界/末地坐标

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',

  -- 主世界
  overworld_x REAL,
  overworld_y REAL,
  overworld_z REAL,

  -- 下界
  nether_x REAL,
  nether_y REAL,
  nether_z REAL,

  -- 末地
  end_x REAL,
  end_y REAL,
  end_z REAL,

  description TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  link_title TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at);
