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
      // Pinned explicitly rather than relying on the mysql2 default. The
      // super-admin SQL sandbox (adminController.executeSqlQuery) treats
      // single-statement-only as a security boundary.
      multipleStatements: false,
    },
    // These are PINNED AT KNEX'S OWN DEFAULTS (knex 3.2.9: `poolDefaults()` in
    // node_modules/knex/lib/client.js:209 => { min: 2, max: 10,
    // propagateCreateError: true }, and DEFAULT_ACQUIRE_TIMEOUT = 60000 at
    // client.js:233). Declaring them changes nothing at runtime — the point is
    // to make the ceiling visible instead of implicit.
    // Do NOT tune these by guesswork. Tune only once pool telemetry
    // (`db.getPoolTelemetry()` -> GET /admin/system/telemetry) shows actual
    // saturation, i.e. sustained pendingAcquires > 0 or used pegged at max.
    // The constraint to reason about is:
    //   per-process `max` x PM2 instance count  vs  MySQL `max_connections`
    // ecosystem.config.js runs `instances: 'max'` in cluster mode, so on an
    // 8-vCPU box that is 8 x 10 = 80 connections from this app alone, against a
    // Hostinger MySQL whose max_connections is not documented in this repo.
    // Measure both sides before changing either number.
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      propagateCreateError: true,
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
      // Pinned explicitly rather than relying on the mysql2 default. The
      // super-admin SQL sandbox (adminController.executeSqlQuery) treats
      // single-statement-only as a security boundary.
      multipleStatements: false,
    },
    // These are PINNED AT KNEX'S OWN DEFAULTS (knex 3.2.9: `poolDefaults()` in
    // node_modules/knex/lib/client.js:209 => { min: 2, max: 10,
    // propagateCreateError: true }, and DEFAULT_ACQUIRE_TIMEOUT = 60000 at
    // client.js:233). Declaring them changes nothing at runtime — the point is
    // to make the ceiling visible instead of implicit.
    // Do NOT tune these by guesswork. Tune only once pool telemetry
    // (`db.getPoolTelemetry()` -> GET /admin/system/telemetry) shows actual
    // saturation, i.e. sustained pendingAcquires > 0 or used pegged at max.
    // The constraint to reason about is:
    //   per-process `max` x PM2 instance count  vs  MySQL `max_connections`
    // ecosystem.config.js runs `instances: 'max'` in cluster mode, so on an
    // 8-vCPU box that is 8 x 10 = 80 connections from this app alone, against a
    // Hostinger MySQL whose max_connections is not documented in this repo.
    // Measure both sides before changing either number.
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      propagateCreateError: true,
    },
    migrations: {
      directory: '../database/migrations',
    },
    seeds: {
      directory: '../database/seeds',
    },
  },
};
