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
├── index.html              # 入口
├── vite.config.js           # Vite 配置（含 /api → Worker 代理）
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
│   ├── index.js             # Workers API (CRUD)
│   ├── schema.sql           # D1 表结构
│   └── wrangler.toml        # Worker 配置
└── dist/                    # 构建产物
```

## 本地开发

```bash
# 安装前端依赖
npm install

# 1. 启动 Worker API（终端 1）
cd worker
npx wrangler dev

# 2. 启动前端（终端 2，自动代理 /api → localhost:8787）
npm run dev
```

前端默认运行在 `http://localhost:5173`，API 请求通过 Vite proxy 转发到 Worker。

## 部署

### 1. 创建 D1 数据库

```bash
cd worker
npx wrangler d1 create mc-coords
```

输出示例：
```
✅ Successfully created DB 'mc-coords' in region APAC
Created your new D1 database.

[[d1_databases]]
binding = "DB"      # ← 固定为 DB，与 Worker 代码中的 env.DB 对应
database_name = "mc-coords"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 复制此 ID
```

将输出的 `database_id` 填入 `worker/wrangler.toml`：

```toml
# worker/wrangler.toml
name = "mc-coords-api"
main = "index.js"
compatibility_date = "2025-04-01"

[[d1_databases]]
binding = "DB"              # 环境变量名，代码中用 env.DB 访问
database_name = "mc-coords"  # 数据库名称
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 替换为实际 ID
```

> **`binding` 必须为 `"DB"`**，因为 Worker 代码（`worker/index.js`）中通过 `env.DB` 访问数据库。如果修改 binding，需同步修改代码中的变量名。

初始化表结构：

```bash
cd worker
npx.cmd wrangler d1 execute mc-coords --file schema.sql
```

如果使用 Cloudflare Dashboard 的 D1 控制台，直接粘贴以下 SQL 执行：

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
npx wrangler deploy
```

### 3. 部署 Pages 前端

**方式一：连接 Git 仓库**

在 Cloudflare Pages 控制台添加项目：

1. **Framework preset** 选择 **Vue**（自动填写构建命令和输出目录）
2. 确认构建配置：

| 配置 | 值 |
|------|-----|
| Build command | `npm run build` |
| Build output directory | `dist` |

3. **添加 D1 数据库绑定**（关键步骤，否则 Worker 无法访问数据库）：

   进入 Pages 项目 → **Settings** → **Functions** → **D1 database bindings**：

   | 字段 | 值 |
   |------|-----|
   | **Variable name** | `DB` |
   | **D1 database** | 选择 `mc-coords` |

   > `Variable name` 必须为 `DB`，与 `worker/wrangler.toml` 中的 `binding = "DB"` 一致，Worker 代码通过 `env.DB` 访问数据库。

4. 添加环境变量：

   进入 Pages 项目 → **Settings** → **Environment variables**：

   | 变量名 | 值 |
   |-------|-----|
   | `VITE_API_URL` | Worker 域名（如 `https://mc-coords-api.xxxxx.workers.dev`） |

**方式二：上传 dist 目录**

```bash
npm run build
# 将 dist/ 目录上传到 Cloudflare Pages
# 仍需按方式一第 3、4 步配置 D1 binding 和环境变量
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/locations` | 获取全部坐标（支持 `?search=&dimension=&sort=`） |
| `GET` | `/api/locations/:id` | 获取单个坐标 |
| `POST` | `/api/locations` | 添加坐标 |
| `PUT` | `/api/locations/:id` | 更新坐标 |
| `DELETE` | `/api/locations/:id` | 删除坐标 |

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
