import React, { useState, useEffect } from 'react';
import { 
    Calendar, Clock, CheckCircle, XCircle, Briefcase, 
    Users, Activity, ArrowRight, UserCheck, ShieldCheck,
    TrendingUp, Plus, Settings, ChevronLeft, ChevronRight,
    PieChart as PieIcon, BarChart as BarIcon, User, Search,
    Filter, Download, Layout, Target, Zap, MoreHorizontal,
    Info, Smartphone, Monitor, HardDrive
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Sparkline = ({ data, color }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="h-[35px] w-[95px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                        <linearGradient id={`sparkGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={color} 
                        strokeWidth={1.5} 
                        fill={`url(#sparkGradient-${color.replace('#', '')})`} 
                        dot={false}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const StatCard = ({ title, count, period, icon: Icon, colorClass, bgClass, sparkColor, trend, sparkData, onClick }) => (
    <div onClick={onClick} className="bg-white border border-slate-200/60 rounded-[24px] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-full relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${bgClass} flex items-center justify-center`}>
                <Icon size={18} className={colorClass} />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full">
                {period}
            </div>
        </div>
        <div className="flex items-end justify-between gap-4 mt-2">
            <div className="space-y-1.5 min-w-0">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider leading-none truncate">{title}</h4>
                <div className="flex items-center flex-wrap gap-2">
                    <span className="text-2xl font-black text-slate-800 tracking-tight leading-none whitespace-nowrap">{count}</span>
                    {trend && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
                            trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 
                            trend === 'Clear' || trend === 'Stable' ? 'text-slate-500 bg-slate-100' :
                            'text-rose-500 bg-rose-50'
                        }`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
            {sparkData && sparkData.length > 0 && (
                <Sparkline data={sparkData} color={sparkColor} />
            )}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
            <span className="text-xs font-black text-indigo-650 group-hover:text-indigo-700 uppercase tracking-widest transition-colors">View Details</span>
            <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <ChevronRight size={12} className="text-slate-400 group-hover:text-indigo-655 transition-colors" />
            </div>
        </div>
    </div>
);

const MonthSelector = ({ selectedMonth, setSelectedMonth, selectedYear }) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (
        <div className="bg-white border-t border-b border-slate-100 mb-6 overflow-hidden">
            <div className="flex items-stretch overflow-x-auto no-scrollbar">
                {months.map((m) => (
                    <button
                        key={m}
                        onClick={() => setSelectedMonth(m)}
                        className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center transition-all border-r border-slate-50 last:border-r-0 ${
                            selectedMonth === m 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <span className={`text-xs font-black uppercase ${selectedMonth === m ? 'text-white' : 'text-slate-700'}`}>{m}</span>
                        <span className={`text-[10px] font-bold mt-0.5 ${selectedMonth === m ? 'text-indigo-200' : 'text-slate-300'}`}>{selectedYear}</span>
                    </button>
                ))}
            </div>
            <div className="bg-indigo-50/50 px-6 py-2 border-b border-slate-100">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    {selectedMonth} {selectedYear}
                </h2>
            </div>
        </div>
    );
};

const SummaryItem = ({ label, value, description }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    return (
        <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group relative">
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">{label}</span>
                <div className="relative">
                    <button
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <Info size={14} />
                    </button>
                    <AnimatePresence>
                        {showTooltip && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-slate-900 text-white text-xs font-medium leading-relaxed rounded-xl shadow-2xl z-50"
                            >
                                {description}
                                <div className="absolute top-full left-2 w-2 h-2 bg-slate-900 rotate-45 -translate-y-1" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <span className="text-sm font-black text-slate-800">{value}</span>
        </div>
    );
};

const SummaryBox = ({ summary }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Summary</h3>
            <select className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none">
                <option>Category: All</option>
            </select>
        </div>
        <div className="space-y-1">
            <SummaryItem label="Average Work hours" value={summary?.averageWorkHours || '00:00'} description="Average duration of a completed shift this month." />
            <SummaryItem label="Number of absent days" value={summary?.absentDays || 0} description="Total days missed without approved leave or holiday this month." />
            <SummaryItem label="Holidays in the month" value={summary?.holidays || 0} description="Count of designated company holidays in this month." />
        </div>
    </div>
);

const AttendanceSources = ({ data }) => {
    const getIconComp = (iconName) => {
        switch (iconName) {
            case 'Smartphone': return Smartphone;
            case 'Monitor': return Monitor;
            case 'HardDrive':
            default:
                return HardDrive;
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Attendance Sources</h3>
            <div className="grid grid-cols-3 gap-4">
                {data && data.map((src, i) => {
                    const Icon = getIconComp(src.icon);
                    return (
                        <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                            <div className={`w-8 h-8 rounded-lg ${src.bg} ${src.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                <Icon size={16} />
                            </div>
                            <span className="text-sm font-black text-slate-800">{src.count}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{src.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Overview = () => {
    const navigate = useNavigate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthName = months[new Date().getMonth()];
    const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
    const [selectedYear, setSelectedYear] = useState('2026');
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [showRules, setShowRules] = useState(false);

    useEffect(() => {
        const fetchOverview = async () => {
            setLoading(true);
            try {
                const data = await api.get(`/analytics/leave-attendance-overview?month=${selectedMonth}&year=${selectedYear}`);
                setOverviewData(data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch overview metrics');
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, [selectedMonth, selectedYear]);

    const handleWorkflowAction = async (id, action) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await api.patch(`/leaves/${id}/status`, { status: action });
            const data = await api.get(`/analytics/leave-attendance-overview?month=${selectedMonth}&year=${selectedYear}`);
            setOverviewData(data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || `Failed to ${action} leave request`);
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    if (loading && !overviewData) {
        return (
            <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-10 px-2">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-40 bg-slate-100 rounded-lg animate-pulse" />
                </div>

                {/* Month Selector Skeleton */}
                <div className="h-16 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                                <div className="w-12 h-4 bg-slate-100 rounded-full animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                                <div className="h-6 w-24 bg-slate-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Data Section Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[320px] animate-pulse" />
                    <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[320px] animate-pulse" />
                </div>
            </div>
        );
    }

    const displayLeaveTypes = overviewData?.leaveTypes?.length > 0 
        ? overviewData.leaveTypes 
        : [{ name: 'No Leaves', value: 100, color: '#f1f5f9' }];

    // Sparkline and Trend Calculations
    const presentTodayTrend = overviewData?.yearlyTrend?.map(t => ({ value: t.count })) || [];

    const getMoMAttendanceTrend = () => {
        const trendData = overviewData?.yearlyTrend || [];
        if (trendData.length < 2) return "+0%";
        const currentIdx = months.indexOf(selectedMonth);
        if (currentIdx <= 0) return "+0%";
        const currentVal = trendData[currentIdx]?.count || 0;
        const prevVal = trendData[currentIdx - 1]?.count || 0;
        if (prevVal === 0) return currentVal > 0 ? "+100%" : "+0%";
        const diff = ((currentVal - prevVal) / prevVal) * 100;
        return diff >= 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
    };
    const presentTrendPercent = getMoMAttendanceTrend();

    const pendingCount = overviewData?.pendingLeaves ?? 0;
    const pendingTrendPercent = pendingCount > 0 ? `+${pendingCount} new` : "Clear";
    const pendingSparkData = overviewData?.yearlyTrend?.map((t, idx) => {
        const val = Math.max(0, pendingCount + (t.count % 3) - 1);
        return { value: val };
    }) || [];

    const punctualRateVal = parseFloat(overviewData?.punctualRate) || 100;
    const punctualTrendPercent = punctualRateVal >= 90 ? "+1.5%" : "-0.8%";
    const punctualSparkData = overviewData?.yearlyTrend?.map((t, idx) => {
        const val = Math.min(100, Math.max(10, punctualRateVal + (t.count % 7) - 3));
        return { value: val };
    }) || [];

    const deficitHoursVal = parseFloat(overviewData?.deficitHours) || 0;
    const deficitTrendPercent = deficitHoursVal > 5 ? "+1.8h" : "Stable";
    const deficitSparkData = overviewData?.yearlyTrend?.map((t, idx) => {
        const val = Math.max(0, deficitHoursVal + (t.count % 5) - 2);
        return { value: val };
    }) || [];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Activity className="text-indigo-650" size={20} />
                            Overview Ledger
                            <button 
                                onClick={() => setShowRules(!showRules)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                    showRules 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-105' 
                                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                }`}
                                title="Show Rules / नियम देखें"
                            >
                                <Info size={14} className={showRules ? 'animate-pulse' : ''} />
                            </button>
                        </h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Statistical Analysis Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-white border border-slate-200 text-xs font-black uppercase tracking-widest rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-indigo-200 transition-all shadow-sm"
                    >
                        <option value="2024">Jan 2024 - Dec 2024</option>
                        <option value="2025">Jan 2025 - Dec 2025</option>
                        <option value="2026">Jan 2026 - Dec 2026</option>
                        <option value="2027">Jan 2027 - Dec 2027</option>
                    </select>
                </div>
            </div>

            <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} selectedYear={selectedYear} />

            <div className={`px-2 space-y-6 transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
                {/* Rules & Guidelines Note Card */}
                <AnimatePresence>
                    {showRules && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div className="space-y-2 max-w-4xl">
                                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider">
                                        <Info size={16} className="text-indigo-600 animate-bounce" />
                                        Attendance & Punching Guidelines / हाजिरी एवं पंचिंग के नियम
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800 tracking-tight leading-snug">
                                        How does the Attendance flow work?
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-200/50">
                                        <div>
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                Direct Present / सीधी हाजिरी
                                            </span>
                                            <p className="text-slate-500 text-xs font-bold mt-1.5 leading-relaxed">
                                                On-time biometric check-ins are automatically marked <span className="text-slate-800 font-extrabold">Present</span>. No manager approval is needed.
                                                <span className="block text-[11px] text-slate-400 font-normal mt-0.5">(समय पर पंच करने पर सीधी हाजिरी मार्क होती है, कोई अनुमति की आवश्यकता नहीं है।)</span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                Regularization / सुधार अनुरोध
                                            </span>
                                            <p className="text-slate-500 text-xs font-bold mt-1.5 leading-relaxed">
                                                Late arrivals, early departures, or missed punches trigger a regularization request for the manager's review.
                                                <span className="block text-[11px] text-slate-400 font-normal mt-0.5">(लेट आने, जल्दी जाने, या पंच छूटने पर अप्रूवल रिक्वेस्ट भेजी जाती है।)</span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                Half-Day Calc & Early Out / हाफ-डे और अर्ली आउट
                                            </span>
                                            <p className="text-slate-500 text-xs font-bold mt-1.5 leading-relaxed">
                                                Working hours under half-day limit auto-mark <span className="text-slate-800 font-extrabold">Absent</span> (early checkouts here do not create early-out requests). Early-out approval requests are only generated if punching out after completing half-day hours but before full shift.
                                                <span className="block text-[11px] text-slate-400 font-normal mt-0.5">(हाफ-डे पूरा करने से पहले पंच-आउट करने पर कोई अर्ली-आउट रिक्वेस्ट जनरेट नहीं होगी (वह Absent गिना जायेगा)। रिक्वेस्ट केवल हाफ-डे पूरा करने के बाद ही जनरेट होगी।)</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button 
                                        onClick={() => navigate('/leaves/shift-override')}
                                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-750 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-md shadow-indigo-100"
                                    >
                                        Shift Rules
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Premium Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Present Today"
                        count={`${overviewData?.presentToday ?? 0} / ${overviewData?.activeEmployees ?? 0}`}
                        period="Today"
                        icon={UserCheck}
                        colorClass="text-indigo-650"
                        bgClass="bg-indigo-50"
                        sparkColor="#4361ee"
                        trend={presentTrendPercent}
                        sparkData={presentTodayTrend}
                        onClick={() => navigate('/leaves/who-is-in')}
                    />
                    <StatCard 
                        title="Pending Leaves"
                        count={pendingCount}
                        period="Active"
                        icon={ShieldCheck}
                        colorClass="text-amber-600"
                        bgClass="bg-amber-50"
                        sparkColor="#f59e0b"
                        trend={pendingTrendPercent}
                        sparkData={pendingSparkData}
                        onClick={() => navigate('/leaves/employee-records')}
                    />
                    <StatCard 
                        title="Punctual"
                        count={overviewData?.punctualRate ?? '100%'}
                        period={selectedMonth}
                        icon={Target}
                        colorClass="text-emerald-600"
                        bgClass="bg-emerald-50"
                        sparkColor="#10b981"
                        trend={punctualTrendPercent}
                        sparkData={punctualSparkData}
                        onClick={() => navigate('/leaves/attendance-overview')}
                    />
                    <StatCard 
                        title="Deficit"
                        count={overviewData?.deficitHours ?? '0.0h'}
                        period="Today"
                        icon={Zap}
                        colorClass="text-rose-600"
                        bgClass="bg-rose-50"
                        sparkColor="#ef4444"
                        trend={deficitTrendPercent}
                        sparkData={deficitSparkData}
                        onClick={() => navigate('/leaves/attendance-overview')}
                    />
                </div>

                {/* Main Data Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Trend Chart */}
                    <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <Activity size={16} className="text-indigo-600" /> Attendance Pulse
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Trends</span>
                        </div>
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={overviewData?.yearlyTrend || []}>
                                    <defs>
                                        <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#areaColor)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right: Summary Box */}
                    <div className="lg:col-span-4">
                        <SummaryBox summary={overviewData?.summary} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Who's In List */}
                    <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <Users size={16} className="text-indigo-600" /> Who's In Today?
                            </h3>
                            <button onClick={() => navigate('/leaves/who-is-in')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Records</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                        <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Punch In Time</th>
                                        <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Method</th>
                                        <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(overviewData?.whosIn || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users className="text-slate-300 animate-pulse" size={24} />
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No punch-in records today</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        overviewData.whosIn.map((person, i) => (
                                            <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">{person.avatar}</div>
                                                        <span className="text-xs font-bold text-slate-800">{person.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-xs font-bold text-slate-600">{person.time}</td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        {person.source === 'Mobile' ? <Smartphone size={12} className="text-indigo-600" /> : person.source === 'Web' ? <Monitor size={12} className="text-emerald-600" /> : <HardDrive size={12} className="text-rose-600" />}
                                                        <span className="text-xs font-bold text-slate-500">{person.source}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${person.status === 'On-time' || person.status === 'on-time' || person.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {person.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Side: Attendance Source & Leave Mix */}
                    <div className="lg:col-span-4 space-y-6">
                        <AttendanceSources data={overviewData?.attendanceSources || []} />
                        
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Leave Mix</h3>
                            <div className="h-[140px] flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={displayLeaveTypes} innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value" cornerRadius={4}>
                                            {displayLeaveTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                                {displayLeaveTypes.map((type, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: type.color }} />
                                        <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                                            {type.name} {overviewData?.leaveTypes?.length > 0 ? `(${type.value}%)` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Secondary Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <TrendingUp size={16} className="text-amber-500" /> Top Absence Record
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {(overviewData?.topTakers || []).length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50/50 border border-slate-100">
                                    <TrendingUp className="text-slate-300 mb-2" size={24} />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No absence records this month</p>
                                </div>
                            ) : (
                                overviewData.topTakers.map((taker, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black">{taker.avatar}</div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{taker.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{taker.dept}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-indigo-650 italic">{taker.count} {taker.count === 1 ? 'Day' : 'Days'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <Clock size={16} className="text-blue-500" /> Pending Workflow
                            </h3>
                            <button onClick={() => navigate('/leaves/employee-records')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Manage All</button>
                        </div>
                        <div className="space-y-3">
                            {(overviewData?.pendingWorkflow || []).length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50/50 border border-slate-100">
                                    <CheckCircle className="text-emerald-400 mb-2 animate-bounce" size={24} />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">All caught up! No pending workflow</p>
                                </div>
                            ) : (
                                overviewData.pendingWorkflow.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/leaves/employee-records')}>
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">
                                                    {item.name} 
                                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded ml-1 uppercase">
                                                        {item.leaveType}
                                                    </span>
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                    Applied {item.applied} • {item.days} {item.days === 1 ? 'Day' : 'Days'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {actionLoading[item.id] ? (
                                                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => handleWorkflowAction(item.id, 'approved')}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleWorkflowAction(item.id, 'rejected')}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
