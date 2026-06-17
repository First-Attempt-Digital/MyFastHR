import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ChevronLeft, 
    ChevronRight, 
    Check, 
    X, 
    User, 
    Briefcase, 
    FileText, 
    CreditCard, 
    Plus,
    Calendar,
    Search,
    Edit2,
    Trash2
} from 'lucide-react';
import api from '../utils/api';

const SearchableSelect = ({ label, name, options, value, onChange, onEdit, placeholder = "---Select---", required = false, error = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [openUpwards, setOpenUpwards] = useState(false);
    const containerRef = React.useRef(null);
    
    // Detect if dropdown should open upwards
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 300px below, open upwards
            setOpenUpwards(spaceBelow < 300);
        }
    }, [isOpen]);

    // Filter out inactive options for display, but keep the selected one if it's inactive
    const visibleOptions = options.filter(opt => {
        if (typeof opt === 'string') return true;
        // Default to active: true if property is missing
        const isActive = opt.active !== false;
        return isActive || String(opt.value) === String(value);
    });

    const filteredOptions = visibleOptions.filter(opt => 
        (typeof opt === 'string' ? opt : opt.label).toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = options.find(opt => String(typeof opt === 'string' ? opt : opt.value) === String(value));
    const displayValue = selectedLabel ? (typeof selectedLabel === 'string' ? selectedLabel : selectedLabel.label) : (value || placeholder);

    return (
        <div ref={containerRef} className="flex flex-col gap-1.5 relative" name={name}>
            <div className="flex items-center justify-between pr-1">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${error ? 'text-rose-600' : 'text-slate-500'}`}>
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
                {onEdit && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                        <Edit2 size={12} />
                    </button>
                )}
            </div>

            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-2 bg-white border rounded text-sm flex items-center justify-between cursor-pointer transition-all ${
                    error ? 'border-rose-400 ring-2 ring-rose-50 bg-rose-50/30' : 'border-slate-300 hover:border-indigo-400'
                }`}
            >
                <span className={value ? "text-slate-700" : "text-slate-400"}>{displayValue}</span>
                <span className={`text-[8px] ${error ? 'text-rose-400' : 'text-slate-400'}`}>▼</span>
            </div>

            {error && (
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 ml-1 animate-in slide-in-from-top-1">Please fill this section</span>
            )}

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={`absolute left-0 w-full bg-white border border-slate-300 rounded shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 ${
                        openUpwards ? 'bottom-[100%] mb-1' : 'top-[100%] mt-1'
                    }`}>
                        <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-3 pr-8 py-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            <div 
                                className="px-4 py-2 text-sm text-slate-500 hover:bg-indigo-50 cursor-pointer"
                                onClick={() => {
                                    onChange({ target: { name, value: '' } });
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                ---Select---
                            </div>
                            {filteredOptions.map((opt, i) => {
                                const val = typeof opt === 'string' ? opt : opt.value;
                                const lbl = typeof opt === 'string' ? opt : opt.label;
                                return (
                                    <div 
                                        key={i}
                                        className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors"
                                        onClick={() => {
                                            onChange({ target: { name, value: val } });
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                    >
                                        {lbl}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const ClassicDatePicker = ({ label, name, value, onChange, required = false, error = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i);

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const days = getDaysInMonth(viewDate.getMonth(), viewDate.getFullYear());
    const firstDay = getFirstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
    
    return (
        <div className="flex flex-col gap-1.5 relative" name={name}>
            <label className={`text-[11px] font-bold uppercase tracking-wider ${error ? 'text-rose-600' : 'text-slate-500'}`}>
                {label} {required && <span className="text-rose-500">*</span>}
            </label>

            <input 
                type="text" 
                readOnly
                required={required}
                value={value}
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-2 bg-white border rounded text-sm cursor-pointer transition-all ${
                    error ? 'border-rose-400 ring-2 ring-rose-50 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-400'
                }`}
                placeholder="dd-mm-yyyy"
            />

            {error && (
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 ml-1 animate-in slide-in-from-top-1">Please fill this section</span>
            )}
            
            {isOpen && (
                <div className="absolute top-[100%] left-0 mt-1 bg-[#f0f7ff] border border-[#a3c0e8] rounded shadow-2xl z-50 w-[280px] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="bg-gradient-to-b from-[#8eb3e2] to-[#5d8cc9] p-2 flex items-center justify-between">
                        <button onClick={handlePrevMonth} className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/40">
                            <ChevronLeft size={14} />
                        </button>
                        <div className="flex gap-1">
                            <select 
                                value={viewDate.getMonth()} 
                                onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value)))}
                                className="bg-white text-[11px] border border-slate-300 px-1 rounded h-5 focus:outline-none"
                            >
                                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            <select 
                                value={viewDate.getFullYear()} 
                                onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth()))}
                                className="bg-white text-[11px] border border-slate-300 px-1 rounded h-5 focus:outline-none"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <button onClick={handleNextMonth} className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/40">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                    
                    {/* Weekdays */}
                    <div className="grid grid-cols-7 text-center py-1 bg-white border-b border-slate-200">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <span key={d} className="text-[10px] font-bold text-slate-800">{d}</span>
                        ))}
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 p-1 bg-white">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${day.toString().padStart(2, '0')}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${viewDate.getFullYear()}`;
                            const isSelected = value === dateStr;
                            const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
                            
                            return (
                                <div 
                                    key={day} 
                                    onClick={() => {
                                        onChange({ target: { name, value: dateStr } });
                                        setIsOpen(false);
                                    }}
                                    className={`h-8 flex items-center justify-center text-xs border border-[#dce9f9] hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all ${
                                        isSelected ? 'bg-indigo-600 text-white font-bold border-indigo-700' : 
                                        isToday ? 'bg-yellow-100 font-bold border-yellow-400' : 'text-slate-600'
                                    }`}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-white p-2 border-t border-slate-100 flex justify-center">
                        <button 
                            onClick={() => {
                                const today = new Date();
                                const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
                                onChange({ target: { name, value: dateStr } });
                                setIsOpen(false);
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const OptionManagerModal = ({ title, options, onSave, onClose }) => {
    const [localOptions, setLocalOptions] = useState([...options]);
    const [newOption, setNewOption] = useState({ label: '', value: '', active: true });

    const handleAdd = () => {
        if (newOption.label.trim()) {
            const val = newOption.label.toLowerCase().replace(/\s+/g, '_');
            setLocalOptions([...localOptions, { label: newOption.label, value: val, active: true }]);
            setNewOption({ label: '', value: '', active: true });
        }
    };

    const handleDelete = (index) => {
        setLocalOptions(localOptions.filter((_, i) => i !== index));
    };

    const handleToggle = (index) => {
        const updated = [...localOptions];
        updated[index].active = !updated[index].active;
        setLocalOptions(updated);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>
                
                <div className="p-0 max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">Description</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 text-center">Active</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {localOptions.map((opt, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 text-sm text-slate-700 border-r border-slate-200 font-medium">{opt.label}</td>
                                    <td className="px-6 py-3 border-r border-slate-200 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={opt.active} 
                                            onChange={() => handleToggle(i)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => handleDelete(i)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-slate-50/30">
                                <td className="px-6 py-3 border-r border-slate-200">
                                    <input 
                                        type="text" 
                                        placeholder="Add description..."
                                        value={newOption.label}
                                        onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-300"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                                    />
                                </td>
                                <td className="px-6 py-3 border-r border-slate-200 text-center">
                                    <div className="w-4 h-4 rounded border-2 border-slate-200 mx-auto" />
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <button onClick={handleAdd} className="p-1.5 text-indigo-400 hover:text-indigo-600">
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                    <button onClick={() => onSave(localOptions)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const SuccessModal = ({ onClose, isEdit }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-10 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 relative z-10">
                        <Check size={32} strokeWidth={3} />
                    </div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                    {isEdit ? 'Profile Updated!' : 'Onboarding Successful!'}
                </h3>
                <p className="text-sm text-slate-500 mb-10 leading-relaxed font-medium">
                    {isEdit 
                        ? 'Employee details have been successfully updated in the system.' 
                        : 'The new employee has been successfully added to the system and is ready to start.'}
                </p>
                
                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    Back to Employee Directory
                </button>
            </div>
        </div>
    );
};

const formatErrorMessage = (msg) => {
    if (!msg) return 'An unexpected error occurred.';
    
    // Check for duplicate employee ID
    if (msg.includes('employee_id_number') || msg.includes('employees.employee_id_number')) {
        return 'An employee with this Employee Number already exists. Please choose a different Employee Number.';
    }
    
    // Check for duplicate email
    if (msg.includes('users_email_unique') || msg.includes('users.email') || msg.includes("key 'email'")) {
        return 'This email address is already registered in the system. Please use a unique email address.';
    }
    
    // Check for general duplicate entry
    if (msg.toLowerCase().includes('duplicate entry')) {
        const match = msg.match(/Duplicate entry '([^']+)'/);
        if (match) {
            return `Duplicate entry: "${match[1]}" already exists.`;
        }
        return 'A record with these details already exists.';
    }
    
    // Check for foreign key failures
    if (msg.toLowerCase().includes('foreign key constraint fails')) {
        return 'Invalid reference selected. Please verify that the selected department, manager, or shift exists.';
    }

    // Check if it's a raw SQL query
    if (msg.toLowerCase().includes('insert into') || msg.toLowerCase().includes('update `employees`')) {
        const parts = msg.split(' - ');
        if (parts.length > 1) {
            return parts[parts.length - 1];
        }
        return 'A database error occurred while saving employee details. Please check the fields and try again.';
    }
    
    return msg;
};

const ErrorModal = ({ onClose, message }) => {
    const cleanMessage = formatErrorMessage(message);
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-20" />
                    <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-200 relative z-10">
                        <X size={32} strokeWidth={3} />
                    </div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                    Action Failed
                </h3>
                <p className="text-sm text-slate-650 mb-8 leading-relaxed font-semibold bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50 text-center break-words">
                    {cleanMessage}
                </p>
                
                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
};

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const [loading, setLoading] = useState(false);
    const [managers, setManagers] = useState([]);
    const [nextSequence, setNextSequence] = useState('04030001');
    const [showSeriesModal, setShowSeriesModal] = useState(false);
    const [numberSeries, setNumberSeries] = useState([]);
    const [editingSeries, setEditingSeries] = useState(null);
    const [editSeriesData, setEditSeriesData] = useState({ prefix: '', padding: 4, format: '{prefix}{number}' });
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftData, setDraftData] = useState(null);
    
    // Custom Options State
    const [fieldOptions, setFieldOptions] = useState({
        designation: [
            { label: 'Senior Software Engineer', value: 'senior_software_engineer', active: true },
            { label: 'Product Manager', value: 'product_manager', active: true },
            { label: 'HR Manager', value: 'hr_manager', active: true }
        ],
        location: [
            { label: 'Remote', value: 'remote', active: true },
            { label: 'Headquarters', value: 'headquarters', active: true },
            { label: 'Mumbai Office', value: 'mumbai_office', active: true }
        ],
        department: [
            { label: 'Technology', value: 'technology', active: true },
            { label: 'Human Resources', value: 'human_resources', active: true },
            { label: 'Operations', value: 'operations', active: true }
        ],
        shift: [
            { label: 'Day Shift', value: 'day_shift', active: true },
            { label: 'Night Shift', value: 'night_shift', active: true },
            { label: 'Rotation', value: 'rotation', active: true }
        ],
        bank_name: [
            { label: 'HDFC Bank', value: 'hdfc_bank', active: true },
            { label: 'ICICI Bank', value: 'icici_bank', active: true },
            { label: 'State Bank of India', value: 'sbi', active: true },
            { label: 'Axis Bank', value: 'axis_bank', active: true }
        ],
        bank_branch: [
            { label: 'Main Branch', value: 'main_branch', active: true },
            { label: 'Sector 15', value: 'sector_15', active: true },
            { label: 'Gurugram', value: 'gurugram', active: true }
        ]
    });

    const [activeOptionManager, setActiveOptionManager] = useState(null); // { field, title }
    const [errors, setErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [globalRules, setGlobalRules] = useState([]);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [leaveTypes, setLeaveTypes] = useState([]);
    
    const [formData, setFormData] = useState({
        // Step 1: Basic Information
        employee_number_series: '',
        employee_id_number: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        aadhaar_number: '',
        gender: 'Male',
        manager_id: '',
        status: '',
        joining_date: '',
        referred_by: '',
        probation_period: '180',
        confirmation_date: '',
        email: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
        father_name: '',
        spouse_name: '',
        mother_name: '',

        // Step 2: Employee Position
        designation: '',
        location: '',
        department: '',
        department_id: '',
        contract_start_date: '',
        contract_end_date: '',
        shift: '',
        shift_id: '',

        // Step 3: Statutory Info
        pan_number: '',
        include_pf: true,
        include_esi: true,
        include_lwf: true,
        include_gratuity: true,
        pf_number: '',
        uan_number: '',
        pf_excess_contribution: 'ceiling', // 'ceiling' or 'above'
        esi_number: '',

        // Step 4: Payment Mode
        payment_type: '',
        bank_name: '',
        bank_branch: '',
        account_number: '',
        ifsc_code: '',

        // Leave Entitlements
        initial_leaves: {},

        // Role settings
        role_name: 'employee'
    });

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const savedData = localStorage.getItem('onboarding_draft_data');
        const savedStep = localStorage.getItem('onboarding_draft_step');
        
        if (savedData && !editId) {
            try {
                const parsed = JSON.parse(savedData);
                // Only show modal if there's actual data beyond defaults
                const hasData = Object.entries(parsed).some(([key, val]) => {
                    if (key === 'gender' && val === 'Male') return false;
                    if (key === 'probation_period' && val === '180') return false;
                    return val !== '' && val !== false && val !== null;
                });
                
                if (hasData) {
                    setDraftData({ data: parsed, step: parseInt(savedStep || '1') });
                    setShowDraftModal(true);
                }
            } catch (err) {
                console.error('Failed to parse onboarding draft:', err);
                localStorage.removeItem('onboarding_draft_data');
                localStorage.removeItem('onboarding_draft_step');
            }
        }
        
        // Handle step deep-linking from URL
        const stepParam = searchParams.get('step');
        if (stepParam) {
            setCurrentStep(parseInt(stepParam));
        }

        setIsInitialized(true);
    }, [editId, searchParams]);

    useEffect(() => {
        if (editId) {
            fetchEmployeeToEdit();
        }
    }, [editId]);

    useEffect(() => {
        const fetchGlobalRules = async () => {
            try {
                const res = await api.get('/payroll/global-rules');
                setGlobalRules(res || []);
            } catch (err) {
                console.error('Failed to fetch global rules on onboarding:', err);
            }
        };
        fetchGlobalRules();
    }, []);

    const fetchEmployeeToEdit = async () => {
        try {
            setLoading(true);
            
            // Fetch managers first to ensure dropdowns can map names correctly
            const managersRes = await api.get('/employees/managers');
            const currentManagers = managersRes || [];
            setManagers(currentManagers);

            const res = await api.get(`/employees/${editId}?t=${Date.now()}`);
            
            let employeeLeaves = {};
            try {
                const balances = await api.get('/leaves/all-balances');
                const empBal = balances.find(b => String(b.id) === String(editId));
                if (empBal && empBal.balances) {
                    empBal.balances.forEach(b => {
                        employeeLeaves[b.type_id] = Number((b.allocated / 12).toFixed(2));
                    });
                }
            } catch (balErr) {
                console.error('Failed to fetch employee leave balances:', balErr);
            }

            const formatDate = (d) => {
                if (!d) return '';
                if (String(d).includes('1899') || String(d).includes('0000-00-00')) return '';
                // 1. Already dd-mm-yyyy?
                if (/^\d{2}-\d{2}-\d{4}/.test(d)) return d.split(' ')[0];
                // 2. SQL yyyy-mm-dd?
                if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
                    const [y, m, day] = d.split('T')[0].split('-');
                    return `${day}-${m}-${y}`;
                }
                return d;
            };

            // Infer number series
            let series = 'Manual Entry';
            if (res.employee_id_number?.startsWith('P')) series = 'Permanent Employees';
            else if (res.employee_id_number?.startsWith('T')) series = 'Temporary Employees';

            setFormData(prev => ({
                ...prev,
                ...res,
                employee_number_series: series,
                first_name: res.first_name || '',
                last_name: res.last_name || '',
                aadhaar_number: res.aadhaar_number || '',
                email: res.email || '',
                phone: res.phone || '',
                emergency_contact_name: res.emergency_contact_name || '',
                emergency_contact_number: res.emergency_contact_number || '',
                father_name: res.father_name || '',
                spouse_name: res.spouse_name || '',
                mother_name: res.mother_name || '',
                location: res.office_location || res.location || '',
                date_of_birth: formatDate(res.date_of_birth),
                joining_date: formatDate(res.joining_date),
                contract_start_date: formatDate(res.contract_start_date),
                contract_end_date: formatDate(res.contract_end_date),
                confirmation_date: formatDate(res.confirmation_date),
                manager_id: res.manager_id ? String(res.manager_id) : '',
                referred_by: res.referred_by ? String(res.referred_by) : '',
                status: res.company_status || res.status || '',
                designation: res.designation || '',
                department: res.department_name || res.department || '',
                department_id: res.department_id || '',
                shift: res.shift_name || res.shift || '',
                shift_id: res.shift_id || '',
                pan_number: res.pan_number || '',
                include_pf: !!res.include_pf,
                include_esi: !!res.include_esi,
                include_lwf: !!res.include_lwf,
                include_gratuity: !!res.include_gratuity,
                pf_number: res.pf_number || '',
                uan_number: res.uan_number || '',
                pf_excess_contribution: (res.pf_excess_contribution === 'above' || res.pf_excess_contribution === 1 || res.pf_excess_contribution === true) ? 'above' : 'ceiling',
                esi_number: res.esi_number || '',
                payment_type: res.payment_type || '',
                bank_name: res.bank_name || '',
                bank_branch: res.bank_branch || '',
                account_number: res.account_number || '',
                ifsc_code: res.ifsc_code || '',
                initial_leaves: employeeLeaves,
                role_name: res.role_name || 'employee'
            }));
        } catch (err) {
            console.error('Failed to fetch employee for edit:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreDraft = () => {
        if (draftData) {
            setFormData(draftData.data);
            setCurrentStep(draftData.step);
        }
        setShowDraftModal(false);
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem('onboarding_draft_data');
        localStorage.removeItem('onboarding_draft_step');
        setDraftData(null);
        setShowDraftModal(false);
    };

    useEffect(() => {
        // Skip saving if not initialized or draft modal is active to prevent overwriting
        if (!isInitialized || showDraftModal) return;

        const timer = setTimeout(() => {
            localStorage.setItem('onboarding_draft_data', JSON.stringify(formData));
            localStorage.setItem('onboarding_draft_step', currentStep.toString());
        }, 1000); // Debounce to save every second

        return () => clearTimeout(timer);
    }, [formData, currentStep, isInitialized, showDraftModal]);

    useEffect(() => {
        fetchManagers();
        fetchOnboardingOptions();
    }, []);

    const fetchManagers = async () => {
        try {
            const res = await api.get('/employees/managers');
            setManagers(res || []);
        } catch (err) {
            console.error('Failed to fetch managers', err);
        }
    };

    const fetchOnboardingOptions = async () => {
        try {
            const [designations, locations, depts, shifts, activeLeaves] = await Promise.all([
                api.get('/employees/options/designation').catch(() => []),
                api.get('/employees/options/office_location').catch(() => []),
                api.get('/org/departments').catch(() => []),
                api.get('/attendance/shift-list').catch(() => []),
                api.get('/leaves/types').catch(() => [])
            ]);

            setLeaveTypes(activeLeaves || []);

            if (activeLeaves && activeLeaves.length > 0 && !editId) {
                setFormData(prev => {
                    const leavesInit = { ...prev.initial_leaves };
                    activeLeaves.forEach(lt => {
                        if (leavesInit[lt.id] === undefined) {
                            leavesInit[lt.id] = Number((lt.days_per_year / 12).toFixed(2));
                        }
                    });
                    return { ...prev, initial_leaves: leavesInit };
                });
            }

            setFieldOptions(prev => ({
                ...prev,
                designation: Array.isArray(designations) && designations.length > 0 
                    ? designations.map(d => ({ label: d, value: d, active: true })) 
                    : prev.designation,
                location: Array.isArray(locations) && locations.length > 0 
                    ? locations.map(l => ({ label: l, value: l, active: true })) 
                    : prev.location,
                department: Array.isArray(depts) && depts.length > 0 
                    ? depts.map(d => ({ label: d.name, value: d.name, id: d.id, active: true })) 
                    : prev.department,
                shift: Array.isArray(shifts) && shifts.length > 0 
                    ? shifts.map(s => ({ label: s.name, value: s.name, id: s.id, active: true })) 
                    : prev.shift
            }));
        } catch (err) {
            console.error('Failed to fetch onboarding options:', err);
        }
    };

    const fetchNextSequence = async () => {
        try {
            const res = await api.get('/settings/number-series');
            const seriesData = Array.isArray(res) ? res : (res.data || []);
            setNumberSeries(seriesData);
            
            // Logic to determine preview sequence for the selected series
            const selected = seriesData.find(s => s.name === formData.employee_number_series);
            if (selected && !editId) {
                // Next number is the Max of (Count + 1) OR (Manual Starting Number + 1)
                const nextNum = Math.max((selected.current_count || 0) + 1, (selected.current_number || 0) + 1);
                const paddedNum = nextNum.toString().padStart(selected.padding || 0, '0');
                
                let previewId = '';
                const format = selected.format || '{prefix}{number}';
                
                if (format.includes('{number}')) {
                    previewId = format
                        .replace('{prefix}', selected.prefix || '')
                        .replace('{number}', paddedNum);
                } else {
                    const base = format.includes('{prefix}') 
                        ? format.replace('{prefix}', selected.prefix || '')
                        : format;
                    previewId = base + paddedNum;
                }
                
                setFormData(prev => ({ ...prev, employee_id_number: previewId }));
            }
        } catch (err) {
            console.error('Failed to fetch number series:', err);
        }
    };

    const fetchNumberSeries = async () => {
        try {
            const res = await api.get('/settings/number-series');
            const data = Array.isArray(res) ? res : (res.data || []);
            setNumberSeries(data);
        } catch (err) {
            console.error('Failed to fetch number series:', err);
        }
    };

    const handleEditSeries = (series) => {
        if (!series) {
            setEditingSeries(null);
            return;
        }
        setEditingSeries(series.id);
        
        // Generate a default format preview if none exists
        const nextNum = (series.current_count || 0) + 1;
        const paddedNum = nextNum.toString().padStart(series.padding || 0, '0');
        const defaultFormat = series.format || '{prefix}{number}';
        const preview = defaultFormat.replace('{prefix}', series.prefix || '').replace('{number}', paddedNum);

        setEditSeriesData({
            name: series.name,
            prefix: series.prefix || '',
            padding: series.padding || 0,
            format: series.format || '{prefix}{number}',
            current_number: series.current_number || 0,
            preview: preview
        });
    };

    const handleSaveSeries = async () => {
        try {
            setLoading(true);
            
            // Final check: Extract starting number if user typed a full ID
            let finalData = { ...editSeriesData };
            const prefix = finalData.prefix || '';
            const padding = parseInt(finalData.padding) || 0;
            
            if (finalData.format && !finalData.format.includes('{number}')) {
                const val = finalData.format;
                const numericPart = val.substring(prefix.length);
                if (/^\d+$/.test(numericPart) && numericPart.length === padding) {
                    finalData.current_number = Math.max(0, parseInt(numericPart) - 1);
                    finalData.format = '{prefix}{number}';
                }
            }

            await api.put(`/settings/number-series/${editingSeries}`, finalData);
            setEditingSeries(null);
            await fetchNumberSeries();
            await fetchNextSequence();
        } catch (err) {
            console.error('Failed to update series:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNextSequence();
    }, []);

    useEffect(() => {
        if (showSeriesModal) {
            fetchNumberSeries();
        }
    }, [showSeriesModal]);

    useEffect(() => {
        // Don't auto-generate if we are restoring a draft
        if (showDraftModal || !isInitialized) return;
        fetchNextSequence();
    }, [formData.employee_number_series, showDraftModal, isInitialized]);

    useEffect(() => {
        if (formData.joining_date && formData.probation_period) {
            try {
                const [day, month, year] = formData.joining_date.split('-').map(Number);
                const joinDate = new Date(year, month - 1, day);
                
                if (!isNaN(joinDate.getTime())) {
                    const confirmationDate = new Date(joinDate);
                    confirmationDate.setDate(joinDate.getDate() + parseInt(formData.probation_period || 0));
                    
                    const d = confirmationDate.getDate().toString().padStart(2, '0');
                    const m = (confirmationDate.getMonth() + 1).toString().padStart(2, '0');
                    const y = confirmationDate.getFullYear();
                    
                    setFormData(prev => ({ ...prev, confirmation_date: `${d}-${m}-${y}` }));
                }
            } catch (err) {
                console.error('Failed to calculate confirmation date', err);
            }
        }
    }, [formData.joining_date, formData.probation_period]);

    const hasPfRule = globalRules.some(r => !!r.is_active && (r.rule_name.toLowerCase().includes('pf') || r.rule_name.toLowerCase().includes('provident')));
    const hasEsiRule = globalRules.some(r => !!r.is_active && (r.rule_name.toLowerCase().includes('esic') || r.rule_name.toLowerCase().includes('esi') || r.rule_name.toLowerCase().includes('insurance')));
    const hasLwfRule = globalRules.some(r => !!r.is_active && r.rule_name.toLowerCase().includes('lwf'));
    const hasGratuityRule = globalRules.some(r => !!r.is_active && r.rule_name.toLowerCase().includes('gratuity'));

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let extraFields = {};
        if (name === 'department') {
            const selectedDept = fieldOptions.department?.find(d => d.value === value);
            extraFields.department_id = selectedDept ? selectedDept.id : '';
        } else if (name === 'shift') {
            const selectedShift = fieldOptions.shift?.find(s => s.value === value);
            extraFields.shift_id = selectedShift ? selectedShift.id : '';
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...extraFields
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const steps = [
        { id: 1, title: 'BASIC INFORMATION', icon: User },
        { id: 2, title: 'EMPLOYEE POSITION', icon: Briefcase },
        { id: 3, title: 'STATUTORY INFO', icon: FileText },
        { id: 4, title: 'PAYMENT MODE', icon: CreditCard },
        { id: 5, title: 'LEAVE ENTITLEMENT', icon: Calendar }
    ];

    const validateStep = (step) => {
        const newErrors = {};
        
        if (step === 1) {
            if (!formData.employee_number_series) newErrors.employee_number_series = true;
            if (!formData.employee_id_number) newErrors.employee_id_number = true;
            if (!formData.first_name) newErrors.first_name = true;
            if (!formData.last_name) newErrors.last_name = true;
            if (!formData.status) newErrors.status = true;
            if (!formData.joining_date) newErrors.joining_date = true;
            if (!formData.phone) newErrors.phone = true;
            if (!formData.probation_period) newErrors.probation_period = true;
        } else if (step === 2) {
            if (!formData.designation) newErrors.designation = true;
            if (!formData.location) newErrors.location = true;
            if (!formData.department) newErrors.department = true;
            if (!formData.shift) newErrors.shift = true;
        } else if (step === 3) {
            if (formData.include_pf && !formData.pf_number) newErrors.pf_number = true;
            if (formData.include_esi && !formData.esi_number) newErrors.esi_number = true;
        } else if (step === 4) {
            if (!formData.payment_type) newErrors.payment_type = true;
            if (formData.payment_type === 'Bank Transfer') {
                if (!formData.bank_name) newErrors.bank_name = true;
                if (!formData.bank_branch) newErrors.bank_branch = true;
                if (!formData.account_number) newErrors.account_number = true;
                if (!formData.ifsc_code) newErrors.ifsc_code = true;
            }
        } else if (step === 5) {
            // Validate that initial leaves are numeric and positive
            if (formData.initial_leaves) {
                Object.keys(formData.initial_leaves).forEach(key => {
                    const val = Number(formData.initial_leaves[key]);
                    if (isNaN(val) || val < 0) {
                        newErrors[`leave_${key}`] = true;
                    }
                });
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 5) setCurrentStep(currentStep + 1);
        } else {
            // Optional: scroll to first error
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                const el = document.getElementsByName(firstErrorField)[0];
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validateStep(5)) return;
        
        setLoading(true);
        try {
            const unformatDate = (d) => {
                if (!d) return null;
                if (!/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
                const [day, month, year] = d.split('-');
                return `${year}-${month}-${day}`;
            };

            const submissionLeaves = {};
            if (formData.initial_leaves) {
                Object.keys(formData.initial_leaves).forEach(key => {
                    const monthlyVal = Number(formData.initial_leaves[key]);
                    submissionLeaves[key] = isNaN(monthlyVal) ? 0 : Number((monthlyVal * 12).toFixed(2));
                });
            }

            // Mapping fields to what the backend expects
            const submissionData = {
                ...formData,
                initial_leaves: submissionLeaves,
                location: formData.location, 
                // Add default password for now as existing modal does
                password: 'Password@123',
                confirmPassword: 'Password@123',
                role_name: formData.role_name || 'employee',
                // Convert dates back to YYYY-MM-DD for SQL
                date_of_birth: unformatDate(formData.date_of_birth),
                joining_date: unformatDate(formData.joining_date),
                contract_start_date: unformatDate(formData.contract_start_date),
                contract_end_date: unformatDate(formData.contract_end_date),
                confirmation_date: unformatDate(formData.confirmation_date)
            };
            
            if (editId) {
                await api.put(`/employees/${editId}`, submissionData);
            } else {
                await api.post('/employees', submissionData);
            }
            
            // Clear draft on success
            if (!editId) {
                localStorage.removeItem('onboarding_draft_data');
                localStorage.removeItem('onboarding_draft_step');
            }
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Submission Error:', err);
            setErrorMessage(err.response?.data?.message || err.message || 'Failed to onboard employee. Check console for details.');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOptions = (newOptions) => {
        setFieldOptions(prev => ({
            ...prev,
            [activeOptionManager.field]: newOptions
        }));
        setActiveOptionManager(null);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <SearchableSelect 
                                    label="Employee Number Series"
                                    name="employee_number_series"
                                    required={true}
                                    value={formData.employee_number_series}
                                    onChange={handleChange}
                                    options={['Manual Entry', 'Permanent Employees', 'Temporary Employees']}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowSeriesModal(true)}
                                    className="text-[10px] text-indigo-600 font-bold hover:underline -mt-4 w-fit block ml-1"
                                >
                                    Manage Employee Number Series
                                </button>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee No <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        name="employee_id_number" 
                                        value={formData.employee_id_number} 
                                        onChange={handleChange}
                                        readOnly={formData.employee_number_series === 'Permanent Employees' || formData.employee_number_series === 'Temporary Employees'}
                                        className={`px-4 py-2 rounded text-sm focus:outline-none border transition-all ${
                                            (formData.employee_number_series === 'Permanent Employees' || formData.employee_number_series === 'Temporary Employees')
                                            ? 'bg-slate-50 border-slate-200 text-slate-500 font-bold'
                                            : 'bg-white border-slate-300 focus:border-indigo-400'
                                        }`}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className={`text-[11px] font-bold uppercase tracking-wider ${errors.first_name || errors.last_name ? 'text-rose-600' : 'text-slate-500'}`}>Name <span className="text-rose-500">*</span></label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <input 
                                                type="text" 
                                                name="first_name" 
                                                placeholder="First Name"
                                                required
                                                value={formData.first_name} 
                                                onChange={handleChange}
                                                className={`px-4 py-2 bg-white border rounded text-sm focus:outline-none transition-all ${
                                                    errors.first_name ? 'border-rose-400 bg-rose-50' : 'border-slate-300 focus:border-indigo-400'
                                                }`}
                                            />
                                            {errors.first_name && <span className="text-[9px] font-bold text-rose-600 uppercase">Required</span>}
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <input 
                                                type="text" 
                                                name="last_name" 
                                                placeholder="Last Name"
                                                required
                                                value={formData.last_name} 
                                                onChange={handleChange}
                                                className={`px-4 py-2 bg-white border rounded text-sm focus:outline-none transition-all ${
                                                    errors.last_name ? 'border-rose-400 bg-rose-50' : 'border-slate-300 focus:border-indigo-400'
                                                }`}
                                            />
                                            {errors.last_name && <span className="text-[9px] font-bold text-rose-600 uppercase">Required</span>}
                                        </div>
                                    </div>
                                </div>

                                <ClassicDatePicker 
                                    label="Date Of Birth"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                />

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aadhaar Number</label>
                                    <input 
                                        type="text" 
                                        name="aadhaar_number" 
                                        maxLength={12}
                                        placeholder="12 Digit Aadhaar Number"
                                        value={formData.aadhaar_number} 
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, ''); // Only numbers
                                            if (val.length <= 12) handleChange({ target: { name: 'aadhaar_number', value: val } });
                                        }}
                                        className={`px-4 py-2 bg-white border rounded text-sm focus:outline-none transition-all ${
                                            formData.aadhaar_number && formData.aadhaar_number.length !== 12 
                                            ? 'border-rose-300 bg-rose-50' 
                                            : 'border-slate-300 focus:border-indigo-400'
                                        }`}
                                    />
                                    {formData.aadhaar_number && formData.aadhaar_number.length !== 12 && (
                                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight animate-pulse">Invalid Aadhaar Number</span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gender <span className="text-rose-500">*</span></label>
                                    <div className="flex gap-4 items-center h-10">
                                        {['Male', 'Female', 'Others'].map(g => (
                                            <label key={g} className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="gender" 
                                                    value={g} 
                                                    checked={formData.gender === g}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-slate-600">{g}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <SearchableSelect 
                                    label="Reporting Manager" 
                                    name="manager_id" 
                                    options={managers.map(m => ({ label: `${m.first_name} ${m.last_name}`, value: m.id }))} 
                                    value={formData.manager_id} 
                                    onChange={handleChange}
                                    required={false}
                                />

                                <SearchableSelect 
                                    label="Status" 
                                    name="status" 
                                    options={['Confirmed', 'External', 'Internal', 'Probation', 'Intern']} 
                                    value={formData.status} 
                                    onChange={handleChange}
                                    required
                                    error={errors.status}
                                />

                                <ClassicDatePicker 
                                    label="Date Of Joining"
                                    name="joining_date"
                                    required={true}
                                    value={formData.joining_date}
                                    onChange={handleChange}
                                    error={errors.joining_date}
                                />
                                
                                <SearchableSelect 
                                    label="Referred By"
                                    name="referred_by"
                                    value={formData.referred_by}
                                    onChange={handleChange}
                                    options={managers.map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` }))}
                                />
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div className="flex flex-col gap-1.5" name="probation_period">
                                    <label className={`text-[11px] font-bold uppercase tracking-wider ${errors.probation_period ? 'text-rose-600' : 'text-slate-500'}`}>Probation Period <span className="text-rose-500">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            name="probation_period" 
                                            required
                                            value={formData.probation_period} 
                                            onChange={handleChange}
                                            className={`px-4 py-2 rounded text-sm w-24 focus:outline-none transition-all ${
                                                errors.probation_period ? 'bg-rose-50 border-rose-400' : 'bg-white border-slate-300 focus:border-indigo-400'
                                            }`}
                                        />
                                        <span className="text-sm text-slate-500 font-medium">Days</span>
                                    </div>
                                    {errors.probation_period && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 ml-1">Please fill this section</span>}
                                </div>

                                <ClassicDatePicker 
                                    label="Confirmation Date"
                                    name="confirmation_date"
                                    required={true}
                                    value={formData.confirmation_date}
                                    onChange={handleChange}
                                    error={errors.confirmation_date}
                                />

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5" name="phone">
                                    <label className={`text-[11px] font-bold uppercase tracking-wider ${errors.phone ? 'text-rose-600' : 'text-slate-500'}`}>Mobile Number <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        name="phone" 
                                        required
                                        value={formData.phone} 
                                        onChange={handleChange}
                                        placeholder="Enter mobile number"
                                        className={`px-4 py-2 border rounded-lg text-sm transition-all focus:outline-none ${
                                            errors.phone ? 'bg-rose-50 border-rose-400' : 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white'
                                        }`}
                                    />
                                    {errors.phone && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 ml-1">Please fill this section</span>}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergency Contact Name</label>
                                    <input 
                                        type="text" 
                                        name="emergency_contact_name" 
                                        value={formData.emergency_contact_name} 
                                        onChange={handleChange}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergency Contact Number</label>
                                    <input 
                                        type="text" 
                                        name="emergency_contact_number" 
                                        value={formData.emergency_contact_number} 
                                        onChange={handleChange}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Father's Name</label>
                                    <input 
                                        type="text" 
                                        name="father_name" 
                                        value={formData.father_name} 
                                        onChange={handleChange}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Spouse Name</label>
                                    <input 
                                        type="text" 
                                        name="spouse_name" 
                                        value={formData.spouse_name} 
                                        onChange={handleChange}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mother Name</label>
                                    <input 
                                        type="text" 
                                        name="mother_name" 
                                        value={formData.mother_name} 
                                        onChange={handleChange}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 max-w-2xl">
                        {[
                            { label: 'Designation', name: 'designation', type: 'select', required: true },
                            { label: 'Location/Outlet', name: 'location', type: 'select', required: true },
                            { label: 'Department', name: 'department', type: 'select', required: true },
                            { label: 'Contract Start Date', name: 'contract_start_date', type: 'date', required: false },
                            { label: 'Contract End Date', name: 'contract_end_date', type: 'date', required: false },
                            { label: 'Shift', name: 'shift', type: 'select', required: true },
                            { label: 'System Role', name: 'role_name', type: 'select', required: true },
                        ].map(field => (
                            <div key={field.name} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <div className="col-span-3">
                                            {field.type === 'date' ? (
                                                <ClassicDatePicker 
                                                    label={field.label}
                                                    name={field.name}
                                                    value={formData[field.name]}
                                                    onChange={handleChange}
                                                    required={field.required}
                                                    error={errors[field.name]}
                                                />
                                            ) : (
                                                <SearchableSelect 
                                                    label={field.label}
                                                    name={field.name}
                                                    value={formData[field.name]}
                                                    onChange={handleChange}
                                                    options={field.name === 'role_name' ? ['employee', 'manager'] : (fieldOptions[field.name] || [])}
                                                    onEdit={field.name === 'role_name' ? null : () => setActiveOptionManager({ field: field.name, title: `Manage ${field.label}s` })}
                                                    required={field.required}
                                                    error={errors[field.name]}
                                                />
                                            )}
                                        </div>
                            </div>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                        <div className="flex flex-col gap-1.5 max-w-xs">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PAN Number</label>
                            <input 
                                type="text" 
                                name="pan_number" 
                                value={formData.pan_number} 
                                onChange={handleChange}
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                placeholder="ABCDE1234F"
                            />
                        </div>

                        <div className="flex flex-wrap gap-12">
                            {[
                                { label: 'Include PF', name: 'include_pf', show: hasPfRule },
                                { label: 'Include ESI', name: 'include_esi', show: hasEsiRule },
                                { label: 'Include LWF', name: 'include_lwf', show: hasLwfRule },
                                { label: 'Include Gratuity', name: 'include_gratuity', show: hasGratuityRule },
                            ].filter(cb => cb.show).map(cb => (
                                <label key={cb.name} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData[cb.name] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                        {!!formData[cb.name] && <Check size={12} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        name={cb.name} 
                                        checked={!!formData[cb.name]} 
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium text-slate-600">{cb.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-4">
                            {/* PF Section */}
                            <div className="space-y-6">
                                {!!formData.include_pf && hasPfRule && (
                                    <>
                                        <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PF Number</label>
                                                {(formData.pf_number || '').length >= 26 && !/^[A-Z0-9]{2}\/[A-Z0-9]{3}\/[0-9]{7}\/[0-9]{3}\/[0-9]{7}$/.test(formData.pf_number || '') && (
                                                    <span className="text-[10px] font-bold text-rose-500">Please enter a valid value</span>
                                                )}
                                            </div>
                                            <input 
                                                type="text" 
                                                name="pf_number" 
                                                maxLength={26}
                                                value={formData.pf_number || ''} 
                                                onChange={(e) => {
                                                    let val = (e.target.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                                                    let formatted = '';
                                                    if (val.length > 0) formatted += val.substring(0, 2);
                                                    if (val.length > 2) formatted += '/' + val.substring(2, 5);
                                                    if (val.length > 5) formatted += '/' + val.substring(5, 12);
                                                    if (val.length > 12) formatted += '/' + val.substring(12, 15);
                                                    if (val.length > 15) formatted += '/' + val.substring(15, 22);
                                                    handleChange({ target: { name: 'pf_number', value: formatted } });
                                                }}
                                                placeholder="AA/BBB/0000000/000/0000000"
                                                className={`px-4 py-2 bg-white border rounded text-sm font-mono tracking-wider focus:outline-none transition-all ${
                                                    (formData.pf_number || '').length >= 26 && !/^[A-Z0-9]{2}\/[A-Z0-9]{3}\/[0-9]{7}\/[0-9]{3}\/[0-9]{7}$/.test(formData.pf_number || '')
                                                    ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-100'
                                                    : 'border-slate-300 focus:border-indigo-400'
                                                }`}
                                            />
                                            <p className="text-[10px] text-slate-400 leading-tight">Format : (Region Code/Office Code/Est Code/Extn No/Member Acc No)<br/>Example HR/FBD/0003256/000/0000125.</p>
                                        </div>

                                        <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">UAN Number</label>
                                                {formData.uan_number && (formData.uan_number || '').length !== 12 && (
                                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Invalid UAN Number</span>
                                                )}
                                            </div>
                                            <input 
                                                type="text" 
                                                name="uan_number" 
                                                maxLength={12}
                                                value={formData.uan_number || ''} 
                                                onChange={(e) => {
                                                    const val = (e.target.value || '').replace(/\D/g, ''); // Numbers only
                                                    if (val.length <= 12) handleChange({ target: { name: 'uan_number', value: val } });
                                                }}
                                                placeholder="12 Digit UAN Number"
                                                className={`px-4 py-2 bg-white border rounded text-sm focus:outline-none transition-all ${
                                                    formData.uan_number && (formData.uan_number || '').length !== 12 
                                                    ? 'border-rose-400 bg-rose-50' 
                                                    : 'border-slate-300 focus:border-indigo-400'
                                                }`}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PF Excess Contribution</label>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input 
                                                        type="radio" 
                                                        name="pf_excess_contribution" 
                                                        value="ceiling"
                                                        checked={formData.pf_excess_contribution === 'ceiling'}
                                                        onChange={handleChange}
                                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-xs text-slate-600 group-hover:text-slate-900">Employee & Employer contribution - 12% with in wage ceiling (Max Rs.1800)</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input 
                                                        type="radio" 
                                                        name="pf_excess_contribution" 
                                                        value="above"
                                                        checked={formData.pf_excess_contribution === 'above'}
                                                        onChange={handleChange}
                                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-xs text-slate-600 group-hover:text-slate-900">Employee contribution - 12% over and above wage ceiling (In excess to Rs.1800)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ESI Section */}
                            <div className="space-y-6">
                                {!!formData.include_esi && hasEsiRule && (
                                    <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ESI Number</label>
                                        <input 
                                            type="text" 
                                            name="esi_number" 
                                            value={formData.esi_number || ''} 
                                            onChange={handleChange}
                                            className="px-4 py-2 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:border-indigo-400"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8 max-w-2xl">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Payment Type Searchable */}
                            <div className="max-w-xs">
                                <SearchableSelect 
                                    label="Payment Type" 
                                    name="payment_type" 
                                    options={['Bank Transfer', 'Cash', 'Cheque']} 
                                    value={formData.payment_type} 
                                    onChange={handleChange}
                                />
                            </div>

                            {formData.payment_type === 'Bank Transfer' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                                    <SearchableSelect 
                                        label="Bank Name" 
                                        name="bank_name" 
                                        options={fieldOptions.bank_name} 
                                        value={formData.bank_name} 
                                        onChange={handleChange}
                                        onEdit={() => setActiveOptionManager({ field: 'bank_name', title: 'Manage Banks' })}
                                    />

                                    <SearchableSelect 
                                        label="Bank Branch" 
                                        name="bank_branch" 
                                        options={fieldOptions.bank_branch} 
                                        value={formData.bank_branch} 
                                        onChange={handleChange}
                                        onEdit={() => setActiveOptionManager({ field: 'bank_branch', title: 'Manage Branches' })}
                                    />

                                    <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300" name="account_number">
                                        <label className={`text-[11px] font-bold uppercase tracking-wider ${errors.account_number ? 'text-rose-600' : 'text-slate-500'}`}>Account Number <span className="text-rose-500">*</span></label>
                                        <input 
                                            type="text" 
                                            name="account_number" 
                                            value={formData.account_number} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                handleChange({ target: { name: 'account_number', value: val } });
                                            }}
                                            placeholder="Enter account number"
                                            className={`px-4 py-2 bg-white border rounded text-sm focus:outline-none transition-all ${
                                                errors.account_number ? 'border-rose-400 bg-rose-50' : 'border-slate-300 focus:border-indigo-400'
                                            }`}
                                        />
                                        {errors.account_number && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 ml-1">Please fill this section</span>}
                                    </div>

                                    <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300" name="ifsc_code">
                                        <label className={`text-[11px] font-bold uppercase tracking-wider ${errors.ifsc_code ? 'text-rose-600' : 'text-slate-500'}`}>IFSC Code <span className="text-rose-500">*</span></label>
                                        <input 
                                            type="text" 
                                            name="ifsc_code" 
                                            value={formData.ifsc_code} 
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                handleChange({ target: { name: 'ifsc_code', value: val } });
                                            }}
                                            placeholder="Enter IFSC code"
                                            className={`px-4 py-2 bg-white border rounded text-sm focus:outline-none transition-all ${
                                                errors.ifsc_code ? 'border-rose-400 bg-rose-50' : 'border-slate-300 focus:border-indigo-400'
                                            }`}
                                        />
                                        {errors.ifsc_code && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 ml-1">Please fill this section</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 max-w-2xl">
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-indigo-900 text-xs font-semibold leading-relaxed">
                            Specify initial leave entitlements for the employee. Leaving these as-is will assign the company's default active leave rules.
                        </div>
                        {leaveTypes.map(lt => {
                            const val = formData.initial_leaves?.[lt.id] ?? Number((lt.days_per_year / 12).toFixed(2));
                            return (
                                <div key={lt.id} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-2 border-b border-slate-100">
                                    <div className="md:col-span-2 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lt.color || '#4361ee' }} />
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{lt.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Default: {Number((lt.days_per_year / 12).toFixed(2))} days per month</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <input 
                                            type="number"
                                            value={val}
                                            onChange={(e) => {
                                                const v = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    initial_leaves: {
                                                        ...prev.initial_leaves,
                                                        [lt.id]: v
                                                    }
                                                }));
                                            }}
                                            placeholder="Enter days"
                                            className={`px-4 py-2 bg-white border rounded text-sm w-full focus:outline-none transition-all ${
                                                errors[`leave_${lt.id}`] ? 'border-rose-400 bg-rose-50' : 'border-slate-300 focus:border-indigo-400'
                                            }`}
                                        />
                                        {errors[`leave_${lt.id}`] && (
                                            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight">Invalid Value</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 font-outfit">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/employees')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight">Onboard New Employee</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Step {currentStep}: {steps.find(s => s.id === currentStep).title}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => navigate('/employees')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* Stepper */}
                <div className="mb-12 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                    <div className="flex justify-between items-center relative z-10">
                        {steps.map(step => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            
                            return (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                                        isActive ? 'bg-emerald-600 ring-4 ring-emerald-100' : 
                                        isCompleted ? 'bg-emerald-500' : 
                                        'bg-slate-200'
                                    }`}>
                                        {(isActive || isCompleted) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className={`mt-3 text-[10px] font-bold tracking-tight uppercase transition-colors duration-300 ${
                                        isActive ? 'text-indigo-900' : 'text-slate-400'
                                    }`}>{step.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col overflow-visible">
                    <div className="p-8 md:p-12 flex-1 pb-32">
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-slate-800">Step {currentStep}: {steps.find(s => s.id === currentStep).title.charAt(0) + steps.find(s => s.id === currentStep).title.slice(1).toLowerCase()}</h2>
                        </div>
                        
                        {renderStepContent()}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex gap-2">
                            <button 
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-all disabled:opacity-0"
                            >
                                <ChevronLeft size={14} />
                                Previous
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={nextStep}
                                className={`flex items-center gap-2 px-6 py-2 bg-white border border-indigo-600 text-indigo-600 text-[12px] font-medium rounded hover:bg-indigo-50 transition-all ${currentStep === 5 ? 'hidden' : ''}`}
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                            
                            {currentStep === 5 && (
                                <button 
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white text-[12px] font-medium rounded hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Submit'}
                                    <Check size={14} />
                                </button>
                            )}

                            <button 
                                onClick={() => navigate('/employees')}
                                className="px-6 py-2 text-[12px] font-medium text-indigo-600 bg-white border border-indigo-600 rounded hover:bg-indigo-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
            {/* Draft Recovery Modal */}
            {showDraftModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                            <FileText className="text-indigo-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Session?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            We found an incomplete onboarding session. Would you like to continue where you left off?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleRestoreDraft}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                            >
                                Yes, Continue Session
                            </button>
                            <button 
                                onClick={handleDiscardDraft}
                                className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                            >
                                No, Start Fresh
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Option Manager Modal */}
            {activeOptionManager && (
                <OptionManagerModal 
                    title={activeOptionManager.title}
                    options={fieldOptions[activeOptionManager.field] || []}
                    onSave={handleSaveOptions}
                    onClose={() => setActiveOptionManager(null)}
                />
            )}
            {/* Success Modal */}
            {showSuccessModal && (
                <SuccessModal onClose={() => navigate('/employees')} isEdit={!!editId} />
            )}
            {/* Error Modal */}
            {showErrorModal && (
                <ErrorModal onClose={() => setShowErrorModal(false)} message={errorMessage} />
            )}
            {/* Number Series Modal */}
            {showSeriesModal && (
                <ManageSeriesModal 
                    series={numberSeries}
                    onClose={() => setShowSeriesModal(false)}
                    onEdit={handleEditSeries}
                    editingId={editingSeries}
                    editData={editSeriesData}
                    setEditData={setEditSeriesData}
                    onSave={handleSaveSeries}
                    loading={loading}
                />
            )}
        </div>
    </div>
</div>
);
};

const ManageSeriesModal = ({ series, onClose, onEdit, editingId, editData, setEditData, onSave, loading }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Manage Employee Number Series</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Series Name</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-center">Current Serial</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-center">Format</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {series.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-slate-700">{s.name}</td>
                                        <td className="px-4 py-4 text-center font-bold text-slate-900">{s.current_count}</td>
                                        <td className="px-4 py-4 text-center">
                                            {editingId === s.id ? (
                                                <div className="flex gap-2 items-center justify-center">
                                                    <input 
                                                        type="text" 
                                                        value={editData.prefix} 
                                                        onChange={e => {
                                                            const newPrefix = e.target.value;
                                                            let newFormat = editData.format;
                                                            
                                                            if (!newFormat || newFormat === editData.prefix) {
                                                                newFormat = newPrefix;
                                                            } else if (newFormat.startsWith(editData.prefix)) {
                                                                newFormat = newPrefix + newFormat.substring(editData.prefix.length);
                                                            } else {
                                                                newFormat = newPrefix + newFormat;
                                                            }
                                                            
                                                            setEditData({...editData, prefix: newPrefix, format: newFormat});
                                                        }}
                                                        placeholder="Prefix"
                                                        className="w-16 px-2 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        value={editData.padding} 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const paddingInt = val === '' ? 0 : (parseInt(val) || 0);
                                                            let newFormat = editData.format;
                                                            const maxLen = editData.prefix.length + paddingInt;
                                                            if (newFormat.length > maxLen) {
                                                                newFormat = newFormat.substring(0, maxLen);
                                                            } else if (newFormat.length < maxLen) {
                                                                newFormat = newFormat.padEnd(maxLen, '#');
                                                            }
                                                            setEditData({ ...editData, padding: val === '' ? '' : paddingInt, format: newFormat });
                                                        }}
                                                        placeholder="Digits"
                                                        className="w-16 px-2 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={editData.format === '{prefix}{number}' ? (editData.prefix + String((editData.current_number || 0) + 1).padStart(editData.padding, '0')) : editData.format} 
                                                        onChange={e => {
                                                            let val = e.target.value;
                                                            const padding = parseInt(editData.padding) || 0;
                                                            
                                                            // Ensure prefix stays at the start
                                                            if (!val.startsWith(editData.prefix)) {
                                                                val = editData.prefix + val;
                                                            }

                                                            // STRICT LENGTH LIMIT (Prefix + Padding)
                                                            const maxLen = editData.prefix.length + padding;
                                                            if (val.length > maxLen) {
                                                                val = val.substring(0, maxLen);
                                                            }

                                                            // Handle the numeric extraction
                                                            const numericPart = val.substring(editData.prefix.length);
                                                            if (/^\d+$/.test(numericPart) && numericPart.length === padding) {
                                                                // If they typed exactly the right amount of digits, save the number offset
                                                                setEditData({
                                                                    ...editData,
                                                                    format: '{prefix}{number}',
                                                                    current_number: Math.max(0, parseInt(numericPart) - 1)
                                                                });
                                                            } else {
                                                                // Otherwise just keep the raw text while they are typing
                                                                setEditData({
                                                                    ...editData,
                                                                    format: val
                                                                });
                                                            }
                                                        }}
                                                        placeholder="Start From"
                                                        className="w-48 px-2 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-bold">
                                                    {(() => {
                                                        const nextNum = Math.max((s.current_count || 0) + 1, (s.current_number || 0) + 1);
                                                        const paddedNum = nextNum.toString().padStart(s.padding || 0, '0');
                                                        let format = s.format || '{prefix}{number}';
                                                        
                                                        return format.replace('{prefix}', s.prefix || '').replace('{number}', paddedNum);
                                                    })()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {editingId === s.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={onSave} disabled={loading} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Check size={16} /></button>
                                                    <button onClick={() => onEdit(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => onEdit(s)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
