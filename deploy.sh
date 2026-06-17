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
    
    LATEST_BACKUP=$(ls -td ${BACKUP_DIR}/deploy_backup_* 2>/dev/null | head -1)
    
    if [ -z "${LATEST_BACKUP}" ]; then
        error "No backups found to rollback to!"
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
log "Archiving active code assets..."
tar -czf "${CURRENT_BACKUP_PATH}/files.tar.gz" -C "${APP_DIR}" backend frontend 2>/dev/null || true

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

# 6. Copy build output to backend public server path
log "Syncing static assets to backend public route..."
rm -rf "${BACKEND_DIR}/public/"
mkdir -p "${BACKEND_DIR}/public"
cp -r "${FRONTEND_DIR}/dist/"* "${BACKEND_DIR}/public/"

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
