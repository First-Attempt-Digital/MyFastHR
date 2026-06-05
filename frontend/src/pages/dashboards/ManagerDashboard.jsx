import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Activity, TrendingUp, CreditCard, 
    ShieldCheck, Bell, Search, Filter, ArrowUpRight,
    Building2, FileText, CheckCircle2, Clock, Globe,
    ChevronLeft, ChevronRight, Plus, UserPlus, UserMinus, 
    RefreshCw, Mail, Plane, LayoutGrid, Settings, Power,
    Database, UserCheck, Edit3, Star, Calendar
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, LineChart, Line, BarChart, Bar, 
    Legend, Cell 
} from 'recharts';
import api from '../../utils/api';

const FavouriteCard = ({ icon: Icon, label, color, bg, onClick }) => (
    <div onClick={onClick} className="flex flex-col items-center gap-4 p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer min-w-[150px] group">
        <div className={`p-4 rounded-2xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
        <span className="text-[11px] font-black text-center text-slate-700 leading-tight uppercase tracking-tight">{label}</span>
    </div>
);

const TaskItem = ({ title, count, action, onClick }) => (
    <div onClick={onClick} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <LayoutGrid size={20} />
            </div>
            <div>
                <h4 className="text-sm font-black text-slate-800 uppercase italic">{title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{count} team requests pending approval.</p>
            </div>
        </div>
        <button className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest border-b-2 border-transparent hover:border-indigo-600 transition-all pb-1">
            {action}
        </button>
    </div>
);

const RequestsAndUpdates = ({ pendingLeaves = [], pendingRegularizations = [], notifications = [] }) => {
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

const WelcomeView = ({ data, pendingLeaves = [], pendingRegularizations = [], notifications = [] }) => {
    const navigate = useNavigate();
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Team Leader Hero */}
            <div className="relative min-h-[400px] flex flex-col justify-center px-8 md:px-16 overflow-hidden rounded-[60px]">
                <img 
                    src="/assets/skyline.png" 
                    alt="City Skyline" 
                    className="absolute inset-0 w-full h-full object-cover opacity-90 object-bottom hue-rotate-15"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
                
                <div className="relative z-10 space-y-4">
                    <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                        <Star size={14} className="animate-pulse" /> Team Leader Mode
                    </h2>
                    <h1 className="text-4xl md:text-6xl font-light text-slate-700 tracking-tight">
                        Good Afternoon,
                    </h1>
                    <p className="text-lg md:text-2xl font-black text-slate-800 italic uppercase">
                        Your team's <span className="text-indigo-600 underline">Productivity Hub</span> is active.
                    </p>
                </div>
            </div>

            {/* Manager Favourites */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Leader Shortcuts</h3>
                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><ChevronLeft size={16} /></button>
                        <button className="p-3 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar px-1">
                    <FavouriteCard icon={Plane} label="Approve Team Leaves" color="text-indigo-600" bg="bg-indigo-50" onClick={() => navigate('/leaves/employee-records')} />
                    <FavouriteCard icon={UserCheck} label="Approve Attendance" color="text-indigo-600" bg="bg-indigo-50" onClick={() => navigate('/leaves/manual-override')} />
                    <FavouriteCard icon={Users} label="View Team Roster" color="text-indigo-600" bg="bg-indigo-50" onClick={() => navigate('/leaves/who-is-in')} />
                    <FavouriteCard icon={FileText} label="Performance Review" color="text-indigo-600" bg="bg-indigo-50" onClick={() => navigate('/leaves/employee-records')} />
                    <FavouriteCard icon={Calendar} label="Team Schedule" color="text-indigo-600" bg="bg-indigo-50" onClick={() => navigate('/leaves/calendar')} />
                    <FavouriteCard icon={ArrowUpRight} label="Promotion Workflow" color="text-indigo-600" bg="bg-indigo-50" onClick={() => navigate('/leaves/employee-records')} />
                </div>
            </section>

            {/* Team Tasks & Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic px-4">Pending Peer Signals</h3>
                     <TaskItem title="Leave Approvals" count={pendingLeaves.length} action="Triage" onClick={() => navigate('/leaves/employee-records')} />
                     <TaskItem title="Attendance Correction" count={pendingRegularizations.length} action="Resolve" onClick={() => navigate('/leaves/regularizations')} />
                     <div className="bg-white p-8 rounded-[32px] border border-slate-100 border-dashed flex flex-col items-center justify-center gap-4 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">All team signals are balanced.</p>
                     </div>
                </div>

                <div className="lg:col-span-4">
                    <RequestsAndUpdates pendingLeaves={pendingLeaves} pendingRegularizations={pendingRegularizations} notifications={notifications} />
                </div>
            </div>
        </div>
    );
};

const ChartCard = ({ title, subtitle, children }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-8">
        <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
        </div>
        <div className="h-64 w-full">
            {children}
        </div>
    </div>
);

const DashboardView = ({ metrics }) => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Team Dynamic Analytics</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                <Edit3 size={14} className="text-indigo-600" />
                Edit
            </button>
        </div>

        {/* 2x2 Tactical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Team Presence Today" subtitle="Real-time occupancy">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Present', value: 8, color: '#10b981' },
                        { name: 'On Leave', value: 2, color: '#6366f1' },
                        { name: 'Remote', value: 4, color: '#f59e0b' }
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <Tooltip />
                        <Bar dataKey="value" barSize={40} radius={[8, 8, 0, 0]}>
                            {[0, 1, 2].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#6366f1' : '#f59e0b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Team Leave Pipeline" subtitle="Upcoming team absences">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                        { name: 'Mon', value: 1 },
                        { name: 'Tue', value: 2 },
                        { name: 'Wed', value: 0 },
                        { name: 'Thu', value: 3 },
                        { name: 'Fri', value: 1 }
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="#6366f110" />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Project Load Distribution" subtitle="Hours across department projects">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                        { name: 'Core', value: 45 },
                        { name: 'Support', value: 20 },
                        { name: 'Ops', value: 35 }
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={3} dot={{ r: 6, fill: '#0891b2' }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Team Sentiment Pulse" subtitle="Direct report feedback index">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Satisfied', value: 12 },
                        { name: 'Neutral', value: 2 }
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    </div>
);

const ManagerDashboard = () => {
    const [activeTab, setActiveTab] = useState('welcome');
    const [metrics, setMetrics] = useState(null);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [pendingRegularizations, setPendingRegularizations] = useState([]);
    const [notifications, setNotifications] = useState([]);

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
        } catch (err) {
            console.error('Failed to fetch manager metrics', err);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-10 animate-in fade-in duration-1000 font-outfit">
            <div className="flex justify-center">
                <div className="inline-flex p-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
                    <button 
                        onClick={() => setActiveTab('welcome')}
                        className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'welcome' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Welcome
                    </button>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Dashboard
                    </button>
                </div>
            </div>

            {activeTab === 'welcome' ? <WelcomeView data={metrics} pendingLeaves={pendingLeaves} pendingRegularizations={pendingRegularizations} notifications={notifications} /> : <DashboardView metrics={metrics} />}
        </div>
    );
};

export default ManagerDashboard;
