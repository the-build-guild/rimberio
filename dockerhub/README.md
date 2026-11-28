# Rimberio

A self-hosted WhatsApp team inbox and automation API with an operator console, webhooks, an event stream and an n8n community integration.

**Image:** `{{REPOSITORY}}:{{VERSION}}` · **Platforms:** Linux AMD64 and ARM64

```sh
docker pull {{REPOSITORY}}:{{VERSION}}
```

The image requires PostgreSQL and persistent storage. Use the installer or Compose deployment below to provision them together.

## Install with automatic HTTPS

Use an Ubuntu or Debian VPS with persistent storage, at least 2 GB RAM for one linked number, and Docker Compose. We recommend 4 GB RAM; additional linked numbers need roughly 1 GB each for Chromium.

Point your domain to the server, allow TCP 80/443, then run:

```sh
curl -fsSL https://raw.githubusercontent.com/the-build-guild/rimberio/main/install.sh -o install-rimberio.sh
sudo env RIMBERIO_DOMAIN=chat.example.com bash install-rimberio.sh
```

The installer provisions Docker when needed, PostgreSQL, persistent volumes and Caddy for automatic HTTPS. It generates fresh credentials in the server's protected `.env` file. Open your HTTPS URL to create the owner account, activate the installation and link WhatsApp.

For manual Compose deployment, provider instructions, cloud-init and Terraform:

- [Deployment guide](https://github.com/the-build-guild/rimberio/tree/main/deploy)
- [Compose file](https://github.com/the-build-guild/rimberio/blob/main/docker-compose.yml)
- [Hetzner and DigitalOcean automation](https://github.com/the-build-guild/rimberio/tree/main/deploy/terraform)

## Features

- Operator inbox with cached conversations, paginated history, media and live updates.
- REST API, webhooks, Server-Sent Events, queued sends and auto-reply rules.
- Multiple WhatsApp numbers, scoped API keys, audit logs and session backup tools.
- n8n community package: [`@thebuildguild/n8n-nodes-rimberio`](https://www.npmjs.com/package/@thebuildguild/n8n-nodes-rimberio).
- Optional Swagger reference at `/api-docs`, controlled from the console.
- Update notices in the console, and one-click updates with automatic backup and rollback on servers set up with the installer.

[API documentation](https://github.com/the-build-guild/rimberio/blob/main/endpoints.md) · [n8n examples](https://github.com/the-build-guild/rimberio/blob/main/examples/n8n.md)

## Configuration and persistence

The application listens on port **3000** inside the container. Mount persistent storage at **`/data`** for linked-session profiles and connect a persistent PostgreSQL database. The supplied Compose file configures both. Keep the application behind HTTPS and leave the database inaccessible from the public Internet.

`GET /v1/health/live` is the unauthenticated liveness endpoint. Detailed health at `/v1/health` requires authentication.

## Versions and upgrades

Use the exact release tag `{{VERSION}}` for predictable deployments. `latest` tracks the current release. The console shows when a newer release exists (set `DISABLE_UPDATE_CHECK=true` to turn the daily check off). Servers set up with the installer can install it from Settings ▸ Updates, with an automatic backup and rollback. To update by hand, back up PostgreSQL and session data, update the image version in Compose, then run:

```sh
docker compose pull
docker compose up -d --wait
```

Retain the existing `.env` file and named volumes. Container replacement preserves linked sessions only when their data remains mounted. See the [release notes](https://github.com/the-build-guild/rimberio/blob/main/CHANGELOG.md).

## Licensing and account safety

The Rimberio application requires an active license; the n8n plugin is MIT-licensed. Rimberio uses an unofficial WhatsApp Web client and cannot guarantee account safety or uninterrupted compatibility with WhatsApp changes. Use consent-based messaging and conservative limits.

## Support

[Report an issue](https://github.com/the-build-guild/rimberio/issues) with your version, expected behavior and sanitized diagnostics. Never publish tokens, `.env` files, session backups or customer messages.
