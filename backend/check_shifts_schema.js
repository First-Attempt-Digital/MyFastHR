const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function main() {
    try {
        const columns = await db('shifts').columnInfo();
        console.log('Shifts Table Structure:', columns);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
main();
