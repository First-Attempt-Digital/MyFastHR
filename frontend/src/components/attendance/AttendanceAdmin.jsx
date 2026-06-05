import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const AttendanceAdmin = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [matrix, setMatrix] = useState([]);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(false);

    const getMonthOptions = () => {
        const options = [];
        const currentDate = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            options.push({
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            });
        }
        return options;
    };

    const monthOptions = getMonthOptions();

    const handleMonthChange = (e) => {
        const [selectedMonth, selectedYear] = e.target.value.split('-').map(Number);
        setMonth(selectedMonth);
        setYear(selectedYear);
    };
    
    useEffect(() => {
        fetchMatrix();
    }, [month, year]);

    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const response = await api.get('/attendance/matrix', { params: { month, year } });
            setMatrix(response.matrix || []);
            setDays(response.days || 30);
        } catch (err) {
            console.error('Failed to fetch attendance matrix', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!matrix || matrix.length === 0) {
            alert("No attendance data to export.");
            return;
        }

        const dataToExport = matrix.map(emp => {
            const row = {
                employee_code: emp.code,
                name: emp.name,
                role: emp.role,
                location: emp.location,
            };
            // Add day-by-day swipe status
            for (let d = 1; d <= days; d++) {
                row[`day_${d}`] = emp.days[d] || '-';
            }
            // Add totals
            row.total_present = emp.stats?.P || 0;
            row.total_late = emp.stats?.L || 0;
            row.total_paid_leave = emp.stats?.PL || 0;
            row.total_absent = emp.stats?.A || 0;
            row.total_off = emp.stats?.OFF || 0;
            return row;
        });

        const headers = {
            employee_code: 'Employee ID',
            name: 'Name',
            role: 'Role',
            location: 'Location',
        };
        for (let d = 1; d <= days; d++) {
            headers[`day_${d}`] = `Day ${d}`;
        }
        headers.total_present = 'Total Present (P)';
        headers.total_late = 'Total Late (L)';
        headers.total_paid_leave = 'Total Paid Leave (PL)';
        headers.total_absent = 'Total Absent (A)';
        headers.total_off = 'Total Off (OFF)';

        exportToCSV(dataToExport, `Attendance_Overview_${month}_${year}.csv`, headers);
    };

    const dayLabels = Array.from({ length: days }, (_, i) => i + 1);

    if (loading) return (
        <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading team attendance...</p>
        </div>
    );
    
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700">
            {/* Control Bar */}
            <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Month</p>
                            <select 
                                value={`${month}-${year}`}
                                onChange={handleMonthChange}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                            >
                                {monthOptions.map(opt => (
                                    <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Scheme</p>
                            <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10">
                                <option>Default Scheme (1st - 31st)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                        >
                            <Download size={14} /> Export Excel
                        </button>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="overflow-x-auto max-w-full custom-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed md:table-auto">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="sticky left-0 z-10 bg-slate-50 border-r border-slate-100 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[280px]">Employee</th>
                                {dayLabels.map(d => (
                                    <th key={d} className="px-2 py-4 text-center text-[10px] font-black text-slate-400 border-r border-slate-100 min-w-[35px]">
                                        {d}
                                        <span className="block text-[8px] font-medium opacity-50 uppercase">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][(new Date(year, month - 1, d)).getDay()]}</span>
                                    </th>
                                ))}
                            <th className="px-4 py-4 text-center text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50/10 border-l border-slate-100">P</th>
                            <th className="px-4 py-4 text-center text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50/10">L</th>
                            <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/10">H</th>
                            <th className="px-4 py-4 text-center text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50/10">A</th>
                            <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/10">OFF</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {matrix.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 px-6 py-4 min-w-[280px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-black">{emp.name?.split(' ').map(n => n[0]).join('') || '??'}</div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase leading-tight">{emp.name} <span className="opacity-40 font-bold">[{emp.code}]</span></p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{emp.role}, {emp.location}</p>
                                        </div>
                                    </div>
                                </td>
                                {dayLabels.map(d => {
                                    const status = emp.days[d] || '-';
                                    return (
                                        <td key={d} className="p-0 border-r border-slate-100 text-center">
                                            <div className={`w-full h-full py-3 text-[10px] font-black border-b-2 transition-all cursor-pointer ${
                                                    status === 'P' ? 'text-green-600 border-transparent hover:bg-green-50' :
                                                    status === 'A' ? 'text-rose-600 border-rose-400 bg-rose-50/30' :
                                                    status === 'L' ? 'text-amber-600 border-amber-400 bg-amber-50/30' : // Late
                                                    status === 'PL' ? 'text-indigo-600 border-indigo-400 bg-indigo-50/30' : // Paid Leave
                                                    status === 'UL' ? 'text-slate-500 border-slate-400 bg-slate-50/30 font-bold' : // Unpaid Leave
                                                    status === 'OFF' ? 'text-slate-300 border-transparent bg-slate-50/10' : 'text-slate-200'
                                                }`}>
                                                {status}
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="px-2 py-4 text-center text-xs font-black text-slate-700 bg-slate-50/10 border-l border-slate-100">{emp.stats.P}</td>
                                <td className="px-2 py-4 text-center text-xs font-black text-amber-600 bg-amber-50/10">{emp.stats.L}</td>
                                <td className="px-2 py-4 text-center text-xs font-black text-indigo-600 bg-indigo-50/10">{emp.stats.PL}</td>
                                <td className="px-2 py-4 text-center text-xs font-black text-rose-600 bg-rose-50/10">{emp.stats.A}</td>
                                <td className="px-2 py-4 text-center text-xs font-black text-slate-400 bg-slate-50/10">{emp.stats.OFF}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend Section */}
            <div className="p-8 bg-slate-50/30 border-t border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status Indicators</p>
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-white border border-green-100 text-green-600 text-[10px] font-black shadow-sm">P</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Present</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black shadow-sm">L</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Late Mark</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Leave Status</p>
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black shadow-sm">PL</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Paid Leave</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black shadow-sm">UL</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Unpaid Leave</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Absence & Offs</p>
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black shadow-sm">A</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Absent</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-black shadow-sm">OFF</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Weekly Off</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceAdmin;
