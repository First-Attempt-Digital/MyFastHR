import React, { useState, useEffect } from 'react';
import { 
    FileText, Download, Eye, EyeOff, Calendar, ArrowLeft, 
    CreditCard, TrendingUp, Calculator, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const Payslips = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [slips, setSlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSalary, setShowSalary] = useState(false);
    const [expandedSlipId, setExpandedSlipId] = useState(null);
    const [clientControls, setClientControls] = useState({ employee_view_released: true, it_statement_released: true });
    
    // Parse tab from URL parameter if present
    const queryParams = new URLSearchParams(location.search);
    const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'payslips'); // 'payslips', 'ytd', 'it'

    useEffect(() => {
        fetchSlips();
    }, []);

    const fetchSlips = async () => {
        try {
            setLoading(true);
            const data = await api.get('/payroll/my-slips');
            setSlips(data || []);

            const now = new Date();
            const controlsData = await api.get(`/payroll/client-controls?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
            if (controlsData) {
                setClientControls(controlsData);
            }
        } catch (err) {
            console.error('Failed to fetch slips or controls', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSlip = async (id, month, year) => {
        try {
            const token = localStorage.getItem('auth_token') || 'test.admin.token';
            const isProd = import.meta.env.PROD;
            const API_BASE = isProd ? '/api' : 'http://localhost:5000/api';
            const response = await fetch(`${API_BASE}/payroll/download-slip/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip-${month}-${year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download payslip: ' + err.message);
        }
    };

    const getMonthName = (monthNumber) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('en-US', { month: 'long' });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-outfit pb-12">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 static md:sticky md:top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Finance Portal</h1>
                            <p className="text-xs text-slate-400 font-medium">View payslips, tax sheets & reports</p>
                        </div>
                    </div>
                    
                    {/* Show/Hide Salary Switch */}
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Show Salary</span>
                        <button 
                            onClick={() => setShowSalary(!showSalary)}
                            className={`w-[44px] h-[24px] rounded-full relative transition-all duration-300 ${showSalary ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all duration-300 ${showSalary ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="max-w-5xl mx-auto px-6 mt-8">
                {/* Tabs Selector */}
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mb-8">
                    {[
                        { id: 'payslips', label: 'Payslips', icon: FileText },
                        { id: 'ytd', label: 'YTD Reports', icon: TrendingUp },
                        { id: 'it', label: 'IT Statement', icon: Calculator }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Contents */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-semibold text-slate-400 mt-4">Loading statement details...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'payslips' && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                {slips.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold text-slate-700">No Payslips Found</h3>
                                        <p className="text-slate-400 text-sm mt-1">Once processed, your monthly salary slips will appear here.</p>
                                    </div>
                                ) : (
                                    slips.map(slip => (
                                        <div key={slip.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:border-slate-200">
                                            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                                                        <Calendar size={28} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[20px] font-bold text-slate-800 leading-tight">
                                                            {getMonthName(slip.month)} {slip.year}
                                                        </h3>
                                                        <p className="text-sm text-slate-400 mt-1 font-medium">Status: <span className="text-emerald-500 font-bold uppercase tracking-wider text-xs bg-emerald-50 px-2 py-0.5 rounded-full">{slip.status || 'Paid'}</span></p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-6 md:gap-12 md:text-right shrink-0">
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Gross Pay</p>
                                                        <p className="text-base font-bold text-slate-700">
                                                            {showSalary ? `₹${(parseFloat(slip.base_salary || 0) + parseFloat(slip.total_allowances || 0) + parseFloat(slip.overtime_bonus || 0)).toLocaleString('en-IN')}` : '₹******'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Deductions</p>
                                                        <p className="text-base font-bold text-slate-700">
                                                            {showSalary ? `₹${Math.max(0, (parseFloat(slip.base_salary || 0) + parseFloat(slip.total_allowances || 0) + parseFloat(slip.overtime_bonus || 0)) - parseFloat(slip.net_salary || 0)).toLocaleString('en-IN')}` : '₹******'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Net Pay</p>
                                                        <p className="text-[18px] font-black text-indigo-600">
                                                            {showSalary ? `₹${parseFloat(slip.net_salary || 0).toLocaleString('en-IN')}` : '₹******'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setExpandedSlipId(expandedSlipId === slip.id ? null : slip.id)}
                                                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-2xl text-sm font-bold transition-all active:scale-95 bg-white"
                                                    >
                                                        {expandedSlipId === slip.id ? (
                                                            <>Hide Details <ChevronUp size={16} /></>
                                                        ) : (
                                                            <>View Details <ChevronDown size={16} /></>
                                                        )}
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleDownloadSlip(slip.id, slip.month, slip.year)}
                                                        className="w-12 h-12 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center transition-colors shrink-0 active:scale-95"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Details Breakdown */}
                                            {expandedSlipId === slip.id && (
                                                <div className="px-6 pb-8 md:px-8 border-t border-slate-50 pt-6 bg-slate-50/20">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* Earnings Table */}
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Earnings</h4>
                                                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                                                {[
                                                                    { label: 'Basic Salary', val: parseFloat(slip.base_salary || 0) },
                                                                    { label: 'Total Allowances', val: parseFloat(slip.total_allowances || 0) },
                                                                    { label: 'Overtime Bonus', val: parseFloat(slip.overtime_bonus || 0) }
                                                                ].map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between p-4 border-b border-slate-50 last:border-0 text-sm font-semibold text-slate-700">
                                                                        <span>{item.label}</span>
                                                                        <span>{showSalary ? `₹${item.val.toLocaleString('en-IN')}` : '₹******'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Deductions Table */}
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Deductions</h4>
                                                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                                                {[
                                                                    { label: 'Provident Fund (PF)', val: parseFloat(slip.employee_pf || 0) },
                                                                    { label: 'ESIC', val: parseFloat(slip.employee_esic || 0) },
                                                                    { label: 'Late Mark Deduction', val: parseFloat(slip.late_mark_deduction || 0) },
                                                                    { label: 'Loan EMI Deduction', val: parseFloat(slip.loan_emi_deduction || 0) },
                                                                    { label: 'Manual Deduction Override', val: parseFloat(slip.manual_deduction_override || 0) }
                                                                ].map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between p-4 border-b border-slate-50 last:border-0 text-sm font-semibold text-slate-700">
                                                                        <span>{item.label}</span>
                                                                        <span className="text-rose-500">{showSalary ? `₹${item.val.toLocaleString('en-IN')}` : '₹******'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'ytd' && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-[20px] font-bold text-slate-800">Year-To-Date (YTD) Summary</h3>
                                        <p className="text-xs text-slate-400 mt-1">Financial Year 2026-2027</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                                                <th className="py-4">Month</th>
                                                <th className="py-4">Gross Earnings</th>
                                                <th className="py-4">Statutory PF</th>
                                                <th className="py-4">Tax (TDS)</th>
                                                <th className="py-4 text-right">Net Pay</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                                            {slips.map(slip => (
                                                <tr key={slip.id} className="hover:bg-slate-50/50">
                                                    <td className="py-4">{getMonthName(slip.month)} {slip.year}</td>
                                                    <td className="py-4">{showSalary ? `₹${(slip.basic_salary * 1.5).toLocaleString('en-IN')}` : '₹******'}</td>
                                                    <td className="py-4">{showSalary ? `₹${Math.min(1800, slip.basic_salary * 0.12).toLocaleString('en-IN')}` : '₹******'}</td>
                                                    <td className="py-4">{showSalary ? '₹0.00' : '₹******'}</td>
                                                    <td className="py-4 text-right font-bold text-indigo-600">{showSalary ? `₹${parseFloat(slip.net_salary || 0).toLocaleString('en-IN')}` : '₹******'}</td>
                                                </tr>
                                            ))}
                                            {slips.length > 0 && (
                                                <tr className="border-t-2 border-slate-100 font-bold bg-slate-50/40">
                                                    <td className="py-4 pl-3">Total YTD</td>
                                                    <td className="py-4">{showSalary ? `₹${slips.reduce((acc, slip) => acc + slip.basic_salary * 1.5, 0).toLocaleString('en-IN')}` : '₹******'}</td>
                                                    <td className="py-4">{showSalary ? `₹${slips.reduce((acc, slip) => acc + Math.min(1800, slip.basic_salary * 0.12), 0).toLocaleString('en-IN')}` : '₹******'}</td>
                                                    <td className="py-4">₹0.00</td>
                                                    <td className="py-4 text-right pr-3 text-indigo-600 font-black">{showSalary ? `₹${slips.reduce((acc, slip) => acc + parseFloat(slip.net_salary || 0), 0).toLocaleString('en-IN')}` : '₹******'}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'it' && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="w-full"
                            >
                                {!clientControls.it_statement_released ? (
                                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-xl mx-auto flex flex-col items-center justify-center gap-3">
                                        <div className="p-3 bg-rose-50 border border-rose-105 text-rose-500 rounded-2xl shadow-inner animate-bounce">
                                            <AlertCircle className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-wide mt-2">IT Statement Held</h3>
                                        <p className="text-slate-400 text-xs font-semibold max-w-md">Income Tax Statement for this period is currently held by the administrator.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                                            <h3 className="text-[20px] font-bold text-slate-800 mb-6">Income Tax Projection</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="flex justify-between py-3 border-b border-slate-50 text-sm font-semibold text-slate-700">
                                                    <span>Annual Projected Gross Salary</span>
                                                    <span>{showSalary ? `₹${(slips[0]?.basic_salary * 1.5 * 12 || 0).toLocaleString('en-IN')}` : '₹******'}</span>
                                                </div>
                                                <div className="flex justify-between py-3 border-b border-slate-50 text-sm font-semibold text-slate-700">
                                                    <span>Standard Deduction (Section 16)</span>
                                                    <span className="text-rose-500">{showSalary ? '₹50,000' : '₹******'}</span>
                                                </div>
                                                <div className="flex justify-between py-3 border-b border-slate-50 text-sm font-semibold text-slate-700">
                                                    <span>Deductions under Section 80C</span>
                                                    <span className="text-rose-500">{showSalary ? `₹${Math.min(150000, (slips[0]?.basic_salary * 0.12 * 12 || 0)).toLocaleString('en-IN')}` : '₹******'}</span>
                                                </div>
                                                <div className="flex justify-between py-3 border-b border-slate-50 text-sm font-semibold text-slate-700">
                                                    <span>Net Taxable Income</span>
                                                    <span className="font-bold text-slate-800">
                                                        {showSalary ? `₹${Math.max(0, (slips[0]?.basic_salary * 1.5 * 12 || 0) - 50000 - Math.min(150000, (slips[0]?.basic_salary * 0.12 * 12 || 0))).toLocaleString('en-IN')}` : '₹******'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-3 text-sm font-semibold text-slate-700">
                                                    <span>Estimated Tax Liability</span>
                                                    <span className="text-emerald-500 font-bold">₹0 (Tax Rebate u/s 87A applies)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                                            <div className="relative z-10">
                                                <FileText size={40} className="text-indigo-200 mb-4" />
                                                <h4 className="text-lg font-bold">IT Declaration</h4>
                                                <p className="text-xs text-indigo-200 mt-2 leading-relaxed">
                                                    Submit your investment declaration for FY 2026-2027 to adjust TDS deductions correctly.
                                                </p>
                                            </div>
                                            
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-6 translate-x-6"></div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Payslips;
