#!/usr/bin/env bash
# Server-side auto-deploy: poll git, redeploy when origin/main moves.
# Invoked every minute by the finde-deploy.timer systemd unit.
set -euo pipefail

cd /opt/finde

git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "[$(date -Is)] new commit $REMOTE — deploying"
git reset --hard origin/main
docker compose up -d --build
# keep DB schema in sync (idempotent)
docker compose run --rm -T app pnpm --filter @workspace/db push-force || true
docker image prune -f
echo "[$(date -Is)] deploy done"
