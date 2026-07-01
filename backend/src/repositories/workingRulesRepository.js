const db = require('../config/db');

class WorkingRulesRepository {
    async findByCompany(companyId) {
        return await db('working_rules')
            .where('company_id', companyId)
            .first();
    }

    async upsert(companyId, data) {
        const existing = await this.findByCompany(companyId);
        
        const payload = {
            company_id: companyId,
            shift_start: data.shift_start,
            shift_end: data.shift_end,
            grace_period: parseInt(data.grace_period || 0),
            weekoffs: JSON.stringify(data.weekoffs || []),
            half_day_hours: parseFloat(data.half_day_hours || 4),
            late_marks_for_half_day: parseInt(data.late_marks_for_half_day || 3),
            // New Advanced Fields
            max_late_allowed: parseInt(data.max_late_allowed || 3),
            late_deduction_type: data.late_deduction_type || 'half_day',
            late_deduction_value: parseFloat(data.late_deduction_value || 0),
            ot_enabled: Boolean(data.ot_enabled),
            ot_min_minutes: parseInt(data.ot_min_minutes || 60),
            ot_rate_multiplier: parseFloat(data.ot_rate_multiplier || 1.5),
            max_missed_punches: parseInt(data.max_missed_punches || 2),
            updated_at: db.fn.now()
        };

        if (existing) {
            return await db('working_rules')
                .where('company_id', companyId)
                .update(payload);
        } else {
            return await db('working_rules').insert({
                ...payload,
                created_at: db.fn.now()
            });
        }
    }
}

module.exports = new WorkingRulesRepository();
