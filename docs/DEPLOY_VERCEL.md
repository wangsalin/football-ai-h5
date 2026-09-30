# 5 分钟部署到 Vercel（附带 Postgres + Redis）

> 本地 Docker 方案见 [docs/DEPLOYMENT.md](DEPLOYMENT.md)。这份指南面向"先把在线 demo 跑起来"。

## 1. 准备数据库与缓存（各 2 分钟）

- **PostgreSQL**：去 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com) 建一个免费 Postgres，拿到 `DATABASE_URL`（形如 `postgresql://user:pass@host/db?sslmode=require`）。
- **Redis**：去 [Upstash](https://upstash.com) 建一个免费 Redis，拿到 `REDIS_URL`。

## 2. 导入仓库

打开 [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwangsalin%2Ffootball-ai-h5&project-name=football-ai-h5)，
按提示导入 `wangsalin/football-ai-h5`。

## 3. 配置环境变量

在 Vercel 项目 Settings → Environment Variables 里添加（取值对照 `.env.example`）：

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | 第 1 步拿到的 Postgres 连接串 |
| `REDIS_URL` | 第 1 步拿到的 Redis 连接串 |
| `JWT_SECRET` | 随机长字符串（`openssl rand -base64 32`） |
| `CRON_SECRET` | 随机长字符串，供定时任务鉴权 |
| `LLM_API_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | 大模型配置，如 DeepSeek：`https://api.deepseek.com/v1` / 你的 Key / `deepseek-chat` |

## 4. 初始化数据库

部署成功后，在本地跑一次（指向同一个 `DATABASE_URL`）：

```bash
DATABASE_URL="<你的连接串>" pnpm prisma migrate deploy
DATABASE_URL="<你的连接串>" pnpm prisma:seed
```

## 5. 配置定时任务（自动化 AI 分析）

Vercel → 项目 → Cron Jobs，添加定时任务指向站内的 cron 接口
（路径对照 `src/app/api` 下的 cron 相关路由），Header 带上 `Authorization: Bearer <CRON_SECRET>`，
分别对应：赛事同步、赛前分析生成、赛果同步与赛后复盘。

## 6. 完成

访问 Vercel 分配的域名即是移动端 H5；`/admin` 进管理后台。
把演示地址填回 README 的"在线演示"一节，涨星效果最好。

*合规提示：演示站同样适用 README 中的合规声明——仅作数据分析与内容参考，不承诺收益、不接投注。*
