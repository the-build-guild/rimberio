# Rimberio

Self-hosted WhatsApp API, operator inbox and n8n integration. This public repository contains deployment files, documentation, examples and the MIT-licensed n8n community plugin. Application source remains private; deployment uses prebuilt Docker images.

## Deploy

Use a Linux VPS with at least 2 GB RAM (4 GB recommended), persistent storage, Docker and Compose. The image is `thebuildguild/rimberio:0.3.2` (also tagged `latest`), with Linux AMD64 and ARM64 support. Docker selects the matching architecture automatically.

```sh
curl -fsSL https://raw.githubusercontent.com/the-build-guild/rimberio/main/install.sh -o install-rimberio.sh
sudo env RIMBERIO_DOMAIN=chat.example.com bash install-rimberio.sh
```

Point your domain to the server first and allow ports 80/443. The installer generates secrets, starts Postgres and configures automatic HTTPS with Caddy. Open the site and create the owner account immediately. Without a domain it binds to localhost for setup only.

[Deployment guide](deploy/README.md): Hostinger, Hetzner, DigitalOcean and other VPS providers, including automatic cloud-init installation. Provider Marketplace listings require separate approval; these templates do not imply such approval.

For manual installation, copy `docker-compose.yml` and `.env.example`, generate the required secrets, then run `docker compose up -d --wait`. Keep the default localhost binding until an HTTPS reverse proxy is configured. Data and linked-session credentials persist in Docker volumes.

## Features and documentation

- Operator console: conversations, paginated history, media, calls, contacts, groups, status and channels.
- REST API, webhooks, SSE event feed, queued sends and auto-reply rules.
- Scoped API keys, audit logs, session backup and operational diagnostics.
- [API guide](endpoints.md); enable Swagger in Settings to browse your instance's exact API at `/api-docs`. Download its OpenAPI document at `/api-docs-json`.
- [n8n examples](examples/n8n.md) and [reverse proxies](examples/reverse-proxy.md).
- [Release notes](CHANGELOG.md).

## n8n

In self-hosted n8n, open Settings ▸ Community nodes and install `@thebuildguild/n8n-nodes-rimberio`. Use a scoped API key; the trigger requires admin scope to register its webhook. [Plugin source and documentation](plugins/n8n-nodes-rimberio/README.md).

The 0.1.12 plugin supports chat pagination, cursor-based history and browser-compatible video download on Rimberio 0.3.0. It does not fetch every conversation's history during initial loading.

## Upgrades and backups

Rimberio checks the public release list once a day and shows a notice in the console when a newer version exists. Nothing about your installation is sent; set `DISABLE_UPDATE_CHECK=true` to turn the check off.

On a server set up with `install.sh`, an owner or admin can install the update from **Settings ▸ Updates**. The server backs up the database and every linked number's login, switches to the new version and restarts (a minute or two offline). If the new version does not start, it restores the backup and the previous version automatically. Installs from before one-click updates gain them by running `install.sh` again.

To update by hand: compose pins the application version. Back up Postgres and session data before changing that tag, then run `docker compose pull && docker compose up -d --wait`. Do not delete named volumes during an upgrade. See the [deployment guide](deploy/README.md#backup-upgrade-and-recovery).

## Account safety and licensing

Rimberio uses an unofficial WhatsApp Web client. It cannot guarantee account safety or uninterrupted compatibility with WhatsApp changes. Use consent-based messaging and conservative limits. The application requires an active Rimberio license; the n8n plugin is MIT-licensed. Do not link a number you cannot afford to lose.

## Support

Open an issue with your version, expected behavior and sanitized diagnostics. Never post tokens, `.env`, session backups or customer messages.
