import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../utils/api';

const EmployeeAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await api.get('/analytics/metrics');
                setMetrics(data);
            } catch (err) {
                console.error('Failed to fetch employee analytics metrics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    // Helper to format numbers as Indian Currency (INR)
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-10 font-outfit">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Live Analytics...</p>
            </div>
        );
    }

    // --- CHART DATA CONFIGURATION ---

    // 1. Hiring vs Resignation Data (Hiring & Retention Trends)
    const defaultHiringData = [
        { month: 'Jan', hired: 4, resigned: 1 },
        { month: 'Feb', hired: 6, resigned: 2 },
        { month: 'Mar', hired: 8, resigned: 1 },
        { month: 'Apr', hired: 5, resigned: 3 },
        { month: 'May', hired: 12, resigned: 2 },
        { month: 'Jun', hired: 7, resigned: 4 },
    ];
    const hiringData = metrics?.trends?.length > 0 
        ? metrics.trends.map(item => ({
            month: item.month,
            hired: parseInt(item.joined) || 0,
            resigned: parseInt(item.resigned) || 0
          }))
        : defaultHiringData;

    // 2. Department Headcount Distribution Data
    const DEPT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#64748b', '#3b82f6', '#8b5cf6'];
    const defaultDeptData = [
        { name: 'Technology', value: 45, count: 45, color: '#6366f1' },
        { name: 'Product', value: 20, count: 20, color: '#10b981' },
        { name: 'Operations', value: 15, count: 15, color: '#f59e0b' },
        { name: 'Sales', value: 12, count: 12, color: '#ec4899' },
        { name: 'HR', value: 8, count: 8, color: '#64748b' },
    ];
    let deptData = defaultDeptData;
    if (metrics?.departmentDist && metrics.departmentDist.length > 0) {
        const total = metrics.departmentDist.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
        deptData = metrics.departmentDist.map((item, idx) => ({
            name: item.name,
            value: total > 0 ? Math.round(((parseInt(item.count) || 0) / total) * 100) : 0,
            count: parseInt(item.count) || 0,
            color: DEPT_COLORS[idx % DEPT_COLORS.length]
        }));
    }

    // 3. Employee Tenure Distribution Data
    const TENURE_COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'];
    const defaultTenureData = [
        { bracket: '<1 Year', count: 14, fill: '#818cf8' },
        { bracket: '1-2 Years', count: 28, fill: '#6366f1' },
        { bracket: '2-4 Years', count: 35, fill: '#4f46e5' },
        { bracket: '4-7 Years', count: 18, fill: '#4338ca' },
        { bracket: '7+ Years', count: 9, fill: '#3730a3' },
    ];
    const tenureData = metrics?.serviceDistribution?.length > 0
        ? metrics.serviceDistribution.map((item, idx) => {
            let label = item.years;
            if (item.years === '< 1') label = '<1 Year';
            else if (item.years === '1-2') label = '1-2 Years';
            else if (item.years === '2-4') label = '2-4 Years';
            else if (item.years === '4-7') label = '4-7 Years';
            else if (item.years === '> 7') label = '7+ Years';
            
            return {
                bracket: label,
                count: parseInt(item.count) || 0,
                fill: TENURE_COLORS[idx % TENURE_COLORS.length]
            };
          })
        : defaultTenureData;

    // 4. Monthly Payroll Expenditure Data
    const defaultPayrollData = [
        { month: 'Jan', total: 420000 },
        { month: 'Feb', total: 450000 },
        { month: 'Mar', total: 430000 },
        { month: 'Apr', total: 480000 },
        { month: 'May', total: 520000 },
        { month: 'Jun', total: 550000 },
    ];
    const payrollData = metrics?.monthlyCTC?.length > 0
        ? metrics.monthlyCTC.map(item => ({
            month: item.month,
            total: parseFloat(item.total) || 0
          }))
        : defaultPayrollData;

    // 5. Gender Diversity Breakdown Data
    const defaultDiversityData = [
        { gender: 'Male', value: 58, count: 58, color: '#4f46e5' },
        { gender: 'Female', value: 38, count: 38, color: '#ec4899' },
        { gender: 'Non-binary', value: 4, count: 4, color: '#10b981' },
    ];
    const GENDER_COLORS = {
        'male': '#4f46e5',
        'female': '#ec4899',
        'other': '#10b981',
        'non-binary': '#10b981',
        'unassigned': '#94a3b8'
    };
    let diversityData = defaultDiversityData;
    if (metrics?.genderDist && metrics.genderDist.length > 0) {
        const total = metrics.genderDist.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
        diversityData = metrics.genderDist.map(item => {
            const label = item.gender ? item.gender.charAt(0).toUpperCase() + item.gender.slice(1).toLowerCase() : 'Unassigned';
            const genderKey = (item.gender || 'unassigned').toLowerCase();
            return {
                gender: label,
                value: total > 0 ? Math.round(((parseInt(item.count) || 0) / total) * 100) : 0,
                count: parseInt(item.count) || 0,
                color: GENDER_COLORS[genderKey] || '#64748b'
            };
        });
    }

    // 6. Age Demographics Distribution Data
    const defaultAgeData = [
        { group: '20-25', count: 15 },
        { group: '26-30', count: 32 },
        { group: '31-35', count: 28 },
        { group: '36-40', count: 16 },
        { group: '41-45', count: 8 },
        { group: '46+', count: 5 },
    ];
    const ageData = metrics?.ageDist?.length > 0
        ? metrics.ageDist.map(item => ({
            group: item.age_range,
            count: parseInt(item.count) || 0
          }))
        : defaultAgeData;

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-outfit">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Analytics Hub</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Advanced workforce intelligence and demographic insights.</p>
                </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Workforce Growth (Hires vs Resignations Trend) */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Workforce Growth (Hires vs Resignations Trend)</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">Monthly comparison of recruits versus exited employees.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hired</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resigned</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={hiringData}>
                                    <defs>
                                        <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="hired" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" />
                                    <Area type="monotone" dataKey="resigned" stroke="#fb7185" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2. Department Headcount Distribution */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Department Headcount Distribution</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Percentage and numerical breakdown of personnel across departments.</p>
                        </div>
                        <div className="flex items-center h-[280px]">
                            <div className="w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={deptData}
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {deptData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-4 pl-4 max-h-[280px] overflow-y-auto">
                                {deptData.map((dept, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[100px]">{dept.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-400 shrink-0">{dept.value}% ({dept.count})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Employee Tenure Distribution */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Employee Tenure Distribution</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Headcount grouped by years of service at MyFastHR.</p>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tenureData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="bracket" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{fill: '#f8fafc'}}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                        {tenureData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 4. Monthly Payroll Expenditure Trend */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Monthly Payroll Expenditure Trend</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Sum of net salary disbursements over the last 6 months.</p>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={payrollData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value), 'Total Net Payout']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} dot={{ stroke: '#4f46e5', strokeWidth: 2, r: 4, fill: '#fff' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 5. Gender Diversity Representation */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Gender Diversity Representation</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Breakdown of workforce diversity by gender classification.</p>
                        </div>
                        <div className="flex items-center h-[280px]">
                            <div className="w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={diversityData}
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {diversityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-4 pl-4">
                                {diversityData.map((div, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: div.color }} />
                                            <span className="text-xs font-bold text-slate-600 truncate">{div.gender}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-400 shrink-0">{div.value}% ({div.count})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Age Demographics Distribution */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Age Demographics Distribution</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Number of employees distributed across age cohorts.</p>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{fill: '#f8fafc'}}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeAnalytics;
