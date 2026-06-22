# BearPassword

简洁、安全、专业的密码管理工具，包含**桌面端**、**浏览器扩展**与**可自建后端**。保险库数据在客户端加密后再同步到服务器。

**官网：** https://bear-password.xuewei.fun

---

## 产品概览

BearPassword 帮助你在网站与应用中安全地保存和使用凭据：

| 模块 | 说明 |
|------|------|
| **桌面端**（`bear-password-desktop`） | Electron 应用 — 保险库管理、TOTP、主题、自动锁定、更新 |
| **浏览器扩展**（`bear-password-extension`） | Chrome / Edge MV3 — 自动填充、内联选择器、弹窗内 2FA |
| **服务端**（`bear-password-server`） | Spring Boot API — 账号、加密保险库同步、版本发布 |
| **官网**（`bear-password-index`） | 产品介绍与下载页 |

扩展通过本地桥接（`127.0.0.1:6892`）连接已解锁的桌面端，凭据不必只存在于浏览器中。

---

## 功能特性

### 桌面端

- **条目类型：** 登录信息、安全备注、身份信息、银行卡、服务器、数据库、独立两步验证条目、自定义
- **登录扩展字段：**「添加更多」支持 URL、电子邮件、地址、日期、电话、密码、**两步验证（TOTP）**、自定义
- **2FA / TOTP：** 密钥输入、二维码上传、剪贴板粘贴、实时验证码与倒计时
- **安全能力：** SRP 认证、可选安全密钥、客户端加密、自动锁定、剪贴板定时清空
- **体验：** 收藏夹、最近访问、标签、搜索、多主题（浅色 / 深色 / 跟随系统）、中 / 英 / 日界面
- **平台：** macOS 与 Windows 安装包、应用内更新、系统托盘

### 浏览器扩展

- **自动填充：** 登录框旁显示图标；按当前网站匹配的内联选择器
- **扩展弹窗：** 搜索、填充、编辑、收藏、删除当前站点相关条目
- **扩展内 2FA：**
  - 配置了 TOTP 的条目显示盾牌按钮 — 悬停查看验证码，点击复制
  - 网页填充弹层直接显示实时验证码；选择条目填充时**自动复制当前 TOTP**
- **其他：** 快捷保存新登录项、右键菜单生成密码、通过协议链接触发桌面端

### 服务端（可选自建）

- 与桌面端 `ApiResponse` 格式一致的 REST API
- 用户认证（SRP）、账号 MFA/TOTP、保险库 CRUD、收藏、公告、版本与更新接口
- MySQL 8 + Spring Boot 3 + MyBatis Plus

---

## 仓库结构

```
bear-password/
├── bear-password-desktop/     # Electron + Vue 3 桌面端
├── bear-password-extension/   # Chrome / Edge 扩展（Manifest V3）
├── bear-password-server/      # Java Spring Boot 后端
├── bear-password-index/       # 官网静态站
└── README.md
```

各子项目文档：

- [桌面端 README](bear-password-desktop/README.md)
- [扩展 README](bear-password-extension/README.md)
- [服务端 README](bear-password-server/README.md)

---

## 快速上手（用户）

1. 从[官网](https://bear-password.xuewei.fun)下载并安装桌面端。
2. 注册账号并解锁保险库（可按需配置安全密钥）。
3. 安装浏览器扩展（应用商店或解压加载发布包）。
4. 使用网页自动填充时，保持桌面端**运行且保险库已解锁**。

> 扩展通过桌面桥接解密条目。若桌面端未运行或未解锁，加密条目无法填充。

---

## 开发指南

### 环境要求

- **Node.js** ≥ 18，**npm** ≥ 9
- **Java** 17、**Maven**（服务端）
- **MySQL** 8（服务端）

### 1. 启动后端

```bash
cd bear-password-server
mysql -u root -p < sql/init.sql
# 编辑 src/main/resources/application-dev.yml（数据库账号密码）
mvn spring-boot:run
```

API 地址：`http://127.0.0.1:8080/api`

### 2. 启动桌面端

```bash
cd bear-password-desktop
npm install
npm run dev
```

开发环境默认 API：`http://127.0.0.1:8080`

```bash
npm run build:mac    # macOS 安装包
npm run build:win    # Windows 安装包 + 便携版
npm run typecheck
```

### 3. 启动扩展

```bash
cd bear-password-extension
npm install
npm run dev
```

在 `chrome://extensions` 开启开发者模式，加载 `dist` 目录。

```bash
npm run build      # 生产构建
npm run package    # 构建并打包 zip
```

修改代码后请重新加载扩展并刷新网页。自动填充依赖桌面端桥接，需同时运行桌面应用。

---

## 安全模型（摘要）

- **传输：** 生产环境 HTTPS；扩展桥接仅监听本机回环地址
- **认证：** SRP 登录，主密码不以明文上传
- **保险库：** 客户端加密后存储密文；密钥由主密码与可选安全密钥派生
- **扩展：** 不独立解锁保险库 — 依赖桌面端 `127.0.0.1:6892` 桥接
- **2FA：** TOTP 密钥保存在加密内容中；验证码在本地生成（`otpauth`）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面端 | Electron、Vue 3、TypeScript、Pinia、Element Plus、Vite、SCSS |
| 扩展 | Vue 3、Pinia、TypeScript、Vite、CRXJS、Manifest V3 |
| 服务端 | Java 17、Spring Boot 3、MyBatis Plus、MySQL、Druid |
| 加密 / 认证 | SRP（`tssrp6a`）、客户端内容加密、TOTP（`otpauth`） |

---

## 许可证

MIT — 详见各子包元数据。  
作者：薛伟同学
