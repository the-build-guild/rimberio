# Deploy Rimberio

Use Ubuntu 24.04 or Debian 12+, a persistent SSD, and at least 2 GB RAM for one linked number (4 GB recommended). Additional numbers need roughly 1 GB each. Published Linux images cover AMD64 and ARM64; Windows/macOS users run them through Docker's Linux engine.

## Any VPS: one command

Point a domain's A/AAAA records to the server. Allow your SSH port and TCP 80/443 in the provider firewall. On the server:

```sh
curl -fsSL https://raw.githubusercontent.com/buildtheguild/rimberio/main/install.sh -o install-rimberio.sh
sudo env RIMBERIO_DOMAIN=chat.example.com bash install-rimberio.sh
```

The installer generates root-only secrets, starts Postgres and Rimberio, and configures Caddy for automatic HTTPS. Open the URL and create the owner account immediately. No secrets are printed to provisioning logs. The root API token is in `/opt/rimberio/.env`; use scoped API keys for integrations.

Rerunning preserves `.env`, the Compose file and persistent volumes. Without a domain, it binds only to localhost; configure HTTPS before normal browser sign-in. Use `sudo docker compose` from `/opt/rimberio` for management.

## Hetzner

Create an Ubuntu server, select a public IP and your SSH key, and paste [cloud-init.yml](cloud-init.yml) into **Cloud config**, replacing the example domain. This provisions Rimberio automatically on first boot. See [Hetzner Cloud config](https://docs.hetzner.com/cloud/servers/getting-started/creating-a-server/). ARM64 servers use the same image name.

## DigitalOcean

Create an Ubuntu Droplet, add your SSH key, and enable **Advanced options → Add initialization scripts / User data**. Paste [cloud-init.yml](cloud-init.yml), replacing the example domain. Use the cloud firewall to allow SSH and web traffic. See [DigitalOcean user data](https://docs.digitalocean.com/products/droplets/how-to/provide-user-data/).

## Hostinger

Choose an Ubuntu VPS with Docker, SSH in, then run the command above. Alternatively, Docker Manager can import [docker-compose.yml](../docker-compose.yml); configure the required variables and persistent volumes, then add an HTTPS reverse proxy. The command installer handles HTTPS automatically. This requires VPS hosting, not shared web hosting.

## Other providers

Vultr, Linode/Akamai, OVH and other Linux VPS providers use the same installer. Providers supporting cloud-init can use the same template. Containers must have a persistent `/data` volume, a reachable Postgres and enough RAM for Chromium; sleeping or ephemeral-only free tiers are unsuitable.

These are automated installation templates, not approved provider Marketplace apps. Official one-click catalog buttons require provider review and publication; no approved Marketplace listing is claimed.

## Backup, upgrade and recovery

Back up BOTH Postgres and the `rimberio_data` volume. Session backups contain credentials; encrypt and restrict access. Before upgrading, create a database dump and a session backup from the console. Change the pinned image version in Compose, then run `docker compose pull && docker compose up -d --wait`. Never use `down -v` unless intentionally deleting all data. Restoring an older image may also require restoring the matching database backup after schema changes.

Inspect status with `docker compose ps` and recent logs with `docker compose logs --tail 100`. Check `/v1/health/live` for liveness and authenticated `/v1/health` for detailed health. Reboot the VPS to verify persistence before linking business numbers.

ARMv7 is excluded from 0.3.0: the current Alpine release no longer provides Chromium on that architecture. Use a 64-bit OS and ARM64 hardware instead.
