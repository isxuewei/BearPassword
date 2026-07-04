# BearPassword 网页端

浏览器内打开即可管理 BearPassword 密码库，与桌面端、浏览器扩展完全独立。

## 技术栈

- Vue 3 + TypeScript + Pinia + Vue Router
- Element Plus + Vite + SCSS
- Web Crypto + IndexedDB（安全密钥与主密码设备级加密存储）

## 开发

```bash
cd bear-password-web
npm install
npm run dev
```

开发服务器默认 `http://127.0.0.1:5173/app/`，API 通过 Vite 代理到 `http://127.0.0.1:8080/api`。

可通过环境变量指定后端：

```bash
VITE_SERVER_URL=http://127.0.0.1:8080 npm run dev
```

## 构建

```bash
npm run build
```

产物输出到 `dist/`，部署到与后端同域的 `/app/` 路径。

## 部署（Nginx 示例）

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:8080/api/;
}

location /app/ {
  alias /var/www/bear-password-web/;
  try_files $uri $uri/ /app/index.html;
}
```

## 功能说明

### 保留

- 登录 / 注册 / MFA / Emergency Kit
- 密码库 CRUD、收藏、最近访问、Dashboard
- 锁屏、自动锁定、剪贴板清空
- 设置：账户、安全、外观、关于
- 移动端底部 Tab 导航 + 密码库栈式详情

### 不包含（桌面专属）

- 系统托盘、快捷键、生物识别、离线保险库
- 浏览器扩展桥接、CSV 导入

## 安全存储

- **账户安全密钥**：AES-GCM 加密后存入 IndexedDB
- **主密码（可选）**：开启「在此浏览器记住主密码」后同样加密存储
- 清除浏览器站点数据会导致密钥丢失，请务必保存 Emergency Kit
