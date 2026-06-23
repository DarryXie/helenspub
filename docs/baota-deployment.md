# 宝塔部署说明

本文档记录 `helenspub.xyz` 项目当前的服务器部署结果、联调入口、Nginx 配置要点，以及后续更新流程。

## 1. 当前部署状态

- 部署时间：`2026-06-22`
- 服务器：`139.196.206.35`
- 域名：`helenspub.xyz`
- 运行方式：`Nginx + PM2 + MySQL`
- API 进程名：`helenspub-api`
- API 监听端口：`3000`
- 静态站点根目录：`/www/wwwroot/helenspub/www`
- 上传目录：`/www/wwwroot/helenspub/uploads`

当前已经完成：

- 后端 API 已构建并启动
- `admin-web` 已发布到 `/admin/`
- `public-mobile` 已发布到 `/menu/`
- `staff-mobile` 已发布到 `/staff/`
- Nginx 已配置根路径跳转到 `/menu/`
- `/api/v1/` 已反向代理到 `127.0.0.1:3000`
- `/uploads/` 已映射到服务器本地上传目录

## 2. 当前联调结论

服务器侧联调已经通过，说明项目本身部署成功。

可正常访问：

- `http://139.196.206.35/menu/`
- `http://139.196.206.35/admin/login`
- `http://139.196.206.35/staff/login`

服务器内网域名联调也通过：

- `http://helenspub.xyz/menu/`
- `http://helenspub.xyz/admin/login`
- `http://helenspub.xyz/staff/login`
- `http://helenspub.xyz/api/v1/public/categories`

但公网直接通过域名访问时，当前会被阿里云返回：

- `403 Forbidden`
- `Non-compliance ICP Filing`

这说明现在的阻塞点不是代码、不是 Nginx、也不是 PM2，而是阿里云对域名的备案放行限制。

## 3. 现阶段可用联调地址

在域名备案放行之前，建议先用服务器公网 IP 做功能联调：

- 菜单：`http://139.196.206.35/menu/`
- 后台：`http://139.196.206.35/admin/login`
- 员工端：`http://139.196.206.35/staff/login`

根路径会自动跳转：

- `http://139.196.206.35/` -> `http://139.196.206.35/menu/`

## 4. 已确认的服务器环境

- Nginx：`1.28.3`
- Node.js：`v20.20.2`
- PM2：`5.x`
- MySQL：`5.7.40`

项目目录规划：

- 代码目录：`/www/wwwroot/helenspub/repo`
- 静态目录：`/www/wwwroot/helenspub/www`
- 上传目录：`/www/wwwroot/helenspub/uploads`
- 日志目录：`/www/wwwroot/helenspub/logs`

## 5. 当前生产环境变量

服务器 `.env` 已按以下配置写入：

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://helenspub:FKbXTH2rJinWAMX6@127.0.0.1:3306/helenspub
JWT_SECRET=my_super_secret_key_2026_xyz
JWT_EXPIRES_IN=24h
UPLOAD_DIR=/www/wwwroot/helenspub/uploads
UPLOAD_BASE_URL=/uploads
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123456
VITE_API_BASE_URL=http://helenspub.xyz/api/v1
VITE_API_ORIGIN=http://helenspub.xyz
```

说明：

- 当前按 HTTP 联调，所以前端构建使用的是 `http://helenspub.xyz`
- 后续切 HTTPS 后，需要重新构建前端

## 6. Nginx 配置目标

当前站点应满足以下规则：

- `/` 跳转到 `/menu/`
- `/admin/` 提供后台静态资源
- `/menu/` 提供菜单静态资源
- `/staff/` 提供员工端静态资源
- `/api/v1/` 反向代理到 `127.0.0.1:3000`
- `/uploads/` 映射到 `/www/wwwroot/helenspub/uploads/`

项目内参考文件：

- Nginx 配置样板：`scripts/deploy/baota-nginx-helenspub.conf`
- PM2 配置样板：`scripts/deploy/pm2-helenspub-api.config.cjs`

## 7. PM2 常用命令

```bash
pm2 list
pm2 logs helenspub-api
pm2 restart helenspub-api
pm2 stop helenspub-api
pm2 delete helenspub-api
pm2 save
```

API 实际启动入口：

```bash
apps/api-server/dist/src/main.js
```

## 8. 后续代码更新流程

这台服务器当前没有现成可用的 `git`，所以本次是通过上传代码包的方式部署的。

后续更新有两种选择：

1. 继续沿用当前方式，由我重新打包上传并发布
2. 服务器补装 `git` 后，改成 `git pull` 更新

如果已经拿到新代码并放入 `/www/wwwroot/helenspub/repo`，标准更新步骤如下：

```bash
cd /www/wwwroot/helenspub/repo
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

## 9. 切换 HTTPS 时要做的事

当你在宝塔里上传好 SSL 证书后，需要做两步：

1. 在宝塔站点里开启 `SSL` 和强制 `HTTPS`
2. 把 `.env` 中前端地址改成 HTTPS 后重新构建前端

修改为：

```env
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

## 10. 下一步最需要处理的事情

当前最重要的不是改代码，而是放行域名访问。

你需要确认：

- `helenspub.xyz` 是否已经完成并通过中国大陆站点备案
- 阿里云当前 ECS / 轻量应用服务器是否仍在做备案拦截
- 宝塔或阿里云是否还挂着额外的网站防护、CDN 或 WAF

只要域名层拦截解除，现有部署就可以直接用域名联调。
