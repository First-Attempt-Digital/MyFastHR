const db = require('../config/db');

async function patchIds() {
    console.log('Starting Identity Patch Protocol...');
    try {
        const employees = await db('employees').orderBy('id', 'asc');
        let counter = 0;
        
        for (const emp of employees) {
            const nextId = 4030001 + counter;
            const newIdString = `0${nextId}`;
            
            await db('employees')
                .where({ id: emp.id })
                .update({ employee_id_number: newIdString });
            
            console.log(`Updated Node [${emp.id}]: ${emp.employee_id_number || 'N/A'} -> ${newIdString}`);
            counter++;
        }
        
        console.log('Identity Patch Protocol Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Patch Protocol Failed:', err);
        process.exit(1);
    }
}

patchIds();
