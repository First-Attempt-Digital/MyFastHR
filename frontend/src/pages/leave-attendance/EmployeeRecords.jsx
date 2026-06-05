import React, { useState, useEffect } from 'react';
import { 
    Calendar, Users, Clock, Search, Filter, Download, 
    ArrowRight, UserCheck, AlertCircle, ChevronDown, 
    FileText, CheckCircle, XCircle, Info, Sparkles, Plus, Edit2, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const EmployeeRecords = () => {
    const [activeTab, setActiveTab] = useState('balances'); // 'balances' or 'applications'
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState([]);
    const [applications, setApplications] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [targetEmployee, setTargetEmployee] = useState(null);
    const [adjustType, setAdjustType] = useState('credit');
    const [adjustDays, setAdjustDays] = useState('2');
    const [adjustReason, setAdjustReason] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [selectedLeaveType, setSelectedLeaveType] = useState('');

    // Global Leave rules states
    const [showGlobalRulesModal, setShowGlobalRulesModal] = useState(false);
    const [globalRules, setGlobalRules] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balRes, appRes, typesRes] = await Promise.all([
                api.get('/leaves/all-balances'),
                api.get('/leaves?view=team'),
                api.get('/leaves/types')
            ]);
            setBalances(balRes || []);
            setApplications(appRes || []);
            setLeaveTypes(typesRes || []);
            if (typesRes?.length > 0) {
                setSelectedLeaveType(typesRes[0].id.toString());
            }
        } catch (err) {
            console.error('Failed to load leave records:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportBalances = () => {
        if (!balances || balances.length === 0) {
            alert("No balances data to export.");
            return;
        }
        const dataToExport = balances.map(emp => {
            const row = {
                employee_id: emp.id,
                name: emp.name,
                designation: emp.designation || 'Staff',
            };
            // Add allocations/available/used for each leave type
            leaveTypes.forEach(lt => {
                const b = emp.balances.find(bal => bal.type_id === lt.id) || { allocated: 0, used: 0, available: 0 };
                row[`${lt.name}_allocated`] = b.allocated;
                row[`${lt.name}_used`] = b.used;
                row[`${lt.name}_available`] = b.available;
            });
            row.total_allocated = emp.total_allocated || 0;
            row.total_used = emp.total_used || 0;
            row.total_available = emp.total_available || 0;
            return row;
        });

        const headers = {
            employee_id: 'Employee ID',
            name: 'Employee Name',
            designation: 'Designation',
        };
        leaveTypes.forEach(lt => {
            headers[`${lt.name}_allocated`] = `${lt.name} Allocated`;
            headers[`${lt.name}_used`] = `${lt.name} Used`;
            headers[`${lt.name}_available`] = `${lt.name} Available`;
        });
        headers.total_allocated = 'Total Allocated';
        headers.total_used = 'Total Used';
        headers.total_available = 'Total Available';

        exportToCSV(dataToExport, `Leave_Balances_Ledger_${new Date().getFullYear()}.csv`, headers);
    };

    const handleExportApplications = () => {
        if (!applications || applications.length === 0) {
            alert("No leave applications to export.");
            return;
        }
        const dataToExport = applications.map(app => ({
            employee_id: app.employee_id || '',
            name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
            leave_type: app.leave_type_name || '',
            start_date: app.start_date ? app.start_date.split('T')[0] : '',
            end_date: app.end_date ? app.end_date.split('T')[0] : '',
            days: app.days || 0,
            status: app.status || '',
            reason: app.reason || '',
            reviewer: app.reviewer_name || '',
            created_at: app.created_at ? app.created_at.split('T')[0] : ''
        }));

        const headers = {
            employee_id: 'Employee ID',
            name: 'Employee Name',
            leave_type: 'Leave Type',
            start_date: 'Start Date',
            end_date: 'End Date',
            days: 'Days Count',
            status: 'Status',
            reason: 'Reason',
            reviewer: 'Reviewed By',
            created_at: 'Applied On'
        };

        exportToCSV(dataToExport, `Leave_Applications_Log_${new Date().getFullYear()}.csv`, headers);
    };

    // Filtered data based on search
    const filteredBalances = balances.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.designation && emp.designation.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredApplications = applications.filter(app => 
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.leave_type_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Approve / Reject Leave Handler
    const handleStatusUpdate = async (id, status) => {
        try {
            setSubmittingAction(true);
            await api.patch(`/leaves/${id}/status`, { status });
            alert(`Leave request has been successfully ${status}!`);
            
            // Reload all data
            await fetchData();
            setSelectedRequest(null);
        } catch (err) {
            alert(err.response?.data?.message || `Failed to update leave status to ${status}`);
        } finally {
            setSubmittingAction(false);
        }
    };

    // Manual balance adjustment submit
    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        if (!adjustReason) {
            alert('Please specify a reason for this adjustment.');
            return;
        }
        if (!selectedLeaveType) {
            alert('Please select a leave type.');
            return;
        }

        try {
            setSubmittingAction(true);
            await api.post('/leaves/adjust-balance', {
                employee_id: targetEmployee.id,
                leave_type_id: parseInt(selectedLeaveType),
                adjustment_type: adjustType,
                days: parseFloat(adjustDays),
                reason: adjustReason
            });
            
            alert(`Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ${adjustDays} days for ${targetEmployee.name}!`);
            
            // Reload all data to refresh balance ledger dynamically
            await fetchData();
            
            setShowAdjustModal(false);
            setAdjustReason('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to execute leave adjustment.');
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleOpenGlobalRules = async () => {
        try {
            setLoading(true);
            const res = await api.get('/leaves/types?includeInactive=true');
            setGlobalRules(res.map(r => ({
                id: r.id,
                name: r.name,
                days_per_year: r.days_per_year,
                accrual_frequency: r.accrual_frequency || 'yearly',
                carry_forward: Boolean(r.carry_forward),
                is_active: Boolean(r.is_active)
            })));
            setShowGlobalRulesModal(true);
        } catch (err) {
            alert('Failed to load global rules: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalRulesSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmittingAction(true);
            const cleanedRules = globalRules.map(r => ({
                ...r,
                days_per_year: r.days_per_year === '' ? 0 : (parseFloat(r.days_per_year) || 0)
            }));
            await api.post('/leaves/types/global-rules', {
                rules: cleanedRules
            });
            alert('Global leave rules updated successfully!');
            setShowGlobalRulesModal(false);
            await fetchData();
        } catch (err) {
            alert('Failed to save global leave rules: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingAction(false);
        }
    };

    // Counters aggregations
    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const approvedCount = applications.filter(a => a.status === 'approved').length;
    const totalRequests = applications.length;

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto animate-in fade-in duration-500 pb-10 px-2">
            
            {/* --- HEADER BANNER --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200/40 p-5 rounded-2xl shadow-sm">
                <div className="max-w-2xl leading-snug">
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                        Employee Leave Records
                        <span className="text-[9px] font-black tracking-widest text-[#4361ee] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase select-none">Admin Portal</span>
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">Supervise employee leave entitlements, review pending request logs, and manage manual balance adjustments.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={handleOpenGlobalRules}
                        className="px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap w-full sm:w-auto"
                    >
                        <Settings size={12} className="shrink-0" />
                        <span>Global Leave Rules</span>
                    </button>

                    {/* Switch sub-tabs */}
                    <div className="bg-slate-100 border border-slate-200/50 p-1 rounded-2xl flex items-center gap-1 w-full sm:w-auto shadow-inner">
                        <button
                            onClick={() => { setActiveTab('balances'); setSearchQuery(''); }}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none ${
                                activeTab === 'balances'
                                ? 'bg-[#4361ee] text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Users size={12} className="shrink-0" />
                            <span>Balance Ledger</span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('applications'); setSearchQuery(''); }}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer relative whitespace-nowrap flex-1 sm:flex-none ${
                                activeTab === 'applications'
                                ? 'bg-[#4361ee] text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <FileText size={12} className="shrink-0" />
                            <span>Request Logs</span>
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- QUICK KPI CARD GRIDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white border border-slate-200/50 p-3.5 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-9.5 h-9.5 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4361ee] shrink-0 border border-indigo-100/50">
                        <FileText size={16} strokeWidth={2.5} />
                    </div>
                    <div className="leading-tight overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">Total Requests</span>
                        <h4 className="text-sm font-black text-slate-800 mt-0.5 truncate">{totalRequests} Submitted</h4>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-3.5 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-9.5 h-9.5 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100/50">
                        <Clock size={16} strokeWidth={2.5} />
                    </div>
                    <div className="leading-tight overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">Pending Approvals</span>
                        <h4 className="text-sm font-black text-slate-800 mt-0.5 flex items-center gap-2 truncate">
                            <span>{pendingCount} Pending</span>
                            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />}
                        </h4>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-3.5 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-9.5 h-9.5 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/50">
                        <CheckCircle size={16} strokeWidth={2.5} />
                    </div>
                    <div className="leading-tight overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">Approved Leaves</span>
                        <h4 className="text-sm font-black text-slate-800 mt-0.5 truncate">{approvedCount} requests</h4>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-3.5 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-9.5 h-9.5 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 border border-sky-100/50">
                        <Sparkles size={16} strokeWidth={2.5} />
                    </div>
                    <div className="leading-tight overflow-hidden">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">Adjust entitlement</span>
                        <h4 className="text-xs font-black text-[#4361ee] mt-0.5 truncate">Quick Credit Enabled</h4>
                    </div>
                </div>

            </div>

            {/* --- CONTROLS BAR (SEARCH) --- */}
            <div className="bg-white border border-slate-200/40 p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 w-full sm:max-w-md shadow-inner">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeTab === 'balances' ? 'Search employee name or role...' : 'Search employee name or leave type...'}
                        className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-full"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={activeTab === 'balances' ? handleExportBalances : handleExportApplications}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                        <Download size={12} />
                        <span>Export {activeTab === 'balances' ? 'Ledger' : 'Requests'}</span>
                    </button>
                    <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider select-none shrink-0">
                        Current Year: <span className="font-black text-[#4361ee]">{new Date().getFullYear()}</span>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTENT PANEL --- */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden relative">
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[350px] p-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4361ee] mb-4">
                            <Clock size={24} className="animate-spin" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing leave balances and request history...</p>
                    </div>
                ) : activeTab === 'balances' ? (
                    
                    /* --- BALANCE LEDGER TAB VIEW --- */
                    filteredBalances.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                                <AlertCircle size={22} />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">No Employee Balance Found</h4>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200/80">
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Details</th>
                                        {leaveTypes.map(lt => (
                                            <th key={lt.id} className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                                                {lt.name}
                                            </th>
                                        ))}
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center bg-indigo-50/20 text-[#4361ee]">Total Available</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Used</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Entitlement Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredBalances.map((emp) => {
                                        return (
                                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3.5 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase">
                                                        {emp.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="overflow-hidden leading-tight">
                                                        <h5 className="text-[10.5px] font-black text-slate-800">{emp.name}</h5>
                                                        <p className="text-[8.5px] font-bold text-slate-400 mt-0.5 truncate">{emp.designation || 'Specialist'}</p>
                                                    </div>
                                                </td>
                                                {leaveTypes.map(lt => {
                                                    const bal = emp.balances.find(b => b.type_id === lt.id) || { allocated: 0, used: 0, available: 0, accrual_frequency: 'yearly', carry_forward: false };
                                                    return (
                                                        <td key={lt.id} className="p-3.5 text-center">
                                                            <div className="text-[10px] font-bold text-slate-700">{bal.available} / {bal.allocated}</div>
                                                            <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{bal.used} days used</div>
                                                            <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                                                                <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">
                                                                    {bal.accrual_frequency || 'yearly'}
                                                                </span>
                                                                {bal.carry_forward && (
                                                                    <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-[#4361ee] uppercase tracking-wider">
                                                                        CF
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-3.5 text-center bg-indigo-50/5 font-black text-xs text-[#4361ee]">
                                                    {emp.total_available} days
                                                </td>
                                                <td className="p-3.5 text-center font-bold text-xs text-slate-400">
                                                    {emp.total_used} days
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            onClick={() => { 
                                                                setTargetEmployee(emp); 
                                                                setShowAdjustModal(true); 
                                                                if (leaveTypes.length > 0) {
                                                                    setSelectedLeaveType(leaveTypes[0].id.toString());
                                                                }
                                                            }}
                                                            className="flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-[#4361ee] border border-slate-200 hover:border-indigo-100 rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm ml-auto"
                                                        >
                                                            <Edit2 size={10} />
                                                            <span>Adjust Balance</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )

                ) : (
                    
                    /* --- REQUEST LOGS TAB VIEW --- */
                    filteredApplications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                                <AlertCircle size={22} />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">No Leave Requests Found</h4>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200/80">
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Details</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Leave Type</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Period Duration</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Days</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Submission Date</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="p-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Approval Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredApplications.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3.5">
                                                <div className="overflow-hidden leading-tight">
                                                    <h5 className="text-[10.5px] font-black text-slate-800">{app.first_name} {app.last_name}</h5>
                                                    <p className="text-[8.5px] font-bold text-slate-400 mt-0.5 truncate">#{app.employee_id || 'ID-TEMP'}</p>
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: app.leave_type_color || '#4361ee' }} />
                                                    <span className="text-xs font-bold text-slate-700">{app.leave_type_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <div className="text-[10px] font-black text-slate-700">
                                                    {new Date(app.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(app.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                {app.reason && <p className="text-[7.5px] font-bold text-slate-400 italic mt-0.5 max-w-[200px] truncate mx-auto">"{app.reason}"</p>}
                                            </td>
                                            <td className="p-3.5 text-center font-black text-xs text-slate-700">
                                                {app.days} Day(s)
                                            </td>
                                            <td className="p-3.5 text-xs text-slate-400">
                                                {new Date(app.created_at || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase border shadow-sm ${
                                                    app.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : app.status === 'rejected'
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right">
                                                {app.status === 'pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            disabled={submittingAction}
                                                            onClick={() => handleStatusUpdate(app.id, 'approved')}
                                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-40"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            disabled={submittingAction}
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-40"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-400 italic">Processed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )

                )}
            </div>

            {/* --- MANUAL ADJUSTMENT DIALOG MODAL --- */}
            <AnimatePresence>
                {showAdjustModal && targetEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAdjustModal(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
                        />

                        {/* Modal Box */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-md w-full z-10"
                        >
                            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800">Adjust Leave Entitlement</h3>
                                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{targetEmployee.name}</p>
                                </div>
                                <button 
                                    onClick={() => setShowAdjustModal(false)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleAdjustSubmit} className="space-y-4 mt-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Adjustment Action</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('credit')}
                                            className={`py-2 rounded-xl text-[10px] font-extrabold uppercase border tracking-wider transition-all ${
                                                adjustType === 'credit'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 font-black'
                                                : 'bg-slate-50 text-slate-400 border-slate-200'
                                            }`}
                                        >
                                            Credit (+ Add)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('debit')}
                                            className={`py-2 rounded-xl text-[10px] font-extrabold uppercase border tracking-wider transition-all ${
                                                adjustType === 'debit'
                                                ? 'bg-rose-50 text-rose-600 border-rose-200 font-black'
                                                : 'bg-slate-50 text-slate-400 border-slate-200'
                                            }`}
                                        >
                                            Debit (- Cut)
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Select Leave Type</label>
                                    <select 
                                        value={selectedLeaveType}
                                        onChange={(e) => setSelectedLeaveType(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full text-xs font-black text-slate-700 outline-none"
                                    >
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Number of Days</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max="15"
                                        value={adjustDays}
                                        onChange={(e) => setAdjustDays(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full text-xs font-black text-slate-700 outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reason / Audit Remarks</label>
                                    <textarea 
                                        value={adjustReason}
                                        onChange={(e) => setAdjustReason(e.target.value)}
                                        placeholder="e.g. Compensation leave credited for weekend roster support..."
                                        rows="3"
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full text-xs font-medium text-slate-700 outline-none resize-none placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="flex gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdjustModal(false)}
                                        className="w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer text-center"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingAction}
                                        className="w-1/2 bg-[#4361ee] hover:bg-[#344ed1] text-white text-[10px] font-black uppercase py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center disabled:opacity-40"
                                    >
                                        {submittingAction ? 'Processing...' : 'Apply Adjust'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>            {/* --- GLOBAL LEAVE RULES CONFIGURATION DIALOG MODAL --- */}
            <AnimatePresence>
                {showGlobalRulesModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowGlobalRulesModal(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
                        />

                        {/* Modal Box */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-xl w-full z-10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800">Global Leave Rules Settings</h3>
                                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Applies to all employees</p>
                                </div>
                                <button 
                                    onClick={() => setShowGlobalRulesModal(false)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleGlobalRulesSubmit} className="space-y-4 mt-4">
                                {globalRules.map((rule, idx) => (
                                    <div key={rule.id} className={`p-4 border rounded-2xl transition-all space-y-3 ${
                                        rule.is_active 
                                        ? 'bg-slate-50 border-slate-200/60' 
                                        : 'bg-slate-100/50 border-slate-200 opacity-60'
                                    }`}>
                                        <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-800">{rule.name}</span>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                    rule.is_active 
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                    : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                    {rule.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                            
                                            {/* Toggle switch for active status */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Enable Leave</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={rule.is_active}
                                                        onChange={(e) => {
                                                            const updated = [...globalRules];
                                                            updated[idx].is_active = e.target.checked;
                                                            setGlobalRules(updated);
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>
                                        </div>

                                        {rule.is_active && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Leaves per year</label>
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        min="0"
                                                        value={rule.days_per_year}
                                                        onChange={(e) => {
                                                            const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                                            const updated = [...globalRules];
                                                            updated[idx].days_per_year = val;
                                                            setGlobalRules(updated);
                                                        }}
                                                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 w-full text-xs font-bold text-slate-700 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Frequency</label>
                                                    <select 
                                                        value={rule.accrual_frequency}
                                                        onChange={(e) => {
                                                            const updated = [...globalRules];
                                                            updated[idx].accrual_frequency = e.target.value;
                                                            setGlobalRules(updated);
                                                        }}
                                                        className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 w-full text-xs font-bold text-slate-700 outline-none"
                                                    >
                                                        <option value="monthly">Monthly</option>
                                                        <option value="yearly">Yearly</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1 flex flex-col justify-between pb-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Rollover (CF)</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={rule.carry_forward}
                                                            onChange={(e) => {
                                                                const updated = [...globalRules];
                                                                updated[idx].carry_forward = e.target.checked;
                                                                setGlobalRules(updated);
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-600">Carry Forward</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="flex gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowGlobalRulesModal(false)}
                                        className="w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer text-center"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingAction}
                                        className="w-1/2 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center disabled:opacity-40"
                                    >
                                        {submittingAction ? 'Saving...' : 'Save Global Rules'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default EmployeeRecords;
