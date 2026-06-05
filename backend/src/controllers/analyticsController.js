// Service
const analyticsRepository = require('../repositories/analyticsRepository');

class AnalyticsService {
    async getDashboardMetrics(companyId) {
        return await analyticsRepository.getEmployeeStats(companyId);
    }
}

const analyticsService = new AnalyticsService();

// Controller
class AnalyticsController {
    async getMetrics(req, res) {
        try {
            const role = req.user.role_name;
            const { period } = req.query;
            let data;

            switch (role) {
                case 'super_admin':
                    data = await analyticsRepository.getPlatformStats();
                    break;
                case 'manager':
                    // We need manager's employee_id. Assuming it's in req.user
                    data = await analyticsRepository.getManagerTeamStats(req.user.employee_id);
                    break;
                case 'employee':
                    data = await analyticsRepository.getEmployeePersonalStats(req.user.employee_id);
                    break;
                case 'company_admin':
                default:
                    data = await analyticsRepository.getEmployeeStats(req.user.company_id, period);
                    break;
            }
            res.json(data);
        } catch (err) {
            console.error('Analytics Error:', err);
            res.status(500).json({ message: 'Error fetching analytics data' });
        }
    }

    async getLeaveAttendanceOverview(req, res) {
        try {
            const role = req.user.role_name;
            const companyId = req.user.company_id;
            const employeeId = req.user.employee_id;
            const { month, year } = req.query;
            const data = await analyticsRepository.getLeaveAttendanceOverview(companyId, employeeId, role, month, year || 2026);
            res.json(data);
        } catch (err) {
            console.error('Leave/Attendance Overview Error:', err);
            res.status(500).json({ message: 'Error fetching overview metrics' });
        }
    }

    async getRecentActivities(req, res) {
        try {
            const companyId = req.user.company_id;
            const activities = await analyticsRepository.getRecentActivities(companyId);
            res.json(activities);
        } catch (err) {
            console.error('Recent Activities Controller Error:', err);
            res.status(500).json({ message: 'Error fetching recent activities' });
        }
    }
}

module.exports = {
    analyticsService,
    analyticsController: new AnalyticsController()
};
