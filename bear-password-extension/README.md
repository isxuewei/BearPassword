<p align="center">
  <img src="public/icons/logo.svg" alt="BearPassword" width="80" height="80" />
</p>

<h1 align="center">BearPassword 浏览器扩展</h1>

<p align="center">在网页上自动填充账号密码，并查看、复制两步验证码</p>

<p align="center">
  <a href="https://bear-password.xuewei.fun">官网下载</a> ·
  <a href="../README.md">返回项目首页</a>
</p>

---

## 你可以用它做什么

- **网站自动填充**：在登录页的账号/密码框旁显示 BearPassword 图标，点选即可填入
- **按网站匹配**：自动列出与当前页面相关的登录项，工具栏徽章显示可用数量
- **扩展弹窗管理**：搜索、填充、编辑、收藏、删除当前网站的条目
- **两步验证更方便**：
  - 弹窗中配置了 TOTP 的条目可查看实时验证码，点击即可复制
  - 网页填充列表中直接显示验证码；选择条目填充时，会**自动复制当前验证码**到剪贴板
- **快捷保存**：登录成功后提示是否将新账号保存到保险库
- **右键菜单**：在输入框中生成强密码

<p align="center">
  <img src="../bear-password-index/assets/screenshots/16自动填充.png" alt="网页自动填充" width="640" />
</p>

<p align="center">
  <img src="../bear-password-index/assets/screenshots/15插件端.png" alt="扩展弹窗" width="400" />
</p>

---

## 使用前准备

扩展需要配合 **BearPassword 桌面端** 使用：

1. 安装并登录 [桌面端](../bear-password-desktop/)
2. 解锁保险库（若启用了安全密钥，需在本机完成配置）
3. 在 Chrome 或 Edge 中安装本扩展
4. 保持桌面端在后台运行

若桌面端未运行或未解锁，扩展无法解密和填充加密条目。

---

## 安装扩展

**普通用户：** 从官网或应用商店获取安装包/链接。

**开发者本地加载：**

```bash
npm install
npm run dev
```

在浏览器打开 `chrome://extensions`，开启「开发者模式」，选择「加载已解压的扩展程序」，指向本项目的 `dist` 目录。

修改代码后请在扩展管理页点击「重新加载」，并刷新正在测试的网页。

---

## 构建发布

```bash
npm run build      # 生成 dist/
npm run package    # 构建并打包为 zip
```

---

## 配置说明（进阶）

| 环境 | 默认 API 地址 |
|------|----------------|
| 开发 | `http://127.0.0.1:8080` |
| 正式打包 | `https://bear-password.xuewei.fun` |

可通过环境变量 `VITE_SERVER_URL` 覆盖。账号需与桌面端一致。

---

## 技术概要

Manifest V3 · Vue 3 · TypeScript · Vite · CRXJS

---

## 许可证

MIT · 作者：薛伟同学
