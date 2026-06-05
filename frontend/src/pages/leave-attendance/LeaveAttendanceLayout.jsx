import React from 'react';
import { Outlet } from 'react-router-dom';

const LeaveAttendanceLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default LeaveAttendanceLayout;
