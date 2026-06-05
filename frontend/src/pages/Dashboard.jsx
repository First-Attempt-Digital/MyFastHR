import React, { useState, useEffect } from 'react';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';

const Dashboard = () => {
    const role = localStorage.getItem('user_role') || 'company_admin';
    const superAdminViewMode = localStorage.getItem('super_admin_view_mode') || 'platform';

    // Render the specialized dashboard for the current role
    // This separation ensures customizations for one role do not affect others.
    switch (role) {
        case 'super_admin':
            return superAdminViewMode === 'tenant' ? <AdminDashboard /> : <SuperAdminDashboard />;
        case 'employee':
            return <EmployeeDashboard />;
        case 'manager':
            return <ManagerDashboard />;
        case 'company_admin':
        default:
            return <AdminDashboard />;
    }
};

export default Dashboard;
