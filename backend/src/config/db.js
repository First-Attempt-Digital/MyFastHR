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
db.getPoolTelemetry = () => ({});
db.getQueryLogs = () => [];

module.exports = db;
