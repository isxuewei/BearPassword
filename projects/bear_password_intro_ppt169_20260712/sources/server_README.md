<p align="center">
  <img src="../bear-password-desktop/src/assets/logo.svg" alt="BearPassword" width="80" height="80" />
</p>

<h1 align="center">BearPassword 服务端</h1>

<p align="center">为桌面端与扩展提供账号登录、保险库同步与版本更新</p>

<p align="center">
  <a href="../README.md">返回项目首页</a>
</p>

---

## 这是做什么的？

普通用户使用 [官网](https://bear-password.xuewei.fun) 提供的云服务即可，**无需自行部署服务端**。

本模块面向希望**自建 BearPassword 后端**的用户或开发者，负责：

- 用户注册、登录与账号安全（含二次验证登录保护）
- 保险库条目的加密数据存储与同步
- 收藏、公告、客户端版本与更新包分发

桌面端与浏览器扩展通过 API 与服务器通信；**敏感内容在客户端加密**，服务器侧存储的是密文。

---

## 本地部署（开发者 / 自建）

**环境要求：** Java 17、Maven、MySQL 8

### 1. 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 2. 配置数据库连接

编辑 `src/main/resources/application-dev.yml`，填写数据库地址、用户名和密码。

### 3. 启动服务

```bash
mvn spring-boot:run
```

启动后 API 根路径：`http://localhost:8080/api`

### 4. 验证是否正常

```bash
curl http://localhost:8080/api/health
```

开发环境可选开启 Druid 监控：`http://localhost:8080/api/druid/`（默认仅本机可访问）。

---

## 生产环境

使用 `prod` 配置，通过环境变量注入数据库等信息，例如：

| 变量 | 说明 |
|------|------|
| `DB_URL` | 数据库连接地址 |
| `DB_USERNAME` | 数据库用户名 |
| `DB_PASSWORD` | 数据库密码 |

```bash
java -jar bear-password-server.jar --spring.profiles.active=prod
```

---

## API 约定

接口统一返回格式（与桌面端一致）：

```json
{
  "code": 0,
  "message": "success",
  "data": { }
}
```

`code = 0` 表示成功。

---

## 技术概要

Java 17 · Spring Boot 3 · MyBatis Plus · MySQL · Druid

---

## 许可证

MIT · 作者：薛伟同学
