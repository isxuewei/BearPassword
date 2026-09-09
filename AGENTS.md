# Repository Guidelines

## 项目结构与模块组织

本仓库是 BearPassword monorepo。`bear-password-server/` 是 Java 17 + Spring Boot 3 后端，源码在 `src/main/java`，测试在 `src/test/java`，数据库初始化脚本在 `sql/init.sql`。`bear-password-web/` 是 Vue 3/Vite 网页端，`bear-password-desktop/` 是 Electron + Vue 桌面端，二者共享相近的 `src/api`、`src/components`、`src/stores`、`src/utils` 结构。`bear-password-extension/` 是浏览器扩展，入口分布在 `src/background`、`src/content`、`src/popup`。`bear-password-index/` 是官网静态页面，截图资源在 `assets/screenshots/`。

## 构建、测试与开发命令

- `npm install --prefix bear-password-web`、`npm install --prefix bear-password-desktop`、`npm install --prefix bear-password-extension`：分别安装前端模块依赖，避免在根目录混装。
- `npm run build:all`：从根目录聚合构建桌面端、扩展等产物，输出到 `release/`。
- `npm run build:web`：打包网页端并生成发布 zip。
- `cd bear-password-server && mvn spring-boot:run`：启动本地后端，默认 API 为 `http://localhost:8080/api`。
- `cd bear-password-server && mvn package`：构建后端 jar。
- `cd bear-password-server && mvn test`：运行后端 JUnit/Spring Boot 测试。
- `cd bear-password-web && npm run dev`、`cd bear-password-desktop && npm run dev`、`cd bear-password-extension && npm run dev`：分别启动对应前端模块开发模式。
- `npm run typecheck`：在各前端子目录执行 TypeScript/Vue 类型检查。

## 代码风格与命名约定

Java 使用 4 空格缩进，包名保持 `com.bear.password.*`，按 `controller`、`service`、`mapper`、`entity`、`dto` 分层。Vue/TypeScript 使用 2 空格缩进、单引号、无分号风格；组件文件使用 PascalCase，例如 `PasswordEntryDialog.vue`，组合式函数使用 `useXxx.ts`，Pinia store 按业务命名放在 `src/stores`。

## 测试指南

后端测试基于 `spring-boot-starter-test`，测试类放在 `bear-password-server/src/test/java`，命名为 `*Tests.java`。前端当前以 `vue-tsc --noEmit` 做类型验证；修改共享工具、加密、同步、自动填充等关键逻辑时，至少运行受影响模块的 `npm run typecheck` 和 `npm run build`。如果改动跨 `web` 与 `desktop` 的同名文件，两个模块都要验证。

## 提交与 Pull Request 规范

Git 历史采用 Conventional Commits 风格，如 `feat(web): ...`、`fix: ...`、`build(desktop): ...`、`chore(version): ...`。提交信息建议中文描述具体变更。PR 应包含变更摘要、验证命令、关联 issue；涉及 UI 或安装包流程时附截图或说明影响平台（macOS、Windows、Chrome/Edge）。

## 安全与配置提示

不要提交真实数据库、Redis、邮件或 OSS 密钥。后端本地配置优先放在 `application-dev.yml`，生产环境通过 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 等环境变量注入。涉及保险库加密、主密码、TOTP、剪贴板和本机扩展通信的改动需额外说明安全影响。

## Agent 特定说明

保持改动聚焦在目标模块，不要顺手重排生成文件、截图或锁文件。新增功能时优先复用 `bear-password-web` 与 `bear-password-desktop` 中已有的共享结构和命名，避免两端行为漂移。调试扩展时在 `chrome://extensions` 加载 `bear-password-extension/dist`。除发布任务外，不要提交 `release/` 或 `dist/` 产物。
