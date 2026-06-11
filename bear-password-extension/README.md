# BearPassword 浏览器扩展

模仿 1Password 浏览器插件体验的 BearPassword 扩展，对接 `bear-password-server` 后端，与桌面端共享保险库数据。

## 功能

- **自动填充**：在登录页密码框旁显示填充图标，一键填入用户名与密码
- **网站匹配**：根据条目关联网站自动匹配当前页面，工具栏徽章显示可用条目数
- **保险库弹窗**：搜索、浏览、复制、填充登录条目
- **保存提示**：提交登录表单后提示保存新凭据到保险库
- **右键菜单**：在输入框中生成强密码或使用 BearPassword 填充
- **安全密钥**：与桌面端相同的客户端加解密，解锁后方可查看明文

## 开发

```bash
cd bear-password-extension
npm install
npm run dev
```

开发模式下在 Chrome 打开 `chrome://extensions`，开启「开发者模式」，点击「加载已解压的扩展程序」，选择 `dist` 目录（`npm run dev` 会自动构建并监听变更）。

## 构建

```bash
npm run build
```

产物在 `dist/`，可打包发布到 Chrome Web Store 或 Edge 加载。

## 配置

- 开发默认服务器：`http://127.0.0.1:8080`（`.env`）
- 打包默认服务器：`https://bear-password.xuewei.fun`（`.env.production`，与桌面端一致）
- 可通过环境变量 `VITE_SERVER_URL` 覆盖默认值
- 登录时需使用与 BearPassword 桌面端相同的账号与安全密钥

## 技术栈

- Manifest V3
- Vue 3 + Pinia + TypeScript
- Vite + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)

## 目录结构

```
src/
  background/     Service Worker：会话、徽章、消息路由
  content/        内容脚本：表单检测、自动填充、保存横幅
  popup/          扩展弹窗 UI
  shared/         API、加解密、类型、工具
```
