import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, User, IndianRupee, Calendar, CheckCircle2, 
  ChevronRight, ChevronLeft, Download, Send, Printer,
  Sparkles, Building2, Briefcase, MapPin, Mail, Phone,
  Clock, ShieldCheck, Info, Search, Plus, Trash2, Edit3,
  ExternalLink, Layers, FileSignature, AlertCircle, X, Palette
} from 'lucide-react';
import api from '../utils/api';
import jsPDF from 'jspdf';

// Helper Map of String Icons to Lucide Icons for Custom Templates
const iconMap = {
  FileText: FileText,
  ShieldCheck: ShieldCheck,
  Sparkles: Sparkles,
  Briefcase: Briefcase,
  Layers: Layers,
  FileSignature: FileSignature,
  User: User
};

const convertNumberToWords = (num) => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
  };

  const parsed = parseInt(num, 10);
  if (isNaN(parsed) || parsed === 0) return '';
  return numToWords(parsed) + ' Rupees Only';
};

const formatDateToOrdinal = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';
  
  return `${day < 10 ? '0' + day : day}${suffix} ${month} ${year}`;
};

const defaultTemplates = [
  { 
    id: 'hotel_highway_king_offer', 
    name: 'Hotel Highway King Offer', 
    description: 'Custom legal offer letter matching M/S Hotel Highway King requirements.',
    iconName: 'ShieldCheck',
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    body: `We hereby offer you to join our company M/S {{company_name}}, {{company_address}}, for the post of "{{designation}}".

Your initial appointment will be on probation for a minimum period of {{probation_period}}, which may be extended by the company from time to time at its discretion. Your services with the Company would be confirmed, subject to your performance meeting the requisite standards. Decision of the company will be final and will not be amendable to any challenge.

Your remuneration shall be paid on a monthly basis. You will receive a remuneration of Rs. {{monthly_ctc}}/- CTC/- ({{monthly_ctc_words}}) per month.

Your work will include all work normally or properly done under the said post and all such other work as it is reasonable in the circumstances from time to time for the company to require you to perform.

Your work place will be at {{job_location}}. However, your services will be transferable and you will be assigned after reasonable notice, where the Company or anyone of its associates conducts business.

The company shall have the right to terminate your employment any time without any liability of compensation or damages either forthwith or by issuing a notice of one month. In case you want to terminate your employment, the same can be done only after either serving a notice of minimum one month or offering one month salary. The Company reserves the right not to accept salary in lieu of notice.

You will be expected to deliver high standard of performance and professional ethics.

This offer letter is legal and valid subject to acceptance of terms and conditions specified in the Employment Agreement. Notwithstanding anything, the terms of the employment will be governed by the terms and conditions provided in the Employment Agreement.

The Company shall conduct a background and reference check as per its Policy and this offer is conditional upon the result of such checks. In the event the results of such are unsatisfactory on any account, the Company may, in its sole discretion, revoke this offer at any time and the Company’s decision will be final and not amendable to any challenge.

We hope that you find the terms of your appointment acceptable. Your appointment will be effective from your date of joining, which shall be {{joining_date}}. Kindly bring the following documents with you on the day of joining:

01. Aadhaar Card
02. PAN Card
03. 10th Mark sheet
04. Latest Education Mark sheet / Certificate
05. Bank Statement for the Last three months
06. Appointment Letter from your previous company
07. Salary Slips for the last three months from your previous company
08. Relieving Letter from your previous company
09. Passport Size Photograph 04 Nos

Please sign the duplicate copy of this letter as token of your acceptance and return to us.`
  },
  { 
    id: 'standard_offer', 
    name: 'Standard Offer Letter', 
    description: 'Standard professional offer letter for regular employees.',
    iconName: 'FileText',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    body: `Dear {{candidate_name}},

We are pleased to offer you employment with {{company_name}} in the position of {{designation}} within the {{department}} department.

Employment Terms:
• Joining Date: {{joining_date}}
• Job Location: {{job_location}}
• Probation Period: {{probation_period}}
• Reporting To: {{report_to}}

Compensation Structure:
• Annual CTC: INR {{annual_ctc}}
• Monthly Basic Salary: INR {{monthly_basic}}
• Monthly House Rent Allowance (HRA): INR {{monthly_hra}}
• Monthly Special Allowance: INR {{monthly_allowance}}

Please confirm your acceptance of this offer by signing and returning a copy of this letter on or before {{offer_expiry}}. We look forward to a mutually rewarding association.

Yours sincerely,
For {{company_name}}`
  },
  { 
    id: 'executive_offer', 
    name: 'Executive Appointment', 
    description: 'Formal appointment letter for leadership and management roles.',
    iconName: 'ShieldCheck',
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    body: `Dear {{candidate_name}},

It is our privilege to offer you the position of {{designation}} in {{company_name}}. As a senior leader in the {{department}} department, you will play a crucial role in shaping our organization's strategic vision.

Employment Terms:
• Date of Joining: {{joining_date}}
• Job Location: {{job_location}}
• Reporting Manager: {{report_to}}
• Probation Period: {{probation_period}}

Compensation Structure:
• Annual CTC: INR {{annual_ctc}}
• Monthly Basic Salary: INR {{monthly_basic}}
• Monthly House Rent Allowance (HRA): INR {{monthly_hra}}

This offer is subject to satisfactory reference and background verification checks. Please sign and return the duplicate copy of this letter by {{offer_expiry}} to indicate your acceptance.

Warm regards,
For {{company_name}}`
  },
  { 
    id: 'internship_offer', 
    name: 'Internship Offer', 
    description: 'Tailored for interns with focus on duration and learning outcomes.',
    iconName: 'Sparkles',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    body: `Dear {{candidate_name}},

We are pleased to offer you an Internship with {{company_name}} as a {{designation}} in our {{department}} team.

Internship Terms:
• Date of Commencement: {{joining_date}}
• Internship Location: {{job_location}}
• Internship Supervisor: {{report_to}}
• Internship Duration: {{probation_period}}

Stipend Details:
• Annualized Equiv. CTC: INR {{annual_ctc}}
• Monthly Stipend: INR {{monthly_basic}}

During this internship, you will receive hands-on experience and guidance. Please sign this letter on or before {{offer_expiry}} to confirm your participation.

Sincerely,
For {{company_name}}`
  },
  { 
    id: 'contract_letter', 
    name: 'Consultancy Agreement', 
    description: 'Legal agreement for contract-based or freelance associates.',
    iconName: 'Briefcase',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    body: `Dear {{candidate_name}},

We are pleased to engage you as a Contract Consultant in the capacity of {{designation}} for {{company_name}}'s {{department}} department.

Contract Terms:
• Agreement Date: {{joining_date}}
• Service Location: {{job_location}}
• Engagement Manager: {{report_to}}
• Term of Contract: {{probation_period}}

Consultancy Fees:
• Annualized Value: INR {{annual_ctc}}
• Monthly Consultation Fee: INR {{monthly_basic}}

Please review the terms of this engagement and sign the copy to express your agreement before {{offer_expiry}}.

Best regards,
For {{company_name}}`
  }
];

const LetterGenerator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('hotel_highway_king_offer');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  
  // Fetch all employees and managers on mount for dropdown selectors
  useEffect(() => {
    const loadAllEmployeesAndManagers = async () => {
      try {
        const [empRes, mgrRes] = await Promise.all([
          api.get('/employees'),
          api.get('/employees/managers')
        ]);
        setEmployeesList(empRes || []);
        setManagersList(mgrRes || []);
      } catch (err) {
        console.error('Failed to load employees and managers lists', err);
      }
    };
    loadAllEmployeesAndManagers();
  }, []);
  
  // Interactive Overlays
  const [showRecentLetters, setShowRecentLetters] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [recentSearchQuery, setRecentSearchQuery] = useState('');

  // New Template Inputs
  const [newTempName, setNewTempName] = useState('');
  const [newTempDesc, setNewTempDesc] = useState('');
  const [newTempIcon, setNewTempIcon] = useState('FileText');
  const [newTempColor, setNewTempColor] = useState('indigo');
  const [newTempBody, setNewTempBody] = useState(`Dear {{candidate_name}},

We are pleased to offer you the position of {{designation}} at {{company_name}} in our {{department}} department.

Offer details:
- Joining Date: {{joining_date}}
- Location: {{job_location}}
- Annual CTC: INR {{annual_ctc}}

Warm regards,
For {{company_name}}`);

  const [customBodyText, setCustomBodyText] = useState(() => {
    const saved = localStorage.getItem('myfasthr_letter_templates');
    let allTemplates = defaultTemplates;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        allTemplates = [...defaultTemplates, ...parsed];
      } catch (e) {
        // Ignored
      }
    }
    const selectedObj = allTemplates.find(t => t.id === 'hotel_highway_king_offer');
    return selectedObj ? (selectedObj.body || '') : '';
  });
  const [brandColor, setBrandColor] = useState('#4361ee');
  const [themeStyle, setThemeStyle] = useState('modern');
  const [activeSettingsTab, setActiveSettingsTab] = useState('draft'); // 'draft' or 'branding'

  // Loaded branding states
  const [uploadedLogo, setUploadedLogo] = useState(() => localStorage.getItem('myfasthr_company_logo') || '');
  const [uploadedSignature, setUploadedSignature] = useState(() => localStorage.getItem('myfasthr_authorized_signature') || '');
  const [companyDetails, setCompanyDetails] = useState(() => {
    const defaultDetails = {
      name: 'HOTEL HIGHWAY KING',
      address: 'Khasra No. 838, Village Nider, Tehsil – Rampura Dabri, Sikar Road, Harmada, Jaipur – 302013',
      email: 'hr@hotelhighwayking.com',
      phone: '9001992378',
      gstn: '08AADCH7248H1ZE',
      msme: 'UDYAM-RJ-17-0096174',
      signatoryName: 'SHIVIKA SHARMA',
      signatoryTitle: 'HR MANAGER'
    };
    const saved = localStorage.getItem('myfasthr_company_details');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultDetails, ...parsed };
      } catch (e) {
        // Ignored
      }
    }
    return defaultDetails;
  });

  // Load / Sync Templates State (with local storage fallback)
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('myfasthr_letter_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const filteredParsed = parsed.filter(t => !defaultTemplates.some(dt => dt.id === t.id));
        return [...defaultTemplates, ...filteredParsed];
      } catch (e) {
        return defaultTemplates;
      }
    }
    return defaultTemplates;
  });

  // Load / Sync Recent Letters History
  const [recentLetters, setRecentLetters] = useState(() => {
    const saved = localStorage.getItem('myfasthr_recent_letters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'rec_1',
        candidateName: 'Rohan Malhotra',
        candidateEmail: 'rohan.m@gmail.com',
        templateId: 'standard_offer',
        templateName: 'Standard Offer Letter',
        designation: 'Senior Frontend Engineer',
        department: 'Engineering',
        annualCTC: '12,00,000',
        joiningDate: '01 June 2026',
        location: 'Remote',
        probationPeriod: '6 Months',
        monthlyBasic: '45,000.00',
        monthlyHRA: '20,000.00',
        monthlyAllowance: '35,000.00',
        createdDate: '15 May 2026',
        status: 'Shared via Email'
      },
      {
        id: 'rec_2',
        candidateName: 'Sneha Rao',
        candidateEmail: 'sneha.rao@outlook.com',
        templateId: 'internship_offer',
        templateName: 'Internship Offer',
        designation: 'UX Design Intern',
        department: 'Product Design',
        annualCTC: '3,60,000',
        joiningDate: '10 June 2026',
        location: 'Bengaluru Office',
        probationPeriod: '3 Months',
        monthlyBasic: '13,500.00',
        monthlyHRA: '6,000.00',
        monthlyAllowance: '10,500.00',
        createdDate: '12 May 2026',
        status: 'Downloaded'
      }
    ];
  });

  // Form State
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    candidateSalutation: 'MR.',
    candidateAddress: '',
    candidateAadhaar: '',
    candidatePan: '',
    designation: 'FLOOR MANAGER',
    department: 'Management',
    joiningDate: '2026-05-08',
    location: 'Harmada',
    reportTo: 'SHIVIKA SHARMA',
    probationPeriod: '6 (Six Months)',
    offerExpiry: '',
    
    // Salary Details
    annualCTC: '',
    monthlyCTC: '',
    monthlyCTCWords: '',
    monthlyBasic: '',
    monthlyHRA: '',
    monthlyAllowance: '',
    performanceBonus: '',
    
    // Additional Features
    includeInsurance: true,
    includeRelocation: false,
    customNotes: ''
  });

  const steps = [
    { id: 1, name: 'Select Template', icon: Layers, description: 'Choose letter type' },
    { id: 2, name: 'Recipient Details', icon: User, description: 'Candidate information' },
    { id: 3, name: 'Terms & Salary', icon: IndianRupee, description: 'Offer configuration' },
    { id: 4, name: 'Review & Preview', icon: FileSignature, description: 'Final letter audit' }
  ];

  const selectTemplateAndSyncBody = (tempId, currentTemplatesList = templates) => {
    setTemplate(tempId);
    const selectedObj = currentTemplatesList.find(t => t.id === tempId);
    if (selectedObj) {
      setCustomBodyText(selectedObj.body || '');
    }
  };

  const handleImportTemplateFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewTempBody(event.target.result || '');
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'new-template') {
      setTimeout(() => {
        setShowNewTemplateModal(true);
      }, 0);
    }
  }, [location.search]);

  useEffect(() => {
    localStorage.setItem('myfasthr_company_details', JSON.stringify(companyDetails));
  }, [companyDetails]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get(`/employees?search=${searchQuery}`);
        setSearchResults(res || []);
      } catch (err) {
        console.error('Search failed', err);
      }
    };

    if (searchQuery.length > 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmployees();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleEmployeeSelect = (emp) => {
    setSelectedEmployee(emp);
    
    // Find manager name if manager_id is present
    let matchedManagerName = '';
    if (emp.manager_id) {
      const mgr = managersList.find(m => m.id.toString() === emp.manager_id.toString());
      if (mgr) {
        matchedManagerName = `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim();
      }
    }

    // Calculate salary structures
    let basic = parseFloat(emp.base_salary) || 0;
    let hra = 0;
    let allowancesAmount = 0;
    if (emp.allowances) {
      try {
        const parsedAllowances = typeof emp.allowances === 'string' ? JSON.parse(emp.allowances) : emp.allowances;
        if (Array.isArray(parsedAllowances)) {
          parsedAllowances.forEach(a => {
            const name = (a.name || '').toLowerCase();
            const amt = parseFloat(a.amount) || parseFloat(a.value) || 0;
            if (name.includes('hra') || name.includes('house rent')) {
              hra += amt;
            } else {
              allowancesAmount += amt;
            }
          });
        }
      } catch(e) {
        console.error("Failed to parse employee allowances:", e);
      }
    }

    const monthlyCTC = basic + hra + allowancesAmount;
    const annualCTC = monthlyCTC * 12;

    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name || emp.full_name;

    let addr = emp.present_address || '';
    if (emp.city) addr += (addr ? ', ' : '') + emp.city;
    if (emp.district && emp.district !== emp.city) addr += (addr ? ', ' : '') + emp.district;
    if (emp.state) addr += (addr ? ', ' : '') + emp.state;
    if (emp.pincode) addr += (addr ? ' - ' : ' ') + emp.pincode;

    setFormData(prev => ({
      ...prev,
      candidateName: name,
      candidateEmail: emp.email || '',
      candidatePhone: emp.phone || '',
      candidateSalutation: emp.gender === 'female' ? 'MS.' : 'MR.',
      candidateAddress: addr,
      candidateAadhaar: emp.aadhaar_number || '',
      candidatePan: emp.pan_number || '',
      designation: emp.designation || prev.designation,
      department: emp.department_name || emp.department || prev.department,
      joiningDate: emp.joining_date ? emp.joining_date.substring(0, 10) : prev.joiningDate,
      location: emp.office_location || emp.location || prev.location,
      probationPeriod: emp.probation_period || prev.probationPeriod,
      reportTo: matchedManagerName || prev.reportTo,
      
      // Salary
      annualCTC: monthlyCTC > 0 ? annualCTC.toString() : '',
      monthlyCTC: monthlyCTC > 0 ? monthlyCTC.toString() : '',
      monthlyCTCWords: monthlyCTC > 0 ? convertNumberToWords(monthlyCTC) : '',
      monthlyBasic: monthlyCTC > 0 ? basic.toFixed(2) : '',
      monthlyHRA: monthlyCTC > 0 ? hra.toFixed(2) : '',
      monthlyAllowance: monthlyCTC > 0 ? allowancesAmount.toFixed(2) : ''
    }));

    setSearchQuery('');
    setSearchResults([]);
  };

  const calculateSalary = (ctc) => {
    if (ctc === '') {
      setFormData({
        ...formData,
        annualCTC: '',
        monthlyCTC: '',
        monthlyCTCWords: '',
        monthlyBasic: '',
        monthlyHRA: '',
        monthlyAllowance: ''
      });
      return;
    }
    const annual = parseFloat(ctc) || 0;
    const monthly = Math.round(annual / 12);
    const basic = Math.round(monthly * 0.45);
    const hra = Math.round(monthly * 0.20);
    const allowance = monthly - basic - hra;

    setFormData({
      ...formData,
      annualCTC: ctc,
      monthlyCTC: monthly.toString(),
      monthlyCTCWords: convertNumberToWords(monthly),
      monthlyBasic: basic.toFixed(2),
      monthlyHRA: hra.toFixed(2),
      monthlyAllowance: allowance.toFixed(2)
    });
  };

  const handleMonthlyCTCChange = (val) => {
    if (val === '') {
      setFormData({
        ...formData,
        annualCTC: '',
        monthlyCTC: '',
        monthlyCTCWords: '',
        monthlyBasic: '',
        monthlyHRA: '',
        monthlyAllowance: ''
      });
      return;
    }
    const monthly = parseFloat(val) || 0;
    const annual = monthly * 12;
    const basic = Math.round(monthly * 0.45);
    const hra = Math.round(monthly * 0.20);
    const allowance = monthly - basic - hra;

    setFormData({
      ...formData,
      monthlyCTC: val,
      annualCTC: annual.toString(),
      monthlyCTCWords: convertNumberToWords(monthly),
      monthlyBasic: basic.toFixed(2),
      monthlyHRA: hra.toFixed(2),
      monthlyAllowance: allowance.toFixed(2)
    });
  };

  const resolveTemplate = (bodyText, customData = null) => {
    const data = customData || formData;
    if (!bodyText) return '';
    
    let text = bodyText;
    const activeTempId = customData ? customData.templateId : template;
    if (activeTempId === 'hotel_highway_king_offer') {
      text = text.replace(/^Dear\s+\{\{candidate_name\}\},\s*/gi, '')
                 .replace(/^Dear\s+\[Candidate Name\],\s*/gi, '')
                 .replace(/^Dear\s+[^,\n]+,\s*/gi, '');
    }

    return text
      .replace(/\{\{candidate_name\}\}/g, data.candidateName || '[Candidate Name]')
      .replace(/\{\{candidate_email\}\}/g, data.candidateEmail || '[Candidate Email]')
      .replace(/\{\{candidate_phone\}\}/g, data.candidatePhone || '[Candidate Phone]')
      .replace(/\{\{designation\}\}/g, data.designation || '[Designation]')
      .replace(/\{\{department\}\}/g, data.department || '[Department]')
      .replace(/\{\{annual_ctc\}\}/g, data.annualCTC || '0.00')
      .replace(/\{\{monthly_ctc\}\}/g, data.monthlyCTC || '0.00')
      .replace(/\{\{monthly_ctc_words\}\}/g, data.monthlyCTCWords || '[CTC in Words]')
      .replace(/\{\{monthly_basic\}\}/g, data.monthlyBasic || '0.00')
      .replace(/\{\{monthly_hra\}\}/g, data.monthlyHRA || '0.00')
      .replace(/\{\{monthly_allowance\}\}/g, data.monthlyAllowance || '0.00')
      .replace(/\{\{joining_date\}\}/g, formatDateToOrdinal(data.joiningDate) || data.joiningDate || '[Joining Date]')
      .replace(/\{\{job_location\}\}/g, data.location || '[Job Location]')
      .replace(/\{\{report_to\}\}/g, data.reportTo || '[Manager Name]')
      .replace(/\{\{probation_period\}\}/g, data.probationPeriod || '[Probation Period]')
      .replace(/\{\{offer_expiry\}\}/g, formatDateToOrdinal(data.offerExpiry) || data.offerExpiry || '[Offer Expiry]')
      .replace(/\{\{company_name\}\}/g, companyDetails.name || 'MyFastHR Solutions')
      .replace(/\{\{company_address\}\}/g, companyDetails.address || '[Company Address]');
  };

  const handleSaveTemplateChanges = () => {
    const updatedTemplates = templates.map(t => {
      if (t.id === template) {
        return { ...t, body: customBodyText };
      }
      return t;
    });
    setTemplates(updatedTemplates);
    // save custom templates back to storage
    const customOnly = updatedTemplates.filter(t => !defaultTemplates.some(dt => dt.id === t.id));
    localStorage.setItem('myfasthr_letter_templates', JSON.stringify(customOnly));
    alert('Template body text saved as default successfully!');
  };

  const generatePDF = (customData = null, shouldDownload = true) => {
    const data = customData || formData;
    const selectedTemplateId = customData ? customData.templateId : template;
    const activeTemplate = templates.find(t => t.id === selectedTemplateId) || {};
    
    // Resolve content
    const bodyToResolve = customData ? (activeTemplate.body || '') : customBodyText;
    const resolvedBody = resolveTemplate(bodyToResolve, customData);
    
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    const accentColor = brandColor || '#4361ee';
    const hexToRgb = (hex) => {
      const match = hex.replace('#', '').match(/.{1,2}/g);
      return match ? [parseInt(match[0], 16), parseInt(match[1], 16), parseInt(match[2], 16)] : [67, 97, 238];
    };
    const [r, g, b] = hexToRgb(accentColor);

    // Standardized Header & Footer drawing helper
    const drawHeaderAndFooter = (pdfDoc, isFirst = false) => {
      // Draw Theme Accents (modern, creative, classic)
      if (themeStyle === 'creative') {
        pdfDoc.setFillColor(255, 0, 0);
        pdfDoc.rect(0, 0, pageWidth, 6, 'F');
      } else if (themeStyle === 'classic') {
        pdfDoc.setDrawColor(226, 232, 240);
        pdfDoc.setLineWidth(0.5);
        pdfDoc.rect(8, 8, pageWidth - 16, pageHeight - 16);
      } else if (themeStyle === 'modern') {
        pdfDoc.setFillColor(255, 0, 0);
        pdfDoc.rect(0, 0, 4, pageHeight, 'F');
      }

      // Draw Logo & Header Info
      const headerY = 15;
      
      // Draw name in large bold red text
      pdfDoc.setFontSize(22);
      pdfDoc.setTextColor(255, 0, 0); // Solid Red
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(companyDetails.name || 'HOTEL HIGHWAY KING', margin, headerY + 6);
      
      // Draw address in small bold black text below it
      pdfDoc.setFontSize(7.5);
      pdfDoc.setTextColor(0, 0, 0); // Black
      pdfDoc.setFont('helvetica', 'bold');
      
      const companyAddressLines = pdfDoc.splitTextToSize(companyDetails.address || '', 140);
      let addressY = headerY + 11;
      companyAddressLines.forEach((line) => {
        pdfDoc.text(line, margin, addressY);
        addressY += 3.5;
      });

      // Draw logo on the right side
      const logoWidth = 22;
      const logoHeight = 22;
      if (uploadedLogo) {
        try {
          pdfDoc.addImage(uploadedLogo, 'PNG', pageWidth - margin - logoWidth, headerY - 3, logoWidth, logoHeight);
        } catch (err) {
          console.error('Failed to add logo to PDF:', err);
        }
      } else {
        // Draw a nice letter avatar placeholder if no logo
        pdfDoc.setFillColor(220, 38, 38);
        pdfDoc.roundedRect(pageWidth - margin - 15, headerY, 15, 15, 3, 3, 'F');
        pdfDoc.setFontSize(10);
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.text((companyDetails.name || 'H').charAt(0), pageWidth - margin - 9, headerY + 9);
      }
      
      // Draw solid red separator line under header
      pdfDoc.setDrawColor(255, 0, 0);
      pdfDoc.setLineWidth(1.5);
      pdfDoc.line(margin, headerY + 18, pageWidth - margin, headerY + 18);

      // Draw Footer at pageHeight - 22
      const footerY = pageHeight - 22;
      pdfDoc.setDrawColor(255, 0, 0); // Solid red line
      pdfDoc.setLineWidth(1.5);
      pdfDoc.line(margin, footerY, pageWidth - margin, footerY);
      
      // Footer Details
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(51, 65, 85);
      const footerDetails = `Contact - ${companyDetails.phone || ''} | ${companyDetails.email || ''} ${companyDetails.gstn ? `| GSTN - ${companyDetails.gstn}` : ''} ${companyDetails.msme ? `| MSME - ${companyDetails.msme}` : ''}`;
      pdfDoc.text(footerDetails, pageWidth / 2, footerY + 5, { align: 'center' });
      
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setTextColor(100, 116, 139);
      pdfDoc.setFontSize(7.5);
      pdfDoc.text(companyDetails.address || '', pageWidth / 2, footerY + 9, { align: 'center' });
    };

    let y = 42;
    
    // Draw initial header/footer on page 1
    drawHeaderAndFooter(doc, true);
    
    const displayDate = formatDateToOrdinal(customData ? customData.createdDate || new Date() : new Date());

    if (selectedTemplateId === 'hotel_highway_king_offer') {
      // 1. Issuance Date on Left
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Date: ${displayDate}`, margin, y);
      y += 10;
      
      // 2. Recipient details
      doc.setFont('helvetica', 'bold');
      doc.text("To,", margin, y);
      y += 5.5;
      
      const salutation = data.candidateSalutation || 'MR.';
      const nameUpper = (data.candidateName || '').toUpperCase();
      doc.text(`${salutation} ${nameUpper}`, margin, y);
      y += 5.5;
      
      // Address
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const recipientAddress = data.candidateAddress || '[Candidate Address]';
      const addressLines = doc.splitTextToSize(recipientAddress, pageWidth - (margin * 2));
      addressLines.forEach((line) => {
        doc.text(line, margin, y);
        y += 5.5;
      });
      
      // Aadhaar, PAN, Email, Contact
      doc.setFont('helvetica', 'bold');
      doc.text(`Aadhaar – `, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.candidateAadhaar || '[Aadhaar Number]', margin + 18, y);
      y += 5.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`PAN – `, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.candidatePan || '[PAN Number]', margin + 12, y);
      y += 5.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Email – `, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(37, 99, 235); // blue link
      doc.text(data.candidateEmail || '[Candidate Email]', margin + 14, y);
      doc.setTextColor(0, 0, 0);
      y += 5.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Contact – `, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.candidatePhone || '[Candidate Phone]', margin + 18, y);
      y += 10;
      
      // 3. Subject: SUBJECT: OFFER LETTER FOR THE POST OF "..."
      doc.setFont('helvetica', 'bold');
      const subjectText = `SUBJECT: OFFER LETTER FOR THE POST OF "${(data.designation || 'Floor Manager').toUpperCase()}"`;
      doc.text(subjectText, margin, y);
      // Draw underline for subject
      const subjectWidth = doc.getTextWidth(subjectText);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(margin, y + 1, margin + subjectWidth, y + 1);
      y += 10;
      
      // 4. Salutation: Dear,\nMR. ...
      doc.setFont('helvetica', 'normal');
      doc.text("Dear,", margin, y);
      y += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.text(`${salutation} ${nameUpper}`, margin, y);
      y += 10;
    } else {
      // DEFAULT LAYOUT: Title & Date (Standard, Executive, etc.)
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      
      const docTitle = activeTemplate.name ? activeTemplate.name.toUpperCase() : 'OFFER LETTER';
      doc.text(docTitle, margin, y);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${displayDate}`, pageWidth - margin, y, { align: 'right' });
      
      y += 12;
    }
    
    // Render Paragraphs
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    
    const paragraphs = resolvedBody.split('\n');
    paragraphs.forEach((para) => {
      if (y > pageHeight - 32) {
        doc.addPage();
        drawHeaderAndFooter(doc, false);
        y = 42;
      }
      if (para.trim() === '') {
        y += 5;
        return;
      }
      const lines = doc.splitTextToSize(para, pageWidth - (margin * 2));
      lines.forEach((line) => {
        if (y > pageHeight - 32) {
          doc.addPage();
          drawHeaderAndFooter(doc, false);
          y = 42;
        }
        
        // Bold formatting for terms/tables/bullets
        const trimmed = line.trim();
        if (trimmed.startsWith('•') || 
            trimmed.startsWith('01.') || trimmed.startsWith('02.') || trimmed.startsWith('03.') ||
            trimmed.startsWith('04.') || trimmed.startsWith('05.') || trimmed.startsWith('06.') ||
            trimmed.startsWith('07.') || trimmed.startsWith('08.') || trimmed.startsWith('09.') ||
            trimmed.startsWith('Employment Terms:') || 
            trimmed.startsWith('Compensation Structure:') || 
            trimmed.startsWith('Stipend Details:') || 
            trimmed.startsWith('Consultancy Fees:') ||
            trimmed.startsWith('Dear') ||
            trimmed.startsWith('FOR M/S') ||
            trimmed.startsWith('HR MANAGER')) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(line, margin, y);
        y += 5.5;
      });
      y += 2.5;
    });

    y += 8;
    
    // Signature block
    if (y + 40 > pageHeight - 32) {
      doc.addPage();
      drawHeaderAndFooter(doc, false);
      y = 42;
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("Thanking you,", margin, y);
    y += 5.5;
    doc.text("Yours sincerely,", margin, y);
    y += 5.5;
    
    // Render Signature image if exists
    if (uploadedSignature) {
      try {
        doc.addImage(uploadedSignature, 'PNG', margin, y, 35, 12);
        y += 14;
      } catch (err) {
        console.error('Failed to add signature image:', err);
        y += 10;
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text('(Authorized Signatory)', margin, y + 6);
      doc.setTextColor(51, 65, 85);
      y += 12;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`FOR ${companyDetails.name}`, margin, y);
    y += 5.5;
    doc.text(companyDetails.signatoryTitle, margin, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.text(companyDetails.signatoryName, margin, y);
    
    if (shouldDownload) {
      doc.save(`Offer_Letter_${(data.candidateName || 'Candidate').replace(/\s+/g, '_')}.pdf`);
      
      if (!customData) {
        saveLetterToHistory('Downloaded');
      }
    }
    return doc;
  };

  // Save generated letter record to localStorage
  const saveLetterToHistory = (statusType) => {
    const selectedTemplate = templates.find(t => t.id === template) || { name: 'Offer Letter' };
    const newRecord = {
      id: 'rec_' + Date.now(),
      candidateName: formData.candidateName || 'Candidate',
      candidateEmail: formData.candidateEmail || 'N/A',
      templateId: template,
      templateName: selectedTemplate.name,
      designation: formData.designation || 'Software Engineer',
      department: formData.department || 'Engineering',
      annualCTC: formData.annualCTC || '0.00',
      joiningDate: formData.joiningDate || 'TBD',
      location: formData.location || 'Remote',
      probationPeriod: formData.probationPeriod || '6 Months',
      monthlyBasic: formData.monthlyBasic || '0.00',
      monthlyHRA: formData.monthlyHRA || '0.00',
      monthlyAllowance: formData.monthlyAllowance || '0.00',
      createdDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: statusType
    };

    const updated = [newRecord, ...recentLetters];
    setRecentLetters(updated);
    localStorage.setItem('myfasthr_recent_letters', JSON.stringify(updated));
  };

  const handleSendEmail = async () => {
    if (!formData.candidateEmail) {
      alert('Please enter candidate email address first.');
      return;
    }
    setLoading(true);
    try {
      const doc = generatePDF(null, false);
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const filename = `Offer_Letter_${(formData.candidateName || 'Candidate').replace(/\s+/g, '_')}.pdf`;
      
      await api.post('/employees/send-offer-letter', {
        to: formData.candidateEmail,
        name: formData.candidateName,
        designation: formData.designation,
        pdfBase64,
        filename
      });

      saveLetterToHistory('Shared via Email');
      alert(`Offer letter sent successfully to ${formData.candidateEmail}`);
    } catch (err) {
      console.error('Failed to send offer letter via email', err);
      alert(err.response?.data?.message || 'Failed to send email. Please check your SMTP settings or candidate email.');
    } finally {
      setLoading(false);
    }
  };

  // Create a Custom Template
  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTempName || !newTempDesc) {
      alert('Please fill out the template name and description.');
      return;
    }

    const uniqueId = 'custom_' + Date.now();
    const colorMap = {
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    const newTemplateObj = {
      id: uniqueId,
      name: newTempName,
      description: newTempDesc,
      iconName: newTempIcon,
      color: colorMap[newTempColor] || colorMap.indigo,
      body: newTempBody
    };

    // Save custom templates
    const customOnly = (() => {
      const saved = localStorage.getItem('myfasthr_letter_templates');
      if (saved) {
        try { return [...JSON.parse(saved), newTemplateObj]; } catch (e) { return [newTemplateObj]; }
      }
      return [newTemplateObj];
    })();

    localStorage.setItem('myfasthr_letter_templates', JSON.stringify(customOnly));
    setTemplates([...defaultTemplates, ...customOnly]);

    // Auto-select new template
    selectTemplateAndSyncBody(uniqueId, [...defaultTemplates, ...customOnly]);
    
    // Clear inputs and close
    setNewTempName('');
    setNewTempDesc('');
    setShowNewTemplateModal(false);
    alert(`Successfully created custom template: ${newTempName}!`);
  };

  // Delete a recent letter from history
  const handleDeleteRecent = (id) => {
    const updated = recentLetters.filter(l => l.id !== id);
    setRecentLetters(updated);
    localStorage.setItem('myfasthr_recent_letters', JSON.stringify(updated));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Filtered recent letters inside drawer
  const filteredRecent = recentLetters.filter(l => 
    l.candidateName.toLowerCase().includes(recentSearchQuery.toLowerCase()) ||
    l.designation.toLowerCase().includes(recentSearchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen font-outfit relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 select-none">
              <FileText size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Generate <span className="text-indigo-600">Letter</span></h1>
          </div>
          <p className="text-slate-500 font-medium">Create high-fidelity professional letters in seconds.</p>
        </div>
        
        {/* ACTION BUTTONS (Recent Letters & New Template) */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRecentLetters(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm cursor-pointer active:scale-95 select-none"
          >
            <Clock size={16} />
            Recent Letters
          </button>
          <button 
            onClick={() => setShowBrandingModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm cursor-pointer active:scale-95 select-none"
          >
            <Palette size={16} className="text-indigo-500" />
            Branding Hub
          </button>
          <button 
            onClick={() => setShowNewTemplateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4361ee] text-white rounded-xl text-sm font-black hover:bg-[#344ed1] transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-95 select-none"
          >
            <Plus size={16} />
            New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Steps */}
        <div className="lg:col-span-3 space-y-4">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all cursor-default ${
                currentStep === step.id 
                ? 'bg-white shadow-xl shadow-slate-100 border border-indigo-100' 
                : currentStep > step.id ? 'opacity-80' : 'opacity-50 grayscale'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                currentStep === step.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {currentStep > step.id ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest leading-none mb-1 ${
                  currentStep === step.id ? 'text-indigo-600' : 'text-slate-400'
                }`}>Step 0{step.id}</p>
                <p className="text-sm font-bold text-slate-800">{step.name}</p>
              </div>
              {currentStep === step.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"
                />
              )}
            </div>
          ))}

          <div className="mt-10 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-white shadow-sm">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 text-indigo-600">
                <Sparkles size={20} />
             </div>
             <h4 className="text-sm font-black text-slate-800 mb-2">Smart Generation</h4>
             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Our AI-powered system automatically calculates salary components and ensures legal compliance.
             </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-100 border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
            <div className="flex-1 p-8 md:p-12">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Select a Template</h2>
                      <p className="text-slate-500 font-medium text-sm">Choose the type of letter you want to generate for the candidate.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {templates.map((t) => {
                        const IconComponent = iconMap[t.iconName] || FileText;
                        return (
                          <div 
                            key={t.id}
                            onClick={() => selectTemplateAndSyncBody(t.id)}
                            className={`group p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                              template === t.id 
                              ? 'border-indigo-600 bg-indigo-50/30' 
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${t.color}`}>
                              <IconComponent size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">{t.name}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{t.description}</p>
                            
                            {template === t.id && (
                              <div className="absolute top-4 right-4 text-indigo-600">
                                <CheckCircle2 size={24} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Recipient Information</h2>
                      <p className="text-slate-500 font-medium text-sm">Search for an existing profile or enter details manually.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Search Candidate */}
                      <div className="relative">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Search Candidate</label>
                         <div className="relative">
                           <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                              <Search size={20} />
                           </div>
                           <input 
                              type="text"
                              placeholder="Search candidate by name or email..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none"
                           />
                           
                           {searchResults.length > 0 && (
                              <div className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50">
                                 {searchResults.map(emp => (
                                   <button 
                                     key={emp.id}
                                     onClick={() => handleEmployeeSelect(emp)}
                                     className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left"
                                   >
                                     <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                       {(emp.first_name || emp.name || 'EM').substring(0, 2)}
                                     </div>
                                     <div>
                                       <p className="text-sm font-black text-slate-800">{emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : emp.name}</p>
                                       <p className="text-[10px] text-slate-400 font-bold">{emp.email} • {emp.designation}</p>
                                     </div>
                                   </button>
                                 ))}
                              </div>
                           )}
                         </div>
                      </div>

                      {/* Select Dropdown */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Select Existing Employee</label>
                        <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                            <User size={20} />
                          </div>
                          <select
                            onChange={(e) => {
                              const empId = e.target.value;
                              if (empId) {
                                const emp = employeesList.find(x => x.id.toString() === empId.toString());
                                if (emp) {
                                  handleEmployeeSelect(emp);
                                }
                              }
                            }}
                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-10 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none appearance-none cursor-pointer"
                            defaultValue=""
                          >
                            <option value="">-- Choose Existing Employee --</option>
                            {employeesList.map(emp => {
                              const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name || emp.full_name;
                              return (
                                <option key={emp.id} value={emp.id}>
                                  {name} ({emp.designation || 'Employee'})
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Salutation</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                            <User size={18} />
                          </div>
                          <select
                            value={formData.candidateSalutation || 'MR.'}
                            onChange={(e) => setFormData({...formData, candidateSalutation: e.target.value})}
                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-10 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none appearance-none cursor-pointer"
                          >
                            <option value="MR.">MR.</option>
                            <option value="MS.">MS.</option>
                            <option value="MRS.">MRS.</option>
                            <option value="DR.">DR.</option>
                          </select>
                        </div>
                      </div>

                      <InputField 
                        label="Full Name" 
                        icon={User} 
                        value={formData.candidateName}
                        onChange={(v) => setFormData({...formData, candidateName: v})}
                        placeholder="e.g. Muralidhar Manawat"
                      />
                      
                      <InputField 
                        label="Email Address" 
                        icon={Mail} 
                        value={formData.candidateEmail}
                        onChange={(v) => setFormData({...formData, candidateEmail: v})}
                        placeholder="e.g. candidate@gmail.com"
                      />
                      
                      <InputField 
                        label="Phone Number" 
                        icon={Phone} 
                        value={formData.candidatePhone}
                        onChange={(v) => setFormData({...formData, candidatePhone: v})}
                        placeholder="e.g. 9660842142"
                      />

                      <InputField 
                        label="Aadhaar Number" 
                        icon={ShieldCheck} 
                        value={formData.candidateAadhaar}
                        onChange={(v) => setFormData({...formData, candidateAadhaar: v})}
                        placeholder="e.g. 2869 8744 9373"
                      />
                      
                      <InputField 
                        label="PAN Number" 
                        icon={FileText} 
                        value={formData.candidatePan}
                        onChange={(v) => setFormData({...formData, candidatePan: v})}
                        placeholder="e.g. EHAPM9476B"
                      />

                      <InputField 
                        label="Designation" 
                        icon={Briefcase} 
                        value={formData.designation}
                        onChange={(v) => setFormData({...formData, designation: v})}
                        placeholder="e.g. FLOOR MANAGER"
                      />

                      <div className="md:col-span-2">
                        <InputField 
                          label="Candidate Address" 
                          icon={MapPin} 
                          value={formData.candidateAddress}
                          onChange={(v) => setFormData({...formData, candidateAddress: v})}
                          placeholder="e.g. WARD NO. 04, KALALIYO KI KOTHI, CHOMU, JAIPUR, RAJASTHAN - 303702"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Offer Configuration</h2>
                      <p className="text-slate-500 font-medium text-sm">Define the professional and financial terms of the offer.</p>
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label="Annual CTC (Gross)" 
                          icon={IndianRupee} 
                          type="number"
                          value={formData.annualCTC}
                          onChange={(v) => calculateSalary(v)}
                          placeholder="e.g. 504000"
                        />
                        <InputField 
                          label="Monthly CTC" 
                          icon={IndianRupee} 
                          type="number"
                          value={formData.monthlyCTC}
                          onChange={(v) => handleMonthlyCTCChange(v)}
                          placeholder="e.g. 42000"
                        />
                      </div>

                      <InputField 
                        label="Monthly CTC (In Words)" 
                        icon={FileText} 
                        value={formData.monthlyCTCWords}
                        onChange={(v) => setFormData({...formData, monthlyCTCWords: v})}
                        placeholder="e.g. Forty Two Thousand Rupees Only"
                      />

                      <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                           <IndianRupee size={16} className="text-indigo-600" />
                           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Monthly Breakdown (Auto)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <SalaryCard label="Basic Salary" value={formData.monthlyBasic} />
                           <SalaryCard label="HRA" value={formData.monthlyHRA} />
                           <SalaryCard label="Special Allowance" value={formData.monthlyAllowance} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label="Probation Period" 
                          icon={Clock} 
                          value={formData.probationPeriod}
                          onChange={(v) => setFormData({...formData, probationPeriod: v})}
                        />
                        <InputField 
                          label="Joining Date" 
                          icon={Calendar} 
                          type="date"
                          value={formData.joiningDate}
                          onChange={(v) => setFormData({...formData, joiningDate: v})}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label="Job Location" 
                          icon={MapPin} 
                          value={formData.location}
                          onChange={(v) => setFormData({...formData, location: v})}
                        />
                        <InputField 
                          label="Offer Expiry" 
                          icon={Clock} 
                          type="date"
                          value={formData.offerExpiry}
                          onChange={(v) => setFormData({...formData, offerExpiry: v})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reporting Manager</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                              <User size={18} />
                            </div>
                            <select
                              value={managersList.some(m => `${m.first_name || ''} ${m.last_name || ''}`.trim() === formData.reportTo) ? formData.reportTo : (formData.reportTo ? "custom" : "")}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "custom") {
                                  setFormData({ ...formData, reportTo: '' });
                                } else {
                                  setFormData({ ...formData, reportTo: val });
                                }
                              }}
                              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-10 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none appearance-none cursor-pointer"
                            >
                              <option value="">-- Choose Existing Manager --</option>
                              {managersList.map(mgr => {
                                const name = `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim() || mgr.name;
                                return (
                                  <option key={mgr.id} value={name}>
                                    {name} ({mgr.designation || 'Manager'})
                                  </option>
                                );
                              })}
                              <option value="custom">✍️ Type Custom Manager...</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* Show manual text field if "custom" is selected or if the current value is not in the list of managers */}
                          {(!formData.reportTo || !managersList.some(m => `${m.first_name || ''} ${m.last_name || ''}`.trim() === formData.reportTo)) && (
                            <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                                <Edit3 size={18} />
                              </div>
                              <input
                                type="text"
                                value={formData.reportTo}
                                onChange={(e) => setFormData({ ...formData, reportTo: e.target.value })}
                                placeholder="Enter reporting manager name..."
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Special Clauses / Notes</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                            <Edit3 size={18} />
                          </div>
                          <textarea 
                            value={formData.customNotes}
                            onChange={(e) => setFormData({...formData, customNotes: e.target.value})}
                            className="w-full min-h-[100px] bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none resize-none"
                            placeholder="Add any specific terms, non-compete clauses, or personal messages..."
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Final Review</h2>
                        <p className="text-slate-500 font-medium text-sm">Preview the letter before generating the final document.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => generatePDF(null)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm cursor-pointer" title="Download PDF">
                           <Download size={20} />
                        </button>
                        <button onClick={() => { generatePDF(null); alert('Document printed successfully!'); }} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all shadow-sm cursor-pointer" title="Print Document">
                           <Printer size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                      {/* Left: Content & Branding Customizer */}
                      <div className="xl:col-span-5 space-y-6">
                        {/* Tab Headers */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setActiveSettingsTab('draft')}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              activeSettingsTab === 'draft' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Draft Editor
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSettingsTab('branding')}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              activeSettingsTab === 'branding' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Branding & Logo
                          </button>
                        </div>

                        {activeSettingsTab === 'draft' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Letter Body Text</label>
                              <button
                                type="button"
                                onClick={handleSaveTemplateChanges}
                                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                              >
                                💾 Save as Default
                              </button>
                            </div>
                            
                            <textarea
                              value={customBodyText}
                              onChange={(e) => setCustomBodyText(e.target.value)}
                              rows="12"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-400 outline-none transition-all resize-y leading-relaxed font-mono"
                            />

                            {/* Placeholders Pills */}
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Click to insert placeholder variable:</p>
                              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1 bg-slate-50 border border-slate-100 rounded-xl">
                                {[
                                  { label: 'Candidate Name', code: '{{candidate_name}}' },
                                  { label: 'Candidate Email', code: '{{candidate_email}}' },
                                  { label: 'Candidate Phone', code: '{{candidate_phone}}' },
                                  { label: 'Designation', code: '{{designation}}' },
                                  { label: 'Department', code: '{{department}}' },
                                  { label: 'Annual CTC', code: '{{annual_ctc}}' },
                                  { label: 'Monthly Basic', code: '{{monthly_basic}}' },
                                  { label: 'Monthly HRA', code: '{{monthly_hra}}' },
                                  { label: 'Monthly Allowance', code: '{{monthly_allowance}}' },
                                  { label: 'Joining Date', code: '{{joining_date}}' },
                                  { label: 'Job Location', code: '{{job_location}}' },
                                  { label: 'Report To', code: '{{report_to}}' },
                                  { label: 'Probation Period', code: '{{probation_period}}' },
                                  { label: 'Offer Expiry', code: '{{offer_expiry}}' },
                                  { label: 'Company Name', code: '{{company_name}}' }
                                ].map((pill) => (
                                  <button
                                    key={pill.code}
                                    type="button"
                                    onClick={() => setCustomBodyText(prev => prev + pill.code)}
                                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded-lg text-[9px] font-black text-slate-600 hover:text-indigo-600 transition-all cursor-pointer"
                                  >
                                    {pill.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeSettingsTab === 'branding' && (
                          <div className="space-y-5">
                            {/* Logo and Signature row */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Company Logo</label>
                                <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 relative group">
                                  {uploadedLogo ? (
                                    <div className="relative inline-block">
                                      <img src={uploadedLogo} className="h-10 mx-auto object-contain rounded" alt="Logo preview" />
                                      <button
                                        type="button"
                                        onClick={() => { setUploadedLogo(''); localStorage.removeItem('myfasthr_company_logo'); }}
                                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors flex items-center justify-center cursor-pointer"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="cursor-pointer block py-1.5">
                                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Upload Logo</span>
                                      <span className="text-[8px] text-slate-400 font-bold block mt-0.5">PNG / JPG up to 1MB</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              setUploadedLogo(reader.result);
                                              localStorage.setItem('myfasthr_company_logo', reader.result);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Authorized Signature</label>
                                <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 relative group">
                                  {uploadedSignature ? (
                                    <div className="relative inline-block">
                                      <img src={uploadedSignature} className="h-10 mx-auto object-contain rounded" alt="Signature preview" />
                                      <button
                                        type="button"
                                        onClick={() => { setUploadedSignature(''); localStorage.removeItem('myfasthr_authorized_signature'); }}
                                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors flex items-center justify-center cursor-pointer"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="cursor-pointer block py-1.5">
                                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Upload Signature</span>
                                      <span className="text-[8px] text-slate-400 font-bold block mt-0.5">PNG / JPG transparent</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              setUploadedSignature(reader.result);
                                              localStorage.setItem('myfasthr_authorized_signature', reader.result);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Accent Color picker */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Brand Accent Color</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={brandColor}
                                  onChange={(e) => setBrandColor(e.target.value)}
                                  className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0.5"
                                />
                                <div className="flex gap-1.5">
                                  {['#4361ee', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#1e293b'].map((colorCode) => (
                                    <button
                                      key={colorCode}
                                      type="button"
                                      onClick={() => setBrandColor(colorCode)}
                                      className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                      style={{ backgroundColor: colorCode }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Theme Preset */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Layout Design Style</label>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { key: 'modern', label: 'Modern Accent' },
                                  { key: 'classic', label: 'Classic Border' },
                                  { key: 'minimalist', label: 'Minimalist' }
                                ].map((styleObj) => (
                                  <button
                                    key={styleObj.key}
                                    type="button"
                                    onClick={() => setThemeStyle(styleObj.key)}
                                    className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      themeStyle === styleObj.key
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                    }`}
                                  >
                                    {styleObj.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Company metadata form */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Details</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Name</span>
                                  <input
                                    type="text"
                                    value={companyDetails.name}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Signatory Name</span>
                                  <input
                                    type="text"
                                    value={companyDetails.signatoryName}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, signatoryName: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Signatory Title</span>
                                  <input
                                    type="text"
                                    value={companyDetails.signatoryTitle}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, signatoryTitle: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Email</span>
                                  <input
                                    type="text"
                                    value={companyDetails.email}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Phone</span>
                                  <input
                                    type="text"
                                    value={companyDetails.phone || ''}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">GSTN</span>
                                  <input
                                    type="text"
                                    value={companyDetails.gstn || ''}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, gstn: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">MSME No.</span>
                                  <input
                                    type="text"
                                    value={companyDetails.msme || ''}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, msme: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Address</span>
                                  <input
                                    type="text"
                                    value={companyDetails.address}
                                    onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })}
                                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Realistic Page Preview Canvas */}
                      <div className="xl:col-span-7 bg-slate-100 p-6 rounded-3xl border border-slate-200 overflow-y-auto max-h-[720px] custom-scrollbar">
                        <div 
                          className="bg-white shadow-2xl p-8 max-w-[21cm] min-h-[29.7cm] mx-auto relative text-left text-slate-800 flex flex-col font-outfit select-none overflow-hidden"
                          style={{
                            borderLeft: themeStyle === 'modern' ? `5px solid ${brandColor}` : undefined,
                            border: themeStyle === 'classic' ? '10px double #e2e8f0' : undefined
                          }}
                        >
                          {/* Creative Theme Header Accent */}
                          {themeStyle === 'creative' && (
                            <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: brandColor }} />
                          )}

                          {/* Logo and Address Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="text-left max-w-[450px]">
                              <h1 className="text-xl font-black text-[#ff0000] tracking-wide uppercase leading-none mb-1">
                                {companyDetails.name || 'HOTEL HIGHWAY KING'}
                              </h1>
                              <p className="text-[8.5px] font-bold text-black leading-tight">
                                {companyDetails.address}
                              </p>
                            </div>
                            <div>
                              {uploadedLogo ? (
                                <img src={uploadedLogo} className="h-10 max-w-[100px] object-contain rounded" alt="Company Logo" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white bg-rose-600">
                                    {(companyDetails.name || 'H').charAt(0)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dividing Line */}
                          <div className="h-[2px] w-full bg-[#ff0000] mb-4" />

                          {/* Title */}
                          {template === 'hotel_highway_king_offer' ? (
                            <>
                              {/* Left Aligned Issue Date */}
                              <div className="text-[9px] font-bold text-slate-900 mb-4 text-left">
                                Date: {formatDateToOrdinal(new Date())}
                              </div>
                              
                              {/* Recipient block */}
                              <div className="text-[9px] text-slate-900 leading-tight mb-4 text-left">
                                <p className="font-bold">To,</p>
                                <p className="font-bold">{formData.candidateSalutation || 'MR.'} {(formData.candidateName || 'Candidate').toUpperCase()}</p>
                                <p className="font-medium max-w-[450px]">{formData.candidateAddress || '[Candidate Address]'}</p>
                                <p className="mt-1"><span className="font-bold">Aadhaar – </span>{formData.candidateAadhaar || '[Aadhaar Number]'}</p>
                                <p><span className="font-bold">PAN – </span>{formData.candidatePan || '[PAN Number]'}</p>
                                <p><span className="font-bold">Email – </span><span className="text-blue-600 underline">{formData.candidateEmail || '[Candidate Email]'}</span></p>
                                <p><span className="font-bold">Contact – </span>{formData.candidatePhone || '[Candidate Phone]'}</p>
                              </div>
                              
                              {/* Subject block */}
                              <div className="text-[9.5px] font-bold text-slate-900 underline mb-4 text-left uppercase">
                                SUBJECT: OFFER LETTER FOR THE POST OF "{(formData.designation || 'Floor Manager').toUpperCase()}"
                              </div>
                              
                              {/* Salutation block */}
                              <div className="text-[9px] text-slate-900 mb-4 text-left">
                                <p className="font-medium">Dear,</p>
                                <p className="font-bold">{formData.candidateSalutation || 'MR.'} {(formData.candidateName || 'Candidate').toUpperCase()}</p>
                              </div>
                            </>
                          ) : (
                            /* Title */
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase">
                                {templates.find(t => t.id === template)?.name || 'OFFER LETTER'}
                              </h3>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-400 font-bold block leading-none">Date</span>
                                <span className="text-[9px] font-bold text-slate-700">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            </div>
                          )}

                          {/* Resolved Content Body */}
                          <div className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed mb-6 font-medium flex-1 text-left">
                            {resolveTemplate(customBodyText)}
                          </div>

                          {/* Signature block */}
                          <div className="mt-auto border-t border-slate-100 pt-6 mb-4">
                            <p className="text-[9px] font-medium text-slate-700">Thanking you,</p>
                            <p className="text-[9px] font-medium text-slate-700">Yours sincerely,</p>
                            <div className="h-14 flex items-center my-2">
                              {uploadedSignature ? (
                                <img src={uploadedSignature} className="h-12 object-contain rounded" alt="Signatory Signature" />
                              ) : (
                                <span className="text-[8px] font-semibold italic text-slate-300">(Authorized Signatory)</span>
                              )}
                            </div>
                            <p className="text-[9px] font-black text-slate-900 uppercase">FOR {companyDetails.name}</p>
                            <p className="text-[9px] font-black text-slate-700 uppercase mt-1">{companyDetails.signatoryTitle}</p>
                            <p className="text-[9px] font-black text-slate-700 uppercase">{companyDetails.signatoryName}</p>
                          </div>

                          {/* Dynamic Footer Line */}
                          <div className="border-t-4 pt-3 text-center leading-normal text-[9px] font-bold text-slate-700 mt-4" style={{ borderTopColor: '#ff0000' }}>
                            <div>
                              Contact - {companyDetails.phone} | {companyDetails.email} 
                              {companyDetails.gstn && ` | GSTN – ${companyDetails.gstn}`} 
                              {companyDetails.msme && ` | MSME – ${companyDetails.msme}`}
                            </div>
                            <div className="text-slate-500 font-medium text-[8px] mt-0.5">
                              {companyDetails.address}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <button 
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer ${
                  currentStep === 1 ? 'opacity-0 invisible' : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <ChevronLeft size={18} />
                Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep < 4 ? (
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3.5 bg-[#4361ee] text-white rounded-2xl text-sm font-black hover:bg-[#344ed1] transition-all shadow-xl shadow-indigo-100 group cursor-pointer"
                  >
                    Continue
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSendEmail}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-[20px] text-sm font-black hover:bg-slate-50 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send via Email'}
                      {!loading && <Mail size={18} />}
                    </button>
                    <button 
                      onClick={() => generatePDF(null)}
                      className="flex items-center gap-2 px-10 py-4 bg-[#4361ee] text-white rounded-[20px] text-sm font-black hover:bg-[#344ed1] transition-all shadow-xl shadow-indigo-100 group cursor-pointer"
                    >
                      <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                      Download PDF
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-12 flex items-center justify-center gap-8 border-t border-slate-100 pt-10">
         <div className="flex items-center gap-2 text-slate-400 select-none">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">ISO 27001 Certified</span>
         </div>
         <div className="flex items-center gap-2 text-slate-400 select-none">
            <Info size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Legal Compliant Templates</span>
         </div>
         <div className="flex items-center gap-2 text-slate-400 select-none">
            <Layers size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Saved History</span>
         </div>
      </div>

      {/* ======================================================== */}
      {/* --- RECENT LETTERS DRAWER (SLIDES FROM RIGHT) --- */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showRecentLetters && (
          <div className="fixed inset-0 z-50 overflow-hidden font-outfit">
            
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRecentLetters(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col"
              >
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Recent Generated Letters</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Manage and download your historical letters.</p>
                  </div>
                  <button 
                    onClick={() => setShowRecentLetters(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Search Bar inside Drawer */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={recentSearchQuery}
                      onChange={(e) => setRecentSearchQuery(e.target.value)}
                      placeholder="Filter by candidate or job role..."
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {filteredRecent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                      <AlertCircle size={24} className="mb-2 text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-wider">No matching letters found</p>
                    </div>
                  ) : (
                    filteredRecent.map((letter) => (
                      <div 
                        key={letter.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs hover:border-indigo-100 transition-all group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="leading-tight overflow-hidden">
                            <h4 className="text-sm font-black text-slate-800 truncate">{letter.candidateName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">{letter.designation} ({letter.department})</p>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                            letter.status === 'Shared via Email' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}>
                            {letter.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 py-2 border-y border-slate-50 mb-3 text-[10px]">
                          <div>
                            <span className="text-slate-400 font-bold uppercase tracking-wider">CTC:</span>
                            <span className="text-slate-700 font-black ml-1">₹{letter.annualCTC}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Date:</span>
                            <span className="text-slate-700 font-bold ml-1">{letter.createdDate}</span>
                          </div>
                        </div>

                        {/* Action buttons inside drawer cards */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => generatePDF(letter)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded-lg py-1.5 text-[9px] font-black text-slate-600 hover:text-indigo-600 uppercase tracking-widest transition-all cursor-pointer"
                          >
                            <Download size={10} />
                            Download Again
                          </button>
                          <button 
                            onClick={() => handleDeleteRecent(letter.id)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* --- NEW TEMPLATE MODAL DIALOG --- */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showNewTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden font-outfit">
            
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewTemplateModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-md w-full z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-900">Create Custom Template</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Design a reusable layout for new letters.</p>
                </div>
                <button 
                  onClick={() => setShowNewTemplateModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 py-1">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Template Title</label>
                  <input 
                    type="text" 
                    required
                    value={newTempName}
                    onChange={(e) => setNewTempName(e.target.value)}
                    placeholder="e.g. Relocation Offer Letter"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Template Description</label>
                  <textarea 
                    required
                    value={newTempDesc}
                    onChange={(e) => setNewTempDesc(e.target.value)}
                    placeholder="Brief summary of the target candidate pool or employment format..."
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Select Vector Icon</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['FileText', 'ShieldCheck', 'Sparkles', 'Briefcase'].map((icoName) => {
                      const VectorComp = iconMap[icoName];
                      return (
                        <button
                          key={icoName}
                          type="button"
                          onClick={() => setNewTempIcon(icoName)}
                          className={`py-2 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            newTempIcon === icoName
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <VectorComp size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Color Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'indigo', hex: '#4361ee', label: 'Indigo' },
                      { key: 'emerald', hex: '#10b981', label: 'Emerald' },
                      { key: 'purple', hex: '#a855f7', label: 'Purple' },
                      { key: 'amber', hex: '#f59e0b', label: 'Amber' }
                    ].map((col) => (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => setNewTempColor(col.key)}
                        className={`py-1.5 rounded-xl border text-[9px] font-black uppercase transition-all cursor-pointer ${
                          newTempColor === col.key
                          ? 'border-slate-800 font-extrabold shadow-sm'
                          : 'border-slate-200 text-slate-400'
                        }`}
                        style={{ color: col.hex }}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Template Letter Body</label>
                    <label className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest cursor-pointer flex items-center gap-1">
                      📂 Import .txt Template
                      <input 
                        type="file" 
                        accept=".txt" 
                        onChange={handleImportTemplateFile} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <textarea 
                    required
                    value={newTempBody}
                    onChange={(e) => setNewTempBody(e.target.value)}
                    placeholder="Enter template body text here or import a .txt template file..."
                    rows="6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-y leading-relaxed"
                  />
                  
                  {/* Clickable Placeholders Grid */}
                  <div className="space-y-1 mt-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Click variables below to insert them:</p>
                    <div className="flex flex-wrap gap-1 p-1 bg-slate-50 border border-slate-100 rounded-lg max-h-[85px] overflow-y-auto">
                      {[
                        { label: 'Name', code: '{{candidate_name}}' },
                        { label: 'Email', code: '{{candidate_email}}' },
                        { label: 'Phone', code: '{{candidate_phone}}' },
                        { label: 'Role', code: '{{designation}}' },
                        { label: 'Dept', code: '{{department}}' },
                        { label: 'Annual CTC', code: '{{annual_ctc}}' },
                        { label: 'Basic', code: '{{monthly_basic}}' },
                        { label: 'HRA', code: '{{monthly_hra}}' },
                        { label: 'Allowance', code: '{{monthly_allowance}}' },
                        { label: 'Join Date', code: '{{joining_date}}' },
                        { label: 'Location', code: '{{job_location}}' },
                        { label: 'Manager', code: '{{report_to}}' },
                        { label: 'Probation', code: '{{probation_period}}' },
                        { label: 'Expiry', code: '{{offer_expiry}}' },
                        { label: 'Company', code: '{{company_name}}' }
                      ].map((pill) => (
                        <button
                          key={pill.code}
                          type="button"
                          onClick={() => setNewTempBody(prev => prev + pill.code)}
                          className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded text-[8px] font-black text-slate-600 hover:text-indigo-600 transition-all cursor-pointer"
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

                <div className="flex gap-3 pt-3 mt-4 border-t border-slate-100 flex-shrink-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowNewTemplateModal(false)}
                    className="w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-[#4361ee] hover:bg-[#344ed1] text-white text-[10px] font-black uppercase py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    Create Template
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* --- COMPANY BRANDING HUB MODAL --- */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showBrandingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden font-outfit">
            
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBrandingModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-lg w-full z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Palette size={18} className="text-indigo-600" />
                    Company Branding Hub
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Customize your letterhead, logos, signatures & design styles.</p>
                </div>
                <button 
                  onClick={() => setShowBrandingModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1.5 py-1">
                {/* Logo and Signature Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Company Logo</label>
                    <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 relative group min-h-[72px] flex items-center justify-center">
                      {uploadedLogo ? (
                        <div className="relative inline-block">
                          <img src={uploadedLogo} className="h-10 mx-auto object-contain rounded" alt="Logo preview" />
                          <button
                            type="button"
                            onClick={() => { setUploadedLogo(''); localStorage.removeItem('myfasthr_company_logo'); }}
                            className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-1">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">Upload Logo</span>
                          <span className="text-[8px] text-slate-400 font-bold block mt-0.5">PNG / JPG up to 1MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setUploadedLogo(reader.result);
                                  localStorage.setItem('myfasthr_company_logo', reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Authorized Signature</label>
                    <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 relative group min-h-[72px] flex items-center justify-center">
                      {uploadedSignature ? (
                        <div className="relative inline-block">
                          <img src={uploadedSignature} className="h-10 mx-auto object-contain rounded" alt="Signature preview" />
                          <button
                            type="button"
                            onClick={() => { setUploadedSignature(''); localStorage.removeItem('myfasthr_authorized_signature'); }}
                            className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-1">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">Upload Signature</span>
                          <span className="text-[8px] text-slate-400 font-bold block mt-0.5">PNG / JPG transparent</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setUploadedSignature(reader.result);
                                  localStorage.setItem('myfasthr_authorized_signature', reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accent Color picker */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Brand Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0.5"
                    />
                    <div className="flex gap-1.5">
                      {['#4361ee', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#1e293b'].map((colorCode) => (
                        <button
                          key={colorCode}
                          type="button"
                          onClick={() => setBrandColor(colorCode)}
                          className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                          style={{ backgroundColor: colorCode }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Theme Preset */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Layout Design Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'modern', label: 'Modern Accent' },
                      { key: 'classic', label: 'Classic Border' },
                      { key: 'minimalist', label: 'Minimalist' }
                    ].map((styleObj) => (
                      <button
                        key={styleObj.key}
                        type="button"
                        onClick={() => setThemeStyle(styleObj.key)}
                        className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          themeStyle === styleObj.key
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {styleObj.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Metadata Form */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Contact Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Name</span>
                      <input
                        type="text"
                        value={companyDetails.name}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Signatory Name</span>
                      <input
                        type="text"
                        value={companyDetails.signatoryName}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, signatoryName: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Signatory Title</span>
                      <input
                        type="text"
                        value={companyDetails.signatoryTitle}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, signatoryTitle: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Email</span>
                      <input
                        type="text"
                        value={companyDetails.email}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Phone</span>
                      <input
                        type="text"
                        value={companyDetails.phone || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                        placeholder="e.g. +91 9876543210"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">GSTN</span>
                      <input
                        type="text"
                        value={companyDetails.gstn || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, gstn: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">MSME No.</span>
                      <input
                        type="text"
                        value={companyDetails.msme || ''}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, msme: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <span className="text-[8px] text-slate-400 font-black uppercase ml-0.5">Company Address</span>
                      <input
                        type="text"
                        value={companyDetails.address}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })}
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 mt-4 border-t border-slate-100 flex-shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowBrandingModal(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center"
                >
                  Save & Apply Branding
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none"
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
    </div>
  </div>
);

const SalaryCard = ({ label, value }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-black text-slate-800">₹{value || '0.00'}</p>
  </div>
);

export default LetterGenerator;
