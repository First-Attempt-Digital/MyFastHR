# MyFastHR — HRMS & CRM Platform

MyFastHR is a premium HRMS (Human Resource Management System) and CRM platform built with React, Node.js/Express, Knex, and MySQL. It features dynamic branding, comprehensive attendance-muster tracking, role-based dashboards, regularization flows, document vaults, and letter generators.

---

## 📁 Repository Structure

```text
MyFastHR/
├── backend/            # Express Server, API endpoints, Knex DB configuration
│   ├── src/            # Production controllers, routes, and services
│   ├── public/         # Production compiled client static assets
│   └── uploads/        # Biometric raw logs, profile photos, and documents
├── frontend/           # Vite React App (Tailwind CSS, Lucide Icons)
│   ├── src/            # React Pages, Components, and layout Shells
│   └── public/         # Static illustrations, logos, and screenshot mapper assets
├── database/           # SQLite local fallbacks, migrations, schema.sql
└── deploy_prep.js      # Hostinger live deployment preparation utility
```

---

## 🛠️ Local Installation & Development

### 1. Prerequisite Checklist
* Install Node.js (v18+)
* Setup MySQL Database server (named `myfasthr_db`)

### 2. Startup Servers
Open two terminal windows in the project root:

**Start Backend API Server:**
```bash
cd backend
npm install
npm run dev
```

**Start Frontend Vite Dev Server:**
```bash
cd frontend
npm install
npm run dev
```

The application will be live at: **`http://localhost:5173`** (Frontend) and **`http://localhost:5000`** (Backend).

---

## 🚀 Live Hostinger Deployment

To prepare your build for live Hostinger Passenger deployment, run the helper script:
```bash
node deploy_prep.js
```

**What this script performs:**
1. Exports local database to `backend/full_db.sql`.
2. Automatically compiles the frontend React code into a production bundle (`frontend/dist`).
3. Clears the `backend/public/` folder and moves the fresh frontend build there.
4. Auto-configures database, live platform URL, and production variables inside `backend/.env`.

Once done, simply zip the `backend` folder (excluding `node_modules`) and upload it to Hostinger.

---

## 🧹 Codebase Maintenance Scripts

* **`node purge_files.js`**: Removes obsolete scratch/testing files, backups, temporary log files, and empty directories.
* **`node purge_screenshots.js`**: Scans the public assets directory and unlinks any unused, legacy screenshots that are not part of the active frontend screenshot mapper selection, instantly reclaiming server disk space.
