# Cocktail Database

鸡尾酒数据库项目，采用 `pnpm workspace + NestJS + React/Vite + Prisma + MySQL`。

包含 4 个主要运行单元：

- `apps/api-server`：后端 API
- `apps/admin-web`：后台管理端
- `apps/public-mobile`：公开前台
- `apps/staff-mobile`：服务员前台

## 1. 环境要求

- Node.js 22+
- `corepack`
- Windows PowerShell
- MySQL 8.4

项目根目录使用：

- `pnpm@9.12.3`

建议先确认：

```powershell
node -v
corepack --version
```

## 2. 首次安装

在项目根目录执行：

```powershell
cd D:\CodeX\cocktail_database
corepack pnpm install
```

如果是第一次初始化数据库模型，再执行：

```powershell
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
```

## 3. 环境变量

当前根目录 `.env` 关键配置如下：

```env
DATABASE_URL=mysql://cocktail:cocktail123@127.0.0.1:3306/cocktail_db
PORT=3000
ADMIN_WEB_PORT=5173
PUBLIC_MOBILE_PORT=5174
STAFF_MOBILE_PORT=5175
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
```

## 4. 如何启动数据库

数据库有两种启动方式，二选一即可。

### 方式 A：使用 Docker Compose

项目自带 `docker-compose.yml`，可直接启动 MySQL：

```powershell
cd D:\CodeX\cocktail_database
docker compose up -d mysql
```

默认数据库参数：

- Host: `127.0.0.1`
- Port: `3306`
- Database: `cocktail_db`
- Username: `cocktail`
- Password: `cocktail123`
- Root Password: `root123456`

停止 Docker 数据库：

```powershell
docker compose stop mysql
```

### 方式 B：使用本机已安装的 MySQL

当前机器如继续使用本地安装版 MySQL，可执行：

```powershell
D:\mysql\mysql-8.4.10-winx64\bin\mysqld.exe --defaults-file=D:\mysql\mysql-8.4.10-winx64\my.ini --console
```

如果你已经把 MySQL 注册成 Windows 服务，也可以直接用：

```powershell
net start <你的MySQL服务名>
```

## 5. 如何启动项目

推荐至少开 3 个终端。

### 终端 1：启动数据库

如果用 Docker：

```powershell
cd D:\CodeX\cocktail_database
docker compose up -d mysql
```

如果用本机 MySQL：

```powershell
D:\mysql\mysql-8.4.10-winx64\bin\mysqld.exe --defaults-file=D:\mysql\mysql-8.4.10-winx64\my.ini --console
```

### 终端 2：启动后端 API

```powershell
cd D:\CodeX\cocktail_database
corepack pnpm dev:api
```

如果 Windows 下 `start:dev` 热更新不稳定，可先用稳定模式：

```powershell
cd D:\CodeX\cocktail_database
corepack pnpm --filter api-server start
```

### 终端 3：启动前端

```powershell
cd D:\CodeX\cocktail_database
corepack pnpm dev
```

注意：

- `corepack pnpm dev` 只会启动 `apps/*` 里的前端应用
- `corepack pnpm dev` 不会启动数据库
- `corepack pnpm dev` 也不会启动后端 API

## 6. 启动后访问地址

- 后端 API：`http://127.0.0.1:3000/api/v1`
- 后台管理端：`http://localhost:5173`
- 公开前台：`http://localhost:5174`
- 服务员前台：`http://localhost:5175`

后台默认管理员账号：

- Username: `admin`
- Password: `ChangeMe123!`

## 7. 常用命令

### 安装依赖

```powershell
corepack pnpm install
```

### 启动前端

```powershell
corepack pnpm dev
```

### 单独启动后台

```powershell
corepack pnpm dev:admin
```

### 单独启动公开前台

```powershell
corepack pnpm dev:public
```

### 单独启动服务员前台

```powershell
corepack pnpm dev:staff
```

### 启动后端

```powershell
corepack pnpm dev:api
```

### 生成 Prisma Client

```powershell
corepack pnpm db:generate
```

### 执行数据库迁移

```powershell
corepack pnpm db:migrate
```

### 执行 Seed

```powershell
corepack pnpm db:seed
```

### 构建全部应用

```powershell
corepack pnpm build
```

## 8. 如何确认是否启动成功

### 数据库

确认 `3306` 端口可连：

```powershell
Test-NetConnection 127.0.0.1 -Port 3306
```

### API

确认 `3000` 端口可连：

```powershell
Test-NetConnection 127.0.0.1 -Port 3000
```

也可以直接访问：

```text
http://127.0.0.1:3000/api/v1/public/categories
```

### 前端

浏览器访问：

- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`

## 9. 常见问题

### 1. `corepack pnpm dev` 为什么没有启动 API？

因为根目录脚本：

```json
"dev": "corepack pnpm -r --parallel --filter \"./apps/*\" dev"
```

它只会匹配 `apps/*` 里有 `dev` 脚本的前端应用，不会额外带上 `api-server` 的 `start:dev`。

### 2. 为什么前端起来了，但页面提示 `Failed to fetch`？

通常表示：

- 后端 API 没启动
- 或数据库没启动，导致 API 启动失败

这时先检查：

```powershell
Test-NetConnection 127.0.0.1 -Port 3000
Test-NetConnection 127.0.0.1 -Port 3306
```

### 3. Windows 下 `corepack pnpm dev:api` 热更新偶尔挂掉怎么办？

可先临时改用稳定启动：

```powershell
corepack pnpm --filter api-server start
```

这样没有热更新，但通常更稳定。

## 10. 推荐日常启动顺序

日常开发最推荐的顺序是：

1. 启动数据库
2. 启动 API
3. 启动前端

对应命令：

```powershell
# 终端 1
docker compose up -d mysql

# 终端 2
cd D:\CodeX\cocktail_database
corepack pnpm dev:api

# 终端 3
cd D:\CodeX\cocktail_database
corepack pnpm dev
```
