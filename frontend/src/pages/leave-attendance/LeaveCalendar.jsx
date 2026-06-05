import React, { useState, useEffect } from 'react';
import { 
    ChevronLeft, ChevronRight, Download, Filter, 
    Calendar as CalendarIcon, User, Info, FileText,
    ArrowRight, Search, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const getYYYYMMDD = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && !val.includes('T')) {
        const match = val.match(/^\d{4}-\d{2}-\d{2}/);
        if (match) return match[0];
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const LeaveCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const cycleYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

    useEffect(() => {
        const fetchLeaves = async () => {
            setLoading(true);
            try {
                const data = await api.get('/leaves?view=team');
                setLeaves(data);
            } catch (err) {
                console.error('Failed to fetch leaves:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaves();
    }, []);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            setSelectedDate(next);
            return next;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
            setSelectedDate(next);
            return next;
        });
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleExport = () => {
        if (dayDetails.length === 0) {
            alert('No records to export');
            return;
        }
        const headers = {
            name: 'Employee Name',
            id: 'Employee ID',
            type: 'Leave Type',
            duration: 'Duration',
            date: 'Date Range',
            status: 'Status'
        };
        exportToCSV(dayDetails, `Absence_Ledger_${getYYYYMMDD(selectedDate)}.csv`, headers);
    };

    const handleExportAllLeaves = () => {
        if (!leaves || leaves.length === 0) {
            alert('No leave data available to export.');
            return;
        }
        const dataToExport = leaves.map(l => ({
            employee_id_number: l.employee_id_number || l.employee_id || '',
            name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
            leave_type: l.leave_type_name || '',
            start_date: getYYYYMMDD(l.start_date),
            end_date: getYYYYMMDD(l.end_date),
            days: l.days || 0,
            status: l.status || '',
            reason: l.reason || '',
            reviewer: l.reviewer_name || ''
        }));

        const headers = {
            employee_id_number: 'Employee ID',
            name: 'Employee Name',
            leave_type: 'Leave Type',
            start_date: 'Start Date',
            end_date: 'End Date',
            days: 'Days',
            status: 'Status',
            reason: 'Reason',
            reviewer: 'Reviewed By'
        };

        exportToCSV(dataToExport, `All_Leaves_Report_${getYYYYMMDD(new Date())}.csv`, headers);
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);

    // Calculate leaveCounts dynamically for active (approved and pending) leaves
    const leaveCounts = {};
    const activeLeaves = leaves.filter(l => l.status === 'approved' || l.status === 'pending');

    for (let d = 1; d <= days; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const overlapping = activeLeaves.filter(l => {
            const start = getYYYYMMDD(l.start_date);
            const end = getYYYYMMDD(l.end_date);
            return dateStr >= start && dateStr <= end;
        });
        if (overlapping.length > 0) {
            leaveCounts[d] = overlapping.length;
        }
    }

    // Filter side ledger list
    const selectedDateStr = getYYYYMMDD(selectedDate);
    const dayDetails = leaves
        .filter(l => {
            const start = getYYYYMMDD(l.start_date);
            const end = getYYYYMMDD(l.end_date);
            const overlaps = selectedDateStr >= start && selectedDateStr <= end;
            if (!overlaps) return false;

            if (l.status === 'rejected') return false;
            if (statusFilter === 'all') return true;
            return l.status === statusFilter;
        })
        .map(l => {
            const formatDateStr = (dateVal) => {
                const date = new Date(dateVal);
                if (isNaN(date.getTime())) return '';
                return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            };
            const startDisp = formatDateStr(l.start_date);
            const endDisp = formatDateStr(l.end_date);
            const dateRange = startDisp === endDisp ? startDisp : `${startDisp} - ${endDisp}`;

            return {
                id: l.employee_id_number || l.employee_id,
                name: `${l.first_name || ''} ${l.last_name || ''}`.trim().toUpperCase(),
                type: l.leave_type_name || 'Leave',
                duration: `${l.days} Day(S)`,
                date: dateRange,
                status: l.status,
                color: l.leave_type_color
            };
        });

    const renderCalendar = () => {
        const startDay = firstDayOfMonth(year, month);
        const calendarDays = [];

        const prevMonthDays = daysInMonth(year, month - 1);
        for (let i = startDay - 1; i >= 0; i--) {
            calendarDays.push({ day: prevMonthDays - i, current: false });
        }

        for (let i = 1; i <= days; i++) {
            calendarDays.push({ day: i, current: true });
        }

        return (
            <div className="grid grid-cols-7 border-t border-l border-slate-100 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center bg-slate-50 border-r border-b border-slate-100">
                        {d}
                    </div>
                ))}
                {calendarDays.map((d, i) => {
                    const isSelected = d.current && d.day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
                    const count = d.current ? leaveCounts[d.day] : null;
                    return (
                        <div 
                            key={i} 
                            onClick={() => d.current && setSelectedDate(new Date(year, month, d.day))}
                            className={`min-h-[60px] p-1.5 border-r border-b border-slate-100 transition-all relative cursor-pointer group ${
                                !d.current ? 'bg-slate-50/40 opacity-40' : 'bg-white hover:bg-slate-50'
                            } ${isSelected ? 'bg-indigo-50/50' : ''}`}
                        >
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                                {d.day}
                            </span>
                            {count && (
                                <div className="absolute inset-x-1 bottom-1">
                                    <div className="bg-indigo-600 text-white text-[9px] font-black py-0.5 rounded flex items-center justify-center shadow-sm">
                                        {count}
                                    </div>
                                </div>
                            )}
                            {isSelected && <div className="absolute top-0 right-0 w-1 h-1 bg-indigo-500 rounded-bl-full" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-4">
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <CalendarIcon className="text-indigo-600" size={18} />
                        Leave Calendar
                    </h1>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Statistical Absence Ledger</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportAllLeaves}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                        <Download size={12} /> Export All Leaves
                    </button>
                    <select 
                        value={currentDate.getFullYear()}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCurrentDate(prev => {
                                const next = new Date(prev);
                                next.setFullYear(val);
                                return next;
                            });
                            setSelectedDate(prev => {
                                const next = new Date(prev);
                                next.setFullYear(val);
                                return next;
                            });
                        }}
                        className="bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5 shadow-sm outline-none cursor-pointer"
                    >
                        {cycleYears.map(yr => (
                            <option key={yr} value={yr}>{yr} Cycle</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Compact Calendar */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-slate-50">
                        <h2 className="text-sm font-black text-slate-800 tracking-tight">
                            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleToday}
                                className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-600 rounded-lg uppercase tracking-widest hover:bg-slate-100 transition-colors"
                            >
                                Today
                            </button>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={handlePrevMonth}
                                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={handleNextMonth}
                                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {renderCalendar()}
                </div>

                {/* Data-Dense Details */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest italic">Absence Ledger</span>
                            <span className="text-[11px] font-black text-slate-800">
                                {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 hover:text-indigo-600 transition-all uppercase tracking-widest shadow-sm"
                        >
                            <Download size={12} /> Export
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[450px]">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr className="border-b border-slate-50">
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Leave Info</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dayDetails.map((emp, i) => (
                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-[9px] font-black">
                                                    {emp.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-800 truncate max-w-[120px]">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[10px] font-bold text-slate-500">{emp.id}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: emp.color || '#6366f1' }} />
                                                    {emp.type}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{emp.duration}</span>
                                                {emp.status === 'pending' && (
                                                    <span className="mt-0.5 text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {dayDetails.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <CalendarIcon size={40} className="text-slate-300 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Absentees</p>
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Items: {dayDetails.length}</span>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none text-[9px] font-black text-indigo-600 uppercase outline-none cursor-pointer"
                        >
                            <option value="all">Filter: All</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveCalendar;
