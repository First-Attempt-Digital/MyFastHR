import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Activity, TrendingUp, CreditCard,
    ShieldCheck, Bell, Search, Filter, ArrowUpRight,
    Building2, FileText, CheckCircle2, Clock, Globe,
    ChevronLeft, ChevronRight, Plus, UserPlus, UserMinus,
    RefreshCw, Mail, Plane, LayoutGrid, Settings, Power,
    Database, UserCheck, Edit3, X, Gift, Cake, User, Check
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    Legend, Cell, PieChart, Pie, ScatterChart, Scatter
} from 'recharts';
import api from '../../utils/api';

const FavouriteCard = ({ icon: Icon, label, color, bg, disabled = false, onClick }) => {
    return (
        <div onClick={!disabled ? onClick : undefined} className={`relative flex flex-col justify-between p-4 ${bg} rounded-[24px] min-w-[130px] hover:min-w-[200px] h-[150px] group cursor-pointer transition-all duration-500 ease-out hover:shadow-xl hover:shadow-indigo-200/40 border border-transparent hover:border-white/50`}>
            <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl bg-white shadow-sm ${color}`}>
                    <Icon size={18} />
                </div>
                {!disabled && (
                    <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:scale-110">
                        <X size={14} />
                    </button>
                )}
            </div>
            <div className="mt-3">
                <span className={`text-[12px] font-black ${color.replace('text-', 'text-opacity-95 text-')} leading-[1.2] tracking-tight block transition-all duration-500`}>
                    {label}
                </span>
            </div>
        </div>
    );
};

const BirthdayCard = ({ birthdayEmps = [], upcomingBirthdays = [] }) => {
    const hasBirthdaysToday = birthdayEmps.length > 0;
    const hasUpcomingBirthdays = upcomingBirthdays.length > 0;

    let titleText = "";
    let subTitleText = "";
    let btnText = "Send a wish!";
    let initials = "🎂";
    let isToday = false;

    if (hasBirthdaysToday) {
        isToday = true;
        const names = birthdayEmps.map(e => `${e.first_name} ${e.last_name}`).join(' & ');
        titleText = "🧁 Happy Birthday!";
        subTitleText = `Yay! Today is ${names}'s birthday.`;
        btnText = "Send a wish!";
        initials = birthdayEmps[0].first_name[0] + (birthdayEmps[0].last_name ? birthdayEmps[0].last_name[0] : '');
    } else if (hasUpcomingBirthdays) {
        const nextBday = upcomingBirthdays[0];
        const daysLeft = nextBday.daysLeft;
        const dateStr = new Date(nextBday.nextBdayDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        titleText = "🎉 Upcoming Birthday!";
        subTitleText = `${nextBday.first_name} ${nextBday.last_name}'s birthday is on ${dateStr} (in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}).`;
        btnText = "Prepare a wish!";
        initials = nextBday.first_name[0] + (nextBday.last_name ? nextBday.last_name[0] : '');
    } else {
        titleText = "✨ Spread the Cheer!";
        subTitleText = "No birthdays scheduled in the next 30 days. Have a wonderful day ahead!";
        btnText = "Spread Good Vibes";
        initials = "☀️";
    }

    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative flex flex-col min-h-[420px] animate-in fade-in duration-1000">
            {/* Festive Background Decorations */}
            <div className="absolute inset-x-0 top-0 h-40 pointer-events-none opacity-80">
                <svg viewBox="0 0 400 150" className="w-full h-full">
                    {/* Banners/Flags */}
                    <path d="M0 20 Q100 60 200 20 Q300 60 400 20" fill="none" stroke="#ddd" strokeWidth="1" />
                    {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map((x, i) => (
                        <path key={i} d={`M${x} ${20 + (i % 2 ? 20 : 10)} L${x + 20} ${40 + (i % 2 ? 20 : 10)} L${x + 40} ${20 + (i % 2 ? 20 : 10)} Z`} fill={['#ff7979', '#7ed6df', '#f0932b', '#badc58', '#686de0'][i % 5]} opacity="0.6" />
                    ))}
                    {/* Confetti */}
                    <circle cx="50" cy="80" r="3" fill="#ff7979" />
                    <rect x="320" y="60" width="6" height="6" fill="#7ed6df" transform="rotate(45 323 63)" />
                    <path d="M150 100 L155 105 L150 110 Z" fill="#f0932b" />
                    <circle cx="250" cy="120" r="4" fill="#badc58" />
                </svg>
            </div>

            <div className="absolute top-5 right-6 text-slate-400">
                <ArrowUpRight size={24} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 pt-16 z-10">
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-full bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                        <span className="text-3xl font-black text-indigo-600 tracking-tighter uppercase">{initials}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-50">
                        <Cake size={20} className={isToday ? "text-rose-500 animate-bounce" : "text-indigo-400"} />
                    </div>
                </div>

                <div className={`${isToday ? 'bg-rose-50/50 border border-rose-100/50' : 'bg-[#f4fbfe]'} rounded-[24px] p-8 w-full text-center space-y-6`}>
                    <span className="text-2xl">{isToday ? '🧁' : '🎉'}</span>
                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none">{titleText}</h4>
                    <h3 className="text-[17px] font-bold text-[#2d3436] leading-tight px-2">
                        {subTitleText}
                    </h3>

                    <button className={`${isToday ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#4834d4] hover:bg-[#3c2bb3]'} text-white px-8 py-3 rounded-full text-[15px] font-bold shadow-lg shadow-indigo-100 transition-all transform active:scale-95`}>
                        {btnText}
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

const MyTasksSection = ({ pendingLeaves = [], pendingRegularizations = [], pendingEntryRequests = [], onboardingPending = [] }) => {
    const navigate = useNavigate();
    const thingsToReview = onboardingPending.length;
    const thingsToMonitor = pendingLeaves.length + pendingRegularizations.length + pendingEntryRequests.length;

    return (
        <div className="bg-white rounded-[24px] border border-[#e0e4e8] shadow-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in duration-700 max-w-[900px]">
            {/* Sidebar */}
            <div className="md:w-56 bg-[#fff1e6] pt-4 px-8 pb-8 flex flex-col items-center justify-between rounded-l-[24px]">
                {/* Custom PNG Asset */}
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
                        <p className="text-[13.5px] font-medium text-slate-700">Things to review</p>
                    </div>
                    <div className="space-y-0 text-left pl-3">
                        <p className="text-[38px] font-bold text-[#e67e22] leading-none tracking-tighter">{thingsToMonitor}</p>
                        <p className="text-[13.5px] font-medium text-slate-700">Things to monitor</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-white">
                <TaskListItem title="Onboarding Confirmation" subtitle={`${onboardingPending.length} onboarding request(s) pending for your review.`} action="Review" color="red" onClick={() => navigate('/employees/overview')} />
                <TaskListItem title="Attendance Regularization" subtitle={`${pendingRegularizations.length} tasks pending for review.`} action="Monitor" color="teal" onClick={() => navigate('/leaves/manual-override')} />
                <TaskListItem title="Entry/Exit Requests" subtitle={`${pendingEntryRequests.length} request(s) pending for your review.`} action="Monitor" color="teal" onClick={() => navigate('/leaves/attendance-muster?tab=entry_requests')} />
                <TaskListItem title="Leave" subtitle={`${pendingLeaves.length} tasks pending for review.`} action="Monitor" color="teal" onClick={() => navigate('/leaves/employee-records')} />
            </div>
        </div>
    );
};



const RequestsAndUpdates = ({ pendingLeaves = [], pendingRegularizations = [], pendingEntryRequests = [], notifications = [] }) => {
    const navigate = useNavigate();
    const items = [];

    // Add pending leaves
    pendingLeaves.forEach(leave => {
        items.push({
            id: `leave-${leave.id}`,
            type: 'leave',
            title: 'Leave Request',
            date: new Date(leave.created_at || leave.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            description: `${leave.first_name} ${leave.last_name} requested ${leave.days} day(s) of ${leave.leave_type_name || 'Leave'}.`,
            badge: 'Pending Approval',
            badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            bg: 'bg-[#f4f7fe]/70 hover:bg-[#eaeefc]/90 border-indigo-100/50',
            route: '/leaves/employee-records'
        });
    });

    // Add pending entry/exit requests
    pendingEntryRequests.forEach(req => {
        items.push({
            id: `entry-${req.id}`,
            type: 'entry_request',
            title: 'Entry/Exit Request',
            date: new Date(req.created_at || req.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            description: `${req.first_name} ${req.last_name} requested ${req.request_type === 'late_in' ? 'Late In' : 'Early Out'} approval.`,
            badge: 'Needs Review',
            badgeBg: 'bg-amber-50 text-amber-750 border-amber-200',
            bg: 'bg-[#fffbeb]/70 hover:bg-[#fef3c7]/90 border-amber-100/50',
            route: '/leaves/shift-override'
        });
    });

    // Add pending regularizations
    pendingRegularizations.forEach(reg => {
        items.push({
            id: `reg-${reg.id}`,
            type: 'regularization',
            title: 'Regularization Request',
            date: new Date(reg.created_at || reg.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            description: `${reg.first_name} ${reg.last_name} requested attendance correction for ${reg.date}.`,
            badge: 'Needs Review',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            bg: 'bg-[#f0fdf4]/70 hover:bg-[#dcfce7]/90 border-emerald-100/50',
            route: '/leaves/regularizations'
        });
    });

    // Add notifications
    notifications.slice(0, 5).forEach(notif => {
        items.push({
            id: `notif-${notif.id}`,
            type: 'notification',
            title: notif.title || 'System Update',
            date: new Date(notif.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            description: notif.message,
            badge: 'Update',
            badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
            bg: 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-100',
            route: null
        });
    });

    // Fallbacks if nothing is pending
    if (items.length === 0) {
        items.push({
            id: 'mock-1',
            type: 'update',
            title: 'Faster Recruitment',
            date: '28 Apr',
            description: 'Faster Recruitment Workflows with NAVOS in greytHR Recruit.',
            badge: 'News',
            badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
            bg: 'bg-[#fdf8ff] hover:bg-[#f8edff] border-purple-50',
            route: null
        });
        items.push({
            id: 'mock-2',
            type: 'update',
            title: 'New Financial Year',
            date: '27 Apr',
            description: 'Start the New Financial Year Right: Replace Manual Entry with AI-Powered Expense.',
            badge: 'News',
            badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
            bg: 'bg-[#fdf8ff] hover:bg-[#f8edff] border-purple-50',
            route: null
        });
    }

    return (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-1000">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-[20px] font-bold text-[#2d3436] tracking-tight">Requests & Updates</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actionable Alerts & Feed</p>
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

const ChartCard = ({ title, subtitle, children, className = "h-64", headerAction }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-8">
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center w-full">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
                {headerAction}
            </div>
            {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
        </div>
        <div className={`${className} w-full`}>
            {children}
        </div>
    </div>
);

const WelcomeView = ({ data, birthdayEmps = [], upcomingBirthdays = [], pendingLeaves = [], pendingRegularizations = [], pendingEntryRequests = [], notifications = [], tasks = [], onboardingPending = [] }) => {
    const navigate = useNavigate();

    const getGreetingDetails = () => {
        const hours = new Date().getHours();
        if (hours >= 4 && hours < 12) {
            return {
                greeting: "Good Morning",
                subtext: "Let's do great things together. 🚀 ☀️"
            };
        } else if (hours >= 12 && hours < 17) {
            return {
                greeting: "Good Afternoon",
                subtext: "Let's keep up the momentum. 🚀 🌤️"
            };
        } else if (hours >= 17 && hours < 22) {
            return {
                greeting: "Good Evening",
                subtext: "Wrapping up the day smoothly. 🚀 🌙"
            };
        } else {
            return {
                greeting: "Good Night",
                subtext: "Burning the midnight oil? Remember to rest! 🚀 🌌"
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Favourites + Tasks */}
                <div className="lg:col-span-8 space-y-8 min-w-0">
                    {/* Tactical Operations Console */}
                    <div className="bg-[#f8fafc] rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Tactical Operations Console</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrative Control Desk</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 px-2">
                            {/* Card 1: Onboard Talent */}
                            <div
                                onClick={() => navigate('/employees/onboard')}
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
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-indigo-600 transition-colors">Onboard New Talent</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Register staff, config profiles, trigger invite workflows</p>
                                </div>
                            </div>

                            {/* Card 2: Manage Staff */}
                            <div
                                onClick={() => navigate('/employees')}
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-emerald-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-100">
                                        <Users size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-emerald-600 transition-colors">Staff Directory</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Modify info, update roles, assign departments</p>
                                </div>
                            </div>

                            {/* Card 3: Employee exit & settlement */}
                            <div
                                onClick={() => navigate('/payroll?tab=separations')}
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-amber-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-100">
                                        <UserMinus size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-amber-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-amber-600 transition-colors">Exit & Settlements</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Process resignations, calculate FNF settlements</p>
                                </div>
                            </div>

                            {/* Card 4: Credential Control */}
                            <div
                                onClick={() => navigate('/employees')}
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-rose-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(244,63,94,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md shadow-rose-100">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-rose-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-rose-600 transition-colors">Identity Control</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Reset passwords, manage employee login credentials</p>
                                </div>
                            </div>

                            {/* Card 5: Attendance Overview */}
                            <div
                                onClick={() => navigate('/leaves/attendance-overview')}
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-100">
                                        <Clock size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-blue-600 transition-colors">Attendance Desk</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Track biometric logs, shift roasters & overrides</p>
                                </div>
                            </div>

                            {/* Card 6: Payroll Console */}
                            <div
                                onClick={() => navigate('/payroll')}
                                className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-violet-200/60 cursor-pointer shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(139,92,246,0.15)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-500 text-white shadow-md shadow-violet-100">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="text-slate-300 group-hover:text-violet-500 transition-colors">
                                        <ArrowUpRight size={18} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-[14px] font-extrabold text-[#2d3436] tracking-tight group-hover:text-violet-600 transition-colors">Payroll Console</h4>
                                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-normal">Process payroll, track monthly salaries & pay records</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* My Tasks Section */}
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-[#2d3436] tracking-tight pl-2">My Tasks</h3>
                        <MyTasksSection
                            pendingLeaves={pendingLeaves}
                            pendingRegularizations={pendingRegularizations}
                            pendingEntryRequests={pendingEntryRequests}
                            onboardingPending={onboardingPending}
                        />
                    </div>


                </div>

                {/* Right Column: Sidebar (Birthday + Updates) */}
                <div className="lg:col-span-4 space-y-8">
                    <BirthdayCard birthdayEmps={birthdayEmps} upcomingBirthdays={upcomingBirthdays} />
                    <RequestsAndUpdates pendingLeaves={pendingLeaves} pendingRegularizations={pendingRegularizations} pendingEntryRequests={pendingEntryRequests} notifications={notifications} />
                </div>
            </div>
        </div>
    );
};


const LeavePortalView = () => {
    const [month, setMonth] = useState('April 2026');

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Leave Management Portal</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Absence & Resource Mapping</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white border border-slate-100 rounded-2xl px-6 py-2 shadow-sm flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Select Month</span>
                        <select
                            className="bg-transparent text-sm font-black text-indigo-600 outline-none cursor-pointer"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        >
                            <option>April 2026</option>
                            <option>March 2026</option>
                            <option>February 2026</option>
                        </select>
                    </div>
                    <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                        <Plus size={16} /> New Entry
                    </button>
                </div>
            </div>

            {/* Quick Actions & Balance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600">
                            <Activity size={32} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase">Attendance Actions</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick mark for today</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Mark Present</button>
                        <button className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm">Mark Absent</button>
                        <button className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all shadow-sm">Half Day</button>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-100 flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-all">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">Current Balance</h4>
                        <p className="text-3xl font-black italic tracking-tighter">18.5 Days</p>
                        <a href="#" className="text-[10px] font-bold text-indigo-200 underline decoration-indigo-400 hover:text-white flex items-center gap-1 mt-2">View Breakdown <ArrowUpRight size={10} /></a>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Calendar size={32} />
                    </div>
                </div>
            </div>

            {/* Approval Workflow Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Manager Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-8 bg-orange-400 rounded-full" />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Manager Approvals</h3>
                    </div>
                    <div className="bg-[#fff7f0] rounded-[40px] p-6 border border-orange-100 min-h-[300px] space-y-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-orange-50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Team Leave</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Today</span>
                            </div>
                            <p className="text-xs font-black text-slate-700 italic leading-snug">Rahul Staff requested 2 days Sick Leave</p>
                            <div className="flex gap-2 pt-2">
                                <button className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Approve</button>
                                <button className="flex-1 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest">Reject</button>
                            </div>
                        </div>
                        <div className="bg-white/50 p-5 rounded-3xl border border-dashed border-orange-200 flex items-center justify-center py-10">
                            <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest">No pending holidays</p>
                        </div>
                    </div>
                </div>

                {/* HR Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-8 bg-indigo-400 rounded-full" />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">HR Approvals</h3>
                    </div>
                    <div className="bg-[#f4f7fe] rounded-[40px] p-6 border border-indigo-100 min-h-[300px] space-y-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Internal Entry</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">27 Apr</span>
                            </div>
                            <p className="text-xs font-black text-slate-700 italic leading-snug">Salary Correction request for Akash Manager</p>
                            <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Review & Sign</button>
                        </div>
                    </div>
                </div>

                {/* Admin Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-8 bg-slate-800 rounded-full" />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Admin Approvals</h3>
                    </div>
                    <div className="bg-slate-50 rounded-[40px] p-6 border border-slate-200 min-h-[300px] space-y-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">External Entry</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Pending</span>
                            </div>
                            <p className="text-xs font-black text-slate-700 italic leading-snug">Contractor Deployment Approval: Project X</p>
                            <div className="flex items-center justify-between pt-2">
                                <button className="text-[9px] font-black text-indigo-600 uppercase hover:underline">View Details</button>
                                <div className="flex gap-1">
                                    <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Check size={12} /></button>
                                    <button className="p-2 bg-rose-50 text-rose-600 rounded-lg"><X size={12} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Links */}
            <div className="flex justify-center pt-6">
                <button className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
                    <Users size={14} className="text-indigo-600" /> View Org Chart
                </button>
            </div>
        </div>
    );
};

const CandlestickBar = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload || !payload.hasData) return null;

    const { basePayroll, netPayroll, deductedBasePayroll, grossPayroll } = payload;
    const isGreen = netPayroll >= basePayroll;
    const color = isGreen ? '#10B981' : '#F43F5E';

    const bodyTopValue = Math.max(basePayroll, netPayroll);
    const bodyBottomValue = Math.min(basePayroll, netPayroll);
    const bodySpan = Math.max(Math.abs(bodyTopValue - bodyBottomValue), 1);

    const pxPerUnit = height / bodySpan;

    const yHigh = y - (grossPayroll - bodyTopValue) * pxPerUnit;
    const yLow = (y + height) + (bodyBottomValue - deductedBasePayroll) * pxPerUnit;

    const cx = x + width / 2;
    const bodyWidth = 14;

    return (
        <g>
            {/* Wick (Low to High) */}
            <line x1={cx} y1={yLow} x2={cx} y2={yHigh} stroke={color} strokeWidth={2} />
            {/* Body */}
            <rect
                x={cx - bodyWidth / 2}
                y={y}
                width={bodyWidth}
                height={Math.max(height, 4)}
                fill={color}
                rx={2}
            />
        </g>
    );
};

const CandlestickTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const { name, year, basePayroll, netPayroll, deductedBasePayroll, grossPayroll, allowances, deductions, hasData } = payload[0].payload;
        if (!hasData) return null;
        const isGreen = netPayroll >= basePayroll;
        return (
            <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 space-y-2 text-left min-w-[240px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{name} {year}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Payroll:</span>
                    <span className="text-[10px] font-black text-slate-700 text-right">₹{Math.round(grossPayroll).toLocaleString('en-IN')}</span>

                    <span className="text-[10px] font-bold text-slate-500 uppercase">Base Payroll:</span>
                    <span className="text-[10px] font-black text-slate-700 text-right">₹{Math.round(basePayroll).toLocaleString('en-IN')}</span>

                    <span className="text-[10px] font-bold text-slate-500 uppercase">Net Payroll:</span>
                    <span className="text-[10px] font-black text-slate-700 text-right">₹{Math.round(netPayroll).toLocaleString('en-IN')}</span>

                    <span className="text-[10px] font-bold text-slate-500 uppercase">Deducted Base:</span>
                    <span className="text-[10px] font-black text-slate-700 text-right">₹{Math.round(deductedBasePayroll).toLocaleString('en-IN')}</span>

                    <div className="col-span-2 border-t border-dashed border-slate-100 my-1"></div>

                    <span className="text-[9px] font-bold text-slate-400 uppercase">Allowances:</span>
                    <span className="text-[9px] font-extrabold text-emerald-600 text-right">+₹{Math.round(allowances).toLocaleString('en-IN')}</span>

                    <span className="text-[9px] font-bold text-slate-400 uppercase">Deductions:</span>
                    <span className="text-[9px] font-extrabold text-rose-600 text-right">-₹{Math.round(deductions).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-slate-150 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-wider">Payroll Trend:</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isGreen ? '▲ Surplus' : '▼ Deficit'}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const AgeInfographic = ({ ageData }) => {
    // Dynamic real data lookup to handle out-of-order or missing cohorts from DB
    const findAgeCount = (rangeKey) => {
        if (rangeKey === '30-50') {
            // Sum both '30-50' and '> 50' or 'above 50' to get total senior staff
            return ageData
                .filter(item => item.age_range === '30-50' || item.age_range === '> 50' || item.age_range === 'above 50')
                .reduce((sum, item) => sum + (parseInt(item.count) || parseInt(item.value) || 0), 0);
        }
        const found = ageData.find(item => item.age_range === rangeKey);
        return found ? (parseInt(found.count) || parseInt(found.value) || 0) : 0;
    };

    const peaks = [
        {
            id: '01',
            label: '< 20',
            count: findAgeCount('< 20'),
            leftColor: '#86EFAC', // Emerald-300 light
            rightColor: '#10B981', // Emerald-500 dark
            color: '#10B981',
            bgColor: '#e6fbf2',
            icon: ShieldCheck,
            desc: 'Early career professionals and junior staff.'
        },
        {
            id: '02',
            label: '20-25',
            count: findAgeCount('20-25'),
            leftColor: '#67E8F9', // Cyan-300 light
            rightColor: '#06B6D4', // Cyan-500 dark
            color: '#06B6D4',
            bgColor: '#ecfeff',
            icon: Users,
            desc: 'Core execution team and senior associates.'
        },
        {
            id: '03',
            label: '25-30',
            count: findAgeCount('25-30'),
            leftColor: '#FDBA74', // Orange-300 light
            rightColor: '#F97316', // Orange-500 dark
            color: '#F97316',
            bgColor: '#fff7ed',
            icon: TrendingUp,
            desc: 'Managerial staff and functional team leaders.'
        },
        {
            id: '04',
            label: '30-50',
            count: findAgeCount('30-50'),
            leftColor: '#FCA5A5', // Red-300 light
            rightColor: '#EF4444', // Red-500 dark
            color: '#EF4444',
            bgColor: '#fef2f2',
            icon: Clock,
            desc: 'Executive leadership and principal advisors.'
        }
    ];

    // SVG parameters
    // Width = 800, Height = 230, Y baseline = 220
    // Center positions: 100, 300, 500, 700
    // Peak Y: 120, 90, 60, 30
    // Base width: 240 (half: 120)
    // Angles for labels: 40, 45, 50, 55

    return (
        <div className="space-y-6">
            {/* Unified SVG Container for Pyramids Timeline (Image 1 style) */}
            <div className="w-full relative border-b border-slate-100 pb-2">
                <svg viewBox="0 0 800 230" className="w-full h-auto overflow-visible">
                    {/* Draw pyramids in sequential overlapping order */}
                    {peaks.map((peak, idx) => {
                        const centers = [100, 300, 500, 700];
                        const peakYs = [120, 90, 60, 30];
                        const baseHalfWidth = 120;
                        const cx = centers[idx];
                        const peakY = peakYs[idx];
                        const labelAngles = [40, 45, 50, 55];
                        const angle = labelAngles[idx];

                        return (
                            <g key={peak.id}>
                                {/* Flagpole */}
                                <line x1={cx} y1={peakY} x2={cx} y2={peakY - 26} stroke="#cbd5e1" strokeWidth="1.5" />

                                {/* Flag pointing right */}
                                <g transform={`translate(${cx}, ${peakY - 30})`}>
                                    <path d="M0,0 L42,0 L37,8 L42,16 L0,16 Z" fill={peak.color} />
                                    <text x="18" y="11" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                                        {peak.id} • {peak.count}
                                    </text>
                                </g>

                                {/* Left Face of Pyramid */}
                                <polygon points={`${cx},${peakY} ${cx - baseHalfWidth},220 ${cx},220`} fill={peak.leftColor} />

                                {/* Right Face of Pyramid */}
                                <polygon points={`${cx},${peakY} ${cx},220 ${cx + baseHalfWidth},220`} fill={peak.rightColor} />

                                {/* Diagonal text along left slope */}
                                <g transform={`translate(${cx - 35}, ${peakY + (220 - peakY) * 0.5 + 8}) rotate(${-angle})`}>
                                    <text x="0" y="0" fill="#fff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" opacity="0.95">
                                        {peak.label}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Bottom Descriptions Grid (Perfectly matching the 4 grid columns under the pyramids) */}
            <div className="grid grid-cols-4 gap-4 pt-2">
                {peaks.map((peak) => {
                    const Icon = peak.icon;
                    return (
                        <div key={peak.id} className="flex flex-col items-center text-center space-y-2">
                            {/* Circular Icon with shadow */}
                            <div className={`w-9 h-9 rounded-full ${peak.bgColor} flex items-center justify-center border border-slate-100 shadow-sm`}>
                                <Icon size={16} style={{ color: peak.color }} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-wider" style={{ color: peak.color }}>
                                    {peak.label}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                    {peak.count} {peak.count === 1 ? 'Employee' : 'Employees'}
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-500 font-bold leading-relaxed px-1">
                                {peak.desc}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DashboardView = ({ metrics }) => {
    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <RefreshCw className="animate-spin text-indigo-600" size={32} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Analytics Hub...</p>
            </div>
        );
    }

    const yearsData = (metrics?.serviceDistribution || []).map(item => ({
        name: item.years,
        value: item.count || 0
    }));

    const additionsData = (metrics?.trends || []).map(item => ({
        name: item.month,
        joined: item.joined || 0,
        resigned: item.resigned || 0
    }));

    const locationData = (metrics?.locationDist || []).map(item => ({
        name: item.location || 'Unassigned',
        value: item.count || 0
    }));

    const ageData = (metrics?.ageDist || []).map(item => ({
        name: item.age_range,
        value: item.count || 0
    }));

    const monthlyCTC = metrics?.monthlyCTC || [];

    // Map month & year to financial year
    const getFinancialYear = (m, y) => {
        const startYear = m >= 4 ? y : y - 1;
        return `FY ${startYear}-${String(startYear + 1).slice(2)}`;
    };

    // Calculate unique available financial years
    const availableFYs = [...new Set(monthlyCTC.map(item => getFinancialYear(item.month, item.year)))].sort();

    // Determine the current financial year based on today's date
    const today = new Date();
    const currentFY = getFinancialYear(today.getMonth() + 1, today.getFullYear());

    // Selected Financial Year state
    const [selectedFY, setSelectedFY] = useState('');

    useEffect(() => {
        if (availableFYs.length > 0 && !selectedFY) {
            setSelectedFY(availableFYs[availableFYs.length - 1]);
        } else if (!selectedFY) {
            setSelectedFY(currentFY);
        }
    }, [metrics]);

    const getFYMonths = (fyString) => {
        if (!fyString) return [];
        const match = fyString.match(/FY (\d{4})-(\d{2})/);
        if (!match) return [];
        const startYear = parseInt(match[1]);
        const endYear = startYear + 1;

        return [
            { monthNum: 4, year: startYear, label: 'Apr' },
            { monthNum: 5, year: startYear, label: 'May' },
            { monthNum: 6, year: startYear, label: 'Jun' },
            { monthNum: 7, year: startYear, label: 'Jul' },
            { monthNum: 8, year: startYear, label: 'Aug' },
            { monthNum: 9, year: startYear, label: 'Sep' },
            { monthNum: 10, year: startYear, label: 'Oct' },
            { monthNum: 11, year: startYear, label: 'Nov' },
            { monthNum: 12, year: startYear, label: 'Dec' },
            { monthNum: 1, year: endYear, label: 'Jan' },
            { monthNum: 2, year: endYear, label: 'Feb' },
            { monthNum: 3, year: endYear, label: 'Mar' }
        ];
    };

    const fyMonths = getFYMonths(selectedFY);

    const payrollCandleData = fyMonths.map(m => {
        const dbRecord = monthlyCTC.find(item => parseInt(item.month) === m.monthNum && parseInt(item.year) === m.year);

        if (dbRecord) {
            const base = parseFloat(dbRecord.base) || 0;
            const allowances = parseFloat(dbRecord.allowances) || 0;
            const deductions = parseFloat(dbRecord.deductions) || 0;
            const net = parseFloat(dbRecord.net) || 0;

            const gross = base + allowances;
            const deductedBase = base - deductions;

            return {
                name: m.label,
                year: m.year,
                basePayroll: base,
                grossPayroll: gross,
                netPayroll: net,
                deductedBasePayroll: deductedBase,
                allowances,
                deductions,
                body: [base, net],
                hasData: true
            };
        } else {
            return {
                name: m.label,
                year: m.year,
                hasData: false
            };
        }
    });

    // Brand color palette (Indigo, Emerald, Amber, Rose, Purple, Slate) to match other pages
    const COLORS = [
        '#4F46E5', // Brand Indigo (Primary theme)
        '#10B981', // Brand Emerald (Active/Present status)
        '#F59E0B', // Brand Amber (Warning/Pending status)
        '#F43F5E', // Brand Rose (Danger/Absent status)
        '#8B5CF6', // Brand Purple (Accents)
        '#64748B'  // Brand Slate (Neutral)
    ];

    const pieData = yearsData.length > 0 ? yearsData : [{ name: 'No Data', value: 1 }];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Company Analytics Hub</h2>
            </div>

            {/* 2x2 Tactical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Years in Service - Solid Pie Chart (Inspired by Image 3) */}
                <ChartCard title="Years In Service Distribution" subtitle="Headcount by Tenure Group">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="45%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={78}
                                dataKey="value"
                                stroke="#ffffff"
                                strokeWidth={2}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                            <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                iconType="square"
                                wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingLeft: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Additions & Attrition - Spike Graph (Linear Area Chart) */}
                <ChartCard title="Additions & Attrition" subtitle="Trend Over Time">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={additionsData}>
                            <defs>
                                <linearGradient id="colorJoined" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
                                </linearGradient>
                                <linearGradient id="colorResigned" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                            <Legend iconType="circle" align="center" verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }} />
                            <Area type="linear" dataKey="joined" name="Joined" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorJoined)" dot={{ r: 4, fill: '#4F46E5', stroke: '#ffffff', strokeWidth: 1.5 }} />
                            <Area type="linear" dataKey="resigned" name="Resigned" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorResigned)" dot={{ r: 4, fill: '#F43F5E', stroke: '#ffffff', strokeWidth: 1.5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Employee Count By Location - Colorful Scatter Chart (Inspired by Image 3) */}
                <ChartCard title="Employee Count By Location" subtitle="Geographic Deployment">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                            <XAxis type="category" dataKey="name" name="Location" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <YAxis type="number" dataKey="value" name="Employees" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                            <Scatter name="Employees" data={locationData} shape="circle" line={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '4 4' }}>
                                {locationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Age Distribution - Custom 3D Pyramid Timeline Infographic (Inspired by Image 1) */}
                <ChartCard title="Age Distribution" subtitle="Workforce Demographic" className="h-auto">
                    <AgeInfographic ageData={metrics?.ageDist || []} />
                </ChartCard>
            </div>

            {/* Monthly Payroll Expenses - Stock Candlestick Chart */}
            <div className="grid grid-cols-1 gap-8">
                <ChartCard
                    title="Monthly Payroll Expenses"
                    subtitle={`Financial Year ${selectedFY || ''} (Detailed Payroll Candlestick)`}
                    className="h-80"
                    headerAction={
                        availableFYs.length > 0 ? (
                            <select
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-[11px] font-black text-indigo-600 outline-none cursor-pointer shadow-sm hover:bg-slate-100 transition-all"
                                value={selectedFY}
                                onChange={(e) => setSelectedFY(e.target.value)}
                            >
                                {availableFYs.map(fy => (
                                    <option key={fy} value={fy}>{fy}</option>
                                ))}
                            </select>
                        ) : null
                    }
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={payrollCandleData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} formatter={(v) => `₹${Math.round(v / 1000)}k`} />
                            <Tooltip content={<CandlestickTooltip />} />
                            <Bar dataKey="body" shape={<CandlestickBar />} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('welcome');
    const [metrics, setMetrics] = useState(null);
    const [birthdayEmps, setBirthdayEmps] = useState([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [pendingRegularizations, setPendingRegularizations] = useState([]);
    const [pendingEntryRequests, setPendingEntryRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [onboardingPending, setOnboardingPending] = useState([]);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const data = await api.get('/analytics/metrics');
            setMetrics(data);

            try {
                const leaves = await api.get('/leaves?view=team&status=pending');
                setPendingLeaves(leaves || []);
            } catch (err) {
                console.error('Failed to fetch pending leaves', err);
            }

            try {
                const regs = await api.get('/regularizations/review');
                setPendingRegularizations(regs.filter(r => r.status === 'pending') || []);
            } catch (err) {
                console.error('Failed to fetch pending regularizations', err);
            }

            try {
                const notifs = await api.get('/notifications');
                setNotifications(notifs || []);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }

            try {
                const taskList = await api.get('/tasks');
                setTasks(taskList || []);
            } catch (err) {
                console.error('Failed to fetch tasks', err);
            }

            try {
                const onboardingList = await api.get('/employees/onboarding/pending');
                setOnboardingPending(onboardingList || []);
            } catch (err) {
                console.error('Failed to fetch onboarding pending list', err);
            }

            try {
                const entryReqs = await api.get('/attendance/entry-requests?status=pending');
                setPendingEntryRequests(entryReqs || []);
            } catch (err) {
                console.error('Failed to fetch pending entry requests', err);
            }

            const emps = await api.get('/employees');
            if (Array.isArray(emps)) {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentDate = today.getDate();

                const todayBirthdays = emps.filter(e => {
                    if (!e.date_of_birth) return false;
                    const dob = new Date(e.date_of_birth);
                    return dob.getMonth() === currentMonth && dob.getDate() === currentDate;
                });
                setBirthdayEmps(todayBirthdays);

                const upcoming = emps
                    .filter(e => {
                        if (!e.date_of_birth) return false;
                        const dob = new Date(e.date_of_birth);
                        if (dob.getMonth() === currentMonth && dob.getDate() === currentDate) return false;
                        return true;
                    })
                    .map(e => {
                        const dob = new Date(e.date_of_birth);
                        let bdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                        if (bdayThisYear < today) {
                            bdayThisYear.setFullYear(today.getFullYear() + 1);
                        }
                        const daysLeft = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));
                        return { ...e, daysLeft, nextBdayDate: bdayThisYear };
                    })
                    .filter(e => e.daysLeft <= 30)
                    .sort((a, b) => a.daysLeft - b.daysLeft);
                setUpcomingBirthdays(upcoming);
            }
        } catch (err) {
            console.error('Failed to fetch admin metrics or employees', err);
        }
    };

    return (
        <div className="min-h-screen font-outfit overflow-x-hidden">
            <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-1000 max-w-[1600px] mx-auto">
                {/* Tab Switcher Pills */}
                <div className="flex justify-center mb-4">
                    <div className="inline-flex p-1 bg-white border border-slate-100 rounded-full shadow-sm">
                        <button
                            onClick={() => setActiveTab('welcome')}
                            className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'welcome' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Welcome
                        </button>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Dashboard
                        </button>
                    </div>
                </div>

                {activeTab === 'welcome' ? (
                    <WelcomeView
                        data={metrics}
                        birthdayEmps={birthdayEmps}
                        upcomingBirthdays={upcomingBirthdays}
                        pendingLeaves={pendingLeaves}
                        pendingRegularizations={pendingRegularizations}
                        pendingEntryRequests={pendingEntryRequests}
                        notifications={notifications}
                        tasks={tasks}
                        onboardingPending={onboardingPending}
                    />
                ) : (
                    <DashboardView metrics={metrics} />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
