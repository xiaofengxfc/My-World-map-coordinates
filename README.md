# 🧊 我的世界坐标记录

一个美观、功能完整的 Minecraft 坐标记录工具。支持网页版和 PWA 应用。

## ✨ 功能

- **📍 坐标管理** — 添加、编辑、删除坐标点
- **🌍 多世界支持** — 管理多个世界/存档
- **🔥 下界 ↔ 主世界转换** — 自动计算 8:1 对应坐标
- **🏷️ 分类标签** — 用颜色和图标分类（家、矿洞、遗迹等）
- **🔍 搜索与筛选** — 按世界、维度、分类搜索
- **📤/📥 导入导出** — JSON/CSV 格式备份与恢复
- **📱 PWA 支持** — 可安装到手机或电脑桌面
- **🎨 暗色 Minecraft 风格 UI** — 卡片/列表/地图三种视图
- **💾 本地存储** — 数据保存在浏览器中，无需服务器

## 📁 项目结构

```
web/
├── index.html              # 主页面
├── manifest.json            # PWA 清单
├── sw.js                    # Service Worker (离线支持)
├── _headers                 # Cloudflare Pages 响应头
├── _redirects               # Cloudflare Pages 重定向
├── css/
│   └── style.css            # 样式表
├── js/
│   ├── utils.js             # 工具函数
│   ├── data.js              # 数据管理模块
│   └── app.js               # 应用主逻辑
├── icons/
│   ├── favicon.svg          # 网站图标
│   ├── icon-192.svg         # PWA 图标 192x192
│   └── icon-512.svg         # PWA 图标 512x512
└── tools/
    └── generate-icons.html  # PNG 图标生成工具
```

## 🚀 部署到 Cloudflare Pages

### 方法一：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 页面
3. 点击 **创建项目** → **连接到 Git**
4. 选择你的 Git 仓库
5. 构建配置：
   - **项目目录**: `web`
   - **构建命令**: 留空（纯静态）
   - **构建输出目录**: `web`
6. 点击 **保存并部署**

### 方法二：通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
cd web
wrangler pages deploy . --project-name=mc-coords
```

### 方法三：直接上传文件夹

1. 进入 Cloudflare Dashboard → **Pages**
2. 点击 **创建项目** → **上传文件夹**
3. 选择 `web` 目录上传
4. 部署完成

## 📱 本地使用

直接在浏览器打开 `web/index.html` 即可使用。所有数据存储在浏览器的 localStorage 中。

## 🖼️ 生成 PNG 图标 (可选)

为了让 PWA 在 iOS 上更好地支持，建议生成 PNG 图标：

1. 在浏览器打开 `web/tools/generate-icons.html`
2. 分别点击下载 192x192 和 512x512 的 PNG
3. 将文件放到 `web/icons/` 目录
4. 在 `index.html` 中将 `<link rel="apple-touch-icon">` 指向 PNG 文件

## 🔧 技术栈

- 纯原生 HTML/CSS/JavaScript — 零依赖
- PWA (Service Worker + Manifest)
- localStorage 数据持久化
- Cloudflare Pages 托管
