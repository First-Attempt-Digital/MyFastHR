import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Info, Edit2, Lock, Unlock,
    Play, Download, MoreHorizontal, PieChart, Users,
    ArrowRight, Plus, Minus, RotateCcw, FileText, Eye,
    Settings as SettingsIcon, Landmark, Sliders, Calculator,
    ShieldAlert, Check, RefreshCw, Trash2, Edit3, Clock,
    TrendingUp, Coins, ChevronDown, CheckCircle, Mail, UserMinus, Printer, X
} from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { exportToCSV } from '../utils/exportUtils';

const numberToWords = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '';
    let val = parseFloat(num);
    if (val === 0) return 'Rupees Zero Only';

    const belowTwenty = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const getWordRepresentation = (n) => {
        if (n < 20) return belowTwenty[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + belowTwenty[n % 10] : '');
        if (n < 1000) return belowTwenty[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + getWordRepresentation(n % 100) : '');
        return '';
    };

    const convertIntegerPart = (intVal) => {
        if (intVal === 0) return '';
        let words = '';

        // Crores
        if (intVal >= 10000000) {
            words += getWordRepresentation(Math.floor(intVal / 10000000)) + ' Crore ';
            intVal %= 10000000;
        }
        // Lakhs
        if (intVal >= 100000) {
            words += getWordRepresentation(Math.floor(intVal / 100000)) + ' Lakh ';
            intVal %= 100000;
        }
        // Thousands
        if (intVal >= 1000) {
            words += getWordRepresentation(Math.floor(intVal / 1000)) + ' Thousand ';
            intVal %= 1000;
        }
        // Hundreds/Remaining
        if (intVal > 0) {
            words += getWordRepresentation(intVal);
        }
        return words.trim();
    };

    const sign = val < 0 ? 'Minus ' : '';
    val = Math.abs(val);
    const rupees = Math.floor(val);
    const paise = Math.round((val - rupees) * 100);

    let rupeeWords = convertIntegerPart(rupees);
    if (!rupeeWords) rupeeWords = 'Zero';

    let paiseWords = '';
    if (paise > 0) {
        paiseWords = ' and ' + getWordRepresentation(paise) + ' Paise';
    }

    return `Rupees ${sign}${rupeeWords}${paiseWords} Only`;
};

const recalculateFnfLocally = (data) => {
    const baseSalary = parseFloat(data.base_salary) || 0;
    const totalDaysInMonth = parseInt(data.total_days_in_month) || 30;
    const dailyRate = totalDaysInMonth > 0 ? baseSalary / totalDaysInMonth : baseSalary / 30;

    const noticePeriod = parseInt(data.notice_period_days) || 0;
    const noticeAdjustable = parseInt(data.notice_adjustable_days) || 0;
    const shortfallDays = Math.max(0, noticePeriod - noticeAdjustable);
    const noticeRecoveryAmount = dailyRate * shortfallDays;

    const daysSalaryPayable = parseInt(data.days_salary_payable) || 0;
    const lopDays = parseInt(data.lop_days) || 0;
    const effectiveWorkdays = Math.max(0, daysSalaryPayable - lopDays);
    const unpaidSalaryAmount = dailyRate * effectiveWorkdays;

    const plDaysPayable = parseFloat(data.pl_days_payable) || 0;
    const leaveEncashmentAmount = dailyRate * plDaysPayable;

    const gratuityAmount = parseFloat(data.gratuity_amount) || 0;
    const totalOutstandingLoan = parseFloat(data.total_outstanding_loan) || 0;
    const otherAllowances = parseFloat(data.other_allowances) || 0;
    const otherDeductions = parseFloat(data.other_deductions) || 0;

    const fnfNetPayable = unpaidSalaryAmount + leaveEncashmentAmount + gratuityAmount + otherAllowances - noticeRecoveryAmount - totalOutstandingLoan - otherDeductions;

    return {
        ...data,
        daily_rate: parseFloat(dailyRate.toFixed(2)),
        shortfall_days: shortfallDays,
        notice_recovery_amount: parseFloat(noticeRecoveryAmount.toFixed(2)),
        effective_workdays: effectiveWorkdays,
        unpaid_salary_amount: parseFloat(unpaidSalaryAmount.toFixed(2)),
        leave_encashment_amount: parseFloat(leaveEncashmentAmount.toFixed(2)),
        fnf_net_payable: parseFloat(fnfNetPayable.toFixed(2))
    };
};

const formatDateLetter = (dateStr) => {
    if (!dateStr) return '';
    if (String(dateStr).includes('1899') || String(dateStr).includes('0000-00-00')) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const days = d.getDate();
        const mList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const year = d.getFullYear();
        return `${days} ${mList[d.getMonth()]} ${year}`;
    } catch (e) {
        return dateStr;
    }
};

const SettlementLetterContent = ({ data }) => {
    if (!data) return null;

    const unpaidSal = parseFloat(data.unpaid_salary_amount) || 0;
    const leaveEnc = parseFloat(data.leave_encashment_amount) || 0;
    const grat = parseFloat(data.gratuity_amount) || 0;
    const allowances = parseFloat(data.other_allowances) || 0;
    const totalIncome = unpaidSal + leaveEnc + grat + allowances;

    const noticeRec = parseFloat(data.notice_recovery_amount) || 0;
    const loanRec = parseFloat(data.total_outstanding_loan) || 0;
    const deductions = parseFloat(data.other_deductions) || 0;
    const totalDeductions = noticeRec + loanRec + deductions;

    const netPay = totalIncome - totalDeductions;

    return (
        <div className="space-y-6 font-sans text-slate-800 text-xs leading-relaxed">
            {/* Metadata Fields Section - Modern 2-Column Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b border-slate-200 pb-4">
                {[
                    { label: 'Employee ID', val: data.employee_number },
                    { label: 'Full Name', val: data.name },
                    { label: 'Department', val: data.department },
                    { label: 'Designation', val: data.designation },
                    { label: 'Location', val: data.location },
                    { label: 'Date of Joining', val: formatDateLetter(data.joining_date) },
                    { label: 'Resignation Date', val: formatDateLetter(data.resignation_date) },
                    { label: 'Last Working Day', val: formatDateLetter(data.last_working_day) },
                    { label: 'Last Salary Paid', val: data.last_salary_paid || 'N/A' },
                    { label: 'Notice Period', val: `${data.notice_period_days} Days` },
                    { label: 'Notice Adjustable', val: `${data.notice_adjustable_days} Days` },
                    { label: 'PL Days Payable', val: data.pl_days_payable },
                    { label: 'Days Salary Payable', val: data.days_salary_payable },
                    { label: 'Days in Month', val: data.total_days_in_month },
                    { label: 'LOP Days', val: data.lop_days },
                    { label: 'Effective Workdays', val: data.effective_workdays }
                ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-sans text-slate-700 py-0.5 border-b border-dashed border-slate-100">
                        <span className="font-semibold text-slate-500">{item.label}</span>
                        <span className="font-bold text-slate-800">{item.val}</span>
                    </div>
                ))}
            </div>

            {/* Income & Deduction Tables (Side-by-Side) */}
            <div className="pt-2">
                <table className="w-full border-collapse border border-slate-300 text-xs font-sans text-slate-800">
                    <thead>
                        <tr className="border-b border-slate-300 bg-slate-50">
                            <th className="w-1/2 p-2 border-r border-slate-300 text-left font-bold text-slate-700">Income / Earnings (A)</th>
                            <th className="w-1/2 p-2 text-left font-bold text-slate-700">Deductions (B)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="align-top border-b border-slate-300">
                            {/* Income Items */}
                            <td className="p-3 border-r border-slate-300 min-h-[140px] h-[140px]">
                                <div className="flex flex-col justify-between h-full space-y-1">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Unpaid Salary</span>
                                            <span className="font-semibold">{unpaidSal.toFixed(2)}</span>
                                        </div>
                                        {leaveEnc > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Leave Encashment</span>
                                                <span className="font-semibold">{leaveEnc.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {grat > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Gratuity</span>
                                                <span className="font-semibold">{grat.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {allowances > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Other Allowances</span>
                                                <span className="font-semibold">{allowances.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            {/* Deduction Items */}
                            <td className="p-3 min-h-[140px] h-[140px]">
                                <div className="flex flex-col justify-between h-full space-y-1">
                                    <div className="space-y-1.5">
                                        {noticeRec > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Notice Recovery</span>
                                                <span className="font-semibold">{noticeRec.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {loanRec > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Loan Recovery</span>
                                                <span className="font-semibold">{loanRec.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {deductions > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Other Deductions</span>
                                                <span className="font-semibold">{deductions.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                        </tr>
                        {/* Totals */}
                        <tr className="font-bold border-b border-slate-300 bg-slate-50">
                            <td className="p-2 border-r border-slate-300">
                                <div className="flex justify-between text-slate-800">
                                    <span>Total Earnings:</span>
                                    <span>₹{totalIncome.toFixed(2)}</span>
                                </div>
                            </td>
                            <td className="p-2">
                                <div className="flex justify-between text-slate-800">
                                    <span>Total Deductions:</span>
                                    <span>₹{totalDeductions.toFixed(2)}</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Net Pay representation - Highlighted Box */}
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center text-slate-800">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Net Payable Amount (A - B)</span>
                <div className="text-right">
                    <span className="text-sm font-black text-emerald-900 block">₹{netPay.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-700 italic block font-semibold">({numberToWords(netPay)})</span>
                </div>
            </div>

            {/* System Generated Note */}
            <div className="pt-8 border-t border-slate-200 text-center">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                    * This is a system-generated statement. No physical signature is required.
                </p>
            </div>
        </div>
    );
};

const Payroll = () => {
    const [searchParams] = useSearchParams();
    const selectedTab = searchParams.get('tab') || 'overview';
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
    const [showPayrollGuide, setShowPayrollGuide] = useState(false);
    const [selectedOutlet, setSelectedOutlet] = useState('All');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedDesignation, setSelectedDesignation] = useState('All');

    // Issue Salary Advance modal filter state
    const [modalOutlet, setModalOutlet] = useState('All');
    const [modalDept, setModalDept] = useState('All');
    const [modalDesignation, setModalDesignation] = useState('All');

    // Payroll Controls State
    const [controls, setControls] = useState({
        inputs_locked: false,
        employee_view_released: false,
        it_statement_released: false,
        payroll_locked: false
    });
    const [controlsLoading, setControlsLoading] = useState(false);

    const fetchControls = async () => {
        setControlsLoading(true);
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];
            const res = await api.get(`/payroll/controls?month=${month}&year=${year}`);
            setControls(res || {
                inputs_locked: false,
                employee_view_released: false,
                it_statement_released: false,
                payroll_locked: false
            });
        } catch (err) {
            console.error('Failed to fetch controls:', err);
        } finally {
            setControlsLoading(false);
        }
    };

    const handleToggleControl = async (field, value) => {
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];
            const updated = { ...controls, [field]: value };
            setControls(updated);
            await api.post(`/payroll/controls`, {
                month,
                year,
                ...updated
            });
        } catch (err) {
            alert('Failed to update control: ' + (err.response?.data?.message || err.message));
            fetchControls();
        }
    };

    // Financial Year state: FY starts in April
    const currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const [fyStartYear, setFyStartYear] = useState(currentFY);

    // Overview states
    const [summary, setSummary] = useState({
        netPay: 0,
        grossPay: 0,
        deductions: 0,
        totalEmployees: 0,
        additions: 0,
        separations: 0,
        payoutPending: 0,
        processedCount: 0
    });
    const [statements, setStatements] = useState([]);
    const [selectedBreakdown, setSelectedBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pay Register states
    const [registerData, setRegisterData] = useState([]);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [showPaySalaryModal, setShowPaySalaryModal] = useState(false);
    const [paySalaryFilters, setPaySalaryFilters] = useState({ bank: true, cheque: true, cash: true });

    // Salary Structures states
    const [employees, setEmployees] = useState([]);
    const [selectedEmpStructure, setSelectedEmpStructure] = useState(null);
    const [structureLoading, setStructureLoading] = useState(false);
    const [empSalaryData, setEmpSalaryData] = useState({
        base_salary: 0,
        allowances: [],
        deductions: []
    });
    const [newAllowance, setNewAllowance] = useState({ name: '', amount: '' });
    const [newDeduction, setNewDeduction] = useState({ name: '', amount: '' });

    // Global PF & ESIC rules states
    const [globalRules, setGlobalRules] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [showAddRuleForm, setShowAddRuleForm] = useState(false);
    const [newRuleData, setNewRuleData] = useState({
        rule_name: '',
        employee_percentage: 12.00,
        employer_percentage: 12.00,
        base_on: 'base_salary',
        is_active: true
    });

    // Shift & Business Rules states
    const [businessRules, setBusinessRules] = useState({
        shift_start: '09:00',
        shift_end: '18:00',
        grace_period: 15,
        half_day_hours: 4,
        max_late_allowed: 3,
        late_deduction_type: 'half_day',
        late_deduction_value: 0
    });
    const [shifts, setShifts] = useState([]);
    const [selectedShiftId, setSelectedShiftId] = useState(null);
    const [selectedShiftData, setSelectedShiftData] = useState(null);
    const [showAddShift, setShowAddShift] = useState(false);
    const [newShiftData, setNewShiftData] = useState({
        name: '',
        start_time: '09:00',
        end_time: '18:00',
        grace_period: 15,
        grace_count_limit: 3,
        is_night_shift: false,
        is_flexi: false,
        min_hours: 8.0
    });
    const [savingRules, setSavingRules] = useState(false);

    // Loans & Advances states
    const [loans, setLoans] = useState([]);
    const [loansLoading, setLoansLoading] = useState(false);
    const [showAddLoan, setShowAddLoan] = useState(false);
    const [editingLoanId, setEditingLoanId] = useState(null);
    const [newLoanData, setNewLoanData] = useState({
        employee_id: '',
        title: 'Salary Advance',
        amount: '',
        monthly_emi: '',
        status: 'active',
        loan_date: new Date().toISOString().split('T')[0]
    });
    const [activeLoanSubTab, setActiveLoanSubTab] = useState('ledger'); // 'ledger' | 'repayments'
    const [repayments, setRepayments] = useState([]);
    const [repaymentsLoading, setRepaymentsLoading] = useState(false);
    const [showRepayModal, setShowRepayModal] = useState(false);
    const [selectedLoanForRepay, setSelectedLoanForRepay] = useState(null);
    const [selectedOtherDeductions, setSelectedOtherDeductions] = useState(null);
    const [repayData, setRepayData] = useState({
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [repaySubmitting, setRepaySubmitting] = useState(false);

    // Process Payroll Confirmation states
    const [showProcessConfirmation, setShowProcessConfirmation] = useState(false);
    const [previewDeductions, setPreviewDeductions] = useState([]);
    const [approvedLoanIds, setApprovedLoanIds] = useState([]);
    const [loanAmountOverrides, setLoanAmountOverrides] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    const [sendingEmails, setSendingEmails] = useState(false);

    // Separations & FNF States
    const [separations, setSeparations] = useState([]);
    const [separationsLoading, setSeparationsLoading] = useState(false);
    const [activeSeparationTab, setActiveSeparationTab] = useState('active'); // 'active' | 'history'
    const [initiateSubmitting, setInitiateSubmitting] = useState(false);
    const [fnfSettleSubmitting, setFnfSettleSubmitting] = useState(false);
    const [fnfCalculating, setFnfCalculating] = useState(false);

    // Enhanced Wizard & Letter States
    const [showWizardModal, setShowWizardModal] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [wizardMode, setWizardMode] = useState('initiate'); // 'initiate' | 'settle'
    const [selectedSeparation, setSelectedSeparation] = useState(null);
    const [wizardData, setWizardData] = useState({
        employee_id: '',
        employee_number: '',
        name: '',
        department: '',
        designation: '',
        location: '',
        joining_date: '',
        resignation_date: new Date().toISOString().split('T')[0],
        last_working_day: new Date().toISOString().split('T')[0],
        separation_type: 'resignation',
        reason: '',
        last_salary_paid: '',
        notice_period_days: '60',
        notice_adjustable_days: '0',
        pl_days_payable: '0',
        days_salary_payable: '0',
        total_days_in_month: '30',
        lop_days: '0',
        effective_workdays: '0',
        checked_by: '',
        authorized_by: '',
        notice_recovery_amount: 0,
        leave_encashment_amount: 0,
        gratuity_amount: 0,
        unpaid_salary_amount: 0,
        other_allowances: '0',
        other_deductions: '0',
        fnf_net_payable: 0,
        notes: '',
        payment_method: 'bank_transfer',
        total_available_leaves: 0,
        total_outstanding_loan: 0,
        outstanding_loans: []
    });
    const [showLetterModal, setShowLetterModal] = useState(false);
    const [letterData, setLetterData] = useState(null);

    const [simBasic, setSimBasic] = useState(30000);
    const [simAllowances, setSimAllowances] = useState(10000);

    // --- Payroll Inputs (Salary Revisions) States ---
    const [selectedInputsEmployee, setSelectedInputsEmployee] = useState(null);
    const [inputsHistory, setInputsHistory] = useState([]);
    const [selectedRevision, setSelectedRevision] = useState(null);
    const [isRevisionEditing, setIsRevisionEditing] = useState(false);
    const [isAddingNewRevision, setIsAddingNewRevision] = useState(false);
    const [revisionLoading, setRevisionLoading] = useState(false);
    const [inputsSearchQuery, setInputsSearchQuery] = useState('');
    const [loansSearchQuery, setLoansSearchQuery] = useState('');

    // Form inputs state
    const [grossInput, setGrossInput] = useState('');
    const [effectiveFromInput, setEffectiveFromInput] = useState('');
    const [payoutMonthInput, setPayoutMonthInput] = useState('');
    const [revisionRemarks, setRevisionRemarks] = useState('');
    const [revisionNotes, setRevisionNotes] = useState('');

    // Granular Salary Component Inputs
    const [basicInput, setBasicInput] = useState('');
    const [hraInput, setHraInput] = useState('');
    const [specialAllowanceInput, setSpecialAllowanceInput] = useState('');
    const [medicalAllowanceInput, setMedicalAllowanceInput] = useState('');
    const [employerPfInput, setEmployerPfInput] = useState('');
    const [employerEsicInput, setEmployerEsicInput] = useState('');
    const [employeePfInput, setEmployeePfInput] = useState('');
    const [employeeEsicInput, setEmployeeEsicInput] = useState('');
    const [percentInputs, setPercentInputs] = useState({});

    // Sidebar Collapsible States
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const monthMap = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

    const hasPfRule = globalRules.some(r => !!r.is_active && (r.rule_name.toLowerCase().includes('pf') || r.rule_name.toLowerCase().includes('provident')));
    const hasEsiRule = globalRules.some(r => !!r.is_active && (r.rule_name.toLowerCase().includes('esic') || r.rule_name.toLowerCase().includes('esi') || r.rule_name.toLowerCase().includes('insurance')));
    const hasLwfRule = globalRules.some(r => !!r.is_active && r.rule_name.toLowerCase().includes('lwf'));
    const hasGratuityRule = globalRules.some(r => !!r.is_active && r.rule_name.toLowerCase().includes('gratuity'));

    const pfRule = globalRules.find(r => !!r.is_active && (r.rule_name.toLowerCase().includes('pf') || r.rule_name.toLowerCase().includes('provident')));
    const esiRule = globalRules.find(r => !!r.is_active && (r.rule_name.toLowerCase().includes('esic') || r.rule_name.toLowerCase().includes('esi') || r.rule_name.toLowerCase().includes('insurance')));

    const pfEeRate = pfRule ? (parseFloat(pfRule.employee_percentage) / 100) : 0;
    const pfErRate = pfRule ? (parseFloat(pfRule.employer_percentage) / 100) : 0;
    const esiEeRate = esiRule ? (parseFloat(esiRule.employee_percentage) / 100) : 0;
    const esiErRate = esiRule ? (parseFloat(esiRule.employer_percentage) / 100) : 0;

    const isRuleApplicableLocal = (emp, rule, defaultCol) => {
        if (!emp) return true;
        if (emp.applicable_statutory_rules) {
            try {
                const ruleIds = typeof emp.applicable_statutory_rules === 'string'
                    ? JSON.parse(emp.applicable_statutory_rules)
                    : emp.applicable_statutory_rules;
                if (Array.isArray(ruleIds)) {
                    return ruleIds.includes(rule.id);
                }
            } catch (e) {}
        }
        return emp[defaultCol] !== undefined ? !!emp[defaultCol] : true;
    };

    useEffect(() => {
        fetchControls();
        fetchEmployees();
        fetchGlobalRules();
        if (selectedTab === 'overview') {
            fetchSummary();
            fetchBusinessRules();
        } else if (selectedTab === 'register') {
            fetchRegister();
        } else if (selectedTab === 'inputs') {
            // Handled by fetchEmployees() above
        } else if (selectedTab === 'global-rules') {
            // Handled by fetchGlobalRules() above
        } else if (selectedTab === 'shift-rules') {
            fetchBusinessRules();
        } else if (selectedTab === 'loans') {
            fetchLoans();
            fetchRepayments();
        } else if (selectedTab === 'separations') {
            fetchSeparations();
        }
    }, [selectedTab, selectedMonth]);

    const fetchSeparations = async () => {
        setSeparationsLoading(true);
        try {
            const res = await api.get('/payroll/separations');
            setSeparations(res);
        } catch (err) {
            console.error('Failed to fetch separations:', err);
        } finally {
            setSeparationsLoading(false);
        }
    };

    const mapCalcToWizardData = (res, empId) => {
        return {
            employee_id: empId || res.employee?.id || '',
            employee_number: res.employee?.employee_id_number || '',
            name: `${res.employee?.first_name || ''} ${res.employee?.last_name || ''}`.trim(),
            department: res.employee?.department_name || '',
            designation: res.employee?.designation || '',
            location: res.location || res.employee?.city || res.employee?.state || 'Jaipur',
            joining_date: res.employee?.joining_date ? res.employee.joining_date.split('T')[0] : '',
            resignation_date: res.resignation_date ? res.resignation_date.split('T')[0] : new Date().toISOString().split('T')[0],
            last_working_day: res.last_working_day ? res.last_working_day.split('T')[0] : new Date().toISOString().split('T')[0],
            separation_type: res.separation_type || 'resignation',
            reason: res.reason || '',
            last_salary_paid: res.last_salary_paid || '',
            notice_period_days: String(res.notice_period_days || '0'),
            notice_adjustable_days: String(res.notice_adjustable_days || '0'),
            pl_days_payable: String(res.pl_days_payable || '0'),
            days_salary_payable: String(res.days_salary_payable || '0'),
            total_days_in_month: String(res.total_days_in_month || '30'),
            lop_days: String(res.lop_days || '0'),
            effective_workdays: String(res.effective_workdays || '0'),
            checked_by: res.checked_by || '',
            authorized_by: res.authorized_by || '',
            notice_recovery_amount: res.notice_recovery_amount || 0,
            leave_encashment_amount: res.leave_encashment_amount || 0,
            gratuity_amount: res.gratuity_amount || 0,
            unpaid_salary_amount: res.unpaid_salary_amount || 0,
            other_allowances: String(res.other_allowances || '0'),
            other_deductions: String(res.other_deductions || '0'),
            fnf_net_payable: res.fnf_net_payable || 0,
            notes: res.notes || '',
            payment_method: res.payment_method || 'bank_transfer',
            total_available_leaves: res.total_available_leaves || 0,
            total_outstanding_loan: res.total_outstanding_loan || 0,
            outstanding_loans: res.outstanding_loans || [],
            base_salary: res.base_salary || 0
        };
    };

    const handleWizardEmployeeSelect = async (empId) => {
        if (!empId) return;
        setFnfCalculating(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const res = await api.get(`/payroll/separations/calculate/${empId}?last_working_day=${todayStr}&resignation_date=${todayStr}`);
            const mapped = mapCalcToWizardData(res, empId);
            setWizardData(mapped);
        } catch (err) {
            console.error('Failed to calculate initial FNF values:', err);
            alert('Failed to load employee details and initial calculations.');
        } finally {
            setFnfCalculating(false);
        }
    };

    const handleWizardDataChange = (field, value) => {
        setWizardData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'last_working_day' || field === 'resignation_date' || field === 'joining_date') {
                const lwd = updated.last_working_day;
                if (lwd) {
                    const lwdDate = new Date(lwd);
                    if (!isNaN(lwdDate.getTime())) {
                        updated.total_days_in_month = String(new Date(lwdDate.getFullYear(), lwdDate.getMonth() + 1, 0).getDate());
                        let defaultDays = 0;
                        if (updated.joining_date) {
                            const joinDate = new Date(updated.joining_date);
                            if (!isNaN(joinDate.getTime())) {
                                if (joinDate.getFullYear() === lwdDate.getFullYear() && joinDate.getMonth() === lwdDate.getMonth()) {
                                    defaultDays = Math.max(0, lwdDate.getDate() - joinDate.getDate() + 1);
                                } else {
                                    defaultDays = lwdDate.getDate();
                                }
                            } else {
                                defaultDays = lwdDate.getDate();
                            }
                        } else {
                            defaultDays = lwdDate.getDate();
                        }
                        updated.days_salary_payable = String(defaultDays);
                    }
                }
            }
            return recalculateFnfLocally(updated);
        });
    };

    const handleWizardInitiate = async () => {
        if (!wizardData.employee_id) {
            alert('Please select an employee');
            return;
        }
        setInitiateSubmitting(true);
        try {
            await api.post('/payroll/separations', {
                employee_id: parseInt(wizardData.employee_id),
                resignation_date: wizardData.resignation_date,
                last_working_day: wizardData.last_working_day,
                reason: wizardData.reason,
                separation_type: wizardData.separation_type,
                notice_period_days: parseInt(wizardData.notice_period_days) || 0,
                notice_adjustable_days: parseInt(wizardData.notice_adjustable_days) || 0,
                pl_days_payable: parseFloat(wizardData.pl_days_payable) || 0,
                days_salary_payable: parseInt(wizardData.days_salary_payable) || 0,
                total_days_in_month: parseInt(wizardData.total_days_in_month) || 30,
                lop_days: parseInt(wizardData.lop_days) || 0,
                effective_workdays: parseInt(wizardData.effective_workdays) || 0,
                checked_by: wizardData.checked_by || '',
                authorized_by: wizardData.authorized_by || '',
                location: wizardData.location || '',
                last_salary_paid: wizardData.last_salary_paid || '',
                notice_recovery_amount: parseFloat(wizardData.notice_recovery_amount) || 0,
                leave_encashment_amount: parseFloat(wizardData.leave_encashment_amount) || 0,
                gratuity_amount: parseFloat(wizardData.gratuity_amount) || 0,
                unpaid_salary_amount: parseFloat(wizardData.unpaid_salary_amount) || 0,
                other_allowances: parseFloat(wizardData.other_allowances) || 0,
                other_deductions: parseFloat(wizardData.other_deductions) || 0,
                total_outstanding_loan: parseFloat(wizardData.total_outstanding_loan) || 0,
                fnf_net_payable: parseFloat(wizardData.fnf_net_payable) || 0,
                notes: wizardData.notes
            });
            setShowWizardModal(false);
            fetchSeparations();
            alert('Exit process initiated successfully.');
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to initiate exit process');
        } finally {
            setInitiateSubmitting(false);
        }
    };

    const fetchFnfCalculation = async (separation) => {
        setFnfCalculating(true);
        setWizardMode('settle');
        setSelectedSeparation(separation);
        setWizardStep(1);
        setShowWizardModal(true);
        try {
            const res = await api.get(`/payroll/separations/calculate/${separation.employee_id}?last_working_day=${separation.last_working_day}&resignation_date=${separation.resignation_date}&notice_period_days=${separation.notice_period_days}&notice_adjustable_days=${separation.notice_adjustable_days}&pl_days_payable=${separation.pl_days_payable}&days_salary_payable=${separation.days_salary_payable}&total_days_in_month=${separation.total_days_in_month}&lop_days=${separation.lop_days}&other_allowances=${separation.other_allowances}&other_deductions=${separation.other_deductions}`);
            const mapped = mapCalcToWizardData(res, separation.employee_id);
            setWizardData({
                ...mapped,
                payment_method: separation.payment_method || 'bank_transfer',
                notes: separation.notes || '',
                checked_by: separation.checked_by || mapped.checked_by || '',
                authorized_by: separation.authorized_by || mapped.authorized_by || '',
                location: separation.location || mapped.location || '',
                last_salary_paid: separation.last_salary_paid || mapped.last_salary_paid || ''
            });
        } catch (err) {
            console.error('Failed to calculate FNF:', err);
            alert('Failed to load FNF calculation details.');
        } finally {
            setFnfCalculating(false);
        }
    };

    const handleWizardSettle = async () => {
        if (!selectedSeparation) return;
        setFnfSettleSubmitting(true);
        try {
            await api.post(`/payroll/separations/settle/${selectedSeparation.id}`, {
                notice_recovery_amount: parseFloat(wizardData.notice_recovery_amount) || 0,
                leave_encashment_amount: parseFloat(wizardData.leave_encashment_amount) || 0,
                gratuity_amount: parseFloat(wizardData.gratuity_amount) || 0,
                unpaid_salary_amount: parseFloat(wizardData.unpaid_salary_amount) || 0,
                other_allowances: parseFloat(wizardData.other_allowances) || 0,
                other_deductions: parseFloat(wizardData.other_deductions) || 0,
                total_outstanding_loan: parseFloat(wizardData.total_outstanding_loan) || 0,
                fnf_net_payable: parseFloat(wizardData.fnf_net_payable) || 0,
                payment_method: wizardData.payment_method,
                notes: wizardData.notes,
                last_working_day: wizardData.last_working_day,
                resignation_date: wizardData.resignation_date,
                location: wizardData.location,
                last_salary_paid: wizardData.last_salary_paid,
                notice_adjustable_days: parseInt(wizardData.notice_adjustable_days) || 0,
                pl_days_payable: parseFloat(wizardData.pl_days_payable) || 0,
                days_salary_payable: parseInt(wizardData.days_salary_payable) || 0,
                total_days_in_month: parseInt(wizardData.total_days_in_month) || 30,
                lop_days: parseInt(wizardData.lop_days) || 0,
                effective_workdays: parseInt(wizardData.effective_workdays) || 0,
                checked_by: wizardData.checked_by,
                authorized_by: wizardData.authorized_by
            });
            setShowWizardModal(false);
            setSelectedSeparation(null);
            fetchSeparations();
            alert('Full & Final settlement completed and employee deactivated successfully.');
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to complete FNF settlement');
        } finally {
            setFnfSettleSubmitting(false);
        }
    };

    const handleDeleteSeparation = async (id) => {
        if (!confirm('Are you sure you want to delete this separation process? This reverts the resignation fields on the employee profile.')) return;
        try {
            await api.delete(`/payroll/separations/${id}`);
            fetchSeparations();
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to cancel separation');
        }
    };

    const handleViewSettledFnf = (separation) => {
        const data = {
            employee_number: separation.employee_id_number,
            name: `${separation.first_name || ''} ${separation.last_name || ''}`.trim(),
            department: separation.department_name || separation.department || '',
            designation: separation.designation,
            location: separation.location || 'Jaipur',
            joining_date: separation.joining_date,
            resignation_date: separation.resignation_date,
            last_working_day: separation.last_working_day,
            last_salary_paid: separation.last_salary_paid || '',
            notice_period_days: separation.notice_period_days,
            notice_adjustable_days: separation.notice_adjustable_days,
            pl_days_payable: separation.pl_days_payable,
            days_salary_payable: separation.days_salary_payable,
            total_days_in_month: separation.total_days_in_month,
            lop_days: separation.lop_days,
            effective_workdays: separation.effective_workdays,
            notice_recovery_amount: parseFloat(separation.notice_recovery_amount) || 0,
            leave_encashment_amount: parseFloat(separation.leave_encashment_amount) || 0,
            gratuity_amount: parseFloat(separation.gratuity_amount) || 0,
            unpaid_salary_amount: parseFloat(separation.unpaid_salary_amount) || 0,
            other_allowances: parseFloat(separation.other_allowances) || 0,
            other_deductions: parseFloat(separation.other_deductions) || 0,
            total_outstanding_loan: parseFloat(separation.total_outstanding_loan) || 0,
            fnf_net_payable: parseFloat(separation.fnf_net_payable) || 0,
            checked_by: separation.checked_by || '',
            authorized_by: separation.authorized_by || '',
            notes: separation.notes || '',
            payment_method: separation.payment_method || 'bank_transfer'
        };
        setLetterData(data);
        setShowLetterModal(true);
    };

    // --- Overview Methods ---
    const fetchSummary = async () => {
        setLoading(true);
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];

            const res = await api.get(`/payroll/summary?month=${month}&year=${year}`);
            setSummary(res);

            const stmtRes = await api.get(`/payroll/statements?month=${month}&year=${year}`);
            setStatements(stmtRes);
        } catch (err) {
            console.error('Failed to fetch summary:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayroll = async () => {
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];

            // 1. Fetch preview of active loan deductions first
            const deductionsPreview = await api.get(`/payroll/loans/preview-deductions?month=${month}&year=${year}`);

            if (deductionsPreview && deductionsPreview.length > 0) {
                // If there are active loan deductions, show confirmation modal
                setPreviewDeductions(deductionsPreview);
                setApprovedLoanIds(deductionsPreview.map(d => d.id));

                // Initialize overrides with standard planned_emi values
                const initialOverrides = {};
                deductionsPreview.forEach(d => {
                    initialOverrides[d.id] = d.planned_emi;
                });
                setLoanAmountOverrides(initialOverrides);

                setShowProcessConfirmation(true);
            } else {
                // Otherwise proceed directly
                if (window.confirm(`Are you sure you want to process payroll for ${selectedMonth}?`)) {
                    setIsProcessing(true);
                    const res = await api.post('/payroll/process', { month, year });
                    alert(res.message || 'Payroll processed successfully!');
                    fetchSummary();
                }
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmProcessPayroll = async () => {
        setIsProcessing(true);
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];

            // Build the approved payload with custom amounts
            const payloadApprovedLoans = approvedLoanIds.map(id => ({
                id: id,
                amount: parseFloat(loanAmountOverrides[id] !== undefined ? loanAmountOverrides[id] : 0)
            }));

            const res = await api.post('/payroll/process', {
                month,
                year,
                approvedLoanIds: payloadApprovedLoans
            });
            alert(res.message || 'Payroll processed successfully!');
            setShowProcessConfirmation(false);
            fetchSummary();
        } catch (err) {
            alert(err.response?.data?.message || 'Processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendBulkEmail = async () => {
        const [mName, year] = selectedMonth.split(' ');
        const month = monthMap[mName];
        if (!window.confirm(`Are you sure you want to dispatch bulk PDF payslips for ${selectedMonth} to all employees via email? Only employees whose payroll is marked as 'paid' will receive emails.`)) {
            return;
        }
        setSendingEmails(true);
        try {
            const res = await api.post('/payroll/bulk-email-payslips', { month, year });
            const { totalCount, successfulCount, failedCount } = res.result || {};
            alert(`Bulk payslip mailing complete!\n- Sent successfully: ${successfulCount}\n- Failed / Missing email: ${failedCount}\n- Total processed: ${totalCount}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to dispatch emails');
        } finally {
            setSendingEmails(false);
        }
    };

    const handleExportEPFECR = async () => {
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];

            const response = await api.get(`/payroll/export-epf-ecr?month=${month}&year=${year}`, {
                responseType: 'blob'
            });

            const blob = new Blob([response], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `EPF_ECR_${mName}_${year}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to export EPFO ECR: ' + err.message);
        }
    };

    const handleExportESICCSV = async () => {
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];

            const response = await api.get(`/payroll/export-esic-ecr?month=${month}&year=${year}`, {
                responseType: 'blob'
            });

            const blob = new Blob([response], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ESIC_Payroll_${mName}_${year}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to export ESIC CSV: ' + err.message);
        }
    };

    const handleExportPaySalaryCSV = () => {
        const targetData = registerData;
        if (!targetData || targetData.length === 0) {
            alert("No data available to export.");
            return;
        }

        // If all three modes selected (i.e. "All" effectively chosen), skip filtering
        const allSelected = paySalaryFilters.bank && paySalaryFilters.cheque && paySalaryFilters.cash;
        const filteredData = allSelected
            ? targetData
            : targetData.filter(reg => {
                const mode = (reg.payment_type || '').toLowerCase().trim();
                if (paySalaryFilters.bank && (mode === 'bank' || mode === 'bank transfer')) return true;
                if (paySalaryFilters.cheque && mode === 'cheque') return true;
                if (paySalaryFilters.cash && mode === 'cash') return true;
                return false;
              });

        if (filteredData.length === 0) {
            alert("No employees match the selected payment modes.");
            return;
        }

        const activeRules = globalRules.filter(r => !!r.is_active);

        const dataToExport = filteredData.map(reg => {
            const formatNum = (val) => {
                const parsed = parseFloat(val);
                return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
            };

            // 1. Employee Info & Bank Details
            const row = {
                employee_id_number: reg.employee_id_number,
                name: `${reg.first_name || ''} ${reg.last_name || ''}`.trim(),
                designation: reg.designation,
                department: reg.department || reg.department_name || '',
                location: reg.location || reg.office_location || '',
                payment_type: reg.payment_type || '',
                bank_name: reg.bank_name || '',
                bank_branch: reg.bank_branch || '',
                account_number: reg.account_number ? `'${reg.account_number}` : '',
                ifsc_code: reg.ifsc_code || '',
                uan_number: reg.uan_number ? `'${reg.uan_number}` : '',
                esi_number: reg.esi_number ? `'${reg.esi_number}` : '',
                // 2. Attendance Stats
                presents: reg.stats?.P || 0,
                leaves: reg.stats?.L || 0,
                absents: reg.stats?.A || 0,
                weekoffs_holidays: (reg.stats?.OFF || 0) + (reg.stats?.H || 0),
                // 3. Structured / Base Salaries
                base_salary: formatNum(reg.full_base_salary !== undefined && reg.full_base_salary !== null ? reg.full_base_salary : (reg.base_salary || 0)),
                total_allowances: formatNum(reg.full_total_allowances !== undefined && reg.full_total_allowances !== null ? reg.full_total_allowances : (reg.total_allowances || 0))
            };

            // Calculated fields: Total Gross (Structured Gross)
            row.total_gross = formatNum((parseFloat(row.base_salary) || 0) + (parseFloat(row.total_allowances) || 0));

            // 4. Earned / Actual Salaries
            row.actual_basic = formatNum(reg.base_salary || 0);
            row.actual_allowances = formatNum(reg.total_allowances || 0);
            row.actual_gross = formatNum((parseFloat(row.actual_basic) || 0) + (parseFloat(row.actual_allowances) || 0));

            // 5. Deductions & Adjustments
            row.late_mark_deduction = formatNum(reg.late_mark_deduction || 0);
            row.overtime_bonus = formatNum(reg.overtime_bonus || 0);
            row.manual_deduction_override = formatNum(reg.manual_deduction_override || 0);

            // 6 & 7. Active statutory rules - Employee & Employer side
            activeRules.forEach(rule => {
                const eeShareVal = (() => {
                    if (reg.statutory_rules_breakdown) {
                        try {
                            const breakdown = typeof reg.statutory_rules_breakdown === 'string'
                                ? JSON.parse(reg.statutory_rules_breakdown)
                                : reg.statutory_rules_breakdown;
                            if (breakdown && typeof breakdown === 'object') {
                                const item = breakdown[rule.id] || breakdown[rule.rule_name] || (Array.isArray(breakdown) && breakdown.find(r => r.rule_name === rule.rule_name));
                                if (item) {
                                    if (item.employeeShare !== undefined) return parseFloat(item.employeeShare) || 0;
                                    if (item.employee_share !== undefined) return parseFloat(item.employee_share) || 0;
                                }
                            }
                        } catch (e) {}
                    }
                    
                    const nameLower = rule.rule_name.toLowerCase();
                    if (nameLower.includes('pf') || nameLower.includes('provident')) {
                        return parseFloat(reg.employee_pf) || 0;
                    }
                    if (nameLower.includes('esic') || nameLower.includes('esi') || nameLower.includes('insurance')) {
                        return parseFloat(reg.employee_esic) || 0;
                    }
                    if (nameLower.includes('gratuity')) {
                        return parseFloat(reg.gratuity_share) || 0;
                    }
                    return 0;
                })();

                const erShareVal = (() => {
                    if (reg.statutory_rules_breakdown) {
                        try {
                            const breakdown = typeof reg.statutory_rules_breakdown === 'string'
                                ? JSON.parse(reg.statutory_rules_breakdown)
                                : reg.statutory_rules_breakdown;
                            if (breakdown && typeof breakdown === 'object') {
                                const item = breakdown[rule.id] || breakdown[rule.rule_name] || (Array.isArray(breakdown) && breakdown.find(r => r.rule_name === rule.rule_name));
                                if (item) {
                                    if (item.employerShare !== undefined) return parseFloat(item.employerShare) || 0;
                                    if (item.employer_share !== undefined) return parseFloat(item.employer_share) || 0;
                                }
                            }
                        } catch (e) {}
                    }
                    
                    const nameLower = rule.rule_name.toLowerCase();
                    if (nameLower.includes('pf') || nameLower.includes('provident')) {
                        return parseFloat(reg.employer_pf) || 0;
                    }
                    if (nameLower.includes('esic') || nameLower.includes('esi') || nameLower.includes('insurance')) {
                        return parseFloat(reg.employer_esic) || 0;
                    }
                    return 0;
                })();

                row[`rule_ee_${rule.id}`] = formatNum(eeShareVal);
                row[`rule_er_${rule.id}`] = formatNum(erShareVal);
            });

            // 8. Summary Totals
            row.total_deductions = formatNum(reg.total_deductions || 0);
            row.remaining_loan = formatNum(reg.remaining_loan || 0);
            row.loan_emi_deduction = formatNum(reg.loan_emi_deduction || 0);
            row.net_salary = formatNum(reg.net_salary || 0);
            row.status = reg.status || 'draft';

            return row;
        });

        const headers = {
            employee_id_number: 'Employee ID',
            name: 'Employee Name',
            designation: 'Designation',
            department: 'Department',
            location: 'Location',
            payment_type: 'Payment Mode',
            bank_name: 'Bank Name',
            bank_branch: 'Bank Branch',
            account_number: 'Account Number',
            ifsc_code: 'IFSC Code',
            uan_number: 'UAN Number',
            esi_number: 'ESIC Number',
            presents: 'Presents (P)',
            leaves: 'Late In',
            absents: 'Absents (A)',
            weekoffs_holidays: 'Weekoffs/Holidays (OFF/H)',
            base_salary: 'Base Salary',
            total_allowances: 'Allowances',
            total_gross: 'Total Gross',
            actual_basic: 'Actual Basic',
            actual_allowances: 'Actual Allowances',
            actual_gross: 'Actual Gross',
            late_mark_deduction: 'Late Penalty',
            overtime_bonus: 'Bonus / Incentives',
            manual_deduction_override: 'Manual Deductions'
        };

        activeRules.forEach(rule => {
            headers[`rule_ee_${rule.id}`] = `${rule.rule_name} (Employee)`;
            headers[`rule_er_${rule.id}`] = `${rule.rule_name} (Employer)`;
        });

        headers.total_deductions = 'Other Deductions';
        headers.remaining_loan = 'Outstanding Loan';
        headers.loan_emi_deduction = 'Loan EMI';
        headers.net_salary = 'Net Payable';
        headers.status = 'Status';

        exportToCSV(dataToExport, `Pay_Salary_${selectedMonth.replace(' ', '_')}.csv`, headers);
        setShowPaySalaryModal(false);
    };

    const handleExportRegisterCSV = () => {
        const targetData = registerData; // Export all employees for completeness
        if (!targetData || targetData.length === 0) {
            alert("No data available to export.");
            return;
        }

        const activeRules = globalRules.filter(r => !!r.is_active);

        const dataToExport = targetData.map(reg => {
            const row = {
                employee_id_number: reg.employee_id_number,
                name: `${reg.first_name || ''} ${reg.last_name || ''}`.trim(),
                designation: reg.designation,
                department: reg.department || reg.department_name || '',
                location: reg.location || reg.office_location || '',
                payment_type: reg.payment_type || '',
                bank_name: reg.bank_name || '',
                bank_branch: reg.bank_branch || '',
                account_number: reg.account_number ? `'${reg.account_number}` : '',
                ifsc_code: reg.ifsc_code || '',
                uan_number: reg.uan_number ? `'${reg.uan_number}` : '',
                esi_number: reg.esi_number ? `'${reg.esi_number}` : '',
                presents: reg.stats?.P || 0,
                leaves: reg.stats?.L || 0,
                absents: reg.stats?.A || 0,
                weekoffs_holidays: (reg.stats?.OFF || 0) + (reg.stats?.H || 0),
                base_salary: reg.full_base_salary !== undefined && reg.full_base_salary !== null ? reg.full_base_salary : (reg.base_salary || 0),
                total_allowances: reg.full_total_allowances !== undefined && reg.full_total_allowances !== null ? reg.full_total_allowances : (reg.total_allowances || 0),
                unpaid_leave_deduction: reg.unpaid_leave_deduction || 0,
                late_mark_deduction: reg.late_mark_deduction || 0,
                overtime_bonus: reg.overtime_bonus || 0,
                manual_deduction_override: reg.manual_deduction_override || 0
            };

            activeRules.forEach(rule => {
                const breakdownVal = (() => {
                    if (reg.statutory_rules_breakdown) {
                        try {
                            const breakdown = typeof reg.statutory_rules_breakdown === 'string'
                                ? JSON.parse(reg.statutory_rules_breakdown)
                                : reg.statutory_rules_breakdown;
                            if (breakdown && typeof breakdown === 'object') {
                                const item = breakdown[rule.id] || breakdown[rule.rule_name];
                                if (item && item.employeeShare !== undefined) {
                                    return parseFloat(item.employeeShare) || 0;
                                }
                            }
                        } catch (e) {}
                    }
                    
                    const nameLower = rule.rule_name.toLowerCase();
                    if (nameLower.includes('pf') || nameLower.includes('provident')) {
                        return parseFloat(reg.employee_pf) || 0;
                    }
                    if (nameLower.includes('esic') || nameLower.includes('esi') || nameLower.includes('insurance')) {
                        return parseFloat(reg.employee_esic) || 0;
                    }
                    if (nameLower.includes('gratuity')) {
                        return parseFloat(reg.gratuity_share) || 0;
                    }
                    return 0;
                })();

                row[`rule_${rule.id}`] = breakdownVal;
            });

            row.total_deductions = reg.total_deductions || 0;
            row.loan_emi_deduction = reg.loan_emi_deduction || 0;
            row.remaining_loan = reg.remaining_loan || 0;
            row.net_salary = reg.net_salary || 0;
            row.status = reg.status || 'draft';

            return row;
        });

        const headers = {
            employee_id_number: 'Employee ID',
            name: 'Employee Name',
            designation: 'Designation',
            department: 'Department',
            location: 'Location',
            payment_type: 'Payment Mode',
            bank_name: 'Bank Name',
            bank_branch: 'Bank Branch',
            account_number: 'Account Number',
            ifsc_code: 'IFSC Code',
            uan_number: 'UAN Number',
            esi_number: 'ESIC Number',
            presents: 'Presents (P)',
            leaves: 'Late In',
            absents: 'Absents (A)',
            weekoffs_holidays: 'Weekoffs/Holidays (OFF/H)',
            base_salary: 'Base Salary',
            total_allowances: 'Allowances',
            unpaid_leave_deduction: 'Leaves Cut',
            late_mark_deduction: 'Late Penalty',
            overtime_bonus: 'Bonus / Incentives',
            manual_deduction_override: 'Manual Deductions'
        };

        activeRules.forEach(rule => {
            headers[`rule_${rule.id}`] = rule.rule_name;
        });

        headers.total_deductions = 'Other Deductions';
        headers.remaining_loan = 'Outstanding Loan';
        headers.loan_emi_deduction = 'Loan EMI';
        headers.net_salary = 'Net Payable';
        headers.status = 'Status';

        exportToCSV(dataToExport, `Pay_Register_${selectedMonth.replace(' ', '_')}.csv`, headers);
    };

    const handleExportLoansCSV = () => {
        if (!searchedLoans || searchedLoans.length === 0) {
            alert("No loan data available to export.");
            return;
        }

        // 1. Loans Ledger Section
        const loanHeaders = ['Employee ID', 'Employee Name', 'Title / Purpose', 'Loan Date', 'Loan Amount', 'Repayment EMI', 'Outstanding Balance', 'Progress', 'Status'];
        const loanRows = searchedLoans.map(loan => {
            const principal = parseFloat(loan.amount) || 1;
            const remaining = parseFloat(loan.remaining_balance) || 0;
            const pctPaid = Math.min(100, Math.max(0, ((principal - remaining) / principal) * 100));
            const loanDateStr = loan.loan_date 
                ? new Date(loan.loan_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                : new Date(loan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            return [
                loan.employee_id_number || '',
                `${loan.first_name || ''} ${loan.last_name || ''}`.trim(),
                loan.title || '',
                loanDateStr,
                loan.amount || 0,
                loan.monthly_emi || 0,
                loan.remaining_balance || 0,
                `${pctPaid.toFixed(0)}% Repaid`,
                loan.status || ''
            ];
        });

        // 2. Repayment Logs Section
        const repaymentHeaders = ['Employee ID', 'Employee Name', 'Loan Title', 'Repayment Date & Time', 'Amount Settled', 'Method', 'Notes / Reason'];
        const repaymentRows = searchedRepayments.map(repay => {
            const repayDateStr = new Date(repay.payment_date).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            return [
                repay.employee_id_number || '',
                `${repay.first_name || ''} ${repay.last_name || ''}`.trim(),
                repay.loan_title || '',
                repayDateStr,
                repay.amount_paid || 0,
                repay.payment_method || '',
                repay.notes || '-'
            ];
        });

        // Format to CSV string with section headers
        const csvRows = [];
        csvRows.push('"AMORTIZED ADVANCES & LOAN LEDGER"');
        csvRows.push(loanHeaders.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
        loanRows.forEach(row => {
            csvRows.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
        });

        csvRows.push('');
        csvRows.push('');
        
        csvRows.push('"REPAYMENT LOGS"');
        csvRows.push(repaymentHeaders.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
        repaymentRows.forEach(row => {
            csvRows.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
        });

        const csvContent = csvRows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Loans_Report_${selectedMonth.replace(' ', '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportInputsCSV = () => {
        if (!inputsHistory || inputsHistory.length === 0) {
            alert("No revision history available to export.");
            return;
        }
        const dataToExport = inputsHistory.map(rev => ({
            payout_month: rev.payout_month || '',
            effective_from: rev.effective_from ? rev.effective_from.split('T')[0] : '',
            gross_salary: rev.gross_salary || 0,
            basic: rev.basic || 0,
            hra: rev.hra || 0,
            special_allowance: rev.special_allowance || 0,
            medical_allowance: rev.medical_allowance || 0,
            employee_pf: rev.employee_pf || 0,
            employee_esic: rev.employee_esic || 0,
            employer_pf: rev.employer_pf || 0,
            employer_esic: rev.employer_esic || 0,
            remarks: rev.remarks || '',
            notes: rev.notes || ''
        }));

        const headers = {
            payout_month: 'Payout Month',
            effective_from: 'Effective From',
            gross_salary: 'Gross Salary',
            basic: 'Basic Salary',
            hra: 'HRA',
            special_allowance: 'Special Allowance',
            medical_allowance: 'Medical Allowance',
            employee_pf: 'Employee PF Share',
            employee_esic: 'Employee ESIC Share',
            employer_pf: 'Employer PF Share',
            employer_esic: 'Employer ESIC Share',
            remarks: 'Remarks',
            notes: 'Notes'
        };

        const empName = selectedInputsEmployee ? `${selectedInputsEmployee.first_name}_${selectedInputsEmployee.last_name}` : 'Employee';
        exportToCSV(dataToExport, `Salary_Revisions_${empName}_${new Date().toISOString().split('T')[0]}.csv`, headers);
    };

    const handleExportSeparationsCSV = () => {
        if (!filteredSeparations || filteredSeparations.length === 0) {
            alert("No separations records available to export.");
            return;
        }
        const dataToExport = filteredSeparations.map(s => ({
            employee_id_number: s.employee_id_number,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            designation: s.designation,
            department_name: s.department_name,
            resignation_date: s.resignation_date ? s.resignation_date.split('T')[0] : '',
            last_working_day: s.last_working_day ? s.last_working_day.split('T')[0] : '',
            separation_type: s.separation_type || '',
            settlement_status: s.settlement_status || '',
            fnf_net_payable: s.fnf_net_payable || 0,
            unpaid_salary_amount: s.unpaid_salary_amount || 0,
            leave_encashment_amount: s.leave_encashment_amount || 0,
            gratuity_amount: s.gratuity_amount || 0,
            notice_recovery_amount: s.notice_recovery_amount || 0,
            total_outstanding_loan: s.total_outstanding_loan || 0,
            other_allowances: s.other_allowances || 0,
            other_deductions: s.other_deductions || 0,
            notes: s.notes || ''
        }));

        const headers = {
            employee_id_number: 'Employee ID',
            name: 'Employee Name',
            designation: 'Designation',
            department_name: 'Department',
            resignation_date: 'Resignation Date',
            last_working_day: 'Last Working Day',
            separation_type: 'Separation Type',
            settlement_status: 'Settlement Status',
            fnf_net_payable: 'FNF Net Payable',
            unpaid_salary_amount: 'Unpaid Salary Amount',
            leave_encashment_amount: 'Leave Encashment Amount',
            gratuity_amount: 'Gratuity Amount',
            notice_recovery_amount: 'Notice Recovery Amount',
            total_outstanding_loan: 'Total Outstanding Loan',
            other_allowances: 'Other Allowances',
            other_deductions: 'Other Deductions',
            notes: 'Notes'
        };

        exportToCSV(dataToExport, `Employee_Separations_${new Date().toISOString().split('T')[0]}.csv`, headers);
    };

    // --- Pay Register Methods ---
    const fetchRegister = async () => {
        setRegisterLoading(true);
        try {
            const [mName, year] = selectedMonth.split(' ');
            const month = monthMap[mName];
            const res = await api.get(`/payroll/interactive-register?month=${month}&year=${year}`);
            setRegisterData(res || []);
        } catch (err) {
            console.error('Failed to fetch register:', err);
        } finally {
            setRegisterLoading(false);
        }
    };

    // --- Salary Structure Methods ---
    const fetchEmployees = async () => {
        setStructureLoading(true);
        try {
            const res = await api.get('/employees');
            setEmployees(res || []);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        } finally {
            setStructureLoading(false);
        }
    };

    const safeParse = (val) => {
        if (!val) return [];
        if (typeof val === 'string') {
            try {
                let parsed = JSON.parse(val);
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return Array.isArray(val) ? val : [];
    };

    const calculateRevisionPercent = (prev, rev) => {
        const p = parseFloat(prev) || 0;
        const r = parseFloat(rev) || 0;
        if (p === 0) {
            return r > 0 ? '100.00' : '0.00';
        }
        const pct = ((r - p) / p) * 105; // Wait, actually standard calculation is ((r-p)/p)*100
        // Let's use 100 for correct math!
        const pctReal = ((r - p) / p) * 100;
        return pctReal.toFixed(2);
    };

    const handleSelectEmployeeStructure = async (emp) => {
        setSelectedEmpStructure(emp);
        setStructureLoading(true);
        try {
            const res = await api.get(`/payroll/salary-structure/${emp.id}`);
            setEmpSalaryData({
                base_salary: res.base_salary || 25000,
                allowances: safeParse(res.allowances),
                deductions: safeParse(res.deductions)
            });
        } catch (err) {
            console.error('Failed to fetch structures:', err);
        } finally {
            setStructureLoading(false);
        }
    };

    const handleSaveSalaryStructure = async () => {
        if (!selectedEmpStructure) return;
        setStructureLoading(true);
        try {
            await api.post(`/payroll/salary-structure/${selectedEmpStructure.id}`, empSalaryData);
            alert('Salary structure updated successfully!');
            setSelectedEmpStructure(null);
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Save failed');
        } finally {
            setStructureLoading(false);
        }
    };

    // --- Payroll Inputs (Salary Revisions) Methods ---
    const handleComponentFieldChange = (field, val, isFromPercent = false) => {
        let b = parseFloat(field === 'basic' ? val : basicInput) || 0;
        let h = parseFloat(field === 'hra' ? val : hraInput) || 0;
        let s = parseFloat(field === 'special' ? val : specialAllowanceInput) || 0;
        let m = parseFloat(field === 'medical' ? val : medicalAllowanceInput) || 0;

        const isPfEnabled = pfRule ? isRuleApplicableLocal(selectedInputsEmployee, pfRule, 'include_pf') : true;
        const isEsiEnabled = esiRule ? isRuleApplicableLocal(selectedInputsEmployee, esiRule, 'include_esi') : true;

        let computedEePf = employeePfInput;
        let computedErPf = employerPfInput;
        let computedEeEsic = employeeEsicInput;
        let computedErEsic = employerEsicInput;

        if (field === 'basic') {
            setBasicInput(val);
            const computedPf = isPfEnabled ? ((parseFloat(val) || 0) * pfEeRate) : 0;
            const formattedPf = parseFloat(computedPf.toFixed(2));
            setEmployeePfInput(String(formattedPf));
            setEmployerPfInput(String(formattedPf));
            computedEePf = String(formattedPf);
            computedErPf = String(formattedPf);
        } else if (field === 'hra') {
            setHraInput(val);
        } else if (field === 'special') {
            setSpecialAllowanceInput(val);
        } else if (field === 'medical') {
            setMedicalAllowanceInput(val);
        } else if (field === 'employee_pf') {
            setEmployeePfInput(isPfEnabled ? val : '0');
            computedEePf = isPfEnabled ? val : '0';
        } else if (field === 'employee_esic') {
            setEmployeeEsicInput(isEsiEnabled ? val : '0');
            computedEeEsic = isEsiEnabled ? val : '0';
        } else if (field === 'employer_pf') {
            setEmployerPfInput(isPfEnabled ? val : '0');
            computedErPf = isPfEnabled ? val : '0';
        } else if (field === 'employer_esic') {
            setEmployerEsicInput(isEsiEnabled ? val : '0');
            computedErEsic = isEsiEnabled ? val : '0';
        }

        const newGross = parseFloat((b + h + s + m).toFixed(2));
        setGrossInput(String(newGross));

        if (['basic', 'hra', 'special', 'medical'].includes(field)) {
            const computedEeEsicVal = isEsiEnabled ? (newGross * esiEeRate) : 0;
            const computedErEsicVal = isEsiEnabled ? (newGross * esiErRate) : 0;
            const formattedEeEsic = parseFloat(computedEeEsicVal.toFixed(2));
            const formattedErEsic = parseFloat(computedErEsicVal.toFixed(2));
            setEmployeeEsicInput(String(formattedEeEsic));
            setEmployerEsicInput(String(formattedErEsic));
            computedEeEsic = String(formattedEeEsic);
            computedErEsic = String(formattedErEsic);
        }

        // Update percentInputs for recalculating percentages on edit
        let prevRev = isAddingNewRevision ? (inputsHistory[0] || null) : getPriorRevision(selectedRevision);
        const basicPrev = prevRev?.basic || 0;
        const hraPrev = prevRev?.hra || 0;
        const specialPrev = prevRev?.special_allowance || 0;
        const medicalPrev = prevRev?.medical_allowance || 0;
        const empPfPrev = prevRev?.employer_pf || 0;
        const empEsicPrev = prevRev?.employer_esic || 0;
        const eePfPrev = prevRev?.employee_pf || 0;
        const eeEsicPrev = prevRev?.employee_esic || 0;

        setPercentInputs(prev => {
            const updated = { ...prev };
            const fieldsToUpdate = [];
            if (!isFromPercent) {
                fieldsToUpdate.push(field);
            }
            if (field === 'basic') {
                fieldsToUpdate.push('employee_pf', 'employer_pf', 'employee_esic', 'employer_esic');
            } else if (['hra', 'special', 'medical'].includes(field)) {
                fieldsToUpdate.push('employee_esic', 'employer_esic');
            }

            fieldsToUpdate.forEach(f => {
                let prevVal = 0;
                let currentVal = 0;
                if (f === 'basic') { prevVal = basicPrev; currentVal = parseFloat(val) || 0; }
                else if (f === 'hra') { prevVal = hraPrev; currentVal = parseFloat(field === 'hra' ? val : hraInput) || 0; }
                else if (f === 'special') { prevVal = specialPrev; currentVal = parseFloat(field === 'special' ? val : specialAllowanceInput) || 0; }
                else if (f === 'medical') { prevVal = medicalPrev; currentVal = parseFloat(field === 'medical' ? val : medicalAllowanceInput) || 0; }
                else if (f === 'employee_pf') { prevVal = eePfPrev; currentVal = parseFloat(computedEePf) || 0; }
                else if (f === 'employer_pf') { prevVal = empPfPrev; currentVal = parseFloat(computedErPf) || 0; }
                else if (f === 'employee_esic') { prevVal = eeEsicPrev; currentVal = parseFloat(computedEeEsic) || 0; }
                else if (f === 'employer_esic') { prevVal = empEsicPrev; currentVal = parseFloat(computedErEsic) || 0; }

                updated[f] = calculateRevisionPercent(prevVal, currentVal);
            });
            return updated;
        });
    };

    const handleComponentPercentChange = (field, percent, prevVal) => {
        setPercentInputs(prev => ({ ...prev, [field]: percent }));
        const base = parseFloat(prevVal) || 0;
        if (percent === '' || percent === undefined || percent === null) {
            handleComponentFieldChange(field, String(base), true);
            return;
        }
        const pct = parseFloat(percent) || 0;
        const newVal = base * (1 + pct / 100);
        const formatted = parseFloat(newVal.toFixed(2));
        handleComponentFieldChange(field, String(formatted), true);
    };

    const fetchSalaryHistory = async (empId, empObject = null) => {
        setRevisionLoading(true);
        try {
            const res = await api.get(`/payroll/salary-history/${empId}`);
            setInputsHistory(res || []);

            const emp = empObject || selectedInputsEmployee;
            const isPfEnabled = pfRule ? isRuleApplicableLocal(emp, pfRule, 'include_pf') : true;
            const isEsiEnabled = esiRule ? isRuleApplicableLocal(emp, esiRule, 'include_esi') : true;

            if (res && res.length > 0) {
                // Select the first (latest) revision by default
                const latest = res[0];
                setSelectedRevision(latest);
                setGrossInput(String(latest.gross_salary || ''));
                setEffectiveFromInput(latest.effective_from ? latest.effective_from.split('T')[0] : '');
                setPayoutMonthInput(latest.payout_month || '');
                setRevisionRemarks(latest.remarks || '');
                setRevisionNotes(latest.notes || '');
                setBasicInput(String(latest.basic || ''));
                setHraInput(String(latest.hra || ''));
                setSpecialAllowanceInput(String(latest.special_allowance || '0'));
                setMedicalAllowanceInput(String(latest.medical_allowance || '0'));
                setEmployerPfInput(isPfEnabled ? String(latest.employer_pf || '') : '0');
                setEmployerEsicInput(isEsiEnabled ? String(latest.employer_esic || '') : '0');
                setEmployeePfInput(isPfEnabled ? String(latest.employee_pf || '') : '0');
                setEmployeeEsicInput(isEsiEnabled ? String(latest.employee_esic || '') : '0');
            } else {
                setSelectedRevision(null);
                setGrossInput('');
                setEffectiveFromInput('');
                setPayoutMonthInput('');
                setRevisionRemarks('');
                setRevisionNotes('');
                setBasicInput('');
                setHraInput('');
                setSpecialAllowanceInput('0');
                setMedicalAllowanceInput('0');
                setEmployerPfInput('0');
                setEmployerEsicInput('0');
                setEmployeePfInput('0');
                setEmployeeEsicInput('0');
            }
        } catch (err) {
            console.error('Failed to fetch salary history:', err);
        } finally {
            setRevisionLoading(false);
        }
    };

    const handleSelectInputsEmployee = async (emp) => {
        setSelectedInputsEmployee(emp);
        setIsRevisionEditing(false);
        setIsAddingNewRevision(false);
        setPercentInputs({});
        await fetchSalaryHistory(emp.id, emp);
    };

    const handleSaveRevision = async () => {
        if (!selectedInputsEmployee) return;
        if (!grossInput || isNaN(parseFloat(grossInput))) {
            alert('Please enter a valid Gross Salary');
            return;
        }
        if (!effectiveFromInput) {
            alert('Please select an effective from date');
            return;
        }
        if (!payoutMonthInput) {
            alert('Please select a payout month');
            return;
        }

        setRevisionLoading(true);
        try {
            const payload = {
                employee_id: selectedInputsEmployee.id,
                effective_from: effectiveFromInput,
                payout_month: payoutMonthInput,
                remarks: revisionRemarks,
                notes: revisionNotes,
                gross_salary: parseFloat(grossInput) || 0,
                basic: parseFloat(basicInput) || 0,
                hra: parseFloat(hraInput) || 0,
                special_allowance: parseFloat(specialAllowanceInput) || 0,
                medical_allowance: parseFloat(medicalAllowanceInput) || 0,
                employer_pf: parseFloat(employerPfInput) || 0,
                employer_esic: parseFloat(employerEsicInput) || 0,
                employee_pf: parseFloat(employeePfInput) || 0,
                employee_esic: parseFloat(employeeEsicInput) || 0,
                net_take_home: (parseFloat(grossInput) || 0) - (parseFloat(employeePfInput) || 0) - (parseFloat(employeeEsicInput) || 0),
                monthly_ctc: (parseFloat(grossInput) || 0) + (parseFloat(employerPfInput) || 0) + (parseFloat(employerEsicInput) || 0),
                annual_ctc: ((parseFloat(grossInput) || 0) + (parseFloat(employerPfInput) || 0) + (parseFloat(employerEsicInput) || 0)) * 12
            };

            if (isAddingNewRevision || !selectedRevision) {
                // POST a new revision
                await api.post('/payroll/salary-revision', payload);
                alert('Salary structure revision saved successfully!');
            } else {
                // PUT to update the current selected revision
                await api.put(`/payroll/salary-revision/${selectedRevision.id}`, payload);
                alert('Salary structure revision updated successfully!');
            }
            setIsAddingNewRevision(false);
            setIsRevisionEditing(false);
            setPercentInputs({});
            await fetchSalaryHistory(selectedInputsEmployee.id);
        } catch (err) {
            alert(err.response?.data?.message || 'Save revision failed');
        } finally {
            setRevisionLoading(false);
        }
    };

    const handleCancelRevision = () => {
        setIsAddingNewRevision(false);
        setIsRevisionEditing(false);
        setPercentInputs({});
        if (selectedRevision) {
            setGrossInput(String(selectedRevision.gross_salary || ''));
            setEffectiveFromInput(selectedRevision.effective_from ? selectedRevision.effective_from.split('T')[0] : '');
            setPayoutMonthInput(selectedRevision.payout_month || '');
            setRevisionRemarks(selectedRevision.remarks || '');
            setRevisionNotes(selectedRevision.notes || '');
            setBasicInput(String(selectedRevision.basic || ''));
            setHraInput(String(selectedRevision.hra || ''));
            setSpecialAllowanceInput(String(selectedRevision.special_allowance || '0'));
            setMedicalAllowanceInput(String(selectedRevision.medical_allowance || '0'));
            setEmployerPfInput(String(selectedRevision.employer_pf || ''));
            setEmployerEsicInput(String(selectedRevision.employer_esic || ''));
            setEmployeePfInput(String(selectedRevision.employee_pf || ''));
            setEmployeeEsicInput(String(selectedRevision.employee_esic || ''));
        } else {
            setGrossInput('');
            setEffectiveFromInput('');
            setPayoutMonthInput('');
            setRevisionRemarks('');
            setRevisionNotes('');
            setBasicInput('');
            setHraInput('');
            setSpecialAllowanceInput('0');
            setMedicalAllowanceInput('0');
            setEmployerPfInput('');
            setEmployerEsicInput('');
            setEmployeePfInput('');
            setEmployeeEsicInput('');
        }
    };

    const getPriorRevision = (currentRev) => {
        if (!currentRev || !inputsHistory || inputsHistory.length <= 1) return null;
        const index = inputsHistory.findIndex(h => h.id === currentRev.id);
        if (index === -1 || index === inputsHistory.length - 1) return null;
        return inputsHistory[index + 1];
    };

    // --- Global Formula Rules Methods ---
    const fetchGlobalRules = async () => {
        setRulesLoading(true);
        try {
            const res = await api.get('/payroll/global-rules');
            setGlobalRules(res || []);
        } catch (err) {
            console.error('Failed to fetch global rules:', err);
        } finally {
            setRulesLoading(false);
        }
    };

    const handleCreateGlobalRule = async () => {
        setRulesLoading(true);
        try {
            const cleanedData = {
                ...newRuleData,
                employee_percentage: newRuleData.employee_percentage === '' ? 0 : (parseFloat(newRuleData.employee_percentage) || 0),
                employer_percentage: newRuleData.employer_percentage === '' ? 0 : (parseFloat(newRuleData.employer_percentage) || 0),
            };
            await api.post('/payroll/global-rules', cleanedData);
            alert('Dynamic statutory formula created!');
            setShowAddRuleForm(false);
            setNewRuleData({
                rule_name: '',
                employee_percentage: 12.00,
                employer_percentage: 12.00,
                base_on: 'base_salary',
                is_active: true
            });
            fetchGlobalRules();
        } catch (err) {
            alert(err.response?.data?.message || 'Create failed');
        } finally {
            setRulesLoading(false);
        }
    };

    const handleUpdateGlobalRule = async (rule) => {
        setRulesLoading(true);
        try {
            const cleanedRule = {
                ...rule,
                employee_percentage: rule.employee_percentage === '' ? 0 : (parseFloat(rule.employee_percentage) || 0),
                employer_percentage: rule.employer_percentage === '' ? 0 : (parseFloat(rule.employer_percentage) || 0),
            };
            await api.put(`/payroll/global-rules/${rule.id}`, cleanedRule);
            alert('Statutory rule formula updated successfully!');
            setEditingRule(null);
            fetchGlobalRules();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setRulesLoading(false);
        }
    };

    const handleDeleteGlobalRule = async (id) => {
        if (!confirm('Are you sure you want to delete this statutory formula?')) return;
        setRulesLoading(true);
        try {
            await api.delete(`/payroll/global-rules/${id}`);
            alert('Statutory formula deleted.');
            fetchGlobalRules();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        } finally {
            setRulesLoading(false);
        }
    };

    // --- Business Rules Methods ---
    const fetchBusinessRules = async () => {
        setRulesLoading(true);
        try {
            const resRules = await api.get('/settings/working-rules');
            if (resRules) {
                setBusinessRules(resRules);
            }

            const resShifts = await api.get('/attendance/shift-list');
            if (Array.isArray(resShifts)) {
                setShifts(resShifts);
                if (resShifts.length > 0) {
                    const defaultShift = resShifts[0];
                    setSelectedShiftId(defaultShift.id);
                    setSelectedShiftData({ ...defaultShift });
                }
            }
        } catch (err) {
            console.error('Failed to load business rules or shifts:', err);
        } finally {
            setRulesLoading(false);
        }
    };

    const handleSelectShift = (shiftId) => {
        const selected = shifts.find(s => s.id === shiftId);
        if (selected) {
            setSelectedShiftId(shiftId);
            setSelectedShiftData({ ...selected });
        }
    };

    const handleSaveBusinessRules = async () => {
        setSavingRules(true);
        try {
            // 1. Save global late penalty rules
            const cleanedBusinessRules = {
                ...businessRules,
                half_day_hours: businessRules.half_day_hours === '' ? 0 : (parseInt(businessRules.half_day_hours) || 0),
                max_late_allowed: businessRules.max_late_allowed === '' ? 0 : (parseInt(businessRules.max_late_allowed) || 0),
                late_deduction_value: businessRules.late_deduction_value === '' ? 0 : (parseFloat(businessRules.late_deduction_value) || 0),
            };
            await api.post('/settings/working-rules', cleanedBusinessRules);

            // 2. Save active shift Timing & Grace parameters
            if (selectedShiftId && selectedShiftData) {
                const cleanedShiftData = {
                    ...selectedShiftData,
                    grace_period: selectedShiftData.grace_period === '' ? 0 : (parseInt(selectedShiftData.grace_period) || 0),
                };
                await api.put(`/attendance/shift-list/${selectedShiftId}`, cleanedShiftData);
            }

            // 3. Reload shifts
            const resShifts = await api.get('/attendance/shift-list');
            if (Array.isArray(resShifts)) {
                setShifts(resShifts);
            }

            alert('Shift timings and penalty guidelines deployed successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save rules');
        } finally {
            setSavingRules(false);
        }
    };

    const handleCreateShift = async () => {
        if (!newShiftData.name || (!newShiftData.is_flexi && (!newShiftData.start_time || !newShiftData.end_time))) {
            alert('Please fill out all required fields');
            return;
        }
        try {
            const cleanedNewShift = {
                ...newShiftData,
                grace_period: newShiftData.grace_period === '' ? 0 : (parseInt(newShiftData.grace_period) || 0),
                grace_count_limit: newShiftData.grace_count_limit === '' ? 0 : (parseInt(newShiftData.grace_count_limit) || 0),
            };
            await api.post('/attendance/shift-list', cleanedNewShift);
            setShowAddShift(false);
            setNewShiftData({
                name: '',
                start_time: '09:00',
                end_time: '18:00',
                grace_period: 15,
                grace_count_limit: 3,
                is_night_shift: false,
                is_flexi: false,
                min_hours: 8.0
            });
            // Reload shifts
            const resShifts = await api.get('/attendance/shift-list');
            if (Array.isArray(resShifts)) {
                setShifts(resShifts);
                if (resShifts.length > 0) {
                    const lastShift = resShifts[resShifts.length - 1];
                    setSelectedShiftId(lastShift.id);
                    setSelectedShiftData({ ...lastShift });
                }
            }
            alert('New shift added successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add shift');
        }
    };

    const handleDeleteShift = async (id, e) => {
        e.stopPropagation();
        if (id === 1 || id === '1') {
            alert('Cannot delete the Default General Shift.');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this shift? Active employees will default back to General Shift timings.')) {
            return;
        }
        try {
            await api.delete(`/attendance/shift-list/${id}`);

            // Reload shifts
            const resShifts = await api.get('/attendance/shift-list');
            if (Array.isArray(resShifts)) {
                setShifts(resShifts);
                if (resShifts.length > 0) {
                    const defaultShift = resShifts[0];
                    setSelectedShiftId(defaultShift.id);
                    setSelectedShiftData({ ...defaultShift });
                } else {
                    setSelectedShiftId(null);
                    setSelectedShiftData(null);
                }
            }
            alert('Shift deleted successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete shift');
        }
    };

    const fetchLoans = async () => {
        setLoansLoading(true);
        try {
            const res = await api.get('/payroll/loans');
            setLoans(res);
            // Also fetch employee dropdown data if not loaded
            const resEmp = await api.get('/employees');
            setEmployees(resEmp);
        } catch (err) {
            console.error('Error fetching loans:', err);
        } finally {
            setLoansLoading(false);
        }
    };

    const handleCreateLoan = async () => {
        if (!newLoanData.employee_id || !newLoanData.amount || !newLoanData.monthly_emi || !newLoanData.title) {
            alert('Please fill out all fields');
            return;
        }
        try {
            await api.post('/payroll/loans', newLoanData);
            setShowAddLoan(false);
            setModalOutlet('All');
            setModalDept('All');
            setModalDesignation('All');
            setNewLoanData({
                employee_id: '',
                title: 'Salary Advance',
                amount: '',
                monthly_emi: '',
                status: 'active',
                loan_date: new Date().toISOString().split('T')[0]
            });
            fetchLoans();
            alert('Salary Advance / Loan registered successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to register loan');
        }
    };

    const handleUpdateLoan = async () => {
        if (!newLoanData.employee_id || !newLoanData.amount || !newLoanData.monthly_emi || !newLoanData.title) {
            alert('Please fill out all fields');
            return;
        }
        try {
            await api.put(`/payroll/loans/${editingLoanId}`, newLoanData);
            setShowAddLoan(false);
            setEditingLoanId(null);
            setModalOutlet('All');
            setModalDept('All');
            setModalDesignation('All');
            setNewLoanData({
                employee_id: '',
                title: 'Salary Advance',
                amount: '',
                monthly_emi: '',
                status: 'active',
                loan_date: new Date().toISOString().split('T')[0]
            });
            fetchLoans();
            alert('Salary Advance / Loan updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update loan');
        }
    };

    const handleDeleteLoan = async (loanId) => {
        if (!window.confirm('Are you sure you want to delete this loan record? This will also remove any repayments recorded against it.')) {
            return;
        }
        try {
            await api.delete(`/payroll/loans/${loanId}`);
            fetchLoans();
            alert('Loan deleted successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete loan');
        }
    };

    const handleUpdateLoanStatus = async (loanId, newStatus) => {
        try {
            await api.post(`/payroll/loans/${loanId}/status`, { status: newStatus });
            fetchLoans();
            alert(`Loan status successfully set to ${newStatus}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const fetchRepayments = async () => {
        setRepaymentsLoading(true);
        try {
            const res = await api.get('/payroll/loans/repayments');
            setRepayments(res);
        } catch (err) {
            console.error('Failed to fetch repayments history:', err);
        } finally {
            setRepaymentsLoading(false);
        }
    };

    const handleManualRepaySubmit = async () => {
        if (!repayData.amount_paid || parseFloat(repayData.amount_paid) <= 0) {
            alert('Please enter a valid repayment amount');
            return;
        }
        if (parseFloat(repayData.amount_paid) > parseFloat(selectedLoanForRepay.remaining_balance)) {
            alert('Repayment amount cannot exceed remaining balance');
            return;
        }

        setRepaySubmitting(true);
        try {
            const res = await api.post(`/payroll/loans/${selectedLoanForRepay.id}/repay`, repayData);
            alert(res.message || 'Repayment recorded successfully!');
            setShowRepayModal(false);
            setRepayData({
                amount_paid: '',
                payment_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            fetchLoans();
            fetchRepayments();
        } catch (err) {
            alert(err.response?.data?.message || 'Repayment recording failed');
        } finally {
            setRepaySubmitting(false);
        }
    };

    // Generate months for the selected Financial Year (Apr-Mar)
    const months = [
        { name: 'Apr', year: String(fyStartYear) },
        { name: 'May', year: String(fyStartYear) },
        { name: 'Jun', year: String(fyStartYear) },
        { name: 'Jul', year: String(fyStartYear) },
        { name: 'Aug', year: String(fyStartYear) },
        { name: 'Sep', year: String(fyStartYear) },
        { name: 'Oct', year: String(fyStartYear) },
        { name: 'Nov', year: String(fyStartYear) },
        { name: 'Dec', year: String(fyStartYear) },
        { name: 'Jan', year: String(fyStartYear + 1) },
        { name: 'Feb', year: String(fyStartYear + 1) },
        { name: 'Mar', year: String(fyStartYear + 1) }
    ];

    // Unique outlets list
    // Helper to perform normalized alphanumeric comparisons for search filters (handles spacing like "F & B" vs "F&B", "Floor   Manager" vs "Floor Manager")
    const matchText = (val, filterVal) => {
        if (filterVal === 'All') return true;
        if (!val) return false;
        const clean = (str) => String(str).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return clean(val) === clean(filterVal);
    };

    // Unique outlets list
    const uniqueOutlets = useMemo(() => {
        const outlets = new Map(); // cleanName -> originalName
        const check = (o) => {
            if (o) {
                const clean = o.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const normalizedDisplay = o.replace(/\s+/g, ' ').trim();
                if (!outlets.has(clean)) {
                    outlets.set(clean, normalizedDisplay);
                }
            }
        };
        if (Array.isArray(employees)) employees.forEach(e => check(e.office_location));
        if (Array.isArray(registerData)) {
            registerData.forEach(e => {
                check(e.location);
                check(e.office_location);
            });
        }
        if (Array.isArray(loans)) loans.forEach(e => check(e.office_location));
        if (Array.isArray(separations)) separations.forEach(e => check(e.office_location));
        return ['All', ...Array.from(outlets.values()).sort()];
    }, [employees, registerData, loans, separations]);

    const uniqueDepartments = useMemo(() => {
        const depts = new Map(); // cleanName -> originalName
        const check = (e) => {
            const d = e.department_name || e.department;
            if (d) {
                const clean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const normalizedDisplay = d.replace(/\s+/g, ' ').trim();
                if (!depts.has(clean)) {
                    depts.set(clean, normalizedDisplay);
                }
            }
        };
        if (Array.isArray(employees)) employees.forEach(check);
        if (Array.isArray(registerData)) registerData.forEach(check);
        if (Array.isArray(loans)) loans.forEach(check);
        if (Array.isArray(separations)) separations.forEach(check);
        return ['All', ...Array.from(depts.values()).sort()];
    }, [employees, registerData, loans, separations]);

    const uniqueDesignations = useMemo(() => {
        const desgs = new Map(); // cleanName -> originalName
        const check = (e) => {
            const d = e.designation || e.role;
            if (d) {
                const clean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const normalizedDisplay = d.replace(/\s+/g, ' ').trim();
                if (!desgs.has(clean)) {
                    desgs.set(clean, normalizedDisplay);
                }
            }
        };
        if (Array.isArray(employees)) employees.forEach(check);
        if (Array.isArray(registerData)) registerData.forEach(check);
        if (Array.isArray(loans)) loans.forEach(check);
        if (Array.isArray(separations)) separations.forEach(check);
        return ['All', ...Array.from(desgs.values()).sort()];
    }, [employees, registerData, loans, separations]);

    // Filter register data
    const filteredRegisterData = useMemo(() => {
        if (!Array.isArray(registerData)) return [];
        return registerData.filter(reg => {
            const matchesOutlet = matchText(reg.location || reg.office_location, selectedOutlet);
            const matchesDept = matchText(reg.department_name || reg.department, selectedDept);
            const matchesDesignation = matchText(reg.designation || reg.role, selectedDesignation);
            return matchesOutlet && matchesDept && matchesDesignation;
        });
    }, [registerData, selectedOutlet, selectedDept, selectedDesignation]);

    // Filter loans
    const filteredLoans = useMemo(() => {
        if (!Array.isArray(loans)) return [];
        return loans.filter(loan => {
            const matchesOutlet = matchText(loan.office_location, selectedOutlet);
            const matchesDept = matchText(loan.department_name || loan.department, selectedDept);
            const matchesDesignation = matchText(loan.designation || loan.role, selectedDesignation);
            return matchesOutlet && matchesDept && matchesDesignation;
        });
    }, [loans, selectedOutlet, selectedDept, selectedDesignation]);

    // Filter separations
    const filteredSeparations = useMemo(() => {
        if (!Array.isArray(separations)) return [];
        return separations.filter(s => {
            const matchesOutlet = matchText(s.office_location, selectedOutlet);
            const matchesDept = matchText(s.department_name || s.department, selectedDept);
            const matchesDesignation = matchText(s.designation || s.role, selectedDesignation);
            return matchesOutlet && matchesDept && matchesDesignation;
        });
    }, [separations, selectedOutlet, selectedDept, selectedDesignation]);

    // Filter statements
    const filteredStatements = useMemo(() => {
        if (!Array.isArray(statements)) return [];
        return statements.filter(stmt => {
            const matchesOutlet = matchText(stmt.office_location || stmt.location, selectedOutlet);
            const matchesDept = matchText(stmt.department_name || stmt.department, selectedDept);
            const matchesDesignation = matchText(stmt.designation || stmt.role, selectedDesignation);
            return matchesOutlet && matchesDept && matchesDesignation;
        });
    }, [statements, selectedOutlet, selectedDept, selectedDesignation]);

    // Filter employees
    const filteredEmployees = useMemo(() => {
        if (!Array.isArray(employees)) return [];
        return employees.filter(emp => {
            const matchesOutlet = matchText(emp.office_location || emp.location, selectedOutlet);
            const matchesDept = matchText(emp.department_name || emp.department, selectedDept);
            const matchesDesignation = matchText(emp.designation || emp.role, selectedDesignation);
            return matchesOutlet && matchesDept && matchesDesignation;
        });
    }, [employees, selectedOutlet, selectedDept, selectedDesignation]);

    // Filter employees in the Issue Salary Advance modal
    const modalFilteredEmployees = useMemo(() => {
        if (!Array.isArray(employees)) return [];
        return employees.filter(emp => {
            const matchesOutlet = matchText(emp.office_location || emp.location, modalOutlet);
            const matchesDept = matchText(emp.department_name || emp.department, modalDept);
            const matchesDesignation = matchText(emp.designation || emp.role, modalDesignation);
            return matchesOutlet && matchesDept && matchesDesignation;
        });
    }, [employees, modalOutlet, modalDept, modalDesignation]);

    // Filter repayments
    const filteredRepayments = useMemo(() => {
        if (!Array.isArray(repayments)) return [];
        return repayments.filter(r => {
            const matchesOutlet = matchText(r.office_location, selectedOutlet);
            const matchesDept = matchText(r.department_name || r.department, selectedDept);
            const matchesDesignation = matchText(r.designation || r.role, selectedDesignation);
            return matchesOutlet && matchesDept && matchesDesignation;
        });
    }, [repayments, selectedOutlet, selectedDept, selectedDesignation]);

    // Search loans
    const searchedLoans = useMemo(() => {
        if (!loansSearchQuery) return filteredLoans;
        const query = loansSearchQuery.toLowerCase();
        return filteredLoans.filter(l => {
            const fullName = `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase();
            const empId = (l.employee_id_number || '').toLowerCase();
            const title = (l.title || '').toLowerCase();
            return fullName.includes(query) || empId.includes(query) || title.includes(query);
        });
    }, [filteredLoans, loansSearchQuery]);

    // Search repayments
    const searchedRepayments = useMemo(() => {
        if (!loansSearchQuery) return filteredRepayments;
        const query = loansSearchQuery.toLowerCase();
        return filteredRepayments.filter(r => {
            const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
            const empId = (r.employee_id_number || '').toLowerCase();
            const title = (r.loan_title || '').toLowerCase();
            const note = (r.notes || '').toLowerCase();
            return fullName.includes(query) || empId.includes(query) || title.includes(query) || note.includes(query);
        });
    }, [filteredRepayments, loansSearchQuery]);

    const filteredSummary = useMemo(() => {
        const initial = {
            netPay: 0,
            grossPay: 0,
            deductions: 0,
            totalEmployees: 0,
            additions: 0,
            separations: 0,
            payoutPending: 0
        };

        if (Array.isArray(filteredStatements)) {
            filteredStatements.forEach(stmt => {
                const net = parseFloat(stmt.net_salary) || 0;
                const base = parseFloat(stmt.base_salary) || 0;
                const allow = parseFloat(stmt.total_allowances) || 0;
                const ded = parseFloat(stmt.total_deductions) || 0;
                const unpaid = parseFloat(stmt.unpaid_leave_deduction) || 0;
                const late = parseFloat(stmt.late_mark_deduction) || 0;

                initial.netPay += net;
                initial.grossPay += (base + allow);
                initial.deductions += (ded + unpaid + late);

                if (stmt.status === 'generated' || stmt.status === 'pending') {
                    initial.payoutPending++;
                }
            });
        }

        initial.totalEmployees = filteredEmployees.length;

        if (selectedMonth && typeof selectedMonth === 'string') {
            const [mName, yearStr] = selectedMonth.split(' ');
            const mVal = monthMap[mName];
            const yVal = parseInt(yearStr);

            filteredEmployees.forEach(emp => {
                if (emp.joining_date) {
                    const joinDate = new Date(emp.joining_date);
                    if (joinDate.getMonth() + 1 === mVal && joinDate.getFullYear() === yVal) {
                        initial.additions++;
                    }
                }
            });
        }

        initial.separations = filteredSeparations.length;

        return {
            netPay: initial.netPay,
            grossPay: initial.grossPay,
            deductions: initial.deductions,
            totalEmployees: initial.totalEmployees,
            additions: initial.additions,
            separations: initial.separations,
            payoutPending: initial.payoutPending
        };
    }, [filteredStatements, filteredEmployees, filteredSeparations, selectedMonth, monthMap]);

    const chartData = useMemo(() => {
        return [
            { name: 'Gross Salary', value: parseFloat(filteredSummary.grossPay) || 0, color: '#10b981' },
            { name: 'Deductions', value: parseFloat(filteredSummary.deductions) || 0, color: '#ef4444' }
        ];
    }, [filteredSummary]);

    return (
        <div className="p-4 md:p-6 bg-[#F4F6FC] min-h-screen font-outfit text-slate-800 antialiased selection:bg-indigo-500/20">

            {/* --- PAGE TITLE --- */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Enterprise Payroll Hub
                        <span className="text-[9px] font-bold tracking-widest text-[#4361ee] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase">Pro</span>
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">Manage dynamic salary sheets, global statutory contributions (PF, ESIC, PT, Gratuity), and payroll formulas inside one gorgeous console.</p>
                </div>

                {/* Outlet, Department, Designation filters */}
                <div className="flex gap-2.5 flex-nowrap w-full md:w-auto items-center overflow-x-auto no-scrollbar py-1.5 shrink-0">
                    <div className="relative min-w-[130px] md:min-w-[150px] shrink-0">
                        <select
                            value={selectedOutlet}
                            onChange={(e) => setSelectedOutlet(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none pr-10 shadow-sm cursor-pointer"
                        >
                            <option value="All">All Outlets</option>
                            {uniqueOutlets.filter(o => o !== 'All').map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative min-w-[130px] md:min-w-[150px] shrink-0">
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none pr-10 shadow-sm cursor-pointer"
                        >
                            <option value="All">All Departments</option>
                            {uniqueDepartments.filter(d => d !== 'All').map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative min-w-[130px] md:min-w-[150px] shrink-0">
                        <select
                            value={selectedDesignation}
                            onChange={(e) => setSelectedDesignation(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none pr-10 shadow-sm cursor-pointer"
                        >
                            <option value="All">All Designations</option>
                            {uniqueDesignations.filter(d => d !== 'All').map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {selectedTab === 'loans' && (
                        <div className="relative w-48 md:w-56 shrink-0">
                            <input
                                type="text"
                                placeholder="Search by name, ID, or title..."
                                value={loansSearchQuery}
                                onChange={(e) => setLoansSearchQuery(e.target.value)}
                                className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#4361ee] transition-all shadow-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* --- FINANCIAL YEAR MONTH SELECTOR --- */}
            <div className="relative bg-white border border-slate-200/40 backdrop-blur-md rounded-2xl p-2.5 shadow-sm mb-5 flex items-center gap-2">
                <button
                    onClick={() => setFyStartYear(prev => prev - 1)}
                    className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 active:scale-90 shrink-0"
                    title={`FY ${fyStartYear - 1}-${String(fyStartYear).slice(2)}`}
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex-1 flex flex-col items-center gap-1.5">
                    {/* FY Label */}
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        FY {fyStartYear}–{String(fyStartYear + 1).slice(2)}
                    </span>
                    {/* Month Pills */}
                    <div className="flex items-center justify-between w-full px-1 overflow-x-auto no-scrollbar gap-1">
                        {months.map((m, i) => {
                            const isSelected = selectedMonth === `${m.name} ${m.year}`;
                            const isCurrent = `${m.name} ${m.year}` === currentMonthStr;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedMonth(`${m.name} ${m.year}`)}
                                    className={`flex flex-col items-center px-3 md:px-4 py-1.5 rounded-xl cursor-pointer min-w-[55px] md:min-w-[65px] transition-all active:scale-95 ${isSelected
                                        ? 'bg-[#4361ee] text-white shadow-md shadow-indigo-500/15 scale-102 border border-indigo-500/10'
                                        : isCurrent
                                            ? 'text-indigo-600 bg-indigo-50/60 border border-indigo-100 font-bold'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent font-semibold'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{m.name}</span>
                                    <span className="text-[11px] font-bold mt-1 leading-none">{m.year}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={() => setFyStartYear(prev => prev + 1)}
                    className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 active:scale-90 shrink-0"
                    title={`FY ${fyStartYear + 1}-${String(fyStartYear + 2).slice(2)}`}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {/* -------------------- TAB 1: OVERVIEW -------------------- */}
                {selectedTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                    >
                        {/* Sub-Header Banner */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50/10 border border-indigo-100/50 rounded-2xl p-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_2px_12px_rgba(67,97,238,0.01)]">
                            <div>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-[#4361ee] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50">Payroll Period</span>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1">{selectedMonth}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowPayrollGuide(true)} className="p-2.5 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-xl text-[#4361ee] shadow-sm transition-all active:scale-95" title="Payroll Process Guide"><Info size={16} /></button>
                                <button
                                    onClick={handleProcessPayroll}
                                    disabled={controls.payroll_locked || isProcessing}
                                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all ${controls.payroll_locked
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/40'
                                        : 'bg-[#4361ee] hover:bg-indigo-700 text-white hover:scale-[1.01] active:scale-95'
                                        }`}
                                >
                                    {isProcessing ? 'Processing...' : 'Process Payroll'}
                                </button>
                            </div>
                        </div>

                        {/* Main Grid: Metrics & Controls Side-by-Side */}
                        {/* Main Grid: Metrics & Controls Side-by-Side */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Left Column: Payout Details Card (col-span-4) */}
                            <div className="lg:col-span-4 bg-white border border-slate-200/40 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between self-start">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payout Details</h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Net</span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-xl font-black text-slate-900">₹{Number(filteredSummary.netPay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="h-24 relative my-1.5">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePie>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={26}
                                                outerRadius={36}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                        </RePie>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Ratio</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></div>
                                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">Gross</span>
                                        </div>
                                        <p className="text-[11px] font-black text-slate-700">₹{Number(filteredSummary.grossPay || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <div className="w-1.5 h-1.5 bg-[#ef4444] rounded-full"></div>
                                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">Cuts</span>
                                        </div>
                                        <p className="text-[11px] font-black text-slate-700">₹{Number(filteredSummary.deductions || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Wrapper column (col-span-8) */}
                            <div className="lg:col-span-8 space-y-5 self-start">
                                {/* Row 1: The 4 metric cards inline (grid grid-cols-2 sm:grid-cols-4 gap-4) */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[#4361ee] shrink-0"><Users size={14} /></div>
                                            <div>
                                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Enrolled Staff</span>
                                                <p className="text-[18px] font-black text-slate-800 mt-1 leading-none">{filteredSummary.totalEmployees}</p>
                                                <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mt-1 block leading-none">Members</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shrink-0"><Plus size={14} /></div>
                                            <div>
                                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Onboarded</span>
                                                <p className="text-[18px] font-black text-[#10b981] mt-1 leading-none">{filteredSummary.additions}</p>
                                                <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mt-1 block leading-none">Joined</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 shrink-0"><Clock size={14} /></div>
                                            <div>
                                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Payout Queue</span>
                                                <p className="text-[18px] font-black text-slate-800 mt-1 leading-none">{filteredSummary.payoutPending}</p>
                                                <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mt-1 block leading-none">Awaiting</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 shrink-0"><Minus size={14} /></div>
                                            <div>
                                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Separated</span>
                                                <p className="text-[18px] font-black text-[#ef4444] mt-1 leading-none">{filteredSummary.separations}</p>
                                                <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mt-1 block leading-none">Released</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Control Panel and Late Mark Penalties Card side-by-side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Control Panel Card */}
                                    <div className="bg-white border border-slate-200/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3.5">
                                                <div className="p-1.5 bg-indigo-50 text-[#4361ee] rounded-xl border border-indigo-100 flex items-center justify-center">
                                                    <Sliders size={13} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Control Panel</h3>
                                                    <p className="text-slate-450 text-[8px] mt-0.5 font-bold uppercase tracking-wider">Set inputs lock, slips release, and finalization.</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-3.5">
                                                {/* Row 1: Payroll Inputs */}
                                                <div className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight leading-none">Payroll Inputs</span>
                                                        <span className="text-[7.5px] text-slate-400 font-bold uppercase mt-1 leading-none">Adjustments & structure locking</span>
                                                    </div>
                                                    <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200/40">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('inputs_locked', false)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${!controls.inputs_locked
                                                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20 font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Unlock
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('inputs_locked', true)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${controls.inputs_locked
                                                                ? 'bg-[#4361ee] text-white shadow-sm font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Lock
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Row 2: Employee View Release */}
                                                <div className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight leading-none">Employee View Release</span>
                                                        <span className="text-[7.5px] text-slate-400 font-bold uppercase mt-1 leading-none">Slips download release / hold</span>
                                                    </div>
                                                    <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200/40">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('employee_view_released', true)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${controls.employee_view_released
                                                                ? 'bg-[#4361ee] text-white shadow-sm font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Release
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('employee_view_released', false)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${!controls.employee_view_released
                                                                ? 'bg-[#4361ee] text-white shadow-sm font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Hold
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Row 3: IT Statement Employee View */}
                                                <div className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight leading-none">IT Statement View</span>
                                                        <span className="text-[7.5px] text-slate-400 font-bold uppercase mt-1 leading-none">Tax declaration visibility</span>
                                                    </div>
                                                    <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200/40">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('it_statement_released', true)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${controls.it_statement_released
                                                                ? 'bg-[#4361ee] text-white shadow-sm font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Release
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('it_statement_released', false)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${!controls.it_statement_released
                                                                ? 'bg-[#4361ee] text-white shadow-sm font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Hold
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Row 4: Payroll */}
                                                <div className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight leading-none">Payroll Locked</span>
                                                        <span className="text-[7.5px] text-slate-400 font-bold uppercase mt-1 leading-none">Recalculations & bulk processing</span>
                                                    </div>
                                                    <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200/40">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('payroll_locked', false)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${!controls.payroll_locked
                                                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20 font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Unlock
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleControl('payroll_locked', true)}
                                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 select-none ${controls.payroll_locked
                                                                ? 'bg-[#4361ee] text-white shadow-sm font-black'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            Lock
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Late Mark Penalties Card */}
                                    <div className="bg-white border border-slate-200/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                        <div className="space-y-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 flex items-center justify-center">
                                                    <ShieldAlert size={13} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Late Mark Penalties</h3>
                                                    <p className="text-slate-450 text-[8px] mt-0.5 font-bold uppercase tracking-wider">Sync shift grace limits and late cuts.</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-3.5">
                                                {/* Shift Selector */}
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Configure For Shift</label>
                                                    <select
                                                        value={selectedShiftId || ''}
                                                        onChange={(e) => handleSelectShift(Number(e.target.value))}
                                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    >
                                                        {shifts.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>
                                                        ))}
                                                    </select>
                                                </div>



                                                {/* Deduction Protocol */}
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Deduction Protocol</label>
                                                    <select
                                                        value={businessRules.late_deduction_type || 'none'}
                                                        onChange={(e) => setBusinessRules({ ...businessRules, late_deduction_type: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all"
                                                    >
                                                        <option value="none">No Penalty (Warnings only)</option>
                                                        <option value="half_day">Half-Day Salary Cut / Excess Late</option>
                                                        <option value="full_day">Full-Day Salary Cut / Excess Late</option>
                                                        <option value="flat">Flat Amount / Excess Late</option>
                                                        <option value="percent_gross">% of Gross Salary / Excess Late</option>
                                                        <option value="percent_basic">% of Basic Salary / Excess Late</option>
                                                    </select>
                                                </div>

                                                {/* Conditional Input */}
                                                {['flat', 'percent_gross', 'percent_basic'].includes(businessRules.late_deduction_type) && (
                                                    <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                                            {businessRules.late_deduction_type === 'flat' ? 'Flat Penalty Amount (₹)' : 'Penalty Percentage (%)'}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={businessRules.late_deduction_value !== undefined ? businessRules.late_deduction_value : ''}
                                                            onChange={(e) => setBusinessRules({ ...businessRules, late_deduction_value: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                                                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all"
                                                            placeholder={businessRules.late_deduction_type === 'flat' ? 'e.g. 100' : 'e.g. 2.5'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-3">
                                            <button
                                                onClick={handleSaveBusinessRules}
                                                disabled={savingRules}
                                                className="px-4 py-2.5 bg-[#4361ee] hover:bg-indigo-750 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1 w-full justify-center"
                                            >
                                                <CheckCircle size={11} /> Deploy Settings
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statutory Compliance Exports Panel */}
                        <div className="bg-white border border-slate-200/40 rounded-2xl p-5 shadow-sm">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div className="space-y-1 max-w-xl">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                        <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                            <Landmark size={14} />
                                        </div>
                                        Statutory ECR Payroll Exports
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        Download government portal compliant EPFO ECR formats and ESIC monthly wage sheets for instant uploads.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                                    <button
                                        onClick={handleExportEPFECR}
                                        className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm hover:shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Download size={13} />
                                        EPFO ECR (.txt)
                                    </button>
                                    <button
                                        onClick={handleExportESICCSV}
                                        className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-500 to-[#4361ee] hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm hover:shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Download size={13} />
                                        ESIC Payroll (.csv)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Processed Statements Review List */}
                        <div className="bg-white border border-slate-200/40 rounded-2xl p-4 shadow-sm">
                            <div className="mb-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Processed Salary Slips</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Audit log of all generated statements for the active payroll run.</p>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-2">
                                    <div className="w-8 h-8 border-4 border-[#4361ee] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Syncing statements...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar border border-slate-50 rounded-xl">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Salary</th>
                                                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowances</th>
                                                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Deductions Breakdown</th>
                                                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Payout</th>
                                                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStatements.length > 0 ? filteredStatements.map(stmt => (
                                                <tr key={stmt.id} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="py-3.5 px-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase">
                                                                {stmt.first_name?.[0]}{stmt.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-850 uppercase leading-none tracking-tight">{stmt.first_name} {stmt.last_name}</p>
                                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">{stmt.employee_id_number} • {stmt.designation}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-xs font-black text-slate-700">₹{Number(stmt.base_salary).toLocaleString()}</td>
                                                    <td className="py-3.5 px-3 text-xs font-bold text-slate-500">+₹{Number(stmt.total_allowances).toLocaleString()}</td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                            {stmt.total_deductions > 0 && (
                                                                <span className="text-[7.5px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">Fixed: -₹{Number(stmt.total_deductions).toLocaleString()}</span>
                                                            )}
                                                            {stmt.unpaid_leave_deduction > 0 && (
                                                                <span className="text-[7.5px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50">Leaves: -₹{Number(stmt.unpaid_leave_deduction).toLocaleString()}</span>
                                                            )}
                                                            {stmt.late_mark_deduction > 0 && (
                                                                <span className="text-[7.5px] font-black text-orange-605 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100/50">Lates ({stmt.late_marks_count}): -₹{Number(stmt.late_mark_deduction).toLocaleString()}</span>
                                                            )}
                                                            {stmt.employee_pf > 0 && (
                                                                <span className="text-[7.5px] font-black text-[#4361ee] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50">EPF: -₹{Number(stmt.employee_pf).toLocaleString()}</span>
                                                            )}
                                                            {stmt.employee_esic > 0 && (
                                                                <span className="text-[7.5px] font-black text-[#4361ee] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50">ESIC: -₹{Number(stmt.employee_esic).toLocaleString()}</span>
                                                            )}
                                                            {(!stmt.total_deductions && !stmt.unpaid_leave_deduction && !stmt.late_mark_deduction && !stmt.employee_pf && !stmt.employee_esic) && (
                                                                <span className="text-slate-300 font-bold">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-xs font-black text-[#4361ee]">₹{Number(stmt.net_salary).toLocaleString()}</td>
                                                    <td className="py-3.5 px-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${stmt.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-indigo-50 text-[#4361ee] border-indigo-100'
                                                            }`}>
                                                            {stmt.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setSelectedBreakdown(stmt)}
                                                                className="p-1.5 text-slate-400 hover:text-[#4361ee] hover:bg-slate-100 rounded-lg transition-all"
                                                                title="View Detailed Breakdown"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <a
                                                                href={`${api.defaults.baseURL}/payroll/download-slip/${stmt.id}?token=${localStorage.getItem('auth_token') || 'test.admin.token'}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1.5 text-slate-400 hover:text-[#4361ee] hover:bg-slate-100 rounded-lg transition-all"
                                                                title="Download Payslip PDF"
                                                            >
                                                                <Download size={14} />
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                        No statements processed for this period.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* -------------------- TAB 2: PAY REGISTER SPREADSHEET -------------------- */}
                {selectedTab === 'register' && (
                    <motion.div
                        key="register"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="bg-white border border-slate-200/40 rounded-2xl p-4 shadow-sm"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Pay Register Spreadsheet</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Real-time attendance matrices combined with live projected take-home pay sheets.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowPaySalaryModal(true)}
                                    className="px-3.5 py-2 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-sm"
                                >
                                    <Coins size={13} /> Pay Salary
                                </button>
                                <button
                                    onClick={handleExportRegisterCSV}
                                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-sm"
                                >
                                    <Download size={13} /> Export Spreadsheet
                                </button>
                                <button
                                    onClick={fetchRegister}
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-sm border border-slate-200/20"
                                >
                                    <RefreshCw size={13} /> Refresh Spreadsheet
                                </button>
                            </div>
                        </div>

                        {registerLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-2">
                                <div className="w-8 h-8 border-4 border-[#4361ee] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing spreadsheet...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl shadow-inner bg-white">
                                <table className="w-full text-left border-collapse min-w-[1250px]">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200/60">
                                            <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50/95 z-10 min-w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.015)] border-r border-slate-100">Employee Details</th>
                                            <th className="px-3 py-3 text-center text-[9px] font-black text-emerald-600 bg-emerald-50/10 uppercase tracking-widest min-w-[60px]">P</th>
                                            <th className="px-3 py-3 text-center text-[9px] font-black text-amber-600 bg-amber-50/10 uppercase tracking-widest min-w-[60px]">L</th>
                                            <th className="px-3 py-3 text-center text-[9px] font-black text-rose-605 bg-rose-50/10 uppercase tracking-widest min-w-[60px]">A</th>
                                            <th className="px-3 py-3 text-center text-[9px] font-black text-slate-500 bg-slate-100/30 uppercase tracking-widest min-w-[70px]">OFF/H</th>
                                            <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Salary</th>
                                            <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowances</th>
                                            <th className="px-3 py-3 text-rose-600 text-[9px] font-black uppercase tracking-widest">Leaves Cut</th>
                                            <th className="px-3 py-3 text-orange-600 text-[9px] font-black uppercase tracking-widest">Late Penalty</th>
                                            <th className="px-3 py-3 text-emerald-600 text-[9px] font-black uppercase tracking-widest min-w-[130px]">Bonus / Incentives</th>
                                            <th className="px-3 py-3 text-rose-600 text-[9px] font-black uppercase tracking-widest min-w-[130px]">Manual Deductions</th>
                                            {globalRules.filter(r => !!r.is_active).map(rule => (
                                                <th key={rule.id} className="px-3 py-3 text-indigo-600 text-[9px] font-black uppercase tracking-widest">{rule.rule_name}</th>
                                            ))}
                                            <th className="px-3 py-3 text-rose-600 text-[9px] font-black uppercase tracking-widest">Other Deductions</th>
                                            <th className="px-3 py-3 text-rose-600 text-[9px] font-black uppercase tracking-widest">Outstanding Loan</th>
                                            <th className="px-3 py-3 text-rose-600 text-[9px] font-black uppercase tracking-widest">Loan EMI</th>
                                            <th className="px-3 py-3 text-[9px] font-black text-[#4361ee] uppercase tracking-widest bg-indigo-50/10">Projected Net</th>
                                            <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRegisterData.map((reg) => (
                                            <tr key={reg.employee_id} className="hover:bg-slate-50/40 transition-colors group">
                                                <td className="px-3 py-3.5 sticky left-0 bg-white z-10 border-r border-slate-150 shadow-[4px_0_12px_rgba(0,0,0,0.015)]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-[9px] font-black text-slate-600 uppercase">
                                                            {reg.first_name?.[0]}{reg.last_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-800 uppercase leading-none tracking-tight">{reg.first_name} {reg.last_name}</p>
                                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">{reg.employee_id_number} • {reg.designation}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-xs font-black text-emerald-600 bg-emerald-50/5">{reg.stats.P}</td>
                                                <td className="px-3 py-3.5 text-center text-xs font-black text-amber-600 bg-amber-50/5">{reg.stats.L}</td>
                                                <td className="px-3 py-3.5 text-center text-xs font-black text-rose-600 bg-rose-50/5">{reg.stats.A}</td>
                                                <td className="px-3 py-3.5 text-center text-xs font-medium text-slate-400">{reg.stats.OFF + reg.stats.H}</td>
                                                <td className="px-3 py-3.5 text-xs font-bold text-slate-700">₹{Number(reg.full_base_salary !== undefined && reg.full_base_salary !== null ? reg.full_base_salary : reg.base_salary).toLocaleString()}</td>
                                                <td className="px-3 py-3.5 text-xs font-semibold text-slate-500">+₹{Number(reg.full_total_allowances !== undefined && reg.full_total_allowances !== null ? reg.full_total_allowances : reg.total_allowances).toLocaleString()}</td>
                                                <td className="px-3 py-3.5 text-xs font-bold text-rose-500/90">
                                                    {reg.unpaid_leave_deduction > 0 ? `-₹${Number(reg.unpaid_leave_deduction).toFixed(2)}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-3.5 text-xs font-bold text-orange-500/90">
                                                    {reg.late_mark_deduction > 0 ? `-₹${Number(reg.late_mark_deduction).toFixed(2)}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-3.5 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400 font-bold">₹</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            onKeyDown={(e) => { if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                                                            disabled={controls.inputs_locked}
                                                            value={reg.overtime_bonus === 0 ? 0 : (reg.overtime_bonus || '')}
                                                            onChange={(e) => {
                                                                let rawVal = e.target.value;
                                                                rawVal = rawVal.replace(/[^0-9.]/g, '');
                                                                const parts = rawVal.split('.');
                                                                if (parts.length > 2) {
                                                                    rawVal = parts[0] + '.' + parts.slice(1).join('');
                                                                }
                                                                const val = rawVal === '' ? 0 : parseFloat(rawVal) || 0;

                                                                setRegisterData(prev => prev.map(item => {
                                                                    if (item.employee_id === reg.employee_id) {
                                                                        const numBonus = val;
                                                                        const manualDeduct = parseFloat(item.manual_deduction_override) || 0;
                                                                        const base = parseFloat(item.base_salary) || 0;
                                                                        const allowances = parseFloat(item.total_allowances) || 0;
                                                                        const deductions = parseFloat(item.total_deductions) || 0;
                                                                        const late = parseFloat(item.late_mark_deduction) || 0;
                                                                        const loan = parseFloat(item.loan_emi_deduction) || 0;

                                                                        let statutoryDeductionsTotal = 0;
                                                                        if (item.statutory_rules_breakdown) {
                                                                            try {
                                                                                const breakdown = typeof item.statutory_rules_breakdown === 'string'
                                                                                    ? JSON.parse(item.statutory_rules_breakdown)
                                                                                    : item.statutory_rules_breakdown;
                                                                                if (breakdown && typeof breakdown === 'object') {
                                                                                    Object.values(breakdown).forEach(bRule => {
                                                                                        if (bRule && bRule.employeeShare !== undefined) {
                                                                                            statutoryDeductionsTotal += parseFloat(bRule.employeeShare) || 0;
                                                                                        }
                                                                                    });
                                                                                }
                                                                            } catch (e) {}
                                                                        } else {
                                                                            const pf = hasPfRule ? (parseFloat(item.employee_pf) || 0) : 0;
                                                                            const esic = hasEsiRule ? (parseFloat(item.employee_esic) || 0) : 0;
                                                                            const gratuity = hasGratuityRule ? (parseFloat(item.gratuity_share) || 0) : 0;
                                                                            statutoryDeductionsTotal = pf + esic + gratuity;
                                                                        }

                                                                        const net = base + allowances - deductions - late - statutoryDeductionsTotal - loan - manualDeduct + numBonus;
                                                                        const newNet = Math.max(0, net).toFixed(2);
                                                                        return { ...item, overtime_bonus: val, net_salary: newNet };
                                                                    }
                                                                    return item;
                                                                }));
                                                            }}
                                                            className={`w-16 px-1.5 py-1 border border-slate-200 rounded-lg text-xs font-black text-slate-700 focus:border-emerald-500 outline-none ${controls.inputs_locked ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                                                        />
                                                        <button
                                                            disabled={controls.inputs_locked}
                                                            onClick={async () => {
                                                                try {
                                                                    const [mName, year] = selectedMonth.split(' ');
                                                                    const month = monthMap[mName];
                                                                    await api.post('/payroll/bonus-adjustment', {
                                                                        employee_id: reg.employee_id,
                                                                        month,
                                                                        year,
                                                                        overtime_bonus: reg.overtime_bonus || 0
                                                                    });
                                                                    alert(`Incentive/Bonus of ₹${reg.overtime_bonus} successfully saved for ${reg.first_name}!`);
                                                                } catch (err) {
                                                                    alert('Failed to save adjustment');
                                                                }
                                                            }}
                                                            className={`p-1 rounded-lg border transition-all active:scale-90 ${controls.inputs_locked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-55' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100'}`}
                                                            title="Save Adjustment"
                                                        >
                                                            <Check size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400 font-bold">₹</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            onKeyDown={(e) => { if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                                                            disabled={controls.inputs_locked}
                                                            value={reg.manual_deduction_override === 0 ? 0 : (reg.manual_deduction_override || '')}
                                                            onChange={(e) => {
                                                                let rawVal = e.target.value;
                                                                rawVal = rawVal.replace(/[^0-9.]/g, '');
                                                                const parts = rawVal.split('.');
                                                                if (parts.length > 2) {
                                                                    rawVal = parts[0] + '.' + parts.slice(1).join('');
                                                                }
                                                                const val = rawVal === '' ? '' : parseFloat(rawVal) || 0;

                                                                setRegisterData(prev => prev.map(item => {
                                                                    if (item.employee_id === reg.employee_id) {
                                                                        const numDeduct = val === '' ? 0 : val;
                                                                        const bonus = parseFloat(item.overtime_bonus) || 0;
                                                                        const base = parseFloat(item.base_salary) || 0;
                                                                        const allowances = parseFloat(item.total_allowances) || 0;
                                                                        const deductions = parseFloat(item.total_deductions) || 0;
                                                                        const late = parseFloat(item.late_mark_deduction) || 0;
                                                                        const loan = parseFloat(item.loan_emi_deduction) || 0;

                                                                        let statutoryDeductionsTotal = 0;
                                                                        if (item.statutory_rules_breakdown) {
                                                                            try {
                                                                                const breakdown = typeof item.statutory_rules_breakdown === 'string'
                                                                                    ? JSON.parse(item.statutory_rules_breakdown)
                                                                                    : item.statutory_rules_breakdown;
                                                                                if (breakdown && typeof breakdown === 'object') {
                                                                                    Object.values(breakdown).forEach(bRule => {
                                                                                        if (bRule && bRule.employeeShare !== undefined) {
                                                                                            statutoryDeductionsTotal += parseFloat(bRule.employeeShare) || 0;
                                                                                        }
                                                                                    });
                                                                                }
                                                                            } catch (e) {}
                                                                        } else {
                                                                            const pf = hasPfRule ? (parseFloat(item.employee_pf) || 0) : 0;
                                                                            const esic = hasEsiRule ? (parseFloat(item.employee_esic) || 0) : 0;
                                                                            const gratuity = hasGratuityRule ? (parseFloat(item.gratuity_share) || 0) : 0;
                                                                            statutoryDeductionsTotal = pf + esic + gratuity;
                                                                        }

                                                                        const net = base + allowances - deductions - late - statutoryDeductionsTotal - loan - numDeduct + bonus;
                                                                        const newNet = Math.max(0, net).toFixed(2);
                                                                        return { ...item, manual_deduction_override: val, net_salary: newNet };
                                                                    }
                                                                    return item;
                                                                }));
                                                            }}
                                                            className={`w-16 px-1.5 py-1 border border-slate-200 rounded-lg text-xs font-black text-rose-700 focus:border-rose-500 outline-none ${controls.inputs_locked ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                                                        />
                                                        <button
                                                            disabled={controls.inputs_locked}
                                                            onClick={async () => {
                                                                try {
                                                                    const [mName, year] = selectedMonth.split(' ');
                                                                    const month = monthMap[mName];
                                                                    await api.post('/payroll/deduction-adjustment', {
                                                                        employee_id: reg.employee_id,
                                                                        month,
                                                                        year,
                                                                        manual_deduction_override: reg.manual_deduction_override || 0
                                                                    });
                                                                    alert(`Manual Deduction of ₹${reg.manual_deduction_override} successfully saved for ${reg.first_name}!`);
                                                                } catch (err) {
                                                                    alert('Failed to save adjustment');
                                                                }
                                                            }}
                                                            className={`p-1 rounded-lg border transition-all active:scale-90 ${controls.inputs_locked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-55' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100'}`}
                                                            title="Save Adjustment"
                                                        >
                                                            <Check size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                {globalRules.filter(r => !!r.is_active).map(rule => {
                                                    const breakdownVal = (() => {
                                                        if (reg.statutory_rules_breakdown) {
                                                            try {
                                                                const breakdown = typeof reg.statutory_rules_breakdown === 'string'
                                                                    ? JSON.parse(reg.statutory_rules_breakdown)
                                                                    : reg.statutory_rules_breakdown;
                                                                if (breakdown && typeof breakdown === 'object') {
                                                                    const item = breakdown[rule.id] || breakdown[rule.rule_name];
                                                                    if (item && item.employeeShare !== undefined) {
                                                                        return parseFloat(item.employeeShare) || 0;
                                                                    }
                                                                }
                                                            } catch (e) {}
                                                        }
                                                        
                                                        // Fallback to legacy columns for backward compatibility
                                                        const nameLower = rule.rule_name.toLowerCase();
                                                        if (nameLower.includes('pf') || nameLower.includes('provident')) {
                                                            return parseFloat(reg.employee_pf) || 0;
                                                        }
                                                        if (nameLower.includes('esic') || nameLower.includes('esi') || nameLower.includes('insurance')) {
                                                            return parseFloat(reg.employee_esic) || 0;
                                                        }
                                                        if (nameLower.includes('gratuity')) {
                                                            return parseFloat(reg.gratuity_share) || 0;
                                                        }
                                                        return 0;
                                                    })();

                                                    return (
                                                        <td key={rule.id} className="px-3 py-3.5 text-xs font-bold text-indigo-500/90">
                                                            {breakdownVal > 0 ? `-₹${Number(breakdownVal).toFixed(2)}` : '0.00'}
                                                        </td>
                                                    );
                                                })}
                                                <td 
                                                    onClick={() => {
                                                        if (reg.other_deductions_breakdown && reg.other_deductions_breakdown.length > 0) {
                                                            setSelectedOtherDeductions({
                                                                employeeName: `${reg.first_name} ${reg.last_name}`,
                                                                breakdown: reg.other_deductions_breakdown
                                                            });
                                                        }
                                                    }}
                                                    className={`px-3 py-3.5 text-xs font-bold text-rose-500/90 ${reg.other_deductions_breakdown && reg.other_deductions_breakdown.length > 0 ? 'cursor-pointer hover:underline hover:text-rose-700' : ''}`}
                                                >
                                                    {reg.total_deductions > 0 ? `-₹${Number(reg.total_deductions).toFixed(2)}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-3.5 text-xs font-bold text-rose-500/90">
                                                    {reg.remaining_loan > 0 ? `₹${Number(reg.remaining_loan).toFixed(2)}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-3.5 text-xs font-bold text-rose-500/90">
                                                    {reg.loan_emi_deduction > 0 ? `-₹${Number(reg.loan_emi_deduction).toFixed(2)}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-3.5 text-xs font-black text-[#4361ee] bg-indigo-50/15">₹{Number(reg.net_salary).toLocaleString()}</td>
                                                <td className="px-3 py-3.5 text-right">
                                                    <span className={`px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest border ${reg.status === 'generated' || reg.status === 'paid'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        {reg.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* -------------------- TAB 3.5: PAYROLL INPUTS (SALARY REVISIONS) -------------------- */}
                {selectedTab === 'inputs' && (
                    <div className="flex flex-col lg:flex-row gap-5 items-start w-full relative animate-fade-in">
                        {/* Left Panel: Employee selector list */}
                        <AnimatePresence initial={false}>
                            {!isSidebarCollapsed && (
                                <motion.div
                                    key="inputs-sidebar"
                                    initial={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
                                    animate={isMobile ? { height: 'auto', opacity: 1 } : { width: isMobile ? '100%' : '33.3333%', opacity: 1 }}
                                    exit={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                                    className="w-full lg:w-1/3 bg-white border border-slate-200/40 rounded-2xl p-4 shadow-sm space-y-4 shrink-0 overflow-hidden"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Employee Directory</h3>
                                            <p className="text-slate-400 text-xs mt-0.5">Select an employee to manage salary structures and view payout history.</p>
                                        </div>
                                        <button
                                            onClick={() => setIsSidebarCollapsed(true)}
                                            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hidden lg:block transition-all active:scale-95"
                                            title="Collapse Sidebar"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                    </div>

                                    {/* Search bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search employee..."
                                            value={inputsSearchQuery}
                                            onChange={(e) => setInputsSearchQuery(e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#4361ee] transition-all"
                                        />
                                    </div>

                                    {structureLoading && !selectedInputsEmployee ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="w-8 h-8 border-4 border-[#4361ee] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                                            {(inputsSearchQuery ? employees : filteredEmployees)
                                                .filter(emp => {
                                                    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                                                    const empIdNum = (emp.employee_id_number || '').toLowerCase();
                                                    const dept = (emp.department_name || emp.department || '').toLowerCase();
                                                    const designation = (emp.designation || emp.role || '').toLowerCase();
                                                    const query = inputsSearchQuery.toLowerCase();
                                                    return fullName.includes(query) || 
                                                           empIdNum.includes(query) || 
                                                           dept.includes(query) || 
                                                           designation.includes(query);
                                                })
                                                .map((emp) => {
                                                    const isSelected = selectedInputsEmployee?.id === emp.id;
                                                    return (
                                                        <div
                                                            key={emp.id}
                                                            onClick={() => handleSelectInputsEmployee(emp)}
                                                            className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border my-1 active:scale-99 ${isSelected
                                                                ? 'bg-[#4361ee]/5 border-[#4361ee]/20 shadow-sm'
                                                                : 'hover:bg-slate-50 border-transparent'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase shadow-inner">
                                                                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">{emp.first_name} {emp.last_name}</h4>
                                                                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{emp.designation || 'Staff'} • {emp.employee_id_number}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowRight size={13} className={isSelected ? 'text-[#4361ee]' : 'text-slate-300'} />
                                                        </div>
                                                    );
                                                })
                                            }
                                            {(inputsSearchQuery ? employees : filteredEmployees).filter(emp => {
                                                const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                                                const empIdNum = (emp.employee_id_number || '').toLowerCase();
                                                const dept = (emp.department_name || emp.department || '').toLowerCase();
                                                const designation = (emp.designation || emp.role || '').toLowerCase();
                                                const query = inputsSearchQuery.toLowerCase();
                                                return fullName.includes(query) || 
                                                       empIdNum.includes(query) || 
                                                       dept.includes(query) || 
                                                       designation.includes(query);
                                            }).length === 0 && (
                                                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">No employees found.</div>
                                                )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Right Panel: Salary Revision & History Details */}
                        <motion.div
                            key="inputs-right"
                            animate={{ width: isMobile ? '100%' : (isSidebarCollapsed ? '100%' : '66.6667%') }}
                            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                            className="space-y-5 flex-1 w-full"
                        >
                            {/* Toggle Sidebar Button if collapsed */}
                            {isSidebarCollapsed && (
                                <div className="flex justify-start">
                                    <button
                                        onClick={() => setIsSidebarCollapsed(false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                    >
                                        <ChevronRight size={13} className="text-[#4361ee]" /> Show Employee Directory
                                    </button>
                                </div>
                            )}
                            {selectedInputsEmployee ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white border border-slate-200/40 rounded-2xl p-5 shadow-sm space-y-5 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-[#4361ee]" />

                                    {/* Header Detail */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-[#4361ee] uppercase">
                                                {selectedInputsEmployee.first_name?.[0]}{selectedInputsEmployee.last_name?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedInputsEmployee.first_name} {selectedInputsEmployee.last_name}</h3>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                                                    {selectedInputsEmployee.designation || 'Software Developer'} • Join Date: {selectedInputsEmployee.joining_date ? new Date(selectedInputsEmployee.joining_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {controls.inputs_locked && (
                                                <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-wider bg-rose-50/80 px-2.5 py-1.5 rounded-xl border border-rose-150 flex items-center gap-1 shadow-sm">
                                                    <Lock size={11} className="text-rose-500 animate-pulse" /> Inputs Locked
                                                </span>
                                            )}
                                            {!isAddingNewRevision && !isRevisionEditing && (
                                                <>
                                                    {inputsHistory.length > 0 ? (
                                                        <>
                                                            <button
                                                                onClick={handleExportInputsCSV}
                                                                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                                                            >
                                                                <Download size={12} /> Export History
                                                            </button>
                                                            <button
                                                                disabled={controls.inputs_locked}
                                                                onClick={() => {
                                                                    setIsAddingNewRevision(true);
                                                                    setPercentInputs({});
                                                                    const isPfEnabled = pfRule ? isRuleApplicableLocal(selectedInputsEmployee, pfRule, 'include_pf') : true;
                                                                    const isEsiEnabled = esiRule ? isRuleApplicableLocal(selectedInputsEmployee, esiRule, 'include_esi') : true;

                                                                    if (selectedRevision) {
                                                                        const prevGross = parseFloat(selectedRevision.gross_salary) || 0;
                                                                        const prevBasic = parseFloat(selectedRevision.basic) || 0;
                                                                        setGrossInput(String(selectedRevision.gross_salary || ''));
                                                                        setBasicInput(String(selectedRevision.basic || ''));
                                                                        setHraInput(String(selectedRevision.hra || ''));
                                                                        setSpecialAllowanceInput(String(selectedRevision.special_allowance || '0'));
                                                                        setMedicalAllowanceInput(String(selectedRevision.medical_allowance || '0'));
                                                                        
                                                                        const epfVal = parseFloat(selectedRevision.employer_pf) || 0;
                                                                        const eePfVal = parseFloat(selectedRevision.employee_pf) || 0;
                                                                        setEmployerPfInput(isPfEnabled ? (epfVal > 0 ? String(epfVal) : String(parseFloat((prevBasic * pfErRate).toFixed(2)))) : '0');
                                                                        setEmployeePfInput(isPfEnabled ? (eePfVal > 0 ? String(eePfVal) : String(parseFloat((prevBasic * pfEeRate).toFixed(2)))) : '0');

                                                                        const erEsiVal = parseFloat(selectedRevision.employer_esic) || 0;
                                                                        const eeEsiVal = parseFloat(selectedRevision.employee_esic) || 0;
                                                                        setEmployerEsicInput(isEsiEnabled ? (erEsiVal > 0 ? String(erEsiVal) : String(parseFloat((prevGross * esiErRate).toFixed(2)))) : '0');
                                                                        setEmployeeEsicInput(isEsiEnabled ? (eeEsiVal > 0 ? String(eeEsiVal) : String(parseFloat((prevGross * esiEeRate).toFixed(2)))) : '0');
                                                                    } else {
                                                                        setGrossInput('');
                                                                        setBasicInput('');
                                                                        setHraInput('');
                                                                        setSpecialAllowanceInput('0');
                                                                        setMedicalAllowanceInput('0');
                                                                        setEmployerPfInput('0');
                                                                        setEmployerEsicInput('0');
                                                                        setEmployeePfInput('0');
                                                                        setEmployeeEsicInput('0');
                                                                    }
                                                                    setEffectiveFromInput('');
                                                                    setPayoutMonthInput('');
                                                                    setRevisionRemarks('');
                                                                    setRevisionNotes('');
                                                                }}
                                                                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${controls.inputs_locked
                                                                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                                    : 'bg-[#4361ee] hover:bg-indigo-700 active:scale-98 text-white'
                                                                    }`}
                                                            >
                                                                <Plus size={12} /> Add New Revision
                                                            </button>
                                                            {selectedRevision && (
                                                                <button
                                                                    disabled={controls.inputs_locked}
                                                                    onClick={() => {
                                                                        setIsRevisionEditing(true);
                                                                        const isPfEnabled = pfRule ? isRuleApplicableLocal(selectedInputsEmployee, pfRule, 'include_pf') : true;
                                                                        const isEsiEnabled = esiRule ? isRuleApplicableLocal(selectedInputsEmployee, esiRule, 'include_esi') : true;
                                                                        const basicVal = parseFloat(basicInput) || 0;
                                                                        const grossVal = parseFloat(grossInput) || 0;
                                                                        if (isPfEnabled) {
                                                                            if (!employerPfInput || parseFloat(employerPfInput) === 0) {
                                                                                setEmployerPfInput(String(parseFloat((basicVal * pfErRate).toFixed(2))));
                                                                            }
                                                                            if (!employeePfInput || parseFloat(employeePfInput) === 0) {
                                                                                setEmployeePfInput(String(parseFloat((basicVal * pfEeRate).toFixed(2))));
                                                                            }
                                                                        } else {
                                                                            setEmployerPfInput('0');
                                                                            setEmployeePfInput('0');
                                                                        }
                                                                        if (isEsiEnabled) {
                                                                            if (!employerEsicInput || parseFloat(employerEsicInput) === 0) {
                                                                                setEmployerEsicInput(String(parseFloat((grossVal * esiErRate).toFixed(2))));
                                                                            }
                                                                            if (!employeeEsicInput || parseFloat(employeeEsicInput) === 0) {
                                                                                setEmployeeEsicInput(String(parseFloat((grossVal * esiEeRate).toFixed(2))));
                                                                            }
                                                                        } else {
                                                                            setEmployerEsicInput('0');
                                                                            setEmployeeEsicInput('0');
                                                                        }
                                                                    }}
                                                                    className={`px-3.5 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${controls.inputs_locked
                                                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                                        : 'bg-white hover:bg-slate-50 active:scale-98 text-slate-700 border-slate-200'
                                                                        }`}
                                                                >
                                                                    <Edit3 size={12} /> Update Revision
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <button
                                                            disabled={controls.inputs_locked}
                                                            onClick={() => {
                                                                setIsAddingNewRevision(true);
                                                                setPercentInputs({});
                                                                setGrossInput('');
                                                                setBasicInput('');
                                                                setHraInput('');
                                                                setSpecialAllowanceInput('0');
                                                                setMedicalAllowanceInput('0');
                                                                setEmployerPfInput('');
                                                                setEmployerEsicInput('');
                                                                setEmployeePfInput('');
                                                                setEmployeeEsicInput('');
                                                                setEffectiveFromInput('');
                                                                setPayoutMonthInput('');
                                                                setRevisionRemarks('');
                                                                setRevisionNotes('');
                                                            }}
                                                            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${controls.inputs_locked
                                                                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                                : 'bg-[#4361ee] hover:bg-indigo-700 active:scale-98 text-white'
                                                                }`}
                                                        >
                                                            <Plus size={12} /> Add Salary Structure
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statutory Applicability Settings Card */}
                                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                        <div className="space-y-1 max-w-2xl">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Statutory Applicability</span>
                                            <span className="text-[9.5px] text-slate-400 font-semibold block leading-snug">Toggle whether EPF, ESIC, LWF, and Gratuity auto-calculation and deductions are active for this employee's payroll.</span>
                                        </div>
                                        <div className="flex flex-wrap md:flex-nowrap gap-3 items-center flex-shrink-0">
                                            {globalRules.filter(r => !!r.is_active).map(rule => {
                                                const nameLower = rule.rule_name.toLowerCase();
                                                let keyName = '';
                                                if (nameLower.includes('pf') || nameLower.includes('provident')) keyName = 'include_pf';
                                                else if (nameLower.includes('esic') || nameLower.includes('esi') || nameLower.includes('insurance')) keyName = 'include_esi';
                                                else if (nameLower.includes('lwf')) keyName = 'include_lwf';
                                                else if (nameLower.includes('gratuity')) keyName = 'include_gratuity';

                                                const isChecked = isRuleApplicableLocal(selectedInputsEmployee, rule, keyName);

                                                return (
                                                    <label key={rule.id} className="flex items-center gap-2.5 cursor-pointer bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm hover:border-[#4361ee]/40 transition-all select-none whitespace-nowrap">
                                                        <input 
                                                            type="checkbox"
                                                            disabled={controls.inputs_locked}
                                                            checked={isChecked}
                                                            onChange={async (e) => {
                                                                if (controls.inputs_locked) return;
                                                                const newValue = e.target.checked;
                                                                try {
                                                                    // Sync applicable_statutory_rules array
                                                                    let appRules = selectedInputsEmployee.applicable_statutory_rules 
                                                                        ? (typeof selectedInputsEmployee.applicable_statutory_rules === 'string' 
                                                                            ? JSON.parse(selectedInputsEmployee.applicable_statutory_rules) 
                                                                            : [...selectedInputsEmployee.applicable_statutory_rules]) 
                                                                        : [];
                                                                    if (!Array.isArray(appRules)) appRules = [];

                                                                    if (newValue) {
                                                                        if (!appRules.includes(rule.id)) appRules.push(rule.id);
                                                                    } else {
                                                                        appRules = appRules.filter(id => id !== rule.id);
                                                                    }

                                                                    // Prepare payload
                                                                    const patchPayload = {
                                                                        applicable_statutory_rules: appRules
                                                                    };
                                                                    if (keyName) {
                                                                        patchPayload[keyName] = newValue;
                                                                    }

                                                                    // Call PATCH endpoint to update database setting
                                                                    await api.patch(`/employees/${selectedInputsEmployee.id}/statutory-settings`, patchPayload);
                                                                    
                                                                    // Update local employee states in selectedInputsEmployee and employees array
                                                                    const updatedEmployee = { 
                                                                        ...selectedInputsEmployee, 
                                                                        applicable_statutory_rules: appRules
                                                                    };
                                                                    if (keyName) {
                                                                        updatedEmployee[keyName] = newValue ? 1 : 0;
                                                                    }
                                                                    setSelectedInputsEmployee(updatedEmployee);
                                                                    setEmployees(prev => prev.map(emp => emp.id === selectedInputsEmployee.id ? updatedEmployee : emp));
                                                                    
                                                                    // If in edit / add revision mode, trigger auto-recalculation dynamically!
                                                                    if (isAddingNewRevision || isRevisionEditing) {
                                                                        const gross = parseFloat(grossInput) || 0;
                                                                        const basic = parseFloat(basicInput) || 0;
                                                                        
                                                                        const isPf = pfRule ? isRuleApplicableLocal(updatedEmployee, pfRule, 'include_pf') : false;
                                                                        const isEsi = esiRule ? isRuleApplicableLocal(updatedEmployee, esiRule, 'include_esi') : false;
                                                                        
                                                                        const eePf = isPf ? (basic * pfEeRate) : 0;
                                                                        const eeEsic = isEsi ? (gross * esiEeRate) : 0;
                                                                        const erPf = isPf ? (basic * pfErRate) : 0;
                                                                        const erEsic = isEsi ? (gross * esiErRate) : 0;
                                                                        
                                                                        setEmployeePfInput(String(parseFloat(eePf.toFixed(2))));
                                                                        setEmployeeEsicInput(String(parseFloat(eeEsic.toFixed(2))));
                                                                        setEmployerPfInput(String(parseFloat(erPf.toFixed(2))));
                                                                        setEmployerEsicInput(String(parseFloat(erEsic.toFixed(2))));
                                                                    } else if (selectedRevision) {
                                                                        // If viewing a locked revision, update the inputs on-screen display values
                                                                        const isPf = pfRule ? isRuleApplicableLocal(updatedEmployee, pfRule, 'include_pf') : false;
                                                                        const isEsi = esiRule ? isRuleApplicableLocal(updatedEmployee, esiRule, 'include_esi') : false;
                                                                        
                                                                        const basicVal = parseFloat(selectedRevision.basic) || 0;
                                                                        const grossVal = parseFloat(selectedRevision.gross_salary) || 0;
                                                                        
                                                                        const epfVal = parseFloat(selectedRevision.employer_pf) || 0;
                                                                        const eePfVal = parseFloat(selectedRevision.employee_pf) || 0;
                                                                        setEmployerPfInput(isPf ? (epfVal > 0 ? String(epfVal) : String(parseFloat((basicVal * pfErRate).toFixed(2)))) : '0');
                                                                        setEmployeePfInput(isPf ? (eePfVal > 0 ? String(eePfVal) : String(parseFloat((basicVal * pfEeRate).toFixed(2)))) : '0');

                                                                        const erEsiVal = parseFloat(selectedRevision.employer_esic) || 0;
                                                                        const eeEsiVal = parseFloat(selectedRevision.employee_esic) || 0;
                                                                        setEmployerEsicInput(isEsi ? (erEsiVal > 0 ? String(erEsiVal) : String(parseFloat((grossVal * esiErRate).toFixed(2)))) : '0');
                                                                        setEmployeeEsicInput(isEsi ? (eeEsiVal > 0 ? String(eeEsiVal) : String(parseFloat((grossVal * esiEeRate).toFixed(2)))) : '0');
                                                                    }
                                                                } catch (err) {
                                                                    alert(err.response?.data?.message || 'Failed to update statutory settings');
                                                                }
                                                            }}
                                                            className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 disabled:opacity-50"
                                                        />
                                                        <span className="text-[9px] font-black uppercase text-slate-600">{rule.rule_name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Empty State / Dashboard Content */}
                                    {inputsHistory.length === 0 && !isAddingNewRevision ? (
                                        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
                                            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-300 shadow-inner">
                                                <Coins size={28} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-650 uppercase tracking-widest">No Salary Structured Yet</h4>
                                                <p className="text-slate-400 text-[10px] mt-1.5 max-w-[280px]">This employee does not have any salary structures or revisions set up. Click below to add their initial salary structure.</p>
                                            </div>
                                            <button
                                                disabled={controls.inputs_locked}
                                                onClick={() => {
                                                    setIsAddingNewRevision(true);
                                                    setPercentInputs({});
                                                    setGrossInput('');
                                                    setBasicInput('');
                                                    setHraInput('');
                                                    setSpecialAllowanceInput('0');
                                                    setMedicalAllowanceInput('0');
                                                    setEmployerPfInput('');
                                                    setEmployerEsicInput('');
                                                    setEmployeePfInput('');
                                                    setEmployeeEsicInput('');
                                                    setEffectiveFromInput('');
                                                    setPayoutMonthInput('');
                                                    setRevisionRemarks('');
                                                    setRevisionNotes('');
                                                }}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${controls.inputs_locked
                                                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                    : 'bg-[#4361ee] hover:bg-indigo-700 active:scale-98 text-white'
                                                    }`}
                                            >
                                                <Plus size={12} /> Add Salary Structure
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                            {/* Sub-Timeline List */}
                                            <div className="md:col-span-3 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-3 space-y-3">
                                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">History</h4>
                                                <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-0.5">
                                                    {inputsHistory.map((rev) => {
                                                        const isSelected = selectedRevision?.id === rev.id;
                                                        return (
                                                            <div
                                                                key={rev.id}
                                                                onClick={() => {
                                                                    if (!isAddingNewRevision && !isRevisionEditing) {
                                                                        setSelectedRevision(rev);
                                                                        setGrossInput(String(rev.gross_salary || ''));
                                                                        setEffectiveFromInput(rev.effective_from ? rev.effective_from.split('T')[0] : '');
                                                                        setPayoutMonthInput(rev.payout_month || '');
                                                                        setRevisionRemarks(rev.remarks || '');
                                                                        setRevisionNotes(rev.notes || '');
                                                                        setBasicInput(String(rev.basic || ''));
                                                                        setHraInput(String(rev.hra || ''));
                                                                        setSpecialAllowanceInput(String(rev.special_allowance || '0'));
                                                                        setMedicalAllowanceInput(String(rev.medical_allowance || '0'));
                                                                        setEmployerPfInput(String(rev.employer_pf || ''));
                                                                        setEmployerEsicInput(String(rev.employer_esic || ''));
                                                                        setEmployeePfInput(String(rev.employee_pf || ''));
                                                                        setEmployeeEsicInput(String(rev.employee_esic || ''));
                                                                    }
                                                                }}
                                                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${isSelected
                                                                    ? 'bg-indigo-50/80 border-indigo-250 shadow-sm text-slate-800 font-extrabold'
                                                                    : 'bg-white hover:bg-slate-50 border-transparent text-slate-600'
                                                                    } ${(isAddingNewRevision || isRevisionEditing) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                                            >
                                                                <div className="text-[9px] font-black uppercase text-slate-800">{rev.payout_month || 'Payout N/A'}</div>
                                                                <div className="text-[7.5px] font-bold mt-0.5 text-slate-400">
                                                                    Eff: {rev.effective_from ? new Date(rev.effective_from).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'N/A'}
                                                                </div>
                                                                <div className="text-[10px] font-black mt-1 text-[#4361ee]">
                                                                    ₹{Number(rev.gross_salary || 0).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {inputsHistory.length === 0 && (
                                                        <div className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase tracking-wider">New Structure (Draft)</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comparative Grid & Fields */}
                                            <div className="md:col-span-9 space-y-4">
                                                {/* Gross Input if Adding or Editing */}
                                                {(isAddingNewRevision || isRevisionEditing) && (
                                                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Gross Salary Input</label>
                                                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Basic, HRA, PF & ESIC will auto-compute</p>
                                                        </div>
                                                        <div className="relative w-full sm:w-48">
                                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                                            <input
                                                                type="number"
                                                                value={grossInput}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setGrossInput(val);
                                                                    const gross = parseFloat(val) || 0;
                                                                    const basic = gross * 0.60;
                                                                    const hra = gross * 0.40;
                                                                    const special = 0;
                                                                    const medical = 0;

                                                                    const isPfEnabled = pfRule ? isRuleApplicableLocal(selectedInputsEmployee, pfRule, 'include_pf') : true;
                                                                    const isEsiEnabled = esiRule ? isRuleApplicableLocal(selectedInputsEmployee, esiRule, 'include_esi') : true;

                                                                    const eePf = isPfEnabled ? (basic * pfEeRate) : 0;
                                                                    const eeEsic = isEsiEnabled ? (gross * esiEeRate) : 0;
                                                                    const erPf = isPfEnabled ? (basic * pfErRate) : 0;
                                                                    const erEsic = isEsiEnabled ? (gross * esiErRate) : 0;

                                                                    const formattedBasic = parseFloat(basic.toFixed(2));
                                                                    const formattedHra = parseFloat(hra.toFixed(2));
                                                                    const formattedEePf = parseFloat(eePf.toFixed(2));
                                                                    const formattedEeEsic = parseFloat(eeEsic.toFixed(2));
                                                                    const formattedErPf = parseFloat(erPf.toFixed(2));
                                                                    const formattedErEsic = parseFloat(erEsic.toFixed(2));

                                                                    setBasicInput(String(formattedBasic));
                                                                    setHraInput(String(formattedHra));
                                                                    setSpecialAllowanceInput(String(special));
                                                                    setMedicalAllowanceInput(String(medical));
                                                                    setEmployeePfInput(String(formattedEePf));
                                                                    setEmployeeEsicInput(String(formattedEeEsic));
                                                                    setEmployerPfInput(String(formattedErPf));
                                                                    setEmployerEsicInput(String(formattedErEsic));
                                                                }}
                                                                className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-slate-800 text-xs focus:outline-none focus:border-[#4361ee] shadow-sm"
                                                                placeholder="Enter Gross Salary"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Comparison Matrix Table */}
                                                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                                                    <table className="w-full border-collapse text-left">
                                                        <thead>
                                                            <tr className="bg-slate-50/80 border-b border-slate-150 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                <th className="p-3">Salary Item</th>
                                                                <th className="p-3 text-right">Previous Salary</th>
                                                                <th className="p-3 text-right">Revised Salary</th>
                                                                <th className="p-3 text-right">Revision %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-[10px] font-bold text-slate-700">
                                                            {(() => {
                                                                let prevRev = isAddingNewRevision ? (inputsHistory[0] || null) : getPriorRevision(selectedRevision);
                                                                const grossPrev = parseFloat(prevRev?.gross_salary) || 0;
                                                                const basicPrev = parseFloat(prevRev?.basic) || 0;
                                                                const hraPrev = parseFloat(prevRev?.hra) || 0;
                                                                const specialPrev = parseFloat(prevRev?.special_allowance) || 0;
                                                                const medicalPrev = parseFloat(prevRev?.medical_allowance) || 0;
                                                                const empPfPrev = parseFloat(prevRev?.employer_pf) || 0;
                                                                const empEsicPrev = parseFloat(prevRev?.employer_esic) || 0;
                                                                const eePfPrev = parseFloat(prevRev?.employee_pf) || 0;
                                                                const eeEsicPrev = parseFloat(prevRev?.employee_esic) || 0;

                                                                const grossRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(grossInput) || 0) : (parseFloat(selectedRevision?.gross_salary) || 0);
                                                                const basicRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(basicInput) || 0) : (parseFloat(selectedRevision?.basic) || 0);
                                                                const hraRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(hraInput) || 0) : (parseFloat(selectedRevision?.hra) || 0);
                                                                const specialRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(specialAllowanceInput) || 0) : (parseFloat(selectedRevision?.special_allowance) || 0);
                                                                const medicalRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(medicalAllowanceInput) || 0) : (parseFloat(selectedRevision?.medical_allowance) || 0);
                                                                const empPfRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employerPfInput) || 0) : (parseFloat(selectedRevision?.employer_pf) || 0);
                                                                const empEsicRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employerEsicInput) || 0) : (parseFloat(selectedRevision?.employer_esic) || 0);
                                                                const eePfRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employeePfInput) || 0) : (parseFloat(selectedRevision?.employee_pf) || 0);
                                                                const eeEsicRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employeeEsicInput) || 0) : (parseFloat(selectedRevision?.employee_esic) || 0);

                                                                const items = [
                                                                    { name: 'FULL BASIC (60%)', prev: basicPrev, rev: basicRev, field: 'basic', valInput: basicInput },
                                                                    { name: 'FULL HRA (40%)', prev: hraPrev, rev: hraRev, field: 'hra', valInput: hraInput },
                                                                    { name: 'FULL SPECIAL ALLOWANCE', prev: specialPrev, rev: specialRev, field: 'special', valInput: specialAllowanceInput },
                                                                    { name: 'FULL MEDICAL ALLOWANCE', prev: medicalPrev, rev: medicalRev, field: 'medical', valInput: medicalAllowanceInput },
                                                                    ...(hasPfRule ? [
                                                                        { name: `FULL EMPLOYER PF (${(pfErRate * 100).toFixed(1).replace(/\.0$/, '')}%)`, prev: empPfPrev, rev: empPfRev, field: 'employer_pf', valInput: employerPfInput },
                                                                        { name: `EMPLOYEE PF (${(pfEeRate * 100).toFixed(1).replace(/\.0$/, '')}%)`, prev: eePfPrev, rev: eePfRev, field: 'employee_pf', valInput: employeePfInput }
                                                                    ] : []),
                                                                    ...(hasEsiRule ? [
                                                                        { name: `FULL EMPLOYER ESIC (${(esiErRate * 100).toFixed(2).replace(/\.00$/, '')}%)`, prev: empEsicPrev, rev: empEsicRev, field: 'employer_esic', valInput: employerEsicInput },
                                                                        { name: `EMPLOYEE ESIC (${(esiEeRate * 100).toFixed(2).replace(/\.00$/, '')}%)`, prev: eeEsicPrev, rev: eeEsicRev, field: 'employee_esic', valInput: employeeEsicInput }
                                                                    ] : [])
                                                                ];
                                                                return items.map((row, idx) => {
                                                                    const diffPct = calculateRevisionPercent(row.prev, row.rev);
                                                                    const isPositive = parseFloat(diffPct) > 0;
                                                                    const isNegative = parseFloat(diffPct) < 0;
                                                                    const isPfEnabled = pfRule ? isRuleApplicableLocal(selectedInputsEmployee, pfRule, 'include_pf') : true;
                                                                    const isEsiEnabled = esiRule ? isRuleApplicableLocal(selectedInputsEmployee, esiRule, 'include_esi') : true;
                                                                    const isItemDisabled = (row.field.includes('pf') && !isPfEnabled) || (row.field.includes('esic') && !isEsiEnabled);

                                                                    return (
                                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                                            <td className="p-3 text-slate-800 font-extrabold uppercase text-[9px] tracking-tight">{row.name}</td>
                                                                            <td className="p-3 text-right text-slate-400 font-semibold">₹{row.prev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                            <td className="p-3 text-right">
                                                                                {(isAddingNewRevision || isRevisionEditing) ? (
                                                                                    <input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        disabled={isItemDisabled}
                                                                                        value={isItemDisabled ? '0' : row.valInput}
                                                                                        onChange={(e) => handleComponentFieldChange(row.field, e.target.value)}
                                                                                        className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:outline-none focus:border-[#4361ee] shadow-sm disabled:opacity-50 disabled:bg-slate-100"
                                                                                    />
                                                                                ) : (
                                                                                    <span className="text-slate-850 font-black">₹{row.rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-3 text-right">
                                                                                {(isAddingNewRevision || isRevisionEditing) ? (
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <input
                                                                                            type="number"
                                                                                            step="any"
                                                                                            disabled={row.prev === 0 || isItemDisabled}
                                                                                            value={(row.prev === 0 || isItemDisabled) ? '' : (percentInputs[row.field] !== undefined ? percentInputs[row.field] : calculateRevisionPercent(row.prev, row.valInput))}
                                                                                            onChange={(e) => handleComponentPercentChange(row.field, e.target.value, row.prev)}
                                                                                            className="w-16 px-1.5 py-0.5 text-right bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#4361ee] disabled:opacity-50 disabled:bg-slate-100 shadow-sm"
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                        <span className="text-[10px] text-slate-400 font-black">%</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${isPositive
                                                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                                        : isNegative
                                                                                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                                            : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                                                        }`}>
                                                                                        {isPositive ? '+' : ''}{diffPct}%
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                });
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Summary Cards */}
                                                {(() => {
                                                    const grossRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(grossInput) || 0) : (parseFloat(selectedRevision?.gross_salary) || 0);
                                                    const basicRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(basicInput) || 0) : (parseFloat(selectedRevision?.basic) || 0);
                                                    const eePfRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employeePfInput) || 0) : (parseFloat(selectedRevision?.employee_pf) || 0);
                                                    const eeEsicRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employeeEsicInput) || 0) : (parseFloat(selectedRevision?.employee_esic) || 0);
                                                    const empPfRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employerPfInput) || 0) : (parseFloat(selectedRevision?.employer_pf) || 0);
                                                    const empEsicRev = (isAddingNewRevision || isRevisionEditing) ? (parseFloat(employerEsicInput) || 0) : (parseFloat(selectedRevision?.employer_esic) || 0);

                                                    const netTakeHome = grossRev - eePfRev - eeEsicRev;
                                                    const monthlyCTC = grossRev + empPfRev + empEsicRev;
                                                    const annualCTC = monthlyCTC * 12;

                                                    return (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                            <div className="bg-white border border-slate-150 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
                                                                <div>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Full Gross</span>
                                                                    <span className="text-xs font-black text-[#4361ee] mt-1 block">
                                                                        ₹{grossRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                                <div className="p-2 bg-indigo-50 text-[#4361ee] rounded-xl">
                                                                    <Coins size={14} />
                                                                </div>
                                                            </div>
                                                            <div className="bg-white border border-slate-150 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
                                                                <div>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Net Take Home</span>
                                                                    <span className="text-xs font-black text-emerald-600 mt-1 block">
                                                                        ₹{netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                                                    <Landmark size={14} />
                                                                </div>
                                                            </div>
                                                            <div className="bg-white border border-slate-150 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
                                                                <div>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Monthly CTC</span>
                                                                    <span className="text-xs font-black text-slate-700 mt-1 block">
                                                                        ₹{monthlyCTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                                <div className="p-2 bg-slate-50 text-slate-500 rounded-xl">
                                                                    <Calculator size={14} />
                                                                </div>
                                                            </div>
                                                            <div className="bg-white border border-slate-150 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
                                                                <div>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Annual CTC</span>
                                                                    <span className="text-xs font-black text-indigo-900 mt-1 block">
                                                                        ₹{annualCTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                                <div className="p-2 bg-indigo-50 text-indigo-900 rounded-xl">
                                                                    <TrendingUp size={14} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Form Fields: Effective date, payout month, remarks, notes */}
                                                <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[8.5px] font-black text-slate-550 uppercase tracking-wider block mb-1.5">Effective From Date *</label>
                                                        <input
                                                            type="date"
                                                            value={effectiveFromInput}
                                                            onChange={(e) => setEffectiveFromInput(e.target.value)}
                                                            disabled={!isAddingNewRevision && !isRevisionEditing}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#4361ee] shadow-sm disabled:opacity-75 disabled:bg-slate-50"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[8.5px] font-black text-slate-550 uppercase tracking-wider block mb-1.5">Payout Month *</label>
                                                        <select
                                                            value={payoutMonthInput}
                                                            onChange={(e) => setPayoutMonthInput(e.target.value)}
                                                            disabled={!isAddingNewRevision && !isRevisionEditing}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#4361ee] shadow-sm disabled:opacity-75 disabled:bg-slate-50"
                                                        >
                                                            <option value="">Select Payout Month</option>
                                                            {months.map((m) => {
                                                                const val = `${m.name} ${m.year}`;
                                                                return (
                                                                    <option key={val} value={val}>{val}</option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <label className="text-[8.5px] font-black text-slate-550 uppercase tracking-wider block mb-1.5">Employee Remarks</label>
                                                        <textarea
                                                            value={revisionRemarks}
                                                            onChange={(e) => setRevisionRemarks(e.target.value)}
                                                            disabled={!isAddingNewRevision && !isRevisionEditing}
                                                            rows={2}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#4361ee] shadow-sm disabled:opacity-75 disabled:bg-slate-50"
                                                            placeholder="These remarks will be visible to the employee on their dashboard/slip."
                                                        />
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <label className="text-[8.5px] font-black text-slate-550 uppercase tracking-wider block mb-1.5">Admin Internal Notes</label>
                                                        <textarea
                                                            value={revisionNotes}
                                                            onChange={(e) => setRevisionNotes(e.target.value)}
                                                            disabled={!isAddingNewRevision && !isRevisionEditing}
                                                            rows={2}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#4361ee] shadow-sm disabled:opacity-75 disabled:bg-slate-50"
                                                            placeholder="Internal admin log, not visible to the employee."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Action Buttons at bottom of Form */}
                                                {(isAddingNewRevision || isRevisionEditing) && (
                                                    <div className="flex justify-end gap-3.5 pt-2 animate-slide-up">
                                                        <button
                                                            onClick={handleCancelRevision}
                                                            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 active:scale-98 text-slate-650 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            disabled={controls.inputs_locked}
                                                            onClick={handleSaveRevision}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all ${controls.inputs_locked
                                                                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                                : 'bg-[#4361ee] hover:bg-indigo-700 active:scale-98 text-white'
                                                                }`}
                                                        >
                                                            Save Revision
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-300 shadow-inner">
                                        <Landmark size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest">No Employee Selected</h4>
                                        <p className="text-slate-400 text-[9px] mt-1 max-w-[260px]">Select a staff member from the directory to manage their payroll inputs and revisions.</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* -------------------- TAB 4: GLOBAL STATUTORY FORMULAS -------------------- */}
                {selectedTab === 'global-rules' && (
                    <motion.div
                        key="global-rules"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        <div className="lg:col-span-8 bg-white border border-slate-200/40 rounded-2xl p-5 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                        <Landmark className="text-[#4361ee]" size={16} /> Statutory & Deduction Formulas
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5">Configure global dynamic rules and calculation percentages for PF, ESIC, Professional Tax, Gratuity, and LWF applied to gross or basic bases.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddRuleForm(true)}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-[#3451d1] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                                >
                                    <Plus size={13} /> Add Statutory Rule
                                </button>
                            </div>

                            {/* Add statutory rule card box */}
                            <AnimatePresence>
                                {showAddRuleForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-slate-50 border border-slate-200/85 rounded-2xl p-5 space-y-5 relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Register New Global Salary Formula</h4>
                                            <button
                                                onClick={() => setShowAddRuleForm(false)}
                                                className="text-[10px] font-black text-slate-400 hover:text-slate-605 uppercase"
                                            >
                                                ✕ Close
                                            </button>
                                        </div>

                                        {/* Quick Templates Row */}
                                        <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl space-y-2.5">
                                            <span className="text-[9px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                                                ⚡ Pre-Fill Standard Templates
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { label: 'Provident Fund (PF)', name: 'Provident Fund (PF)', ee: 12.00, er: 12.00, base: 'base_salary' },
                                                    { label: 'ESIC Contribution', name: 'ESIC', ee: 0.75, er: 3.25, base: 'gross_salary' },
                                                    { label: 'Professional Tax (PT)', name: 'Professional Tax (PT)', ee: 200.00, er: 0.00, base: 'flat_amount' },
                                                    { label: 'Gratuity Contribution', name: 'Gratuity', ee: 0.00, er: 4.81, base: 'base_salary' },
                                                    { label: 'Labour Welfare Fund (LWF)', name: 'Labour Welfare Fund (LWF)', ee: 15.00, er: 45.00, base: 'flat_amount' }
                                                ].map(tmpl => (
                                                    <button
                                                        key={tmpl.label}
                                                        type="button"
                                                        onClick={() => setNewRuleData({
                                                            rule_name: tmpl.name,
                                                            employee_percentage: tmpl.ee,
                                                            employer_percentage: tmpl.er,
                                                            base_on: tmpl.base,
                                                            is_active: true
                                                        })}
                                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 hover:border-[#4361ee] hover:text-[#4361ee] transition-all hover:shadow-sm"
                                                    >
                                                        {tmpl.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white p-4 border border-slate-105 rounded-2xl shadow-sm">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Rule Name</label>
                                                <input
                                                    placeholder="e.g. Provident Fund (PF)"
                                                    value={newRuleData.rule_name}
                                                    onChange={(e) => setNewRuleData({ ...newRuleData, rule_name: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all font-black text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Base Pay Calculations</label>
                                                <select
                                                    value={newRuleData.base_on}
                                                    onChange={(e) => setNewRuleData({ ...newRuleData, base_on: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all text-slate-700"
                                                >
                                                    <option value="base_salary">Base Salary Basis</option>
                                                    <option value="gross_salary">Gross Salary Basis</option>
                                                    <option value="flat_amount">Flat Amount (Fixed Rupees)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Status</label>
                                                <select
                                                    value={newRuleData.is_active ? 'active' : 'inactive'}
                                                    onChange={(e) => setNewRuleData({ ...newRuleData, is_active: e.target.value === 'active' })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all text-slate-700"
                                                >
                                                    <option value="active">Active (Deploy instantly)</option>
                                                    <option value="inactive">Disabled</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                                    {newRuleData.base_on === 'flat_amount' ? 'Employee Share (Fixed ₹)' : 'Employee Share (%)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newRuleData.employee_percentage}
                                                    onChange={(e) => setNewRuleData({ ...newRuleData, employee_percentage: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all font-black text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                                    {newRuleData.base_on === 'flat_amount' ? 'Employer Share (Fixed ₹)' : 'Employer Share (%)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newRuleData.employer_percentage}
                                                    onChange={(e) => setNewRuleData({ ...newRuleData, employer_percentage: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all font-black text-slate-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2.5 justify-end">
                                            <button
                                                onClick={() => setShowAddRuleForm(false)}
                                                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleCreateGlobalRule}
                                                className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-all"
                                            >
                                                Register Formula
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Registered statutory list grid */}
                            {rulesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-[#4361ee] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {globalRules.map((rule) => (
                                        <div key={rule.id} className="bg-slate-50/40 border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:shadow-sm hover:border-slate-300 transition-all">
                                            {rule.is_active ? (
                                                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-bl-xl shadow-sm border-l border-b border-emerald-450">
                                                    ACTIVE
                                                </div>
                                            ) : (
                                                <div className="absolute top-0 right-0 bg-slate-400 text-white px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-bl-xl shadow-sm border-l border-b border-slate-300">
                                                    DISABLED
                                                </div>
                                            )}

                                            {editingRule?.id === rule.id ? (
                                                <div className="space-y-4 pt-1 bg-white p-3 border border-slate-200 rounded-2xl shadow-inner">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Rule Name</label>
                                                        <input
                                                            value={editingRule.rule_name}
                                                            onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Base Pay Calculations</label>
                                                            <select
                                                                value={editingRule.base_on}
                                                                onChange={(e) => setEditingRule({ ...editingRule, base_on: e.target.value })}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                                            >
                                                                <option value="base_salary">Base Salary Basis</option>
                                                                <option value="gross_salary">Gross Salary Basis</option>
                                                                <option value="flat_amount">Flat Amount (Fixed Rupees)</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                                                            <select
                                                                value={editingRule.is_active ? 'active' : 'inactive'}
                                                                onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.value === 'active' || e.target.value === '1' || e.target.value === true })}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                                            >
                                                                <option value="active">Active</option>
                                                                <option value="inactive">Disabled</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                                {editingRule.base_on === 'flat_amount' ? 'EE Share (Fixed ₹)' : 'EE Share (%)'}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={editingRule.employee_percentage}
                                                                onChange={(e) => setEditingRule({ ...editingRule, employee_percentage: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                                {editingRule.base_on === 'flat_amount' ? 'ER Share (Fixed ₹)' : 'ER Share (%)'}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={editingRule.employer_percentage}
                                                                onChange={(e) => setEditingRule({ ...editingRule, employer_percentage: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 justify-end pt-1">
                                                        <button onClick={() => setEditingRule(null)} className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider">Cancel</button>
                                                        <button onClick={() => handleUpdateGlobalRule(editingRule)} className="px-3.5 py-1 bg-[#4361ee] text-white rounded-lg text-xs font-black uppercase tracking-wider">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[#4361ee] shadow-sm">
                                                            <Calculator size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{rule.rule_name}</h4>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                                                Basis: {rule.base_on === 'flat_amount' ? 'Flat Amount (Fixed ₹)' : rule.base_on === 'base_salary' ? 'Base Salary Column' : 'Gross Salary (Allowances included)'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-inner">
                                                        <div>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">Employee Share</span>
                                                            <span className="text-base font-black text-slate-800">
                                                                {rule.base_on === 'flat_amount' ? `₹${rule.employee_percentage}` : `${rule.employee_percentage}%`}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">Employer Share</span>
                                                            <span className="text-base font-black text-slate-800">
                                                                {rule.base_on === 'flat_amount' ? `₹${rule.employer_percentage}` : `${rule.employer_percentage}%`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-1">
                                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setEditingRule(rule)}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                                                                title="Edit Formula"
                                                            >
                                                                <Edit3 size={13} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteGlobalRule(rule.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-lg transition-all"
                                                                title="Delete Rule"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUpdateGlobalRule({ ...rule, is_active: !rule.is_active })}
                                                            className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${rule.is_active
                                                                ? 'bg-slate-100 text-slate-500 border-slate-200/50 hover:bg-slate-200/50'
                                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                                }`}
                                                        >
                                                            {rule.is_active ? 'Disable' : 'Enable'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Right column: Formula Simulator Widget */}
                        {(() => {
                            const simBasicVal = parseFloat(simBasic) || 0;
                            const simAllowancesVal = parseFloat(simAllowances) || 0;
                            return (
                                <div className="lg:col-span-4 bg-white border border-slate-200/45 rounded-2xl p-5 shadow-sm space-y-5 relative overflow-hidden self-start">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
                                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                        <div className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                                            <Sliders size={15} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Formula Simulator</h4>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Test calculation impact in real-time</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-550 uppercase tracking-wider block">Mock Basic Salary (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    value={simBasic}
                                                    onChange={(e) => setSimBasic(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                                                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-700 font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-550 uppercase tracking-wider block">Mock Allowances (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    value={simAllowances}
                                                    onChange={(e) => setSimAllowances(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                                                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-700 font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50/40 border border-indigo-100/50 p-3.5 rounded-xl space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                                                <span>Gross Monthly Pay</span>
                                                <span>₹{(simBasicVal + simAllowancesVal).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-black text-indigo-900 uppercase">
                                                <span>Calculation Base</span>
                                                <span>Basic: ₹{simBasicVal.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3.5 pt-2 border-t border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Calculation Breakdown:</span>
                                            {globalRules.filter(r => r.is_active).length === 0 ? (
                                                <p className="text-[10px] text-slate-400 font-bold italic text-center py-2">No active statutory rules registered.</p>
                                            ) : (
                                                <div className="space-y-3.5">
                                                    {globalRules.filter(r => r.is_active).map(rule => {
                                                        const isFlat = rule.base_on === 'flat_amount';
                                                        const calcBase = rule.base_on === 'gross_salary' ? (simBasicVal + simAllowancesVal) : simBasicVal;
                                                        const eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) : (calcBase * (parseFloat(rule.employee_percentage) / 100));
                                                        const erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) : (calcBase * (parseFloat(rule.employer_percentage) / 100));
                                                        return (
                                                            <div key={rule.id} className="border-b border-slate-100 pb-2.5 last:border-b-0 last:pb-0 space-y-1.5">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{rule.rule_name}</h5>
                                                                        <span className="text-[8px] text-slate-400 font-bold uppercase block">{isFlat ? 'Flat rate deduction' : `${rule.employee_percentage}% on ${rule.base_on === 'gross_salary' ? 'Gross' : 'Basic'}`}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                                    <div>
                                                                        <span className="text-slate-400 font-bold block uppercase text-[7.5px]">EE share</span>
                                                                        <span className="font-black text-slate-700">₹{eeShare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-400 font-bold block uppercase text-[7.5px]">ER share</span>
                                                                        <span className="font-black text-slate-700">₹{erShare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                                                <span>Total EE Deductions</span>
                                                <span className="font-black text-rose-600">- ₹{
                                                    globalRules.filter(r => r.is_active).reduce((sum, rule) => {
                                                        const isFlat = rule.base_on === 'flat_amount';
                                                        const calcBase = rule.base_on === 'gross_salary' ? (simBasicVal + simAllowancesVal) : simBasicVal;
                                                        return sum + (isFlat ? (parseFloat(rule.employee_percentage) || 0) : (calcBase * (parseFloat(rule.employee_percentage) / 100)));
                                                    }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                }</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                                                <span>Total ER Contribution</span>
                                                <span className="font-black text-slate-700">+ ₹{
                                                    globalRules.filter(r => r.is_active).reduce((sum, rule) => {
                                                        const isFlat = rule.base_on === 'flat_amount';
                                                        const calcBase = rule.base_on === 'gross_salary' ? (simBasicVal + simAllowancesVal) : simBasicVal;
                                                        return sum + (isFlat ? (parseFloat(rule.employer_percentage) || 0) : (calcBase * (parseFloat(rule.employer_percentage) / 100)));
                                                    }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                }</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wide">Take-Home (Est.)</span>
                                                <span className="text-sm font-black text-emerald-700">₹{
                                                    Math.max(0, (simBasicVal + simAllowancesVal) - globalRules.filter(r => r.is_active).reduce((sum, rule) => {
                                                        const isFlat = rule.base_on === 'flat_amount';
                                                        const calcBase = rule.base_on === 'gross_salary' ? (simBasicVal + simAllowancesVal) : simBasicVal;
                                                        return sum + (isFlat ? (parseFloat(rule.employee_percentage) || 0) : (calcBase * (parseFloat(rule.employee_percentage) / 100)));
                                                    }, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                }</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}

                {/* -------------------- TAB 5: SHIFT & BUSINESS RULES -------------------- */}
                {false && (
                    <motion.div
                        key="shift-rules"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="bg-white border border-slate-200/40 rounded-2xl p-5 shadow-sm space-y-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#4361ee]" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Multi-Shift Management & Business Rules</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Configure individual work shifts, grace hours, and dynamic salary cut guidelines deployed company-wide.</p>
                            </div>
                            <button
                                onClick={() => setShowAddShift(true)}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#4361ee] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-indigo-100/50 flex items-center gap-1 w-max"
                            >
                                <Plus size={14} /> Add Shift
                            </button>
                        </div>

                        {/* Shift Selector Pill Row */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-wrap gap-2 items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-2 block">Active Shifts:</span>
                            {shifts.map(shift => (
                                <button
                                    key={shift.id}
                                    onClick={() => handleSelectShift(shift.id)}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 border ${selectedShiftId === shift.id
                                        ? 'bg-[#4361ee] text-white border-transparent shadow-lg shadow-indigo-100'
                                        : 'bg-white text-slate-600 border-slate-200/60 hover:border-slate-300'
                                        }`}
                                >
                                    <Clock size={12} />
                                    <span>{shift.name}</span>
                                    {shift.is_night_shift === 1 && <span className="text-[10px]">🌙</span>}
                                    {shift.id !== 1 && shift.id !== '1' && (
                                        <span
                                            onClick={(e) => handleDeleteShift(shift.id, e)}
                                            className={`ml-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${selectedShiftId === shift.id
                                                ? 'text-white/60 hover:text-white hover:bg-white/20'
                                                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                                }`}
                                            title="Delete Shift"
                                        >
                                            ✕
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {selectedShiftData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-slate-100 py-6">

                                {/* Work Shift Timing Controls */}
                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black text-[#4361ee] uppercase tracking-widest flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg w-max shadow-sm">
                                        <Clock size={12} /> Timings: {selectedShiftData.name}
                                    </h4>

                                    {/* Flexi / Anytime Shift Toggle Option */}
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="isFlexiEdit"
                                            checked={!!selectedShiftData.is_flexi}
                                            onChange={(e) => setSelectedShiftData({ ...selectedShiftData, is_flexi: e.target.checked })}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                        />
                                        <div>
                                            <label htmlFor="isFlexiEdit" className="text-[10px] font-black text-slate-700 uppercase tracking-wide block cursor-pointer">Flexi / Anytime Shift</label>
                                            <span className="text-[8px] text-slate-400 font-bold leading-none block">Skip late tracking. Calculate half-day based on minimum hours.</span>
                                        </div>
                                    </div>

                                    {selectedShiftData.is_flexi ? (
                                        <div className="space-y-1.5 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                                            <label className="text-[8px] font-black text-indigo-700 uppercase tracking-wider block">Minimum Required Hours / Day</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="1"
                                                max="24"
                                                value={selectedShiftData.min_hours !== undefined ? selectedShiftData.min_hours : 8.0}
                                                onChange={(e) => setSelectedShiftData({ ...selectedShiftData, min_hours: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Shift Start</label>
                                                    <input
                                                        type="time"
                                                        value={selectedShiftData.start_time || ''}
                                                        onChange={(e) => setSelectedShiftData({ ...selectedShiftData, start_time: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Shift End</label>
                                                    <input
                                                        type="time"
                                                        value={selectedShiftData.end_time || ''}
                                                        onChange={(e) => setSelectedShiftData({ ...selectedShiftData, end_time: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Grace Period (Mins)</label>
                                                    <input
                                                        type="number"
                                                        value={selectedShiftData.grace_period !== undefined ? selectedShiftData.grace_period : 15}
                                                        onChange={(e) => setSelectedShiftData({ ...selectedShiftData, grace_period: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Half Threshold (Hrs)</label>
                                                    <input
                                                        type="number"
                                                        value={businessRules.half_day_hours}
                                                        onChange={(e) => setBusinessRules({ ...businessRules, half_day_hours: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Night Shift Toggle Option */}
                                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                                                <input
                                                    type="checkbox"
                                                    id="isNightShift"
                                                    checked={!!selectedShiftData.is_night_shift}
                                                    onChange={(e) => setSelectedShiftData({ ...selectedShiftData, is_night_shift: e.target.checked })}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                                />
                                                <div>
                                                    <label htmlFor="isNightShift" className="text-[10px] font-black text-slate-700 uppercase tracking-wide block cursor-pointer">Overnight / Night Shift</label>
                                                    <span className="text-[8px] text-slate-400 font-bold leading-none block">Enable this toggle if the shift duration wraps past midnight (24:00).</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Global Penalty Deduction Rules */}
                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 bg-rose-50 border border-rose-100/50 px-2.5 py-1 rounded-lg w-max shadow-sm">
                                        <ShieldAlert size={12} /> Late Mark Penalties (Company-Wide)
                                    </h4>
                                    <div className="space-y-3">


                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Deduction Protocol</label>
                                            <select
                                                value={businessRules.late_deduction_type}
                                                onChange={(e) => setBusinessRules({ ...businessRules, late_deduction_type: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all"
                                            >
                                                <option value="none">No Penalty (Warnings & alerts only)</option>
                                                <option value="half_day">Half-Day Salary Cut / Excess Late Mark</option>
                                                <option value="full_day">Full-Day Salary Cut / Excess Late Mark</option>
                                                <option value="flat">Flat Amount / Excess Late Mark</option>
                                                <option value="percent_gross">Percentage of Gross Salary / Excess Late Mark</option>
                                                <option value="percent_basic">Percentage of Basic Salary / Excess Late Mark</option>
                                            </select>
                                        </div>

                                        {['flat', 'percent_gross', 'percent_basic'].includes(businessRules.late_deduction_type) && (
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                                    {businessRules.late_deduction_type === 'flat' ? 'Flat Penalty Amount (₹)' : 'Penalty Percentage (%)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step={businessRules.late_deduction_type === 'flat' ? '1' : '0.01'}
                                                    value={businessRules.late_deduction_value !== undefined ? businessRules.late_deduction_value : ''}
                                                    onChange={(e) => setBusinessRules({ ...businessRules, late_deduction_value: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all"
                                                    placeholder={businessRules.late_deduction_type === 'flat' ? 'e.g. 100' : 'e.g. 2.5'}
                                                />
                                                <span className="text-[7.5px] text-slate-400 block font-bold leading-normal">
                                                    {businessRules.late_deduction_type === 'flat'
                                                        ? 'Fixed rupee amount deducted per excess late mark.'
                                                        : businessRules.late_deduction_type === 'percent_gross'
                                                            ? 'Percentage of gross salary deducted per excess late mark.'
                                                            : 'Percentage of basic salary deducted per excess late mark.'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-xs font-bold">No shift selected.</div>
                        )}

                        <div className="flex justify-end pt-1">
                            <button
                                onClick={handleSaveBusinessRules}
                                disabled={savingRules}
                                className="px-6 py-3 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                <CheckCircle size={13} />
                                {savingRules ? 'Deploying Shift Policies...' : 'Deploy Shift Rules'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* --- ADD NEW SHIFT MODAL DIALOG --- */}
                {showAddShift && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#4361ee]" />

                            {/* Close button */}
                            <button
                                onClick={() => setShowAddShift(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                            >
                                ✕
                            </button>

                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Add Custom Work Shift</h3>
                                <p className="text-[10px] font-bold text-slate-400">Establish separate timings and parameters for specialized teams.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Shift Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Afternoon Rota"
                                        value={newShiftData.name}
                                        onChange={(e) => setNewShiftData({ ...newShiftData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                    />
                                </div>

                                {/* Flexi / Anytime Shift Toggle Option */}
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="newIsFlexi"
                                        checked={newShiftData.is_flexi}
                                        onChange={(e) => setNewShiftData({ ...newShiftData, is_flexi: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                    />
                                    <div>
                                        <label htmlFor="newIsFlexi" className="text-[10px] font-black text-slate-700 uppercase tracking-wide block cursor-pointer">Flexi / Anytime Shift</label>
                                        <span className="text-[8px] text-slate-400 font-bold leading-none block">Skip late tracking. Calculate half-day based on minimum hours.</span>
                                    </div>
                                </div>

                                {newShiftData.is_flexi ? (
                                    <div className="space-y-1.5 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                                        <label className="text-[8px] font-black text-indigo-700 uppercase tracking-wider block">Minimum Required Hours / Day</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="1"
                                            max="24"
                                            value={newShiftData.min_hours}
                                            onChange={(e) => setNewShiftData({ ...newShiftData, min_hours: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Shift Start *</label>
                                                <input
                                                    type="time"
                                                    value={newShiftData.start_time}
                                                    onChange={(e) => setNewShiftData({ ...newShiftData, start_time: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Shift End *</label>
                                                <input
                                                    type="time"
                                                    value={newShiftData.end_time}
                                                    onChange={(e) => setNewShiftData({ ...newShiftData, end_time: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Grace Period (Mins)</label>
                                                <input
                                                    type="number"
                                                    value={newShiftData.grace_period}
                                                    onChange={(e) => setNewShiftData({ ...newShiftData, grace_period: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Max Late Allowed / Month</label>
                                                <input
                                                    type="number"
                                                    value={newShiftData.grace_count_limit}
                                                    onChange={(e) => setNewShiftData({ ...newShiftData, grace_count_limit: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/50 p-3 rounded-xl mt-2">
                                            <input
                                                type="checkbox"
                                                id="newIsNightShift"
                                                checked={newShiftData.is_night_shift}
                                                onChange={(e) => setNewShiftData({ ...newShiftData, is_night_shift: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                            />
                                            <div>
                                                <label htmlFor="newIsNightShift" className="text-[10px] font-black text-slate-700 uppercase tracking-wide block cursor-pointer">Overnight / Night Shift</label>
                                                <span className="text-[8px] text-slate-400 font-bold leading-none block">Enable if shift times cross midnight.</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end border-t border-slate-50 pt-4 mt-2">
                                <button
                                    onClick={() => setShowAddShift(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateShift}
                                    className="px-6 py-2 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Add Shift
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* -------------------- TAB 6: LOANS & ADVANCES -------------------- */}
                {selectedTab === 'loans' && (
                    <motion.div
                        key="loans"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                    >
                        {/* Summary Stat Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Disbursed</span>
                                    <span className="text-xl font-black text-[#4361ee] mt-1 block">
                                        ₹{filteredLoans.reduce((acc, l) => acc + (l.status !== 'rejected' ? parseFloat(l.amount) : 0), 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Landmark size={20} />
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Outstanding Balance</span>
                                    <span className="text-xl font-black text-amber-600 mt-1 block">
                                        ₹{filteredLoans.reduce((acc, l) => acc + (l.status === 'active' ? parseFloat(l.remaining_balance) : 0), 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                    <TrendingUp size={20} />
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Advances</span>
                                    <span className="text-xl font-black text-emerald-600 mt-1 block">
                                        {filteredLoans.filter(l => l.status === 'active').length} Active
                                    </span>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <CheckCircle size={20} />
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pending Approvals</span>
                                    <span className="text-xl font-black text-rose-500 mt-1 block">
                                        {filteredLoans.filter(l => l.status === 'pending').length} Requests
                                    </span>
                                </div>
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                                    <ShieldAlert size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Sub-navigation for Loans */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveLoanSubTab('ledger')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeLoanSubTab === 'ledger'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Active Ledger
                                </button>
                                <button
                                    onClick={() => setActiveLoanSubTab('repayments')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeLoanSubTab === 'repayments'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Repayment Logs
                                </button>
                            </div>
                            <button
                                onClick={handleExportLoansCSV}
                                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-sm mb-1"
                            >
                                <Download size={13} /> Export Loans
                            </button>
                        </div>

                        {activeLoanSubTab === 'ledger' && (
                            <>
                                {/* Top action row */}
                                <div className="flex justify-between items-center bg-white border border-slate-200/40 p-4 rounded-2xl shadow-sm">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Amortized Advances & Loan Ledger</h3>
                                        <p className="text-slate-400 text-xs mt-0.5">Approve employee advance requests, track repayment timelines, and audit active balances.</p>
                                    </div>
                                    <button
                                        disabled={controls.inputs_locked}
                                        onClick={() => {
                                            setModalOutlet(selectedOutlet);
                                            setModalDept(selectedDept);
                                            setModalDesignation(selectedDesignation);
                                            setShowAddLoan(true);
                                        }}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5 ${controls.inputs_locked
                                            ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                            : 'bg-[#4361ee] hover:bg-indigo-700 text-white shadow-indigo-500/10'
                                            }`}
                                    >
                                        <Plus size={14} /> Register Advance
                                    </button>
                                </div>

                                {/* Loans Table */}
                                <div className="bg-white border border-slate-200/40 rounded-2xl shadow-sm overflow-hidden">
                                    {loansLoading ? (
                                        <div className="p-12 flex flex-col items-center justify-center gap-3">
                                            <RefreshCw size={24} className="animate-spin text-slate-400" />
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Loans Ledger...</span>
                                        </div>
                                    ) : loans.length === 0 ? (
                                        <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                                                <Landmark size={28} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">No loans or advances recorded</h4>
                                                <p className="text-slate-400 text-[10px] font-bold mt-1">Disburse advances or interest-free loans to see automated monthly EMI reductions.</p>
                                            </div>
                                        </div>
                                    ) : searchedLoans.length === 0 ? (
                                        <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                                                <Landmark size={28} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">No matching loans or advances found</h4>
                                                <p className="text-slate-400 text-[10px] font-bold mt-1">Try adjusting your search terms or filters.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50/75 border-b border-slate-100">
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Title / Purpose</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Loan Date</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Loan Amount</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Repayment EMI</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Outstanding</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Progress</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {searchedLoans.map((loan) => {
                                                        const principal = parseFloat(loan.amount) || 1;
                                                        const remaining = parseFloat(loan.remaining_balance) || 0;
                                                        const pctPaid = Math.min(100, Math.max(0, ((principal - remaining) / principal) * 100));

                                                        return (
                                                            <tr key={loan.id} className="hover:bg-slate-50/50 transition-all">
                                                                <td className="px-5 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                                            {loan.first_name} {loan.last_name}
                                                                        </span>
                                                                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                                                            {loan.employee_id_number}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className="text-xs font-bold text-slate-700">{loan.title}</span>
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                                                                    {loan.loan_date ? new Date(loan.loan_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(loan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-black text-slate-850">
                                                                    ₹{Number(loan.amount).toLocaleString()}
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-black text-rose-600">
                                                                    ₹{Number(loan.monthly_emi).toLocaleString()}/mo
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-black text-amber-600">
                                                                    ₹{Number(loan.remaining_balance).toLocaleString()}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <div className="flex flex-col gap-1 w-28">
                                                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                            <div
                                                                                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                                                                                style={{ width: `${pctPaid}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[8px] font-bold text-slate-400">{pctPaid.toFixed(0)}% Repaid</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${loan.status === 'active'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                        : loan.status === 'pending'
                                                                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                                            : loan.status === 'completed'
                                                                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                                                : 'bg-rose-50 text-rose-500 border-rose-100'
                                                                        }`}>
                                                                        {loan.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {loan.status === 'pending' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handleUpdateLoanStatus(loan.id, 'active')}
                                                                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100 transition-all active:scale-95"
                                                                                >
                                                                                    Approve
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleUpdateLoanStatus(loan.id, 'rejected')}
                                                                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-100 transition-all active:scale-95"
                                                                                >
                                                                                    Reject
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {loan.status === 'active' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedLoanForRepay(loan);
                                                                                    setRepayData({
                                                                                        amount_paid: '',
                                                                                        payment_date: new Date().toISOString().split('T')[0],
                                                                                        notes: ''
                                                                                    });
                                                                                    setShowRepayModal(true);
                                                                                }}
                                                                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100 transition-all active:scale-95 flex items-center gap-1"
                                                                            >
                                                                                <CheckCircle size={10} /> Repay
                                                                            </button>
                                                                        )}
                                                                        {!controls.inputs_locked && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditingLoanId(loan.id);
                                                                                        setNewLoanData({
                                                                                            employee_id: loan.employee_id,
                                                                                            title: loan.title,
                                                                                            amount: String(loan.amount),
                                                                                            monthly_emi: String(loan.monthly_emi),
                                                                                            status: loan.status,
                                                                                            loan_date: loan.loan_date ? loan.loan_date.split('T')[0] : new Date(loan.created_at).toISOString().split('T')[0]
                                                                                        });
                                                                                        setShowAddLoan(true);
                                                                                    }}
                                                                                    className="p-1.5 text-slate-400 hover:text-[#4361ee] hover:bg-slate-100 rounded-lg transition-all flex items-center justify-center active:scale-95"
                                                                                    title="Edit Advance"
                                                                                >
                                                                                    <Edit2 size={14} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteLoan(loan.id)}
                                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center justify-center active:scale-95"
                                                                                    title="Delete Advance"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        <a
                                                                            href={`${api.defaults.baseURL}/payroll/loans/download-slip/${loan.id}?token=${localStorage.getItem('auth_token') || 'test.admin.token'}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="p-1.5 text-slate-400 hover:text-[#4361ee] hover:bg-slate-100 rounded-lg transition-all flex items-center justify-center active:scale-95"
                                                                            title="Download Advance Slip PDF"
                                                                        >
                                                                            <Download size={14} />
                                                                        </a>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeLoanSubTab === 'repayments' && (
                            <div className="bg-white border border-slate-200/40 rounded-2xl shadow-sm overflow-hidden">
                                {repaymentsLoading ? (
                                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                                        <RefreshCw size={24} className="animate-spin text-slate-400" />
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Repayment Logs...</span>
                                    </div>
                                ) : repayments.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                                            <TrendingUp size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">No repayment transactions recorded</h4>
                                            <p className="text-slate-400 text-[10px] font-bold mt-1">Repayments will appear here automatically when payroll is paid or settled manually.</p>
                                        </div>
                                    </div>
                                ) : searchedRepayments.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                                            <TrendingUp size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">No matching repayment logs found</h4>
                                            <p className="text-slate-400 text-[10px] font-bold mt-1">Try adjusting your search terms or filters.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/75 border-b border-slate-100">
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Loan Title</th>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Repayment Date & Time</th>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Settled</th>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {searchedRepayments.map((repay) => (
                                                    <tr key={repay.id} className="hover:bg-slate-50/50 transition-all">
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                                    {repay.first_name} {repay.last_name}
                                                                </span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                                                    {repay.employee_id_number}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-bold text-slate-700">{repay.loan_title}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-xs text-slate-600 font-bold">
                                                            {new Date(repay.payment_date).toLocaleString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </td>
                                                        <td className="px-5 py-4 text-xs font-black text-emerald-600">
                                                            ₹{Number(repay.amount_paid).toLocaleString()}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${repay.payment_method === 'payroll'
                                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                }`}>
                                                                {repay.payment_method}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-xs text-slate-500 font-bold">
                                                            {repay.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Issuance Form Modal */}
                        {/* Issuance Form Modal */}
                        {showAddLoan && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-[#4361ee]" />

                                    <button
                                        onClick={() => {
                                            setShowAddLoan(false);
                                            setEditingLoanId(null);
                                            setModalOutlet('All');
                                            setModalDept('All');
                                            setModalDesignation('All');
                                            setNewLoanData({
                                                employee_id: '',
                                                title: 'Salary Advance',
                                                amount: '',
                                                monthly_emi: '',
                                                status: 'active',
                                                loan_date: new Date().toISOString().split('T')[0]
                                            });
                                        }}
                                        className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                                    >
                                        ✕
                                    </button>

                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                            {editingLoanId ? 'Modify Salary Advance' : 'Issue Salary Advance'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {editingLoanId ? 'Update details of this active advance or interest-free loan.' : 'Record a new interest-free loan or advance to deduct auto-EMIs during monthly payrolls.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Modal Filters for Employee List */}
                                        {!editingLoanId && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Outlet</label>
                                                    <select
                                                        value={modalOutlet}
                                                        onChange={(e) => setModalOutlet(e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    >
                                                        {uniqueOutlets.map(o => (
                                                            <option key={o} value={o}>{o === 'All' ? 'All Outlets' : o}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Department</label>
                                                    <select
                                                        value={modalDept}
                                                        onChange={(e) => setModalDept(e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    >
                                                        {uniqueDepartments.map(d => (
                                                            <option key={d} value={d}>{d === 'All' ? 'All Depts' : d}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Designation</label>
                                                    <select
                                                        value={modalDesignation}
                                                        onChange={(e) => setModalDesignation(e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    >
                                                        {uniqueDesignations.map(d => (
                                                            <option key={d} value={d}>{d === 'All' ? 'All Desgs' : d}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Select Employee *</label>
                                            <select
                                                value={newLoanData.employee_id}
                                                disabled={!!editingLoanId}
                                                onChange={(e) => setNewLoanData({ ...newLoanData, employee_id: e.target.value })}
                                                className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none transition-all ${
                                                    editingLoanId ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee]'
                                                }`}
                                            >
                                                <option value="">-- Choose Employee --</option>
                                                {modalFilteredEmployees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id_number})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Advance Title / Description *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Festival Advance, Medical Loan"
                                                value={newLoanData.title}
                                                onChange={(e) => setNewLoanData({ ...newLoanData, title: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Loan Principal Amount (₹) *</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 15000"
                                                    value={newLoanData.amount}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setNewLoanData({ ...newLoanData, amount: val });
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Monthly EMI Cut (₹) *</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 3000"
                                                    value={newLoanData.monthly_emi}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setNewLoanData({ ...newLoanData, monthly_emi: val });
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Loan / Disbursal Date *</label>
                                            <input
                                                type="date"
                                                value={newLoanData.loan_date || ''}
                                                onChange={(e) => setNewLoanData({ ...newLoanData, loan_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end border-t border-slate-50 pt-4 mt-2">
                                        <button
                                            onClick={() => {
                                                setShowAddLoan(false);
                                                setEditingLoanId(null);
                                                setModalOutlet('All');
                                                setModalDept('All');
                                                setModalDesignation('All');
                                                setNewLoanData({
                                                    employee_id: '',
                                                    title: 'Salary Advance',
                                                    amount: '',
                                                    monthly_emi: '',
                                                    status: 'active',
                                                    loan_date: new Date().toISOString().split('T')[0]
                                                });
                                            }}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={controls.inputs_locked}
                                            onClick={editingLoanId ? handleUpdateLoan : handleCreateLoan}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${controls.inputs_locked
                                                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                : 'bg-[#4361ee] hover:bg-indigo-700 text-white'
                                                }`}
                                        >
                                            {editingLoanId ? 'Update Loan' : 'Disburse Loan'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manual Repayment Settlement Modal */}
                        {showRepayModal && selectedLoanForRepay && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />

                                    <button
                                        onClick={() => setShowRepayModal(false)}
                                        className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                                    >
                                        ✕
                                    </button>

                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Record Loan Repayment</h3>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            Settle a portion or the full outstanding balance of the advance manually for {selectedLoanForRepay.first_name} {selectedLoanForRepay.last_name}.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-3 flex justify-between items-center">
                                            <div>
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block">Remaining Balance</span>
                                                <span className="text-sm font-black text-slate-800">₹{parseFloat(selectedLoanForRepay.remaining_balance).toLocaleString()}</span>
                                            </div>
                                            <button
                                                onClick={() => setRepayData({ ...repayData, amount_paid: selectedLoanForRepay.remaining_balance })}
                                                className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Settle Full
                                            </button>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Repayment Amount (₹) *</label>
                                            <input
                                                type="text"
                                                placeholder="Enter amount paid"
                                                value={repayData.amount_paid}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    setRepayData({ ...repayData, amount_paid: val });
                                                }}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Payment Date & Time *</label>
                                            <input
                                                type="date"
                                                value={repayData.payment_date}
                                                onChange={(e) => setRepayData({ ...repayData, payment_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Payment Notes / Reference</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Cash payment, bank transfer ref"
                                                value={repayData.notes}
                                                onChange={(e) => setRepayData({ ...repayData, notes: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end border-t border-slate-50 pt-4 mt-2">
                                        <button
                                            onClick={() => setShowRepayModal(false)}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleManualRepaySubmit}
                                            disabled={repaySubmitting}
                                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                                        >
                                            {repaySubmitting && <RefreshCw size={12} className="animate-spin" />}
                                            Record Repayment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* -------------------- TAB 7: EMPLOYEE SEPARATIONS & FNF -------------------- */}
                {selectedTab === 'separations' && (
                    <motion.div
                        key="separations"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                    >
                        {/* Summary Stat Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Notice Period</span>
                                    <span className="text-xl font-black text-rose-500 mt-1 block">
                                        {filteredSeparations.filter(s => s.settlement_status !== 'settled').length} Employees
                                    </span>
                                </div>
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                                    <UserMinus size={20} />
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Settled Exits (FNF)</span>
                                    <span className="text-xl font-black text-emerald-600 mt-1 block">
                                        {filteredSeparations.filter(s => s.settlement_status === 'settled').length} Settled
                                    </span>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <CheckCircle size={20} />
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Net Settlements Outflow</span>
                                    <span className="text-xl font-black text-[#4361ee] mt-1 block">
                                        ₹{filteredSeparations.filter(s => s.settlement_status === 'settled').reduce((sum, s) => sum + parseFloat(s.fnf_net_payable || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Landmark size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Sub-navigation & Actions Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveSeparationTab('active')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeSeparationTab === 'active'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Active Notices & Pending
                                </button>
                                <button
                                    onClick={() => setActiveSeparationTab('history')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeSeparationTab === 'history'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Settlement History
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setWizardMode('initiate');
                                    setWizardStep(1);
                                    setWizardData({
                                        employee_id: '',
                                        employee_number: '',
                                        name: '',
                                        department: '',
                                        designation: '',
                                        location: '',
                                        joining_date: '',
                                        resignation_date: new Date().toISOString().split('T')[0],
                                        last_working_day: new Date().toISOString().split('T')[0],
                                        separation_type: 'resignation',
                                        reason: '',
                                        last_salary_paid: '',
                                        notice_period_days: '60',
                                        notice_adjustable_days: '0',
                                        pl_days_payable: '0',
                                        days_salary_payable: '0',
                                        total_days_in_month: '30',
                                        lop_days: '0',
                                        effective_workdays: '0',
                                        checked_by: '',
                                        authorized_by: '',
                                        notice_recovery_amount: 0,
                                        leave_encashment_amount: 0,
                                        gratuity_amount: 0,
                                        unpaid_salary_amount: 0,
                                        other_allowances: '0',
                                        other_deductions: '0',
                                        fnf_net_payable: 0,
                                        notes: '',
                                        payment_method: 'bank_transfer',
                                        total_available_leaves: 0,
                                        total_outstanding_loan: 0,
                                        outstanding_loans: [],
                                        base_salary: 0
                                    });
                                    setShowWizardModal(true);
                                }}
                                className="px-5 py-2.5 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 self-start shadow-sm"
                            >
                                <UserMinus size={13} />
                                Initiate Exit Process
                            </button>
                            <button
                                onClick={handleExportSeparationsCSV}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 self-start shadow-sm"
                            >
                                <Download size={13} />
                                Export Exits
                            </button>
                        </div>

                        {/* Main list tables */}
                        <div className="bg-white border border-slate-200/40 rounded-2xl shadow-sm overflow-hidden">
                            {separationsLoading ? (
                                <div className="p-16 text-center">
                                    <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto" />
                                    <p className="text-xs text-slate-400 font-bold mt-2">Loading separations records...</p>
                                </div>
                            ) : (
                                <>
                                    {activeSeparationTab === 'active' ? (
                                        <div className="overflow-x-auto">
                                            {filteredSeparations.filter(s => s.settlement_status !== 'settled').length === 0 ? (
                                                <div className="p-16 text-center text-xs text-slate-400 font-bold">
                                                    No active notice period or pending separations.
                                                </div>
                                            ) : (
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/75 border-b border-slate-100">
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Resignation Date</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Last Working Day</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Notice Period</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {filteredSeparations.filter(s => s.settlement_status !== 'settled').map((s) => (
                                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                                                                <td className="px-5 py-4">
                                                                    <div>
                                                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight block leading-tight">{s.first_name} {s.last_name}</span>
                                                                        <span className="text-[9px] text-slate-400 font-bold block">{s.employee_id_number} • {s.designation}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${s.separation_type === 'resignation' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                        s.separation_type === 'termination' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                            s.separation_type === 'retirement' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                'bg-slate-50 text-slate-600 border-slate-100'
                                                                        }`}>
                                                                        {s.separation_type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-bold text-slate-600">
                                                                    {s.resignation_date ? new Date(s.resignation_date).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-bold text-slate-600">
                                                                    {s.last_working_day ? new Date(s.last_working_day).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <div>
                                                                        <span className="text-xs font-black text-slate-700 block">{s.notice_period_days} Days Required</span>
                                                                        <span className="text-[9px] text-slate-400 font-bold block">{s.notice_served_days} Days Served</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${s.settlement_status === 'calculated'
                                                                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                        }`}>
                                                                        {s.settlement_status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <button
                                                                            onClick={() => fetchFnfCalculation(s)}
                                                                            className="px-3 py-1.5 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                                        >
                                                                            Settle FNF
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSeparation(s.id)}
                                                                            className="p-1.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                            title="Cancel exit"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            {filteredSeparations.filter(s => s.settlement_status === 'settled').length === 0 ? (
                                                <div className="p-16 text-center text-xs text-slate-400 font-bold">
                                                    No historic exit settlements found.
                                                </div>
                                            ) : (
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/75 border-b border-slate-100">
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Exit Date</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Settled Date</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Net Payout</th>
                                                            <th className="px-5 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {filteredSeparations.filter(s => s.settlement_status === 'settled').map((s) => (
                                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                                                                <td className="px-5 py-4">
                                                                    <div>
                                                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight block leading-tight">{s.first_name} {s.last_name}</span>
                                                                        <span className="text-[9px] text-slate-400 font-bold block">{s.employee_id_number} • {s.designation}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${s.separation_type === 'resignation' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                        s.separation_type === 'termination' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                            s.separation_type === 'retirement' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                'bg-slate-50 text-slate-600 border-slate-100'
                                                                        }`}>
                                                                        {s.separation_type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-bold text-slate-600">
                                                                    {s.last_working_day ? new Date(s.last_working_day).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-bold text-slate-600">
                                                                    {s.settlement_date ? new Date(s.settlement_date).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                                                                        {s.payment_method?.replace('_', ' ') || 'manual'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-xs font-black text-slate-900">
                                                                    ₹{Number(s.fnf_net_payable).toLocaleString()}
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <button
                                                                        onClick={() => handleViewSettledFnf(s)}
                                                                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all"
                                                                    >
                                                                        View FNF Sheet
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- CENTRAL GLASSMORPHIC CALCULATIONS DETAIL DRAWER --- */}
            <AnimatePresence>
                {selectedBreakdown && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.97, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.97, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />

                            {/* Close button */}
                            <button
                                onClick={() => setSelectedBreakdown(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                            >
                                ✕
                            </button>

                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Salary Breakdown</h3>
                                <p className="text-[10px] font-bold text-slate-400">Statement breakdown for {selectedMonth}</p>
                            </div>

                            {/* Employee Identity Header */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">{selectedBreakdown.first_name} {selectedBreakdown.last_name}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">{selectedBreakdown.designation} • Tech Department</p>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-slate-200/50 border border-slate-200 px-2 py-0.5 rounded">
                                    {selectedBreakdown.employee_id_number}
                                </span>
                            </div>

                            {/* Earnings vs Deductions grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Earnings Column */}
                                <div className="flex flex-col gap-2">
                                    <h5 className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Check size={11} /> Earnings (+)</h5>
                                    <div className="bg-emerald-50/20 border border-emerald-100 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                                        <div className="flex justify-between text-xs font-bold text-slate-700">
                                            <span>Base Pay</span>
                                            <span>₹{Number(selectedBreakdown.base_salary).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-700">
                                            <span>Allowances</span>
                                            <span>+₹{Number(selectedBreakdown.total_allowances).toLocaleString()}</span>
                                        </div>
                                        <div className="border-t border-emerald-100/60 my-1"></div>
                                        <div className="flex justify-between text-xs font-black text-emerald-700">
                                            <span>Gross Total</span>
                                            <span>₹{(Number(selectedBreakdown.base_salary) + Number(selectedBreakdown.total_allowances)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cuts Column */}
                                <div className="flex flex-col gap-2">
                                    <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1"><Minus size={11} /> Deductions (-)</h5>
                                    <div className="bg-rose-50/15 border border-rose-105 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                                        {selectedBreakdown.total_deductions > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-slate-750">
                                                <span>Other Cuts</span>
                                                <span>-₹{Number(selectedBreakdown.total_deductions).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedBreakdown.unpaid_leave_deduction > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-rose-600">
                                                <span>Leaves Cut</span>
                                                <span>-₹{Number(selectedBreakdown.unpaid_leave_deduction).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedBreakdown.late_mark_deduction > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-orange-600">
                                                <span>Lates Cut</span>
                                                <span>-₹{Number(selectedBreakdown.late_mark_deduction).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedBreakdown.employee_pf > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-[#4361ee]">
                                                <span>EPF (12% Base)</span>
                                                <span>-₹{Number(selectedBreakdown.employee_pf).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedBreakdown.employee_esic > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-[#4361ee]">
                                                <span>ESIC Share</span>
                                                <span>-₹{Number(selectedBreakdown.employee_esic).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedBreakdown.manual_deduction_override > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-rose-600">
                                                <span>Manual Cuts</span>
                                                <span>-₹{Number(selectedBreakdown.manual_deduction_override).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedBreakdown.loan_emi_deduction > 0 && (
                                            <div className="flex justify-between text-xs font-bold text-amber-600">
                                                <span>Loan EMI Cut</span>
                                                <span>-₹{Number(selectedBreakdown.loan_emi_deduction).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-rose-100/60 my-1"></div>
                                        <div className="flex justify-between text-xs font-black text-rose-700">
                                            <span>Total Cuts</span>
                                            <span>-₹{(
                                                Number(selectedBreakdown.total_deductions || 0) +
                                                Number(selectedBreakdown.unpaid_leave_deduction || 0) +
                                                Number(selectedBreakdown.late_mark_deduction || 0) +
                                                Number(selectedBreakdown.employee_pf || 0) +
                                                Number(selectedBreakdown.employee_esic || 0) +
                                                Number(selectedBreakdown.manual_deduction_override || 0) +
                                                Number(selectedBreakdown.loan_emi_deduction || 0)
                                            ).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Payout Summary */}
                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <h5 className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Net Take Home Pay</h5>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">Calculated based on attendance & rules</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-[#4361ee]">₹{Number(selectedBreakdown.net_salary).toLocaleString()}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Pay Salary Export Modal */}
            {showPaySalaryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />

                        <button
                            onClick={() => setShowPaySalaryModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                        >
                            ✕
                        </button>

                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Pay Salary Export</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                                Select payment modes to filter employees and download the payroll sheet for {selectedMonth}.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 py-2">
                            {/* ALL option */}
                            <label className="flex items-center gap-3 cursor-pointer bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-3 hover:border-indigo-400 transition-all select-none">
                                <input
                                    type="checkbox"
                                    checked={paySalaryFilters.bank && paySalaryFilters.cheque && paySalaryFilters.cash}
                                    ref={(el) => {
                                        if (el) {
                                            const anyChecked = paySalaryFilters.bank || paySalaryFilters.cheque || paySalaryFilters.cash;
                                            const allChecked = paySalaryFilters.bank && paySalaryFilters.cheque && paySalaryFilters.cash;
                                            el.indeterminate = anyChecked && !allChecked;
                                        }
                                    }}
                                    onChange={(e) => setPaySalaryFilters({ bank: e.target.checked, cheque: e.target.checked, cash: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wide">All</span>
                                    <span className="text-[9px] text-indigo-400 font-semibold">Include all employees regardless of payment mode</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 hover:border-indigo-500/30 transition-all select-none">
                                <input
                                    type="checkbox"
                                    checked={paySalaryFilters.bank}
                                    onChange={(e) => setPaySalaryFilters({ ...paySalaryFilters, bank: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Bank Transfer</span>
                                    <span className="text-[9px] text-slate-400 font-semibold">Include employees paid directly to bank accounts</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 hover:border-indigo-500/30 transition-all select-none">
                                <input
                                    type="checkbox"
                                    checked={paySalaryFilters.cheque}
                                    onChange={(e) => setPaySalaryFilters({ ...paySalaryFilters, cheque: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Cheque</span>
                                    <span className="text-[9px] text-slate-400 font-semibold">Include employees paid by company cheques</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 hover:border-indigo-500/30 transition-all select-none">
                                <input
                                    type="checkbox"
                                    checked={paySalaryFilters.cash}
                                    onChange={(e) => setPaySalaryFilters({ ...paySalaryFilters, cash: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Cash</span>
                                    <span className="text-[9px] text-slate-400 font-semibold">Include employees paid in physical currency</span>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-2 justify-end border-t border-slate-50 pt-4 mt-2">
                            <button
                                onClick={() => setShowPaySalaryModal(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExportPaySalaryCSV}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                                <Download size={12} /> Download CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Process Payroll Confirmation Modal */}
            {showProcessConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#4361ee]" />

                        <button
                            onClick={() => setShowProcessConfirmation(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                        >
                            ✕
                        </button>

                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Confirm Loan EMI Deductions</h3>
                            <p className="text-[10px] font-bold text-slate-400">
                                The following active advances are scheduled for monthly EMI deduction during the {selectedMonth} payroll process. Uncheck any you wish to skip.
                            </p>
                        </div>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                            {previewDeductions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400 font-bold">
                                    No active advances or loan deductions scheduled for this month.
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/75 border-b border-slate-100">
                                            <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">
                                                <div className="flex flex-col items-center gap-0.5 justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={previewDeductions.length > 0 && approvedLoanIds.length === previewDeductions.length}
                                                        ref={(el) => {
                                                            if (el) {
                                                                el.indeterminate = approvedLoanIds.length > 0 && approvedLoanIds.length < previewDeductions.length;
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setApprovedLoanIds(previewDeductions.map(d => d.id));
                                                            } else {
                                                                setApprovedLoanIds([]);
                                                            }
                                                        }}
                                                        className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <span className="text-[7px] text-slate-400 font-black mt-0.5">ALL</span>
                                                </div>
                                            </th>
                                            <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                            <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Advance Title</th>
                                            <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">EMI Amount</th>
                                            <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Remaining Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previewDeductions.map((d) => {
                                            const isChecked = approvedLoanIds.includes(d.id);
                                            return (
                                                <tr key={d.id} className="hover:bg-slate-50/50 transition-all">
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setApprovedLoanIds([...approvedLoanIds, d.id]);
                                                                } else {
                                                                    setApprovedLoanIds(approvedLoanIds.filter(id => id !== d.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{d.employee_name}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-bold text-slate-600">{d.title}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <span className="text-[10px] font-black text-rose-600">₹</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={d.remaining_balance}
                                                                value={loanAmountOverrides[d.id] !== undefined ? loanAmountOverrides[d.id] : d.planned_emi}
                                                                disabled={!isChecked}
                                                                onChange={(e) => {
                                                                    const val = e.target.value === '' ? '' : Math.min(parseFloat(e.target.value) || 0, d.remaining_balance);
                                                                    setLoanAmountOverrides({
                                                                        ...loanAmountOverrides,
                                                                        [d.id]: val
                                                                    });
                                                                }}
                                                                className="w-20 px-2 py-0.5 text-right text-xs font-black text-rose-600 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-400 focus:bg-white disabled:opacity-50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-black text-amber-600">
                                                        ₹{Number(d.remaining_balance).toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end border-t border-slate-50 pt-4 mt-2">
                            <button
                                onClick={() => setShowProcessConfirmation(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmProcessPayroll}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                            >
                                {isProcessing && <RefreshCw size={12} className="animate-spin" />}
                                Confirm & Process
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- MULTI-STEP EXIT & FNF WIZARD MODAL --- */}
            {showWizardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden max-h-[95vh] overflow-y-auto">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

                        <button
                            onClick={() => setShowWizardModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                        >
                            ✕
                        </button>

                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                {wizardMode === 'initiate' ? 'Exit Initiation & FNF Wizard' : 'Full & Final (FNF) Settlement Wizard'}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400">
                                {wizardMode === 'initiate'
                                    ? 'Follow the 6-step progress stepper to select an employee and input their resignation details.'
                                    : 'Review and override statutory calculations for deactivating employee and completing FNF settlement.'
                                }
                            </p>
                        </div>

                        {fnfCalculating ? (
                            <div className="py-20 text-center">
                                <RefreshCw size={32} className="animate-spin text-[#4361ee] mx-auto" />
                                <p className="text-xs text-slate-400 font-bold mt-3">Performing FNF math and database queries...</p>
                            </div>
                        ) : (
                            <>
                                {/* Stepper */}
                                <div className="flex items-center justify-between w-full mb-6 relative">
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                                    <div
                                        className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-300"
                                        style={{ width: `${((wizardStep - 1) / 5) * 100}%` }}
                                    />
                                    {[
                                        { number: 1, name: 'EMPLOYEE' },
                                        { number: 2, name: 'RESIGNATION DETAILS' },
                                        { number: 3, name: 'NOTICE PAY' },
                                        { number: 4, name: 'WORK DAYS' },
                                        { number: 5, name: 'LEAVE ENCASHMENT' },
                                        { number: 6, name: 'REMARKS' }
                                    ].map((step) => {
                                        const isActive = wizardStep === step.number;
                                        const isCompleted = wizardStep > step.number;
                                        return (
                                            <div key={step.number} className="flex flex-col items-center z-10">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border-2 ${isCompleted
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : isActive
                                                            ? 'bg-white border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/10'
                                                            : 'bg-white border-slate-200 text-slate-400'
                                                        }`}
                                                >
                                                    {isCompleted ? <Check size={14} /> : step.number}
                                                </div>
                                                <span
                                                    className={`text-[8px] font-black tracking-wider mt-1.5 uppercase transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'
                                                        }`}
                                                >
                                                    {step.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Step Content */}
                                <div className="py-2">
                                    {wizardStep === 1 && (
                                        <div className="space-y-4">
                                            {wizardMode === 'initiate' ? (
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Select Employee *</label>
                                                    <select
                                                        value={wizardData.employee_id}
                                                        onChange={(e) => {
                                                            handleWizardDataChange('employee_id', e.target.value);
                                                            handleWizardEmployeeSelect(e.target.value);
                                                        }}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    >
                                                        <option value="">-- Choose Employee --</option>
                                                        {employees.filter(emp => emp.status === 'active').map(emp => (
                                                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id_number})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Employee Name</span>
                                                        <span className="text-xs font-black text-slate-900 uppercase block mt-0.5">{wizardData.name}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold block">{wizardData.employee_number}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Department / Designation</span>
                                                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{wizardData.department} / {wizardData.designation}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {wizardData.employee_id && (
                                                <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {wizardMode === 'initiate' && (
                                                        <div>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Employee Name</span>
                                                            <span className="text-xs font-black text-slate-900 block mt-0.5">{wizardData.name}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Date of Joining</span>
                                                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{formatDateLetter(wizardData.joining_date) || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Base Salary / Month</span>
                                                        <span className="text-xs font-black text-emerald-600 block mt-0.5">₹{Number(wizardData.base_salary).toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Location (City/State)</span>
                                                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{wizardData.location || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Available Leave Balance</span>
                                                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{wizardData.total_available_leaves} days</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {wizardStep === 2 && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Submission date of resignation *</label>
                                                    <input
                                                        type="date"
                                                        value={wizardData.resignation_date}
                                                        onChange={(e) => handleWizardDataChange('resignation_date', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Last date of working *</label>
                                                    <input
                                                        type="date"
                                                        value={wizardData.last_working_day}
                                                        onChange={(e) => handleWizardDataChange('last_working_day', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Separation Type</label>
                                                    <select
                                                        value={wizardData.separation_type}
                                                        onChange={(e) => handleWizardDataChange('separation_type', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    >
                                                        <option value="resignation">Resignation</option>
                                                        <option value="termination">Termination</option>
                                                        <option value="retirement">Retirement</option>
                                                        <option value="absconding">Absconding</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Reason</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Better Career Prospects"
                                                        value={wizardData.reason}
                                                        onChange={(e) => handleWizardDataChange('reason', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Last Salary Paid</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Paid for March 2026"
                                                        value={wizardData.last_salary_paid}
                                                        onChange={(e) => handleWizardDataChange('last_salary_paid', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Location (City/State)</label>
                                                    <input
                                                        type="text"
                                                        value={wizardData.location}
                                                        onChange={(e) => handleWizardDataChange('location', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 3 && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Notice Period Required (Days)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={wizardData.notice_period_days}
                                                        onChange={(e) => handleWizardDataChange('notice_period_days', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Notice Period Adjustable (Days)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={wizardData.notice_adjustable_days}
                                                        onChange={(e) => handleWizardDataChange('notice_adjustable_days', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Notice Shortfall Days</span>
                                                    <span className="text-sm font-black text-rose-600 block mt-0.5">
                                                        {wizardData.shortfall_days || 0} Days
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Notice Recovery Amount</span>
                                                    <span className="text-sm font-black text-rose-600 block mt-0.5">
                                                        ₹{Number(wizardData.notice_recovery_amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 4 && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Days in Month</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="31"
                                                        value={wizardData.total_days_in_month}
                                                        onChange={(e) => handleWizardDataChange('total_days_in_month', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Days Salary Payable</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={wizardData.days_salary_payable}
                                                        onChange={(e) => handleWizardDataChange('days_salary_payable', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">LOP Days</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={wizardData.lop_days}
                                                        onChange={(e) => handleWizardDataChange('lop_days', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Effective Workdays</span>
                                                    <span className="text-sm font-black text-emerald-600 block mt-0.5">
                                                        {wizardData.effective_workdays || 0} Days
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Unpaid Salary Amount</span>
                                                    <span className="text-sm font-black text-emerald-600 block mt-0.5">
                                                        ₹{Number(wizardData.unpaid_salary_amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 5 && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Available Leave Balance (Days)</label>
                                                    <input
                                                        type="number"
                                                        value={wizardData.total_available_leaves}
                                                        disabled
                                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-not-allowed text-slate-500"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">PL Days Payable (Encashment)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        value={wizardData.pl_days_payable}
                                                        onChange={(e) => handleWizardDataChange('pl_days_payable', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Encashment Rate per Day</span>
                                                    <span className="text-xs font-bold text-slate-700 block mt-0.5">
                                                        ₹{Number(wizardData.daily_rate || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Leave Encashment Amount</span>
                                                    <span className="text-sm font-black text-emerald-600 block mt-0.5">
                                                        ₹{Number(wizardData.leave_encashment_amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 6 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column: Overrides & Signoffs */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Other Allowances / Ex-Gratia</label>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-slate-400">₹</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={wizardData.other_allowances}
                                                                onChange={(e) => handleWizardDataChange('other_allowances', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Other Deductions</label>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-slate-400">₹</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={wizardData.other_deductions}
                                                                onChange={(e) => handleWizardDataChange('other_deductions', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Gratuity Amount</label>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-slate-400">₹</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={wizardData.gratuity_amount}
                                                                onChange={(e) => handleWizardDataChange('gratuity_amount', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Outstanding Loans</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={`₹${Number(wizardData.total_outstanding_loan).toLocaleString()}`}
                                                            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-rose-600 outline-none cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Checked By</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. HR Manager"
                                                            value={wizardData.checked_by}
                                                            onChange={(e) => handleWizardDataChange('checked_by', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Authorized By</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. CEO / Director"
                                                            value={wizardData.authorized_by}
                                                            onChange={(e) => handleWizardDataChange('authorized_by', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Payment Method</label>
                                                    <select
                                                        value={wizardData.payment_method}
                                                        onChange={(e) => handleWizardDataChange('payment_method', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all"
                                                    >
                                                        <option value="bank_transfer">Bank Transfer</option>
                                                        <option value="cheque">Cheque</option>
                                                        <option value="cash">Cash / Manual</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Internal Exit Notes / Remarks</label>
                                                    <textarea
                                                        rows="2"
                                                        placeholder="Add notes..."
                                                        value={wizardData.notes}
                                                        onChange={(e) => handleWizardDataChange('notes', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/5 focus:border-[#4361ee] transition-all resize-none font-sans"
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column: Live side-by-side Income/Deduction Summary Box */}
                                            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200/50 pb-2 mb-3">Live Settlement Balance Sheet</h4>

                                                    <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-600">
                                                        {/* Income Summary column */}
                                                        <div className="border-r border-slate-200/60 pr-2 space-y-2">
                                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">Earnings</span>
                                                            <div className="flex justify-between">
                                                                <span>Unpaid Salary:</span>
                                                                <span>₹{Number(wizardData.unpaid_salary_amount).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Leave Encashment:</span>
                                                                <span>₹{Number(wizardData.leave_encashment_amount).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Gratuity:</span>
                                                                <span>₹{Number(wizardData.gratuity_amount).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Allowances:</span>
                                                                <span>₹{Number(wizardData.other_allowances).toFixed(2)}</span>
                                                            </div>
                                                            <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between font-black text-emerald-600">
                                                                <span>Total Income:</span>
                                                                <span>₹{(parseFloat(wizardData.unpaid_salary_amount) + parseFloat(wizardData.leave_encashment_amount) + parseFloat(wizardData.gratuity_amount) + parseFloat(wizardData.other_allowances)).toFixed(2)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Deductions Summary column */}
                                                        <div className="space-y-2 pl-1">
                                                            <span className="text-[8px] font-black text-rose-600 uppercase tracking-wider block">Deductions</span>
                                                            <div className="flex justify-between">
                                                                <span>Notice Recovery:</span>
                                                                <span>₹{Number(wizardData.notice_recovery_amount).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-rose-500">
                                                                <span>Outstanding Loan:</span>
                                                                <span>₹{Number(wizardData.total_outstanding_loan).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Other Deductions:</span>
                                                                <span>₹{Number(wizardData.other_deductions).toFixed(2)}</span>
                                                            </div>
                                                            <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between font-black text-rose-600">
                                                                <span>Total Deductions:</span>
                                                                <span>₹{(parseFloat(wizardData.notice_recovery_amount) + parseFloat(wizardData.total_outstanding_loan) + parseFloat(wizardData.other_deductions)).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-slate-200/40 rounded-xl p-3.5 mt-4 flex items-center justify-between">
                                                    <div className="w-[60%]">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Net Settlement Amount</span>
                                                        <span className="text-[9px] text-slate-450 italic font-bold mt-0.5 line-clamp-1 block leading-none">{numberToWords(wizardData.fnf_net_payable)}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-base font-black ${parseFloat(wizardData.fnf_net_payable) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            ₹{Number(wizardData.fnf_net_payable).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Navigation Controls */}
                                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                                    {wizardStep > 1 ? (
                                        <button
                                            onClick={() => setWizardStep(prev => prev - 1)}
                                            className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-colors"
                                        >
                                            Back
                                        </button>
                                    ) : (
                                        <div />
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowWizardModal(false)}
                                            className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        {wizardStep < 6 ? (
                                            <button
                                                onClick={() => {
                                                    if (wizardStep === 1 && !wizardData.employee_id) {
                                                        alert('Please select an employee');
                                                        return;
                                                    }
                                                    setWizardStep(prev => prev + 1);
                                                }}
                                                className="px-6 py-2 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                Next
                                            </button>
                                        ) : (
                                            wizardMode === 'initiate' ? (
                                                <button
                                                    onClick={handleWizardInitiate}
                                                    disabled={initiateSubmitting}
                                                    className="px-6 py-2 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                                                >
                                                    {initiateSubmitting && <RefreshCw size={12} className="animate-spin" />}
                                                    Initiate Exit
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleWizardSettle}
                                                    disabled={fnfSettleSubmitting}
                                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                                                >
                                                    {fnfSettleSubmitting && <RefreshCw size={12} className="animate-spin" />}
                                                    Authorize & Settle
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* --- PAYROLL PROCESS GUIDE MODAL --- */}
            {showPayrollGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 no-print">
                    <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col gap-4 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

                        <button
                            onClick={() => setShowPayrollGuide(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 text-[#4361ee] rounded-xl border border-indigo-150">
                                <Calculator size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">How to Process Payroll - Step-by-Step Guide</h3>
                                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Follow these steps to successfully run payroll on MyFastHR portal</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                            <div className="space-y-3.5 pr-2 border-r border-slate-100">
                                <h4 className="text-xs font-black text-indigo-650 uppercase tracking-widest">Phase 1: Inputs & Attendance</h4>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 text-[#4361ee] font-black text-xs flex items-center justify-center shrink-0">1</div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800">Finalize Attendance & Leaves</p>
                                        <p className="text-[10px] text-slate-500">Ensure all check-ins, check-outs, LOP (Loss of Pay) days, and attendance schemes are verified for the current cycle.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 text-[#4361ee] font-black text-xs flex items-center justify-center shrink-0">2</div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800">Adjust Salary Components</p>
                                        <p className="text-[10px] text-slate-500">Go to **Salary Revisions** to verify employee basic structures, allowances, bonuses, and loan EMIs.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 text-[#4361ee] font-black text-xs flex items-center justify-center shrink-0">3</div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800">Lock Payroll Inputs</p>
                                        <p className="text-[10px] text-slate-500">In the **Control Panel**, switch **Payroll Inputs** to **Lock**. This freezes structure modifications during calculation.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3.5 pl-2">
                                <h4 className="text-xs font-black text-emerald-650 uppercase tracking-widest">Phase 2: Calculate & Release</h4>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0">4</div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800">Click Process Payroll</p>
                                        <p className="text-[10px] text-slate-500">Click the **Process Payroll** button. The system calculates Gross, Cuts (PF, ESIC, Tax, Loans), and Net Pay.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0">5</div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800">Audit & Lock Statements</p>
                                        <p className="text-[10px] text-slate-500">Review the generated slips table. If accurate, turn **Payroll Locked** to **Lock** to prevent accidental updates.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0">6</div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800">Release Payslips to Staff</p>
                                        <p className="text-[10px] text-slate-500">Toggle **Employee View Release** to **Release** so employees can see & download slips from their dashboard.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80 flex items-start gap-2.5">
                            <Info size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Pro-Tip for Statutory Filings</p>
                                <p className="text-[9px] text-slate-500 leading-relaxed">
                                    After processing and locking the payroll, use the **Statutory ECR Payroll Exports** section below to download compliant **EPFO ECR text files** and **ESIC Excel sheets** for immediate upload to official government portals.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                            <button
                                onClick={() => setShowPayrollGuide(false)}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FNF LETTER MODAL PREVIEW --- */}
            {showLetterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 no-print">
                    <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />

                        <button
                            onClick={() => {
                                setShowLetterModal(false);
                                setLetterData(null);
                            }}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-all font-black text-xs w-7 h-7 flex items-center justify-center border border-slate-200/50"
                        >
                            ✕
                        </button>

                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Full & Final Settlement Statement Letter</h3>
                            <p className="text-[10px] font-bold text-slate-400">Statement preview matching the official print-ready format.</p>
                        </div>

                        {/* Letter Container Preview */}
                        <div className="bg-white border border-slate-200/50 shadow-sm p-8 rounded-2xl max-h-[500px] overflow-y-auto">
                            <div className="max-w-[700px] mx-auto bg-white">
                                <h2 className="text-center text-sm font-bold font-sans uppercase text-black tracking-wider pb-6 underline">Full & Final Settlement Statement</h2>
                                <SettlementLetterContent data={letterData} />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                            <button
                                onClick={() => {
                                    setShowLetterModal(false);
                                    setLetterData(null);
                                }}
                                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-2.5 bg-[#4361ee] hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                <Printer size={13} />
                                Print Statement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Deductions Detail Modal */}
            {selectedOtherDeductions && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full mx-4 p-5 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Other Deductions Detail</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{selectedOtherDeductions.employeeName}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOtherDeductions(null)} 
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {selectedOtherDeductions.breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200/50 rounded-xl p-2.5 shadow-sm">
                                    <span className="text-[10px] font-bold uppercase text-slate-600">{item.name}</span>
                                    <span className="text-xs font-black text-rose-600">-₹{Number(item.amount).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
                            <span className="text-sm font-black text-rose-600">
                                -₹{selectedOtherDeductions.breakdown.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PRINT ONLY CONTAINER --- */}
            {letterData && (
                <div id="print-settlement-letter" className="font-sans text-black bg-white">
                    <h2 className="text-center text-sm font-bold uppercase text-black tracking-wider pb-6 underline">Full & Final Settlement Statement</h2>
                    <SettlementLetterContent data={letterData} />
                </div>
            )}

            {/* PRINT OVERRIDES STYLE BLOCK */}
            <style dangerouslySetInnerHTML={{
                __html: `
                 @media print {
                     body * {
                         visibility: hidden !important;
                     }
                     #print-settlement-letter, #print-settlement-letter * {
                         visibility: visible !important;
                     }
                     #print-settlement-letter {
                         display: block !important;
                         position: absolute !important;
                         left: 0 !important;
                         top: 0 !important;
                         width: 100% !important;
                         margin: 0 !important;
                         padding: 25mm 20mm 20mm 20mm !important;
                         background: white !important;
                         color: black !important;
                         box-sizing: border-box;
                     }
                     @page {
                         size: auto;
                         margin: 0mm; /* Disables browser-generated default headers and footers (URLs, Dates) */
                     }
                 }
                 #print-settlement-letter {
                     display: none;
                 }
             `}} />
        </div>
    );
};

export default Payroll;
