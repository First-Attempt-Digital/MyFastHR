module.exports = {
  apps: [
    {
      name: 'myfasthr',
      script: './backend/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // ⚠️ Production MUST be started/restarted with `--env production`:
      //     pm2 restart ecosystem.config.js --env production
      // A bare `pm2 restart myfasthr` (or a reboot resurrecting a `pm2 save` that was
      // taken without the flag) falls back to the `env` block below and runs prod in
      // development mode. That silently re-enables the `test.*` auth-bypass tokens on
      // every endpoint and disables the weak-JWT_SECRET boot guard, with no symptom.
      // Setting NODE_ENV in backend/.env does NOT fix this — dotenv will not overwrite
      // a variable PM2 has already set. See deployment_notes.md for the post-deploy check.
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './backend/logs/pm2_error.log',
      out_file: './backend/logs/pm2_out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
};
