const db = require('../config/db');

class ProfileController {
    async getMyProfile(req, res) {
        try {
            const userId = req.user.id;
            
            // Get User and associated Employee data
            const user = await db('users')
                .join('roles', 'users.role_id', 'roles.id')
                .leftJoin('companies', 'users.company_id', 'companies.id')
                .where('users.id', userId)
                .select(
                    'users.id', 
                    'users.email', 
                    'roles.name as role_name', 
                    'users.company_id',
                    'companies.name as tenant_name',
                    'companies.brand_color',
                    'companies.logo_url as tenant_logo_url',
                    'companies.enabled_features'
                )
                .first();

            if (!user) return res.status(404).json({ message: 'User not found' });

            const employee = await db('employees as e')
                .leftJoin('employees as m', 'e.manager_id', 'm.id')
                .where('e.user_id', userId)
                .select(
                    'e.*',
                    'm.first_name as manager_first_name',
                    'm.last_name as manager_last_name',
                    'e.department as department_name'
                )
                .first();

            if (employee) {
                employee.education = await db('employee_education').where('employee_id', employee.id);
                employee.courses = await db('employee_courses').where('employee_id', employee.id);
            }

            res.json({
                ...user,
                employee: employee || null
            });
        } catch (err) {
            console.error('Profile Error:', err);
            res.status(500).json({ message: 'Error fetching profile' });
        }
    }

    async updateMyProfile(req, res) {
        try {
            const userId = req.user.id;
            const { phone, office_location } = req.body;

            await db('employees')
                .where('user_id', userId)
                .update({
                    phone,
                    office_location,
                    updated_at: db.raw('CURRENT_TIMESTAMP')
                });

            res.json({ message: 'Profile updated successfully' });
        } catch (err) {
            res.status(500).json({ message: 'Error updating profile' });
        }
    }
}

module.exports = new ProfileController();
