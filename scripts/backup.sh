#!/usr/bin/env bash
# Nightly backup. The database is tiny (a ~12KB gzipped dump), so this keeps a
# long history for almost nothing. Uploads are far bigger and rarely change, so
# they're mirrored rather than versioned.
#
# Scope: this protects against the likely failures — a bad migration, a wrong
# DELETE, a broken deploy. It does NOT protect against losing the VPS itself,
# because it writes to the same disk. Offsite copies need a destination.
set -euo pipefail

BACKUP_DIR="/opt/finde/backups"
KEEP_DAYS=30
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR/db"

# ── Database ────────────────────────────────────────────────────────────────
DB_FILE="$BACKUP_DIR/db/finde-$STAMP.sql.gz"
docker exec finde-postgres-1 pg_dump -U finde -d finde | gzip -9 > "$DB_FILE"

# A dump that can't be read back is not a backup — verify before rotating.
if ! gzip -t "$DB_FILE" 2>/dev/null; then
  echo "[backup] FAILED: $DB_FILE is not a valid gzip" >&2
  rm -f "$DB_FILE"
  exit 1
fi
if [ "$(zcat "$DB_FILE" | grep -c 'CREATE TABLE')" -lt 10 ]; then
  echo "[backup] FAILED: $DB_FILE has too few tables — refusing to rotate" >&2
  rm -f "$DB_FILE"
  exit 1
fi

echo "[backup] db ok: $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

# ── Uploads ─────────────────────────────────────────────────────────────────
# Mirror, not history: images are content-addressed by filename and never
# rewritten, so a copy of the current set is all that's recoverable anyway.
docker cp finde-app-1:/app/uploads "$BACKUP_DIR/uploads-new" >/dev/null 2>&1
rm -rf "$BACKUP_DIR/uploads"
mv "$BACKUP_DIR/uploads-new" "$BACKUP_DIR/uploads"
echo "[backup] uploads ok: $(du -sh "$BACKUP_DIR/uploads" | cut -f1)"

# ── Rotation ────────────────────────────────────────────────────────────────
find "$BACKUP_DIR/db" -name 'finde-*.sql.gz' -mtime "+$KEEP_DAYS" -delete
echo "[backup] done — keeping $(ls -1 "$BACKUP_DIR/db" | wc -l) db snapshots"
