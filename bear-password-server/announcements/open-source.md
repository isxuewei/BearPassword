先说一句感谢。

BearPassword 上线以来，已有 **300 多位用户** 完成注册、下载桌面端、安装浏览器扩展，把日常登录账号交给我来保管。对一个独立开发者来说，这不是一个小数字——它意味着 300 多次「愿意试试」的信任。

今天，我想用另一种方式回应这份信任： **BearPassword 全部代码，正式开源。**

包括 **服务端、桌面端、浏览器扩展、官网** 在内的完整产品代码，已在 GitHub 公开，采用 **MIT 协议**。你可以阅读、审计、二次开发，也可以 **完全私有化部署**，不依赖我提供的任何云服务。

- 官网：[https://bear-password.xuewei.fun](https://bear-password.xuewei.fun)
- GitHub：[https://github.com/isxuewei](https://github.com/isxuewei)

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/4%E9%A6%96%E9%A1%B5.png)

## 为什么要开源？

密码管理器这类产品，有一个绕不开的问题：**你怎么证明，开发者没有在暗处留后门？**

口头承诺「绝对安全」是不够的。对密码工具来说，**可验证，比可宣传更重要**。我选择开源，主要基于以下几点：

**1. 密码工具的安全，必须经得起检验**

BearPassword 采用 SRP 零知识登录、客户端加密、双密钥保险库——这些设计写在官网和文档里是一回事，**代码公开则是另一回事**。任何人都可以 clone 仓库、对照加密流程、检查网络请求，确认登录密码和主密码确实不出设备，服务端只存密文。

**2. 把「信任开发者」变成「信任代码」**

闭源产品里，用户只能相信「作者说没有后门」。开源之后，安全研究员、开发者、甚至普通用户都可以自行审计。**如果你不放心我的服务器，完全可以 fork 代码、自建后端、改客户端指向自己的域名**——这才是密码工具该有的自由度。

**3. 独立开发者的回馈方式**

BearPassword 是我用 AI 协作（Vibe Coding）从 0 到 1 做出来的第一个完整产品。300 多位用户愿意用，我已经很感激。开源是我能给出的、最实在的一种回馈：**不藏代码、不锁生态、不制造信息差**。

**4. 邀请社区共建**

密码管理是长期工程——新平台适配、安全加固、翻译完善、Bug 修复，一个人做不过来。开源后，欢迎 Issue、PR、安全报告。产品会因此走得更好，用户也会因此用得更安心。

**5. 私有化部署，是企业与极客的刚需**

有些团队、有些用户就是不想把数据放在别人的服务器上。开源 + 服务端可自建，让 BearPassword 不只是一款「用我的云」的产品，也可以变成 **完全掌控在自己手里的密码基础设施**。


## BearPassword 是什么？

一句话：**简洁、安全、专业的零知识密码管理工具。**

它不是「只有一个浏览器插件的小工具」，而是一套完整方案：

| 组件                            | 作用                                             |
| ------------------------------- | ------------------------------------------------ |
| **桌面端**（macOS / Windows）   | 保险库管理中枢：加密、解密、搜索、设置、系统托盘 |
| **浏览器扩展**（Chrome / Edge） | 网页场景：自动填充、保存新账号、查看 TOTP        |
| **服务端**                      | 账号认证、密文同步、版本更新、公告分发           |
| **官网**                        | 产品介绍、下载分发、安全架构说明                 |

桌面端与扩展 **深度联动**：扩展通过本机安全桥接与桌面通信，**仅在桌面端已解锁时** 才能填充或保存——浏览器里不会单独保存你的主密码，也不会在桌面未解锁时暴露明文。

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/16%E8%87%AA%E5%8A%A8%E5%A1%AB%E5%85%85.png)


<p align="center"><em>桌面端解锁后，扩展在网页登录页一键填充账号密码</em></p>


## 安全架构：多层防护，密钥不出设备

官网「安全架构」板块有完整说明，核心要点如下：

| 层级 | 机制          | 说明                                                    |
| ---- | ------------- | ------------------------------------------------------- |
| 登录 | SRP 零知识    | RFC 5054 SRP-6a（2048-bit + SHA-512），登录密码从不上传 |
| 认证 | TOTP 二次验证 | 绑定 Google Authenticator 等，6 位动态码防撞库          |
| 加密 | 双密钥保险库  | 主密码 + 128 位账户密钥共同派生 VUK，缺一无法解密       |
| 备份 | Emergency Kit | 注册时生成含账户密钥的备份文件，新设备凭 Kit 恢复       |
| 防护 | 自动锁定      | 闲置超时 / 快捷键立即锁定，清除内存密钥与解密缓存       |
| 防护 | 剪贴板清除    | 复制密码后 30 秒～2 分钟自动清空                        |
| 联动 | 扩展依赖桌面  | 桌面未解锁 = 扩展无法解密填充                           |

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/2Emergency%20Kit.png)


<p align="center"><em>注册时生成 Emergency Kit，账户密钥可下载并邮件备份——新设备登录的救命绳</em></p>

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/10%E5%AE%89%E5%85%A8%E8%AE%BE%E7%BD%AE.png)

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/11%E5%AE%89%E5%85%A8%E8%AE%BE%E7%BD%AE.png)


<p align="center"><em>自动锁定、剪贴板清除、TOTP 二次验证、账户密钥管理——安全设置一页掌控</em></p>

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/14%E7%94%9F%E7%89%A9%E8%A7%A3%E9%94%81.png)


<p align="center"><em>macOS Touch ID / Windows Hello 快捷解锁——生物信息不替代主密码，仅唤起已保存凭据</em></p>

**即使服务端被攻破，攻击者也只能拿到无法解密的密文。**


## 桌面端：完整功能一览

BearPassword Desktop 是基于 Electron 的跨平台应用（macOS Apple Silicon + Windows x64），是整套方案的 **安全中枢**。

### 仪表盘与密码库

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/4%E9%A6%96%E9%A1%B5.png)


<p align="center"><em>首页仪表盘：密码统计、快捷操作、版本更新提醒</em></p>

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/5%E5%AF%86%E7%A0%81%E5%BA%93.png)


<p align="center"><em>密码库：搜索、标签、收藏、按类型筛选，快速找到所需条目</em></p>

### 8 种条目类型 + 丰富扩展字段

支持 **登录信息、安全备注、身份标识、银行卡、服务器、数据库、两步验证（2FA）、自定义** 八种类型。登录条目可通过「添加更多」补充 URL、邮箱、地址、电话、备用密码、两步验证等字段。

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/6%E6%96%B0%E5%A2%9E%E5%AF%86%E7%A0%81.png)


<p align="center"><em>新增条目：类型丰富、字段可扩展，TOTP 支持扫码或粘贴密钥导入</em></p>

**两步验证（TOTP）亮点：**

- 条目详情页 **实时显示 6 位验证码与倒计时**
- 一键复制验证码（复制后提示剪贴板定时清除）

### 浏览器密码导入

支持从 Chrome、Edge、Firefox、Safari 及通用 CSV 格式 **一键导入** 已有密码，迁移零门槛。

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/7%E6%B5%8F%E8%A7%88%E5%99%A8%E5%AF%BC%E5%85%A5.png)


<p align="center"><em>从浏览器导出的 CSV 直接导入，告别手动逐条录入</em></p>

### 系统级体验

- **生物识别快捷解锁**：Touch ID / Windows Hello
- **自动锁定** + **剪贴板定时清除**
- **全局快捷键**：快速打开/隐藏、立即锁定
- **系统托盘 / 菜单栏常驻**：关闭窗口后仍可快速访问
- **登录时自动启动**、**Dock 图标隐藏**（macOS）
- **Dynamic Island 式悬浮搜索**（Island）：屏幕边缘快捷搜索、复制密码
- **离线模式**：密码库数据仅从本地目录读写，不再请求服务器

### 外观与国际化

**13 款预设主题 + 跟随系统**，多款界面字体，**中文 / English / 日本語** 三语界面。

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/12%E5%A4%96%E8%A7%82%E8%AE%BE%E7%BD%AE.png)


<p align="center"><em>十余款浅色与深色主题，总有一款合你口味</em></p>

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/9%E9%80%9A%E7%94%A8%E8%AE%BE%E7%BD%AE.png)


<p align="center"><em>开机启动、托盘图标、快捷键、服务端地址——通用设置一应俱全</em></p>


## 浏览器扩展：网页场景的全能助手

BearPassword Extension 基于 **Manifest V3**，面向 Chrome / Edge，与桌面端共用同一账号与保险库。

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/15%E6%8F%92%E4%BB%B6%E7%AB%AF.png)


<p align="center"><em>扩展弹窗：搜索、填充、编辑、收藏，TOTP 验证码实时显示</em></p>

### 智能匹配与填充

- 登录页 **自动检测账号/密码表单**，输入框旁显示 BearPassword 图标
- 根据当前网站 URL **自动列出匹配的登录项**
- 工具栏 **徽章显示可用条目数量**
- 扩展弹窗内搜索、浏览、填充当前网站条目

### 保存新凭据

- 登录表单提交后，**横幅提示是否保存到保险库**
- 填充层支持 **快捷保存** 当前页面账号
- 弹窗内可直接 **新增 / 编辑 / 删除** 条目

### 两步验证联动

- 弹窗中配置了 TOTP 的条目可 **查看实时验证码**，点击复制
- 选择条目填充时，**自动复制当前 TOTP 到剪贴板**

### 桌面端联动与安全边界

- 通过 **本地桥接** 与桌面端通信（非云端中转明文）
- 实时显示桌面状态：离线 / 未登录 / 已锁定 / 已就绪
- 桌面未解锁时，通过 **自定义协议唤起桌面应用**
- 扩展 **不会单独保存主密码**

### 右键菜单

- 在输入框中 **一键生成强密码** 并填入

![](https://xuewei-blog.oss-cn-beijing.aliyuncs.com/16%E8%87%AA%E5%8A%A8%E5%A1%AB%E5%85%85.png)


<p align="center"><em>扩展 + 桌面联动：填充前必须桌面解锁，安全与顺手兼得</em></p>


## 开源包含什么？

GitHub 仓库（[https://github.com/isxuewei](https://github.com/isxuewei)）包含 BearPassword **完整产品代码**：

| 目录                      | 技术栈                           | 说明                                              |
| ------------------------- | -------------------------------- | ------------------------------------------------- |
| `bear-password-server`    | Java 17 · Spring Boot 3 · MySQL  | 注册登录、SRP/MFA、密文存储、收藏、公告、版本更新 |
| `bear-password-desktop`   | Electron · Vue 3 · TypeScript    | 跨平台桌面客户端                                  |
| `bear-password-extension` | Manifest V3 · Vue 3 · TypeScript | Chrome / Edge 浏览器扩展                          |
| `bear-password-index`     | 静态 HTML/CSS                    | 产品官网与下载页                                  |

**MIT 协议** — 可自由使用、修改、商用，需保留版权声明。

服务端 README 提供了完整的 **本地部署指南**（MySQL 8 + Java 17），生产环境通过环境变量注入数据库配置即可。桌面端和扩展可通过设置页 **指向你的自建服务器**，实现 **100% 私有化**。


## 关于「有没有后门」

我知道，对密码工具来说，这是最重要的问题。我的回答很简单： **代码全公开，欢迎审计。**

- **登录密码**：SRP 零知识，服务端拿不到明文
- **主密码**：仅在本机用于派生解密密钥，不上传
- **账户密钥**：本机钥匙串 + Emergency Kit，服务端只存指纹
- **保险库内容**：客户端加密后上传，服务端只存密文
- **浏览器填充**：扩展 → 本地桌面桥接 → 已解锁内存中的明文，**不经过云端解密**

如果你仍然不放心我的公有云实例，**请私有化部署**——这是开源密码工具最正确的用法之一。你可以 fork、改代码、自己跑服务端、自己打包客户端，整个链路完全在你掌控之下。

发现安全问题，欢迎通过 GitHub Issue 或私信反馈，我会认真对待每一条安全报告。


## 如何使用？

### 普通用户（继续用官方免费服务）

1. 访问 [https://bear-password.xuewei.fun](https://bear-password.xuewei.fun) 下载桌面端
2. 注册账号，**妥善备份 Emergency Kit**
3. 安装浏览器扩展，保持桌面端解锁
4. 日常上网，一键填充

### 开发者 / 自建用户

```bash
# 克隆仓库
git clone https://github.com/isxuewei/BearPassword.git

# 启动服务端（需 MySQL 8）
cd bear-password-server && mvn spring-boot:run

# 启动桌面端
cd bear-password-desktop && npm install && npm run dev

# 构建浏览器扩展
cd bear-password-extension && npm install && npm run dev
```

详细说明见各子目录 README。一键打包产物统一输出到仓库根目录 `release/`。


## 写在最后

很多年前，我在备忘录里写下「想做一款自己的密码管理器」。

后来借助 AI，我把这个念头做成了 BearPassword——从 SRP 登录到保险库加密，从桌面托盘到浏览器填充，从 Emergency Kit 到 Touch ID，整条链路都跑通了。

**300 多位早期用户**，谢谢你们愿意在一个独立开发者的产品上按下「注册」。你们的每一次使用、每一条反馈，都是 BearPassword 走到今天的原因。

现在，我把全部代码交出来。

不是为了「炫技」，而是因为 **密码工具的安全，本就不该只靠一句「相信我」**。

欢迎 Star、Fork、Issue、PR，也欢迎把这篇文章转给那个「密码全靠浏览器记住、换电脑就抓狂」的朋友。

BearPassword 是我的开始；  
开源，是它下一阶段的开始。

—— BearPassword 开发者 · 薛伟

- GitHub：[https://github.com/isxuewei](https://github.com/isxuewei)
- 官网：[https://bear-password.xuewei.fun/](https://bear-password.xuewei.fun/)
