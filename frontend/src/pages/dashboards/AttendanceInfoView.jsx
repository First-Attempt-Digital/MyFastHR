import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, HelpCircle, LayoutGrid, 
    List, Info, Laptop, Monitor, Smartphone, ChevronDown, 
    Home, Search, Clock, AlertCircle, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import api from '../../utils/api';

const AttendanceInfoView = ({ onBack }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [activeTab, setActiveTab] = useState('Overview'); // 'Overview', 'Day Wise'
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [attData, holidayData, leaveData] = await Promise.all([
                    api.get(`/attendance/history?month=${currentMonth}&year=${currentYear}`),
                    api.get(`/settings/holidays?month=${currentMonth}&year=${currentYear}`),
                    api.get('/leaves?view=mine')
                ]);
                setAttendanceHistory(attData || []);
                setHolidays(holidayData || []);
                setLeaves(leaveData || []);
            } catch (err) {
                console.error('Failed to fetch attendance info data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentMonth, currentYear]);

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const getMonthName = (m) => {
        const date = new Date();
        date.setMonth(m - 1);
        return date.toLocaleString('en-US', { month: 'short' });
    };

    // Compile dynamic status list for all days of the month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const compiledDays = [];

    const todayDateStr = today.toDateString();

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(currentYear, currentMonth - 1, d);
        const dateStr = dateObj.toDateString();
        
        // Find attendance record
        const record = attendanceHistory.find(r => {
            if (!r.check_in) return false;
            return new Date(r.check_in).toDateString() === dateStr;
        });

        // Find holiday
        const holiday = holidays.find(h => {
            if (!h.date) return false;
            return new Date(h.date).toDateString() === dateStr;
        });

        // Find leave
        const leave = leaves.find(l => {
            if (l.status !== 'approved') return false;
            const start = new Date(l.start_date);
            start.setHours(0,0,0,0);
            const end = new Date(l.end_date);
            end.setHours(23,59,59,999);
            return dateObj >= start && dateObj <= end;
        });

        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

        let status = 'pending';
        let statusLabel = 'Pending';
        let badgeColor = 'bg-slate-100 text-slate-500';

        if (record) {
            if (record.check_out) {
                status = 'present';
                statusLabel = 'Present';
                badgeColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            } else {
                status = 'checked_in';
                statusLabel = 'Checked In';
                badgeColor = 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse';
            }
        } else if (leave) {
            status = 'leave';
            statusLabel = `Leave (${leave.leave_type_name || 'Approved'})`;
            badgeColor = 'bg-purple-50 text-purple-600 border border-purple-100';
        } else if (holiday) {
            status = 'holiday';
            statusLabel = `Holiday: ${holiday.name}`;
            badgeColor = 'bg-rose-50 text-rose-600 border border-rose-100';
        } else if (isWeekend) {
            status = 'off';
            statusLabel = 'Week Off';
            badgeColor = 'bg-slate-100 text-slate-500 border border-slate-200';
        } else {
            // Check if day is in past
            if (dateObj < today && dateStr !== todayDateStr) {
                status = 'absent';
                statusLabel = 'Absent';
                badgeColor = 'bg-rose-100 text-rose-700 border border-rose-200';
            } else if (dateStr === todayDateStr) {
                status = 'pending';
                statusLabel = 'Not Checked In';
                badgeColor = 'bg-slate-50 text-slate-400 border border-slate-100';
            } else {
                status = 'future';
                statusLabel = '-';
                badgeColor = 'bg-slate-50 text-slate-300';
            }
        }

        let workHours = null;
        if (record && record.check_in && record.check_out) {
            const diff = new Date(record.check_out) - new Date(record.check_in);
            workHours = (diff / (1000 * 60 * 60)).toFixed(2);
        }

        compiledDays.push({
            day: d,
            dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            dateObj,
            record,
            holiday,
            leave,
            status,
            statusLabel,
            badgeColor,
            workHours
        });
    }

    // Compute overview stats
    const presentCount = compiledDays.filter(d => d.status === 'present' || d.status === 'checked_in').length;
    const absentCount = compiledDays.filter(d => d.status === 'absent').length;
    const leaveCount = compiledDays.filter(d => d.status === 'leave').length;
    const holidayCount = compiledDays.filter(d => d.status === 'holiday').length;
    const offCount = compiledDays.filter(d => d.status === 'off').length;

    // Calculate Average Work Hours
    const workHoursArray = compiledDays.filter(d => d.workHours).map(d => parseFloat(d.workHours));
    const avgWorkHours = workHoursArray.length > 0 
        ? (workHoursArray.reduce((acc, curr) => acc + curr, 0) / workHoursArray.length).toFixed(1)
        : '0.0';

    const [selectedDayDetail, setSelectedDayDetail] = useState(null);

    return (
        <div className="fixed inset-0 bg-white z-[120] flex flex-col font-outfit overflow-hidden">
            {/* Header - Fixed */}
            <header className="h-[64px] bg-white flex items-center px-4 shrink-0 z-[60] border-b border-slate-50 justify-between">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-800 active:scale-90 transition-transform">
                        <ChevronLeft size={28} strokeWidth={1.5} />
                    </button>
                    <h1 className="ml-2 text-[22px] font-bold text-slate-900 tracking-tight">Attendance Info</h1>
                </div>
                <button onClick={onBack} className="p-2 text-slate-600 active:scale-90 transition-transform">
                    <Home size={22} />
                </button>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 scroll-smooth pb-24">
                {/* Hero Section */}
                <div className="bg-gradient-to-b from-[#FFF9F2] to-white relative px-6 pt-6 pb-12 border-b border-slate-100">
                    <div className="flex items-center justify-between max-w-lg mx-auto">
                        <div className="w-20 h-20 relative">
                            <svg viewBox="0 0 120 120" className="w-full h-full">
                                <defs>
                                    <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#4361ee" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#4361ee" />
                                    </linearGradient>
                                </defs>
                                <g>
                                    <circle cx="60" cy="40" r="18" fill="#1E293B" />
                                    <path d="M30 100 Q30 65 60 65 L60 65 Q90 65 90 100" fill="url(#shirtGrad)" />
                                    <circle cx="85" cy="85" r="15" fill="#4361ee" />
                                    <path d="M80 85 L83 88 L90 81" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                </g>
                            </svg>
                        </div>
                        
                        <div className="flex-1 pl-4 text-right">
                            <h2 className="text-[16px] font-extrabold text-slate-600 leading-snug">
                                Real-Time Logins & Leaves
                            </h2>
                            <p className="text-[12px] text-slate-400 font-medium mt-1">
                                Check times & status for any date
                            </p>
                        </div>
                    </div>

                    {/* Month Picker Card - Floating */}
                    <div className="absolute -bottom-7 left-6 right-6 max-w-md mx-auto">
                        <div className="bg-white rounded-2xl h-14 flex items-center justify-between px-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-slate-100">
                            <button onClick={handlePrevMonth} className="text-slate-400 hover:text-[#4361ee] active:scale-75 transition-all p-2"><ChevronLeft size={24} /></button>
                            <span className="text-[17px] font-black text-slate-800 tracking-tight">{getMonthName(currentMonth)} {currentYear}</span>
                            <button onClick={handleNextMonth} className="text-slate-400 hover:text-[#4361ee] active:scale-75 transition-all p-2"><ChevronRight size={24} /></button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation - Sticky */}
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 mt-14 px-4 shadow-sm">
                    <div className="flex max-w-lg mx-auto">
                        {['Overview', 'Day Wise'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 text-[16px] font-extrabold transition-all relative ${
                                    activeTab === tab ? 'text-[#4361ee]' : 'text-slate-400'
                                }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div 
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[#4361ee] rounded-t-full" 
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Container */}
                <div className="max-w-lg mx-auto px-4 pt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="text-[14px] text-slate-400 font-bold mt-4">Syncing live database...</span>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === 'Overview' ? (
                                <motion.div 
                                    key="overview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* Main Card */}
                                    <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
                                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Summary</span>
                                        <h3 className="text-[18px] font-black text-slate-800 mt-1 mb-6">01 {getMonthName(currentMonth)} - {daysInMonth} {getMonthName(currentMonth)}</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center">
                                                <span className="text-[26px] font-black text-emerald-600">{presentCount}</span>
                                                <span className="text-[12px] font-bold text-emerald-800/80 mt-1">Present Days</span>
                                            </div>
                                            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex flex-col items-center">
                                                <span className="text-[26px] font-black text-rose-600">{absentCount}</span>
                                                <span className="text-[12px] font-bold text-rose-800/80 mt-1">Absents</span>
                                            </div>
                                            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex flex-col items-center">
                                                <span className="text-[26px] font-black text-purple-600">{leaveCount}</span>
                                                <span className="text-[12px] font-bold text-purple-800/80 mt-1">On Leaves</span>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col items-center">
                                                <span className="text-[26px] font-black text-slate-600">{offCount + holidayCount}</span>
                                                <span className="text-[12px] font-bold text-slate-500 mt-1">Offs & Holidays</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Work Hours</p>
                                                <h5 className="text-[24px] font-black text-slate-800 tracking-tight">{avgWorkHours} hrs</h5>
                                            </div>
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <Clock size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Insights/Legend */}
                                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                                        <h4 className="text-[15px] font-black text-slate-700 mb-4">Legend & Color Codes</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full"></span>
                                                <span className="text-[13px] font-bold text-slate-600">Present</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-3.5 h-3.5 bg-amber-500 rounded-full"></span>
                                                <span className="text-[13px] font-bold text-slate-600">Checked In (Active)</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-3.5 h-3.5 bg-rose-500 rounded-full"></span>
                                                <span className="text-[13px] font-bold text-slate-600">Absent</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-3.5 h-3.5 bg-purple-500 rounded-full"></span>
                                                <span className="text-[13px] font-bold text-slate-600">Approved Leave</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-3.5 h-3.5 bg-rose-300 rounded-full"></span>
                                                <span className="text-[13px] font-bold text-slate-600">Holiday</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-3.5 h-3.5 bg-slate-300 rounded-full"></span>
                                                <span className="text-[13px] font-bold text-slate-600">Weekend Off</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="daywise"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="pb-12"
                                >
                                    <div className="space-y-4">
                                        {/* Action Bar */}
                                        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                            <span className="text-[14px] font-extrabold text-slate-700 pl-2">Layout Mode</span>
                                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                                <button 
                                                    onClick={() => setViewMode('grid')}
                                                    className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-[#4361ee] text-white shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    <LayoutGrid size={18} strokeWidth={2.5} />
                                                </button>
                                                <button 
                                                    onClick={() => setViewMode('list')}
                                                    className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-[#4361ee] text-white shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    <List size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>

                                        {viewMode === 'grid' ? (
                                            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                                                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                                        <div key={d} className="py-3 text-center text-[12px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-l border-t border-slate-100">
                                                    {/* Empty Slots */}
                                                    {Array.from({ length: new Date(currentYear, currentMonth - 1, 1).getDay() }).map((_, i) => (
                                                        <div key={`empty-${i}`} className="h-[90px] bg-slate-50/50"></div>
                                                    ))}
                                                    
                                                    {compiledDays.map((item) => {
                                                        let statusDotClass = 'bg-slate-300';
                                                        if (item.status === 'present') statusDotClass = 'bg-emerald-500';
                                                        if (item.status === 'checked_in') statusDotClass = 'bg-amber-500';
                                                        if (item.status === 'absent') statusDotClass = 'bg-rose-500';
                                                        if (item.status === 'leave') statusDotClass = 'bg-purple-500';
                                                        if (item.status === 'holiday') statusDotClass = 'bg-rose-300';

                                                        return (
                                                            <div 
                                                                key={item.day} 
                                                                onClick={() => setSelectedDayDetail(item)}
                                                                className={`h-[90px] p-2 flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                                                                    selectedDayDetail && selectedDayDetail.day === item.day ? 'bg-indigo-50/60 ring-2 ring-[#4361ee] ring-inset' : ''
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <span className="text-[14px] font-extrabold text-slate-700">{item.day}</span>
                                                                    {item.status !== 'future' && item.status !== 'pending' && (
                                                                        <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`}></span>
                                                                    )}
                                                                </div>
                                                                
                                                                {item.record && (
                                                                    <div className="text-[8px] font-black text-slate-400 space-y-0.5 mt-auto leading-none">
                                                                        <div>{new Date(item.record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                                                                        {item.record.check_out && (
                                                                            <div className="text-[#4361ee]">{new Date(item.record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {compiledDays.filter(d => d.status !== 'future').map((item) => (
                                                    <div 
                                                        key={item.day} 
                                                        onClick={() => setSelectedDayDetail(item)}
                                                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between active:border-indigo-200 transition-all cursor-pointer"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[17px] font-black text-slate-800">{item.day} {getMonthName(currentMonth)}</span>
                                                                <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{item.dayName}</span>
                                                            </div>
                                                            
                                                            {item.record ? (
                                                                <div className="flex items-center gap-2 mt-2 text-[13px] text-slate-500 font-bold">
                                                                    <Clock size={14} className="text-slate-400" />
                                                                    <span>
                                                                        {new Date(item.record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                        {item.record.check_out ? ` - ${new Date(item.record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ' (Active)'}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[13px] text-slate-400 mt-2 font-medium">{item.statusLabel}</div>
                                                            )}
                                                        </div>

                                                        <span className={`px-3 py-1.5 rounded-full text-[12px] font-extrabold ${item.badgeColor}`}>
                                                            {item.status === 'present' ? 'Present' : item.status === 'checked_in' ? 'Active' : item.status === 'leave' ? 'Leave' : item.status === 'holiday' ? 'Holiday' : item.status === 'off' ? 'Off' : 'Absent'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Day Detail Bottom Sheet / Modal */}
                                        {selectedDayDetail && (
                                            <div className="fixed inset-0 bg-slate-900/60 z-[140] flex items-end justify-center p-4 animate-in fade-in duration-300">
                                                <div className="bg-white rounded-[32px] w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
                                                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                                        <div>
                                                            <h3 className="text-[18px] font-black text-slate-800">{selectedDayDetail.day} {getMonthName(currentMonth)} {currentYear}</h3>
                                                            <p className="text-[13px] text-slate-400 font-extrabold uppercase tracking-wider">{selectedDayDetail.dayName}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setSelectedDayDetail(null)}
                                                            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                                                        >
                                                            <XCircle size={22} />
                                                        </button>
                                                    </div>

                                                    <div className="py-6 space-y-5 overflow-y-auto">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                                            <span className={`px-4 py-1.5 rounded-full text-[13px] font-extrabold ${selectedDayDetail.badgeColor}`}>
                                                                {selectedDayDetail.statusLabel}
                                                            </span>
                                                        </div>

                                                        {selectedDayDetail.record && (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Check In</span>
                                                                    <span className="text-[15px] font-black text-slate-800">
                                                                        {new Date(selectedDayDetail.record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Check Out</span>
                                                                    <span className="text-[15px] font-black text-slate-800">
                                                                        {selectedDayDetail.record.check_out 
                                                                            ? new Date(selectedDayDetail.record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                                            : 'Active session'
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Work Duration</span>
                                                                    <span className="text-[15px] font-black text-slate-800">
                                                                        {selectedDayDetail.workHours ? `${selectedDayDetail.workHours} Hours` : 'Calculating...'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Punch Source</span>
                                                                    <span className="text-[15px] font-black text-slate-700 capitalize">
                                                                        {selectedDayDetail.record.punch_source || 'Web'}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}

                                                        {selectedDayDetail.holiday && (
                                                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                                                                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Holiday Event</span>
                                                                <h4 className="text-[15px] font-black text-rose-700 mt-1">{selectedDayDetail.holiday.name}</h4>
                                                            </div>
                                                        )}

                                                        {selectedDayDetail.leave && (
                                                            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                                                                <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Leave Details</span>
                                                                <h4 className="text-[15px] font-black text-purple-700 mt-1">{selectedDayDetail.leave.leave_type_name}</h4>
                                                                <p className="text-[13px] text-purple-600 mt-1 font-medium">Reason: {selectedDayDetail.leave.reason || 'None provided'}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button 
                                                        onClick={() => setSelectedDayDetail(null)}
                                                        className="w-full py-3.5 bg-slate-900 text-white rounded-full font-bold text-[15px] active:scale-98 transition-all mt-4"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceInfoView;
