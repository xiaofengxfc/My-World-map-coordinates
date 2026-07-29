# 我的世界坐标记录

极简的 Minecraft 坐标管理工具，支持多维度坐标的添加、编辑、删除、搜索与排序。

## 技术栈

| 层 | 技术 |
|------|------|
| **前端** | Vue 3 + Vite |
| **样式** | 极简主义纯 CSS |
| **后端** | Cloudflare Workers |
| **数据库** | Cloudflare D1 (SQLite) |
| **部署** | 单一 Worker（托管前端 + API） |

## 项目结构

```
├── index.html              # Vite 入口
├── vite.config.js           # Vite 配置（dev proxy → Worker）
├── wrangler.toml           # Worker 配置（D1 + assets）
├── public/
│   └── _headers             # 安全响应头
├── src/
│   ├── main.js              # Vue 挂载
│   ├── App.vue              # 根组件
│   ├── assets/style.css     # 全局样式
│   ├── components/
│   │   ├── CoordList.vue    # 坐标卡片列表
│   │   └── CoordForm.vue    # 添加/编辑模态框
│   └── composables/
│       ├── useCoords.js     # 坐标状态管理（API 调用）
│       └── useToast.js      # Toast 通知
├── worker/
│   ├── index.js             # Worker API（/api/* → D1）
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

**关键要点**：
- 前端静态文件由 **wrangler assets** 托管（通过 `wrangler.jsonc` 的 `assets` 配置）
- SPA 路由回退由 wrangler 内置处理（`not_found_handling: "single-page-application"`）
- Worker **仅处理 `/api/*`** 路由，代码更精简
- 无需 `_redirects` 文件，无需 `@cloudflare/kv-asset-handler` 依赖

## 本地开发

### 1. 配置 Worker proxy

修改 `vite.config.js`，将 proxy target 指向你的线上 Worker：

```js
server: {
  proxy: {
    '/api': {
      target: 'https://mc-coords.xxx.workers.dev',
      changeOrigin: true,
    },
  },
}
```

### 2. 启动前端

```bash
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，`/api/*` 请求自动转发到线上 Worker。

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
binding = "DB"
database_name = "mc-coords"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. 配置 wrangler.toml

将 `database_id` 填入根目录的 `wrangler.toml`：

```toml
# wrangler.toml（项目根目录）
name = "my-world-map-coordinates"
main = "worker/index.js"
compatibility_date = "2025-04-01"

# 静态文件托管（含 SPA 回退）
assets = { directory = "./dist", not_found_handling = "single-page-application" }

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "mc-coords"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. 初始化表结构

```bash
cd worker

# 方式 A：命令行
npx.cmd wrangler d1 execute mc-coords --file schema.sql

# 方式 B：D1 控制台粘贴 SQL
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

### 4. 构建 + 部署

```bash
# 构建前端并部署 Worker（从项目根目录运行）
npm run build
npx.cmd wrangler deploy
```

> 首次部署时 wrangler 会自动创建 `wrangler.jsonc`，配置 Vite 框架预设和 SPA 回退。部署成功后访问输出的 Worker 域名即可。

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
