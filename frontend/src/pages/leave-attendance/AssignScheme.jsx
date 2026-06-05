import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Plus, X, Info, UserCheck, Trash2, Clock, Zap,
    CheckCircle, Search, Save, AlertTriangle, RefreshCw,
    ChevronDown, Edit3, UserPlus, Settings2, CalendarCheck,
    CalendarOff, Users, Layers, Award, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const AssignScheme = () => {
    const [schemes, setSchemes] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [forbidden, setForbidden] = useState(false);

    // Selected Scheme for viewing/editing
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const defaultForm = {
        name: '',
        shift_id: '',
        weekoffs: [],
        grace_period: 15,
        max_late_allowed: 3,
        late_deduction_type: 'none',
        half_day_hours: 4.0,
        late_marks_for_half_day: 3,
        ot_enabled: false,
        ot_min_minutes: 60,
        ot_rate_multiplier: 1.5,
        max_missed_punches: 2
    };
    const [schemeForm, setSchemeForm] = useState(defaultForm);

    // Assignment state
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [schemeFilter, setSchemeFilter] = useState('All');

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setFetching(true);
            setForbidden(false);

            const results = await Promise.allSettled([
                api.get('/attendance/schemes'),
                api.get('/attendance/schemes/assignments'),
                api.get('/attendance/shift-list')
            ]);

            const [schemesRes, assignmentsRes, shiftsRes] = results;

            // Check if forbidden (403)
            const isForbidden = [schemesRes, assignmentsRes].some(
                r => r.status === 'rejected' && r.reason?.response?.status === 403
            );

            if (isForbidden) {
                setForbidden(true);
                return;
            }

            if (schemesRes.status === 'fulfilled') {
                const fetchedSchemes = schemesRes.value || [];
                setSchemes(fetchedSchemes);
                if (fetchedSchemes.length > 0) {
                    setSelectedScheme(fetchedSchemes[0]);
                }
            }

            if (assignmentsRes.status === 'fulfilled') {
                const uniqueArr = [];
                const seen = new Set();
                (assignmentsRes.value || []).forEach(emp => {
                    if (emp && emp.id && !seen.has(emp.id)) {
                        seen.add(emp.id);
                        uniqueArr.push(emp);
                    }
                });
                setAssignments(uniqueArr);
            }

            if (shiftsRes.status === 'fulfilled') {
                setShifts(shiftsRes.value || []);
            }
        } catch (err) {
            console.error('Failed to fetch scheme data', err);
        } finally {
            setFetching(false);
        }
    };

    const handleSchemeSelect = (scheme) => {
        setSelectedScheme(scheme);
        setIsEditing(false);
        setIsCreating(false);
    };

    const handleStartCreate = () => {
        setSchemeForm(defaultForm);
        setIsCreating(true);
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        if (!selectedScheme) return;
        let woffs = selectedScheme.weekoffs || [];
        if (typeof woffs === 'string') {
            try { woffs = JSON.parse(woffs); } catch { woffs = []; }
        }
        setSchemeForm({
            ...selectedScheme,
            weekoffs: woffs,
            shift_id: selectedScheme.shift_id || '',
            grace_period: selectedScheme.grace_period ?? 15,
            max_late_allowed: selectedScheme.max_late_allowed ?? 3,
            late_deduction_type: selectedScheme.late_deduction_type || 'none',
            half_day_hours: selectedScheme.half_day_hours ?? 4.0,
            late_marks_for_half_day: selectedScheme.late_marks_for_half_day ?? 3,
            ot_enabled: !!selectedScheme.ot_enabled,
            ot_min_minutes: selectedScheme.ot_min_minutes ?? 60,
            ot_rate_multiplier: selectedScheme.ot_rate_multiplier ?? 1.5,
            max_missed_punches: selectedScheme.max_missed_punches ?? 2
        });
        setIsEditing(true);
        setIsCreating(false);
    };

    const handleWeekoffToggle = (day) => {
        setSchemeForm(prev => {
            const current = prev.weekoffs;
            if (current.includes(day)) {
                return { ...prev, weekoffs: current.filter(d => d !== day) };
            } else {
                return { ...prev, weekoffs: [...current, day] };
            }
        });
    };

    const handleSaveScheme = async (e) => {
        e.preventDefault();
        if (!schemeForm.name) return alert('Scheme name is required');

        try {
            setLoading(true);
            const cleanedForm = {
                ...schemeForm,
                grace_period: schemeForm.grace_period === '' ? 0 : (parseInt(schemeForm.grace_period) || 0),
                max_late_allowed: schemeForm.max_late_allowed === '' ? 0 : (parseInt(schemeForm.max_late_allowed) || 0),
                half_day_hours: schemeForm.half_day_hours === '' ? 0 : (parseFloat(schemeForm.half_day_hours) || 0),
                late_marks_for_half_day: schemeForm.late_marks_for_half_day === '' ? 0 : (parseInt(schemeForm.late_marks_for_half_day) || 0),
                max_missed_punches: schemeForm.max_missed_punches === '' ? 0 : (parseInt(schemeForm.max_missed_punches) || 0),
                ot_min_minutes: schemeForm.ot_min_minutes === '' ? 0 : (parseInt(schemeForm.ot_min_minutes) || 0),
                ot_rate_multiplier: schemeForm.ot_rate_multiplier === '' ? 1.5 : (parseFloat(schemeForm.ot_rate_multiplier) || 0),
            };
            let response;
            if (isCreating) {
                response = await api.post('/attendance/schemes', cleanedForm);
                showToast('Scheme created successfully');
            } else {
                response = await api.put(`/attendance/schemes/${schemeForm.id}`, cleanedForm);
                showToast('Scheme updated successfully');
            }

            setIsCreating(false);
            setIsEditing(false);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to save scheme');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteScheme = async (id) => {
        if (!confirm('Are you sure you want to delete this scheme? All assigned employees will be unassigned.')) return;

        try {
            setLoading(true);
            await api.delete(`/attendance/schemes/${id}`);
            showToast('Scheme deleted successfully');
            setSelectedScheme(null);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to delete scheme');
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeToggle = (empId) => {
        if (selectedEmployees.includes(empId)) {
            setSelectedEmployees(prev => prev.filter(id => id !== empId));
        } else {
            setSelectedEmployees(prev => [...prev, empId]);
        }
    };

    const handleSelectAll = (filtered) => {
        const filteredIds = filtered.map(emp => emp.id);
        const allSelected = filteredIds.every(id => selectedEmployees.includes(id));
        if (allSelected) {
            setSelectedEmployees(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedEmployees(prev => {
                const union = new Set([...prev, ...filteredIds]);
                return Array.from(union);
            });
        }
    };

    const handleBulkAssign = async (targetSchemeId) => {
        if (selectedEmployees.length === 0) return;
        try {
            setLoading(true);
            await api.post('/attendance/schemes/assign', {
                employee_ids: selectedEmployees,
                scheme_id: targetSchemeId || null
            });
            showToast(targetSchemeId ? 'Scheme assigned successfully' : 'Scheme removed successfully');
            setSelectedEmployees([]);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to assign scheme');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setSuccessMessage(msg);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const handleExportRoster = () => {
        const dataToExport = filteredEmployees.map(emp => {
            const sch = schemes.find(s => s.id === emp.attendance_scheme_id);
            let weekoffsStr = '';
            if (sch) {
                let woffs = sch.weekoffs || [];
                if (typeof woffs === 'string') {
                    try { woffs = JSON.parse(woffs); } catch { woffs = []; }
                }
                weekoffsStr = woffs.join(', ');
            }

            return {
                "Employee Code": emp.employee_id_number,
                "Employee Name": `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                "Department": emp.department_name || '',
                "Designation": emp.designation || '',
                "Active Shift": emp.shift_name || 'General',
                "Assigned Scheme": emp.attendance_scheme_name || 'No Scheme',
                "Grace Period (Mins)": sch ? sch.grace_period : '',
                "Weekly Offs": weekoffsStr,
                "Max Late Allowed": sch ? sch.max_late_allowed : '',
                "Late Deduction Type": sch ? sch.late_deduction_type : '',
                "Half Day Hours": sch ? sch.half_day_hours : '',
                "Overtime Enabled": sch ? (sch.ot_enabled ? 'Yes' : 'No') : '',
                "OT Rate Multiplier": sch ? sch.ot_rate_multiplier : ''
            };
        });

        exportToCSV(dataToExport, "Employee_Attendance_Schemes_Roster.csv");
    };

    // Filter employees
    const filteredEmployees = useMemo(() => {
        return assignments.filter(emp => {
            const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
            const empId = (emp.employee_id_number || '').toLowerCase();
            const search = searchQuery.toLowerCase();
            const matchesSearch = fullName.includes(search) || empId.includes(search);

            const matchesDept = deptFilter === 'All' || emp.department_name === deptFilter;
            
            let matchesScheme = true;
            if (schemeFilter !== 'All') {
                if (schemeFilter === 'None') {
                    matchesScheme = !emp.attendance_scheme_id;
                } else {
                    matchesScheme = emp.attendance_scheme_id === parseInt(schemeFilter);
                }
            }

            return matchesSearch && matchesDept && matchesScheme;
        });
    }, [assignments, searchQuery, deptFilter, schemeFilter]);

    // Departments list
    const departments = useMemo(() => {
        const depts = new Set(assignments.map(a => a.department_name).filter(Boolean));
        return Array.from(depts);
    }, [assignments]);

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
                    Your account does not have the required permissions to access or configure Attendance Schemes. Please contact your system administrator.
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
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading Schemes and Assignments...</p>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <Layers size={16} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight">Attendance Schemes</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            Define working shifts, grace timings, weekoffs, and assign them in bulk
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <RefreshCw size={12} />
                        Sync Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Scheme Form or Scheme Details */}
                <div className="lg:col-span-5 space-y-6">
                    {isCreating || isEditing ? (
                        /* Scheme Form */
                        <form onSubmit={handleSaveScheme} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Settings2 size={16} className="text-indigo-600" />
                                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                        {isCreating ? 'Create Attendance Scheme' : 'Edit Scheme'}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setIsEditing(false);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                {/* Name */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheme Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={schemeForm.name}
                                        onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })}
                                        placeholder="e.g. Core Tech Scheme, Weekend Support Shift"
                                        className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all placeholder-slate-300"
                                    />
                                </div>

                                {/* Shift & Grace */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Shift</label>
                                        <div className="relative">
                                            <select
                                                value={schemeForm.shift_id}
                                                onChange={e => setSchemeForm({ ...schemeForm, shift_id: e.target.value })}
                                                className="appearance-none w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                            >
                                                <option value="">No Shift (Rules Only)</option>
                                                {shifts.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} ({s.start_time} - {s.end_time})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grace Period (Minutes)</label>
                                        <input
                                            type="number"
                                            value={schemeForm.grace_period}
                                            onChange={e => setSchemeForm({ ...schemeForm, grace_period: e.target.value })}
                                            className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Weekoffs Checklist */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Weekly Off Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {dayNames.map(day => {
                                            const isSelected = schemeForm.weekoffs.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleWeekoffToggle(day)}
                                                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                                                        isSelected
                                                            ? 'bg-slate-900 border-slate-900 text-white'
                                                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                                                    }`}
                                                >
                                                    {day.slice(0, 3)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Late rules & Penalty */}
                                <div className="p-4 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock size={12} className="text-indigo-600" />
                                        Late & Shift Violations
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Max Late Allowed / Month</label>
                                            <input
                                                type="number"
                                                value={schemeForm.max_late_allowed}
                                                onChange={e => setSchemeForm({ ...schemeForm, max_late_allowed: e.target.value })}
                                                className="w-full h-8 bg-white border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Late Deduction Type</label>
                                            <div className="relative">
                                                <select
                                                    value={schemeForm.late_deduction_type}
                                                    onChange={e => setSchemeForm({ ...schemeForm, late_deduction_type: e.target.value })}
                                                    className="appearance-none w-full h-8 bg-white border border-slate-100 rounded-lg px-3 pr-7 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                                >
                                                    <option value="none">None (Warning Only)</option>
                                                    <option value="half_day">Half Day Salary</option>
                                                    <option value="full_day">Full Day Salary</option>
                                                </select>
                                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Half-Day Threshold Hours</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={schemeForm.half_day_hours}
                                                onChange={e => setSchemeForm({ ...schemeForm, half_day_hours: e.target.value })}
                                                className="w-full h-8 bg-white border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Late Marks to Hit Half-Day</label>
                                            <input
                                                type="number"
                                                value={schemeForm.late_marks_for_half_day}
                                                onChange={e => setSchemeForm({ ...schemeForm, late_marks_for_half_day: e.target.value })}
                                                className="w-full h-8 bg-white border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Max Allowed Missed Punches</label>
                                            <input
                                                type="number"
                                                value={schemeForm.max_missed_punches}
                                                onChange={e => setSchemeForm({ ...schemeForm, max_missed_punches: e.target.value })}
                                                className="w-full h-8 bg-white border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Overtime Settings */}
                                <div className="p-4 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Zap size={12} className="text-amber-500" />
                                            Overtime calculations
                                        </h4>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={schemeForm.ot_enabled}
                                                onChange={e => setSchemeForm({ ...schemeForm, ot_enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>

                                    {schemeForm.ot_enabled && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Min Minutes for OT eligibility</label>
                                                <input
                                                    type="number"
                                                    value={schemeForm.ot_min_minutes}
                                                    onChange={e => setSchemeForm({ ...schemeForm, ot_min_minutes: e.target.value })}
                                                    className="w-full h-8 bg-white border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Multiplier (Rate per Hour)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={schemeForm.ot_rate_multiplier}
                                                    onChange={e => setSchemeForm({ ...schemeForm, ot_rate_multiplier: e.target.value })}
                                                    className="w-full h-8 bg-white border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                            >
                                <Save size={14} />
                                {loading ? 'Saving...' : 'Save Scheme Policy'}
                            </button>
                        </form>
                    ) : (
                        /* Scheme Cards List & Detail View */
                        <div className="space-y-4">
                            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Company Schemes</h3>
                                <p className="text-xl font-black leading-none">{schemes.length} Active Schemes</p>
                                <p className="text-[9px] text-slate-400 uppercase tracking-tight mt-2">
                                    Schemes bind shifts, weekoffs, and late deduction rules together. Assign to employees to override default rules.
                                </p>
                                <button
                                    onClick={handleStartCreate}
                                    className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/10"
                                >
                                    <Plus size={12} />
                                    New Scheme
                                </button>
                            </div>

                            <div className="space-y-3">
                                {schemes.map(sch => {
                                    const isSelected = selectedScheme?.id === sch.id;
                                    const baseShift = shifts.find(s => s.id === sch.shift_id);
                                    let weekoffList = sch.weekoffs || [];
                                    if (typeof weekoffList === 'string') {
                                        try { weekoffList = JSON.parse(weekoffList); } catch { weekoffList = []; }
                                    }

                                    return (
                                        <div
                                            key={sch.id}
                                            onClick={() => handleSchemeSelect(sch)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                                                isSelected
                                                    ? 'bg-white border-indigo-600 ring-1 ring-indigo-600 shadow-md'
                                                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight mb-2 ${
                                                        sch.name.toLowerCase().includes('general') 
                                                            ? 'bg-slate-100 text-slate-600'
                                                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                    }`}>
                                                        <Award size={9} />
                                                        Scheme
                                                    </span>
                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{sch.name}</h4>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSchemeSelect(sch);
                                                            handleStartEdit();
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit scheme settings"
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                    {sch.name !== 'General Attendance Scheme' && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteScheme(sch.id);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Delete scheme"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-50 text-[10px] font-medium text-slate-500">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Base Shift</span>
                                                    <span className="text-slate-700 font-bold uppercase">{baseShift ? `${baseShift.name}` : 'No shift assigned'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Grace Period</span>
                                                    <span className="text-slate-700 font-bold">{sch.grace_period} Minutes</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Week-offs</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {weekoffList.length > 0 ? (
                                                            weekoffList.map((w, idx) => (
                                                                <span key={idx} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">
                                                                    {w.slice(0,3)}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 italic text-[9px]">None configured</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {schemes.length === 0 && (
                                    <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl opacity-50">
                                        <Layers size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No attendance schemes found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Employee assignments table */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[600px]">
                        {/* Title and Filters */}
                        <div className="p-4 border-b border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-indigo-600" />
                                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Employee Scheme Roster</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleExportRoster}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                    >
                                        <Download size={11} /> Export CSV
                                    </button>
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                                        {filteredEmployees.length} matching
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or employee ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 h-9 text-[10px] font-bold outline-none focus:border-indigo-300 transition-all"
                                    />
                                </div>

                                {/* Dept Filter */}
                                <div className="relative">
                                    <select
                                        value={deptFilter}
                                        onChange={e => setDeptFilter(e.target.value)}
                                        className="appearance-none bg-slate-50 border border-slate-100 rounded-xl pl-3 pr-7 h-9 text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-300"
                                    >
                                        <option value="All">All Departments</option>
                                        {departments.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>

                                {/* Scheme Filter */}
                                <div className="relative">
                                    <select
                                        value={schemeFilter}
                                        onChange={e => setSchemeFilter(e.target.value)}
                                        className="appearance-none bg-slate-50 border border-slate-100 rounded-xl pl-3 pr-7 h-9 text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-300"
                                    >
                                        <option value="All">All Schemes</option>
                                        <option value="None">Unassigned</option>
                                        {schemes.map(sch => (
                                            <option key={sch.id} value={sch.id}>{sch.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* List Grid */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.includes(emp.id))}
                                                onChange={() => handleSelectAll(filteredEmployees)}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Shift</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Scheme</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredEmployees.map(emp => {
                                        const isSelected = selectedEmployees.includes(emp.id);
                                        return (
                                            <tr
                                                key={emp.id}
                                                className={`hover:bg-slate-50/50 transition-all cursor-pointer ${
                                                    isSelected ? 'bg-slate-50/30' : ''
                                                }`}
                                                onClick={() => handleEmployeeToggle(emp.id)}
                                            >
                                                <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleEmployeeToggle(emp.id)}
                                                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-7 h-7 rounded-lg text-[9px] font-black uppercase flex items-center justify-center ${
                                                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-700 uppercase leading-none">
                                                                {emp.first_name} {emp.last_name}
                                                            </p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                                                #{emp.employee_id_number} • {emp.designation || 'Staff'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                        {emp.department_name || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-[8px] font-black text-slate-600 uppercase tracking-tight">
                                                        {emp.shift_name || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {emp.attendance_scheme_id ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <CheckCircle size={8} />
                                                            {emp.attendance_scheme_name}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter bg-slate-50 text-slate-400 border border-slate-100">
                                                            No Scheme
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center opacity-40">
                                                <Users size={32} className="mx-auto mb-2 text-slate-300" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No employees found matching filter criteria</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Drawer */}
            <AnimatePresence>
                {selectedEmployees.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-white p-4 z-40 shadow-2xl flex items-center justify-between max-w-[100vw]"
                    >
                        <div className="max-w-[1400px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700/50">
                                    <UserPlus size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk Scheme Assignment</p>
                                    <p className="text-sm font-black mt-0.5">{selectedEmployees.length} employee(s) selected</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => setSelectedEmployees([])}
                                    className="px-4 py-2 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => handleBulkAssign(null)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-rose-950 text-rose-300 border border-rose-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-900 transition-all disabled:opacity-50"
                                >
                                    Clear Scheme
                                </button>

                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:inline">Assign To:</span>
                                    <div className="relative">
                                        <select
                                            onChange={e => {
                                                if (e.target.value) {
                                                    handleBulkAssign(parseInt(e.target.value));
                                                    e.target.value = ''; // reset dropdown
                                                }
                                            }}
                                            disabled={loading}
                                            className="appearance-none bg-slate-800 border border-slate-700 text-white rounded-xl px-4 pr-9 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="">Select Target Scheme...</option>
                                            {schemes.map(sch => (
                                                <option key={sch.id} value={sch.id}>{sch.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Toast */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50 border border-slate-800"
                    >
                        <CheckCircle size={20} className="text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            ` }} />
        </div>
    );
};

export default AssignScheme;
