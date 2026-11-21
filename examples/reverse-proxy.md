# Putting HTTPS in front of Rimberio

The domain-based installer configures Caddy and HTTPS automatically. Use the manual examples below for an existing proxy or a localhost-only installation. Keep TLS enabled for internet-facing access.

Whichever you choose, also set `TRUST_PROXY=true` in `.env` afterwards — without it the audit
log records your proxy's IP for every request instead of the real client's.

## Caddy (recommended)

Certificates are obtained and renewed automatically. The entire config:

```caddyfile
wapi.example.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Point `wapi.example.com`'s DNS A record at the server first — Caddy needs to answer a challenge
on port 80 to get the certificate.

## Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name wapi.example.com;

    ssl_certificate     /etc/letsencrypt/live/wapi.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wapi.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Server-sent events: /v1/events is a long-lived stream. Without these three
        # lines nginx buffers it and the console's live feed appears to hang.
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;

        # Media uploads go through as request bodies; the default 1m limit rejects them.
        client_max_body_size 64m;
    }
}

server {
    listen 80;
    server_name wapi.example.com;
    return 301 https://$host$request_uri;
}
```

Get the certificate with `sudo certbot --nginx -d wapi.example.com`.

## Do not expose the database

The bundled compose file deliberately does not publish Postgres to the host. If you have added
a `ports:` entry to the `db` service, remove it — only the app container needs to reach it.

## Restricting access further

The console and API share one origin, so a proxy-level IP allowlist protects both:

```caddyfile
wapi.example.com {
    @blocked not remote_ip 203.0.113.0/24 198.51.100.7
    respond @blocked 403
    reverse_proxy localhost:3000
}
```

Useful when only your office and your n8n host ever need to reach it. It does not replace the
bridge token — it is a second lock, not a substitute.
