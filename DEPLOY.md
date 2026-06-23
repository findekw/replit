# Deployment (self-hosted VPS)

Single-VPS stack via Docker Compose. No cloud dependencies — Postgres, file
uploads, and automation all run on the server.

## Architecture
- **web** (Caddy) — serves the built SPA, reverse-proxies `/api/*` → `app`. Port 80.
- **app** (Express api-server) — REST API; serves uploaded images from a volume.
- **postgres** — app database (internal network only, not exposed publicly).
- **n8n** — automation UI at `http://<server-ip>:5678`.

Uploads (property images + office logos) are stored on disk in the `uploads`
volume and served at `/api/uploads/*`. Sessions are signed cookies (no DB needed
for auth). Object storage (Google Cloud) is **not** used.

## First-time server setup
```bash
# on the VPS (Ubuntu 24.04)
apt-get update && apt-get install -y docker.io docker-compose-plugin git
mkdir -p /opt/finde && cd /opt/finde
git clone https://github.com/findekw/replit .
# copy the .env (NOT in git) into /opt/finde/.env   (done via scp)
docker compose up -d --build
docker compose run --rm -T app pnpm --filter @workspace/db push-force   # create tables
```
App: `http://<server-ip>/`  •  n8n: `http://<server-ip>:5678/`

## Auto-deploy (GitHub Actions)
On push to `main`, `.github/workflows/deploy.yml` SSHes into the server and runs
`git reset --hard origin/main && docker compose up -d --build` + DB sync.

Required repo secrets (Settings → Secrets → Actions):
- `SSH_HOST` — server IP
- `SSH_USER` — `root`
- `SSH_KEY`  — private key whose public key is in the server's `authorized_keys`

## Adding a domain later
In `Caddyfile`, replace `:80` with `your-domain.com` (and add `n8n.your-domain.com`
reverse-proxying to `n8n:5678`). Caddy issues Let's Encrypt certs automatically.
Point the domain's A record at the server IP first.

## Env vars
See `.env.example`. Real values live only in `/opt/finde/.env` on the server.
