import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Users, Plus, Search, ChevronDown, Calendar, 
    Settings, Trash2, Save, X, User, Check
} from 'lucide-react';
import api from '../../utils/api';

const SearchableDropdown = ({ value, onChange, options, placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = useMemo(() => 
        options.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        ), [options, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full h-9 px-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-400 transition-all shadow-sm"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
                    <span className={`text-[11px] font-bold truncate ${selectedOption ? 'text-slate-700' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="p-2 border-b border-slate-50">
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full h-8 pl-8 pr-3 bg-slate-50 text-[10px] font-bold text-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div 
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${value === opt.value ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <span className="text-[10px] font-bold">{opt.label}</span>
                                    {value === opt.value && <Check size={12} />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-[10px] font-bold text-slate-400 italic">No matches found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const LeaveTypeReviewer = () => {
    const [activeTab, setActiveTab] = useState('reviewers');
    const [reviewers, setReviewers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // New Record State
    const [newRecord, setNewRecord] = useState({
        scheme: 'ALL',
        leaveType: '',
        reviewer1: '',
        reviewer2: ''
    });

    const leaveTypes = [
        { value: 'sick', label: 'Sick Leave' },
        { value: 'paid', label: 'Paid Leave' },
        { value: 'casual', label: 'Casual Leave' },
        { value: 'comp-off', label: 'Comp-Off' },
        { value: 'lop', label: 'Loss Of Pay' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [revRes, empRes] = await Promise.all([
                api.get('/settings/leave-reviewers'),
                api.get('/employees')
            ]);
            
            // Handle different possible response formats
            const reviewerData = Array.isArray(revRes) ? revRes : (revRes?.data || []);
            const employeeData = Array.isArray(empRes) ? empRes : (empRes?.data || []);

            setReviewers(reviewerData);
            setEmployees(employeeData.map(e => ({
                value: e.id,
                label: `${e.first_name || ''} ${e.last_name || ''} (${e.employee_id_number || e.employee_id || 'N/A'})`.trim()
            })));
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await api.post('/settings/leave-reviewers', newRecord);
            setShowAddModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save', err);
        }
    };

    return (
        <div className="flex flex-col space-y-4 animate-in fade-in duration-500 h-full pb-10">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Leave Type Reviewer</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Configure approval workflows per leave type</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-black text-slate-600 outline-none focus:border-indigo-400 shadow-sm appearance-none">
                            <option>Jan 2026 - Dec 2026</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <select className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-black text-slate-600 outline-none focus:border-indigo-400 appearance-none min-w-[150px]">
                        <option>Leave Scheme: All</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl w-fit">
                <button 
                    onClick={() => setActiveTab('reviewers')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'reviewers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Reviewers
                </button>
                <button 
                    onClick={() => setActiveTab('config')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Config
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                {/* Action Bar */}
                <div className="p-3 border-b border-slate-50 flex items-center justify-end">
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={14} /> Add Reviewer
                    </button>
                </div>

                {/* Grid Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-3 w-1/4 text-[9px] font-black text-slate-400 uppercase border-r border-slate-100">Leave Scheme</th>
                                <th className="p-3 w-1/4 text-[9px] font-black text-slate-400 uppercase border-r border-slate-100">Leave Type</th>
                                {activeTab === 'reviewers' ? (
                                    <>
                                        <th className="p-3 w-1/4 text-[9px] font-black text-slate-400 uppercase border-r border-slate-100">Reviewer 1</th>
                                        <th className="p-3 w-1/4 text-[9px] font-black text-slate-400 uppercase">Reviewer 2</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="p-3 w-1/2 text-[9px] font-black text-slate-400 uppercase border-r border-slate-100">Reviewer Provider</th>
                                        <th className="p-3 w-10 text-[9px] font-black text-slate-400 uppercase">&nbsp;</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reviewers.length > 0 ? (
                                reviewers.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-3 border-r border-slate-50 text-[11px] font-bold text-slate-600">{row.scheme}</td>
                                        <td className="p-3 border-r border-slate-50 text-[11px] font-bold text-slate-600">{row.leave_type}</td>
                                        {activeTab === 'reviewers' ? (
                                            <>
                                                <td className="p-3 border-r border-slate-50 text-[11px] font-bold text-indigo-600">{row.reviewer1_name}</td>
                                                <td className="p-3 text-[11px] font-bold text-indigo-600">{row.reviewer2_name}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-3 border-r border-slate-50 text-[11px] font-bold text-slate-600">{row.provider || 'Self'}</td>
                                                <td className="p-3">&nbsp;</td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                Array.from({ length: 15 }).map((_, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 border-r border-slate-50">&nbsp;</td>
                                        <td className="p-3 border-r border-slate-50">&nbsp;</td>
                                        <td className="p-3 border-r border-slate-50">&nbsp;</td>
                                        <td className="p-3">&nbsp;</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Modal - High Fidelity (Matches Images 3, 4, 5) */}
                {showAddModal && (
                    <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Configure Reviewer</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Set up multi-level approval</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Form Field: Leave Scheme */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Leave Scheme</label>
                                    <div className="col-span-2 relative">
                                        <select 
                                            value={newRecord.scheme}
                                            onChange={(e) => setNewRecord({...newRecord, scheme: e.target.value})}
                                            className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400 shadow-sm appearance-none"
                                        >
                                            <option value="ALL">ALL</option>
                                            <option value="Scheme A">Scheme A</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Form Field: Leave Type */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Leave Type</label>
                                    <div className="col-span-2">
                                        <SearchableDropdown 
                                            value={newRecord.leaveType}
                                            onChange={(val) => setNewRecord({...newRecord, leaveType: val})}
                                            options={leaveTypes}
                                            placeholder="Select Leave Type"
                                        />
                                    </div>
                                </div>

                                {/* Form Field: Reviewer 1 */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Reviewer 1</label>
                                    <div className="col-span-2">
                                        <SearchableDropdown 
                                            value={newRecord.reviewer1}
                                            onChange={(val) => setNewRecord({...newRecord, reviewer1: val})}
                                            options={employees}
                                            placeholder="Select Reviewer 1"
                                            icon={User}
                                        />
                                    </div>
                                </div>

                                {/* Form Field: Reviewer 2 */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Reviewer 2</label>
                                    <div className="col-span-2">
                                        <SearchableDropdown 
                                            value={newRecord.reviewer2}
                                            onChange={(val) => setNewRecord({...newRecord, reviewer2: val})}
                                            options={employees}
                                            placeholder="Select Reviewer 2"
                                            icon={User}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3">
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            ` }} />
        </div>
    );
};

export default LeaveTypeReviewer;
