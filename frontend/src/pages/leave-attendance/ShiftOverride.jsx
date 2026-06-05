import React, { useState, useEffect } from 'react';
import { 
    Clock, Users, CheckCircle, Search, Save, Shield, 
    Plus, X, Info, UserCheck, Trash2, Calendar, Layout, Zap, Download, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';
import DeleteSecurityModal from '../../components/common/DeleteSecurityModal';

const ShiftManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'assign', 'override', 'entry_requests'
    const [editingShiftId, setEditingShiftId] = useState(null);
    const [assignMode, setAssignMode] = useState('single'); // 'single', 'multiple'
    const [selectedShiftId, setSelectedShiftId] = useState('');
    
    // Delete Protection States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [overrideConfig, setOverrideConfig] = useState({
        from_date: new Date().toISOString().split('T')[0],
        to_date: ''
    });

    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOutlet, setSelectedOutlet] = useState('all');

    const uniqueLocations = ['all', ...[...new Set(employees.map(e => e.office_location).filter(Boolean))].sort()];
    const [shiftConfig, setShiftConfig] = useState({
        name: '',
        start_time: '09:00',
        end_time: '18:00',
        grace_period: 15,
        grace_count_limit: 3,
        from_date: new Date().toISOString().split('T')[0],
        to_date: '',
        is_night_shift: false,
        is_flexi: false,
        min_hours: 8.0
    });

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setFetching(true);
            const [empRes, shiftRes] = await Promise.all([
                api.get('/attendance/eligible-employees'),
                api.get('/attendance/shift-list')
            ]);
            setEmployees(empRes || []);
            setShifts(shiftRes || []);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setFetching(false);
        }
    };

    const handleEmployeeToggle = (emp) => {
        // In override mode, we can pick any employee. In assign mode, only unassigned.
        if (viewMode === 'assign' && emp.assigned_shift) {
            alert(`${emp.first_name} already has a shift assigned. Use "Override Shift" mode to change existing assignments.`);
            return;
        }
        
        if (selectedEmployees.some(item => item.id === emp.id)) {
            setSelectedEmployees(prev => prev.filter(item => item.id !== emp.id));
        } else {
            setSelectedEmployees(prev => [...prev, emp]);
        }
    };

    const handleOverrideExecute = async () => {
        if (!selectedShiftId) return alert('Select a shift protocol');
        if (selectedEmployees.length === 0) return alert('Select personnel');

        try {
            setLoading(true);
            await api.post('/attendance/shift-override', {
                employee_ids: selectedEmployees.map(e => e.id),
                shift_id: selectedShiftId,
                from_date: overrideConfig.from_date,
                to_date: overrideConfig.to_date || null
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setSelectedEmployees([]);
            setSelectedShiftId('');
            setViewMode('list');
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditShift = (shift, e) => {
        if (e) e.stopPropagation();
        setEditingShiftId(shift.id);
        setShiftConfig({
            name: shift.name || '',
            start_time: shift.start_time || '09:00',
            end_time: shift.end_time || '18:00',
            grace_period: shift.grace_period !== undefined ? shift.grace_period : 15,
            grace_count_limit: shift.grace_count_limit !== undefined ? shift.grace_count_limit : 3,
            from_date: new Date().toISOString().split('T')[0],
            to_date: '',
            is_night_shift: !!shift.is_night_shift,
            is_flexi: !!shift.is_flexi,
            min_hours: shift.min_hours || 8.0
        });
        setViewMode('assign');
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!shiftConfig.name) return alert('Shift Name is required');
        if (!editingShiftId && selectedEmployees.length === 0) {
            return alert('Please select employees to assign this shift to.');
        }

        try {
            setLoading(true);
            if (editingShiftId) {
                // Update existing shift parameters
                await api.put(`/attendance/shift-list/${editingShiftId}`, {
                    name: shiftConfig.name,
                    start_time: shiftConfig.is_flexi ? '00:00' : shiftConfig.start_time,
                    end_time: shiftConfig.is_flexi ? '23:59' : shiftConfig.end_time,
                    grace_period: shiftConfig.is_flexi ? 0 : shiftConfig.grace_period,
                    grace_count_limit: shiftConfig.is_flexi ? 0 : shiftConfig.grace_count_limit,
                    is_night_shift: shiftConfig.is_flexi ? false : shiftConfig.is_night_shift,
                    is_flexi: shiftConfig.is_flexi,
                    min_hours: shiftConfig.is_flexi ? shiftConfig.min_hours : 8.0
                });

                // Assign to employees if any are selected during edit
                if (selectedEmployees.length > 0) {
                    await api.post('/attendance/shift-override', {
                        employee_ids: selectedEmployees.map(e => e.id),
                        shift_id: editingShiftId,
                        from_date: shiftConfig.from_date,
                        to_date: shiftConfig.to_date || null
                    });
                }

                alert('Shift updated successfully!');
            } else {
                // Create new shift protocol
                const shiftRes = await api.post('/attendance/shift-list', {
                    name: shiftConfig.name,
                    start_time: shiftConfig.is_flexi ? '00:00' : shiftConfig.start_time,
                    end_time: shiftConfig.is_flexi ? '23:59' : shiftConfig.end_time,
                    grace_period: shiftConfig.is_flexi ? 0 : shiftConfig.grace_period,
                    grace_count_limit: shiftConfig.is_flexi ? 0 : shiftConfig.grace_count_limit,
                    is_night_shift: shiftConfig.is_flexi ? false : shiftConfig.is_night_shift,
                    is_flexi: shiftConfig.is_flexi,
                    min_hours: shiftConfig.is_flexi ? shiftConfig.min_hours : 8.0
                });

                await api.post('/attendance/shift-override', {
                    employee_ids: selectedEmployees.map(e => e.id),
                    shift_id: shiftRes.id,
                    from_date: shiftConfig.from_date,
                    to_date: shiftConfig.to_date || null
                });
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setSelectedEmployees([]);
            setEditingShiftId(null);
            setShiftConfig({
                name: '', start_time: '09:00', end_time: '18:00', 
                grace_period: 15, grace_count_limit: 3, 
                from_date: new Date().toISOString().split('T')[0],
                to_date: '', is_night_shift: false,
                is_flexi: false, min_hours: 8.0
            });
            setViewMode('list');
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteShift = async (id, e) => {
        if (e) e.stopPropagation();
        if (id === 1 || String(id) === '1') {
            alert('Cannot delete the primary General Shift.');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this shift? Active employees will default back to General Shift timings.')) {
            return;
        }
        try {
            setLoading(true);
            await api.delete(`/attendance/shift-list/${id}`);
            fetchData();
            alert('Shift deleted successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete shift');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
        const search = searchQuery.toLowerCase();
        const empId = (emp.employee_id_number || '').toLowerCase();
        const matchesSearch = fullName.includes(search) || empId.includes(search);
        const matchesOutlet = selectedOutlet === 'all' || emp.office_location === selectedOutlet;
        return matchesSearch && matchesOutlet;
    });

    const handleExport = () => {
        if (!filteredEmployees || filteredEmployees.length === 0) {
            alert("No data available to export.");
            return;
        }
        const dataToExport = filteredEmployees.map(emp => ({
            "Employee Code": emp.employee_id_number,
            "Employee Name": `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
            "Assigned Shift": emp.assigned_shift || 'Unassigned',
            "Status": emp.assigned_shift ? 'Active' : 'Inactive'
        }));
        exportToCSV(dataToExport, "Personnel_Shift_Assignments.csv");
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading shifts...</p>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto p-4 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <Clock size={16} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight">Shift Management</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Shift Guidelines & Assignments</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {viewMode === 'list' ? (
                        <>
                            <button 
                                onClick={() => setViewMode('override')}
                                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                            >
                                <Zap size={14} />
                                Override Shift
                            </button>
                            <button 
                                onClick={() => setViewMode('assign')}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                <Plus size={14} />
                                Add New Shift
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => {
                                setViewMode('list');
                                setSelectedEmployees([]);
                                setSelectedShiftId('');
                                setEditingShiftId(null);
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
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Staff', value: employees.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Active Shifts', value: shifts.length, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Assigned', value: employees.filter(e => e.assigned_shift).length, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Unassigned', value: employees.filter(e => !e.assigned_shift).length, icon: Info, color: 'text-rose-600', bg: 'bg-rose-50' }
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

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Defined Shifts Panel */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-full">
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Layout size={14} className="text-indigo-600" />
                                    Active Protocols
                                </h3>
                                <div className="space-y-3">
                                    {shifts.length === 0 ? (
                                        <div className="py-10 text-center opacity-40">
                                            <Clock size={24} className="mx-auto mb-2" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">No Shifts Found</p>
                                        </div>
                                    ) : (
                                        shifts.map(shift => (
                                            <div key={shift.id} className="p-3 rounded-xl border border-slate-50 bg-slate-50/50 group hover:border-indigo-100 transition-all">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-slate-700 uppercase">{shift.name}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[8px] font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-50">{shift.is_flexi ? 'Flexi' : shift.start_time}</span>
                                                        <button 
                                                            onClick={(e) => handleEditShift(shift, e)}
                                                            className="text-slate-350 hover:text-indigo-600 transition-colors p-0.5 rounded hover:bg-slate-100"
                                                            title="Edit Shift"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        {shift.id !== 1 && shift.id !== '1' && (
                                                            <button 
                                                                onClick={(e) => handleDeleteShift(shift.id, e)}
                                                                className="text-slate-350 hover:text-rose-600 transition-colors p-0.5 rounded hover:bg-slate-100"
                                                                title="Delete Shift"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {shift.is_flexi ? (
                                                        <span>Min Hours: {shift.min_hours}h</span>
                                                    ) : (
                                                        <>
                                                            <span>Grace: {shift.grace_period}m</span>
                                                            <span>•</span>
                                                            <span>Limit: {shift.grace_count_limit}/mo</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Personnel Status Matrix */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
                                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Personnel Status</h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleExport}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                                        >
                                            <Download size={11} /> Export CSV
                                        </button>
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
                                                placeholder="Quick filter..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-bold outline-none focus:border-indigo-300 w-48"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-slate-50 z-10">
                                            <tr>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Shift</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredEmployees.map(emp => (
                                                <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[9px] font-black uppercase">
                                                                {(emp.first_name?.[0] || '')}{(emp.last_name?.[0] || '')}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-700 uppercase leading-none">{emp.first_name} {emp.last_name}</p>
                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">#{emp.employee_id_number}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {emp.assigned_shift ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-600 uppercase leading-none">{emp.assigned_shift}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-slate-300 uppercase italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                                            emp.assigned_shift ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                            {emp.assigned_shift ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'assign' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in slide-in-from-bottom-4 duration-500 pb-20">
                    {/* Assignment Form */}
                    <div className="lg:col-span-12 space-y-4">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-8 space-y-8">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Plus size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                                            {editingShiftId ? 'Edit Shift Protocol' : 'Add New Shift'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                            {editingShiftId ? 'Update timing details and rules for this shift' : 'Define timing protocols and session margins'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                >
                                    {loading ? 'Processing...' : <><Save size={14} /> Save Shift Protocol</>}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Standard General"
                                        value={shiftConfig.name}
                                        onChange={(e) => setShiftConfig({...shiftConfig, name: e.target.value})}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Code</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. SG-01"
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Zone</label>
                                    <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none">
                                        <option>Select Time Zone</option>
                                        <option>(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculate Shift Hours based on:</p>
                                <div className="flex gap-8">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="radio" name="calc_mode" defaultChecked className="accent-indigo-600" />
                                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Sum of Session's In and Out time.</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="radio" name="calc_mode" className="accent-indigo-600" />
                                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Duration between Shift Start Time and End Time.</span>
                                    </label>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-100">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase">
                                            <th className="px-6 py-4 text-[10px] font-black tracking-widest">Session</th>
                                            <th className="px-4 py-4 text-[10px] font-black tracking-widest">In Time</th>
                                            <th className="px-4 py-4 text-[10px] font-black tracking-widest">Out Time</th>
                                            <th className="px-4 py-4 text-[10px] font-black tracking-widest">Grace In Time</th>
                                            <th className="px-4 py-4 text-[10px] font-black tracking-widest">Grace Out Time</th>
                                            <th className="px-4 py-4 text-[10px] font-black tracking-widest">In Margin</th>
                                            <th className="px-4 py-4 text-[10px] font-black tracking-widest">Out Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <tr>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">Session 1</td>
                                            <td className="px-2 py-4">
                                                <input 
                                                    type="time" 
                                                    value={shiftConfig.is_flexi ? '00:00' : shiftConfig.start_time} 
                                                    disabled={shiftConfig.is_flexi}
                                                    onChange={(e) => setShiftConfig({...shiftConfig, start_time: e.target.value})}
                                                    className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" 
                                                />
                                            </td>
                                            <td className="px-2 py-4">
                                                <input 
                                                    type="time" 
                                                    value={shiftConfig.is_flexi ? '23:59' : shiftConfig.end_time} 
                                                    disabled={shiftConfig.is_flexi}
                                                    onChange={(e) => setShiftConfig({...shiftConfig, end_time: e.target.value})}
                                                    className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" 
                                                />
                                            </td>
                                            <td className="px-2 py-4">
                                                <input 
                                                    type="time" 
                                                    value={shiftConfig.is_flexi ? '00:00' : `00:${String(shiftConfig.grace_period).padStart(2, '0')}`} 
                                                    disabled={shiftConfig.is_flexi}
                                                    onChange={(e) => {
                                                        const parts = e.target.value.split(':');
                                                        const minutes = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
                                                        setShiftConfig({...shiftConfig, grace_period: minutes});
                                                    }}
                                                    className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" 
                                                />
                                            </td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">Session 2</td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                            <td className="px-2 py-4"><input type="time" defaultValue="00:00" className="h-10 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold outline-none focus:border-indigo-500 disabled:opacity-50" disabled={shiftConfig.is_flexi} /></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-2">Minimum working hours to mark present:</h4>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-slate-500 w-24">For Half day</span>
                                        <div className="flex items-center gap-2">
                                            <input type="text" defaultValue="04:00" className="w-20 h-10 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-black" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase">hours</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-slate-500 w-24">For Full day</span>
                                        <div className="flex items-center gap-2">
                                            <input type="text" defaultValue="08:00" className="w-20 h-10 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-black" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase">hours</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-2">Advanced Config:</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grace Cap / Mo</label>
                                            <input 
                                                type="number" 
                                                value={shiftConfig.grace_count_limit} 
                                                disabled={shiftConfig.is_flexi}
                                                onChange={(e) => setShiftConfig({...shiftConfig, grace_count_limit: parseInt(e.target.value) || 0})}
                                                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none disabled:opacity-50" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Night Shift</label>
                                            <div className="flex items-center h-10">
                                                <input 
                                                    type="checkbox" 
                                                    checked={shiftConfig.is_night_shift} 
                                                    disabled={shiftConfig.is_flexi}
                                                    onChange={(e) => setShiftConfig({...shiftConfig, is_night_shift: e.target.checked})}
                                                    className="w-4 h-4 accent-indigo-600 disabled:opacity-50" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flexi / Anytime Shift</label>
                                            <div className="flex items-center h-10">
                                                <input 
                                                    type="checkbox" 
                                                    checked={shiftConfig.is_flexi} 
                                                    onChange={(e) => setShiftConfig({...shiftConfig, is_flexi: e.target.checked})}
                                                    className="w-4 h-4 accent-indigo-600" 
                                                />
                                            </div>
                                        </div>
                                        {shiftConfig.is_flexi && (
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Hours Required</label>
                                                <input 
                                                    type="number" 
                                                    step="0.5"
                                                    value={shiftConfig.min_hours} 
                                                    onChange={(e) => setShiftConfig({...shiftConfig, min_hours: parseFloat(e.target.value) || 8.0})}
                                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valid From</label>
                                            <input type="date" value={shiftConfig.from_date} onChange={(e) => setShiftConfig({...shiftConfig, from_date: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valid To</label>
                                            <input type="date" value={shiftConfig.to_date} onChange={(e) => setShiftConfig({...shiftConfig, to_date: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {editingShiftId 
                                            ? 'Selected employees will be assigned to this shift after saving (Optional)'
                                            : 'New shift will be assigned to selected employees after saving'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Personnel Matrix for Assignment */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden mt-8">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                    {editingShiftId ? 'Assign to Employees (Optional)' : 'Select Employees for Assignment'}
                                </h3>
                                <div className="flex items-center gap-4">
                                    <select 
                                        value={selectedOutlet}
                                        onChange={(e) => setSelectedOutlet(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-indigo-300 shadow-sm"
                                    >
                                        {uniqueLocations.map(loc => (
                                            <option key={loc} value={loc}>
                                                {loc === 'all' ? 'All Outlets' : loc}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search employees..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold outline-none focus:border-indigo-300 w-64 shadow-sm" 
                                        />
                                    </div>
                                    <button onClick={() => setSelectedEmployees(filteredEmployees.filter(e => !e.assigned_shift))} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">Select All</button>
                                    <button onClick={() => setSelectedEmployees([])} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Clear</button>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {filteredEmployees.map(emp => (
                                    <div 
                                        key={emp.id}
                                        onClick={() => handleEmployeeToggle(emp)}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                                            selectedEmployees.some(e => e.id === emp.id)
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                                : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${
                                            selectedEmployees.some(e => e.id === emp.id) ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {(emp.first_name?.[0] || '')}{(emp.last_name?.[0] || '')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black uppercase truncate leading-none mb-1">{emp.first_name} {emp.last_name}</p>
                                            <p className={`text-[8px] font-bold uppercase tracking-tighter truncate ${selectedEmployees.some(e => e.id === emp.id) ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                {emp.assigned_shift || 'Available'}
                                            </p>
                                        </div>
                                        {selectedEmployees.some(e => e.id === emp.id) && <CheckCircle size={14} className="text-white shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'override' ? (
                /* Override Mode */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" />
                                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Override Logic</h3>
                                </div>
                                <button 
                                    onClick={handleOverrideExecute}
                                    disabled={loading}
                                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Wait...' : 'Save Shift Override'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Target Protocol</label>
                                    <select 
                                        value={selectedShiftId} 
                                        onChange={(e) => setSelectedShiftId(e.target.value)}
                                        className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">Choose Shift...</option>
                                        {shifts.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.is_flexi ? '(Flexi)' : `(${s.start_time} - ${s.end_time})`}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Effective From</label>
                                        <input type="date" value={overrideConfig.from_date} onChange={(e) => setOverrideConfig({...overrideConfig, from_date: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Effective To</label>
                                        <input type="date" value={overrideConfig.to_date} onChange={(e) => setOverrideConfig({...overrideConfig, to_date: e.target.value})} className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none" placeholder="Indefinite" />
                                    </div>
                                </div>

                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Warning</p>
                                    <p className="text-[10px] text-amber-700 leading-tight">Executing this override will immediately replace any existing shift assignments for the selected employees.</p>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                            placeholder="Quick filter..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 py-1 text-[10px] font-bold outline-none focus:border-indigo-300 w-32"
                                        />
                                    </div>
                                    <button onClick={() => setSelectedEmployees(filteredEmployees)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Select All</button>
                                    <div className="w-px h-3 bg-slate-200" />
                                    <button onClick={() => setSelectedEmployees([])} className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Clear</button>
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
                                                    <p className={`text-[10px] font-black uppercase ${selectedEmployees.some(e => e.id === emp.id) ? 'text-white' : 'text-slate-700'}`}>{emp.first_name} {emp.last_name}</p>
                                                    <p className={`text-[8px] font-bold uppercase tracking-tighter ${selectedEmployees.some(e => e.id === emp.id) ? 'text-slate-400' : 'text-slate-400'}`}>
                                                        Current: {emp.assigned_shift || 'None'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedEmployees.some(e => e.id === emp.id) && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <AnimatePresence>
                {success && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3"
                    >
                        <CheckCircle size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Synchronised</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default ShiftManagement;
