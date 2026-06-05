import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    Calendar, Plus, Clock, CheckCircle, XCircle, FileText, 
    Filter, Search, MoreVertical, Send, Briefcase, Info, 
    MoreHorizontal, Check, Globe, Users, Activity, Trash2, 
    Edit, AlertCircle, Save, ArrowRight, UserCheck, ShieldCheck, ArrowLeft, Home,
    ChevronLeft, ChevronRight, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

// Hash function to generate consistent pastel HSL colors for any shift name
const getHashColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return {
        bg: `hsl(${hue}, 80%, 94%)`,
        text: `hsl(${hue}, 90%, 30%)`,
        border: `hsl(${hue}, 50%, 85%)`
    };
};

const StatusBadge = ({ status }) => {
    const config = {
        'pending': { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock, label: 'Pending' },
        'approved': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Check, label: 'Approved' },
        'rejected': { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle, label: 'Rejected' },
        'manager_approved': { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: CheckCircle, label: 'Manager Approved' },
        'hr_approved': { color: 'bg-purple-50 text-purple-600 border-purple-100', icon: CheckCircle, label: 'HR Approved' },
        'admin_approved': { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: CheckCircle, label: 'Admin Approved' },
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border ${color}`}>
            <Icon size={12} />
            {label}
        </div>
    );
};

const LeaveModal = ({ isOpen, onClose, onSave, types }) => {
    const [formData, setFormData] = useState({
        leave_type_id: '', 
        start_date: '', 
        end_date: '', 
        start_session: 'session_1', 
        end_session: 'session_2', 
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const calculateDaysPreview = () => {
        if (!formData.start_date || !formData.end_date) return 0;
        const s = new Date(formData.start_date);
        const e = new Date(formData.end_date);
        if (s > e) return 0;
        
        const diffTime = Math.abs(e - s);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const startDeduction = formData.start_session === 'session_2' ? 0.5 : 0.0;
        const endDeduction = formData.end_session === 'session_1' ? 0.5 : 0.0;
        
        return diffDays - startDeduction - endDeduction;
    };

    const previewDays = calculateDaysPreview();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.leave_type_id) return alert('Please select a leave category.');
        if (previewDays <= 0) return alert('Invalid session selection: total leave days must be greater than 0');
        
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
            setFormData({ 
                leave_type_id: '', 
                start_date: '', 
                end_date: '', 
                start_session: 'session_1', 
                end_session: 'session_2', 
                reason: '' 
            });
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-outfit">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Apply for Leave</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Submit your absence request for approval.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><XCircle size={24} className="text-slate-300 hover:text-slate-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select Leave Category</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {types.map(t => (
                                <button
                                    key={t.id} type="button"
                                    onClick={() => setFormData({...formData, leave_type_id: t.id})}
                                    className={`p-4 rounded-2xl border text-left transition-all ${
                                        formData.leave_type_id === t.id 
                                        ? 'border-indigo-600 bg-indigo-50/30' 
                                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                                    }`}
                                >
                                    <h4 className={`text-xs font-bold ${formData.leave_type_id === t.id ? 'text-indigo-600' : 'text-slate-800'}`}>{t.name}</h4>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1">{t.available_days} Days Balance</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Start Date & Shift */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">From Date</label>
                                <input
                                    type="date" required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-all"
                                    value={formData.start_date}
                                    onChange={e => {
                                        const nextData = { ...formData, start_date: e.target.value };
                                        if (nextData.end_date === e.target.value && nextData.start_session === 'session_2') {
                                            nextData.end_session = 'session_2';
                                        }
                                        setFormData(nextData);
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Start Shift Session</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
                                    value={formData.start_session}
                                    onChange={e => {
                                        const nextData = { ...formData, start_session: e.target.value };
                                        if (formData.start_date === formData.end_date && e.target.value === 'session_2') {
                                            nextData.end_session = 'session_2';
                                        }
                                        setFormData(nextData);
                                    }}
                                >
                                    <option value="session_1">Session 1 (Morning / Full day)</option>
                                    <option value="session_2">Session 2 (Afternoon / Second half)</option>
                                </select>
                            </div>
                        </div>

                        {/* End Date & Shift */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">To Date</label>
                                <input
                                    type="date" required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-all"
                                    value={formData.end_date}
                                    onChange={e => {
                                        const nextData = { ...formData, end_date: e.target.value };
                                        if (formData.start_date === e.target.value && nextData.start_session === 'session_2') {
                                            nextData.end_session = 'session_2';
                                        }
                                        setFormData(nextData);
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">End Shift Session</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
                                    value={formData.end_session}
                                    disabled={formData.start_date === formData.end_date && formData.start_session === 'session_2'}
                                    onChange={e => setFormData({ ...formData, end_session: e.target.value })}
                                >
                                    <option value="session_1">Session 1 (Morning / First half)</option>
                                    <option value="session_2">Session 2 (Afternoon / Full day)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {formData.start_date && formData.end_date && previewDays > 0 && (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-between text-xs font-bold">
                            <span className="uppercase tracking-widest">Total Leave Duration:</span>
                            <span className="text-[15px] font-black">{previewDays} Day(s)</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reason for Absence</label>
                        <textarea
                            required rows="3"
                            placeholder="Enter detailed reason..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 transition-all resize-none"
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <div className="pt-6 flex items-center gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Discard</button>
                        <button
                            type="submit" disabled={loading}
                            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Confirm Application'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const Leaves = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'absences';

    const [leaves, setLeaves] = useState([]);
    const [balances, setBalances] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab); // absences, holidays, compliance
    const [viewMode, setViewMode] = useState('mine'); 
    const role = localStorage.getItem('user_role') || 'employee';

    // Shifts tab states
    const [shiftMonth, setShiftMonth] = useState(new Date().getMonth() + 1);
    const [shiftYear, setShiftYear] = useState(new Date().getFullYear());
    const [myRosterData, setMyRosterData] = useState(null);
    const [shiftList, setShiftList] = useState([]);
    const [shiftLoading, setShiftLoading] = useState(false);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        fetchData();
    }, [activeTab, viewMode]);

    useEffect(() => {
        if (activeTab === 'shifts') {
            fetchMyRoster();
        }
    }, [activeTab, shiftMonth, shiftYear]);

    const fetchMyRoster = async () => {
        try {
            setShiftLoading(true);
            const [rosterRes, shiftsRes] = await Promise.all([
                api.get('/attendance/my-roster', {
                    params: { month: shiftMonth, year: shiftYear }
                }),
                api.get('/attendance/shift-list')
            ]);
            setMyRosterData(rosterRes?.roster?.[0] || null);
            setShiftList(shiftsRes || []);
        } catch (err) {
            console.error('Failed to fetch personal shift roster', err);
        } finally {
            setShiftLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (shiftMonth === 1) {
            setShiftMonth(12);
            setShiftYear(shiftYear - 1);
        } else {
            setShiftMonth(shiftMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (shiftMonth === 12) {
            setShiftMonth(1);
            setShiftYear(shiftYear + 1);
        } else {
            setShiftMonth(shiftMonth + 1);
        }
    };

    const handleResetMonth = () => {
        setShiftMonth(new Date().getMonth() + 1);
        setShiftYear(new Date().getFullYear());
    };

    const getCalendarCells = () => {
        const cells = [];
        const firstDayIndex = new Date(shiftYear, shiftMonth - 1, 1).getDay();
        const totalDays = new Date(shiftYear, shiftMonth, 0).getDate();
        for (let i = 0; i < firstDayIndex; i++) {
            cells.push({ isPadding: true, key: `pad-${i}` });
        }
        for (let d = 1; d <= totalDays; d++) {
            cells.push({ isPadding: false, day: d, key: `day-${d}` });
        }
        return cells;
    };

    useEffect(() => {
        const tab = queryParams.get('tab');
        if (tab && ['absences', 'shifts', 'holidays', 'compliance'].includes(tab)) {
            setActiveTab(tab);
        }
        const action = queryParams.get('action');
        if (action === 'apply') {
            setIsModalOpen(true);
        }
    }, [location.search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leavesRes, balancesRes] = await Promise.all([
                api.get(`/leaves?view=${viewMode}`),
                api.get('/leaves/balances')
            ]);
            setLeaves(leavesRes || []);
            setBalances(balancesRes || []);

            if (activeTab === 'holidays') {
                try {
                    const holidayRes = await api.get('/settings/holidays');
                    // Ensure holiday objects have required fields
                    const formatted = (holidayRes || []).map(h => ({
                        id: h.id ?? Math.random().toString(36).substr(2, 9),
                        name: h.name ?? 'Holiday',
                        date: h.date ?? new Date().toISOString()
                    }));
                    setHolidays(formatted);
                } catch (e) {
                    console.error('Failed to load holidays', e);
                    setHolidays([]);
                }
            }
            if (activeTab === 'compliance') {
                const empRes = await api.get('/employees');
                setEmployees(empRes || []);
            }
        } catch (err) {
            console.error('Data sync failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (data) => {
        await api.post('/leaves', data);
        fetchData();
    };

    const handleAction = async (id, status) => {
        try {
            await api.patch(`/leaves/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-outfit pb-24">
            <LeaveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleApply} types={balances} />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 md:mb-12">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-white text-slate-600 rounded-xl transition-colors active:scale-95 border border-transparent hover:border-slate-200"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Streamline absences, holidays, and employee leave records.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="p-1 bg-white border border-slate-200 rounded-2xl flex shadow-sm flex-1 md:flex-initial">
                        {['absences', 'shifts', 'holidays', 'compliance'].map(tab => (
                            (tab !== 'compliance' || role !== 'employee') && (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 md:flex-initial px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab}
                                </button>
                            )
                        ))}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 md:px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 flex-1 md:flex-initial"
                    >
                        <Plus size={16} strokeWidth={3} /> Apply
                    </button>
                </div>
            </div>

            {activeTab === 'absences' && (
                <div className="space-y-6 md:space-y-8">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { label: 'Yearly Quota', value: balances.reduce((a,b) => a + (b.days_per_year || 0), 0), icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Consumed', value: balances.reduce((a,b) => a + (b.used_days || 0), 0), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'In Review', value: leaves.filter(l => l.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Liquidity', value: balances.reduce((a,b) => a + (b.available_days || 0), 0), icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-4 md:p-6 rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3 md:mb-4">
                                    <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={18} /></div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest hidden sm:inline">Metrics</span>
                                </div>
                                <h4 className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</h4>
                                <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">{stat.value} Days</h3>
                            </div>
                        ))}
                    </div>

                    {/* Records Area */}
                    <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                {role !== 'employee' && (
                                    <div className="p-1 bg-white border border-slate-100 rounded-xl flex shadow-sm">
                                        <button
                                            onClick={() => setViewMode('mine')}
                                            className={`px-3 md:px-5 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'mine' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                                        >
                                            Mine
                                        </button>
                                        <button
                                            onClick={() => setViewMode('team')}
                                            className={`px-3 md:px-5 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'team' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                                        >
                                            Team
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-24 text-center text-slate-400 text-xs font-bold animate-pulse uppercase tracking-widest">Loading records...</div>
                        ) : leaves.length === 0 ? (
                            <div className="p-24 text-center flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-2"><Info size={32} /></div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">No leave records found.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Applicant</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duration</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {leaves.map(leave => (
                                                <tr key={leave.id} className="group hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100/50">
                                                                {leave.first_name?.[0]}{leave.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-[13px] font-bold text-slate-800">{leave.first_name} {leave.last_name}</p>
                                                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter mt-0.5">{leave.leave_type_name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center"><StatusBadge status={leave.status} /></td>
                                                    <td className="px-8 py-6 text-center">
                                                        <p className="text-[13px] font-bold text-slate-800 italic">
                                                            {new Date(leave.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                            {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                                                        </p>
                                                        <div className="flex flex-col items-center mt-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">{leave.days} Day(s)</span>
                                                            {(leave.start_session === 'session_2' || leave.end_session === 'session_1') && (
                                                                <span className="text-[9px] font-black text-[#4361ee] uppercase tracking-wider mt-0.5">
                                                                    {leave.start_session === 'session_2' ? 'S2 Start' : 'S1 Start'} ➜ {leave.end_session === 'session_1' ? 'S1 End' : 'S2 End'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 max-w-xs">
                                                        <p className="text-[11px] text-slate-500 font-medium italic truncate group-hover:whitespace-normal transition-all">{leave.reason}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {viewMode === 'team' && leave.status === 'pending' ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => handleAction(leave.id, 'approved')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={14} /></button>
                                                                <button onClick={() => handleAction(leave.id, 'rejected')} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><XCircle size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <button className="p-2.5 text-slate-300 hover:text-indigo-600 transition-colors"><MoreHorizontal size={20} /></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List View */}
                                <div className="block md:hidden divide-y divide-slate-100">
                                    {leaves.map(leave => (
                                        <div key={leave.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100/50">
                                                        {leave.first_name?.[0]}{leave.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-800">{leave.first_name} {leave.last_name}</p>
                                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter mt-0.5">{leave.leave_type_name}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={leave.status} />
                                            </div>

                                            <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                                                <div className="flex justify-between w-full">
                                                    <span>
                                                        Duration: {new Date(leave.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                        {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                                                    </span>
                                                    <span className="text-slate-400">({leave.days} Day(s))</span>
                                                </div>
                                                {(leave.start_session === 'session_2' || leave.end_session === 'session_1') && (
                                                    <div className="text-[9px] font-black text-[#4361ee] uppercase tracking-wider">
                                                        Shift: {leave.start_session === 'session_2' ? 'S2' : 'S1'} Start ➜ {leave.end_session === 'session_1' ? 'S1' : 'S2'} End
                                                    </div>
                                                )}
                                            </div>

                                            {leave.reason && (
                                                <p className="text-[11px] text-slate-500 font-medium italic pl-1">"{leave.reason}"</p>
                                            )}

                                            {viewMode === 'team' && leave.status === 'pending' && (
                                                <div className="flex gap-2 pt-2">
                                                    <button 
                                                        onClick={() => handleAction(leave.id, 'rejected')} 
                                                        className="flex-1 py-2 border border-rose-100 text-rose-600 rounded-xl font-bold text-xs bg-rose-50/50 active:scale-95 transition-transform"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(leave.id, 'approved')} 
                                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs active:scale-95 transition-transform"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'holidays' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {holidays.map(h => (
                        <div key={h.id} className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform"><Globe size={80} /></div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4 md:mb-6"><Calendar size={18} /></div>
                            <h4 className="text-base md:text-lg font-bold text-slate-800 mb-1">{h.name}</h4>
                            <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'compliance' && (
                <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] shadow-sm overflow-hidden">
                    <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-xs md:text-sm font-bold text-slate-800 uppercase italic">Leave Balance Summary</h3>
                        <ShieldCheck size={20} className="text-slate-300" />
                    </div>
                    
                    {/* Desktop Compliance Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/30">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Allocated</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Utilized</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Available</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5 flex items-center gap-3">
                                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">{emp.first_name?.[0]}{emp.last_name?.[0]}</div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{emp.first_name} {emp.last_name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{emp.designation}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center text-xs font-bold text-slate-600">12.0</td>
                                        <td className="px-8 py-5 text-center text-xs font-bold text-emerald-600">2.0</td>
                                        <td className="px-8 py-5 text-center text-xs font-bold text-indigo-600">10.0</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Compliance List */}
                    <div className="block md:hidden divide-y divide-slate-100">
                        {employees.map(emp => (
                            <div key={emp.id} className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">{emp.first_name?.[0]}{emp.last_name?.[0]}</div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{emp.first_name} {emp.last_name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{emp.designation}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                                    <div className="bg-slate-50 p-2 rounded-xl">
                                        <span className="text-[9px] text-slate-400 uppercase block">Allocated</span>
                                        <span className="text-slate-700">12.0</span>
                                    </div>
                                    <div className="bg-emerald-50/50 p-2 rounded-xl">
                                        <span className="text-[9px] text-emerald-600 uppercase block">Utilized</span>
                                        <span className="text-emerald-700">2.0</span>
                                    </div>
                                    <div className="bg-indigo-50/50 p-2 rounded-xl">
                                        <span className="text-[9px] text-indigo-600 uppercase block">Available</span>
                                        <span className="text-indigo-700">10.0</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'shifts' && (
                <div className="space-y-6 md:space-y-8 animate-fade-in">
                    {/* Header Controls */}
                    <div className="bg-white p-5 rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handlePrevMonth}
                                className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider min-w-[140px] text-center">
                                {months[shiftMonth - 1]} {shiftYear}
                            </h2>
                            <button 
                                onClick={handleNextMonth}
                                className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleResetMonth}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={14} /> Current Month
                            </button>
                        </div>
                    </div>

                    {/* Shifts Legend & Details Panel */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Shift Reference & Timings</h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/50 rounded-xl pr-4">
                                <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider leading-none">Weekly Off</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">No scheduled duty</p>
                                </div>
                            </div>
                            {shiftList.map(s => {
                                const colors = getHashColor(s.name);
                                return (
                                    <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl border pr-4" style={{ backgroundColor: colors.bg + '33', borderColor: colors.border }}>
                                        <div className="w-3.5 h-3.5 rounded border" style={{ backgroundColor: colors.bg, borderColor: colors.border }} />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider leading-none" style={{ color: colors.text }}>{s.name}</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm">
                        {shiftLoading ? (
                            <div className="p-24 text-center">
                                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading calendar schedule...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-7 gap-2 md:gap-4 mb-3 border-b border-slate-50 pb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-1">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2 md:gap-4">
                                    {getCalendarCells().map((cell, idx) => {
                                        if (cell.isPadding) {
                                            return (
                                                <div key={cell.key} className="min-h-[110px] bg-slate-50/50 rounded-[20px] border border-slate-100/50" />
                                            );
                                        }

                                        const shiftName = myRosterData?.days?.[cell.day];
                                        const isOff = shiftName === 'OFF';
                                        const isToday = cell.day === new Date().getDate() && 
                                                        shiftMonth === (new Date().getMonth() + 1) && 
                                                        shiftYear === new Date().getFullYear();
                                        const matchingShift = shiftList.find(s => s.name === shiftName);

                                        let cellColors = { bg: '#ffffff', text: '#64748b', border: '#e2e8f0' };
                                        if (isOff) {
                                            cellColors = { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
                                        } else if (shiftName && shiftName !== '---') {
                                            cellColors = getHashColor(shiftName);
                                        }

                                        return (
                                            <div 
                                                key={cell.key} 
                                                className={`min-h-[110px] p-3.5 rounded-[20px] border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden group ${
                                                    isToday 
                                                    ? 'border-indigo-500 bg-indigo-50/10 shadow-sm ring-1 ring-indigo-500/20' 
                                                    : 'border-slate-100 bg-white'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-xs font-black ${isToday ? 'text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full' : 'text-slate-800'}`}>
                                                        {cell.day}
                                                        {isToday && <span className="ml-1 text-[8px] font-black uppercase tracking-wider">Today</span>}
                                                    </span>
                                                    {shiftName && shiftName !== '---' && !isOff && (
                                                        <span 
                                                            className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                                                            style={{ backgroundColor: cellColors.bg, color: cellColors.text, borderColor: cellColors.border }}
                                                        >
                                                            Shift
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="mt-4 flex-1 flex flex-col justify-end">
                                                    {isOff ? (
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Off</p>
                                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">No Duty Hours</p>
                                                        </div>
                                                    ) : shiftName && shiftName !== '---' ? (
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: cellColors.text }}>
                                                                {shiftName}
                                                            </p>
                                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                                                                {matchingShift ? `${matchingShift.start_time.slice(0, 5)} - ${matchingShift.end_time.slice(0, 5)}` : 'Standard Hours'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Unassigned</p>
                                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Contact Manager</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaves;
