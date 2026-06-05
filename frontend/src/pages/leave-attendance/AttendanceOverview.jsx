import React from 'react';
import AttendanceAdmin from '../../components/attendance/AttendanceAdmin';

const AttendanceOverview = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Summary</h2>
                <p className="text-sm text-slate-500 font-medium italic mt-1">View and track the daily attendance logs of all team members.</p>
            </div>
            
            <AttendanceAdmin />
        </div>
    );
};

export default AttendanceOverview;
