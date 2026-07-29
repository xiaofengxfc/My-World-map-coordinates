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

将输出的 `database_id` 填入 `worker/wrangler.toml`。

```bash
# 初始化表结构
npx wrangler d1 execute mc-coords --file=schema.sql
```

### 2. 部署 Worker API

```bash
cd worker
npx wrangler deploy
```

### 3. 部署 Pages 前端

**方式一：连接 Git 仓库**

在 Cloudflare Pages 控制台添加项目，配置：

| 配置 | 值 |
|------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 环境变量 | `VITE_API_URL` = Worker 域名 |

**方式二：上传 dist 目录**

```bash
npm run build
# 将 dist/ 目录上传到 Cloudflare Pages
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
