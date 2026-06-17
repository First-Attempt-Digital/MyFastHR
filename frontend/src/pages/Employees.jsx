import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, MoreVertical, Download, UserCheck, Mail, Building2, X, User, Users, Briefcase, IndianRupee, Calendar, MapPin, Smartphone, Clock, Shield, ChevronDown, Eye, Edit, Trash2, UserMinus, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getAssetUrl } from '../utils/api';
import DeleteSecurityModal from '../components/common/DeleteSecurityModal';
import { exportToCSV, exportToECR } from '../utils/exportUtils';

const InputField = ({ label, name, type = "text", placeholder, options, value, onChange, required = false, valueKey = "value", labelKey = "label" }) => (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label} {required && <span className="text-rose-500">*</span>}</label>
        {type === 'select' ? (
            <select
                name={name}
                required={required}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700"
                value={value}
                onChange={onChange}
            >
                {options.map(opt => (
                    <option key={typeof opt === 'string' ? opt : opt[valueKey]} value={typeof opt === 'string' ? opt : opt[valueKey]}>
                        {typeof opt === 'string' ? opt : opt[labelKey]}
                    </option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300"
            />
        )}
    </div>
); const EmployeeTableItem = ({ employee, onEdit, onView, onFire, onActivate, onDelete, isSelected, onSelectToggle }) => (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelectToggle}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                />
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden">
                    {employee.photo ? (
                        <img src={getAssetUrl(`/uploads/kyc/${employee.photo}`)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User size={20} strokeWidth={1.5} />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                        {employee.first_name} {employee.last_name}
                    </span>
                    <span className="text-xs text-slate-500 truncate">{employee.email}</span>
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {employee.employee_id_number || 'N/A'}
            </span>
        </td>
        <td className="px-6 py-4">
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">{employee.designation}</span>
                <span className="text-xs text-slate-400">{employee.department_name || 'Operations'}</span>
            </div>
        </td>
        <td className="px-6 py-4 text-center">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
                {employee.company_status || employee.status || 'Probation'}
            </span>
        </td>
        <td className="px-6 py-4 text-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${String(employee.status).toLowerCase() === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${String(employee.status).toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                {String(employee.status).toLowerCase() === 'active' ? 'Active' : 'Fired'}
            </span>
        </td>
        <td className="px-6 py-4 text-center text-xs text-slate-500 font-medium">
            {new Date(employee.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={() => onView(employee)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="View Profile"
                >
                    <Eye size={18} />
                </button>
                <button
                    onClick={() => onEdit(employee)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Edit Employee"
                >
                    <Edit size={18} />
                </button>
                <button
                    onClick={() => String(employee.status).toLowerCase() === 'active' ? onFire(employee.id) : onActivate(employee.id)}
                    className={`p-1.5 transition-all rounded-lg ${String(employee.status).toLowerCase() === 'active'
                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                    title={String(employee.status).toLowerCase() === 'active' ? "Deactivate" : "Activate"}
                >
                    {String(employee.status).toLowerCase() === 'active' ? <UserMinus size={18} /> : <UserCheck size={18} />}
                </button>
                <button
                    onClick={() => onDelete(employee.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </td>
    </tr>
);


const Employees = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    // Multi-Select and Bulk Action States
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

    // Delete Protection States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    // Bulk Import States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importError, setImportError] = useState(null);

    const currentUserRole = localStorage.getItem('user_role');
    const isCompanyAdmin = currentUserRole === 'company_admin' || currentUserRole === 'super_admin';

    // Advanced Filters States
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedGender, setSelectedGender] = useState('All');
    const [selectedDesignation, setSelectedDesignation] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState('All');

    // Helper to perform normalized alphanumeric comparisons for search filters (handles spacing like "F & B" vs "F&B", "Floor   Manager" vs "Floor Manager")
    const matchText = (val, filterVal) => {
        if (filterVal === 'All') return true;
        if (!val) return false;
        const clean = (str) => String(str).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return clean(val) === clean(filterVal);
    };

    // Helper to format string to Title Case/capitalize
    const formatLabel = (str) => {
        if (!str) return '';
        const trimmed = str.trim();
        if (!trimmed) return '';
        return trimmed.split(' ').map(word => {
            if (!word) return '';
            if (word.includes('/')) {
                return word.split('/').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('/');
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    };

    const uniqueDepartments = React.useMemo(() => {
        const depts = new Map(); // cleanName -> originalName
        const check = (e) => {
            const d = e.department_name || e.department || 'General';
            if (d) {
                const clean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const titleCased = formatLabel(d);
                if (!depts.has(clean)) {
                    depts.set(clean, titleCased);
                }
            }
        };
        if (Array.isArray(employees)) employees.forEach(check);
        return ['All', ...Array.from(depts.values()).sort()];
    }, [employees]);

    const uniqueLocations = React.useMemo(() => {
        const locs = new Map(); // cleanName -> originalName
        const check = (e) => {
            const l = e.office_location || 'Unassigned';
            if (l) {
                const clean = l.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const titleCased = formatLabel(l);
                if (!locs.has(clean)) {
                    locs.set(clean, titleCased);
                }
            }
        };
        if (Array.isArray(employees)) employees.forEach(check);
        return ['All', ...Array.from(locs.values()).sort()];
    }, [employees]);

    const uniqueDesignations = React.useMemo(() => {
        const desgs = new Map(); // cleanName -> originalName
        const check = (e) => {
            const d = e.designation || 'Specialist';
            if (d) {
                const clean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const titleCased = formatLabel(d);
                if (!desgs.has(clean)) {
                    desgs.set(clean, titleCased);
                }
            }
        };
        if (Array.isArray(employees)) employees.forEach(check);
        return ['All', ...Array.from(desgs.values()).sort()];
    }, [employees]);

    // Filter Logic
    const filteredEmployees = employees.filter(emp => {
        // 1. Department Filter
        if (!matchText(emp.department_name || emp.department || 'General', selectedDept)) {
            return false;
        }

        // 2. Status Filter
        if (selectedStatus !== 'All') {
            const empStatus = (emp.status || 'active').toLowerCase();
            if (selectedStatus === 'Active') {
                if (empStatus !== 'active') return false;
            } else if (selectedStatus === 'Inactive') {
                if (empStatus !== 'inactive' && empStatus !== 'fired') return false;
            }
        }

        // 3. Location Filter
        if (!matchText(emp.office_location || 'Unassigned', selectedLocation)) {
            return false;
        }

        // 4. Gender Filter
        if (selectedGender !== 'All') {
            const empGender = (emp.gender || 'Unspecified').toLowerCase();
            if (selectedGender === 'Others') {
                if (empGender === 'male' || empGender === 'female') return false;
            } else {
                if (empGender !== selectedGender.toLowerCase()) return false;
            }
        }

        // 5. Designation Filter
        if (!matchText(emp.designation || 'Specialist', selectedDesignation)) {
            return false;
        }

        return true;
    });


    const handleDownloadTemplate = () => {
        const csvContent =
            "First Name,Last Name,Email,Employee ID,Designation,Department,Shift,Location/Outlet,Phone,Gender,Date of Birth,Joining Date,Reporting Manager,Father Name,Mother Name,Spouse Name,Aadhaar Number,PAN Number,UAN Number,PF Number,ESI Number,Include PF,Include ESI,Include LWF,Payment Type,Bank Name,Bank Branch,Account Number,IFSC Code,Status,Probation Period,Confirmation Date,Emergency Contact Name,Emergency Contact Number\n" +
            "Amit,Sharma,amit@myfasthr.com,FAST-002,Software Engineer,Technology,Day Shift,Delhi,9876543210,Male,1995-08-15,2026-05-01,,Ramesh Sharma,Sita Sharma,,123456789012,ABCDE1234F,100123456789,DL/12345/67890,31123456789012,Yes,Yes,No,Bank Transfer,HDFC Bank,Sector 15,5010023456789,HDFC0000123,Probation,180,,Ramesh Sharma,9876543211\n" +
            "Sunita,Verma,sunita@myfasthr.com,FAST-003,HR Associate,Human Resources,Day Shift,Mumbai,8765432109,Female,1997-04-20,2026-05-10,,Suresh Verma,Gita Verma,,987654321098,FGHIJ5678K,100987654321,MH/54321/09876,41987654321098,Yes,No,No,Bank Transfer,ICICI Bank,Main Branch,001201234567,ICIC0000012,Confirmed,0,2026-05-10,Suresh Verma,8765432100\n";

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "FastHR_Employee_Template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            setImportError("Please select a CSV file first");
            return;
        }

        setIsUploading(true);
        setImportError(null);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await api.post('/employees/bulk-import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setImportResult(res);
            fetchEmployees(); // Refresh list
        } catch (err) {
            console.error('Import error:', err);
            setImportError(err.response?.data?.message || 'Failed to parse or import CSV data.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = {
            employee_id_number: 'Employee ID',
            first_name: 'First Name',
            last_name: 'Last Name',
            email: 'Email Address',
            phone: 'Phone Number',
            gender: 'Gender',
            date_of_birth: 'Date of Birth',
            designation: 'Designation',
            department_name: 'Department',
            joining_date: 'Joining Date',
            office_location: 'Location/Outlet',
            uan_number: 'UAN Number',
            pan_number: 'PAN Number',
            aadhaar_number: 'Aadhaar Number',
            pf_number: 'PF Number',
            esi_number: 'ESI Number',
            bank_name: 'Bank Name',
            bank_branch: 'Bank Branch',
            account_number: 'Account Number',
            ifsc_code: 'IFSC Code',
            base_salary: 'Base Salary',
            account_status: 'Status',
            created_at: 'Created At'
        };
        exportToCSV(filteredEmployees, `Employee_Directory_${new Date().toISOString().split('T')[0]}.csv`, headers);
        setShowExportDropdown(false);
    };

    const handleExportECR = () => {
        exportToECR(filteredEmployees, `EPFO_Payroll_ECR_${new Date().toISOString().split('T')[0]}.txt`);
        setShowExportDropdown(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, [searchTerm]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const cleanSearch = searchTerm.trim();
            const res = await api.get('/employees', { params: { search: cleanSearch } });
            const uniqueArr = [];
            const seen = new Set();
            (Array.isArray(res) ? res : []).forEach(emp => {
                if (emp && emp.id && !seen.has(emp.id)) {
                    seen.add(emp.id);
                    uniqueArr.push(emp);
                }
            });
            setEmployees(uniqueArr);
            setSelectedEmployeeIds([]); // Clear selection when list is updated/refetched
            setError(null);
        } catch (err) {
            console.error('Failed to fetch employees', err);
            setError(err.response?.data?.message || 'Failed to synchronize with server.');
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectToggle = (id) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAllToggle = () => {
        if (selectedEmployeeIds.length === filteredEmployees.length) {
            setSelectedEmployeeIds([]);
        } else {
            setSelectedEmployeeIds(filteredEmployees.map(emp => emp.id));
        }
    };

    const handleBulkFire = async () => {
        if (!await window.customConfirm(`Are you sure you want to deactivate the ${selectedEmployeeIds.length} selected employees?`, 'Bulk Deactivate')) return;
        setLoading(true);
        try {
            await Promise.all(selectedEmployeeIds.map(id => api.patch(`/employees/${id}/fire`)));
            setSelectedEmployeeIds([]);
            fetchEmployees();
        } catch (err) {
            window.customAlert(err.response?.data?.message || 'Bulk deactivation failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkActivate = async () => {
        if (!await window.customConfirm(`Are you sure you want to reactivate the ${selectedEmployeeIds.length} selected employees?`, 'Bulk Reactivate')) return;
        setLoading(true);
        try {
            await Promise.all(selectedEmployeeIds.map(id => api.patch(`/employees/${id}/activate`)));
            setSelectedEmployeeIds([]);
            fetchEmployees();
        } catch (err) {
            window.customAlert(err.response?.data?.message || 'Bulk activation failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!await window.customConfirm(`Are you sure you want to permanently delete the ${selectedEmployeeIds.length} selected employees? This action cannot be undone.`, 'Bulk Delete')) return;
        setLoading(true);
        try {
            await api.post('/employees/bulk-delete', { ids: selectedEmployeeIds });
            setSelectedEmployeeIds([]);
            fetchEmployees();
        } catch (err) {
            if (err.message !== 'Deletion cancelled by user.') {
                window.customAlert(err.response?.data?.message || 'Bulk deletion failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        if (editingEmployee) {
            await api.put(`/employees/${editingEmployee.id}`, data);
        } else {
            await api.post('/employees', data);
        }
        fetchEmployees();
    };

    const openEdit = (emp) => {
        navigate(`/employees/onboard?edit=${emp.id}`);
    };

    const openAdd = () => {
        navigate('/employees/onboard');
    };

    const handleFire = async (id) => {
        if (!await window.customConfirm('Are you sure you want to deactivate this employee?', 'Deactivate Member')) return;
        try {
            await api.patch(`/employees/${id}/fire`);
            fetchEmployees();
        } catch (err) {
            window.customAlert(err.response?.data?.message || 'Fire protocol failed.');
        }
    };

    const handleActivate = async (id) => {
        if (!await window.customConfirm('Are you sure you want to reactivate this employee?', 'Reactivate Member')) return;
        try {
            await api.patch(`/employees/${id}/activate`);
            fetchEmployees();
        } catch (err) {
            window.customAlert(err.response?.data?.message || 'Reactivation failed.');
        }
    };

    const handleDelete = async (id) => {
        if (!await window.customConfirm('Are you sure you want to permanently delete this employee? This action cannot be undone.', 'Delete Member')) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err) {
            if (err.message !== 'Deletion cancelled by user.') {
                window.customAlert(err.response?.data?.message || 'Deletion failed.');
            }
        }
    };

    const handleView = (emp) => {
        navigate(`/profile?id=${emp.id}`);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-outfit bg-slate-50/30 min-h-screen">

            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your team and their information in one place.</p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportDropdown(!showExportDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
                        >
                            <Download size={18} className="text-slate-400" /> Export
                        </button>
                        {showExportDropdown && (
                            <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 min-w-[200px] flex flex-col gap-1">
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Export Directory (CSV)
                                </button>
                                <button
                                    onClick={handleExportECR}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    EPFO Payroll(txt)
                                </button>
                            </div>
                        )}
                    </div>
                    {isCompanyAdmin && (
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl text-sm font-semibold text-indigo-600 transition-all"
                        >
                            <Upload size={18} className="text-indigo-500" /> Import (CSV)
                        </button>
                    )}
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                    >
                        <Plus size={20} /> Add New Member
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, role, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilterOptions(!showFilterOptions)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showFilterOptions
                                ? 'bg-indigo-50 border border-indigo-200 text-indigo-650 shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                                }`}
                        >
                            <Filter size={16} /> Filters
                        </button>
                        <div className="h-8 w-[1px] bg-slate-100 hidden md:block mx-2" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
                            {filteredEmployees.length} Members
                        </span>
                    </div>
                </div>

                {/* Animated Dropdown Filter Options */}
                <AnimatePresence>
                    {showFilterOptions && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 overflow-hidden pt-4 mt-4 border-t border-slate-100"
                        >
                            {/* Department Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                                <select
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 cursor-pointer"
                                >
                                    {uniqueDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                             </div>

                            {/* Designation Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
                                <select
                                    value={selectedDesignation}
                                    onChange={(e) => setSelectedDesignation(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 cursor-pointer"
                                >
                                    {uniqueDesignations.map(desg => (
                                        <option key={desg} value={desg}>{desg}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 cursor-pointer"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive / Fired</option>
                                </select>
                            </div>

                            {/* Location Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location/Outlet</label>
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 cursor-pointer"
                                >
                                    {uniqueLocations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Gender Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                                <select
                                    value={selectedGender}
                                    onChange={(e) => setSelectedGender(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 cursor-pointer"
                                >
                                    <option value="All">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            disabled={loading || filteredEmployees.length === 0}
                                            checked={filteredEmployees.length > 0 && selectedEmployeeIds.length === filteredEmployees.length}
                                            ref={input => {
                                                if (input) {
                                                    input.indeterminate = selectedEmployeeIds.length > 0 && selectedEmployeeIds.length < filteredEmployees.length;
                                                }
                                            }}
                                            onChange={handleSelectAllToggle}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                                        />
                                        <span>Employee Name</span>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Company Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-[5px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Synchronizing...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-400 text-xs font-bold italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-sm font-bold text-rose-500 uppercase tracking-tight">{error}</span>
                                            <button
                                                onClick={fetchEmployees}
                                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                            >
                                                Retry Connection
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-450 text-xs font-bold italic">No matching directory records found.</td>
                                </tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <EmployeeTableItem
                                        key={emp.id}
                                        employee={emp}
                                        onEdit={openEdit}
                                        onView={handleView}
                                        onFire={handleFire}
                                        onActivate={handleActivate}
                                        onDelete={handleDelete}
                                        isSelected={selectedEmployeeIds.includes(emp.id)}
                                        onSelectToggle={() => handleSelectToggle(emp.id)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredEmployees.length > 0 && (
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Records: 1-{filteredEmployees.length}</p>
                        <div className="flex gap-2">
                            <button className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 cursor-not-allowed uppercase">Prev</button>
                            <button className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 cursor-not-allowed uppercase">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions Floating Bar */}
            <AnimatePresence>
                {selectedEmployeeIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex items-center gap-8 z-50 border border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-black shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                {selectedEmployeeIds.length}
                            </span>
                            <span className="text-xs font-bold text-slate-300">Selected</span>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBulkFire}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-white transition-all rounded-xl text-xs font-bold border border-amber-500/20 active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer"
                            >
                                <UserMinus size={14} /> Deactivate
                            </button>
                            <button
                                onClick={handleBulkActivate}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-50 hover:text-white transition-all rounded-xl text-xs font-bold border border-emerald-500/20 active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer"
                            >
                                <UserCheck size={14} /> Activate
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 transition-all rounded-xl text-xs font-black shadow-[0_4px_15px_rgba(244,63,94,0.35)] active:scale-95 hover:scale-[1.03] cursor-pointer"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <button
                            onClick={() => setSelectedEmployeeIds([])}
                            className="text-xs font-black text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Upload Modal */}
            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-outfit">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => {
                                if (!isUploading) {
                                    setIsImportModalOpen(false);
                                    setImportFile(null);
                                    setImportResult(null);
                                    setImportError(null);
                                }
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Bulk Import Employees</h2>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Upload workforce directory via CSV</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!isUploading) {
                                            setIsImportModalOpen(false);
                                            setImportFile(null);
                                            setImportResult(null);
                                            setImportError(null);
                                        }
                                    }}
                                    className="p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-5">
                                {!importResult ? (
                                    <>
                                        <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
                                            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1">Import Instructions</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                                CSV headers support fields like <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-150 text-[10px] font-black text-indigo-700">First Name</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-150 text-[10px] font-black text-indigo-700">Last Name</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-150 text-[10px] font-black text-indigo-700">Designation</code>, and <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-150 text-[10px] font-black text-indigo-700">Location/Outlet</code>. Departments not already existing in the portal will be auto-created on the fly.
                                            </p>
                                            <button
                                                onClick={handleDownloadTemplate}
                                                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200/80 rounded-lg text-[10px] font-black text-indigo-700 hover:bg-indigo-50/50 transition-all uppercase tracking-wider"
                                            >
                                                <Download size={12} /> Download CSV Template
                                            </button>
                                        </div>

                                        {importError && (
                                            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                                                <X size={16} className="shrink-0" />
                                                <span>{importError}</span>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select CSV File</label>
                                            <div
                                                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer transition-colors relative"
                                                onClick={() => document.getElementById('csvFileInput').click()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files[0];
                                                    if (file && file.name.endsWith('.csv')) {
                                                        setImportFile(file);
                                                        setImportError(null);
                                                    } else {
                                                        setImportError("Only .csv files are supported");
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    id="csvFileInput"
                                                    accept=".csv"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setImportFile(file);
                                                            setImportError(null);
                                                        }
                                                    }}
                                                />
                                                <Upload size={32} className="text-slate-400 mb-2" />
                                                {importFile ? (
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-slate-800">{importFile.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{(importFile.size / 1024).toFixed(2)} KB</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-slate-600">Click to upload or drag & drop</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Supports CSV files up to 5MB</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsImportModalOpen(false);
                                                    setImportFile(null);
                                                    setImportError(null);
                                                }}
                                                disabled={isUploading}
                                                className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200/60 hover:bg-slate-100 transition-all text-center disabled:opacity-55"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleImportSubmit}
                                                disabled={isUploading || !importFile}
                                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-55"
                                            >
                                                {isUploading ? (
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : 'Execute Import'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-3">
                                                <UserCheck size={24} />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800">Import Process Completed</h3>
                                            <p className="text-xs text-slate-500 mt-1">Workforce directory has been updated</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl text-center">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Successfully Imported</p>
                                                <p className="text-2xl font-black text-emerald-700 mt-1">{importResult.successCount}</p>
                                            </div>
                                            <div className="p-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl text-center">
                                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Failed / Skipped</p>
                                                <p className="text-2xl font-black text-rose-700 mt-1">{importResult.failedCount}</p>
                                            </div>
                                        </div>

                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Failed Rows Log</label>
                                                <div className="border border-slate-200/80 rounded-xl bg-slate-50 p-3 max-h-[180px] overflow-y-auto font-mono text-[10px] text-slate-600 space-y-1">
                                                    {importResult.errors.map((err, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="text-rose-500 shrink-0">•</span>
                                                            <span>{err}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsImportModalOpen(false);
                                                setImportFile(null);
                                                setImportResult(null);
                                            }}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all text-center"
                                        >
                                            Close Log
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Employees;
