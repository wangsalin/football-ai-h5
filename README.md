# Football AI H5

Football AI H5 is a mobile-first football content platform for match information, AI-assisted pre-match analysis, post-match reviews, advertising placements, and an admin console.

The product boundary is content and data analysis. It does not sell lottery tickets, does not connect to betting platforms, and must not be used to provide betting instructions, guaranteed returns, following orders, or similar gambling-related services.

## Features

- Mobile H5 pages: home, match list, match detail, review list, ads page, login, and user center.
- Admin console: dashboard, users, matches, predictions, reviews, ads, model settings, automation settings, SMS settings, and WeChat settings.
- AI workflow: configurable provider, API base URL, API key, model name, temperature, web search toggle, system prompt, and user prompt template.
- Automation: match sync, daily predictions, pre-kickoff reanalysis, score sync, and post-match reviews.
- Data snapshots: China Sports Lottery match list, odds snapshots, and result snapshots through replaceable source services.
- Advertising: banner ads, ad events, leads, advertiser-facing pages, and admin review flow.
- Compliance guardrails: sensitive-word checks and visible non-gambling disclaimers.

## Tech Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Prisma and PostgreSQL
- Redis
- Zod
- Vitest
- Playwright

## Quick Start

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

Open `http://localhost:3000`.

## Common Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:deploy
pnpm prisma:seed
pnpm prisma studio
```

## Environment Variables

See `.env.example` and `.env.production.example`.

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `REDIS_URL` | Redis connection string. |
| `JWT_SECRET` | Session signing secret. Use a strong random value in production. |
| `APP_URL` | Public site origin. |
| `MOCK_SMS` | Use mock SMS provider in local development. |
| `MOCK_LLM` | Use mock LLM provider in local development. |
| `OPENAI_API_KEY` | Optional LLM API key fallback. Admin settings can also store this value. |
| `CRON_SECRET` | Secret for scheduled job API calls. |
| `UPLOAD_DIR` | Upload directory. |

Never commit real `.env` files, API keys, database credentials, SMS credentials, WeChat secrets, or server passwords.

## Data Sources

The current source services are intentionally isolated under `src/services/*-source.ts` so they can be replaced with authorized production APIs.

Default source implementations may parse publicly reachable pages for development or demonstration. Before production use, verify that your data provider, usage, caching, and redistribution are legally permitted in your jurisdiction.

## Compliance

This project must be used only for football content, entertainment, and data-analysis reference. It does not constitute betting advice and does not promise accuracy or returns.

Recommended product copy:

> This product explicitly prohibits gambling, order following, lottery purchasing, and any betting-related behavior. Content is for entertainment and data-analysis reference only and does not constitute betting advice or guarantee any return.

## Production Deployment

See:

- `docs/DEPLOYMENT.md`
- `docs/LAUNCH_CHECKLIST.md`
- `docs/BACKOFFICE_GUIDE.md`

Production checklist:

- Rotate all secrets before deployment.
- Configure a real PostgreSQL database and Redis instance.
- Set `MOCK_SMS=false` and configure a real SMS provider if public registration/login is enabled.
- Configure model provider, API endpoint, API key, model name, and prompts in the admin console.
- Replace demo accounts and passwords.
- Confirm non-gambling copy is visible on user-facing pages.

## Security

See `SECURITY.md`.

If you discover a vulnerability, do not open a public issue with exploit details. Report it privately to the maintainer.

## License

MIT. See `LICENSE`.
