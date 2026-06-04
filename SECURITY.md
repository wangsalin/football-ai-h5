# Security Policy

## Supported Versions

This repository is provided as an open-source project. Security fixes should target the latest `main` branch unless a maintainer explicitly creates release branches.

## Reporting a Vulnerability

Please do not open a public issue with exploit details.

Report privately to the repository maintainer with:

- Affected route, API, component, or deployment file.
- Reproduction steps.
- Expected impact.
- Suggested fix, if available.

## Secret Handling

Never commit:

- `.env` or `.env.*` files, except `.env.example` and `.env.production.example`.
- API keys.
- Database URLs.
- SMS provider credentials.
- WeChat AppSecret, token, or EncodingAESKey.
- Server IPs, passwords, SSH keys, or private deployment credentials.

If a secret was committed or shared publicly, rotate it immediately. Removing it from git history is not enough.

## Production Notes

- Use strong `JWT_SECRET` and `CRON_SECRET` values.
- Keep `MOCK_SMS=false` and `MOCK_LLM=false` in production.
- Use HTTPS.
- Restrict admin access and rotate default accounts.
- Confirm that all user-facing analysis includes non-gambling disclaimers.
- Use authorized data providers for production match, odds, and result data.
