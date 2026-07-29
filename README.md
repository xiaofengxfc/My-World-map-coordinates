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
├── public/
│   ├── _headers             # 安全响应头
│   └── _redirects           # SPA 路由回退
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
│   ├── index.js             # Worker 入口（前端托管 + API）
│   ├── schema.sql           # D1 表结构
│   ├── wrangler.toml        # Worker 配置
│   └── package.json         # Worker 依赖
├── dist/                    # 前端构建产物
└── package.json             # 前端依赖
```

## 架构

```
用户 → https://mc-coords.xxx.workers.dev
                  │
            Worker 路由
              ├── /api/*   → API 处理（D1 数据库）
              └── 其他路径  → 返回前端静态文件（dist/）
```

**单一 Worker 同时承担**：
- 托管前端页面和静态资源（通过 Workers Sites）
- 提供 RESTful API（连接 D1 数据库）

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

将 `database_id` 填入 `worker/wrangler.toml`：

```toml
name = "mc-coords"
main = "index.js"
compatibility_date = "2025-04-01"

[site]
bucket = "../dist"

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

### 4. 构建前端 + 部署 Worker

```bash
# 构建前端
npm run build

# 部署 Worker（自动上传 dist/ 中的静态文件）
cd worker
npx.cmd wrangler deploy
```

部署成功后访问输出的 Worker 域名即可。

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
