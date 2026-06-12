const leaveRepository = require('../repositories/leaveRepository');
const db = require('../config/db');
const { differenceInDays, parseISO } = require('date-fns');
const notificationService = require('./notificationService');

class LeaveService {
    async listLeaves(user, filters) {
        return await leaveRepository.findAll(user, filters);
    }

    async applyLeave(user, data) {
        // 1. Validate dates
        const start = parseISO(data.start_date);
        const end = parseISO(data.end_date);
        if (start > end) throw new Error('Start date cannot be after end date');

        // 2. Check for overlapping requests
        const overlap = await leaveRepository.checkOverlap(user.employee_id, user.company_id, data.start_date, data.end_date);
        if (overlap) throw new Error(`Operational conflict: You already have a ${overlap.status} leave request for these dates.`);

        // 3. Calculate total days with session deductions
        const startSession = data.start_session || 'session_1';
        const endSession = data.end_session || 'session_2';
        
        const startDeduction = startSession === 'session_2' ? 0.5 : 0.0;
        const endDeduction = endSession === 'session_1' ? 0.5 : 0.0;
        
        const days = differenceInDays(end, start) + 1 - startDeduction - endDeduction;
        if (days <= 0) throw new Error('Invalid session selection: total leave days must be greater than 0');

        // 4. Validate Balance
        const balances = await this.getBalances(user);
        const typeBalance = balances.find(b => b.id === parseInt(data.leave_type_id));
        
        if (!typeBalance) throw new Error('Invalid leave type selected.');
        if (typeBalance.available_days < days) {
            throw new Error(`Insufficient Balance: You requested ${days} days, but only have ${typeBalance.available_days} days remaining for ${typeBalance.name}.`);
        }

        // 5. Save
        const leaveId = await leaveRepository.create({
            employee_id: user.employee_id,
            company_id: user.company_id,
            leave_type_id: data.leave_type_id,
            start_date: data.start_date,
            end_date: data.end_date,
            start_session: startSession,
            end_session: endSession,
            days: days,
            reason: data.reason,
            status: 'pending'
        });

        // 6. Notify Manager and Admin
        try {
            const employee = await db('employees').where('id', user.employee_id).first();
            const recipientUsers = [];
            
            if (employee.manager_id) {
                const manager = await db('employees').where('id', employee.manager_id).first();
                if (manager && manager.user_id) recipientUsers.push(manager.user_id);
            }

            const admins = await db('users')
                .join('roles', 'users.role_id', 'roles.id')
                .where('users.company_id', user.company_id)
                .whereIn('roles.name', ['company_admin', 'super_admin'])
                .select('users.id as id');

            admins.forEach(a => {
                if (!recipientUsers.includes(a.id)) {
                    recipientUsers.push(a.id);
                }
            });

            for (const rId of recipientUsers) {
                await notificationService.createNotification(
                    rId, 
                    user.company_id, 
                    'New Leave Request', 
                    `${employee.first_name} requested ${days} days of ${typeBalance.name}.`,
                    'info'
                );
            }
        } catch (err) {
            console.error('Leave notification failed', err);
        }

        return leaveId;
    }

    async updateStatus(id, user, status) {
        const leave = await leaveRepository.findById(id, user.company_id);
        if (!leave) throw new Error('Leave request not found');
        
        // Hierarchy Permission Check: Managers can only approve their team's leaves
        if (user.role_name === 'manager' && leave.manager_id !== user.employee_id) {
            throw new Error('Unauthorized: You can only manage leave requests for your direct reports.');
        }

        const result = await leaveRepository.updateStatus(id, user.company_id, status, user.id);

        // Notify Employee
        try {
            const targetEmployee = await db('employees').where('id', leave.employee_id).first();
            if (targetEmployee && targetEmployee.user_id) {
                await notificationService.createNotification(
                    targetEmployee.user_id, 
                    user.company_id, 
                    `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`, 
                    `Your request for ${leave.days} days starting ${leave.start_date} has been ${status}.`,
                    status === 'approved' ? 'success' : 'error'
                );
            }
        } catch (err) {
            console.error('Leave status notification failed', err);
        }

        return result;
    }

    async getLeaveTypes(companyId, includeInactive = false) {
        return await leaveRepository.getLeaveTypes(companyId, includeInactive);
    }

    async getBalances(user) {
        return await leaveRepository.getBalances(user.employee_id, user.company_id);
    }

    async getAllBalances(companyId) {
        return await leaveRepository.getAllBalances(companyId);
    }

    async cancelLeave(id, user) {
        const leave = await leaveRepository.findById(id, user.company_id);
        if (!leave) throw new Error('Leave request not found');
        
        // Only allow cancellation of pending leaves by the owner
        if (leave.employee_id !== user.employee_id) {
            throw new Error('Unauthorized: You can only cancel your own leave requests.');
        }
        if (leave.status !== 'pending') {
            throw new Error(`Cannot cancel a leave request that is already ${leave.status}.`);
        }

        const result = await leaveRepository.delete(id, user.company_id);

        // Notify Manager and Admin
        try {
            const employee = await db('employees').where('id', user.employee_id).first();
            const leaveType = await db('leave_types').where('id', leave.leave_type_id).first();
            const recipientUsers = [];
            
            if (employee.manager_id) {
                const manager = await db('employees').where('id', employee.manager_id).first();
                if (manager && manager.user_id) recipientUsers.push(manager.user_id);
            }

            const admins = await db('users')
                .join('roles', 'users.role_id', 'roles.id')
                .where('users.company_id', user.company_id)
                .whereIn('roles.name', ['company_admin', 'super_admin'])
                .select('users.id as id');

            admins.forEach(a => {
                if (!recipientUsers.includes(a.id)) {
                    recipientUsers.push(a.id);
                }
            });

            for (const rId of recipientUsers) {
                await notificationService.createNotification(
                    rId, 
                    user.company_id, 
                    'Leave Request Cancelled', 
                    `${employee.first_name} cancelled their request for ${leave.days} days of ${leaveType?.name || 'leave'} starting ${leave.start_date}.`,
                    'info'
                );
            }
        } catch (err) {
            console.error('Leave cancellation notification failed', err);
        }

        return result;
    }

    async adjustBalance(user, data) {
        if (user.role_name !== 'company_admin' && user.role_name !== 'super_admin' && user.role_name !== 'manager') {
            throw new Error('Unauthorized: Only administrators or managers can adjust leave balances.');
        }

        const { employee_id, leave_type_id, adjustment_type, days, reason } = data;
        
        if (!employee_id || !leave_type_id || !adjustment_type || !days) {
            throw new Error('Missing required fields: employee_id, leave_type_id, adjustment_type, days');
        }

        if (adjustment_type !== 'credit' && adjustment_type !== 'debit') {
            throw new Error('adjustment_type must be either "credit" or "debit"');
        }

        if (Number(days) <= 0) {
            throw new Error('Days must be a positive number');
        }

        const adjustmentId = await db('leave_adjustments').insert({
            company_id: user.company_id,
            employee_id: employee_id,
            leave_type_id: leave_type_id,
            adjustment_type: adjustment_type,
            days: days,
            reason: reason || null,
            created_by: user.id
        });

        try {
            const employee = await db('employees').where('id', employee_id).first();
            const leaveType = await db('leave_types').where('id', leave_type_id).first();
            if (employee && employee.user_id && leaveType) {
                const actionText = adjustment_type === 'credit' ? 'credited with' : 'debited by';
                await notificationService.createNotification(
                    employee.user_id,
                    user.company_id,
                    'Leave Balance Adjusted',
                    `Your ${leaveType.name} balance has been ${actionText} ${days} days. Reason: ${reason || 'N/A'}`,
                    'info'
                );
            }
        } catch (err) {
            console.error('Leave adjustment notification failed', err);
        }

        return adjustmentId;
    }

    async listGrants(user) {
        if (user.role_name !== 'company_admin' && user.role_name !== 'super_admin' && user.role_name !== 'manager') {
            throw new Error('Unauthorized: Only administrators or managers can view leave grants.');
        }

        const companyId = user.company_id;

        // Fetch all adjustments with batch_id, join with employees and leave_types
        const adjustments = await db('leave_adjustments as la')
            .join('employees as e', 'la.employee_id', 'e.id')
            .join('leave_types as lt', 'la.leave_type_id', 'lt.id')
            .leftJoin('departments as d', 'e.department_id', 'd.id')
            .where('la.company_id', companyId)
            .whereNotNull('la.batch_id')
            .select(
                'la.id as adjustment_id',
                'la.batch_id',
                'la.period',
                'la.frequency',
                'la.scheme',
                'la.grant_type',
                'la.days',
                'la.created_at',
                'la.reason',
                'e.id as employee_id',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'e.status as employee_status',
                'e.joining_date',
                'e.designation',
                'e.office_location',
                db.raw('COALESCE(d.name, e.department) as department_name'),
                'lt.name as leave_type_name'
            )
            .orderBy('la.batch_id', 'desc')
            .orderBy('la.created_at', 'desc');

        // Group by batch_id
        const batchesMap = {};
        for (const adj of adjustments) {
            const bId = adj.batch_id;
            if (!batchesMap[bId]) {
                batchesMap[bId] = {
                    batch_id: bId,
                    created_at: adj.created_at,
                    period: adj.period,
                    frequency: adj.frequency,
                    leave_type_name: adj.leave_type_name,
                    scheme: adj.scheme,
                    grant_type: adj.grant_type,
                    headcount: 0,
                    employees: []
                };
            }
            batchesMap[bId].employees.push({
                adjustment_id: adj.adjustment_id,
                employee_id: adj.employee_id,
                employee_id_number: adj.employee_id_number,
                first_name: adj.first_name,
                last_name: adj.last_name,
                status: adj.employee_status,
                joining_date: adj.joining_date,
                days: Number(adj.days),
                designation: adj.designation,
                office_location: adj.office_location,
                department_name: adj.department_name
            });
            batchesMap[bId].headcount += 1;
        }

        return Object.values(batchesMap);
    }

    async grantLeave(user, data) {
        if (user.role_name !== 'company_admin' && user.role_name !== 'super_admin') {
            throw new Error('Unauthorized: Only administrators can grant leave.');
        }

        const { leave_type_id, period, frequency, scheme, days, employee_ids, reason } = data;

        if (!leave_type_id || !period || !frequency || !scheme || !days || !employee_ids) {
            throw new Error('Missing required fields');
        }

        const companyId = user.company_id;

        // Generate next batch_id
        const maxBatch = await db('leave_adjustments')
            .where('company_id', companyId)
            .max('batch_id as max_id')
            .first();
        const nextBatchId = (maxBatch?.max_id || 1020) + 1;

        // Resolve employee IDs
        let targetEmployeeIds = [];
        if (employee_ids === 'all') {
            const activeEmployees = await db('employees')
                .where({ company_id: companyId, status: 'active' })
                .select('id');
            targetEmployeeIds = activeEmployees.map(e => e.id);
        } else if (Array.isArray(employee_ids)) {
            targetEmployeeIds = employee_ids;
        } else {
            targetEmployeeIds = [employee_ids];
        }

        if (targetEmployeeIds.length === 0) {
            throw new Error('No employees selected or found to grant leave.');
        }

        // Insert leave adjustments
        const inserts = targetEmployeeIds.map(empId => ({
            company_id: companyId,
            employee_id: empId,
            leave_type_id: leave_type_id,
            adjustment_type: 'credit',
            days: days,
            reason: reason || `Granted in Batch #${nextBatchId}`,
            created_by: user.id,
            batch_id: nextBatchId,
            period: period,
            frequency: frequency,
            scheme: scheme,
            grant_type: 'Manual'
        }));

        await db('leave_adjustments').insert(inserts);

        // Send notifications
        try {
            const leaveType = await db('leave_types').where('id', leave_type_id).first();
            const employees = await db('employees').whereIn('id', targetEmployeeIds).select('id', 'user_id');
            for (const emp of employees) {
                if (emp.user_id) {
                    await notificationService.createNotification(
                        emp.user_id,
                        companyId,
                        'Leave Granted',
                        `${days} days of ${leaveType?.name || 'Leave'} credited for ${period}.`,
                        'success'
                    );
                }
            }
        } catch (err) {
            console.error('Leave grant notifications failed:', err);
        }

        return { batch_id: nextBatchId, count: targetEmployeeIds.length };
    }

    async deleteGrantBatch(user, batchId) {
        if (user.role_name !== 'company_admin' && user.role_name !== 'super_admin') {
            throw new Error('Unauthorized: Only administrators can delete leave grant batches.');
        }

        const companyId = user.company_id;

        // Delete all adjustments in this batch
        const count = await db('leave_adjustments')
            .where({ company_id: companyId, batch_id: batchId })
            .del();

        return { count };
    }

    async deleteGrantAdjustment(user, id) {
        if (user.role_name !== 'company_admin' && user.role_name !== 'super_admin') {
            throw new Error('Unauthorized: Only administrators can delete individual leave grants.');
        }

        const companyId = user.company_id;

        // Delete this single adjustment
        const count = await db('leave_adjustments')
            .where({ company_id: companyId, id: id })
            .del();

        return { count };
    }

    async getEmployeeRules(employeeId, companyId) {
        return await leaveRepository.getEmployeeRules(employeeId, companyId);
    }

    async updateEmployeeRules(companyId, data) {
        const { employee_id, rules } = data;
        if (!employee_id || !Array.isArray(rules)) {
            throw new Error('Missing employee_id or rules list.');
        }
        return await leaveRepository.updateEmployeeRules(companyId, employee_id, rules);
    }

    async updateGlobalRules(companyId, data) {
        const { rules } = data;
        if (!Array.isArray(rules)) {
            throw new Error('Missing rules array.');
        }
        return await leaveRepository.updateGlobalRules(companyId, rules);
    }
}

module.exports = new LeaveService();
