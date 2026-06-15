import React, { useState, useEffect, useRef } from 'react';
import { 
    Calendar, Plus, Clock, X, Info, Trash2, 
    ChevronRight, ChevronDown, RefreshCw, Users, HelpCircle, Download, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { exportToCSV } from '../utils/exportUtils';

const LeaveGranter = () => {
    const [batches, setBatches] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showHelp, setShowHelp] = useState(true);

    const [allSchemes, setAllSchemes] = useState([]);

    // Filters
    const [filterGrantType, setFilterGrantType] = useState('All');
    const [filterLeaveType, setFilterLeaveType] = useState('All');
    const [filterEmployee, setFilterEmployee] = useState('All');
    const [filterDept, setFilterDept] = useState('All');
    const [filterDesignation, setFilterDesignation] = useState('All');
    const [filterOutlet, setFilterOutlet] = useState('All');
    const [selectedYear, setSelectedYear] = useState('Jan 2026 - Dec 2026');
    const [selectedPeriod, setSelectedPeriod] = useState('All');
    const [selectedScheme, setSelectedScheme] = useState('All');

    const uniqueDepartments = React.useMemo(() => {
        const depts = employees.map(emp => emp.department_name || emp.department).filter(Boolean);
        return ['All', ...new Set(depts)].sort();
    }, [employees]);

    const uniqueDesignations = React.useMemo(() => {
        const roles = employees.map(emp => emp.designation).filter(Boolean);
        return ['All', ...new Set(roles)].sort();
    }, [employees]);

    const uniqueOutlets = React.useMemo(() => {
        const locations = employees.map(emp => emp.office_location || emp.location).filter(Boolean);
        return ['All', ...new Set(locations)].sort();
    }, [employees]);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalData, setModalData] = useState({
        leave_type_id: '',
        period: 'May 2026',
        frequency: 'Monthly',
        scheme: 'Leave Scheme',
        days: 1.0,
        employee_ids: 'all',
        reason: ''
    });

    // Expanded Batches state (Set of batch_ids)
    const [expandedBatches, setExpandedBatches] = useState(new Set());

    // Custom Dropdown States for Target Employee(s) Search
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const employeeDropdownRef = useRef(null);

    // Click outside dropdown handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target)) {
                setIsEmployeeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [grantsRes, typesRes, empsRes, schemesRes] = await Promise.all([
                api.get('/leaves/grants'),
                api.get('/leaves/types'),
                api.get('/employees'),
                api.get('/attendance/schemes')
            ]);
            setBatches(Array.isArray(grantsRes) ? grantsRes : []);
            setLeaveTypes(Array.isArray(typesRes) ? typesRes : []);
            setAllSchemes(Array.isArray(schemesRes) ? schemesRes : []);
            
            // Get raw employee list (handles { data: [...] } structure if paginated)
            const rawEmps = empsRes?.data || empsRes || [];
            setEmployees(Array.isArray(rawEmps) ? rawEmps : []);
        } catch (err) {
            console.error('Failed to fetch leave granter data:', err);
            setError('Failed to load leave grants. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleBatch = (batchId) => {
        setExpandedBatches(prev => {
            const next = new Set(prev);
            if (next.has(batchId)) next.delete(batchId);
            else next.add(batchId);
            return next;
        });
    };

    const handleDeleteBatch = async (batchId) => {
        if (!window.confirm(`Are you sure you want to revert/delete the entire Batch #${batchId}?`)) return;
        try {
            await api.delete(`/leaves/grants/batch/${batchId}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete batch.');
        }
    };

    const handleDeleteAdjustment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this individual employee grant?')) return;
        try {
            await api.delete(`/leaves/grants/adjustment/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete grant.');
        }
    };

    const handleGrantSubmit = async (e) => {
        e.preventDefault();
        if (!modalData.leave_type_id) {
            alert('Please select a leave type.');
            return;
        }
        if (Number(modalData.days) <= 0) {
            alert('Days must be greater than 0.');
            return;
        }

        setSubmitting(true);
        try {
            // Map employee selection
            const payload = {
                ...modalData,
                days: Number(modalData.days),
                employee_ids: modalData.employee_ids === 'all' 
                    ? 'all' 
                    : [parseInt(modalData.employee_ids)]
            };

            await api.post('/leaves/grants', payload);
            setIsModalOpen(false);
            // Reset
            setModalData({
                leave_type_id: '',
                period: 'May 2026',
                frequency: 'Monthly',
                scheme: 'Leave Scheme',
                days: 1.0,
                employee_ids: 'all',
                reason: ''
            });
            setEmployeeSearchQuery('');
            setIsEmployeeDropdownOpen(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to grant leave.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = () => {
        const dataToExport = [];
        filteredBatches.forEach(batch => {
            const formattedDate = new Date(batch.created_at).toLocaleString('en-IN');
            if (batch.employees && batch.employees.length > 0) {
                batch.employees.forEach(emp => {
                    dataToExport.push({
                        "Batch ID": batch.batch_id,
                        "Grant Type": batch.grant_type,
                        "Granted At": formattedDate,
                        "Period": batch.period,
                        "Frequency": batch.frequency,
                        "Leave Type": batch.leave_type_name,
                        "Scheme": batch.scheme,
                        "Batch Headcount": batch.headcount,
                        "Employee ID": emp.employee_id_number,
                        "Employee Name": `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                        "Employee Status": emp.status || 'Active',
                        "Joining Date": emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : 'N/A',
                        "Days Credited": emp.days,
                        "Adjustment ID": emp.adjustment_id,
                        "Reason/Remarks": batch.reason || emp.reason || ''
                    });
                });
            } else {
                dataToExport.push({
                    "Batch ID": batch.batch_id,
                    "Grant Type": batch.grant_type,
                    "Granted At": formattedDate,
                    "Period": batch.period,
                    "Frequency": batch.frequency,
                    "Leave Type": batch.leave_type_name,
                    "Scheme": batch.scheme,
                    "Batch Headcount": batch.headcount,
                    "Employee ID": 'N/A',
                    "Employee Name": 'N/A',
                    "Employee Status": 'N/A',
                    "Joining Date": 'N/A',
                    "Days Credited": 0,
                    "Adjustment ID": 'N/A',
                    "Reason/Remarks": batch.reason || ''
                });
            }
        });

        exportToCSV(dataToExport, "Leave_Grants_Log.csv");
    };

    // Extract standard 12 months dynamically based on the selectedYear
    const getPeriodOptions = () => {
        const monthsList = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const yearMatch = selectedYear.match(/\d{4}$/);
        const filterYear = yearMatch ? yearMatch[0] : new Date().getFullYear();
        return ['All', ...monthsList.map(m => `${m} ${filterYear}`)];
    };
    const uniquePeriods = getPeriodOptions();

    // Extract unique schemes from loaded schemes and batch records
    const uniqueSchemes = ['All', ...new Set([
        ...allSchemes.map(s => s.name),
        ...batches.map(b => b.scheme)
    ].filter(Boolean))];

    // Filter Batches logic
    const filteredBatches = React.useMemo(() => {
        return batches.map(batch => {
            const matchedEmployees = (batch.employees || []).filter(emp => {
                const empDept = emp.department_name || employees.find(e => e.id === emp.employee_id)?.department_name || 'General';
                const empDesg = emp.designation || employees.find(e => e.id === emp.employee_id)?.designation || '';
                const empLoc = emp.office_location || employees.find(e => e.id === emp.employee_id)?.office_location || 'Unassigned';

                const matchesDept = filterDept === 'All' || String(empDept).toLowerCase() === String(filterDept).toLowerCase();
                const matchesDesignation = filterDesignation === 'All' || String(empDesg).toLowerCase() === String(filterDesignation).toLowerCase();
                const matchesOutlet = filterOutlet === 'All' || String(empLoc).toLowerCase() === String(filterOutlet).toLowerCase();

                return matchesDept && matchesDesignation && matchesOutlet;
            });

            return {
                ...batch,
                employees: matchedEmployees,
                headcount: matchedEmployees.length
            };
        }).filter(batch => {
            if (filterLeaveType !== 'All' && batch.leave_type_name !== filterLeaveType) return false;
            if (filterGrantType !== 'All' && batch.grant_type !== filterGrantType) return false;
            if (selectedPeriod !== 'All' && batch.period !== selectedPeriod) return false;
            if (selectedScheme !== 'All' && batch.scheme !== selectedScheme) return false;

            if (filterEmployee !== 'All') {
                const hasEmp = batch.employees.some(emp => emp.employee_id === parseInt(filterEmployee));
                if (!hasEmp) return false;
            }

            const hasActiveEmployeeFilter = filterDept !== 'All' || filterDesignation !== 'All' || filterOutlet !== 'All';
            if (hasActiveEmployeeFilter && batch.employees.length === 0) return false;

            return true;
        });
    }, [batches, filterLeaveType, filterGrantType, filterEmployee, selectedPeriod, selectedScheme, filterDept, filterDesignation, filterOutlet, employees]);

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-outfit">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-4">
                <span>Home</span>
                <ChevronRight size={12} />
                <span>Leave and Attendance</span>
                <ChevronRight size={12} />
                <span className="text-slate-600">Leave Granter</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leave Granter</h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">Allocate leave credits dynamically across organization.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Interactive Period selection */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm relative pr-8">
                        <Calendar size={14} className="text-slate-400 mr-1" />
                        <span className="text-slate-400 mr-1 font-bold">Payroll Month:</span>
                        <select 
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer appearance-none pr-4"
                        >
                            <option value="All">All Months</option>
                            {uniquePeriods.filter(p => p !== 'All').map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    
                    {/* Interactive Scheme selection */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm relative pr-8">
                        <span className="text-slate-400 mr-1 font-bold">Scheme:</span>
                        <select 
                            value={selectedScheme}
                            onChange={(e) => setSelectedScheme(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer appearance-none pr-4"
                        >
                            <option value="All">All Schemes</option>
                            {uniqueSchemes.filter(s => s !== 'All').map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Help Banner */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm relative overflow-hidden"
                    >
                        <div className="flex gap-3">
                            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500 shrink-0 h-fit mt-0.5">
                                <HelpCircle size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    The <strong className="text-slate-800">Leave Granter</strong> page displays a summary of all leaves credited (granted) to employees for the current leave year. Click the icons present adjacent to each row to further manage the data. Leave is usually granted automatically as per schedule. However, you can also grant leave manually by clicking the <strong className="text-indigo-600">Grant Leave</strong> button.
                                </p>
                                <p className="text-xs text-slate-400 font-medium mt-2">
                                    Explore myFastHR by <span className="text-indigo-500 hover:underline cursor-pointer">Help-Doc</span>, watching <span className="text-indigo-500 hover:underline cursor-pointer">How-to Videos</span> and <span className="text-indigo-500 hover:underline cursor-pointer">FAQ</span>.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowHelp(false)}
                                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-wider shrink-0 self-start mt-0.5 hover:underline"
                            >
                                Hide Help
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter & Action Bar */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Grant Type */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Grant Type</label>
                        <select 
                            value={filterGrantType}
                            onChange={(e) => setFilterGrantType(e.target.value)}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 text-slate-700 min-w-[120px] transition-colors"
                        >
                            <option value="All">Grant Type: All</option>
                            <option value="Manual">Manual</option>
                            <option value="Auto">Auto</option>
                        </select>
                    </div>

                    {/* Leave Type */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Leave Type</label>
                        <select 
                            value={filterLeaveType}
                            onChange={(e) => setFilterLeaveType(e.target.value)}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 text-slate-700 min-w-[120px] transition-colors"
                        >
                            <option value="All">Leave Type: All</option>
                            {leaveTypes.map(lt => (
                                <option key={lt.id} value={lt.name}>{lt.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Employee */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Employee</label>
                        <select 
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(e.target.value)}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 text-slate-700 min-w-[150px] max-w-[200px] transition-colors"
                        >
                            <option value="All">Employee: All</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id_number})</option>
                            ))}
                        </select>
                    </div>

                    {/* Department */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Department</label>
                        <select 
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 text-slate-700 min-w-[150px] max-w-[200px] transition-colors cursor-pointer"
                        >
                            <option value="All">Department: All</option>
                            {uniqueDepartments.filter(d => d !== 'All').map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Designation */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Designation</label>
                        <select 
                            value={filterDesignation}
                            onChange={(e) => setFilterDesignation(e.target.value)}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 text-slate-700 min-w-[150px] max-w-[200px] transition-colors cursor-pointer"
                        >
                            <option value="All">Designation: All</option>
                            {uniqueDesignations.filter(d => d !== 'All').map(desg => (
                                <option key={desg} value={desg}>{desg}</option>
                            ))}
                        </select>
                    </div>

                    {/* Outlet */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Outlet</label>
                        <select 
                            value={filterOutlet}
                            onChange={(e) => setFilterOutlet(e.target.value)}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 text-slate-700 min-w-[150px] max-w-[200px] transition-colors cursor-pointer"
                        >
                            <option value="All">Outlet: All</option>
                            {uniqueOutlets.filter(o => o !== 'All').map(outlet => (
                                <option key={outlet} value={outlet}>{outlet}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
                    >
                        <option value="Jan 2026 - Dec 2026">Jan 2026 - Dec 2026</option>
                        <option value="Jan 2025 - Dec 2025">Jan 2025 - Dec 2025</option>
                    </select>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-slate-50 active:scale-95 shrink-0"
                    >
                        <Download size={14} className="text-slate-450" />
                        <span>Export CSV</span>
                    </button>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all shrink-0"
                    >
                        <Plus size={15} />
                        <span>Grant Leave</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-[40vh] gap-4 bg-white border border-slate-100 rounded-3xl p-8">
                    <div className="relative">
                        <div className="w-12 h-12 border-[4px] border-slate-100 rounded-full" />
                        <div className="absolute inset-0 w-12 h-12 border-t-[4px] border-indigo-600 rounded-full animate-spin" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Loading grants ledger...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-[40vh] gap-4 bg-white border border-slate-100 rounded-3xl p-8 text-center">
                    <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Info size={24} /></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Error Loading Data</h3>
                        <p className="text-xs text-slate-400 mt-1">{error}</p>
                    </div>
                    <button onClick={fetchData} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">Retry</button>
                </div>
            ) : filteredBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[45vh] gap-5 bg-white border border-slate-100 rounded-3xl p-8 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">No Grants Found</h3>
                        <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">No leave credits have been granted for the selected filter criteria. Click "Grant Leave" to manually allocate credits.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-outfit">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 w-16 text-center">#</th>
                                    <th className="py-4 px-6 w-48">Employee No</th>
                                    <th className="py-4 px-6">Employee Name</th>
                                    <th className="py-4 px-6 w-36">Status</th>
                                    <th className="py-4 px-6 w-36">Joining Date</th>
                                    <th className="py-4 px-6 w-24">Days</th>
                                    <th className="py-4 px-6 w-20 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBatches.map((batch) => {
                                    const isExpanded = expandedBatches.has(batch.batch_id);
                                    const formattedDate = new Date(batch.created_at).toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    });

                                    return (
                                        <React.Fragment key={batch.batch_id}>
                                            {/* Batch Header Row */}
                                            <tr className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                                <td className="py-4 px-6 text-center">
                                                    <button 
                                                        onClick={() => toggleBatch(batch.batch_id)}
                                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                </td>
                                                <td colSpan={5} className="py-4 px-6 cursor-pointer" onClick={() => toggleBatch(batch.batch_id)}>
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                                                        <div>
                                                            <span className="font-bold text-slate-800">Batch ID: {batch.batch_id}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-3 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                                {batch.grant_type}
                                                            </span>
                                                            <div className="text-[10px] text-slate-400 font-medium mt-1">
                                                                Granted On: {formattedDate}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:flex md:items-center gap-x-6 gap-y-1 text-slate-500 font-semibold">
                                                            <div>Period: <span className="font-bold text-slate-700">{batch.period}</span></div>
                                                            <div>Frequency: <span className="font-bold text-slate-700">{batch.frequency}</span></div>
                                                            <div>Leave Type: <span className="font-bold text-indigo-600">{batch.leave_type_name}</span></div>
                                                            <div>Scheme: <span className="font-bold text-slate-700">{batch.scheme}</span></div>
                                                            <div>Headcount: <span className="font-bold text-slate-700">{batch.headcount}</span></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteBatch(batch.batch_id)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Delete Batch"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Nested Batch Employees */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="p-0 bg-slate-50/30">
                                                        <div className="px-6 py-3 border-b border-slate-100">
                                                            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-inner">
                                                                <table className="w-full text-left text-xs border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                                                                            <th className="py-2.5 px-4 w-12 text-center">#</th>
                                                                            <th className="py-2.5 px-4 w-40">Employee No</th>
                                                                            <th className="py-2.5 px-4">Employee Name</th>
                                                                            <th className="py-2.5 px-4 w-32">Status</th>
                                                                            <th className="py-2.5 px-4 w-32">Joining Date</th>
                                                                            <th className="py-2.5 px-4 w-20">Days</th>
                                                                            <th className="py-2.5 px-4 w-16 text-center">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {batch.employees.map((emp, index) => (
                                                                            <tr key={emp.adjustment_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                                                <td className="py-2.5 px-4 text-center font-bold text-slate-400">{index + 1}</td>
                                                                                <td className="py-2.5 px-4 font-bold text-slate-700">{emp.employee_id_number}</td>
                                                                                <td className="py-2.5 px-4">
                                                                                    <div className="font-bold text-slate-800">{emp.first_name} {emp.last_name}</div>
                                                                                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                                                                        {emp.designation || employees.find(e => e.id === emp.employee_id)?.designation || ''} • {emp.department_name || employees.find(e => e.id === emp.employee_id)?.department_name || 'General'} • {emp.office_location || employees.find(e => e.id === emp.employee_id)?.office_location || 'Unassigned'}
                                                                                    </div>
                                                                                 </td>
                                                                                <td className="py-2.5 px-4 text-slate-500 font-bold capitalize">{emp.status || 'Active'}</td>
                                                                                <td className="py-2.5 px-4 text-slate-500 font-semibold">
                                                                                    {emp.joining_date 
                                                                                        ? new Date(emp.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                                                        : 'N/A'
                                                                                    }
                                                                                </td>
                                                                                <td className="py-2.5 px-4 font-black text-slate-800">{emp.days}</td>
                                                                                <td className="py-2.5 px-4 text-center">
                                                                                    <button 
                                                                                        onClick={() => handleDeleteAdjustment(emp.adjustment_id)}
                                                                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                                        title="Delete Grant"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Grant Leave Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-outfit">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                            onClick={() => setIsModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden z-10 flex flex-col"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Manual Leave Granter</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Credit balance to employee ledger</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors"><X size={18} className="text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleGrantSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar flex-1">
                                {/* Leave Type */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Leave Category</label>
                                    <select 
                                        required
                                        value={modalData.leave_type_id}
                                        onChange={(e) => setModalData({ ...modalData, leave_type_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                    >
                                        <option value="">-- Choose Leave Type --</option>
                                        {leaveTypes.map(lt => (
                                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Period, Frequency & Scheme */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</label>
                                        <div className="relative">
                                            <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input 
                                                type="text" required
                                                value={modalData.period}
                                                onChange={(e) => setModalData({ ...modalData, period: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency</label>
                                        <select 
                                            required
                                            value={modalData.frequency}
                                            onChange={(e) => setModalData({ ...modalData, frequency: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Yearly">Yearly</option>
                                            <option value="One-time">One-time</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheme</label>
                                        <input 
                                            type="text" required
                                            value={modalData.scheme}
                                            onChange={(e) => setModalData({ ...modalData, scheme: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days to Credit</label>
                                        <input 
                                            type="number" required step="0.1" min="0.1"
                                            value={modalData.days}
                                            onChange={(e) => setModalData({ ...modalData, days: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Employee Selector with Search Dropdown */}
                                <div className="space-y-1.5 relative font-outfit" ref={employeeDropdownRef}>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Employee(s)</label>
                                    <div 
                                        onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none hover:border-slate-350 cursor-pointer flex justify-between items-center transition-all select-none"
                                    >
                                        <span>
                                            {modalData.employee_ids === 'all' 
                                                ? 'All Active Employees' 
                                                : (() => {
                                                    const emp = employees.find(e => e.id.toString() === modalData.employee_ids.toString());
                                                    return emp ? `${emp.first_name} ${emp.last_name} (${emp.employee_id_number})` : 'Select Employee';
                                                  })()
                                            }
                                        </span>
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isEmployeeDropdownOpen && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[110] max-h-60 overflow-hidden flex flex-col">
                                            <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 shrink-0">
                                                <Search size={14} className="text-slate-400 shrink-0" />
                                                <input 
                                                    type="text"
                                                    value={employeeSearchQuery}
                                                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                                    placeholder="Search employee by name or ID..."
                                                    className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 outline-none"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                {employeeSearchQuery && (
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setEmployeeSearchQuery(''); }}
                                                        className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                                <div 
                                                    onClick={() => {
                                                        setModalData({ ...modalData, employee_ids: 'all' });
                                                        setIsEmployeeDropdownOpen(false);
                                                        setEmployeeSearchQuery('');
                                                    }}
                                                    className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors ${
                                                        modalData.employee_ids === 'all' 
                                                            ? 'bg-indigo-50 text-indigo-600' 
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    All Active Employees
                                                </div>
                                                {employees
                                                    .filter(emp => {
                                                        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                                                        const idNum = (emp.employee_id_number || '').toLowerCase();
                                                        const query = employeeSearchQuery.toLowerCase();
                                                        return fullName.includes(query) || idNum.includes(query);
                                                    })
                                                    .map(emp => {
                                                        const isSelected = modalData.employee_ids.toString() === emp.id.toString();
                                                        return (
                                                            <div 
                                                                key={emp.id}
                                                                onClick={() => {
                                                                    setModalData({ ...modalData, employee_ids: emp.id.toString() });
                                                                    setIsEmployeeDropdownOpen(false);
                                                                    setEmployeeSearchQuery('');
                                                                }}
                                                                className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors ${
                                                                    isSelected 
                                                                        ? 'bg-indigo-50 text-indigo-600' 
                                                                        : 'text-slate-700 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                {emp.first_name} {emp.last_name} ({emp.employee_id_number})
                                                            </div>
                                                        );
                                                    })
                                                }
                                                {employees.filter(emp => {
                                                    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                                                    const idNum = (emp.employee_id_number || '').toLowerCase();
                                                    const query = employeeSearchQuery.toLowerCase();
                                                    return fullName.includes(query) || idNum.includes(query);
                                                }).length === 0 && (
                                                    <div className="px-4 py-3 text-xs text-slate-400 font-medium italic text-center">
                                                        No matching employees
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Reason */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason / Remarks</label>
                                    <textarea 
                                        rows="3"
                                        placeholder="Add justification or notes..."
                                        value={modalData.reason}
                                        onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none"
                                    />
                                </div>

                                {/* Submit Actions */}
                                <div className="flex gap-3 pt-4 border-t border-slate-50">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200/60 hover:bg-slate-100 transition-all text-center"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all text-center flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : 'Execute Grant'}
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

export default LeaveGranter;
