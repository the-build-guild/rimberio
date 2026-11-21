#!/usr/bin/env bash
# Install the published image only. No private application source is downloaded.
set -euo pipefail
umask 077
RAW_BASE="${RIMBERIO_RAW_BASE:-https://raw.githubusercontent.com/buildtheguild/rimberio/main}"
INSTALL_DIR="${RIMBERIO_INSTALL_DIR:-/opt/rimberio}"
PORT="${RIMBERIO_PORT:-3000}"
DOMAIN="${RIMBERIO_DOMAIN:-}"
[[ "$PORT" =~ ^[0-9]+$ ]] && ((PORT >= 1 && PORT <= 65535)) || { echo 'Invalid port' >&2; exit 1; }
[[ -z "$DOMAIN" || "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$ ]] || { echo 'Use a domain name without a scheme or path' >&2; exit 1; }
if [[ $(id -u) != 0 ]]; then
  echo 'Run with sudo bash (or as root).' >&2; exit 1
fi
case "$(uname -m)" in x86_64|aarch64|arm64) ;; *) echo 'Unsupported CPU: use x86_64 or ARM64 Linux.' >&2; exit 1;; esac
if ! command -v curl >/dev/null || ! command -v openssl >/dev/null; then
  command -v apt-get >/dev/null || { echo 'Install curl and openssl first.' >&2; exit 1; }
  apt-get update -qq
  apt-get install -y curl openssl ca-certificates
fi
if ! command -v docker >/dev/null; then
  curl -fsSL --retry 3 https://get.docker.com -o /tmp/rimberio-get-docker.sh
  sh /tmp/rimberio-get-docker.sh
  systemctl enable --now docker
fi
docker compose version >/dev/null || { echo 'Install the Docker Compose plugin first.' >&2; exit 1; }
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
if [[ ! -f docker-compose.yml ]]; then
  curl -fsSL --retry 3 "$RAW_BASE/docker-compose.yml" -o docker-compose.yml.download
  mv docker-compose.yml.download docker-compose.yml
fi
if [[ ! -f .env ]]; then
  cat > .env <<EOF
BRIDGE_TOKEN=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 32)
PORT=$PORT
BIND_ADDRESS=127.0.0.1
MAX_SESSIONS=1
AUTH_SIGNUP_MODE=first-user
AUTH_REQUIRE_HTTPS=true
ENABLE_API_DOCS=false
EOF
fi
chmod 600 .env
if [[ -n "$DOMAIN" && ! -f docker-compose.override.yml ]]; then
  printf '\nRIMBERIO_DOMAIN=%s\nTRUST_PROXY=true\n' "$DOMAIN" >> .env
  cat > Caddyfile <<'EOF'
{$RIMBERIO_DOMAIN} {
  encode zstd gzip
  reverse_proxy rimberio:3000 {
    flush_interval -1
  }
}
EOF
  cat > docker-compose.override.yml <<'EOF'
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    environment:
      RIMBERIO_DOMAIN: ${RIMBERIO_DOMAIN:?Set RIMBERIO_DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
volumes:
  caddy_data:
  caddy_config:
EOF
fi
docker compose config --quiet
docker compose pull
docker compose up -d --wait --wait-timeout 300
echo "Rimberio is healthy. Configuration: $INSTALL_DIR/.env (root-only)."
echo 'No token is printed to the console or cloud-init logs.'
if [[ -n "$DOMAIN" ]]; then
  echo "Open https://$DOMAIN and create the owner account immediately."
  echo 'DNS must point to this server. Allow TCP 80/443 and your SSH port.'
else
  echo "Listening on localhost only. Forward port $PORT over SSH, or configure HTTPS."
  echo 'For production, rerun with RIMBERIO_DOMAIN set to your domain.'
fi
