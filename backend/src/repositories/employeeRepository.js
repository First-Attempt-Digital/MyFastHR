const db = require('../config/db');

class EmployeeRepository {
    async findAll(user, filters = {}) {
        let query = db('employees as e')
            .leftJoin('users as u', 'e.user_id', 'u.id')
            .leftJoin('roles as r', 'u.role_id', 'r.id')
            .leftJoin('departments as d', 'e.department_id', 'd.id');

        // Isolation: Super Admin sees all, Company Admin sees their company
        if (user.role_name !== 'super_admin') {
            query = query.where('e.company_id', user.company_id);
        }

        // Role-based filtering (Manager sees their team + themselves, Employee sees themselves)
        if (user.role_name === 'manager') {
            query = query.where(function() {
                this.where('e.manager_id', user.employee_id)
                    .orWhere('e.id', user.employee_id);
            });
        } else if (user.role_name === 'employee') {
            query = query.where('e.status', 'active');
        }

        if (filters.search) {
            query = query.where(builder => {
                builder.where('e.first_name', 'like', `%${filters.search}%`)
                       .orWhere('e.last_name', 'like', `%${filters.search}%`)
                       .orWhere('e.email', 'like', `%${filters.search}%`)
                       .orWhere('u.email', 'like', `%${filters.search}%`)
                       .orWhere('e.designation', 'like', `%${filters.search}%`)
                       .orWhere('e.department', 'like', `%${filters.search}%`)
                       .orWhere('d.name', 'like', `%${filters.search}%`)
                       .orWhere('e.office_location', 'like', `%${filters.search}%`)
                       .orWhere('e.employee_id_number', 'like', `%${filters.search}%`);
            });
        }

        if (filters.department) {
            query = query.where('e.department', filters.department);
        }

        return await query.select(
            'e.*',
            'r.name as role_name',
            'u.email as account_email',
            'u.status as account_status',
            db.raw('COALESCE(d.name, e.department) as department_name'),
            'ss.base_salary',
            'ss.allowances',
            'ss.deductions'
        )
        .leftJoin('salary_structures as ss', function() {
            this.on('e.id', '=', 'ss.employee_id')
                .andOn('ss.id', '=', db.raw('(SELECT MAX(id) FROM salary_structures WHERE employee_id = e.id)'));
        })
        .orderBy('e.created_at', 'desc');
    }

    _mapEmployeeData(data) {
        const cleanInt = (val) => {
            if (val === undefined || val === null || val === '') return null;
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };

        const cleanString = (val) => {
            if (val === undefined || val === null) return null;
            const trimmed = String(val).trim();
            return trimmed === '' ? null : trimmed;
        };

        const cleanDate = (val) => {
            if (!val || val === '' || val === '0000-00-00' || String(val).includes('1899')) return null;
            return val;
        };

        const cleanBool = (val) => {
            if (val === true || val === 'true' || val === 1 || val === '1' || val === 'Yes') return 1;
            return 0;
        };

        return {
            user_id: cleanInt(data.user_id),
            company_id: cleanInt(data.company_id),
            employee_id_number: cleanString(data.employee_id_number),
            first_name: cleanString(data.first_name),
            last_name: cleanString(data.last_name) || '',
            email: cleanString(data.email),
            phone: cleanString(data.phone),
            gender: cleanString(data.gender),
            date_of_birth: cleanDate(data.date_of_birth),
            department: cleanString(data.department),
            department_id: cleanInt(data.department_id),
            designation: cleanString(data.designation),
            office_location: cleanString(data.location || data.office_location),
            manager_id: cleanInt(data.manager_id),
            joining_date: cleanDate(data.joining_date),
            status: cleanString(data.status) || 'active',
            aadhaar_number: cleanString(data.aadhaar_number),
            pan_number: cleanString(data.pan_number),
            father_name: cleanString(data.father_name),
            mother_name: cleanString(data.mother_name),
            spouse_name: cleanString(data.spouse_name),
            emergency_contact_name: cleanString(data.emergency_contact_name),
            emergency_contact_number: cleanString(data.emergency_contact_number),
            confirmation_date: cleanDate(data.confirmation_date),
            probation_period: cleanString(data.probation_period),
            referred_by: cleanString(data.referred_by),
            shift: cleanString(data.shift),
            shift_id: cleanInt(data.shift_id),
            include_pf: cleanBool(data.include_pf),
            pf_number: cleanString(data.pf_number),
            include_esi: cleanBool(data.include_esi),
            esi_number: cleanString(data.esi_number),
            include_lwf: cleanBool(data.include_lwf),
            include_gratuity: cleanBool(data.include_gratuity),
            payment_type: cleanString(data.payment_type),
            bank_name: cleanString(data.bank_name),
            bank_branch: cleanString(data.bank_branch),
            account_number: cleanString(data.account_number),
            ifsc_code: cleanString(data.ifsc_code),
            dd_payable_at: cleanString(data.dd_payable_at),
            contract_start_date: cleanDate(data.contract_start_date),
            contract_end_date: cleanDate(data.contract_end_date),
            uan_number: cleanString(data.uan_number),
            pf_excess_contribution: data.pf_excess_contribution === 'above' ? 1 : 0,
            photo: cleanString(data.photo),
            onboarding_token: cleanString(data.onboarding_token),
            onboarding_status: cleanString(data.onboarding_status),
            onboarding_token_created_at: cleanDate(data.onboarding_token_created_at)
        };
    }

    async create(data, trx = null) {
        const queryBuilder = trx || db;
        const cleanData = this._mapEmployeeData(data);
        return await queryBuilder('employees').insert(cleanData);
    }

    async update(id, companyId, data, trx = null) {
        const queryBuilder = trx || db;
        const cleanData = this._mapEmployeeData(data);
        // Remove IDs from update payload to prevent primary key modification
        delete cleanData.user_id;
        delete cleanData.company_id;
        
        return await queryBuilder('employees').where({ id, company_id: companyId }).update(cleanData);
    }

    async findById(id, user) {
        let query = db('employees as e')
            .leftJoin('users as u', 'e.user_id', 'u.id')
            .leftJoin('roles as r', 'u.role_id', 'r.id')
            .leftJoin('departments as d', 'e.department_id', 'd.id')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .where('e.id', id);

        if (user.role_name !== 'super_admin') {
            query = query.where('e.company_id', user.company_id);
        }

        if (user.role_name === 'manager') {
            query = query.where({ 'e.manager_id': user.employee_id });
        } else if (user.role_name === 'employee') {
            query = query.where({ 'e.id': user.employee_id });
        }

        return await query.select(
            'e.*',
            'r.name as role_name',
            'u.email as account_email',
            'u.status as account_status',
            'd.name as department_name',
            's.name as shift_name'
        ).first();
    }


    async delete(id, companyId) {
        return await db('employees').where({ id, company_id: companyId }).del();
    }
    
    async findAllManagers(companyId) {
        return await db('employees as e')
            .leftJoin('users as u', 'e.user_id', 'u.id')
            .leftJoin('roles as r', 'u.role_id', 'r.id')
            .where('e.company_id', companyId)
            .select('e.id', 'e.user_id', 'e.first_name', 'e.last_name', 'e.designation');
    }
}

module.exports = new EmployeeRepository();
