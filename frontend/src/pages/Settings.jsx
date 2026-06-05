import React, { useState, useEffect } from 'react';
import { 
  Shield, Check, Save, AlertCircle, 
  Users, Activity, Calendar, Building,
  Lock, Info, Clock, CalendarDays,
  ChevronRight, ArrowLeft, Zap, PieChart,
  Edit, Trash2, Plus, Edit2
} from 'lucide-react';
import api from '../utils/api';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('security'); // 'security' | 'rules' | 'holidays' | 'departments'
    const [data, setData] = useState({ roles: [], allPermissions: [] });
    const [rules, setRules] = useState({
        shift_start: '09:00',
        shift_end: '18:00',
        grace_period: 15,
        weekoffs: [],
        half_day_hours: 4,
        late_marks_for_half_day: 3,
        // Advanced
        max_late_allowed: 3,
        late_deduction_type: 'half_day',
        ot_enabled: false,
        ot_min_minutes: 60,
        ot_rate_multiplier: 1.5,
        max_missed_punches: 2
    });
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [deptForm, setDeptForm] = useState({ name: '', manager_id: '' });
    const [editingDept, setEditingDept] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); 
    const [notification, setNotification] = useState(null);
    const [resetToken, setResetToken] = useState(null);
    
    // States for security key settings
    const [deleteKeyForm, setDeleteKeyForm] = useState({ oldKey: '', newKey: '', confirmKey: '' });
    const [deleteKeyResetForm, setDeleteKeyResetForm] = useState({ newKey: '', confirmKey: '' });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('reset_delete_key_token');
        if (token) {
            setResetToken(token);
            setActiveTab('delete_security');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        const now = new Date();

        // 1. Resilient Fetch of Role Permission Matrix
        try {
            const matrixRes = await api.get('/settings/role-matrix');
            if (matrixRes && matrixRes.roles && matrixRes.roles.length > 0) {
                setData(matrixRes);
            } else {
                setData({
                    roles: [
                        { id: 3, name: 'manager', permissions: [1, 4] },
                        { id: 4, name: 'employee', permissions: [1] }
                    ],
                    allPermissions: [
                        { id: 1, name: 'VIEW_EMPLOYEES', description: 'Access to list and search all active and terminated employees.' },
                        { id: 2, name: 'EDIT_EMPLOYEES', description: 'Permission to modify employee contact, work, and bank profiles.' },
                        { id: 3, name: 'ONBOARD_EMPLOYEES', description: 'Access to register new employee profiles and trigger workflows.' },
                        { id: 4, name: 'MANAGE_LEAVES', description: 'Permission to approve or reject leave and shift balance requests.' },
                        { id: 5, name: 'GENERATE_PAYROLL', description: 'Access to run payroll cycles, declare bonuses, and audit registers.' },
                        { id: 6, name: 'VIEW_COMPLIANCE', description: 'Permission to run statutory audits and review security vaults.' }
                    ]
                });
            }
        } catch (err) {
            console.error('Failed to fetch role matrix, loading fallback:', err);
            setData({
                roles: [
                    { id: 3, name: 'manager', permissions: [1, 4] },
                    { id: 4, name: 'employee', permissions: [1] }
                ],
                allPermissions: [
                    { id: 1, name: 'VIEW_EMPLOYEES', description: 'Access to list and search all active and terminated employees.' },
                    { id: 2, name: 'EDIT_EMPLOYEES', description: 'Permission to modify employee contact, work, and bank profiles.' },
                    { id: 3, name: 'ONBOARD_EMPLOYEES', description: 'Access to register new employee profiles and trigger workflows.' },
                    { id: 4, name: 'MANAGE_LEAVES', description: 'Permission to approve or reject leave and shift balance requests.' },
                    { id: 5, name: 'GENERATE_PAYROLL', description: 'Access to run payroll cycles, declare bonuses, and audit registers.' },
                    { id: 6, name: 'VIEW_COMPLIANCE', description: 'Permission to run statutory audits and review security vaults.' }
                ]
            });
        }

        // 2. Resilient Fetch of Business Rules
        try {
            const rulesRes = await api.get('/settings/working-rules');
            if (rulesRes) {
                setRules({
                    ...rulesRes,
                    weekoffs: typeof rulesRes.weekoffs === 'string' ? JSON.parse(rulesRes.weekoffs) : (rulesRes.weekoffs || [])
                });
            }
        } catch (err) {
            console.error('Failed to fetch working rules:', err);
        }

        // 3. Resilient Fetch of Corporate Holidays
        try {
            const holidayRes = await api.get('/settings/holidays', { params: { month: now.getMonth() + 1, year: now.getFullYear() } });
            if (holidayRes && holidayRes.length > 0) {
                setHolidays(holidayRes);
            } else {
                setHolidays([
                    { id: 'hol_1', name: 'New Year Day', date: `${now.getFullYear()}-01-01` },
                    { id: 'hol_2', name: 'Republic Day', date: `${now.getFullYear()}-01-26` },
                    { id: 'hol_3', name: 'Labor Day', date: `${now.getFullYear()}-05-01` },
                    { id: 'hol_4', name: 'Independence Day', date: `${now.getFullYear()}-08-15` },
                    { id: 'hol_5', name: 'Gandhi Jayanti', date: `${now.getFullYear()}-10-02` }
                ]);
            }
        } catch (err) {
            console.error('Failed to fetch holidays, loading fallback:', err);
            setHolidays([
                { id: 'hol_1', name: 'New Year Day', date: `${now.getFullYear()}-01-01` },
                { id: 'hol_2', name: 'Republic Day', date: `${now.getFullYear()}-01-26` },
                { id: 'hol_3', name: 'Labor Day', date: `${now.getFullYear()}-05-01` },
                { id: 'hol_4', name: 'Independence Day', date: `${now.getFullYear()}-08-15` },
                { id: 'hol_5', name: 'Gandhi Jayanti', date: `${now.getFullYear()}-10-02` }
            ]);
        }

        // 4. Fetch Departments
        try {
            const deptsRes = await api.get('/org/departments');
            if (deptsRes) {
                setDepartments(deptsRes);
            }
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }

        // 5. Fetch Managers
        try {
            const managersRes = await api.get('/employees/managers');
            if (managersRes) {
                setManagers(managersRes);
            }
        } catch (err) {
            console.error('Failed to fetch managers:', err);
        }

        setLoading(false);
    };

    const handleTogglePermission = (roleId, permId) => {
        setData(prev => ({
            ...prev,
            roles: prev.roles.map(role => {
                if (role.id === roleId) {
                    const newPermissions = role.permissions.includes(permId)
                        ? role.permissions.filter(id => id !== permId)
                        : [...role.permissions, permId];
                    return { ...role, permissions: newPermissions };
                }
                return role;
            })
        }));
    };

    const saveMatrix = async (roleId) => {
        setSaving(roleId);
        const role = data.roles.find(r => r.id === roleId);
        try {
            await api.post('/settings/role-matrix', {
                roleId: role.id,
                permissionIds: role.permissions
            });
            showNotify('success', `${role.name} permissions updated`);
        } catch {
            showNotify('error', 'Update failed');
        } finally {
            setSaving(null);
        }
    };

    const saveRules = async () => {
        setSaving('rules');
        try {
            const cleanedRules = {
                ...rules,
                ot_min_minutes: rules.ot_min_minutes === '' ? 0 : (parseInt(rules.ot_min_minutes) || 0),
                ot_rate_multiplier: rules.ot_rate_multiplier === '' ? 1.5 : (parseFloat(rules.ot_rate_multiplier) || 0),
            };
            await api.post('/settings/working-rules', cleanedRules);
            showNotify('success', 'Business rules and policies deployed.');
        } catch {
            showNotify('error', 'Failed to save rules');
        } finally {
            setSaving(null);
        }
    };

    const handleAddHoliday = async () => {
        if (!newHoliday.name || !newHoliday.date) return;
        setSaving('holiday_add');
        try {
            await api.post('/settings/holidays', newHoliday);
            showNotify('success', 'Holiday added successfully');
            setNewHoliday({ name: '', date: '' });
            fetchInitialData();
        } catch {
            showNotify('error', 'Failed to add holiday');
        } finally {
            setSaving(null);
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!await window.customConfirm('Are you sure you want to remove this corporate holiday? This action is permanent.', 'Delete Holiday')) return;
        try {
            await api.delete(`/settings/holidays/${id}`);
            showNotify('success', 'Holiday removed');
            fetchInitialData();
        } catch (err) {
            if (err.message !== 'Deletion cancelled by user.') {
                window.customAlert(err.response?.data?.message || 'Failed to remove holiday');
            }
        }
    };

    const showNotify = (type, text) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUpdateDeleteKey = async (e) => {
        e.preventDefault();
        if (deleteKeyForm.newKey !== deleteKeyForm.confirmKey) {
            showNotify('error', 'New keys do not match');
            return;
        }
        if (!/^\d{6}$/.test(deleteKeyForm.newKey)) {
            showNotify('error', 'Key must be exactly 6 digits');
            return;
        }
        setSaving('delete_key_update');
        try {
            await api.post('/settings/delete-key/update', {
                oldKey: deleteKeyForm.oldKey,
                newKey: deleteKeyForm.newKey
            });
            showNotify('success', 'Delete security key updated successfully');
            setDeleteKeyForm({ oldKey: '', newKey: '', confirmKey: '' });
        } catch (err) {
            showNotify('error', err.response?.data?.message || 'Failed to update key');
        } finally {
            setSaving(null);
        }
    };

    const handleResetDeleteKeySubmit = async (e) => {
        e.preventDefault();
        if (deleteKeyResetForm.newKey !== deleteKeyResetForm.confirmKey) {
            showNotify('error', 'Keys do not match');
            return;
        }
        if (!/^\d{6}$/.test(deleteKeyResetForm.newKey)) {
            showNotify('error', 'Key must be exactly 6 digits');
            return;
        }
        setSaving('delete_key_reset');
        try {
            await api.post('/settings/delete-key/reset', {
                token: resetToken,
                newKey: deleteKeyResetForm.newKey
            });
            showNotify('success', 'Delete security key reset successfully');
            setDeleteKeyResetForm({ newKey: '', confirmKey: '' });
            setResetToken(null);
        } catch (err) {
            showNotify('error', err.response?.data?.message || 'Failed to reset key');
        } finally {
            setSaving(null);
        }
    };

    const handleRequestDeleteKeyReset = async () => {
        setSaving('delete_key_request_reset');
        try {
            const res = await api.post('/settings/delete-key/request-reset');
            showNotify('success', res.message || 'Reset link sent to administrator email');
        } catch (err) {
            showNotify('error', err.response?.data?.message || 'Failed to send reset link');
        } finally {
            setSaving(null);
        }
    };

    const toggleWeekoff = (day) => {
        setRules(prev => ({
            ...prev,
            weekoffs: prev.weekoffs.includes(day) 
              ? prev.weekoffs.filter(d => d !== day)
              : [...prev.weekoffs, day]
        }));
    };

    const handleSaveDepartment = async (e) => {
        e.preventDefault();
        if (!deptForm.name) return;
        setSaving('dept_save');
        try {
            if (editingDept) {
                await api.patch(`/org/departments/${editingDept.id}`, {
                    name: deptForm.name,
                    manager_id: deptForm.manager_id || null
                });
                showNotify('success', 'Department updated successfully');
            } else {
                await api.post('/org/departments', {
                    name: deptForm.name,
                    manager_id: deptForm.manager_id || null
                });
                showNotify('success', 'Department created successfully');
            }
            setDeptForm({ name: '', manager_id: '' });
            setEditingDept(null);
            const deptsRes = await api.get('/org/departments');
            if (deptsRes) setDepartments(deptsRes);
        } catch (err) {
            console.error(err);
            showNotify('error', 'Failed to save department');
        } finally {
            setSaving(null);
        }
    };

    const handleEditDeptClick = (dept) => {
        setEditingDept(dept);
        setDeptForm({
            name: dept.name,
            manager_id: dept.manager_id ? String(dept.manager_id) : ''
        });
    };

    const handleDeleteDept = async (id) => {
        if (!await window.customConfirm('Are you sure you want to delete this department? Employees assigned to this department will be reset to no department.', 'Delete Department')) return;
        try {
            await api.delete(`/org/departments/${id}`);
            showNotify('success', 'Department deleted');
            const deptsRes = await api.get('/org/departments');
            if (deptsRes) setDepartments(deptsRes);
        } catch (err) {
            if (err.message !== 'Deletion cancelled by user.') {
                window.customAlert(err.response?.data?.message || 'Failed to delete department');
            }
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-medium">Synchronizing protocols...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 font-outfit text-slate-900">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Configure access control, business policies, and holidays</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'security' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Access Control
                    </button>
                    <button 
                        onClick={() => setActiveTab('rules')}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'rules' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Business Rules
                    </button>
                    <button 
                        onClick={() => setActiveTab('holidays')}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'holidays' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Holidays
                    </button>
                    <button 
                        onClick={() => setActiveTab('departments')}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'departments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Departments
                    </button>
                    <button 
                        onClick={() => setActiveTab('delete_security')}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'delete_security' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Delete Protection
                    </button>
                </div>
            </header>

            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
                    notification.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
                }`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span className="text-xs font-semibold">{notification.text}</span>
                </div>
            )}

            {activeTab === 'security' ? (
                <div className="grid grid-cols-1 gap-8">
                    {data.roles.map((role) => (
                        <div key={role.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all hover:border-slate-300">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                                        <Shield size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold capitalize">{role.name} Permissions</h2>
                                        <p className="text-[11px] text-slate-500">Define what actions {role.name} can perform</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => saveMatrix(role.id)}
                                    disabled={saving === role.id}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {saving === role.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                    Save Permissions
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                                {data.allPermissions.map((perm) => (
                                    <div key={perm.id} className="flex items-start justify-between group">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide group-hover:text-indigo-600">{perm.name.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] text-slate-400 font-medium leading-normal max-w-[200px]">{perm.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleTogglePermission(role.id, perm.id)}
                                            className={`w-9 h-5 rounded-full transition-all relative shrink-0 mt-1 ${role.permissions.includes(perm.id) ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${role.permissions.includes(perm.id) ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeTab === 'rules' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Form Groups */}
                    <div className="lg:col-span-8 space-y-6">


                        {/* Overtime Policies */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Zap size={18} />
                                    </div>
                                    <h2 className="text-sm font-bold">Overtime Policy (OT)</h2>
                                </div>
                                <button onClick={() => setRules({...rules, ot_enabled: !rules.ot_enabled})}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${rules.ot_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {rules.ot_enabled ? 'ACTIVE' : 'INACTIVE'}
                                </button>
                            </div>

                            {rules.ot_enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Min. Overtime Buffer (Mins)</label>
                                        <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                                            value={rules.ot_min_minutes} onChange={(e) => setRules({...rules, ot_min_minutes: e.target.value})} />
                                        <p className="text-[9px] text-slate-400 italic mt-1">* Employee must stay at least this long for OT to trigger.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">OT Multiplier Rate</label>
                                        <input type="number" step="0.1" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                                            value={rules.ot_rate_multiplier} onChange={(e) => setRules({...rules, ot_rate_multiplier: e.target.value})} />
                                        <p className="text-[9px] text-slate-400 italic mt-1">* 1.5x means 150% of hourly base salary.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Week-offs */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                    <CalendarDays size={18} />
                                </div>
                                <h2 className="text-sm font-bold">Standard Week-offs</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                    const active = rules.weekoffs.includes(day);
                                    return (
                                        <button key={day} onClick={() => toggleWeekoff(day)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                active ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200'
                                            }`}>
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Deployment Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-xl p-6 text-white space-y-8 sticky top-6">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <PieChart size={18} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Policy Summary</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs font-medium border-b border-white/10 pb-3">
                                    <span className="text-white/50">OT Rule</span>
                                    <span className={`font-bold italic ${rules.ot_enabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {rules.ot_enabled ? `${rules.ot_rate_multiplier}x Multiplier` : 'OFF'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium border-b border-white/10 pb-3">
                                    <span className="text-white/50">Late Mark Policy</span>
                                    <span className="font-bold italic">{rules.max_late_allowed} Per Month</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium border-b border-white/10 pb-3">
                                    <span className="text-white/50">Missed Punches</span>
                                    <span className="font-bold italic">{rules.max_missed_punches} Limit</span>
                                </div>
                            </div>

                            <button onClick={saveRules} disabled={saving === 'rules'}
                                className="w-full py-4 bg-white text-slate-900 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl disabled:opacity-50">
                                {saving === 'rules' ? 'SAVING...' : 'SAVE POLICIES'}
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 flex gap-3 shadow-sm">
                            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                These rules will apply to the upcoming attendance and payroll calculation. Please make sure policies match your local labor laws.
                            </p>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'holidays' ? (
                /* Holidays View */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Calendar size={18} />
                                </div>
                                <h2 className="text-sm font-bold">Declare Holiday</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Holiday Title</label>
                                    <input 
                                        type="text" placeholder="e.g. Independence Day"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                                        value={newHoliday.name} onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                                        value={newHoliday.date} onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddHoliday}
                                    disabled={saving === 'holiday_add'}
                                    className="w-full py-3.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    {saving === 'holiday_add' ? 'ADDING...' : 'Add to Calendar'}
                                </button>
                            </div>
                        </div>
                    </div>
 
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Corporate Holiday Calendar</h2>
                                <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-400">
                                    Showing {new Date().toLocaleString('default', { month: 'long' })}
                                </span>
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                                {holidays.length > 0 ? holidays.map(h => (
                                    <div key={h.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-[9px] font-black uppercase text-indigo-500 leading-none">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-lg font-black text-slate-800 leading-none mt-1">{new Date(h.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{h.name}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">{new Date(h.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteHoliday(h.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <AlertCircle size={16} />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center space-y-3">
                                        <Calendar size={40} className="mx-auto text-slate-200" />
                                        <p className="text-sm font-bold text-slate-400">No holidays declared for this cycle.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'delete_security' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
                    {/* Left side: update key */}
                    <div className="lg:col-span-8 space-y-6">
                        {resetToken ? (
                            <div className="bg-white border-2 border-black rounded-3xl shadow-sm p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold">Reset Delete Security Key</h2>
                                        <p className="text-[11px] text-slate-500">Provide a new 6-digit passcode using your email validation token</p>
                                    </div>
                                </div>

                                <form onSubmit={handleResetDeleteKeySubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New 6-Digit PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength="6"
                                            placeholder="Enter 6-digit numeric PIN"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-black transition-all"
                                            value={deleteKeyResetForm.newKey} 
                                            onChange={(e) => setDeleteKeyResetForm({...deleteKeyResetForm, newKey: e.target.value.replace(/\D/g, '')})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirm New 6-Digit PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength="6"
                                            placeholder="Confirm 6-digit numeric PIN"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-black transition-all"
                                            value={deleteKeyResetForm.confirmKey} 
                                            onChange={(e) => setDeleteKeyResetForm({...deleteKeyResetForm, confirmKey: e.target.value.replace(/\D/g, '')})}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setResetToken(null)}
                                            className="px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Cancel Reset
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={saving === 'delete_key_reset'}
                                            className="px-6 py-3 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
                                        >
                                            {saving === 'delete_key_reset' ? 'RESETTING...' : 'Reset Security Key'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-black rounded-3xl shadow-sm p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold">
                                            {localStorage.getItem('user_role') === 'super_admin' ? 'Update Platform Delete Security Key' : 'Update Delete Security Key'}
                                        </h2>
                                        <p className="text-[11px] text-slate-500">
                                            {localStorage.getItem('user_role') === 'super_admin' 
                                                ? 'Configure the platform-wide master authorization key used by super admins'
                                                : 'Regularly changing your authorization key helps protect your payroll and employee data'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateDeleteKey} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Security PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength="6"
                                            placeholder="Enter current 6-digit PIN"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-black transition-all"
                                            value={deleteKeyForm.oldKey} 
                                            onChange={(e) => setDeleteKeyForm({...deleteKeyForm, oldKey: e.target.value.replace(/\D/g, '')})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Security PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength="6"
                                            placeholder="Enter new 6-digit PIN"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-black transition-all"
                                            value={deleteKeyForm.newKey} 
                                            onChange={(e) => setDeleteKeyForm({...deleteKeyForm, newKey: e.target.value.replace(/\D/g, '')})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirm New Security PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength="6"
                                            placeholder="Confirm new 6-digit PIN"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-black transition-all"
                                            value={deleteKeyForm.confirmKey} 
                                            onChange={(e) => setDeleteKeyForm({...deleteKeyForm, confirmKey: e.target.value.replace(/\D/g, '')})}
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={saving === 'delete_key_update'}
                                        className="py-3 px-6 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
                                    >
                                        {saving === 'delete_key_update' ? 'UPDATING...' : 'Update PIN'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Right side: status & request reset */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-6">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <Shield size={18} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Delete Protection Status</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs font-medium border-b border-white/10 pb-3">
                                    <span className="text-white/50">Security Level</span>
                                    <span className="font-bold text-emerald-400 uppercase">High</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium border-b border-white/10 pb-3">
                                    <span className="text-white/50">Pin Verification</span>
                                    <span className="font-bold text-emerald-400">ENABLED (6-Digit)</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium pb-1">
                                    <span className="text-white/50">Scope</span>
                                    <span className="font-bold text-indigo-300">
                                        {localStorage.getItem('user_role') === 'super_admin' ? 'Global Platform Deletes' : 'All Deletion Triggers'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Forgot Security Key?</h3>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                {localStorage.getItem('user_role') === 'super_admin'
                                    ? 'If you have forgotten the platform delete protection key, you can request a secure reset link. This link will be dispatched to the super administrator email.'
                                    : "If you have forgotten your company's delete protection key, you can request a secure reset link. This link will be dispatched to the registered administrator's email."
                                }
                            </p>
                            <button 
                                onClick={handleRequestDeleteKeyReset}
                                disabled={saving === 'delete_key_request_reset'}
                                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-950 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving === 'delete_key_request_reset' ? 'SENDING...' : 'Send Reset Email'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Departments View */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#00BFA5]/10 text-[#00BFA5] rounded-lg">
                                    <Building size={18} />
                                </div>
                                <h2 className="text-sm font-bold">{editingDept ? 'Edit Department' : 'Create Department'}</h2>
                            </div>
                            
                            <form onSubmit={handleSaveDepartment} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. IT Department"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none font-outfit"
                                        value={deptForm.name} 
                                        onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assign Manager</label>
                                    <select 
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none font-outfit"
                                        value={deptForm.manager_id} 
                                        onChange={(e) => setDeptForm({...deptForm, manager_id: e.target.value})}
                                    >
                                        <option value="">No Manager Assigned</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.user_id || ''}>
                                                {m.first_name} {m.last_name} ({m.designation})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    {editingDept && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setEditingDept(null);
                                                setDeptForm({ name: '', manager_id: '' });
                                            }}
                                            className="w-1/2 py-3 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all font-outfit"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button 
                                        type="submit"
                                        disabled={saving === 'dept_save'}
                                        className={`py-3 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 font-outfit ${editingDept ? 'w-1/2 bg-[#00BFA5] hover:bg-[#008F7A]' : 'w-full bg-slate-900 hover:bg-slate-800'}`}
                                    >
                                        {saving === 'dept_save' ? 'SAVING...' : editingDept ? 'Save Changes' : 'Create Department'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 font-outfit">Departments Registry</h2>
                                <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-full font-bold text-slate-400 font-outfit">
                                    Total: {departments.length}
                                </span>
                            </div>
                            
                            <div className="divide-y divide-slate-100 font-outfit">
                                {departments.length > 0 ? departments.map(d => (
                                    <div key={d.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                                <Building size={20} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{d.name}</p>
                                                <p className="text-[11px] text-slate-400 font-medium font-outfit">
                                                    Manager: {d.manager_first_name ? `${d.manager_first_name} ${d.manager_last_name}` : 'Unassigned'}
                                                </p>
                                                <div className="inline-flex px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1 font-outfit">
                                                    {d.employee_count} {d.employee_count === 1 ? 'Employee' : 'Employees'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditDeptClick(d)}
                                                className="p-2 text-slate-400 hover:text-[#00BFA5] hover:bg-slate-100 rounded-lg transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDept(d.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center space-y-3">
                                        <Building size={40} className="mx-auto text-slate-200" />
                                        <p className="text-sm font-bold text-slate-400 font-outfit">No departments configured yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <footer className="pt-8 border-t border-slate-100 flex items-center gap-3 text-slate-300">
                <Shield size={12} />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Secure Platform • Automated Policy Settings</p>
            </footer>
        </div>
    );
};

export default Settings;
