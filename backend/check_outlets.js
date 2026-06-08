const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function main() {
    try {
        const rows = await db('employees')
            .select('id', 'first_name', 'last_name', 'office_location', 'company_id', 'phone', 'created_at')
            .orderBy('id', 'desc')
            .limit(10);
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
main();
