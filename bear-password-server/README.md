# BearPassword Server

BearPassword 密码管理工具后端服务，基于 **Spring Boot 3 + MyBatis Plus + MySQL 8**。

## 技术栈

| 技术           | 版本     | 说明           |
|--------------|--------|--------------|
| Java         | 17     | LTS          |
| Spring Boot  | 3.3.5  | Web 框架       |
| MyBatis Plus | 3.5.9  | ORM          |
| MySQL        | 8.x    | 数据库          |
| Druid        | 1.2.28 | 连接池 / SQL 监控 |
| Lombok       | -      | 简化样板代码       |

## 目录结构

```
bear-password-server/
├── sql/                          # 数据库脚本
│   └── init.sql
├── src/main/java/com/bear/password/
│   ├── BearPasswordApplication.java
│   ├── common/                   # 公共模块
│   │   ├── config/               # 配置类
│   │   ├── controller/           # 通用控制器
│   │   ├── entity/               # 实体基类
│   │   ├── exception/            # 异常处理
│   │   └── result/               # 统一响应
│   └── module/                   # 业务模块（按领域划分）
│       ├── auth/                 # 认证
│       ├── user/                 # 用户
│       └── dashboard/            # 仪表盘
└── src/main/resources/
    ├── application.yml
    ├── application-dev.yml
    └── application-prod.yml
```

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 2. 修改数据库配置

编辑 `src/main/resources/application-dev.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/bear_password?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 你的密码
```

开发环境已启用 Druid 监控页：`http://localhost:8080/api/druid/`（账号 `admin` / `admin123`，仅允许本机访问）。

### 3. 启动项目

在 IDEA 中运行 `BearPasswordApplication`，或使用 Maven：

```bash
mvn spring-boot:run
```

服务地址：`http://localhost:8080/api`

### 4. 测试接口

```bash
# 健康检查
curl http://localhost:8080/api/health

# 登录（测试账号 admin / 123456）
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 仪表盘统计
curl http://localhost:8080/api/dashboard/stats
```

## API 响应格式

与桌面端 `ApiResponse` 对齐：

```json
{
  "code": 0,
  "message": "success",
  "data": { }
}
```

- `code = 0` 表示成功
- 其他 code 表示业务或系统错误

## 环境配置

| Profile | 文件                   | 用途                  |
|---------|----------------------|---------------------|
| dev     | application-dev.yml  | 本地开发                |
| prod    | application-prod.yml | 生产环境（通过环境变量注入数据库配置） |

生产环境连接池参数继承 `application.yml`，可通过环境变量覆盖 Druid 监控：

| 变量                    | 说明                                          | 默认          |
|-----------------------|---------------------------------------------|-------------|
| `DB_URL`              | JDBC 地址（建议带 `serverTimezone=Asia/Shanghai`） | -           |
| `DB_USERNAME`         | 数据库用户名                                      | -           |
| `DB_PASSWORD`         | 数据库密码                                       | -           |
| `DRUID_STAT_ENABLED`  | 是否开启监控页                                     | `false`     |
| `DRUID_STAT_USERNAME` | 监控页账号                                       | `admin`     |
| `DRUID_STAT_PASSWORD` | 监控页密码                                       | 空           |
| `DRUID_STAT_ALLOW`    | 允许访问 IP                                     | `127.0.0.1` |

切换环境：

```bash
java -jar bear-password-server.jar --spring.profiles.active=prod
```

## 后续开发路线

- [ ] JWT 认证与 Spring Security
- [ ] BCrypt 密码校验
- [ ] 密码库 CRUD
- [ ] 收藏夹 / 最近访问
- [ ] 接口文档（Knife4j / SpringDoc）
