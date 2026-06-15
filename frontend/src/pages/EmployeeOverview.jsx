import React from 'react';
import { 
    Users, UserPlus, UserMinus, Cake, Award, 
    Clock, Radio, ChevronRight, ArrowUpRight, 
    Calendar, UserCheck, Monitor,
    RotateCcw, CheckCircle2, XCircle, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

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

const StatCard = ({ title, count, period, icon: Icon, colorClass, sparkColor, trend, sparkData, onClick }) => (
    <div onClick={onClick} className="bg-white border border-slate-200/60 rounded-[24px] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-full relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 flex items-center justify-center`}>
                <Icon size={18} className={colorClass} />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full">
                {period}
            </div>
        </div>
        <div className="flex items-end justify-between gap-4 mt-2">
            <div className="space-y-1.5">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">{title}</h4>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{count}</span>
                    {trend && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                            trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'
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
            <span className="text-[10px] font-black text-indigo-650 group-hover:text-indigo-700 uppercase tracking-widest transition-colors">View Details</span>
            <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <ChevronRight size={12} className="text-slate-400 group-hover:text-indigo-655 transition-colors" />
            </div>
        </div>
    </div>
);

const PieTooltip = ({ active, payload, labelPrefix = '' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-[2px] px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-md text-[9px] font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap z-50">
                <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: payload[0].color }} />
                <span>{payload[0].name}:</span>
                <span className="text-slate-900">{payload[0].value}{labelPrefix}</span>
            </div>
        );
    }
    return null;
};

const EmployeeOverview = () => {
    const [pendingOnboarding, setPendingOnboarding] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [activities, setActivities] = useState([]);
    const [whosIn, setWhosIn] = useState({ onTime: [], lateArrivals: [] });
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState({ show: false, id: null, reason: '' });
    const navigate = useNavigate();

    const fetchPending = async () => {
        try {
            console.log(">>> [ADMIN-UI]: Polling for updates...");
            const [pendingData, empData, activitiesData, whosInRes] = await Promise.all([
                api.get(`/employees/onboarding/pending?_t=${Date.now()}`),
                api.get(`/employees?_t=${Date.now()}`),
                api.get(`/analytics/recent-activities?_t=${Date.now()}`),
                api.get(`/attendance/whos-in?_t=${Date.now()}`).catch(() => ({ onTime: [], lateArrivals: [] }))
            ]);
            console.log(">>> [ADMIN-UI]: Received Pending Onboarding (Count:", pendingData.length, "):", pendingData);
            setPendingOnboarding(Array.isArray(pendingData) ? pendingData : []);
            setEmployees(Array.isArray(empData) ? empData : []);
            setActivities(Array.isArray(activitiesData) ? activitiesData : []);
            setWhosIn(whosInRes || { onTime: [], lateArrivals: [] });
        } catch (err) {
            console.error('>>> [ADMIN-UI-ERROR]: Failed to fetch employee data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
        // Poll every 10 seconds for testing
        const interval = setInterval(fetchPending, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (id, action) => {
        if (action === 'reject') {
            setRejectModal({ show: true, id, reason: 'Incomplete or incorrect documentation' });
            return;
        }

        if (!window.confirm(`Are you sure you want to ${action} this employee?`)) return;

        try {
            await api.post(`/employees/onboarding/${id}/${action}`);
            fetchPending();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action}`);
        }
    };

    const confirmReject = async () => {
        if (!rejectModal.reason.trim()) {
            alert('Please provide a reason for rejection.');
            return;
        }

        try {
            await api.post(`/employees/onboarding/${rejectModal.id}/reject`, { reason: rejectModal.reason });
            setRejectModal({ show: false, id: null, reason: '' });
            fetchPending();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject');
        }
    };

    // Format department names for clean display
    const formatDeptName = (dept) => {
        if (!dept) return 'General';
        return dept
            .split(/[_-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const liveLogs = employees.slice(0, 5).map(e => {
        const punch = [
            ...(whosIn.onTime || []),
            ...(whosIn.lateArrivals || [])
        ].find(a => String(a.id) === String(e.employee_id_number));

        return {
            name: `${e.first_name} ${e.last_name}`,
            role: e.designation || "Employee",
            dept: formatDeptName(e.department_name || e.department || "General"),
            status: punch ? (punch.check_out ? "Away" : "Online") : "Away",
            time: punch ? punch.time : "--"
        };
    });

    // 1. Department strength data processing
    const departmentCounts = {};
    employees.forEach(e => {
        const rawDept = e.department_name || e.department || 'General';
        const dept = formatDeptName(rawDept);
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });
    const deptChartData = Object.keys(departmentCounts).map(dept => ({
        name: dept,
        value: departmentCounts[dept]
    })).sort((a, b) => b.value - a.value);

    // Color palette for departments
    const DEPT_COLORS = ['#4361ee', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#3b82f6'];

    // Dynamic Department strength calculation for Sidebar list
    const totalWithDept = deptChartData.reduce((sum, d) => sum + d.value, 0) || 1;
    const sidebarDeptData = deptChartData.slice(0, 5).map((d, i) => ({
        label: d.name,
        count: d.value,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
        percent: Math.round((d.value / totalWithDept) * 100)
    }));

    // 2. Gender diversity data processing
    const genderCounts = { Male: 0, Female: 0, Others: 0, Unspecified: 0 };
    employees.forEach(e => {
        if (!e.gender) {
            genderCounts.Unspecified++;
        } else {
            const g = String(e.gender).toLowerCase();
            if (g === 'male') genderCounts.Male++;
            else if (g === 'female') genderCounts.Female++;
            else if (g === 'other' || g === 'others') genderCounts.Others++;
            else genderCounts.Unspecified++;
        }
    });
    const genderChartData = Object.keys(genderCounts)
        .map(g => ({ name: g, value: genderCounts[g] }))
        .filter(d => d.value > 0);

    const GENDER_COLORS = {
        Male: '#3b82f6',
        Female: '#ec4899',
        Others: '#8b5cf6',
        Unspecified: '#94a3b8'
    };

    // 3. Historical Headcount, Hires, and Exits (last 6 months)
    const getHistoricalData = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                name: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                monthIndex: d.getMonth(),
                hires: 0,
                exits: 0,
                headcount: 0
            });
        }

        months.forEach(m => {
            const startOfM = new Date(m.year, m.monthIndex, 1);
            const endOfM = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59, 999);

            employees.forEach(e => {
                const joinDate = e.joining_date ? new Date(e.joining_date) : (e.created_at ? new Date(e.created_at) : null);
                const exitDate = e.exit_date ? new Date(e.exit_date) : (e.resignation_date ? new Date(e.resignation_date) : null);

                // Hires in month
                if (joinDate && joinDate >= startOfM && joinDate <= endOfM) {
                    m.hires++;
                }

                // Exits in month
                if (exitDate && exitDate >= startOfM && exitDate <= endOfM) {
                    m.exits++;
                }

                // Active headcount at end of month
                if (joinDate && joinDate <= endOfM && (!exitDate || exitDate > endOfM)) {
                    m.headcount++;
                }
            });
        });

        return months;
    };

    const trendChartData = getHistoricalData();

    // Compute sparkline trends (last 6 months)
    const totalWorkforceTrend = trendChartData.map(m => {
        const endOfM = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59, 999);
        const count = employees.filter(e => {
            const jd = e.joining_date ? new Date(e.joining_date) : (e.created_at ? new Date(e.created_at) : null);
            return jd && jd <= endOfM;
        }).length;
        return { value: count };
    });

    const activeStaffTrend = trendChartData.map(m => ({ value: m.headcount }));

    const onboardingQueueTrend = trendChartData.map(m => {
        const endOfM = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59, 999);
        const count = pendingOnboarding.filter(e => {
            const cd = e.created_at ? new Date(e.created_at) : null;
            return cd && cd <= endOfM;
        }).length;
        return { value: count || 0.1 };
    });

    const separationsTrend = trendChartData.map(m => ({ value: m.exits }));

    const getTrendPercentage = (trendData) => {
        if (trendData.length < 2) return null;
        const current = trendData[trendData.length - 1].value;
        const previous = trendData[trendData.length - 2].value;
        if (previous === 0) {
            return current > 0 ? `+${current * 100}%` : null;
        }
        const diff = ((current - previous) / previous) * 100;
        if (diff === 0) return '0%';
        return diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
    };

    const totalTrend = getTrendPercentage(totalWorkforceTrend);
    const activeTrend = getTrendPercentage(activeStaffTrend);
    const exitsTrend = getTrendPercentage(separationsTrend);

    const cards = [
        {
            title: "Total Workforce",
            count: employees.length,
            period: "Overall",
            icon: Users,
            colorClass: "text-[#4361ee]",
            sparkColor: "#4361ee",
            trend: totalTrend || "+0%",
            sparkData: totalWorkforceTrend,
            path: "/employees"
        },
        {
            title: "Active Staff",
            count: employees.filter(e => e.status === 'active').length,
            period: "On Payroll",
            icon: UserCheck,
            colorClass: "text-emerald-600",
            sparkColor: "#10b981",
            trend: activeTrend || "+0%",
            sparkData: activeStaffTrend,
            path: "/employees"
        },
        {
            title: "Onboarding Queue",
            count: pendingOnboarding.length,
            period: "Pending Review",
            icon: Clock,
            colorClass: "text-amber-600",
            sparkColor: "#f59e0b",
            trend: pendingOnboarding.length > 0 ? `+${pendingOnboarding.length} new` : "Clear",
            sparkData: onboardingQueueTrend,
            path: "/employees/onboard"
        },
        {
            title: "Separations",
            count: employees.filter(e => e.status === 'inactive').length,
            period: "Exited",
            icon: UserMinus,
            colorClass: "text-rose-500",
            sparkColor: "#ef4444",
            trend: exitsTrend || "0%",
            sparkData: separationsTrend,
            path: "/employees"
        }
    ];

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-outfit">
            {/* Professional Header */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workforce Analytics</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Operational overview of personnel lifecycle and real-time connectivity.</p>
                </div>
            </div>

            {/* Summary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, idx) => (
                    <StatCard
                        key={idx}
                        title={card.title}
                        count={card.count}
                        period={card.period}
                        icon={card.icon}
                        colorClass={card.colorClass}
                        sparkColor={card.sparkColor}
                        trend={card.trend}
                        sparkData={card.sparkData}
                        onClick={() => navigate(card.path)}
                    />
                ))}
            </div>

            {/* Workforce Analytical Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Area & Bar Charts: Headcount & Hire/Exit Trends */}
                <div className="lg:col-span-8 bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Workforce Activity & Growth</h3>
                            <p className="text-[8px] font-bold text-slate-450 uppercase mt-0.5">Live headcount trend and hiring versus exit ratios</p>
                        </div>
                        <div className="flex gap-4 text-[9px] font-black uppercase tracking-wider">
                            <span className="flex items-center gap-1.5 text-indigo-600"><span className="w-2 h-2 bg-[#4361ee] rounded-full inline-block"></span> Headcount</span>
                            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 bg-[#10b981] rounded-full inline-block"></span> Hires</span>
                            <span className="flex items-center gap-1.5 text-rose-500"><span className="w-2 h-2 bg-[#ef4444] rounded-full inline-block"></span> Exits</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Area Chart: Headcount Growth */}
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cumulative Headcount Trend</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4361ee" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#4361ee" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(value) => [`${value} active`, 'Headcount']} />
                                        <Area type="monotone" dataKey="headcount" stroke="#4361ee" strokeWidth={2} fillOpacity={1} fill="url(#colorHeadcount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar Chart: Hires vs Exits */}
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Monthly Hires vs Exits</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(value, name) => [value, name === 'hires' ? 'New Hires' : 'Resignations']} />
                                        <Bar dataKey="hires" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="exits" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Donut Charts: Demographics & Diversity */}
                <div className="lg:col-span-4 bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="mb-4 pb-4 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Demographic Diversity</h3>
                        <p className="text-[8px] font-bold text-slate-450 uppercase mt-0.5">Department distributions and gender diversity ratio</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                        {/* Department Split */}
                        <div className="flex flex-col items-center">
                            <h4 className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider mb-2">Departments</h4>
                            <div className="h-36 w-36 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={deptChartData.length > 0 ? deptChartData : [{ name: 'Empty', value: 1 }]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={36}
                                            outerRadius={50}
                                            paddingAngle={deptChartData.length > 1 ? 3 : 0}
                                            dataKey="value"
                                        >
                                            {deptChartData.length > 0 ? (
                                                deptChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                                                ))
                                            ) : (
                                                <Cell fill="#e2e8f0" />
                                            )}
                                        </Pie>
                                        <Tooltip content={<PieTooltip labelPrefix=" staff" />} position={{ x: 22, y: -25 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[12px] font-black text-slate-700 leading-none">{employees.length}</span>
                                    <span className="text-[6.5px] text-slate-400 font-bold uppercase mt-0.5">Total</span>
                                </div>
                            </div>
                        </div>

                        {/* Gender Diversity */}
                        <div className="flex flex-col items-center">
                            <h4 className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider mb-2">Gender Diversity</h4>
                            <div className="h-36 w-36 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={genderChartData.length > 0 ? genderChartData : [{ name: 'Unspecified', value: 1 }]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={36}
                                            outerRadius={50}
                                            paddingAngle={genderChartData.length > 1 ? 3 : 0}
                                            dataKey="value"
                                        >
                                            {genderChartData.length > 0 ? (
                                                genderChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name] || '#94a3b8'} />
                                                ))
                                            ) : (
                                                <Cell fill="#e2e8f0" />
                                            )}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} position={{ x: 22, y: -25 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide leading-none">Ratio</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gender Legend */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5 text-[8.5px] font-bold text-slate-400 justify-center">
                        {genderChartData.length > 0 ? genderChartData.map((g, idx) => (
                            <span key={idx} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: GENDER_COLORS[g.name] }}></span>
                                <span className="text-slate-650 font-black">{g.name}:</span> {g.value}
                            </span>
                        )) : (
                            <span className="text-slate-400 italic">No diversity data</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Monitor Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Monitor size={18} className="text-slate-400" />
                            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Current Live Sessions</h3>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                            Live Status
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/30">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Department</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Login Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {liveLogs.map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">
                                                    {log.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">{log.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{log.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{log.dept}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    log.status === 'Online' ? 'bg-emerald-500' : 
                                                    log.status === 'Away' ? 'bg-amber-500' : 'bg-indigo-500'
                                                }`} />
                                                <span className="text-[11px] font-bold text-slate-600">{log.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-medium text-slate-400 font-mono">{log.time}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Right Sidebar: Pending Onboarding & Activity */}
                <div className="space-y-8">
                    {/* Pending Onboarding Box */}
                    <div className="bg-white border-2 border-amber-100 rounded-2xl shadow-xl shadow-amber-500/5 overflow-hidden">
                        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-500/20">
                                    <Clock size={16} />
                                </div>
                                <h4 className="text-[13px] font-black text-amber-900 uppercase tracking-wider">Pending Onboarding</h4>
                            </div>
                            <span className="px-2.5 py-0.5 bg-amber-200/50 text-[10px] font-black text-amber-700 rounded-full uppercase tracking-widest">
                                {pendingOnboarding.length} Review
                            </span>
                        </div>
                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                            {pendingOnboarding.length > 0 ? (
                                pendingOnboarding.map((emp) => (
                                    <div key={emp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 group hover:border-amber-300 transition-all">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-600">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{emp.first_name} {emp.last_name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold italic">{emp.email}</p>
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/profile?id=${emp.id}`)}
                                                className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-100"
                                                title="View Profile for Review"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => handleAction(emp.id, 'approve')}
                                                className="flex flex-col items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all"
                                            >
                                                <CheckCircle2 size={16} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Approve</span>
                                            </button>
                                            <button 
                                                onClick={() => handleAction(emp.id, 'reject')}
                                                className="flex flex-col items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <XCircle size={16} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Reject</span>
                                            </button>
                                            <button 
                                                onClick={() => handleAction(emp.id, 'resend')}
                                                className="flex flex-col items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-all"
                                            >
                                                <RotateCcw size={16} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Resend</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <UserCheck size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed px-6">
                                        All onboarding queues are clear. No pending reviews found.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-6">Department Strength</h4>
                        <div className="space-y-4">
                            {sidebarDeptData.length > 0 ? sidebarDeptData.map((dept, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">{dept.label}</span>
                                        <span className="text-[11px] font-bold text-slate-800">{dept.count} {dept.count === 1 ? 'staff' : 'staffs'}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${dept.percent}%` }}
                                            style={{ backgroundColor: dept.color }}
                                            className="h-full"
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-[11px] text-slate-400 font-bold italic text-center py-4">No active departments.</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Timeline */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-6">Recent Activity</h4>
                        {activities.length > 0 ? (
                            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                                {activities.map((act, i) => (
                                    <div key={i} className="flex items-start gap-4 relative">
                                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                act.type === 'hiring' ? 'bg-emerald-500' : 
                                                act.type === 'leave' ? 'bg-indigo-500' : 
                                                act.type === 'attendance' ? 'bg-amber-500' : 
                                                act.type === 'security' ? 'bg-rose-500' : 'bg-slate-400'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-700 leading-none">
                                                <span className="font-bold">{act.user}</span> {act.action}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1">{act.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-[11px] text-slate-400 font-bold italic">No recent activity logs.</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Rejection Modal */}
                <AnimatePresence>
                    {rejectModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setRejectModal({ show: false, id: null, reason: '' })}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                                            <XCircle className="text-rose-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Reject Onboarding</h3>
                                            <p className="text-xs text-slate-500">Provide a reason for the candidate</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                                Rejection Reason
                                            </label>
                                            <textarea 
                                                value={rejectModal.reason}
                                                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                                placeholder="Enter reason for rejection..."
                                                className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm text-slate-700 resize-none"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button 
                                                onClick={() => setRejectModal({ show: false, id: null, reason: '' })}
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={confirmReject}
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
                                            >
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EmployeeOverview;
