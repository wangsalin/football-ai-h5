# 生产部署说明

本文档适用于单台 Ubuntu 22.04/24.04 服务器部署。短信服务暂不包含在本步骤内。

## 服务器要求

- Ubuntu 22.04 或 24.04
- Node.js 20+
- pnpm 10+
- PostgreSQL 16 或云数据库
- Redis 7
- Nginx
- HTTPS 证书，建议使用 Let’s Encrypt

## 环境变量

复制 `.env.production.example` 为生产环境文件：

```bash
cp .env.production.example /var/www/football-ai-h5/shared/.env.production
```

必须替换：

- `DATABASE_URL`
- `REDIS_URL`
- `APP_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `OPENAI_API_KEY`

生产环境必须保持：

```bash
NODE_ENV=production
MOCK_SMS=false
MOCK_LLM=false
```

当前短信服务还未接真实供应商，所以正式公网注册/登录前仍需要完成短信接入。

## 首次部署

```bash
mkdir -p /var/www/football-ai-h5/releases
mkdir -p /var/www/football-ai-h5/shared
mkdir -p /var/www/football-ai-h5/uploads

cd /var/www/football-ai-h5/releases
git clone <REPO_URL> current-build
cd current-build

pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:deploy
pnpm build

ln -sfn /var/www/football-ai-h5/releases/current-build /var/www/football-ai-h5/current
chown -R www-data:www-data /var/www/football-ai-h5
```

如需初始化演示数据：

```bash
pnpm prisma:seed
```

生产正式库不建议重复执行 seed，因为会清空并重建演示数据。

## systemd

复制模板：

```bash
cp deploy/football-ai-h5.service /etc/systemd/system/football-ai-h5.service
systemctl daemon-reload
systemctl enable football-ai-h5
systemctl start football-ai-h5
systemctl status football-ai-h5
```

查看日志：

```bash
journalctl -u football-ai-h5 -f
```

## Nginx

复制模板并替换域名：

```bash
cp deploy/nginx.football-ai-h5.conf /etc/nginx/sites-available/football-ai-h5.conf
ln -sfn /etc/nginx/sites-available/football-ai-h5.conf /etc/nginx/sites-enabled/football-ai-h5.conf
nginx -t
systemctl reload nginx
```

证书路径需要和服务器实际证书一致。

## 定时任务

复制 `deploy/cron.example`，替换 `APP_URL` 和 `CRON_SECRET` 后写入 crontab：

```bash
crontab -e
```

定时任务会调用：

- `POST /api/admin/jobs/sync-matches`
- `POST /api/admin/jobs/auto-predictions`
- `POST /api/admin/jobs/prematch-reanalysis`
- `POST /api/admin/jobs/auto-reviews`

请求必须携带：

```txt
Authorization: Bearer <CRON_SECRET>
```

## 发布更新

```bash
cd /var/www/football-ai-h5/current
git pull
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:deploy
pnpm build
systemctl restart football-ai-h5
```

## 上线前确认

```bash
pnpm lint
pnpm test
pnpm build
pnpm exec prisma validate
```

浏览器确认：

- `/`
- `/matches`
- `/reviews`
- `/login?redirect=/admin`
- `/admin/settings`

后台确认：

- 站点信息已改为正式域名。
- 管理员默认密码已更换。
- 默认演示账号已禁用或删除。
- 模型设置已切换为真实 OpenAI API。
- 赛事数据源已配置。
- 自动预测 / 自动复盘已启用。

## WeChat Share Card

The site exposes Open Graph metadata for WeChat link previews:

- Default image: `/wechat-share-card.png`
- Home, match list, review, ads, and match detail pages define share title, description, canonical URL, and image metadata.
- `APP_URL` must be the public origin, including port when no domain is bound, for example `http://203.0.113.10:20266`.

If the product needs fully controlled WeChat in-app sharing behavior, configure the official WeChat JS-SDK flow later:

- WeChat official account/app credentials.
- Server-side ticket/signature endpoint.
- Frontend `wx.updateAppMessageShareData` and `wx.updateTimelineShareData` integration.

WeChat may cache link previews. After changing the share image, test with a fresh URL or wait for cache refresh.
