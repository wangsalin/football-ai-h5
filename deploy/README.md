# Deploy Assets

This folder contains deployment templates for a single Ubuntu server:

- `nginx.football-ai-h5.conf`: Nginx reverse proxy and HTTPS site config.
- `football-ai-h5.service`: systemd service for `pnpm start`.
- `cron.example`: cron jobs for match sync, automatic predictions, and automatic reviews.

Replace every `example.com` and `CHANGE_ME_*` value before using these files.
