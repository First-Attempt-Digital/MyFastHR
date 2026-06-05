const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 1. Deleting existing entries to avoid conflicts
  await knex('attendance').del();
  await knex('payrolls').del();
  await knex('leaves').del();
  await knex('employees').del();
  await knex('users').del();
  await knex('leave_types').del();
  await knex('companies').del();

  // 'Admin@2026' hashed
  const passwordHash = await bcrypt.hash('Admin@2026', 10);

  // 2. Insert Company
  const [companyId] = await knex('companies').insert({
    name: 'MyFastHR',
    email: 'corp@myfasthr.com',
    subscription_status: 'active',
    settings: JSON.stringify({ theme: 'dark', currency: 'INR' })
  });

  // 3. Get Role IDs
  const roles = await knex('roles').select('id', 'name');
  const getRoleId = (name) => roles.find(r => r.name === name).id;

  // 4. Create Users & Employees
  
  // A. Super Admin (No company_id)
  const [saUserId] = await knex('users').insert({
    email: 'superadmin@myfasthr.com',
    password_hash: passwordHash,
    role_id: getRoleId('super_admin'),
    company_id: null
  });

  // B. Company Admin
  const [adminUserId] = await knex('users').insert({
    email: 'boss@myfasthr.com',
    password_hash: passwordHash,
    role_id: getRoleId('company_admin'),
    company_id: companyId
  });

  const [adminEmpId] = await knex('employees').insert({
    user_id: adminUserId,
    company_id: companyId,
    employee_id_number: 'EMP-0001',
    first_name: 'Company',
    last_name: 'Administrator',
    email: 'boss@myfasthr.com',
    phone: '9876543210',
    designation: 'Managing Director',
    department: 'Executive',
    joining_date: '2023-01-01'
  });

  // C. Manager
  const [managerUserId] = await knex('users').insert({
    email: 'manager@myfasthr.com',
    password_hash: passwordHash,
    role_id: getRoleId('manager'),
    company_id: companyId
  });

  const [managerEmpId] = await knex('employees').insert({
    user_id: managerUserId,
    company_id: companyId,
    employee_id_number: 'EMP-0002',
    first_name: 'Akash',
    last_name: 'Manager',
    email: 'manager@myfasthr.com',
    phone: '9876543211',
    designation: 'Ops Manager',
    department: 'Operations',
    manager_id: adminEmpId,
    joining_date: '2023-06-01'
  });

  // D. Employee
  const [employeeUserId] = await knex('users').insert({
    email: 'employee@myfasthr.com',
    password_hash: passwordHash,
    role_id: getRoleId('employee'),
    company_id: companyId
  });

  await knex('employees').insert({
    user_id: employeeUserId,
    company_id: companyId,
    employee_id_number: 'EMP-0003',
    first_name: 'Rahul',
    last_name: 'Staff',
    email: 'employee@myfasthr.com',
    phone: '9876543212',
    designation: 'Software Engineer',
    department: 'IT',
    manager_id: managerEmpId,
    joining_date: '2024-01-15'
  });

  // 5. Insert Leave Types
  await knex('leave_types').insert([
    { company_id: companyId, name: 'Sick Leave', days_per_year: 12 },
    { company_id: companyId, name: 'Casual Leave', days_per_year: 12 },
    { company_id: companyId, name: 'Annual Leave', days_per_year: 18 }
  ]);

  console.log('Database Seeded Successfully!');
};
