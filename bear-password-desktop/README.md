# BearPassword Desktop

简洁、安全、专业的桌面密码管理工具（MVP 骨架版本）。

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron | 桌面应用运行时 |
| Vite | 构建工具 |
| Vue 3 | 前端框架 |
| TypeScript | 类型安全 |
| Pinia | 状态管理 |
| Vue Router | 路由 |
| Axios | HTTP 请求（已封装，预留 API 对接） |
| Element Plus | UI 组件库 |
| SCSS | 样式预处理 |

## 目录结构

```
bear-password-desktop/
├── electron/                  # Electron 主进程 & 预加载脚本
│   ├── main/index.ts          # 主进程：窗口创建、IPC
│   └── preload/index.ts       # 预加载：安全暴露 windowApi
├── src/
│   ├── api/                   # API 层（按业务模块拆分）
│   ├── assets/                # 静态资源
│   ├── components/            # 可复用组件
│   │   ├── common/            # 通用组件（Logo、导航）
│   │   ├── dashboard/         # 仪表盘组件
│   │   └── window/            # 窗口控制组件
│   ├── layouts/               # 页面布局
│   ├── locales/               # 国际化预留
│   ├── router/                # 路由配置
│   ├── stores/                # Pinia 状态管理
│   ├── styles/                # 全局样式 & 设计令牌
│   ├── types/                 # TypeScript 类型定义
│   ├── utils/                 # 工具函数（Axios 封装、存储）
│   └── views/                 # 页面视图
├── index.html
├── electron.vite.config.ts
├── package.json
└── tsconfig.json
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后会自动打开 Electron 窗口，支持热更新。

### 构建打包

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

## 功能说明

### 登录页

- 输入任意非空用户名和密码即可登录（Mock 逻辑）
- 登录态通过 Pinia + localStorage 持久化

### 主界面

- 左侧导航：Dashboard / 密码库 / 收藏夹 / 最近访问 / 设置
- 自定义窗口标题栏（最小化 / 最大化 / 关闭）
- macOS 保留原生交通灯，Windows 显示自定义按钮

### Dashboard

- 展示总密码数、收藏数、最近访问数（模拟数据）

## 架构设计要点

1. **API 层独立** — `src/api/` 按模块拆分，Mock 与真实接口切换只需修改 API 文件
2. **Axios 二次封装** — `src/utils/request.ts` 统一 Token 注入和错误处理
3. **类型统一管理** — `src/types/` 集中定义接口类型
4. **主题可扩展** — `data-theme` 属性 + SCSS 变量，已预留浅色主题
5. **国际化可扩展** — `src/locales/` 预留文案字典结构

## 后续开发路线

- [ ] 对接 REST API 后端
- [ ] 密码库 CRUD 功能
- [ ] 密码生成器
- [ ] 自动锁定
- [ ] 浅色主题切换
- [ ] vue-i18n 国际化
- [ ] electron-builder 打包发布
