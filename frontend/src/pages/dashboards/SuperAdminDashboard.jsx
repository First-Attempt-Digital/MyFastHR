import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Building2, Users, UserPlus, Shield, Activity, 
    ShieldCheck, Zap, Globe, Server, Database, 
    HardDrive, Cpu, MoreVertical, Plus, ChevronLeft, 
    ChevronRight, LayoutGrid, Settings, Power, Search,
    Edit3, ArrowUpRight, ShieldAlert, Cpu as MachineIcon,
    Trash2, Terminal, Megaphone,
    Headphones, MessageSquare, Send, AlertCircle, Info, X, RefreshCw, FileText
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';
import api from '../../utils/api';
import DeleteSecurityModal from '../../components/common/DeleteSecurityModal';

const ActiveSubscriptionsCard = ({ companies = [] }) => {
    const activeCount = companies.filter(c => c.subscription_status === 'active').length;
    const trialCount = companies.filter(c => c.subscription_status === 'trial').length;
    const totalCount = companies.length;

    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative flex flex-col min-h-[420px] animate-in fade-in duration-1000">
            {/* Grid Pattern Background */}
            <div className="absolute inset-x-0 top-0 h-40 pointer-events-none opacity-40">
                <svg viewBox="0 0 400 150" className="w-full h-full">
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="absolute top-5 right-6 text-slate-400">
                <ArrowUpRight size={24} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 pt-16 z-10">
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-full bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                        <span className="text-3xl font-black text-indigo-600 tracking-tighter uppercase">{activeCount}/{totalCount}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-50">
                        <Building2 size={20} className="text-indigo-600 animate-pulse" />
                    </div>
                </div>

                <div className="bg-[#f4fbfe] rounded-[24px] p-8 w-full text-center space-y-5">
                    <span className="text-2xl">⚡</span>
                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none">Subscription Meter</h4>
                    <h3 className="text-[17px] font-bold text-[#2d3436] leading-tight px-2">
                        {activeCount} Active Tenants running on the platform cluster.
                    </h3>
                    <div className="flex justify-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <span>Trial: {trialCount}</span>
                        <span>•</span>
                        <span>Total: {totalCount}</span>
                    </div>

                    <button 
                        onClick={() => navigate('/admin/companies')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full text-[13px] font-bold shadow-lg shadow-indigo-100 transition-all transform active:scale-95 w-full"
                    >
                        Manage Subscriptions
                    </button>
                </div>
            </div>
        </div>
    );
};

const TaskListItem = ({ title, subtitle, action, color = "teal", onClick }) => (
    <div onClick={onClick} className="flex items-center justify-between p-7 transition-all border-b border-slate-100 last:border-0 bg-white hover:bg-[#f4f7fe] cursor-pointer group">
        <div className="flex gap-5 items-center">
            <div className={`w-[3.5px] h-12 rounded-full ${color === 'red' ? 'bg-[#f08a8a]' : 'bg-[#1abc9c]'}`} />
            <div className="space-y-0.5">
                <h4 className="text-[16px] font-bold text-[#2d3436] tracking-tight">{title}</h4>
                <p className="text-[12.5px] font-medium text-[#636e72]">{subtitle}</p>
            </div>
        </div>
        <button className="text-[14px] font-bold text-[#4834d4] hover:text-[#686de0] transition-colors px-6">{action}</button>
    </div>
);

const PlatformSystemConsole = ({ pendingDocs = [], companies = [], health = {} }) => {
    const navigate = useNavigate();
    const thingsToReview = pendingDocs.length;
    const thingsToMonitor = companies.length;

    return (
        <div className="bg-white rounded-[24px] border border-[#e0e4e8] shadow-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in duration-700 max-w-[900px]">
            {/* Sidebar */}
            <div className="md:w-56 bg-[#fff1e6] pt-4 px-8 pb-8 flex flex-col items-center justify-between rounded-l-[24px]">
                <div className="w-40 h-40 relative flex items-center justify-center -mt-8">
                    <img
                        src="/assets/istockphoto-1938643897-612x612-removebg-preview.png"
                        alt="Task Icon"
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="space-y-6 w-full mt-8">
                    <div className="space-y-0 text-left pl-3">
                        <p className="text-[38px] font-bold text-[#e67e22] leading-none tracking-tighter">{thingsToReview}</p>
                        <p className="text-[13.5px] font-medium text-slate-700">KYC to review</p>
                    </div>
                    <div className="space-y-0 text-left pl-3">
                        <p className="text-[38px] font-bold text-[#e67e22] leading-none tracking-tighter">{thingsToMonitor}</p>
                        <p className="text-[13.5px] font-medium text-slate-700">Organizations Active</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-white">
                <TaskListItem 
                    title="KYC Approvals" 
                    subtitle={`${pendingDocs.length} onboarding documentation request(s) awaiting verification.`} 
                    action="Review" 
                    color="red" 
                    onClick={() => navigate('/identity-vault')} 
                />
                <TaskListItem 
                    title="Tenant Monitor" 
                    subtitle={`${companies.length} active business domains running production clusters.`} 
                    action="Monitor" 
                    color="teal" 
                    onClick={() => navigate('/admin/companies')} 
                />
                <TaskListItem 
                    title="Mainframe Cluster Health" 
                    subtitle={`CPU usage is ${health?.resources?.cpu?.usage || 0}% | Memory is ${health?.resources?.memory?.usagePercentage || 0}% loaded.`} 
                    action="Monitor" 
                    color="teal" 
                    onClick={() => navigate('/dashboard?tab=analytics')} 
                />
                <TaskListItem 
                    title="Platform Branding Options" 
                    subtitle="Customize system logo, favicon, and login layouts configurations." 
                    action="Configure" 
                    color="teal" 
                    onClick={() => navigate('/admin/companies?tab=branding')} 
                />
            </div>
        </div>
    );
};

const PlatformLogs = ({ pendingDocs = [], health = {}, tickets = [] }) => {
    const navigate = useNavigate();
    const items = [];

    // Add pending verifications
    pendingDocs.forEach(doc => {
        items.push({
            id: `doc-${doc.id}`,
            type: 'verification',
            title: 'KYC Document Pending',
            date: 'Today',
            description: `${doc.first_name} ${doc.last_name} submitted document (${doc.document_type || 'KYC'}) for ${doc.company_name}.`,
            badge: 'Needs Review',
            badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            bg: 'bg-[#f4f7fe]/70 hover:bg-[#eaeefc]/90 border-indigo-100/50',
            route: '/identity-vault'
        });
    });

    // Add support tickets (including demo bookings) to platform feed
    tickets.forEach(ticket => {
        const isDemo = ticket.title?.startsWith('Demo Booking:');
        items.push({
            id: `ticket-${ticket.id}`,
            type: 'ticket',
            title: ticket.title,
            date: new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            description: ticket.description,
            badge: isDemo ? 'Demo Requested' : 'Ticket: ' + ticket.status,
            badgeBg: isDemo ? 'bg-amber-50 text-amber-700 border-amber-250' : 'bg-rose-50 text-rose-700 border-rose-200',
            bg: isDemo ? 'bg-amber-50/20 hover:bg-amber-50/40 border-amber-100/30' : 'bg-rose-50/10 hover:bg-rose-50/20 border-rose-100/20',
            route: '?tab=support_tickets'
        });
    });

    // Add some default system logs
    items.push({
        id: 'system-1',
        type: 'log',
        title: 'DB Mainframe Optimization',
        date: 'Recent',
        description: 'Database index rebuild completed. Global read time reduced.',
        badge: 'Optimized',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        bg: 'bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-100/30',
        route: null
    });

    items.push({
        id: 'system-2',
        type: 'log',
        title: 'Platform Memory Status',
        date: 'Status',
        description: `Mainframe RAM total memory allocation: ${health?.resources?.memory?.total || 'N/A'}.`,
        badge: 'Info',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        bg: 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-100',
        route: null
    });

    return (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-1000">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-[20px] font-bold text-[#2d3436] tracking-tight">System Events Log</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global platform feed</p>
                </div>
                <ArrowUpRight size={24} className="text-slate-400" />
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => item.route && navigate(item.route)}
                        className={`p-6 rounded-[24px] border transition-all duration-300 ${item.route ? 'cursor-pointer active:scale-98' : ''} ${item.bg} flex flex-col gap-3 group`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.badgeBg}`}>
                                {item.badge}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-[15px] font-extrabold text-[#2d3436] leading-snug group-hover:text-indigo-600 transition-colors">
                                {item.title}
                            </h4>
                            <p className="text-[13px] text-slate-500 font-medium leading-normal mt-1">
                                {item.description}
                            </p>
                        </div>
                        {item.route && (
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 group-hover:text-indigo-800 uppercase tracking-widest mt-1">
                                Take Action <ChevronRight size={12} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const WelcomeView = ({ metrics, pendingDocs, health, companies = [], systemFreezeActive, onToggleFreeze, tickets = [] }) => {
    const navigate = useNavigate();

    const getGreetingDetails = () => {
        const hours = new Date().getHours();
        if (hours >= 4 && hours < 12) {
            return {
                greeting: "Good Morning",
                subtext: "System supervisor core active. 🚀 ☀️"
            };
        } else if (hours >= 12 && hours < 17) {
            return {
                greeting: "Good Afternoon",
                subtext: "System supervisor core active. 🚀 🌤️"
            };
        } else if (hours >= 17 && hours < 22) {
            return {
                greeting: "Good Evening",
                subtext: "System supervisor core active. 🚀 🌙"
            };
        } else {
            return {
                greeting: "Good Night",
                subtext: "System supervisor core active. 🚀 🌌"
            };
        }
    };

    const { greeting, subtext } = getGreetingDetails();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Realistic Sky View Hero */}
            <div 
                className="relative min-h-[260px] flex flex-col justify-center px-6 md:px-12 overflow-hidden rounded-[32px] bg-cover bg-center border border-blue-100 shadow-sm"
                style={{ backgroundImage: "url('/assets/skyline_new.png')" }}
            >
                {/* Soft readability overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/10" />
                
                <div className="relative z-10 space-y-2">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">
                        {greeting},
                    </h1>
                    <p className="text-sm md:text-base font-bold text-slate-600 flex items-center gap-2">
                        {subtext}
                    </p>
                </div>
            </div>

            {/* System-Wide Security Lock Card */}
            <div className={`p-8 rounded-[32px] border transition-all duration-500 shadow-sm ${
                systemFreezeActive 
                ? 'bg-red-50/70 border-red-200/80 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse' 
                : 'bg-white border-slate-100'
            }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                            systemFreezeActive 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-bounce' 
                            : 'bg-slate-50 text-slate-400 group-hover:text-indigo-600'
                        }`}>
                            <ShieldAlert size={28} />
                        </div>
                        <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${systemFreezeActive ? 'bg-red-600 animate-ping' : 'bg-emerald-500'}`} />
                                <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">
                                    {systemFreezeActive ? 'EMERGENCY SYSTEM LOCK ACTIVE' : 'System-Wide Security Lock'}
                                </h3>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 leading-normal max-w-2xl">
                                {systemFreezeActive 
                                    ? 'The platform is currently FROZEN in Read-Only Mode. All database modifications (creates, edits, deletes) are suspended, and all non-admin user logins are disabled.'
                                    : 'Instantly lock the entire SaaS platform. Use in case of detected server attacks, database integrity threats, or credential leaks to freeze all write operations.'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={onToggleFreeze}
                        className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap ${
                            systemFreezeActive 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100' 
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-red-100'
                        }`}
                    >
                        {systemFreezeActive ? 'Deactivate System Freeze' : 'Activate Emergency Lock'}
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Console & Monitor */}
                <div className="lg:col-span-8 space-y-8 min-w-0">
                    <div className="bg-[#f8fafc] rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Platform Supervisor Console</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">Mainframe control dashboard</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 px-2">
                            {/* Card 1: Onboard Company */}
                            <div 
                                onClick={() => navigate('/admin/companies')} 
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-100">
                                        <UserPlus size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-indigo-600 transition-colors">Onboard Organization</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Register tenant, config parameters, send activation logs</p>
                                </div>
                            </div>

                            {/* Card 2: Company Directory */}
                            <div 
                                onClick={() => navigate('/admin/companies')} 
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-emerald-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-100">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-emerald-600 transition-colors">Company Directory</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">View subscriptions status, reset licenses, view statistics</p>
                                </div>
                            </div>

                            {/* Card 3: Configure Branding */}
                            <div 
                                onClick={() => navigate('/admin/companies?tab=branding')} 
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-amber-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-100">
                                        <Globe size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-amber-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-amber-600 transition-colors">System Branding</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Set app logo, upload favicon, configure UI brand options</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <PlatformSystemConsole pendingDocs={pendingDocs} companies={companies} health={health} />
                </div>

                {/* Right Column: Meter & Logs */}
                <div className="lg:col-span-4 space-y-8">
                    <ActiveSubscriptionsCard companies={companies} />
                    <PlatformLogs pendingDocs={pendingDocs} health={health} tickets={tickets} />
                </div>
            </div>
        </div>
    );
};

const ChartCard = ({ title, subtitle, children }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{title}</h3>
                {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
            </div>
        </div>
        <div className="h-64 w-full">
            {children}
        </div>
    </div>
);

const DashboardView = ({ metrics, health, cpuHistory }) => {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const companies = metrics?.companiesBreakdown || [];
    
    // Calculate total active employees
    const totalEmps = metrics?.totalEmployees || 0;
    const presentToday = metrics?.attendanceToday || 0;
    const attendancePercentage = totalEmps > 0 ? Math.round((presentToday / totalEmps) * 100) : 0;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Global Telemetry Node Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Tenants</span>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{metrics?.totalCompanies || 0} Companies</h2>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest leading-none">Active Clusters</p>
                </div>
                
                <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Workforce</span>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{totalEmps} Employees</h2>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest leading-none">Across Tenants</p>
                </div>

                <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Global Payroll</span>
                        <h2 className="text-xl font-black text-indigo-600 tracking-tight">{formatCurrency(metrics?.totalPayroll || 0)}</h2>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest leading-none">Processed Volume</p>
                </div>

                <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Attendance Today</span>
                        <h2 className="text-2xl font-black text-emerald-600 tracking-tight">{attendancePercentage}% Present</h2>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest leading-none">{presentToday} Present Today</p>
                </div>

                <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">On Leave Today</span>
                        <h2 className="text-2xl font-black text-amber-600 tracking-tight">{metrics?.onLeaveToday || 0} Out</h2>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest leading-none">Active Approved Leaves</p>
                </div>

                <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Average Salary Basis</span>
                        <h2 className="text-[17px] font-black text-indigo-650 tracking-tight">{formatCurrency(metrics?.avgSalary || 0)}</h2>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest leading-none">Platform Employee Avg</p>
                </div>
            </div>

            {/* Platform Infrastructure Health Nodes Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthNode icon={Database} label="Database Status" status={health?.health?.database || 'Connecting...'} lastUp="Live" />
                <HealthNode icon={Server} label="API Status" status={health?.health?.api || 'Connecting...'} lastUp="Live" />
                <HealthNode icon={HardDrive} label="Object Storage" status={health?.health?.storage || 'Connecting...'} lastUp="Live" />
                <HealthNode icon={Cpu} label="CPU Status" status={health ? `${health?.resources?.cpu?.usage}% Load` : 'Analyzing...'} lastUp={health?.resources?.cpu?.model?.split(' ')?.[0] || 'Optimized'} />
            </div>

            {/* 3x2 Grid of Advanced Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Global Payroll Volume Trend */}
                <ChartCard title="Platform-wide Payroll Trend" subtitle="Monthly processed net salary across all organizations">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics?.payrollTrend?.length > 0 ? metrics.payrollTrend : [
                            { month: 'Jan', amount: 0 }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fill="#6366f110" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Company Growth Trend */}
                <ChartCard title="Tenant Onboarding Rate" subtitle="New company registrations by month">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics?.growth?.length > 0 ? metrics.growth : [
                            { month: 'Jan', count: 0 }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Subscription Tier Distribution */}
                <ChartCard title="License Tier breakdown" subtitle="Free trial vs active subscriptions distribution">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics?.tierDistribution?.length > 0 ? metrics.tierDistribution.map(t => ({
                            tier: t.subscription_status ? t.subscription_status.toUpperCase() : 'UNKNOWN',
                            count: t.count
                        })) : [
                            { tier: 'TRIAL', count: 0 },
                            { tier: 'ACTIVE', count: 0 }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="tier" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* KYC Compliance Status Breakdown */}
                <ChartCard title="KYC Verification Health" subtitle="Employee uploaded document verification compliance states">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics?.compliance?.length > 0 ? metrics.compliance.map(c => ({
                            status: c.status ? c.status.toUpperCase() : 'PENDING',
                            count: c.count
                        })) : [
                            { status: 'VERIFIED', count: 0 },
                            { status: 'PENDING', count: 0 },
                            { status: 'REJECTED', count: 0 }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Attendance Punch Channels Analysis */}
                <ChartCard title="Punch Source Analysis" subtitle="Punch-in method distribution channels used globally">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics?.sourcesDistribution?.length > 0 ? metrics.sourcesDistribution.map(s => ({
                            channel: s.punch_source ? s.punch_source.toUpperCase() : 'UNKNOWN',
                            count: s.count
                        })) : [
                            { channel: 'BIOMETRIC', count: 0 },
                            { channel: 'MOBILE', count: 0 },
                            { channel: 'WEB', count: 0 }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="channel" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Compute Resource Usage */}
                <ChartCard title="Mainframe Compute Load" subtitle="Platform-wide CPU usage tracking history">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cpuHistory.length > 0 ? cpuHistory : [
                            { time: '00:00', cpu: 20 },
                            { time: '06:00', cpu: 35 },
                            { time: '12:00', cpu: 85 }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip />
                            <Area type="monotone" dataKey="cpu" stroke="#0ea5e9" strokeWidth={3} fill="#0ea5e910" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Grid for Table & Side List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Master Tenant Breakdown Directory Table */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 text-left">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Active Tenant Breakdown</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational status of all registered business domains</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Employees</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today's Attendance</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Monthly Payroll</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {companies.map((co) => (
                                    <tr key={co.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">{co.name}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-600">{co.employees} Employees</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="font-semibold text-slate-650">{co.attendanceToday} Present</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-indigo-600">{formatCurrency(co.totalPayroll)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                co.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {co.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right side: Recent Onboarded Tenants */}
                <div className="lg:col-span-4 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 text-left">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Recent Signups</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Latest business entities onboarded to the system</p>
                    </div>

                    <div className="space-y-4">
                        {metrics?.recentSignups?.map(c => (
                            <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">ID: {c.id}</p>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500">
                                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HealthNode = ({ label, status, lastUp, icon: Icon }) => (
    <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all hover:shadow-xl">
        <div className="flex items-center justify-between mb-8">
            <div className={`p-4 rounded-2xl bg-white shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors`}>
                <Icon size={24} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-slate-800 tracking-widest">Live</span>
            </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{label}</p>
        <p className="text-xl font-black text-slate-800 tracking-tight">{status}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-4 opacity-50 uppercase tracking-widest italic leading-none">Last Sync: {lastUp}</p>
    </div>
);

const TerminalHUD = () => {
    const [logs, setLogs] = useState([
        'SYS_MAIN: Booting cluster node Jaipur-North...',
        'SYS_MAIN: Mainframe core status ok. Port 5000 online.',
        'SYS_MAIN: Establishing telemetry connection with SQLite DB...',
        'SYS_MAIN: Telemetry established. Active clusters: healthy.',
        'SYS_MAIN: Waiting for supervisor commands.'
    ]);
    const [executing, setExecuting] = useState(false);

    // SQL Sandbox States inside TerminalHUD
    const [sqlQuery, setSqlQuery] = useState('SELECT * FROM companies LIMIT 5;');
    const [sqlResults, setSqlResults] = useState(null);
    const [executingQuery, setExecutingQuery] = useState(false);
    const [queryError, setQueryError] = useState(null);

    const executeCommand = async (commandName, displayName) => {
        if (executing) return;
        setExecuting(true);
        setLogs(prev => [...prev, `\n$ myfasthr --exec ${commandName}`]);
        try {
            const res = await api.post('/admin/system/command', { command: commandName });
            if (res.stdout) {
                const stdoutLines = res.stdout.split('\n').filter(line => line);
                setLogs(prev => [...prev, ...stdoutLines]);
            } else {
                setLogs(prev => [...prev, 'Command completed with no output.']);
            }
        } catch (err) {
            setLogs(prev => [...prev, `SYS_ERR: ${err.response?.data?.message || err.message}`]);
        } finally {
            setExecuting(false);
        }
    };

    const handleExecuteQuery = async (e) => {
        e.preventDefault();
        if (!sqlQuery.trim()) return;
        setExecutingQuery(true);
        setQueryError(null);
        setSqlResults(null);
        try {
            const res = await api.post('/admin/system/query', { query: sqlQuery });
            setSqlResults(res);
        } catch (err) {
            setQueryError(err.response?.data?.message || err.message);
        } finally {
            setExecutingQuery(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto text-left animate-in fade-in duration-500">
            {/* Terminal Card */}
            <div className="bg-slate-950 text-slate-100 rounded-[32px] p-6 md:p-8 border border-slate-800 shadow-2xl space-y-6 font-mono">
                {/* Header Controls */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-black">Mainframe Console v2.0 (Active)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${executing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{executing ? 'Executing...' : 'Idle'}</span>
                    </div>
                </div>

                {/* Terminal screen */}
                <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800/80 h-80 overflow-y-auto text-xs font-semibold leading-relaxed text-emerald-400 space-y-1">
                    {logs.map((log, idx) => (
                        <div key={idx} className={log.startsWith('$') ? 'text-indigo-400 font-bold' : log.startsWith('SYS_ERR') ? 'text-rose-400' : 'text-emerald-400'}>
                            {log}
                        </div>
                    ))}
                    {executing && (
                        <div className="text-amber-400 animate-pulse">Running cluster task...</div>
                    )}
                    {!executing && (
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-slate-500">$</span>
                            <span className="w-2.5 h-4 bg-emerald-400 animate-pulse inline-block" />
                        </div>
                    )}
                </div>

                {/* Quick Actions Panel */}
                <div className="pt-4 space-y-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Supervisor Maintenance Commands</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { id: 'rebuild_indexes', label: 'Rebuild & Vacuum DB', color: 'from-indigo-600 to-indigo-800 hover:shadow-indigo-900/30' },
                            { id: 'flush_cache', label: 'Flush Platform Cache', color: 'from-amber-600 to-orange-800 hover:shadow-orange-900/30' },
                            { id: 'run_diagnostics', label: 'Run Mainframe Audit', color: 'from-emerald-600 to-teal-800 hover:shadow-emerald-900/30' }
                        ].map(btn => (
                            <button
                                key={btn.id}
                                disabled={executing}
                                onClick={() => executeCommand(btn.id, btn.label)}
                                className={`p-4 bg-gradient-to-b ${btn.color} text-white font-bold text-xs uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SQL Sandbox Section */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 w-full font-outfit">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">SQL Sandbox</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Execute read-only database select statements</p>
                </div>

                <form onSubmit={handleExecuteQuery} className="space-y-4">
                    <div className="relative">
                        <textarea
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            placeholder="SELECT * FROM users LIMIT 5;"
                            className="w-full h-32 px-5 py-4 bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                        />
                        <button
                            type="submit"
                            disabled={executingQuery}
                            className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                            {executingQuery ? 'Running...' : 'Execute Query'}
                        </button>
                    </div>
                </form>

                {queryError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold leading-relaxed">
                        ⚠️ {queryError}
                    </div>
                )}

                {sqlResults && (
                    <div className="space-y-3.5 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Query Output</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">{sqlResults.length} rows returned</span>
                        </div>

                        {sqlResults.length > 0 ? (
                            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            {Object.keys(sqlResults[0]).map(key => (
                                                <th key={key} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sqlResults.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                {Object.values(row).map((val, colIdx) => (
                                                    <td key={colIdx} className="px-4 py-3 text-xs font-medium text-slate-600 font-mono whitespace-nowrap truncate max-w-[200px]">
                                                        {val === null ? <span className="text-slate-300 italic">NULL</span> : typeof val === 'object' ? JSON.stringify(val) : val.toString()}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-400">
                                Query executed successfully but returned 0 results.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AnnouncementsBroadcast = ({ companies = [] }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');
    const [expiresIn, setExpiresIn] = useState('24'); // default 24h
    const [targetCompanyId, setTargetCompanyId] = useState(''); // empty string means Global (All Companies)

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get('/announcements');
            setAnnouncements(res || []);
        } catch (err) {
            console.error('Failed to load announcements', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!message) return;
        try {
            await api.post('/announcements', {
                message,
                severity,
                expires_in_hours: expiresIn,
                company_id: targetCompanyId ? parseInt(targetCompanyId) : null
            });
            setMessage('');
            setTargetCompanyId('');
            fetchAnnouncements();
            await window.customAlert('Announcement broadcasted successfully!', 'Broadcast');
        } catch (err) {
            await window.customAlert('Failed to post announcement: ' + (err.response?.data?.message || err.message), 'Error');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await window.customConfirm('Are you sure you want to retract this announcement?', 'Retract Announcement');
        if (!confirmed) return;
        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
        } catch (err) {
            await window.customAlert('Failed to retract announcement: ' + (err.response?.data?.message || err.message), 'Error');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto font-outfit animate-in fade-in duration-500 text-left">
            {/* Form */}
            <div className="lg:col-span-5 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 self-start">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Broadcast Notice</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Send alert banner system-wide or to a specific company</p>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-outfit">Notice Content</label>
                        <textarea
                            required
                            placeholder="Type the message to be broadcasted on all dashboards..."
                            className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-400 h-24 resize-none text-slate-700 font-outfit"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-outfit">Target Organization</label>
                        <select
                            className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400 font-outfit"
                            value={targetCompanyId}
                            onChange={e => setTargetCompanyId(e.target.value)}
                        >
                            <option value="">Global Broadcast (All Companies)</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-outfit">Severity</label>
                            <select
                                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400 font-outfit"
                                value={severity}
                                onChange={e => setSeverity(e.target.value)}
                            >
                                <option value="info">Info (Blue)</option>
                                <option value="warning">Warning (Amber)</option>
                                <option value="critical">Critical (Red)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-outfit">Expires In</label>
                            <select
                                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400 font-outfit"
                                value={expiresIn}
                                onChange={e => setExpiresIn(e.target.value)}
                            >
                                <option value="1">1 Hour</option>
                                <option value="4">4 Hours</option>
                                <option value="12">12 Hours</option>
                                <option value="24">24 Hours</option>
                                <option value="72">3 Days</option>
                                <option value="168">7 Days</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 font-outfit"
                    >
                        Broadcast Announcement
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="lg:col-span-7 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Active Announcements</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Platform live notices</p>
                </div>

                {loading ? (
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center py-10">Loading notices...</p>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-xs font-semibold text-slate-400">
                        No active announcements running.
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                        {announcements.map(ann => {
                            const companyObj = companies.find(c => c.id === ann.company_id);
                            return (
                                <div key={ann.id} className="p-5 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                                ann.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                                ann.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {ann.severity}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-[9px] font-black uppercase">
                                                {companyObj ? companyObj.name : 'Global Broadcast'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">Expires: {ann.expires_at ? new Date(ann.expires_at).toLocaleString([], {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'Never'}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 leading-relaxed text-left">{ann.message}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const DatabaseExplorerView = () => {
    const [tables, setTables] = useState([]);
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [runningBackup, setRunningBackup] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const tableRes = await api.get('/admin/system/tables');
            setTables(tableRes || []);
            const backupRes = await api.get('/admin/system/backups');
            setBackups(backupRes || []);
        } catch (e) {
            console.error('Failed to load database explorer data', e);
        } finally {
            setLoading(false);
        }
    };

    const triggerBackup = async () => {
        setRunningBackup(true);
        try {
            await api.post('/admin/system/backup');
            await window.customAlert('Database backup snapshot created successfully!', 'Backup Snapshot');
            loadData();
        } catch (e) {
            await window.customAlert('Backup failed: ' + (e.response?.data?.message || e.message), 'Backup Error');
        } finally {
            setRunningBackup(false);
        }
    };

    const triggerDownload = (filename) => {
        const token = localStorage.getItem('auth_token') || 'test.admin.token';
        fetch(`${api.defaults.baseURL}/admin/system/backups/${filename}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Download failed');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(err => {
            window.customAlert('Failed to download backup: ' + err.message, 'Download Error');
        });
    };

    const triggerRestore = async (filename) => {
        const confirmed = await window.customConfirm(`CAUTION: Restoring will overwrite the current active database with "${filename}". Are you sure you want to proceed?`, 'Restore Backup');
        if (!confirmed) return;
        try {
            await api.post(`/admin/system/backups/${filename}/restore`);
            await window.customAlert('Database successfully restored from snapshot! Reconnecting...', 'Restore Success');
            window.location.reload();
        } catch (e) {
            await window.customAlert('Restore failed: ' + (e.response?.data?.message || e.message), 'Restore Error');
        }
    };


    return (
        <div className="space-y-8 max-w-6xl mx-auto font-outfit text-slate-800 text-left animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tables List */}
                <div className="lg:col-span-5 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Database Tables</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live Schema Inspector</p>
                    </div>

                    {loading ? (
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center py-10">Loading schema...</p>
                    ) : (
                        <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                            {tables.map(tbl => (
                                <div key={tbl.tableName} className="p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-bold text-slate-700 font-mono">{tbl.tableName}</h4>
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Active Schema Entity</p>
                                    </div>
                                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-extrabold text-slate-700">
                                        {tbl.rowCount} Rows
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Backups HUD */}
                <div className="lg:col-span-7 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Database Snapshots</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Hot backup & Restore HUD</p>
                        </div>
                        <button 
                            onClick={triggerBackup}
                            disabled={runningBackup}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            Create Backup
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center py-10">Loading backups...</p>
                    ) : backups.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-xs font-semibold text-slate-400">
                            No database snapshots found.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                            {backups.map(bk => (
                                <div key={bk.filename} className="p-5 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-700 font-mono truncate max-w-[220px]">{bk.filename}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">Size: {bk.size} | Date: {new Date(bk.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => triggerDownload(bk.filename)}
                                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

const BillingMRRView = () => {
    const [stats, setStats] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Manage Subscription Modal States
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState('subscription'); // 'subscription' | 'ledger'
    
    // Modal Form States
    const [plan, setPlan] = useState('Starter');
    const [billingAmount, setBillingAmount] = useState(49.00);
    const [employeeLimit, setEmployeeLimit] = useState(10);
    const [status, setStatus] = useState('active');
    
    // Invoices states
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    
    // New Invoice Form
    const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
    const [newInvoicePeriod, setNewInvoicePeriod] = useState('');
    const [newInvoiceStatus, setNewInvoiceStatus] = useState('Unpaid');

    const pricingMatrix = {
        Starter: { amount: 49.00, limit: 10 },
        Growth: { amount: 99.00, limit: 50 },
        Enterprise: { amount: 249.00, limit: 500 }
    };

    useEffect(() => {
        loadData(false);

        const interval = setInterval(() => {
            loadData(true);
        }, 15000); // Poll every 15s

        return () => clearInterval(interval);
    }, []);

    const loadData = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const [statsRes, companiesRes] = await Promise.all([
                api.get('/admin/billing/stats').catch(err => {
                    console.error('Stats API failed, using fallback:', err);
                    return {
                        totalCompanies: 0,
                        activeCount: 0,
                        totalMRR: 0,
                        churnRate: 5.0,
                        growthRate: 12.0,
                        planDistribution: [
                            { name: 'Starter', value: 0 },
                            { name: 'Growth', value: 0 },
                            { name: 'Enterprise', value: 0 }
                        ],
                        mrrHistory: [],
                        projections: []
                    };
                }),
                api.get('/admin/companies').catch(err => {
                    console.error('Companies API failed:', err);
                    return [];
                })
            ]);
            
            // Set default projections and history if missing or empty
            const finalStats = statsRes || {};
            if (!finalStats.mrrHistory || finalStats.mrrHistory.length === 0) {
                finalStats.mrrHistory = [
                    { month: 'Jan 26', revenue: 0, type: 'Actual' },
                    { month: 'Feb 26', revenue: 0, type: 'Actual' },
                    { month: 'Mar 26', revenue: 0, type: 'Actual' },
                    { month: 'Apr 26', revenue: 0, type: 'Actual' }
                ];
            }
            if (!finalStats.projections || finalStats.projections.length === 0) {
                finalStats.projections = [
                    { month: 'May 26', revenue: 0, churn: 0, growth: 0, type: 'Forecast' },
                    { month: 'Jun 26', revenue: 0, churn: 0, growth: 0, type: 'Forecast' },
                    { month: 'Jul 26', revenue: 0, churn: 0, growth: 0, type: 'Forecast' }
                ];
            }
            
            setStats(finalStats);
            setCompanies(companiesRes || []);
        } catch (e) {
            console.error('Failed to load billing stats', e);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleOpenManageModal = async (company) => {
        setSelectedCompany(company);
        setPlan(company.subscription_plan || 'Starter');
        setBillingAmount(company.billing_amount !== null && company.billing_amount !== undefined ? company.billing_amount : 49.00);
        setEmployeeLimit(company.max_employees_limit !== null && company.max_employees_limit !== undefined ? company.max_employees_limit : 10);
        setStatus(company.subscription_status || 'active');
        setModalTab('subscription');
        setIsManageModalOpen(true);
        
        // Fetch invoices for this company
        fetchCompanyInvoices(company.id);
    };

    const fetchCompanyInvoices = async (companyId) => {
        try {
            setLoadingInvoices(true);
            const res = await api.get(`/admin/companies/${companyId}/invoices`);
            setInvoices(res || []);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleTierChange = (selectedTier) => {
        setPlan(selectedTier);
        if (pricingMatrix[selectedTier]) {
            setBillingAmount(pricingMatrix[selectedTier].amount);
            setEmployeeLimit(pricingMatrix[selectedTier].limit);
        }
    };

    const handleUpdateSubscription = async (e) => {
        e.preventDefault();
        try {
            // Update company properties
            await api.put(`/admin/companies/${selectedCompany.id}`, {
                name: selectedCompany.name,
                email: selectedCompany.email,
                subscription_status: status,
                subscription_plan: plan,
                billing_amount: parseFloat(billingAmount) || 0
            });

            // Update limits & features
            await api.patch(`/admin/companies/${selectedCompany.id}/features`, {
                max_employees_limit: parseInt(employeeLimit) || 10,
                enabled_features: selectedCompany.enabled_features ? JSON.parse(selectedCompany.enabled_features) : ["payroll", "kudos", "helpdesk"]
            });

            await window.customAlert('Subscription plan configurations successfully updated.', 'Success');
            setIsManageModalOpen(false);
            loadData();
        } catch (error) {
            alert('Failed to update subscription: ' + error.message);
        }
    };

    const handleAddInvoice = async (e) => {
        e.preventDefault();
        if (!newInvoiceAmount || !newInvoicePeriod) {
            alert('Please specify amount and billing period');
            return;
        }

        try {
            await api.post(`/admin/companies/${selectedCompany.id}/invoices`, {
                amount: parseFloat(newInvoiceAmount),
                plan: plan,
                billing_period: newInvoicePeriod,
                status: newInvoiceStatus
            });

            setNewInvoiceAmount('');
            setNewInvoicePeriod('');
            setNewInvoiceStatus('Unpaid');
            
            // Reload invoices
            fetchCompanyInvoices(selectedCompany.id);
        } catch (error) {
            alert('Failed to record invoice: ' + error.message);
        }
    };

    const handleMarkPaid = async (invoiceId) => {
        try {
            await api.patch(`/admin/invoices/${invoiceId}/status`, { status: 'Paid' });
            fetchCompanyInvoices(selectedCompany.id);
        } catch (error) {
            alert('Failed to update invoice status: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="animate-spin mb-4 text-indigo-600" size={32} />
                <p className="text-sm font-semibold uppercase tracking-wider">Calculating Billing Figures...</p>
            </div>
        );
    }

    if (!stats || !stats.mrrHistory || !stats.projections) {
        return (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-wider">
                No billing stats telemetry returned from system server.
            </div>
        );
    }

    // Combine history and projections for a continuous chart visualization
    const combinedData = [
        ...stats.mrrHistory.map(h => ({ ...h, type: 'Actual', strokeDasharray: '0' })),
        ...stats.projections.map(p => ({ ...p, type: 'Forecast', strokeDasharray: '4 4' }))
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto text-left font-outfit animate-in fade-in duration-500">
            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Projected MRR</p>
                    <h3 className="text-3xl font-black text-indigo-600 mt-2">₹{Number(stats.totalMRR || 0).toFixed(2)}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Monthly Recurring Revenue</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Growth Velocity</p>
                    <h3 className="text-3xl font-black text-emerald-600 mt-2">+{stats.growthRate}%</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Monthly New Signups target</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Target Churn</p>
                    <h3 className="text-3xl font-black text-rose-600 mt-2">{stats.churnRate}%</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Max churn rate target</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Active Tenants</p>
                    <h3 className="text-3xl font-black text-slate-700 mt-2">{stats.activeCount} Active</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Paying organization accounts</p>
                </div>
            </div>

            {/* Organizations Subscription Directory */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Active Subscription Directory</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust tier options, monthly plans, and payment records for each organization</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Plan</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Quota Limit</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Monthly Billing</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-xs font-semibold text-slate-400">No organizations onboarded.</td>
                                </tr>
                            ) : companies.map(company => (
                                <tr key={company.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xs text-indigo-600 uppercase">
                                                {company.name ? company.name.substring(0, 2) : '??'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{company.name}</p>
                                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{company.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                            company.subscription_plan === 'Enterprise'
                                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                                : company.subscription_plan === 'Growth'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                                        }`}>
                                            {company.subscription_plan || 'Starter'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                            company.subscription_status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : company.subscription_status === 'suspended'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {company.subscription_status || 'active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-slate-600">
                                            Max {company.max_employees_limit || 10} Employees
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800 text-xs">
                                        ₹{Number(company.billing_amount !== null && company.billing_amount !== undefined ? company.billing_amount : 49.00).toFixed(2)}/mo
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleOpenManageModal(company)}
                                            className="px-4 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Growth Graph & Pricing Packages */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Forecast Chart */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Revenue History & 6-Month Projection</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Continuous MRR velocity forecast based on {stats.growthRate}% growth rate</p>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={combinedData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                                <Tooltip formatter={(value, name, props) => [`₹${value}`, `${props?.payload?.type || 'Forecast'} MRR`]} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Area name="MRR Timeline" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plan Packages details */}
                <div className="lg:col-span-4 bg-[#f8fafc] p-8 rounded-[32px] border border-slate-200/60 shadow-sm space-y-6 flex flex-col justify-center">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SaaS Package Matrix</h4>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight mt-1">Configure & manage tier limits</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700">Starter</span>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">₹49/mo</span>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700">Growth</span>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">₹99/mo</span>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700">Enterprise</span>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">₹249/mo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Churn vs Growth Forecast Graph */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 w-full">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Expected Growth vs Losses</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected revenue from new signups vs potential losses from cancellations over the next 6 months</p>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.projections}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip formatter={(value) => [`₹${value}`]} />
                            <Legend />
                            <Bar name="New Revenue (+)" dataKey="growth" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar name="Lost Revenue (-)" dataKey="churn" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Subscription & Billing Ledger Modal */}
            {isManageModalOpen && selectedCompany && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                            <div>
                                <h3 className="text-md font-black text-slate-800 tracking-tight">Manage Tenant Subscription</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedCompany.name} (Tenant ID: {selectedCompany.id})</p>
                            </div>
                            <button 
                                onClick={() => setIsManageModalOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className="flex border-b border-slate-100 px-8 bg-slate-50/10">
                            <button 
                                onClick={() => setModalTab('subscription')}
                                className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all mr-6 cursor-pointer ${
                                    modalTab === 'subscription' 
                                        ? 'border-indigo-600 text-indigo-600' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Plan & Limits Configuration
                            </button>
                            <button 
                                onClick={() => setModalTab('ledger')}
                                className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                    modalTab === 'ledger' 
                                        ? 'border-indigo-600 text-indigo-600' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Invoicing Ledger Console
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {modalTab === 'subscription' ? (
                                <form onSubmit={handleUpdateSubscription} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Plan Tier</label>
                                            <select 
                                                value={plan}
                                                onChange={(e) => handleTierChange(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="Starter">Starter (₹49/mo, 10 employees)</option>
                                                <option value="Growth">Growth (₹99/mo, 50 employees)</option>
                                                <option value="Enterprise">Enterprise (₹249/mo, 500 employees)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subscription Status</label>
                                            <select 
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="trial">Trial Mode</option>
                                                <option value="suspended">Suspended (Lock Account)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Custom Monthly Price (INR)</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                value={billingAmount}
                                                onChange={(e) => setBillingAmount(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Custom Employee Quota Limit</label>
                                            <input 
                                                type="number"
                                                value={employeeLimit}
                                                onChange={(e) => setEmployeeLimit(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button 
                                            type="submit"
                                            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest transition-colors cursor-pointer shadow-lg shadow-indigo-100"
                                        >
                                            Save Modifications
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    {/* Record custom invoice form */}
                                    <form onSubmit={handleAddInvoice} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                        <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Log Simulated Ledger Invoice</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount (INR)</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="₹ 150.00"
                                                    value={newInvoiceAmount}
                                                    onChange={e => setNewInvoiceAmount(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Billing Period</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. May 2026"
                                                    value={newInvoicePeriod}
                                                    onChange={e => setNewInvoicePeriod(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Initial Status</label>
                                                <select 
                                                    value={newInvoiceStatus}
                                                    onChange={e => setNewInvoiceStatus(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="Unpaid">Unpaid</option>
                                                    <option value="Paid">Paid</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button 
                                                type="submit"
                                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors"
                                            >
                                                Add Ledger Record
                                            </button>
                                        </div>
                                    </form>

                                    {/* Ledger Logs Table */}
                                    <div className="space-y-2">
                                        <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider pl-1">Invoicing Ledger</h4>
                                        <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                                    {loadingInvoices ? (
                                                        <tr>
                                                            <td colSpan="6" className="p-8 text-center text-[11px] font-semibold text-slate-400">Loading ledger files...</td>
                                                        </tr>
                                                    ) : invoices.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="p-8 text-center text-[11px] font-semibold text-slate-400">No invoices logged for this tenant.</td>
                                                        </tr>
                                                    ) : invoices.map(invoice => (
                                                        <tr key={invoice.id} className="hover:bg-slate-50/20">
                                                            <td className="px-4 py-3 font-mono font-bold text-slate-500">
                                                                INV-{invoice.id.toString().padStart(5, '0')}
                                                            </td>
                                                            <td className="px-4 py-3 font-bold text-slate-800">{invoice.billing_period}</td>
                                                            <td className="px-4 py-3 capitalize text-slate-600">{invoice.plan}</td>
                                                            <td className="px-4 py-3 font-bold text-slate-800">₹{Number(invoice.amount || 0).toFixed(2)}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                                    invoice.status === 'Paid'
                                                                        ? 'bg-emerald-50 text-emerald-700'
                                                                        : 'bg-rose-50 text-rose-700'
                                                                }`}>
                                                                    {invoice.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {invoice.status === 'Unpaid' ? (
                                                                    <button 
                                                                        onClick={() => handleMarkPaid(invoice.id)}
                                                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black text-[9px] uppercase tracking-widest rounded transition-colors cursor-pointer"
                                                                    >
                                                                        Mark Paid
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[9px] font-medium text-slate-400 italic">
                                                                        Paid on {new Date(invoice.paid_at).toLocaleDateString('en-GB')}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AuditLogsView = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/system/audit-logs');
            setLogs(res || []);
        } catch (e) {
            console.error('Failed to load audit logs', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.action?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(filterQuery.toLowerCase())
    );

    return (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 max-w-6xl mx-auto text-left font-outfit animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">System Audit Shield</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time platform logs</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none w-full"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center py-20">Fetching logs...</p>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-400">
                    No matching audit records found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Actor</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString([], {month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'})}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                            log.action.includes('RESTORE') || log.action.includes('DELETE')
                                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                : log.action.includes('IMPERSONATION')
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 font-semibold">{log.user_email || 'System'}</td>
                                    <td className="px-4 py-3 text-slate-500">{log.company_name || 'Global'}</td>
                                    <td className="px-4 py-3 text-slate-600 font-semibold leading-relaxed">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const TelemetryView = () => {
    const [telemetry, setTelemetry] = useState(null);
    const [storageTelemetry, setStorageTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSlowOnly, setFilterSlowOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTelemetry();
        const interval = setInterval(loadTelemetry, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const loadTelemetry = async () => {
        try {
            const res = await api.get('/admin/system/telemetry');
            if (res.success) {
                setTelemetry(res);
            }
            const storageRes = await api.get('/admin/system/storage-telemetry');
            if (storageRes) {
                setStorageTelemetry(storageRes);
            }
        } catch (e) {
            console.error('Failed to load telemetry stats', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !telemetry) {
        return (
            <div className="text-center py-20 animate-pulse text-xs font-bold uppercase tracking-wider text-slate-400">
                Initiating Telemetry Link...
            </div>
        );
    }

    const filteredQueries = (telemetry?.queries || []).filter(q => {
        const matchesSearch = q.sql.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              q.database.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSlow = filterSlowOnly ? q.duration > 50 : true;
        return matchesSearch && matchesSlow;
    });

    const centralPool = telemetry?.pools?.central || { used: 0, free: 0, min: 0, max: 0 };
    const tenantPools = telemetry?.pools?.tenants || {};

    return (
        <div className="space-y-10 max-w-6xl mx-auto text-left font-outfit animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">System Telemetry & Performance Monitor</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time MySQL connection pool and query execution latency</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-black uppercase text-emerald-800 tracking-widest">Active Stream</span>
                </div>
            </div>

            {/* Resources HUD Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CPU Info */}
                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Cpu size={22} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-100">
                            {telemetry?.system?.cpu?.cores || 0} Cores
                        </span>
                    </div>
                    <div className="mt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">CPU Engine Model</p>
                        <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-1 truncate">{telemetry?.system?.cpu?.model || 'Unknown'}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">Load Averages: {telemetry?.system?.cpu?.load?.map(l => l.toFixed(2)).join(', ') || 'N/A'}</p>
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                            <HardDrive size={22} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-sky-700 bg-white px-2.5 py-1 rounded-full border border-slate-100">
                            {telemetry?.system?.memory?.usagePercentage || 0}% RAM
                        </span>
                    </div>
                    <div className="mt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Node Process RAM</p>
                        <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-1">{telemetry?.system?.memory?.rss || 'N/A'}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">Heap Used: {telemetry?.system?.memory?.heapUsed || 'N/A'} / System Total: {telemetry?.system?.memory?.systemTotal || 'N/A'}</p>
                    </div>
                </div>

                {/* Server Uptime */}
                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Server size={22} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-white px-2.5 py-1 rounded-full border border-slate-100">
                            Uptime
                        </span>
                    </div>
                    <div className="mt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Server Node Status</p>
                        <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-1">
                            {Math.floor(telemetry?.system?.uptime / 3600)}h {Math.floor((telemetry?.system?.uptime % 3600) / 60)}m {telemetry?.system?.uptime % 60}s
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">Runtime: {telemetry?.system?.nodeVersion} on {telemetry?.system?.platform}-{telemetry?.system?.arch}</p>
                    </div>
                </div>
            </div>

            {/* Connection Pools Section */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Active MySQL Connection Pools</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active connection pools for Central DB and dynamically routed Isolated Tenant DBs</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Central DB Pool */}
                    <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-900 group-hover:opacity-10 transition-opacity">
                            <Database size={48} />
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Central Main Database</span>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700">
                                myfasthr_db
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-500">Connections Active (In-Use):</span>
                                <span className="font-bold text-slate-800">{centralPool.used}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-500">Connections Free (Idle):</span>
                                <span className="font-bold text-slate-800">{centralPool.free}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-500">Config Pool Limit:</span>
                                <span className="font-bold text-slate-800">min {centralPool.min} / max {centralPool.max}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(centralPool.used / (centralPool.max || 10)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Tenant Pools */}
                    {Object.entries(tenantPools).length === 0 ? (
                        <div className="lg:col-span-2 flex items-center justify-center p-6 border border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-400 bg-slate-50/20">
                            No active tenant database connection pools in memory cache.
                        </div>
                    ) : (
                        Object.entries(tenantPools).map(([dbName, pool]) => {
                            if (!pool) return null;
                            return (
                                <div key={dbName} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-900 group-hover:opacity-10 transition-opacity">
                                        <Database size={48} />
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wide truncate pr-2 max-w-[150px]" title={dbName}>
                                            Tenant Company DB
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 max-w-[130px] truncate" title={dbName}>
                                            {dbName}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-500">Connections Active (In-Use):</span>
                                            <span className="font-bold text-slate-800">{pool.used}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-500">Connections Free (Idle):</span>
                                            <span className="font-bold text-slate-800">{pool.free}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-500">Config Pool Limit:</span>
                                            <span className="font-bold text-slate-800">min {pool.min} / max {pool.max}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div 
                                                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(pool.used / (pool.max || 3)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Storage Quota Allocation HUD */}
            {storageTelemetry.length > 0 && (
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">SaaS Tenant Disk Storage Monitor</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage allocations and real-time disk consumption for dynamic folders</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {storageTelemetry.map(tenant => {
                            const usagePercentage = Math.min(((tenant.sizeBytes / tenant.limitBytes) * 100), 100).toFixed(1);
                            const isSystem = tenant.companyId === 'system';
                            return (
                                <div key={tenant.companyId} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative overflow-hidden group hover:border-sky-200 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-sky-900 group-hover:opacity-10 transition-opacity">
                                        <HardDrive size={48} />
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wide truncate pr-2 max-w-[170px]" title={tenant.name}>
                                            {tenant.name}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                            isSystem 
                                                ? 'border-indigo-100 bg-indigo-50 text-indigo-700' 
                                                : 'border-sky-100 bg-sky-50 text-sky-700'
                                        }`}>
                                            {isSystem ? 'system' : `company_${tenant.companyId}`}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-500">Disk Space Used:</span>
                                            <span className="font-bold text-slate-800">{tenant.sizeFormatted}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-500">Quota Limit:</span>
                                            <span className="font-bold text-slate-800">{tenant.limitFormatted}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-500">Usage Level:</span>
                                            <span className={`font-bold ${parseFloat(usagePercentage) > 80 ? 'text-rose-600' : 'text-sky-600'}`}>
                                                {usagePercentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    parseFloat(usagePercentage) > 80 ? 'bg-rose-500' : 'bg-sky-500'
                                                }`}
                                                style={{ width: `${usagePercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Query Performance Log */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">SQL Query Telemetry Log</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution speed of queries routed across databases (last 50 logs)</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <label className="inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto select-none">
                            <input 
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                checked={filterSlowOnly}
                                onChange={e => setFilterSlowOnly(e.target.checked)}
                            />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Slow Only (&gt;50ms)</span>
                        </label>
                        
                        <div className="relative w-full sm:w-60">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search queries..." 
                                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none w-full font-outfit"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {filteredQueries.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-400">
                        No queries matching telemetry filter rules.
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/60 border-b border-slate-100 sticky top-0 backdrop-blur-md z-10">
                                <tr>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Database</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Latency</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">SQL Query Executed</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px] font-medium leading-relaxed font-mono">
                                {filteredQueries.map((q, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${
                                                q.database === 'myfasthr_db'
                                                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {q.database}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap font-bold">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                q.status === 'error'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : q.duration > 50
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                        : q.duration > 10
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {q.status === 'error' ? 'ERROR' : `${q.duration} ms`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-[10.5px] text-slate-600 select-all whitespace-pre-wrap break-all pr-8">
                                            {q.sql}
                                            {q.error && (
                                                <div className="text-red-500 text-[9.5px] font-sans font-bold mt-1">
                                                    ⚠️ {q.error}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-400 whitespace-nowrap text-[9.5px] font-sans">
                                            {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const CaseStudiesManager = () => {
    const [studies, setStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [newStudy, setNewStudy] = useState({
        title: '',
        sector: 'logistics',
        size: '',
        challenge: '',
        solution: '',
        color: '#7A3F91',
        bg: '#F2EAF7',
        metrics: [
            { label: '', before: '', after: '', status: 'saved' }
        ],
        summaryText: ''
    });

    const loadStudies = async () => {
        try {
            setLoading(true);
            const res = await api.get('/public/case-studies');
            setStudies(res || []);
        } catch (err) {
            console.error('Failed to load case studies', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudies();
    }, []);

    const handleAddMetric = () => {
        setNewStudy({
            ...newStudy,
            metrics: [...newStudy.metrics, { label: '', before: '', after: '', status: 'saved' }]
        });
    };

    const handleRemoveMetric = (index) => {
        const updated = [...newStudy.metrics];
        updated.splice(index, 1);
        setNewStudy({ ...newStudy, metrics: updated });
    };

    const handleMetricChange = (index, field, val) => {
        const updated = [...newStudy.metrics];
        updated[index][field] = val;
        setNewStudy({ ...newStudy, metrics: updated });
    };

    const handleDelete = async (id) => {
        const confirmed = await window.customConfirm('Are you sure you want to delete this case study?', 'Delete Case Study');
        if (!confirmed) return;

        try {
            await api.delete(`/admin/case-studies/${id}`);
            await window.customAlert('Case study deleted successfully.', 'Success');
            loadStudies();
        } catch (err) {
            await window.customAlert('Failed to delete: ' + (err.response?.data?.message || err.message), 'Error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newStudy.title || !newStudy.challenge || !newStudy.solution) {
            await window.customAlert('Please fill in Title, Challenge, and Solution.', 'Error');
            return;
        }

        try {
            setSubmitting(true);
            const summaryText = newStudy.summaryText || `CASE STUDY: ${newStudy.title.toUpperCase()}
Sector: ${newStudy.sector}
Size: ${newStudy.size || 'Not Specified'}

CHALLENGE:
${newStudy.challenge}

SOLUTION:
${newStudy.solution}

IMPACT:
${newStudy.metrics.map(m => m.label ? `- ${m.label}: Before ${m.before} -> After ${m.after}` : '').filter(Boolean).join('\n')}`;

            await api.post('/admin/case-studies', {
                ...newStudy,
                summaryText,
                metrics: newStudy.metrics.filter(m => m.label)
            });

            await window.customAlert('Case study uploaded successfully.', 'Success');
            setNewStudy({
                title: '',
                sector: 'logistics',
                size: '',
                challenge: '',
                solution: '',
                color: '#7A3F91',
                bg: '#F2EAF7',
                metrics: [
                    { label: '', before: '', after: '', status: 'saved' }
                ],
                summaryText: ''
            });
            loadStudies();
        } catch (err) {
            await window.customAlert('Failed to upload: ' + (err.response?.data?.message || err.message), 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Upload Form */}
                <div className="lg:col-span-7 bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-[20px] font-bold text-[#2d3436] tracking-tight">Upload Case Study</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">Add a new dynamic success story to the public website</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Client Name / Title</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Highway King Enterprises"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none font-outfit"
                                    value={newStudy.title}
                                    onChange={e => setNewStudy({ ...newStudy, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Client Sector</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none font-outfit"
                                    value={newStudy.sector}
                                    onChange={e => {
                                        const sec = e.target.value;
                                        let color = '#7A3F91';
                                        let bg = '#F2EAF7';
                                        if (sec === 'education') { color = '#0F766E'; bg = '#CCFBF1'; }
                                        else if (sec === 'it') { color = '#D97706'; bg = '#FEF3C7'; }
                                        setNewStudy({ ...newStudy, sector: sec, color, bg });
                                    }}
                                >
                                    <option value="logistics">Logistics / Hubs</option>
                                    <option value="education">Education / Training</option>
                                    <option value="it">IT & Software Dev</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Organization Size</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. 250+ Employees"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none font-outfit"
                                    value={newStudy.size}
                                    onChange={e => setNewStudy({ ...newStudy, size: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Brutalist Border Hex Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color"
                                        className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                                        value={newStudy.color}
                                        onChange={e => setNewStudy({ ...newStudy, color: e.target.value })}
                                    />
                                    <input 
                                        type="text"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-mono"
                                        value={newStudy.color}
                                        onChange={e => setNewStudy({ ...newStudy, color: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">The Challenge</label>
                            <textarea 
                                rows="2"
                                required
                                placeholder="Describe the pain points of the client..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none font-outfit"
                                value={newStudy.challenge}
                                onChange={e => setNewStudy({ ...newStudy, challenge: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">The Solution</label>
                            <textarea 
                                rows="2"
                                required
                                placeholder="Describe the MyFastHR implementation solution..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none font-outfit"
                                value={newStudy.solution}
                                onChange={e => setNewStudy({ ...newStudy, solution: e.target.value })}
                            />
                        </div>

                        {/* Metrics Editor */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center pl-1">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Impact Metrics</label>
                                <button 
                                    type="button" 
                                    onClick={handleAddMetric}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Metric
                                </button>
                            </div>

                            {newStudy.metrics.map((metric, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                                    {newStudy.metrics.length > 1 && (
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveMetric(idx)}
                                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Metric Label</span>
                                            <input 
                                                type="text"
                                                placeholder="e.g. Payroll Compiling Time"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                                value={metric.label}
                                                onChange={e => handleMetricChange(idx, 'label', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Metric Status Type</span>
                                            <select 
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                                value={metric.status}
                                                onChange={e => handleMetricChange(idx, 'status', e.target.value)}
                                            >
                                                <option value="saved">saved</option>
                                                <option value="prevented">prevented</option>
                                                <option value="secured">secured</option>
                                                <option value="approved">approved</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Before</span>
                                            <input 
                                                type="text"
                                                placeholder="e.g. 32 Hours"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                                value={metric.before}
                                                onChange={e => handleMetricChange(idx, 'before', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">After</span>
                                            <input 
                                                type="text"
                                                placeholder="e.g. 20 Minutes"
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                                value={metric.after}
                                                onChange={e => handleMetricChange(idx, 'after', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-98 disabled:opacity-50"
                        >
                            {submitting ? 'Uploading Story...' : 'Publish Case Study'}
                        </button>
                    </form>
                </div>

                {/* Active List */}
                <div className="lg:col-span-5 bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-[20px] font-bold text-[#2d3436] tracking-tight">Active Case Studies</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">Live database entries served to the public sector page</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <RefreshCw size={24} className="animate-spin mb-2 text-indigo-500" />
                            <span className="text-xs font-bold">Loading stories...</span>
                        </div>
                    ) : studies.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-400">
                            No case studies currently registered.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                            {studies.map(study => (
                                <div 
                                    key={study.id} 
                                    className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-black text-slate-800 leading-tight">{study.title}</h4>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{study.sector} | {study.size || 'No Size'}</span>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleDelete(study.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                        <span className="font-extrabold text-slate-700 block mt-1">Challenge:</span> {study.challenge}
                                        <span className="font-extrabold text-slate-700 block mt-1">Solution:</span> {study.solution}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

const SuperAdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse initial tab from query parameter (e.g., ?tab=billing -> 'billing', otherwise fallback to 'welcome')
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        
        // Map old dashboard route references to new tab IDs
        if (tabParam === 'analytics') return 'dashboard';
        
        const validTabs = ['welcome', 'dashboard', 'announcements', 'terminal', 'billing', 'db_explorer', 'audit', 'telemetry', 'support_tickets', 'case_studies'];
        return validTabs.includes(tabParam) ? tabParam : 'welcome';
    };

    const [activeTab, setActiveTabState] = useState(getInitialTab);

    const setActiveTab = (tabId) => {
        setActiveTabState(tabId);
        // Map 'dashboard' tab back to ?tab=analytics in URL to maintain system compatibility
        const urlTab = tabId === 'dashboard' ? 'analytics' : tabId;
        navigate(`?tab=${urlTab}`, { replace: true });
    };
    const [metrics, setMetrics] = useState(null);
    const [pendingDocs, setPendingDocs] = useState([]);
    const [systemHealth, setSystemHealth] = useState(null);
    const [cpuHistory, setCpuHistory] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [systemFreezeActive, setSystemFreezeActive] = useState(false);

    // Support ticket states
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketReplies, setTicketReplies] = useState([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const fetchTickets = async (isSilent = false) => {
        try {
            if (!isSilent) setLoadingTickets(true);
            const data = await api.get('/tickets');
            setTickets(data || []);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            if (!isSilent) setLoadingTickets(false);
        }
    };

    const selectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setTicketReplies([]);
        try {
            const data = await api.get(`/tickets/${ticket.id}`);
            if (data) {
                setTicketReplies(data.replies || []);
            }
        } catch (err) {
            console.error('Failed to fetch ticket details:', err);
        }
    };

    const handlePostReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim() || !selectedTicket) return;
        try {
            setSubmittingReply(true);
            await api.post(`/tickets/${selectedTicket.id}/replies`, { message: replyMessage });
            setReplyMessage('');
            const data = await api.get(`/tickets/${selectedTicket.id}`);
            if (data) {
                setTicketReplies(data.replies || []);
            }
            fetchTickets();
        } catch (err) {
            alert('Failed to post reply: ' + err.message);
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedTicket) return;
        try {
            await api.put(`/tickets/${selectedTicket.id}`, { status });
            setSelectedTicket(prev => prev ? { ...prev, status } : null);
            fetchTickets();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'support_tickets') {
            fetchTickets();
        }
    }, [activeTab]);

    // Sync tab state when browser back/forward or location changes manually
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const resolvedTab = tabParam === 'analytics' ? 'dashboard' : tabParam;
        const validTabs = ['welcome', 'dashboard', 'announcements', 'terminal', 'billing', 'db_explorer', 'audit', 'telemetry', 'support_tickets', 'case_studies'];
        if (resolvedTab && validTabs.includes(resolvedTab) && resolvedTab !== activeTab) {
            setActiveTabState(resolvedTab);
        }
    }, [location.search]);

    useEffect(() => {
        fetchMetrics();
        fetchGlobalPending();
        fetchSystemHealth();
        fetchCompanies();
        fetchSystemFreezeStatus();
        fetchTickets(false); // Fetch support tickets (including demo bookings) initially

        const interval = setInterval(() => {
            fetchSystemHealth();
            fetchMetrics();
            fetchCompanies();
            fetchSystemFreezeStatus();
            fetchTickets(true); // Poll tickets on interval silently to keep log feed up-to-date
        }, 15000); // Poll every 15s

        return () => clearInterval(interval);
    }, []);

    const fetchSystemFreezeStatus = async () => {
        try {
            const res = await api.get('/admin/system/settings');
            setSystemFreezeActive(res?.system_freeze || false);
        } catch (err) {
            console.error('Failed to fetch system freeze status', err);
        }
    };

    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [pendingFreezeState, setPendingFreezeState] = useState(false);

    const handleToggleFreeze = async () => {
        const targetState = !systemFreezeActive;
        const msg = targetState 
            ? '⚠️ WARNING: Enabling System Freeze will immediately suspend all write operations (POST, PUT, DELETE) and block logins for all non-super-admins across the entire platform. Are you sure you want to activate the EMERGENCY FREEZE?'
            : 'Are you sure you want to disable the system freeze and restore normal operations across the platform?';
            
        const confirmed = await window.customConfirm(msg, targetState ? 'Activate Emergency Freeze' : 'Deactivate System Freeze');
        if (!confirmed) return;
        
        setPendingFreezeState(targetState);
        setIsVerifyModalOpen(true);
    };

    const handleFreezePinConfirm = async () => {
        try {
            await api.post('/admin/system/freeze', { freeze: pendingFreezeState });
            setSystemFreezeActive(pendingFreezeState);
            await window.customAlert(`System freeze successfully ${pendingFreezeState ? 'enabled' : 'disabled'}.`, 'System Lock Status');
            window.dispatchEvent(new Event('system_freeze_updated'));
        } catch (err) {
            await window.customAlert('Failed to update system freeze status: ' + (err.response?.data?.message || err.message), 'Error');
        }
    };

    const fetchSystemHealth = async () => {
        try {
            const res = await api.get('/admin/mainframe-stats');
            setSystemHealth(res);
            
            // Collect CPU history for chart
            setCpuHistory(prev => {
                const usage = res?.resources?.cpu?.usage ? parseFloat(res.resources.cpu.usage) : 0;
                const newData = [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), cpu: usage }];
                return newData.slice(-10); // Keep last 10 points
            });
        } catch (err) {
            console.error('Failed to fetch system health', err);
        }
    };

    const fetchMetrics = async () => {
        try {
            const data = await api.get('/analytics/metrics');
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch super admin metrics', err);
        }
    };

    const fetchGlobalPending = async () => {
        try {
            const res = await api.get('/documents/global-pending');
            setPendingDocs(res || []);
        } catch (err) {
            console.error('Failed to fetch global pending docs', err);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/admin/companies');
            setCompanies(res || []);
        } catch (err) {
            console.error('Failed to fetch companies', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-outfit text-slate-800 flex flex-col">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
                {/* Underline Tabs Navigation */}
                <div className="max-w-[1600px] mx-auto px-6 md:px-8 flex items-center gap-6 flex-wrap justify-start">
                    {[
                        { id: 'welcome', label: 'Welcome', icon: Globe },
                        { id: 'dashboard', label: 'Analytics', icon: Activity },
                        { id: 'announcements', label: 'Announcements', icon: Megaphone },
                        { id: 'terminal', label: 'Command HUD', icon: Terminal },
                        { id: 'billing', label: 'Billing & MRR', icon: Building2 },
                        { id: 'db_explorer', label: 'DB Explorer', icon: Database },
                        { id: 'audit', label: 'Audit Shield', icon: ShieldCheck },
                        { id: 'telemetry', label: 'Telemetry', icon: Server },
                        { id: 'support_tickets', label: 'Support Tickets', icon: Headphones },
                        { id: 'case_studies', label: 'Case Studies', icon: FileText },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-3.5 px-1.5 border-b-2 text-xs font-bold transition-all relative top-[1px] whitespace-nowrap ${
                                    isActive 
                                        ? 'border-indigo-600 text-indigo-600' 
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dashboard Workspace */}
            <div className="flex-1 max-w-[1600px] w-full mx-auto p-6 md:p-8 animate-in fade-in duration-300">
                {activeTab === 'welcome' && (
                    <WelcomeView 
                        metrics={metrics} 
                        pendingDocs={pendingDocs} 
                        health={systemHealth} 
                        companies={companies} 
                        systemFreezeActive={systemFreezeActive}
                        onToggleFreeze={handleToggleFreeze}
                        tickets={tickets}
                    />
                )}
                {activeTab === 'dashboard' && (
                    <DashboardView metrics={metrics} health={systemHealth} cpuHistory={cpuHistory} />
                )}
                {activeTab === 'announcements' && (
                    <AnnouncementsBroadcast companies={companies} />
                )}
                {activeTab === 'terminal' && (
                    <TerminalHUD />
                )}
                {activeTab === 'billing' && (
                    <BillingMRRView />
                )}
                {activeTab === 'db_explorer' && (
                    <DatabaseExplorerView />
                )}
                {activeTab === 'audit' && (
                    <AuditLogsView />
                )}
                {activeTab === 'telemetry' && (
                    <TelemetryView />
                )}
                {activeTab === 'support_tickets' && (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[70vh] animate-in fade-in duration-300">
                        <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <Headphones size={20} className="text-indigo-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Platform Support Tickets</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolve administrative requests from company tenants</p>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Column: Tickets list */}
                            <div className="w-80 md:w-96 border-r border-slate-100 flex flex-col bg-slate-50/20">
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {loadingTickets ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                            <RefreshCw size={24} className="animate-spin mb-2 text-indigo-500" />
                                            <span className="text-xs font-bold">Loading tickets...</span>
                                        </div>
                                    ) : tickets.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center">
                                            <Info size={28} className="mb-2 text-slate-300" />
                                            <p className="text-xs font-bold">No active tickets</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Tenant admins have not raised any platform support tickets yet.</p>
                                        </div>
                                    ) : (
                                        tickets.map(t => {
                                            const isSelected = selectedTicket?.id === t.id;
                                            return (
                                                <div 
                                                    key={t.id}
                                                    onClick={() => selectTicket(t)}
                                                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                                                        isSelected 
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                            t.status === 'Open' 
                                                                ? (isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700')
                                                                : (isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')
                                                        }`}>
                                                            {t.status}
                                                        </span>
                                                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                                            {new Date(t.created_at).toLocaleDateString('en-GB')}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-bold tracking-tight line-clamp-1 mb-1">{t.title}</h4>
                                                    <p className={`text-xs line-clamp-2 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                                        {t.description}
                                                    </p>
                                                    <div className={`mt-3 pt-3 border-t text-[10px] font-semibold flex items-center justify-between ${
                                                        isSelected ? 'border-white/10 text-white/80' : 'border-slate-50 text-slate-400'
                                                    }`}>
                                                        <span>Co: {t.creator_first_name ? `${t.creator_first_name} ${t.creator_last_name}` : 'Guest User'}</span>
                                                        <span className="capitalize">{t.priority}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Chat thread */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                {selectedTicket ? (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {/* Header */}
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                            <div className="text-left">
                                                <h4 className="text-base font-black text-slate-800 tracking-tight">{selectedTicket.title}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Raised on {new Date(selectedTicket.created_at).toLocaleString('en-GB')} by {selectedTicket.creator_first_name ? `${selectedTicket.creator_first_name} ${selectedTicket.creator_last_name}` : 'Guest User'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <select 
                                                    value={selectedTicket.status}
                                                    onChange={e => handleUpdateStatus(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Resolved">Resolved</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Messages list */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                            {/* Main Ticket Info Card */}
                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tenant Admin Request</span>
                                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                                    <span className="text-[10px] font-bold text-slate-400 capitalize">{selectedTicket.category} / {selectedTicket.priority} Priority</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                                    {selectedTicket.description}
                                                </p>
                                            </div>

                                            {/* Reply list */}
                                            <div className="space-y-4">
                                                {ticketReplies.map(reply => {
                                                    const isMe = reply.sender_role === 'super_admin';
                                                    return (
                                                        <div 
                                                            key={reply.id} 
                                                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                                        >
                                                            <div className={`max-w-[75%] rounded-2xl p-4 text-left shadow-sm border ${
                                                                isMe 
                                                                    ? 'bg-indigo-50/50 border-indigo-100/50 text-slate-800 rounded-tr-none' 
                                                                    : 'bg-slate-50 border-slate-100 text-slate-700 rounded-tl-none'
                                                            }`}>
                                                                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                                    <span>{reply.sender_first_name} {reply.sender_last_name}</span>
                                                                    <span className="font-semibold text-slate-300">({reply.sender_role})</span>
                                                                </div>
                                                                <p className="text-xs font-medium leading-relaxed whitespace-pre-line">{reply.message}</p>
                                                                <div className="text-[9px] text-slate-400 mt-2 text-right">
                                                                    {new Date(reply.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Send reply */}
                                        <form onSubmit={handlePostReply} className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-3 items-center">
                                            <input 
                                                type="text" 
                                                required
                                                value={replyMessage}
                                                onChange={e => setReplyMessage(e.target.value)}
                                                placeholder="Type a response to the tenant admin..."
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
                                            />
                                            <button 
                                                type="submit"
                                                disabled={submittingReply || !replyMessage.trim()}
                                                className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 active:scale-95 transition-transform disabled:opacity-50"
                                            >
                                                {submittingReply ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                                        <MessageSquare size={48} className="text-slate-200 mb-3" />
                                        <h3 className="text-base font-black text-slate-700 tracking-tight">No Ticket Selected</h3>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                                            Select a tenant platform support ticket from the left panel to review details, reply, or update status.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'case_studies' && (
                    <CaseStudiesManager />
                )}
            </div>

            <DeleteSecurityModal 
                isOpen={isVerifyModalOpen}
                onClose={() => setIsVerifyModalOpen(false)}
                onConfirm={handleFreezePinConfirm}
                url="/admin/system/freeze"
                title="System Freeze Authorization"
                message="Please enter the 6-digit numeric security key to authorize this system-wide freeze toggle action."
            />
        </div>
    );
};

export default SuperAdminDashboard;
