const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'myfasthr_db',
      timezone: '+05:30',
      dateStrings: true,
    },
    migrations: {
      directory: '../database/migrations',
    },
    seeds: {
      directory: '../database/seeds',
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'myfasthr_db',
      timezone: '+05:30',
      dateStrings: true,
    },
    migrations: {
      directory: '../database/migrations',
    },
    seeds: {
      directory: '../database/seeds',
    },
  },
};
