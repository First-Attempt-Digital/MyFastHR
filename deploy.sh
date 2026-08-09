#!/bin/bash

# MyFastHR Zero-Downtime Deployment & Rollback Script
# Designed for PM2 + Node.js + Nginx Stack

set -e

# Configuration
APP_DIR="/var/www/MyFastHR"
BACKUP_DIR="/var/www/MyFastHR_backups"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PM2_APP_NAME="myfasthr"

# Load DB credentials from backend .env (never hardcode secrets in this file!)
if [ -f "${BACKEND_DIR}/.env" ]; then
    DB_NAME=$(grep -E '^DB_NAME=' "${BACKEND_DIR}/.env" | cut -d '=' -f2- | tr -d '"')
    DB_USER=$(grep -E '^DB_USER=' "${BACKEND_DIR}/.env" | cut -d '=' -f2- | tr -d '"')
    DB_PASS=$(grep -E '^DB_PASSWORD=' "${BACKEND_DIR}/.env" | cut -d '=' -f2- | tr -d '"')
else
    echo "[DEPLOY-ERROR] backend/.env not found! DB credentials missing."
    exit 1
fi

mkdir -p "${BACKUP_DIR}"

# Logging Helper
log() {
    echo -e "\033[1;32m[DEPLOY-LOG] $1\033[0m"
}

error() {
    echo -e "\033[1;31m[DEPLOY-ERROR] $1\033[0m" >&2
}

# Run Rollback Action
rollback() {
    log "Initiating rollback procedure..."
    
    # Pick the newest backup whose archive is actually usable, not merely the newest
    # directory. Never delete the live trees until that is confirmed: backend/uploads/
    # is gitignored, so restoring from a bad archive means KYC docs, task attachments
    # and profile photos are gone for good.
    #
    # Walking back to an older valid backup matters because a deploy that failed while
    # writing its own archive (disk full, for example) leaves a truncated files.tar.gz
    # in the NEWEST directory. Stopping at that one would strand the operator with no
    # rollback at all, even though a perfectly good archive sits in the previous
    # directory. This also covers `--rollback` run by hand against older archives that
    # were never validated at creation time.
    LATEST_BACKUP=""
    for CANDIDATE in $(ls -td ${BACKUP_DIR}/deploy_backup_* 2>/dev/null); do
        if [ ! -s "${CANDIDATE}/files.tar.gz" ]; then
            error "Skipping ${CANDIDATE}: archive missing or empty."
            continue
        fi
        if ! tar -tzf "${CANDIDATE}/files.tar.gz" > /dev/null 2>&1; then
            error "Skipping ${CANDIDATE}: archive is corrupt or truncated."
            continue
        fi
        LATEST_BACKUP="${CANDIDATE}"
        break
    done

    if [ -z "${LATEST_BACKUP}" ]; then
        error "No usable backup found to rollback to!"
        error "Refusing to delete the live code/uploads. Rollback aborted."
        error "Inspect ${BACKUP_DIR} by hand before retrying — the live tree is untouched."
        exit 1
    fi

    log "Restoring files from: ${LATEST_BACKUP}"

    # Restore codebase files
    rm -rf "${BACKEND_DIR}" "${FRONTEND_DIR}"
    tar -xzf "${LATEST_BACKUP}/files.tar.gz" -C "${APP_DIR}"
    
    # Restore Database
    if [ -f "${LATEST_BACKUP}/db.sql" ]; then
        log "Restoring database snapshot..."
        mysql -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "${LATEST_BACKUP}/db.sql"
    fi
    
    log "Reloading PM2 instances..."
    pm2 reload "${PM2_APP_NAME}" || pm2 restart "${PM2_APP_NAME}"
    
    log "Rollback completed successfully!"
}

# Check argument for manual rollback
if [ "$1" == "--rollback" ]; then
    rollback
    exit 0
fi

# Main Deployment Flow
log "Starting Deployment Prep..."

# 1. Database Backup
log "Backing up live database..."
CURRENT_BACKUP_PATH="${BACKUP_DIR}/deploy_backup_${TIMESTAMP}"
mkdir -p "${CURRENT_BACKUP_PATH}"

mysqldump --no-tablespaces -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" > "${CURRENT_BACKUP_PATH}/db.sql"

# 2. File Backup
# This archive is the ONLY thing standing between a failed deploy and permanent data
# loss: rollback() does `rm -rf backend frontend` and then restores from it. uploads/
# (KYC docs, task attachments, profile photos, branding) is gitignored, so if this
# archive is empty or truncated the rollback deletes those files and restores nothing.
# It previously ran with `2>/dev/null || true`, which discarded stderr AND swallowed a
# non-zero exit — a disk-full or unreadable file produced a broken archive and armed a
# destructive rollback silently. Now: tar exit 1 is tolerated (it means "file changed as
# we read it", which is expected since PM2 writes backend/logs/ during the archive),
# exit >= 2 is fatal, and the archive is verified to actually contain both trees.
log "Archiving active code assets..."
# tar's stderr goes to a temp file OUTSIDE the backup directory on purpose. The most
# likely fatal cause here is the backup filesystem being full — and if the stderr file
# lived in that same full filesystem, the diagnostic would itself fail to write and the
# operator would get an empty error at exactly the moment they need the reason.
TAR_STDERR=$(mktemp /tmp/myfasthr_deploy_tar_stderr.XXXXXX)
TAR_STATUS=0
tar -czf "${CURRENT_BACKUP_PATH}/files.tar.gz" -C "${APP_DIR}" backend frontend \
    2> "${TAR_STDERR}" || TAR_STATUS=$?

if [ "${TAR_STATUS}" -ge 2 ]; then
    error "File backup failed (tar exit ${TAR_STATUS}). Aborting BEFORE any destructive step."
    error "tar stderr:"
    cat "${TAR_STDERR}" >&2
    error "(If this is empty, check free disk space on ${BACKUP_DIR} — a full filesystem"
    error " kills the archive without tar always emitting a message.)"
    rm -f "${TAR_STDERR}"
    exit 1
fi

rm -f "${TAR_STDERR}"

if [ "${TAR_STATUS}" -eq 1 ]; then
    log "Note: tar reported files changed during archiving (expected for live logs); continuing."
fi

# Verify the archive is readable and actually holds both trees, so a rollback has
# something real to restore. A truncated/empty archive must never reach rollback().
if ! tar -tzf "${CURRENT_BACKUP_PATH}/files.tar.gz" > /dev/null 2>&1; then
    error "File backup is unreadable/corrupt. Aborting BEFORE any destructive step."
    exit 1
fi
for REQUIRED_TREE in backend frontend; do
    if ! tar -tzf "${CURRENT_BACKUP_PATH}/files.tar.gz" | grep -q "^${REQUIRED_TREE}/"; then
        error "File backup is missing the '${REQUIRED_TREE}/' tree. Aborting BEFORE any destructive step."
        exit 1
    fi
done
log "File backup verified ($(du -h "${CURRENT_BACKUP_PATH}/files.tar.gz" | cut -f1))."

# Hook for rollback on failure
trap 'error "Deployment failed! Reverting to backup..."; rollback; exit 1' ERR

# 3. Pull Repository Updates
log "Pulling latest version from branch..."
git pull origin main

# 4. Install backend dependencies
log "Installing server dependencies..."
cd "${BACKEND_DIR}"
npm install --omit=dev

# 5. Install frontend dependencies and build frontend
log "Installing frontend dependencies & building production bundle..."
cd "${FRONTEND_DIR}"
npm install
npm run build

# 6. Publish build output to the backend static path.
# Done as a rename, NOT as `rm -rf public && cp -r dist/* public/`. Express serves this
# exact directory (see `express.static(path.join(__dirname, '../public'))` in app.js), so
# deleting it and copying ~17MB back in leaves a 1-3 second window during which every
# asset request 404s and anyone loading the app gets a blank/broken page. Staging the new
# tree in a sibling directory and renaming it into place shrinks that window from seconds
# to the two rename syscalls below.
log "Publishing static assets to backend public route..."
PUBLIC_DIR="${BACKEND_DIR}/public"
PUBLIC_NEW="${BACKEND_DIR}/public_new"
PUBLIC_OLD="${BACKEND_DIR}/public_old"

rm -rf "${PUBLIC_NEW}" "${PUBLIC_OLD}"
mkdir -p "${PUBLIC_NEW}"
cp -r "${FRONTEND_DIR}/dist/"* "${PUBLIC_NEW}/"

# Never swap in a tree that has no entry point. Without this the deploy would happily
# publish an empty directory: the healthcheck below only probes /api, which answers 200
# regardless of whether any frontend asset exists, so a broken build would pass unnoticed.
if [ ! -f "${PUBLIC_NEW}/index.html" ]; then
    error "Frontend build produced no index.html. NOT swapping."
    error "The previously published frontend stays live and untouched. Investigate the build."
    rm -rf "${PUBLIC_NEW}"
    # Deliberately bypass the ERR trap. Reaching rollback() here would restore db.sql and
    # thereby discard every attendance punch recorded since the backup was taken -- a far
    # worse outcome than a stale frontend, especially since the schema is unchanged and the
    # already-published frontend is still perfectly serviceable.
    trap - ERR
    exit 1
fi

# Both renames are on the same filesystem, so each is atomic. The gap between them is
# microseconds rather than the seconds a recursive copy would take.
if [ -d "${PUBLIC_DIR}" ]; then
    mv "${PUBLIC_DIR}" "${PUBLIC_OLD}"
fi
mv "${PUBLIC_NEW}" "${PUBLIC_DIR}"
rm -rf "${PUBLIC_OLD}"

# 7. Reload backend cluster zero-downtime
log "Reloading processes via PM2..."
cd "${APP_DIR}"
pm2 reload ecosystem.config.js --env production || pm2 reload "${PM2_APP_NAME}"

# 8. Post-deployment self-check verification
log "Verifying server response..."

MAX_RETRIES=15
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api || true)
    if [ "${RESPONSE_CODE}" -eq 200 ] || [ "${RESPONSE_CODE}" -eq 302 ]; then
        SUCCESS=true
        break
    fi
    log "Waiting for web service... (Attempt $((RETRY_COUNT+1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ "$SUCCESS" = false ]; then
    error "Web service is not responsive after ${MAX_RETRIES} attempts. Tracing error logs..."
    pm2 logs "${PM2_APP_NAME}" --lines 50
    false # Triggers trap ERR -> rollback
fi

log "MyFastHR deployed successfully! Zero-downtime active."
