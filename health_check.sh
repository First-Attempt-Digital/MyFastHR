#!/bin/bash

# MyFastHR VPS Telemetry Monitoring & Daily Health Check Script
# Monitors CPU, RAM, Disk, MySQL, Redis, Nginx, and PM2.
# Includes backup trigger and alert notification placeholders.

THRESHOLD_CPU=85
THRESHOLD_RAM=90
THRESHOLD_DISK=85

log_msg() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 1. Check CPU Usage
check_cpu() {
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    CPU_INT=${CPU_USAGE%.*}
    log_msg "CPU Usage: ${CPU_USAGE}%"
    if [ "$CPU_INT" -gt "$THRESHOLD_CPU" ]; then
        log_msg "ALERT: CPU Usage is above threshold (${THRESHOLD_CPU}%)!"
        send_alert "CPU High" "CPU usage is at ${CPU_USAGE}%"
    fi
}

# 2. Check RAM Usage
check_ram() {
    RAM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
    RAM_INT=${RAM_USAGE%.*}
    log_msg "Memory Usage: ${RAM_USAGE}%"
    if [ "$RAM_INT" -gt "$THRESHOLD_RAM" ]; then
        log_msg "ALERT: Memory Usage is above threshold (${THRESHOLD_RAM}%)!"
        send_alert "RAM High" "Memory usage is at ${RAM_USAGE}%"
    fi
}

# 3. Check Disk Usage
check_disk() {
    DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    log_msg "Disk Usage: ${DISK_USAGE}%"
    if [ "$DISK_USAGE" -gt "$THRESHOLD_DISK" ]; then
        log_msg "ALERT: Disk Usage is above threshold (${THRESHOLD_DISK}%)!"
        send_alert "Disk Space Critical" "Root partition is at ${DISK_USAGE}%"
    fi
}

# 4. Check MySQL Status
check_mysql() {
    if systemctl is-active --quiet mysql; then
        log_msg "MySQL Service: ACTIVE"
    else
        log_msg "ALERT: MySQL Service: INACTIVE!"
        send_alert "MySQL Down" "MySQL database service has stopped running."
        # Attempt Auto-heal
        log_msg "Attempting to restart MySQL service..."
        sudo systemctl start mysql
    fi
}

# 5. Check Redis Status
check_redis() {
    if systemctl is-active --quiet redis-server; then
        log_msg "Redis Service: ACTIVE"
    else
        log_msg "ALERT: Redis Service: INACTIVE!"
        send_alert "Redis Down" "Redis server service has stopped running."
        # Attempt Auto-heal
        log_msg "Attempting to restart Redis service..."
        sudo systemctl start redis-server
    fi
}

# 6. Check Nginx Status
check_nginx() {
    if systemctl is-active --quiet nginx; then
        log_msg "Nginx Service: ACTIVE"
    else
        log_msg "ALERT: Nginx Service: INACTIVE!"
        send_alert "Nginx Down" "Nginx web server is not running."
        # Attempt Auto-heal
        log_msg "Attempting to restart Nginx service..."
        sudo systemctl start nginx
    fi
}

# 7. Check PM2 Status
check_pm2() {
    # Check if PM2 daemon is responsive
    if pm2 ping >/dev/null 2>&1; then
        log_msg "PM2 Process Manager: Responsive"
        # Check specific apps
        pm2 list
    else
        log_msg "ALERT: PM2 Process Manager: NOT RESPONDING!"
        send_alert "PM2 Down" "PM2 process manager daemon is down or frozen."
    fi
}

# 8. Alert Dispatcher (Integrate with Email/Slack/Telegram hook)
send_alert() {
    SUBJECT="[VPS ALERT] $1 on $(hostname)"
    MESSAGE="$2"
    log_msg "DISPATCHING ALERT: ${SUBJECT} - ${MESSAGE}"
    
    # Example: Send mail to administrator (requires postfix/mailutils)
    # echo "${MESSAGE}" | mail -s "${SUBJECT}" firstattemptdigital01@gmail.com
    
    # Example: Slack Webhook integration
    # curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"*${SUBJECT}*\n${MESSAGE}\"}" YOUR_SLACK_WEBHOOK_URL
}

# 9. Backup Option
run_backup() {
    log_msg "Running Scheduled System Backup..."
    BACKUP_PATH="/var/www/myfasthr_backups/daily_backup_$(date +%F)"
    mkdir -p "${BACKUP_PATH}"
    
    # MySQL Dump
    mysqldump -u u735392253_fast_hr -p"Lucky@&1523@&" u735392253_fasthr > "${BACKUP_PATH}/db.sql"
    
    # Tar source and uploads folder
    tar -czf "${BACKUP_PATH}/uploads_and_config.tar.gz" -C /var/www/myfasthr backend/uploads backend/.env 2>/dev/null || true
    
    log_msg "Backup created successfully at: ${BACKUP_PATH}"
    
    # Keep only the last 7 daily backups to prevent disk overflow
    find /var/www/myfasthr_backups/ -maxdepth 1 -name "daily_backup_*" -type d -mtime +7 -exec rm -rf {} \;
    log_msg "Cleaned up old backups."
}

# Main Execution Loop
if [ "$1" == "--backup" ]; then
    run_backup
else
    log_msg "Starting VPS Telemetry Audit..."
    check_cpu
    check_ram
    check_disk
    check_mysql
    check_redis
    check_nginx
    check_pm2
    log_msg "VPS Telemetry Audit Complete."
fi
