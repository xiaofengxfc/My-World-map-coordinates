# 我的世界坐标记录

极简的 Minecraft 坐标管理工具，支持主世界/下界/末地三维坐标录入、分类管理、文档链接。

## 技术栈

| 层 | 技术 |
|------|------|
| **前端** | Vue 3 + TypeScript + Vite |
| **样式** | 极简主义纯 CSS |
| **后端** | Cloudflare Workers |
| **数据库** | Cloudflare D1 (SQLite) |
| **部署** | 单一 Worker（托管前端 + API + 自动迁移） |

## 项目结构

```
├── index.html              # Vite 入口
├── vite.config.ts           # Vite 配置（dev proxy → Worker）
├── tsconfig.json            # TypeScript 配置
├── wrangler.toml           # Worker 配置（部署用：D1 + assets）
├── wrangler.dev.toml       # Worker 配置（本地开发用：本地 SQLite）
├── public/
│   └── _headers             # 安全响应头
├── src/
│   ├── main.ts              # Vue 挂载
│   ├── App.vue              # 根组件
│   ├── env.d.ts             # Vue SFC 类型声明
│   ├── types.ts             # 共享类型（Location, Category, LocationForm）
│   ├── assets/style.css     # 全局样式
│   ├── components/
│   │   ├── CoordList.vue    # 坐标卡片列表
│   │   └── CoordForm.vue    # 添加/编辑模态框
│   └── composables/
│       ├── useCoords.ts     # 坐标状态管理（API 调用）
│       └── useToast.ts      # Toast 通知
├── worker/
│   ├── index.js             # Worker API（/api/* → D1，含自动迁移）
│   └── schema.sql           # 表结构
├── dist/                    # 前端构建产物
└── package.json             # 前端依赖
```

## 架构

```
用户 → https://mc-coords.xxx.workers.dev
                  │
        wrangler assets（托管前端静态文件）
                  │
        非 /api/*  → 返回 index.html（SPA 回退）
        /api/*     → Worker → D1 数据库
```

## 数据模型

一个坐标记录包含主世界/下界/末地三组坐标 + 分类 + 文档链接：

```json
{
  "id": "string",
  "name": "string",
  "category": "未分类 | 自定义分类名",
  "overworld_x": null,
  "overworld_y": null,
  "overworld_z": null,
  "nether_x": null,
  "nether_y": null,
  "nether_z": null,
  "end_x": null,
  "end_y": null,
  "end_z": null,
  "description": "",
  "link_url": "",
  "link_title": "",
  "created_at": 1718000000000,
  "updated_at": 1718000000000
}
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/locations` | 获取全部坐标（`?search=&category=&sort=`） |
| `GET` | `/api/locations/:id` | 获取单个坐标 |
| `POST` | `/api/locations` | 添加坐标 |
| `PUT` | `/api/locations/:id` | 更新坐标 |
| `DELETE` | `/api/locations/:id` | 删除坐标 |
| `GET` | `/api/categories` | 获取分类列表（含坐标数） |
| `GET` | `/api/fetch-title?url=` | 获取网页标题 |

## 本地开发

### 1. 启动本地 Worker API

```bash
cd worker
npx.cmd wrangler dev --config ../wrangler.dev.toml
```

### 2. 初始化本地数据库

Worker 启动后，新开一个终端执行：

```bash
cd worker
npx.cmd wrangler d1 execute mc-coords --file schema.sql --local
```

如果之前已有旧数据需要重建：

```bash
# 先删旧表再建新表
npx.cmd wrangler d1 execute mc-coords --command "DROP TABLE IF EXISTS locations" --local
npx.cmd wrangler d1 execute mc-coords --file schema.sql --local
```

### 3. 启动前端

```bash
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，`/api/*` 通过 Vite proxy 转发到 Worker（`localhost:8787`）。

## 部署

### 1. 创建 D1 数据库

```bash
cd worker
npx.cmd wrangler d1 create mc-coords
```

输出示例：

```
[[d1_databases]]
binding = "DB"
database_name = "mc-coords"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. 配置 wrangler.toml

将 `database_id` 填入根目录的 `wrangler.toml`：

```toml
name = "my-world-map-coordinates"
main = "worker/index.js"
compatibility_date = "2025-04-01"

assets = { directory = "./dist", not_found_handling = "single-page-application" }

[[d1_databases]]
binding = "DB"
database_name = "mc-coords"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. 初始化表结构

**方式 A：命令行**

```bash
cd worker
npx.cmd wrangler d1 execute mc-coords --file schema.sql
```

如果旧表结构不匹配，先删后建：

```bash
npx.cmd wrangler d1 execute mc-coords --command "DROP TABLE IF EXISTS locations"
# 再执行建表
npx.cmd wrangler d1 execute mc-coords --file schema.sql
```

**方式 B：D1 控制台**

登录 Cloudflare Dashboard → Workers & Pages → D1 → 选择 `mc-coords` → Console，粘贴以下 SQL：

```sql
DROP TABLE IF EXISTS locations;

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  overworld_x REAL,
  overworld_y REAL,
  overworld_z REAL,
  nether_x REAL,
  nether_y REAL,
  nether_z REAL,
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
```

> ⚠️ `DROP TABLE` 会清空所有已有数据。如果有重要数据，在 D1 控制台先导出备份。

### 4. 构建 + 部署

```bash
npm run deploy
```

> 等效于 `npm run build && wrangler deploy`。wrangler 已预装在 `devDependencies` 中，无需 `npx`。

### 自动迁移机制

Worker 首次收到请求时会自动执行 `runMigrations()`，依次尝试执行 `ALTER TABLE ADD COLUMN`：

```js
const migrations = [
  "ALTER TABLE locations ADD COLUMN category TEXT DEFAULT ''",
  "ALTER TABLE locations ADD COLUMN overworld_x REAL",
  // ... 所有后续新增的字段
]
```

已存在的列会静默跳过，缺失的列自动补齐。因此旧表无需手动更新，部署新版 Worker 后首次请求即可完成迁移。
