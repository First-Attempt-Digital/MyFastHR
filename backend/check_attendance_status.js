const db = require('./src/config/db');

async function run() {
    try {
        console.log('==================================================');
        console.log('1. SEARCHING FOR EMPLOYEE 10001 DETAILS');
        console.log('==================================================');

        // Search in employees table
        const empByCode = await db('employees')
            .leftJoin('companies', 'employees.company_id', 'companies.id')
            .where('employees.employee_id_number', '10001')
            .select('employees.id', 'employees.first_name', 'employees.last_name', 'employees.employee_id_number', 'companies.name as company_name', 'employees.company_id')
            .first();

        // Search in biometric mapping
        const mapper = await db('employee_biometric_mapping')
            .leftJoin('employees', 'employee_biometric_mapping.employee_id', 'employees.id')
            .leftJoin('companies', 'employees.company_id', 'companies.id')
            .where('employee_biometric_mapping.biometric_enroll_id', '10001')
            .select(
                'employees.id as emp_id', 
                'employees.first_name', 
                'employees.last_name', 
                'employees.employee_id_number',
                'employee_biometric_mapping.biometric_enroll_id',
                'companies.name as company_name',
                'employees.company_id'
            )
            .first();

        let targetEmpId = null;
        let empName = 'Not Found';
        let companyName = 'Not Found';
        let companyId = null;

        if (empByCode) {
            targetEmpId = empByCode.id;
            empName = `${empByCode.first_name} ${empByCode.last_name}`;
            companyName = empByCode.company_name;
            companyId = empByCode.company_id;
            console.log(`Found by employee_id_number: ID: ${empByCode.id}, Name: ${empName}, Company: ${companyName} (ID: ${companyId})`);
        } else if (mapper) {
            targetEmpId = mapper.emp_id;
            empName = `${mapper.first_name} ${mapper.last_name}`;
            companyName = mapper.company_name;
            companyId = mapper.company_id;
            console.log(`Found by biometric_enroll_id mapping: ID: ${mapper.emp_id}, Name: ${empName}, Company: ${companyName} (ID: ${companyId})`);
        } else {
            console.log('Employee 10001 not found in employees or biometric mapping tables.');
        }

        console.log('\n==================================================');
        console.log('2. CHECKING ATTENDANCE ENTRIES FOR EMPLOYEE');
        console.log('==================================================');
        if (targetEmpId) {
            const attendance = await db('attendance')
                .where({ employee_id: targetEmpId })
                .orderBy('check_in', 'desc')
                .limit(10);

            if (attendance.length > 0) {
                attendance.forEach(att => {
                    console.log(`Date: ${att.check_in.toString().substring(0, 10)}, Check-In: ${att.check_in}, Check-Out: ${att.check_out || '---'}, Source: ${att.punch_source}, Status: ${att.status}`);
                });
            } else {
                console.log('No attendance records found in attendance table for this employee.');
            }
        } else {
            console.log('Cannot check attendance table (Employee not resolved).');
        }

        console.log('\n==================================================');
        console.log('3. CHECKING BIOMETRIC RAW LOGS FOR CODE "10001"');
        console.log('==================================================');
        const rawLogs = await db('biometric_raw_logs')
            .where('employee_code', '10001')
            .orderBy('id', 'desc')
            .limit(10);

        if (rawLogs.length > 0) {
            rawLogs.forEach(log => {
                console.log(`Log ID: ${log.id}, Device: ${log.device_serial}, Punch Time: ${log.punch_time}, Status: ${log.status}, Error: ${log.error_details || 'None'}`);
            });
        } else {
            console.log('No raw machine punch logs found in biometric_raw_logs for code "10001".');
        }

        console.log('\n==================================================');
        console.log('4. LISTING ALL BIOMETRIC DEVICES & CONNECTED COMPANIES');
        console.log('==================================================');
        const devices = await db('biometric_devices')
            .leftJoin('companies', 'biometric_devices.company_id', 'companies.id')
            .select(
                'biometric_devices.id as device_id',
                'biometric_devices.device_name',
                'biometric_devices.device_serial',
                'biometric_devices.status',
                'biometric_devices.last_ping_at',
                'companies.id as company_id',
                'companies.name as company_name'
            );

        if (devices.length > 0) {
            devices.forEach(d => {
                console.log(`Device ID: ${d.device_id}`);
                console.log(`  Name: ${d.device_name}`);
                console.log(`  Serial: ${d.device_serial}`);
                console.log(`  Status: ${d.status}`);
                console.log(`  Last Ping: ${d.last_ping_at}`);
                console.log(`  Connected Company: ${d.company_name || 'None'} (ID: ${d.company_id || 'N/A'})`);
                console.log('--------------------------------------------------');
            });
        } else {
            console.log('No biometric devices registered in the database.');
        }

        console.log('\n==================================================');
        console.log('5. ANY PUNCHES FOR COMPANY 27 TODAY (JUNE 13, 2026)');
        console.log('==================================================');
        const company27Punches = await db('biometric_raw_logs')
            .where({ company_id: 27 })
            .whereRaw('DATE(punch_time) = "2026-06-13"')
            .orderBy('id', 'desc');

        if (company27Punches.length > 0) {
            console.log(`Found ${company27Punches.length} raw punches for Company 27 today:`);
            company27Punches.forEach(p => {
                console.log(`  ID: ${p.id}, Emp Code: ${p.employee_code}, Time: ${p.punch_time}, Device: ${p.device_serial}, Status: ${p.status}, Error: ${p.error_details}`);
            });
        } else {
            console.log('NO raw biometric punches found for Company 27 today (June 13).');
        }

        console.log('\n==================================================');
        console.log('6. ANY ATTENDANCE ENTRIES FOR COMPANY 27 TODAY (JUNE 13, 2026)');
        console.log('==================================================');
        const company27Attendance = await db('attendance')
            .join('employees', 'attendance.employee_id', 'employees.id')
            .where('attendance.company_id', 27)
            .whereRaw('DATE(attendance.check_in) = "2026-06-13"')
            .select('attendance.id', 'employees.first_name', 'employees.last_name', 'attendance.check_in', 'attendance.check_out', 'attendance.punch_source', 'attendance.status')
            .orderBy('attendance.id', 'desc');

        if (company27Attendance.length > 0) {
            console.log(`Found ${company27Attendance.length} attendance entries for Company 27 today:`);
            company27Attendance.forEach(a => {
                console.log(`  Name: ${a.first_name} ${a.last_name}, Check-In: ${a.check_in}, Check-Out: ${a.check_out || '---'}, Source: ${a.punch_source}, Status: ${a.status}`);
            });
        } else {
            console.log('NO attendance entries found for Company 27 today (June 13).');
        }

    } catch (err) {
        console.error('Error running check script:', err);
    } finally {
        await db.destroy();
    }
}

run();
