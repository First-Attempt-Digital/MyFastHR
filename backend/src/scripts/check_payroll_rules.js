const db = require('../config/db');

async function checkRules() {
    console.log("=== CHECKING GLOBAL PAYROLL RULES FOR PF ===");
    const rules = await db('global_payroll_rules')
        .where({ company_id: 27 })
        .orWhereNull('company_id');
        
    console.log(JSON.stringify(rules, null, 2));
    db.destroy();
}

checkRules().catch(e => {
    console.error(e);
    db.destroy();
});
