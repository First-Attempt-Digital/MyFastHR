const knex = require('knex');
const config = require('../../knexfile');
const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

// Backwards compatibility bindings
db.centralDb = db;
db.dbStorage = {
    getStore: () => null,
    run: (store, cb) => cb()
};
db.getTenantDb = () => db;
db.initTenantDb = () => Promise.resolve();
/**
 * Live connection-pool telemetry, read straight off the tarn pool that knex
 * owns (`db.client.pool`, tarn 3.0.2).
 *
 * Read-only observability: this only calls tarn's numeric accessors
 * (numUsed/numFree/numPendingAcquires/numPendingCreates/numPendingValidations,
 * see node_modules/tarn/dist/Pool.d.ts). It never acquires, releases, creates
 * or destroys a connection, and has no side effects.
 *
 * Defensive by design: `db.client.pool` is absent before the first connection
 * and after `db.destroy()`. Every access is guarded and the whole body is
 * wrapped — this must NEVER throw, since a telemetry endpoint that crashes is
 * worse than one that reports nothing.
 *
 * Shape matches what the consumer expects: telemetryController passes the
 * return value through untouched as `pools`, and the super-admin Telemetry
 * view reads `pools.central` ({ used, free, min, max }) and `pools.tenants`.
 * `tenants` is permanently `{}` — this app is a single shared MySQL database
 * with row-level `company_id` isolation, so there are no per-tenant pools.
 * `min`/`max` are included so a reader can see how close `used` is to the
 * ceiling; `pendingAcquires` > 0 is the signal that the pool is saturated.
 */
db.getPoolTelemetry = () => {
    const EMPTY = { central: null, tenants: {} };
    try {
        const pool = db.client && db.client.pool;
        if (!pool) return EMPTY;

        const count = (method) =>
            typeof pool[method] === 'function' ? pool[method]() : null;
        const setting = (key) =>
            typeof pool[key] === 'number' ? pool[key] : null;

        return {
            central: {
                used: count('numUsed'),
                free: count('numFree'),
                pendingAcquires: count('numPendingAcquires'),
                pendingCreates: count('numPendingCreates'),
                pendingValidations: count('numPendingValidations'),
                min: setting('min'),
                max: setting('max'),
                acquireTimeoutMillis: setting('acquireTimeoutMillis'),
                destroyed: pool.destroyed === true
            },
            tenants: {}
        };
    } catch (err) {
        return EMPTY;
    }
};
db.getQueryLogs = () => [];

module.exports = db;
