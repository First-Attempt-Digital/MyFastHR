const db = require('../config/db');

class LeaveRepository {
    async findAll(user, filters = {}) {
        let query = db('leaves as l')
            .join('employees as e', 'l.employee_id', 'e.id')
            .join('leave_types as lt', 'l.leave_type_id', 'lt.id')
            .where('l.company_id', user.company_id || filters.company_id);

        // Role-based filtering logic
        if (user.role_name === 'employee') {
            query = query.where('l.employee_id', user.employee_id);
        } else if (filters.view === 'team') {
            if (user.role_name === 'manager') {
                query = query.where('e.manager_id', user.employee_id);
            }
            // Admin sees all, so no extra filter for 'team' view
        } else if (filters.employee_id) {
            query = query.where('l.employee_id', filters.employee_id);
        }

        if (filters.status) {
            query = query.where('l.status', filters.status);
        }

        return await query.select(
            'l.*',
            'e.first_name',
            'e.last_name',
            'e.employee_id_number',
            'e.office_location',
            'lt.name as leave_type_name',
            'lt.color as leave_type_color'
        ).orderBy('l.created_at', 'desc');
    }

    async create(data) {
        return await db('leaves').insert(data);
    }

    async findById(id, companyId) {
        return await db('leaves as l')
            .join('employees as e', 'l.employee_id', 'e.id')
            .select('l.*', 'e.manager_id')
            .where({ 'l.id': id, 'l.company_id': companyId })
            .first();
    }

    async updateStatus(id, companyId, status, approvedBy) {
        return await db('leaves')
            .where({ id, company_id: companyId })
            .update({ 
                status, 
                approved_by: approvedBy,
                updated_at: db.fn.now() 
            });
    }

    async delete(id, companyId) {
        return await db('leaves')
            .where({ id, company_id: companyId })
            .del();
    }

    async getLeaveTypes(companyId, includeInactive = false) {
        // Leave types can be global or company-specific
        let query = db('leave_types')
            .where(function() {
                this.whereNull('company_id')
                    .orWhere('company_id', companyId);
            });
        
        if (!includeInactive) {
            query = query.where('is_active', true);
        }
        return await query;
    }

    async getBalances(employeeId, companyId) {
        // 1. Get all active leave types available
        const types = await this.getLeaveTypes(companyId, false);
        
        // 2. Get approved leaves for the current year (Only if employee exists)
        let approvedLeaves = [];
        let adjustments = [];
        const currentYear = new Date().getFullYear();

        if (employeeId) {
            approvedLeaves = await db('leaves')
                .where({
                    employee_id: employeeId,
                    company_id: companyId,
                    status: 'approved'
                })
                .andWhereRaw('YEAR(start_date) = ?', [currentYear])
                .select('leave_type_id', 'days');

            adjustments = await db('leave_adjustments')
                .where({
                    employee_id: employeeId,
                    company_id: companyId
                })
                .andWhereRaw('YEAR(created_at) = ?', [currentYear])
                .select('leave_type_id', 'adjustment_type', 'days');
        }

        // 3. Map balances
        return types.map(t => {
            const baseDays = Number(t.days_per_year);
            const accrualFrequency = t.accrual_frequency || 'yearly';
            const carryForward = Boolean(t.carry_forward);

            const used = approvedLeaves.length > 0
                ? approvedLeaves
                    .filter(l => l.leave_type_id === t.id)
                    .reduce((acc, curr) => acc + curr.days, 0)
                : 0;

            const typeAdjusts = adjustments.filter(a => a.leave_type_id === t.id);
            const credits = typeAdjusts.filter(a => a.adjustment_type === 'credit').reduce((acc, curr) => acc + Number(curr.days), 0);
            const debits = typeAdjusts.filter(a => a.adjustment_type === 'debit').reduce((acc, curr) => acc + Number(curr.days), 0);
            
            const adjustedAllocated = baseDays + credits - debits;

            return {
                ...t,
                days_per_year: adjustedAllocated,
                base_allocated: baseDays,
                accrual_frequency: accrualFrequency,
                carry_forward: carryForward,
                used_days: used,
                available_days: adjustedAllocated - used
            };
        });
    }

    async getAllBalances(companyId) {
        // 1. Get all employees
        const employees = await db('employees').where({ company_id: companyId });
        
        // 2. Get all active leave types
        const types = await this.getLeaveTypes(companyId, false);
        
        // 3. Get all approved leaves for the year
        const currentYear = new Date().getFullYear();
        const approvedLeaves = await db('leaves')
            .where({ company_id: companyId, status: 'approved' })
            .andWhereRaw('YEAR(start_date) = ?', [currentYear])
            .select('employee_id', 'leave_type_id', 'days');

        // 3b. Get all leave adjustments for the year
        const adjustments = await db('leave_adjustments')
            .where({ company_id: companyId })
            .andWhereRaw('YEAR(created_at) = ?', [currentYear])
            .select('employee_id', 'leave_type_id', 'adjustment_type', 'days');

        // 4. Map everything
        return employees.map(emp => {
            const empLeaves = approvedLeaves.filter(l => l.employee_id === emp.id);
            const empAdjustments = adjustments.filter(a => a.employee_id === emp.id);

            const empBalances = types.map(t => {
                const baseDays = Number(t.days_per_year);
                const accrualFrequency = t.accrual_frequency || 'yearly';
                const carryForward = Boolean(t.carry_forward);

                const used = empLeaves
                    .filter(l => l.leave_type_id === t.id)
                    .reduce((acc, curr) => acc + curr.days, 0);

                const typeAdjusts = empAdjustments.filter(a => a.leave_type_id === t.id);
                const credits = typeAdjusts.filter(a => a.adjustment_type === 'credit').reduce((acc, curr) => acc + Number(curr.days), 0);
                const debits = typeAdjusts.filter(a => a.adjustment_type === 'debit').reduce((acc, curr) => acc + Number(curr.days), 0);

                const adjustedAllocated = baseDays + credits - debits;

                return {
                    type_id: t.id,
                    type_name: t.name,
                    allocated: adjustedAllocated,
                    base_allocated: baseDays,
                    accrual_frequency: accrualFrequency,
                    carry_forward: carryForward,
                    used,
                    available: adjustedAllocated - used
                };
            });
            
            const totalAllocated = empBalances.reduce((acc, b) => acc + b.allocated, 0);
            const totalUsed = empLeaves.reduce((acc, l) => acc + l.days, 0);

            return {
                id: emp.id,
                name: `${emp.first_name} ${emp.last_name}`,
                designation: emp.designation,
                office_location: emp.office_location,
                balances: empBalances,
                total_allocated: totalAllocated,
                total_used: totalUsed,
                total_available: totalAllocated - totalUsed
            };
        });
    }

    async updateGlobalRules(companyId, rulesList) {
        return await db.transaction(async (trx) => {
            for (const rule of rulesList) {
                const { id, days_per_year, accrual_frequency, carry_forward, is_active } = rule;
                await trx('leave_types')
                    .where(function() {
                        this.where('id', id);
                        this.andWhere(function() {
                            this.whereNull('company_id')
                                .orWhere('company_id', companyId);
                        });
                    })
                    .update({
                        days_per_year,
                        accrual_frequency,
                        carry_forward: carry_forward ? 1 : 0,
                        is_active: is_active ? 1 : 0
                    });
            }
            return { message: 'Global leave rules updated successfully' };
        });
    }

    async getEmployeeRules(employeeId, companyId) {
        return await db('employee_leave_rules')
            .where({ employee_id: employeeId, company_id: companyId });
    }

    async updateEmployeeRules(companyId, employeeId, rulesList) {
        return await db.transaction(async (trx) => {
            for (const rule of rulesList) {
                const { leave_type_id, allocated_days, accrual_frequency, carry_forward } = rule;
                
                const existing = await trx('employee_leave_rules')
                    .where({ company_id: companyId, employee_id: employeeId, leave_type_id })
                    .first();
                
                if (existing) {
                    await trx('employee_leave_rules')
                        .where({ id: existing.id })
                        .update({
                            allocated_days,
                            accrual_frequency,
                            carry_forward: carry_forward ? 1 : 0,
                            updated_at: trx.fn.now()
                        });
                } else {
                    await trx('employee_leave_rules')
                        .insert({
                            company_id: companyId,
                            employee_id: employeeId,
                            leave_type_id,
                            allocated_days,
                            accrual_frequency,
                            carry_forward: carry_forward ? 1 : 0
                        });
                }
            }
            return { message: 'Leave rules updated successfully' };
        });
    }

    async checkOverlap(employeeId, companyId, startDate, endDate) {
        return await db('leaves')
            .where({ employee_id: employeeId, company_id: companyId })
            .whereIn('status', ['pending', 'approved'])
            .andWhere(function() {
                this.where(function() {
                    this.where('start_date', '<=', startDate)
                        .andWhere('end_date', '>=', startDate);
                })
                .orWhere(function() {
                    this.where('start_date', '<=', endDate)
                        .andWhere('end_date', '>=', endDate);
                })
                .orWhere(function() {
                    this.where('start_date', '>=', startDate)
                        .andWhere('end_date', '<=', endDate);
                });
            })
            .first();
    }
}

module.exports = new LeaveRepository();
