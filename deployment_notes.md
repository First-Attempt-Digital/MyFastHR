# MyFastHR — Hostinger VPS Deployment Notes & Production Checklist

This guide covers setup and deployment steps for launching the MyFastHR platform on a **Hostinger VPS** running **Ubuntu 24.04 LTS**.

---

## 🛠️ Stack Components
* **Operating System**: Ubuntu 24.04 LTS
* **Web Server & Reverse Proxy**: Nginx
* **Process Manager**: PM2 (running Node.js in cluster mode)
* **Runtime**: Node.js (v20+)
* **Database**: MySQL (v8.0)
* **In-Memory Cache**: Redis (for rate-limiting & session caching fallback)

---

## 📝 Step-by-Step Server Setup

### 1. System Packages Update
Connect to your VPS via SSH and update the core system:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js (v20+)
Install Node.js via NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
Verify the installation:
```bash
node -v
npm -v
```

### 3. Install and Configure MySQL
Install MySQL Server:
```bash
sudo apt install mysql-server -y
```
Run the security script to lock down the installation:
```bash
sudo mysql_secure_installation
```
Log into MySQL and configure the production database:
```bash
sudo mysql
```
```sql
CREATE DATABASE myfasthr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'myfasthr_user'@'localhost' IDENTIFIED BY 'STRONG_SECRET_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON myfasthr_db.* TO 'myfasthr_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Install and Configure Redis
Install Redis server:
```bash
sudo apt install redis-server -y
```
Enable and start Redis:
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 5. Install PM2 Globally
PM2 keeps your Node.js backend alive forever and manages server clustering:
```bash
sudo npm install -y pm2 -g
```

---

## 🚀 Repository Deployment Flow

### Step 1: Clone Repository
Clone the prepared production-ready code to your VPS `/var/www/myfasthr`:
```bash
sudo mkdir -p /var/www/myfasthr
sudo chown -R $USER:$USER /var/www/myfasthr
git clone https://github.com/girish457/MyFastHR.git /var/www/myfasthr
```

### Step 2: Environment Config
Create the production `.env` inside `/var/www/myfasthr/backend/`:
```bash
cp /var/www/myfasthr/backend/.env.example /var/www/myfasthr/backend/.env
nano /var/www/myfasthr/backend/.env
```
Fill in the live production variables:
* Change `NODE_ENV` to `production`
* Fill MySQL user, password, and database details.
* Set custom values for `JWT_SECRET`, `SMTP_PASS`, and `BIOMETRIC_API_KEY`.

### Step 3: Install Dependencies & Build Frontend
Install backend dependencies:
```bash
cd /var/www/myfasthr/backend
npm install --omit=dev
```
Install frontend dependencies and build assets:
```bash
cd /var/www/myfasthr/frontend
npm install
npm run build
```
Copy build files to backend public folder:
```bash
cp -r /var/www/myfasthr/frontend/dist/* /var/www/myfasthr/backend/public/
```

### Step 4: Boot Backend Server with PM2
Launch the cluster using `ecosystem.config.js` from the project root:
```bash
cd /var/www/myfasthr
pm2 start ecosystem.config.js --env production
```
Set up PM2 to auto-start on server reboot:
```bash
pm2 startup
# Run the command generated in the terminal output of the command above
pm2 save
```

> ### ⚠️ ALWAYS pass `--env production`. The security gate depends on it.
>
> The `test.*` auth-bypass block and the weak-`JWT_SECRET` boot guard are both gated on
> `NODE_ENV === 'production'` at runtime. `ecosystem.config.js` has `env: { NODE_ENV: 'development' }`
> as its default and only sets `production` via `env_production`, which PM2 applies **only** when
> `--env production` is passed.
>
> **Setting `NODE_ENV=production` in `backend/.env` does not save you.** `dotenv` never overwrites a
> variable that is already set in the process environment, and PM2 has already set `NODE_ENV=development`
> by that point. The `.env` line is inert here.
>
> That means a bare `pm2 restart myfasthr`, a `pm2 resurrect` after reboot, or a `pm2 save` taken while
> the app was started without the flag will silently bring production up in development mode — which
> **re-enables the `test.admin.token` bypass on all endpoints** and disables the boot guard that refuses
> to start on a weak JWT secret. There is no visible symptom; the app looks healthy.
>
> Restart with the flag, never bare:
> ```bash
> pm2 restart ecosystem.config.js --env production   # correct
> pm2 restart myfasthr                               # WRONG — drops back to development
> ```
>
> **Verify after every deploy and every reboot.** Both of these must pass:
> ```bash
> # 1. PM2 must report production for every instance
> pm2 env 0 | grep NODE_ENV        # expect: NODE_ENV: production
>
> # 2. The demo-token bypass must be rejected (expect 401/403, NOT 200)
> curl -s -o /dev/null -w '%{http_code}\n' \
>   -H 'Authorization: Bearer test.admin.token' \
>   https://myfasthr.com/api/employees
> ```
> A `200` from the second command means production is running in development mode and every endpoint is
> currently reachable with a hardcoded token. Treat it as an active incident: restart with `--env production`,
> re-run `pm2 save`, then re-test.

---

## 🔒 Nginx Reverse Proxy Configuration

Install Nginx:
```bash
sudo apt install nginx -y
```
Create a virtual host configuration for MyFastHR:
```bash
sudo nano /etc/nginx/sites-available/myfasthr
```
Paste the configuration (reverse proxying port `5000` to Nginx port `80`):
```nginx
server {
    listen 80;
    server_name myfasthr.com www.myfasthr.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Custom static serving fallback for speed optimization
    location /uploads/ {
        alias /var/www/myfasthr/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```
Enable the site and test the Nginx configuration:
```bash
sudo ln -s /etc/nginx/sites-available/myfasthr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL via Let's Encrypt Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d myfasthr.com -d www.myfasthr.com
```

---

## ✅ Production Environment Checklist

- [ ] **No Secrets in Git**: Verified that `.env` and local backups are added to `.gitignore`.
- [ ] **Port Security**: Node backend on port `5000` is internal-only; external traffic routes solely through Nginx ports `80`/`443`.
- [ ] **Database Backup**: Local Knex migrations run cleanly. Daily db dump cronjob scheduled.
- [ ] **Upload Permissions**: Write permission granted to `/var/www/myfasthr/backend/uploads` for multer uploads.
- [ ] **Rate Limiting**: Express rate-limiting is configured in `app.js` to block bruteforce attacks on the API.
- [ ] **Emergency Freeze**: Global setting flag is available for database locks in critical scenarios.
