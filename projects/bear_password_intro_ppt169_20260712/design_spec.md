# BearPassword Product Intro - Design Spec

## I. Project Information

- **Project name**: BearPassword 产品介绍
- **Project path**: `/Users/xuew/WorkSpace/IdeaProject/BearProject/bear-password/projects/bear_password_intro_ppt169_20260712`
- **Source material**: 仓库根 README、桌面端 README、浏览器扩展 README、服务端 README、官网产品截图
- **Audience**: 潜在用户、产品评审者、开源项目关注者，以及希望了解 BearPassword 的个人/开发者
- **Communication goal**: 在 8 页内说明 BearPassword 是什么、解决什么问题、如何通过桌面端与浏览器扩展形成安全便捷的密码管理闭环
- **Content divergence**: 基于源材料重组叙事；保留功能与安全事实，不虚构商业指标
- **Confirmed mode**: problem-solution
- **Confirmed visual style**: soft-rounded
- **Delivery purpose**: balanced / business reading and presentation

## II. Canvas Specification

- **Format**: PPT 16:9
- **Canvas**: `1280 × 720`
- **SVG viewBox**: `0 0 1280 720`
- **Safe margin**: 64 px outer margin; dense pages may use 48 px minimum for screenshots
- **Export target**: PPTX

## III. Visual Theme

### Theme Style

Soft-rounded product presentation: large rounded cards, warm background, mild depth, friendly but professional shapes. The deck should feel like a trusted personal security product rather than a dark cybersecurity operations deck.

### Color Scheme

| Role | HEX | Usage |
|---|---:|---|
| Background | `#FFF8ED` | Warm deck background |
| Surface | `#FFFFFF` | Cards, screenshot frames, contrast panels |
| Primary | `#7A4B22` | Titles, key strokes, brand-like bear warmth |
| Accent | `#F59E0B` | Highlights, badges, key path dots |
| Secondary accent | `#2563EB` | Security / sync / extension emphasis |
| Body text | `#1F2937` | Main text |
| Muted text | `#6B7280` | Notes, labels, captions |
| Border | `#E8D9C5` | Card outlines and dividers |
| Soft blue | `#DBEAFE` | Security panels and extension callouts |
| Soft amber | `#FEF3C7` | Warm emphasis fills |
| Soft green | `#DCFCE7` | Safety / success states |

### AI Image Strategy (fill only when §VIII has `ai` rows)

No AI-generated images are used. The deck uses existing product screenshots provided in the project images folder.

### Gradient Scheme (if needed, using SVG syntax)

Use only subtle background glows, not heavy gradients:
- Warm glow: `#FEF3C7` fading to transparent
- Security glow: `#DBEAFE` fading to transparent

## IV. Typography System

### Font Plan

- **Default font family**: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- **Title family**: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- **Body family**: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- **Emphasis family**: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- **Code family**: `Consolas, "Courier New", monospace`
- **Character**: modern rounded product style, CJK-first readability with cross-platform PPT-safe fallback.

### Font Size Hierarchy

| Role | Size px | Usage |
|---|---:|---|
| Cover title | 64 | Slide 01 hero title |
| Title | 42 | Main page title |
| Subtitle | 32 | Section / large card headings |
| Lead | 28 | Core-message line |
| Body | 24 | Standard content text |
| Annotation | 18 | Labels, captions, small notes |
| Footnote | 16 | Source / URL / page number |
| Hero number | 56 | Large numeric emphasis if needed |

## V. Layout Principles

### Page Structure

- Use a consistent top-left page title and top-right small product mark or page index on most content pages.
- Use rounded screenshot frames with 20–28 px corner radius.
- Use soft card clusters for dense information, but vary rhythm: cover and closing are anchor pages; security and architecture pages breathe more.
- Keep screenshots large enough for UI recognizability; use `meet` fitting rather than aggressive crop for UI screenshots.

### Layout Pattern Library (combine or break as content demands)

1. **Hero screenshot + floating value statement**: large product screenshot framed like an app window, with 1–2 headline chips.
2. **Problem cards → product answer**: left-side pain points, right-side BearPassword response.
3. **System loop diagram**: desktop, extension, encrypted sync, service as connected nodes.
4. **Screenshot side-by-side**: text column plus large UI screenshot.
5. **Security layered stack**: local encryption, master password, local extension bridge, encrypted server sync.
6. **Capability grid**: 4–6 rounded cards with icons and one-line explanations.
7. **Closing value lockup**: concise final slogan with three proof pillars.

### Spacing Specification

- Outer margin: 64 px; minimum 48 px on image-heavy pages
- Card padding: 28–36 px
- Card gap: 20–28 px
- Badge radius: 999 px
- Card radius: 24 px
- Screenshot frame radius: 28 px
- Stroke width: 1.5–2 px

## VI. Icon Usage Specification

### Source

Use Phosphor-style duotone icons conceptually. If project icon syncing is unavailable, draw simple inline SVG line/duotone pictograms directly using locked colors.

### Recommended Icon List (fill as needed)

| Concept | Icon metaphor | Usage |
|---|---|---|
| Vault | lock / safe | Desktop vault pages |
| Password | key | Password storage / autofill |
| Browser extension | browser window / cursor | Extension pages |
| TOTP | clock / shield check | Two-factor code pages |
| Encryption | shield / sealed box | Security pages |
| Sync | cloud arrows | Service and encrypted sync |
| Developer | code brackets | Tech and self-host deployment |

## VII. Visualization Reference List (if needed)

| Page | Visualization | Data/template | Notes |
|---|---|---|---|
| P03 | Architecture loop diagram | no-template-match | Desktop, extension, service, encrypted data flow |
| P06 | Security layered stack | no-template-match | Four protection layers; no numeric data |
| P07 | Tech/deployment matrix | no-template-match | Desktop / extension / server technology stack |

No quantitative charts are required.

## VIII. Image Resource List (if needed)

| Page | Filename | Acquire Via | Status | Intent | Type | Layout pattern | Reference / Usage |
|---|---|---|---|---|---|---|---|
| P01 | `home.png` | user | Existing | hero | Product screenshot | Hero screenshot + floating value statement | Homepage/product overview visual |
| P03 | `home.png` | user | Existing | side-by-side | Product screenshot | System loop support visual | Represents desktop app entry point |
| P04 | `vault.png` | user | Existing | side-by-side | Product screenshot | Screenshot side-by-side | Password vault overview |
| P04 | `add-password.png` | user | Existing | accent | Product screenshot | Small inset | Rich entry creation details |
| P05 | `autofill.png` | user | Existing | side-by-side | Product screenshot | Screenshot side-by-side | Website autofill flow |
| P05 | `extension-popup.png` | user | Existing | accent | Product screenshot | Small inset | Browser extension popup |
| P06 | `security-settings.png` | user | Existing | side-by-side | Product screenshot | Screenshot side-by-side | Security settings |
| P06 | `biometric.png` | user | Existing | accent | Product screenshot | Small inset | Biometric unlock |

All screenshots are 2056 × 1498, ratio 1.37, suitable for 16:9 side-by-side placements. UI screenshots should use no-crop/meet fitting unless explicitly used as decorative background. Coverage note: this product-introduction deck intentionally uses screenshots as framed product evidence rather than full image-as-canvas pages, because UI legibility and explanatory overlays are more important than immersive screenshot backgrounds.

## IX. Content Outline

### Part 1: Product Story

#### Slide 01 - Cover

- **Cover impact**: “密码、账号、二次验证码，需要一个安心的家” — use a warm product screenshot as the trusted vault metaphor rather than a generic title slide.
- **Layout**: Warm gradient background, large rounded screenshot frame on the right, title and value chips on the left.
- **Title**: BearPassword
- **Subtitle**: 简洁、安全、专业的密码管理工具
- **Info**: 桌面端 + 浏览器扩展 · 本地加密后同步

#### Slide 02 - Why It Matters

- **Layout**: Three pain cards on the left, one BearPassword response card on the right.
- **Title**: 账号越多，真正难的是“安心管理”
- **Core message**: BearPassword 聚焦的不只是保存密码，而是把登录、验证码和敏感信息管理变成可控流程。
- **Content**:
  - 多网站、多账号：登录凭据分散，复制粘贴容易出错。
  - 二次验证码：TOTP 需要实时查看、复制，和登录流程割裂。
  - 敏感信息：银行卡、证件、服务器、数据库等不适合散落在普通笔记里。
  - BearPassword 的答案：桌面端集中管理，浏览器扩展在需要时安全取用。

#### Slide 03 - Product Loop

- **Layout**: Four-node rounded architecture loop with a product screenshot panel.
- **Title**: 桌面端 + 扩展，组成完整使用闭环
- **Core message**: BearPassword 把“集中管理”和“网页即用”拆给最适合的端来完成。
- **Visualization**: Architecture loop diagram
- **Content**:
  - 桌面端：创建、查看、编辑和解锁保险库。
  - 浏览器扩展：在网页中匹配条目、一键填充账号密码。
  - 服务端：提供账号登录、保险库密文同步与版本更新。
  - 本机安全通信：扩展不单独保存主密码，向已解锁桌面端请求数据。

#### Slide 04 - Desktop Vault

- **Layout**: Large vault screenshot plus capability cards; add-password screenshot as inset.
- **Title**: 桌面端：把敏感信息放进一个可搜索的保险库
- **Core message**: 桌面端是 BearPassword 的管理中枢，覆盖密码、身份、银行卡、服务器和 TOTP 等多种条目。
- **Content**:
  - 多种条目类型：登录信息、安全备注、身份、银行卡、服务器、数据库、两步验证、自定义。
  - 登录扩展字段：URL、邮箱、地址、电话、备用密码、两步验证。
  - 使用体验：收藏夹、最近访问、标签、搜索、多主题、中/英/日界面。

#### Slide 05 - Browser Extension

- **Layout**: Autofill screenshot as main visual, extension popup as floating phone-like panel; text bullets as chips.
- **Title**: 浏览器扩展：在网页登录时一键填充
- **Core message**: 扩展让保险库能力进入登录现场，同时保持数据由本机桌面端解锁和提供。
- **Content**:
  - 智能匹配：根据当前网站列出可用登录项，工具栏徽章显示数量。
  - 一键填充：点击输入框旁图标或扩展弹窗选择条目。
  - TOTP 更顺手：弹窗和填充层显示实时验证码，填充时可自动复制。
  - 快捷保存：检测到新登录信息时提示保存到保险库。

#### Slide 06 - Security Model

- **Layout**: Four-layer security stack with settings screenshots on the right.
- **Title**: 安全设计：主密码不明文上传，服务器只存密文
- **Core message**: BearPassword 的安全边界建立在客户端加密、本机通信和自动锁定等机制上。
- **Visualization**: Security layered stack
- **Content**:
  - 设备侧加密：保险库内容在本地加密后才上传或同步。
  - 主密码保护：主密码不会明文上传到服务器。
  - 本机桥接：扩展通过本机安全通道读取已解锁数据。
  - 使用保护：自动锁定、剪贴板定时清空、可选生物识别解锁。

#### Slide 07 - Technology & Deployment

- **Layout**: Three-column technology matrix with deployment note.
- **Title**: 对普通用户开箱即用，对开发者可自建
- **Core message**: BearPassword 同时提供端侧体验、浏览器集成和可自建服务端的完整工程实现。
- **Visualization**: Tech/deployment matrix
- **Content**:
  - 桌面端：Electron · Vue 3 · TypeScript · Pinia · Element Plus · Vite。
  - 扩展端：Manifest V3 · Vue 3 · TypeScript · Vite · CRXJS。
  - 服务端：Java 17 · Spring Boot 3 · MyBatis Plus · MySQL · Druid。
  - 使用路径：普通用户从官网下载；开发者可按 README 本地运行或自建服务端。

#### Slide 08 - Closing

- **Layout**: Centered value lockup, three proof pillars, website CTA.
- **Title**: BearPassword：安心保存，顺手填充
- **Core message**: 它把密码管理、TOTP 和敏感信息收拢到一个可信工作流中。
- **Content**:
  - 简洁：桌面端管理，网页端一键填充。
  - 安全：客户端加密、主密码保护、自动锁定。
  - 专业：多类型条目、跨端配合、支持自建服务端。
  - 官网：https://bear-password.xuewei.fun

## X. Speaker Notes Requirements

- Speaker notes should be written in Chinese.
- Each slide should include a 60–90 second presenter-friendly explanation.
- Notes must emphasize product value and factual safety claims without overstating cryptographic guarantees beyond source material.
- End with a clear CTA to download from the official website or inspect the repository.

## XI. Technical Constraints Reminder

### SVG Generation Must Follow:

- Output one handwritten SVG per slide into `svg_output/`.
- Use `viewBox="0 0 1280 720"` for every slide.
- Re-read `spec_lock.md` before each slide.
- Use only locked colors, fonts, image files and sizes.
- Keep screenshots as image references to `../images/<filename>`.
- Avoid unsupported SVG constructs: no `<style>`, no CSS classes, no foreignObject, no script, no animation.

### PPT Compatibility Rules:

- Use plain SVG shapes and text elements.
- Escape XML reserved characters.
- Avoid opacity on parent groups; apply opacity on child shapes if needed.
- Keep text as editable SVG text where possible.
- UI screenshots should use `preserveAspectRatio="xMidYMid meet"` to avoid losing pixels.
