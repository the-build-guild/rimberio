#!/usr/bin/env bash
# Install the published image only. No private application source is downloaded.
set -euo pipefail
umask 077
RAW_BASE="${RIMBERIO_RAW_BASE:-https://raw.githubusercontent.com/the-build-guild/rimberio/main}"
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
if [[ -f docker-compose.yml ]] && ! grep -q '/updates/request.json' docker-compose.yml; then
  # An install from before one-click updates: take the current compose file (which also moves
  # this install to the current release). The old file is kept next to it.
  cp -p docker-compose.yml "docker-compose.yml.before-updater-$(date -u +%Y%m%d%H%M%S)"
  rm -f docker-compose.yml
  echo 'Refreshing docker-compose.yml to enable one-click updates (previous copy kept).'
fi
if [[ ! -f docker-compose.yml ]]; then
  curl -fsSL --retry 3 "$RAW_BASE/docker-compose.yml" -o docker-compose.yml.download
  mv docker-compose.yml.download docker-compose.yml
fi

# One-click updates. Rimberio (uid 1000 in its container) writes update requests into
# ./updates; rimberio-updater runs on this host as root, outside any container, when a request
# appears (systemd path unit) and writes the outcome back. See the comments in the script.
# updates/ belongs to the container's user, so this script (root) only renames finished files
# into it and never writes through a path inside it.
mkdir -p updates
chown 1000:1000 updates
chmod 0755 updates
updater_ready=false
if command -v systemctl >/dev/null && [[ -d /run/systemd/system ]]; then
  download_dir="$(mktemp -d)"
  for file in rimberio-updater rimberio-updater.path rimberio-updater.service; do
    curl -fsSL --retry 3 "$RAW_BASE/updater/$file" -o "$download_dir/$file"
  done
  install -m 0755 "$download_dir/rimberio-updater" /usr/local/bin/rimberio-updater
  for unit in rimberio-updater.path rimberio-updater.service; do
    sed "s#@INSTALL_DIR@#$INSTALL_DIR#g" "$download_dir/$unit" > "/etc/systemd/system/$unit"
    chmod 0644 "/etc/systemd/system/$unit"
  done
  rm -rf -- "$download_dir"
  systemctl daemon-reload
  systemctl enable --now rimberio-updater.path >/dev/null
  # Tells the app the host side is in place, so the console offers the Install button.
  agent_file="$(mktemp "$INSTALL_DIR/.agent.XXXXXX")"
  printf '{"updater":"rimberio-updater","installedAt":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$agent_file"
  chmod 0644 "$agent_file"
  mv -fT "$agent_file" updates/agent.json
  updater_ready=true
else
  rm -f updates/agent.json
  echo 'systemd not found: one-click updates are off. Update by hand as described in the README.'
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
if [[ "$updater_ready" == true ]]; then echo 'One-click updates are enabled (Settings > Updates).'; fi
echo 'No token is printed to the console or cloud-init logs.'
if [[ -n "$DOMAIN" ]]; then
  echo "Open https://$DOMAIN and create the owner account immediately."
  echo 'DNS must point to this server. Allow TCP 80/443 and your SSH port.'
else
  echo "Listening on localhost only. Forward port $PORT over SSH, or configure HTTPS."
  echo 'For production, rerun with RIMBERIO_DOMAIN set to your domain.'
fi
