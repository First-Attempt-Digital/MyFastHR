import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Users, CheckCircle, Search, Save, Shield,
    Plus, X, Info, UserCheck, Trash2, Clock, Zap, CalendarOff,
    CalendarCheck, ChevronDown, AlertTriangle, RefreshCw, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const WeekendOverride = () => {
    const [employees, setEmployees] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [weekoffs, setWeekoffs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'create'
    const [forbidden, setForbidden] = useState(false);

    // Create form state
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOutlet, setSelectedOutlet] = useState('all');
    const [overrideForm, setOverrideForm] = useState({
        override_date: '',
        override_type: 'working', // 'working' = weekoff→working, 'off' = working→off
        reason: ''
    });

    // Filters
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, [filterMonth, filterYear]);

    const fetchData = async () => {
        try {
            setFetching(true);
            setForbidden(false);
            
            const results = await Promise.allSettled([
                api.get('/attendance/weekend-overrides/employees'),
                api.get(`/attendance/weekend-overrides?month=${filterMonth}&year=${filterYear}`),
                api.get('/settings/working-rules')
            ]);

            const [empRes, overrideRes, rulesRes] = results;

            // Check if critical operations failed with a 403 permission error
            const isForbidden = [empRes, overrideRes].some(
                r => r.status === 'rejected' && r.reason?.response?.status === 403
            );

            if (isForbidden) {
                setForbidden(true);
                return;
            }

            if (empRes.status === 'fulfilled') {
                setEmployees(empRes.value || []);
            }
            if (overrideRes.status === 'fulfilled') {
                setOverrides(overrideRes.value || []);
            }
            if (rulesRes.status === 'fulfilled') {
                let woffs = rulesRes.value?.weekoffs || [];
                if (typeof woffs === 'string') {
                    try { woffs = JSON.parse(woffs); } catch { woffs = []; }
                }
                setWeekoffs(woffs);
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setFetching(false);
        }
    };

    const handleEmployeeToggle = (emp) => {
        if (selectedEmployees.some(e => e.id === emp.id)) {
            setSelectedEmployees(prev => prev.filter(e => e.id !== emp.id));
        } else {
            setSelectedEmployees(prev => [...prev, emp]);
        }
    };

    const handleCreate = async () => {
        if (!overrideForm.override_date) return alert('Please select a date');
        if (selectedEmployees.length === 0) return alert('Please select at least one employee');

        try {
            setLoading(true);
            await api.post('/attendance/weekend-overrides', {
                employee_ids: selectedEmployees.map(e => e.id),
                override_date: overrideForm.override_date,
                override_type: overrideForm.override_type,
                reason: overrideForm.reason
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setSelectedEmployees([]);
            setOverrideForm({ override_date: '', override_type: 'working', reason: '' });
            setViewMode('list');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to create override');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this weekend override?')) return;
        try {
            await api.delete(`/attendance/weekend-overrides/${id}`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const handleExport = () => {
        if (!overrides || overrides.length === 0) {
            alert("No data available to export.");
            return;
        }
        const dataToExport = overrides.map(o => ({
            "Employee Code": o.employee_id_number || '—',
            "Employee Name": `${o.first_name || ''} ${o.last_name || ''}`.trim(),
            "Override Date": formatDate(o.override_date),
            "Day Name": getDayName(o.override_date),
            "Override Type": o.override_type === 'working' ? 'Working Day' : 'Day Off',
            "Reason": o.reason || '—'
        }));
        exportToCSV(dataToExport, `Weekend_Overrides_${months[filterMonth - 1]}_${filterYear}.csv`);
    };

    const uniqueLocations = useMemo(() => {
        return ['all', ...[...new Set(employees.map(e => e.office_location).filter(Boolean))].sort()];
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
            const empId = (emp.employee_id_number || '').toLowerCase();
            const search = searchQuery.toLowerCase();
            const matchesSearch = fullName.includes(search) || empId.includes(search);
            const matchesOutlet = selectedOutlet === 'all' || emp.office_location === selectedOutlet;
            return matchesSearch && matchesOutlet;
        });
    }, [employees, searchQuery, selectedOutlet]);

    const filteredOverrides = useMemo(() => {
        return overrides.filter(o => {
            const matchesOutlet = selectedOutlet === 'all' || o.office_location === selectedOutlet;
            return matchesOutlet;
        });
    }, [overrides, selectedOutlet]);

    const getDayName = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return dayNames[d.getDay()];
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Stats
    const workingOverrides = overrides.filter(o => o.override_type === 'working').length;
    const offOverrides = overrides.filter(o => o.override_type === 'off').length;
    const uniqueEmployees = new Set(overrides.map(o => o.employee_id)).size;

    if (forbidden) return (
        <div className="max-w-[1200px] mx-auto p-4 min-h-[70vh] flex items-center justify-center animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 shadow-2xl text-center space-y-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/5">
                    <Shield size={32} className="stroke-[1.5]" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Access Restricted</h2>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Administrator or Manager Only</p>
                </div>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                    Your account does not have the required permissions to access or manage Weekend Overrides. Please contact your system administrator to request access.
                </p>
                
                <div className="pt-2">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-slate-950/10"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );

    if (fetching) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading Weekend Overrides...</p>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto p-4 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <CalendarOff size={16} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight">Weekend Override</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            Override weekly-off rules for specific employees & dates
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {viewMode === 'list' ? (
                        <button
                            onClick={() => setViewMode('create')}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Plus size={14} />
                            New Override
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setViewMode('list');
                                setSelectedEmployees([]);
                                setOverrideForm({ override_date: '', override_type: 'working', reason: '' });
                            }}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            <X size={14} />
                            Back to Overview
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="space-y-6">
                    {/* Company Weekoff Policy Banner */}
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-5 rounded-2xl border border-indigo-100/50 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/30">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Company Weekoff Policy</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {weekoffs.length > 0 ? weekoffs.map((day, i) => (
                                            <span key={i} className="px-3 py-1 bg-white rounded-lg text-xs font-black text-indigo-600 uppercase border border-indigo-100/50 shadow-sm">
                                                {day}
                                            </span>
                                        )) : (
                                            <span className="text-xs font-bold text-indigo-400 italic">No weekoffs configured in Working Rules</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Override Count</p>
                                <p className="text-2xl font-black text-indigo-600">{overrides.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Overrides', value: overrides.length, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Working Days', value: workingOverrides, icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Weekoff → Working' },
                            { label: 'Off Days', value: offOverrides, icon: CalendarOff, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Working → Off' },
                            { label: 'Employees Affected', value: uniqueEmployees, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                    <stat.icon size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                    <p className="text-lg font-black text-slate-800 leading-none">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    value={selectedOutlet}
                                    onChange={(e) => setSelectedOutlet(e.target.value)}
                                    className="appearance-none bg-slate-50 border border-slate-100 rounded-lg pl-3 pr-7 py-2 text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-300"
                                >
                                    {uniqueLocations.map(loc => (
                                        <option key={loc} value={loc}>
                                            {loc === 'all' ? 'All Outlets' : loc}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                                    className="appearance-none bg-slate-50 border border-slate-100 rounded-lg pl-3 pr-7 py-2 text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-300"
                                >
                                    {months.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                                    className="appearance-none bg-slate-50 border border-slate-100 rounded-lg pl-3 pr-7 py-2 text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-300"
                                >
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                    <option value={2027}>2027</option>
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>

                    {/* Overrides Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-600" />
                                Active Overrides — {months[filterMonth - 1]} {filterYear}
                            </h3>
                            <div className="flex items-center gap-3">
                                {overrides.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                                    >
                                        <Download size={11} /> Export CSV
                                    </button>
                                )}
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{overrides.length} records</span>
                            </div>
                        </div>

                        {overrides.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                    <CalendarOff size={32} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No overrides for this period</p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">Click "New Override" to create one</p>
                            </div>
                        ) : (
                            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-slate-50 z-10">
                                        <tr>
                                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Day</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredOverrides.map(o => (
                                            <tr key={o.id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[9px] font-black uppercase">
                                                            {(o.first_name?.[0] || '')}{(o.last_name?.[0] || '')}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-700 uppercase leading-none">
                                                                {o.first_name} {o.last_name}
                                                            </p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                #{o.employee_id_number || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="text-[10px] font-bold text-slate-600">{formatDate(o.override_date)}</span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">{getDayName(o.override_date)}</span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                                        o.override_type === 'working'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                        {o.override_type === 'working' ? <CalendarCheck size={10} /> : <CalendarOff size={10} />}
                                                        {o.override_type === 'working' ? 'Working Day' : 'Day Off'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="text-[10px] text-slate-500 font-medium italic truncate block max-w-[200px]">
                                                        {o.reason || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => handleDelete(o.id)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Create Mode */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in slide-in-from-bottom-4 duration-500">
                    {/* Override Configuration */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" />
                                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Override Configuration</h3>
                                </div>
                                <button
                                    onClick={handleCreate}
                                    disabled={loading}
                                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Wait...' : 'Apply Override'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Override Type */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setOverrideForm({ ...overrideForm, override_type: 'working' })}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${
                                                overrideForm.override_type === 'working'
                                                    ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
                                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <CalendarCheck size={14} className={overrideForm.override_type === 'working' ? 'text-emerald-600' : 'text-slate-400'} />
                                                <span className={`text-[10px] font-black uppercase ${overrideForm.override_type === 'working' ? 'text-emerald-700' : 'text-slate-600'}`}>
                                                    Make Working
                                                </span>
                                            </div>
                                            <p className={`text-[8px] font-bold uppercase tracking-tighter ${overrideForm.override_type === 'working' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                Weekoff → Working Day
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOverrideForm({ ...overrideForm, override_type: 'off' })}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${
                                                overrideForm.override_type === 'off'
                                                    ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200'
                                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <CalendarOff size={14} className={overrideForm.override_type === 'off' ? 'text-amber-600' : 'text-slate-400'} />
                                                <span className={`text-[10px] font-black uppercase ${overrideForm.override_type === 'off' ? 'text-amber-700' : 'text-slate-600'}`}>
                                                    Give Day Off
                                                </span>
                                            </div>
                                            <p className={`text-[8px] font-bold uppercase tracking-tighter ${overrideForm.override_type === 'off' ? 'text-amber-500' : 'text-slate-400'}`}>
                                                Working Day → Off
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override Date</label>
                                    <input
                                        type="date"
                                        value={overrideForm.override_date}
                                        onChange={(e) => setOverrideForm({ ...overrideForm, override_date: e.target.value })}
                                        className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {overrideForm.override_date && (
                                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter ml-1">
                                            {getDayName(overrideForm.override_date)} — {formatDate(overrideForm.override_date)}
                                        </p>
                                    )}
                                </div>

                                {/* Reason */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason (Optional)</label>
                                    <textarea
                                        value={overrideForm.reason}
                                        onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                        placeholder="e.g. Special project deadline, office event..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all resize-none placeholder-slate-300"
                                    />
                                </div>

                                {/* Info Box */}
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Note</p>
                                            <p className="text-[10px] text-amber-700 leading-tight">
                                                {overrideForm.override_type === 'working'
                                                    ? 'This will mark the selected date as a working day for chosen employees, even if it falls on their regular weekoff.'
                                                    : 'This will give the selected employees a day off on the chosen date, even if it is normally a working day.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Selected Count */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {selectedEmployees.length} employee(s) selected
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee Selection */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[600px]">
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4 flex-wrap">
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Select Employees</h3>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <select
                                        value={selectedOutlet}
                                        onChange={(e) => setSelectedOutlet(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:border-indigo-300"
                                    >
                                        {uniqueLocations.map(loc => (
                                            <option key={loc} value={loc}>
                                                {loc === 'all' ? 'All Outlets' : loc}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="relative">
                                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-bold outline-none focus:border-indigo-300 w-48"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setSelectedEmployees(filteredEmployees)}
                                        className="text-[9px] font-black text-indigo-600 uppercase tracking-widest"
                                    >
                                        Select All
                                    </button>
                                    <div className="w-px h-3 bg-slate-200" />
                                    <button
                                        onClick={() => setSelectedEmployees([])}
                                        className="text-[9px] font-black text-rose-500 uppercase tracking-widest"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="space-y-2">
                                    {filteredEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            onClick={() => handleEmployeeToggle(emp)}
                                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                selectedEmployees.some(e => e.id === emp.id)
                                                    ? 'bg-slate-900 border-slate-900 text-white'
                                                    : 'bg-white border-slate-50 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${
                                                    selectedEmployees.some(e => e.id === emp.id) ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {(emp.first_name?.[0] || '')}{(emp.last_name?.[0] || '')}
                                                </div>
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase ${selectedEmployees.some(e => e.id === emp.id) ? 'text-white' : 'text-slate-700'}`}>
                                                        {emp.first_name} {emp.last_name}
                                                    </p>
                                                    <p className={`text-[8px] font-bold uppercase tracking-tighter ${
                                                        selectedEmployees.some(e => e.id === emp.id) ? 'text-slate-400' : 'text-slate-400'
                                                    }`}>
                                                        {emp.designation || emp.employee_id_number || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedEmployees.some(e => e.id === emp.id) && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <div className="py-10 text-center opacity-40">
                                            <Users size={24} className="mx-auto mb-2" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">No employees found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50"
                    >
                        <CheckCircle size={20} className="text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-widest">Weekend override applied successfully</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            ` }} />
        </div>
    );
};

export default WeekendOverride;
