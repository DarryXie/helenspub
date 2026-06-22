# 宝塔部署步骤

本文按当前项目的实际情况编写，目标部署结果如下：

- 主域名：`helenspub.xyz`
- 菜单：`/menu/`
- 后台：`/admin/`
- 员工端：`/staff/`
- API：`/api/v1`
- 上传文件：`/uploads`
- 运行方式：`Nginx + PM2 + MySQL`

相关样板文件：

- Nginx 配置参考：`scripts/deploy/baota-nginx-helenspub.conf`
- PM2 配置参考：`scripts/deploy/pm2-helenspub-api.config.cjs`

## 1. 宝塔面板准备

在宝塔里确认已安装：

- `Nginx`
- `Node.js 20`
- `PM2`
- `MySQL 5.7`

建议目录这样规划：

- 仓库目录：`/www/wwwroot/helenspub/repo`
- 站点静态目录：`/www/wwwroot/helenspub/www`
- 上传目录：`/www/wwwroot/helenspub/uploads`

## 2. 创建站点

在宝塔：

1. 打开 `网站`
2. 新建站点，域名填 `helenspub.xyz`
3. 根目录填：`/www/wwwroot/helenspub/www`
4. PHP 版本选 `纯静态`
5. 先不处理 HTTPS，等站点跑通后再上传证书

创建完成后，确认下面目录存在：

```bash
mkdir -p /www/wwwroot/helenspub/repo
mkdir -p /www/wwwroot/helenspub/www
mkdir -p /www/wwwroot/helenspub/uploads
mkdir -p /www/wwwroot/helenspub/logs
```

## 3. 拉取代码

在宝塔终端执行：

```bash
cd /www/wwwroot/helenspub
git clone https://github.com/DarryXie/helenspub.git repo
cd /www/wwwroot/helenspub/repo
```

如果目录已存在，更新代码用：

```bash
cd /www/wwwroot/helenspub/repo
git pull
```

## 4. 创建数据库

在宝塔 `数据库` 页面创建：

- 数据库名：`helenspub`
- 用户名：`helenspub`
- 密码：用你自己的生产密码

确认本机可连地址是：

```text
127.0.0.1:3306
```

## 5. 写生产环境变量

在仓库根目录创建 `.env`：

```bash
cd /www/wwwroot/helenspub/repo
cat > .env <<'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@127.0.0.1:3306/helenspub
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=24h
UPLOAD_DIR=/www/wwwroot/helenspub/uploads
UPLOAD_BASE_URL=/uploads
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
VITE_API_BASE_URL=http://helenspub.xyz/api/v1
VITE_API_ORIGIN=http://helenspub.xyz
EOF
```

注意：

- 如果你已经配好 HTTPS，再把 `http://` 改成 `https://`
- 如果你先用 HTTP 联调，后面切 HTTPS 后要重新构建前端

## 6. 安装依赖并构建

在宝塔终端执行：

```bash
cd /www/wwwroot/helenspub/repo
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm --filter api-server prisma generate
corepack pnpm --filter api-server prisma migrate deploy
corepack pnpm --filter api-server prisma db seed
corepack pnpm build
```

说明：

- `prisma migrate deploy` 用于生产库
- 当前项目 API 构建入口实际是 `apps/api-server/dist/src/main.js`

## 7. 发布前端静态文件

先清空旧静态目录，再复制新的构建产物：

```bash
cd /www/wwwroot/helenspub/repo
mkdir -p /www/wwwroot/helenspub/www/admin
mkdir -p /www/wwwroot/helenspub/www/menu
mkdir -p /www/wwwroot/helenspub/www/staff

rm -rf /www/wwwroot/helenspub/www/admin/*
rm -rf /www/wwwroot/helenspub/www/menu/*
rm -rf /www/wwwroot/helenspub/www/staff/*

cp -r apps/admin-web/dist/* /www/wwwroot/helenspub/www/admin/
cp -r apps/public-mobile/dist/* /www/wwwroot/helenspub/www/menu/
cp -r apps/staff-mobile/dist/* /www/wwwroot/helenspub/www/staff/
```

## 8. 用 PM2 启动 API

推荐方式一：直接用配置文件启动

```bash
cd /www/wwwroot/helenspub/repo
pm2 start scripts/deploy/pm2-helenspub-api.config.cjs
pm2 save
```

推荐方式二：直接命令启动

```bash
cd /www/wwwroot/helenspub/repo
pm2 start apps/api-server/dist/src/main.js --name helenspub-api --cwd /www/wwwroot/helenspub/repo
pm2 save
```

常用检查命令：

```bash
pm2 list
pm2 logs helenspub-api
pm2 restart helenspub-api
pm2 stop helenspub-api
```

## 9. 配置 Nginx

在宝塔：

1. 打开 `网站`
2. 选中 `helenspub.xyz`
3. 打开 `设置`
4. 打开 `配置文件`
5. 参考 `scripts/deploy/baota-nginx-helenspub.conf`
6. 把站点 `server {}` 内容替换为对应配置，或至少把其中的 `location` 规则合并进去
7. 保存并重载 Nginx

核心点：

- `/` 跳转到 `/menu/`
- `/admin/` 指向后台静态目录
- `/menu/` 指向公开前台静态目录
- `/staff/` 指向员工端静态目录
- `/api/v1/` 反向代理到 `127.0.0.1:3000`
- `/uploads/` 直接读取 `/www/wwwroot/helenspub/uploads/`

## 10. 联调检查

先检查 API：

```bash
curl http://127.0.0.1:3000/api/v1/public/categories
```

再检查域名访问：

- `http://helenspub.xyz/`
- `http://helenspub.xyz/menu/`
- `http://helenspub.xyz/admin/login`
- `http://helenspub.xyz/staff/login`

如果根路径不跳转，优先检查 Nginx 配置是否生效。

## 11. 上传 HTTPS 证书

在宝塔：

1. 打开 `网站`
2. 进入 `helenspub.xyz`
3. 打开 `SSL`
4. 上传阿里云证书
5. 开启强制 HTTPS

证书生效后，把 `.env` 里的前端地址改成：

```text
VITE_API_BASE_URL=https://helenspub.xyz/api/v1
VITE_API_ORIGIN=https://helenspub.xyz
```

然后重新执行：

```bash
cd /www/wwwroot/helenspub/repo
corepack pnpm build
rm -rf /www/wwwroot/helenspub/www/admin/*
rm -rf /www/wwwroot/helenspub/www/menu/*
rm -rf /www/wwwroot/helenspub/www/staff/*
cp -r apps/admin-web/dist/* /www/wwwroot/helenspub/www/admin/
cp -r apps/public-mobile/dist/* /www/wwwroot/helenspub/www/menu/
cp -r apps/staff-mobile/dist/* /www/wwwroot/helenspub/www/staff/
```

## 12. 计划任务建议

在宝塔 `计划任务` 里建议至少配两个：

### 数据库备份

- 任务类型：`数据库备份`
- 数据库：`helenspub`
- 执行周期：`每天凌晨`

### 代码更新后自动重启 API

如果你以后手动更新代码后忘记重启，可以用 Shell 脚本任务：

```bash
cd /www/wwwroot/helenspub/repo && pm2 restart helenspub-api
```

## 13. 后续更新流程

以后更新版本按这个顺序：

```bash
cd /www/wwwroot/helenspub/repo
git pull
corepack pnpm install --frozen-lockfile
corepack pnpm --filter api-server prisma migrate deploy
corepack pnpm build
rm -rf /www/wwwroot/helenspub/www/admin/*
rm -rf /www/wwwroot/helenspub/www/menu/*
rm -rf /www/wwwroot/helenspub/www/staff/*
cp -r apps/admin-web/dist/* /www/wwwroot/helenspub/www/admin/
cp -r apps/public-mobile/dist/* /www/wwwroot/helenspub/www/menu/
cp -r apps/staff-mobile/dist/* /www/wwwroot/helenspub/www/staff/
pm2 restart helenspub-api
```

## 14. 目前最容易踩的坑

- `apps/api-server/package.json` 里的 `start:prod` 不是当前实际构建产物路径，生产启动请用 `apps/api-server/dist/src/main.js`
- 切 HTTPS 后如果前端还是旧的 `http://` API 地址，会产生混合内容问题，需要重新构建
- 上传目录不要放到前端构建目录里，应该独立放在 `/www/wwwroot/helenspub/uploads`
- 如果宝塔里根站点路径不是 `/www/wwwroot/helenspub/www`，Nginx 里的 `root` 也要一起改
