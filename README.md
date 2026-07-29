# 我的世界坐标记录

极简的 Minecraft 坐标管理工具，支持多维度坐标的添加、编辑、删除、搜索与排序。

## 技术栈

| 层 | 技术 |
|------|------|
| **前端** | Vue 3 + Vite |
| **样式** | 极简主义纯 CSS（无 UI 框架） |
| **API** | Cloudflare Workers |
| **数据库** | Cloudflare D1 (SQLite) |
| **部署** | Cloudflare Pages + Workers |

## 项目结构

```
├── index.html                    # 入口
├── vite.config.js                # Vite 配置（含 /api → Worker 代理）
├── public/
│   ├── _headers                  # 安全响应头
│   └── _redirects                # SPA 路由回退
├── functions/
│   └── api/
│       └── [[path]].js           # Pages Functions 代理 → Worker
├── src/
│   ├── main.js                   # Vue 挂载
│   ├── App.vue                   # 根组件
│   ├── assets/style.css          # 全局样式
│   ├── components/
│   │   ├── CoordList.vue         # 坐标卡片列表
│   │   └── CoordForm.vue         # 添加/编辑模态框
│   └── composables/
│       ├── useCoords.js          # 坐标状态管理（API 调用）
│       └── useToast.js           # Toast 通知
├── worker/
│   ├── index.js                  # Workers API (CRUD)
│   ├── schema.sql                # D1 表结构
│   └── wrangler.toml             # Worker 配置
└── dist/                         # 构建产物
```

## 本地开发

```bash
npm install

# 终端 1：启动 Worker API（端口 8787）
cd worker
npx.cmd wrangler dev

# 终端 2：启动前端（端口 5173，自动代理 /api → localhost:8787）
npm run dev
```

## 部署

### 1. 创建 D1 数据库

```bash
cd worker
npx.cmd wrangler d1 create mc-coords
```

输出示例：

```
✅ Successfully created DB 'mc-coords' in region APAC

[[d1_databases]]
binding = "DB"                              # 代码中通过 env.DB 访问
database_name = "mc-coords"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 复制此 ID
```

将 `database_id` 填入 `worker/wrangler.toml`：

```toml
name = "mc-coords-api"
main = "index.js"
compatibility_date = "2025-04-01"

[[d1_databases]]
binding = "DB"              # 必须为 DB，与 Worker 代码一致
database_name = "mc-coords"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 替换
```

初始化表结构（二选一）：

```bash
# 方式 A：命令行
cd worker
npx.cmd wrangler d1 execute mc-coords --file schema.sql

# 方式 B：D1 控制台直接粘贴 SQL
```

```sql
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
```

### 2. 部署 Worker API

```bash
cd worker
npx.cmd wrangler deploy
```

记下输出的 Worker 域名（如 `https://mc-coords-api.xxxxx.workers.dev`）。

### 3. 部署 Pages 前端

在 Cloudflare Pages 控制台连接 Git 仓库：

1. **Framework preset** → 选择 **Vue**
2. 确认构建配置：

| 配置 | 值 |
|------|-----|
| Build command | `npm run build` |
| Build output directory | `dist` |

3. 添加 Pages Functions 环境变量（代理 `/api/*` 到 Worker）：

   进入 Pages 项目 → **Settings** → **Environment variables** → 添加：

   | 变量名 | 值 |
   |-------|-----|
   | `API_WORKER_URL` | `https://mc-coords-api.xxxxx.workers.dev` |

   > 此变量在 Pages Functions 运行时读取（`functions/api/[[path]].js`），**无需重建**。

> 前端始终请求同域的 `/api/*`，由 Pages Functions 代理转发到 Worker。**不需要设置 `VITE_API_URL`**。

## 数据模型

```json
{
  "id": "string",
  "name": "string",
  "dimension": "overworld | nether | end",
  "x": 0,
  "y": 64,
  "z": 0,
  "description": "",
  "created_at": 1718000000000,
  "updated_at": 1718000000000
}
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/locations` | 获取全部坐标（`?search=&dimension=&sort=`） |
| `GET` | `/api/locations/:id` | 获取单个坐标 |
| `POST` | `/api/locations` | 添加坐标 |
| `PUT` | `/api/locations/:id` | 更新坐标 |
| `DELETE` | `/api/locations/:id` | 删除坐标 |
