import React, { useState, useEffect } from 'react';
import { 
    Home, Zap, LayoutGrid, Radio, ArrowRight, AlertCircle, 
    Download, MousePointer2, Info, Coffee, CreditCard, 
    CalendarDays, FileText, FileSpreadsheet, ShieldCheck,
    ChevronLeft, MapPin, RefreshCw, X, Search, ChevronDown,
    TrendingUp, Lock, Eye, EyeOff, Calendar, HelpCircle, Users, User,
    Send, ClipboardList, Globe, ChevronUp, Hand,
    Wallet, Headphones, Edit3, Plane, ThumbsUp, MessageSquare, Plus, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import RegularizationView from './RegularizationView';
import AttendanceInfoView from './AttendanceInfoView';



const ActionCard = ({ icon: Icon, iconBg, iconColor, label }) => (
    <div className="bg-white rounded-[16px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-50 active:scale-95 transition-transform cursor-pointer">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
            <Icon size={22} className={iconColor} strokeWidth={1.5} />
        </div>
        <span className="text-slate-700 font-semibold text-[15px]">{label}</span>
    </div>
);

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [metrics, setMetrics] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [testHour, setTestHour] = useState(null);
    const [birthdayEmps, setBirthdayEmps] = useState([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [latestSlip, setLatestSlip] = useState(null);
    
    // Determine active tab from URL query params
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get('tab') || 'home';

    const [showSalary, setShowSalary] = useState(false);

    const getMonthName = (monthNumber) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('en-US', { month: 'short' });
    };

    const handleDownloadSlip = async (id, monthName, year) => {
        try {
            const token = localStorage.getItem('auth_token') || 'test.admin.token';
            const isProd = import.meta.env.PROD;
            const baseUrl = isProd ? '/api' : 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/payroll/download-slip/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip-${monthName}-${year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download payslip: ' + err.message);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchMetrics();
        fetchLiveTasks();
        fetchKudos();
        fetchAnnouncements();
        return () => clearInterval(timer);
    }, []);

    const fetchMetrics = async () => {
        try {
            const data = await api.get('/analytics/metrics');
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch analytics metrics', err);
        }

        try {
            const slips = await api.get('/payroll/my-slips');
            if (slips && slips.length > 0) {
                const sortedSlips = [...slips].sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });
                setLatestSlip(sortedSlips[0]);
            }
        } catch (slipErr) {
            console.error('Failed to fetch slips for dashboard', slipErr);
        }

        try {
            const emps = await api.get('/employees');
            if (Array.isArray(emps)) {
                setAllEmployees(emps);
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentDate = today.getDate();
                
                const todayBirthdays = emps.filter(e => {
                    if (!e.date_of_birth) return false;
                    const dob = new Date(e.date_of_birth);
                    return dob.getMonth() === currentMonth && dob.getDate() === currentDate;
                });
                setBirthdayEmps(todayBirthdays);
                
                const upcoming = emps
                    .filter(e => {
                        if (!e.date_of_birth) return false;
                        const dob = new Date(e.date_of_birth);
                        if (dob.getMonth() === currentMonth && dob.getDate() === currentDate) return false;
                        return true;
                    })
                    .map(e => {
                        const dob = new Date(e.date_of_birth);
                        let bdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                        if (bdayThisYear < today) {
                            bdayThisYear.setFullYear(today.getFullYear() + 1);
                        }
                        const daysLeft = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));
                        return { ...e, daysLeft, nextBdayDate: bdayThisYear };
                    })
                    .filter(e => e.daysLeft <= 30)
                    .sort((a, b) => a.daysLeft - b.daysLeft);
                setUpcomingBirthdays(upcoming);
            }
        } catch (err) {
            console.error('Failed to fetch employee list', err);
        }
    };

    const [punchFlowState, setPunchFlowState] = useState(null);
    const [punchLocation, setPunchLocation] = useState('');
    const [punchRemarks, setPunchRemarks] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Live Geolocation States
    const [locationCoords, setLocationCoords] = useState(null);
    const [locationAccuracy, setLocationAccuracy] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    const fetchLiveLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by this browser.");
            return;
        }
        setLocationLoading(true);
        setLocationError(null);
        setLocationCoords(null);
        setLocationAccuracy(null);

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const successCallback = (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setLocationCoords({ latitude, longitude });
            setLocationAccuracy(accuracy);
            setLocationLoading(false);
        };

        const errorCallback = (error) => {
            if (options.enableHighAccuracy) {
                console.warn("High accuracy geolocation failed. Trying low accuracy fallback...");
                options.enableHighAccuracy = false;
                // Try again with low accuracy
                navigator.geolocation.getCurrentPosition(successCallback, finalErrorCallback, options);
            } else {
                finalErrorCallback(error);
            }
        };

        const finalErrorCallback = (error) => {
            setLocationLoading(false);
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setLocationError("Location permission denied. Please allow location access in your browser settings to proceed.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    setLocationError("Location information is unavailable. Please verify GPS settings and retry.");
                    break;
                case error.TIMEOUT:
                    setLocationError("Location request timed out. Please check your signal and retry.");
                    break;
                default:
                    setLocationError("An unknown error occurred while fetching your location.");
                    break;
            }
        };

        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    };

    const handlePunchClick = () => {
        setPunchFlowState(metrics?.is_checked_in ? 'out' : 'in');
        setPunchLocation('');
        setPunchRemarks('');
        fetchLiveLocation();
    };

    const [expandedExploreCard, setExpandedExploreCard] = useState(null);
    const [showRegularization, setShowRegularization] = useState(false);
    const [showAttendanceInfo, setShowAttendanceInfo] = useState(false);
    const [userDocuments, setUserDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const fetchUserDocuments = async () => {
        try {
            setLoadingDocs(true);
            const docs = await api.get('/documents');
            setUserDocuments(docs || []);
        } catch (err) {
            console.error('Failed to fetch employee documents', err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleDownloadDoc = async (path, name) => {
        try {
            const fileUrl = `${api.defaults.baseURL.replace('/api', '')}/uploads/kyc/${path}`;
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', name);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            window.open(`${api.defaults.baseURL.replace('/api', '')}/uploads/kyc/${path}`, '_blank');
        }
    };

    // Kudos states
    const [showKudos, setShowKudos] = useState(false);
    const [kudosSent, setKudosSent] = useState(false);
    const [kudosRecipient, setKudosRecipient] = useState('');
    const [kudosBadge, setKudosBadge] = useState('Thank You');
    const [kudosMessage, setKudosMessage] = useState('');
    const [kudosList, setKudosList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [activityFilter, setActivityFilter] = useState('all');
    const [deptFilter, setDeptFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Helpdesk state
    const [showHelpdeskModal, setShowHelpdeskModal] = useState(false);
    const [faqSearchQuery, setFaqSearchQuery] = useState('');
    const [selectedFaqCategory, setSelectedFaqCategory] = useState('All');
    const [activeFaqIndex, setActiveFaqIndex] = useState(null);
    const [helpdeskTab, setHelpdeskTab] = useState('faqs');
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replies, setReplies] = useState([]);
    const [newReply, setNewReply] = useState('');
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);
    const [newTicketTitle, setNewTicketTitle] = useState('');
    const [newTicketDesc, setNewTicketDesc] = useState('');
    const [newTicketCategory, setNewTicketCategory] = useState('General');
    const [newTicketPriority, setNewTicketPriority] = useState('Medium');
    const [submittingTicket, setSubmittingTicket] = useState(false);

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const res = await api.get('/tickets');
            setTickets(res || []);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchTicketDetails = async (id) => {
        try {
            const res = await api.get(`/tickets/${id}`);
            setSelectedTicket(res?.ticket || null);
            setReplies(res?.replies || []);
        } catch (err) {
            console.error('Failed to fetch ticket details:', err);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicketTitle.trim() || !newTicketDesc.trim()) return;
        setSubmittingTicket(true);
        try {
            await api.post('/tickets', {
                title: newTicketTitle,
                description: newTicketDesc,
                category: newTicketCategory,
                priority: newTicketPriority
            });
            setNewTicketTitle('');
            setNewTicketDesc('');
            setNewTicketCategory('General');
            setNewTicketPriority('Medium');
            setShowNewTicketForm(false);
            await fetchTickets();
        } catch (err) {
            console.error('Failed to create ticket:', err);
        } finally {
            setSubmittingTicket(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!newReply.trim() || !selectedTicket) return;
        try {
            await api.post(`/tickets/${selectedTicket.id}/replies`, {
                message: newReply
            });
            setNewReply('');
            await fetchTicketDetails(selectedTicket.id);
        } catch (err) {
            console.error('Failed to send reply:', err);
        }
    };

    useEffect(() => {
        if (showHelpdeskModal && helpdeskTab === 'tickets') {
            fetchTickets();
        }
    }, [showHelpdeskModal, helpdeskTab]);

    // Announcements state
    const [announcements, setAnnouncements] = useState([]);
    
    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res || []);
        } catch (err) {
            console.error('Failed to fetch announcements:', err);
        }
    };

    const fetchKudos = async () => {
        try {
            const res = await api.get('/kudos');
            setKudosList(res || []);
        } catch (err) {
            console.error('Failed to fetch kudos list:', err);
        }
    };

    const handleSendKudos = async () => {
        if (!kudosRecipient) return alert('Please select a teammate');
        try {
            await api.post('/kudos', {
                recipient_id: parseInt(kudosRecipient),
                badge: kudosBadge,
                message: kudosMessage
            });
            setKudosSent(true);
            fetchKudos();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send Kudos');
        }
    };

    // Review tasks states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [tasks, setTasks] = useState([]);

    const fetchLiveTasks = async () => {
        try {
            const empId = parseInt(localStorage.getItem('employee_id'));
            if (!empId) return;

            const allTasks = await api.get('/tasks');
            if (Array.isArray(allTasks)) {
                // Filter tasks assigned to this employee
                const assignedTasks = allTasks.filter(task => {
                    const assignees = Array.isArray(task.assignee_ids) ? task.assignee_ids : [];
                    return assignees.map(Number).includes(empId);
                });

                // Map to the dashboard task format
                const mappedTasks = assignedTasks.map(task => ({
                    id: `live_${task.id}`,
                    realId: task.id,
                    title: `${task.name}${task.priority === 'High' ? ' 🚨' : ''}`,
                    type: 'assigned',
                    status: task.status.toLowerCase(),
                    link: null,
                    isLive: true
                }));

                setTasks(mappedTasks);
            }
        } catch (err) {
            console.error('Failed to fetch assigned tasks:', err);
        }
    };

    const handleCompleteTask = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (task.isLive) {
            try {
                // Update in backend
                await api.patch(`/tasks/${task.realId}/status`, { status: 'Completed' });
                setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to update task status');
            }
        } else {
            // Local task
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
        }
    };

    useEffect(() => {
        const fetchStaff = async () => {
            if (!showKudos) return;
            try {
                const res = await api.get('/employees');
                const currentEmpId = parseInt(localStorage.getItem('employee_id'));
                if (res && res.length > 0) {
                    const activeTeammates = res
                        .filter(e => e.id !== currentEmpId)
                        .map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }));
                    setStaffList(activeTeammates);
                }
            } catch (err) {
                console.log('Error fetching staff list for Kudos', err);
            }
        };
        fetchStaff();
    }, [showKudos]);

    useEffect(() => {
        const section = queryParams.get('section');
        if (section) {
            setExpandedExploreCard(section);
        }
    }, [location.search]);

    useEffect(() => {
        if (expandedExploreCard === 'documents') {
            fetchUserDocuments();
        }
    }, [expandedExploreCard]);



    const submitPunch = async () => {
        if (!locationCoords) {
            alert("Valid live location is required to proceed. Please enable browser location permissions.");
            return;
        }
        try {
            const payload = {
                location: punchLocation,
                remarks: punchRemarks,
                latitude: locationCoords.latitude,
                longitude: locationCoords.longitude,
                accuracy: locationAccuracy
            };
            if (punchFlowState === 'in') {
                await api.post('/attendance/check-in', payload);
            } else {
                await api.post('/attendance/check-out', payload);
            }
            await fetchMetrics();
            setPunchFlowState(null);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Calculate display values for the latest slip card safely
    const latestNetPay = latestSlip ? parseFloat(latestSlip.net_salary || 0) : 0;
    const latestGrossPay = latestSlip ? (parseFloat(latestSlip.base_salary || 0) + parseFloat(latestSlip.total_allowances || 0) + parseFloat(latestSlip.overtime_bonus || 0)) : 0;
    const latestDeductions = Math.max(0, latestGrossPay - latestNetPay);

    const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeVal = timeString.split(' ')[0];
    const ampm = timeString.split(' ')[1]?.toLowerCase() || '';

    const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDateFormatted = currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    const hour = testHour !== null ? testHour : currentTime.getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 20) timeOfDay = 'evening';
    else if (hour >= 20 || hour < 6) timeOfDay = 'night';

    const themes = {
        morning: {
            sky: 'from-[#FDFBFB] via-[#FFE4E1] to-[#FFDAB9]/80',
            sun: 'bg-gradient-to-br from-[#FFDF70] to-[#FFC436] shadow-[0_0_40px_rgba(255,196,54,0.5)] right-10 top-8 w-[70px] h-[70px]',
            buildings: ['from-[#C88EA7] to-[#E3B5C9]', 'from-[#D49EB4] to-[#EBADC6]', 'from-[#B57C96] to-[#D5A0B9]'],
            showStars: false,
            showWindows: false,
            isMoon: false
        },
        afternoon: {
            sky: 'from-[#E0F6FF] via-[#B9E1FB] to-[#87CEFA]/60',
            sun: 'bg-gradient-to-br from-[#FFF9D2] to-[#FFDF70] shadow-[0_0_60px_rgba(255,223,112,0.8)] right-[40%] top-2 w-[84px] h-[84px]',
            buildings: ['from-[#6D91B9] to-[#A4BDDA]', 'from-[#7EA0C6] to-[#B3CAE5]', 'from-[#5C81AA] to-[#91ADCB]'],
            showStars: false,
            showWindows: false,
            isMoon: false
        },
        evening: {
            sky: 'from-[#FDB99B] via-[#CF8BF3] to-[#A08CF5]/80',
            sun: 'bg-gradient-to-br from-[#FF7E5F] to-[#FEB47B] shadow-[0_0_50px_rgba(254,180,123,0.6)] right-12 top-10 w-[74px] h-[74px]',
            buildings: ['from-[#4B6CB7] to-[#182848]', 'from-[#51215a] to-[#2d1233]', 'from-[#2c3e50] to-[#000000]'],
            showStars: true,
            showWindows: true,
            isMoon: false
        },
        night: {
            sky: 'from-[#0F172A] via-[#1E293B] to-[#334155]',
            sun: 'bg-gradient-to-br from-[#F1F5F9] to-[#94A3B8] shadow-[0_0_40px_rgba(148,163,184,0.4)] right-14 top-6 w-[64px] h-[64px]',
            buildings: ['from-[#1E293B] to-[#0F172A]', 'from-[#334155] to-[#1E293B]', 'from-[#020617] to-[#000000]'],
            showStars: true,
            showWindows: true,
            isMoon: true
        }
    };

    const activeTheme = themes[timeOfDay];

    const uniqueDepts = Array.from(new Set(allEmployees.map(e => e.department).filter(Boolean))).sort();

    const rawFeedItems = [];

    // Add birthdays
    if (activityFilter === 'all' || activityFilter === 'birthdays') {
        birthdayEmps.forEach(emp => {
            rawFeedItems.push({
                id: `bday_${emp.id}`,
                type: 'birthday',
                date: new Date(),
                data: emp,
                department: emp.department
            });
        });

        upcomingBirthdays.forEach(emp => {
            rawFeedItems.push({
                id: `upcoming_${emp.id}`,
                type: 'upcoming_birthday',
                date: new Date(emp.nextBdayDate),
                data: emp,
                department: emp.department
            });
        });
    }

    // Add kudos
    if (activityFilter === 'all' || activityFilter === 'kudos') {
        kudosList.forEach(k => {
            const recipientDept = allEmployees.find(e => e.id === k.recipient_id)?.department;
            const senderDept = allEmployees.find(e => e.id === k.sender_id)?.department;
            rawFeedItems.push({
                id: `kudos_${k.id}`,
                type: 'kudos',
                date: new Date(k.created_at),
                data: k,
                department: recipientDept || senderDept
            });
        });
    }

    // Filter by department
    const feedItems = rawFeedItems.filter(item => {
        if (deptFilter === 'all') return true;
        return item.department === deptFilter;
    });

    // Sort items
    feedItems.sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.date - b.date;
        } else {
            return b.date - a.date;
        }
    });

    const faqData = [
        {
            category: 'Attendance',
            q: 'Forgot to punch-in or punch-out?',
            a: 'You can easily request a correction by going to Actions > Apply Regularization. Select the date and enter your check-in/out times along with a reason. Your manager will review and approve it.'
        },
        {
            category: 'Leave',
            q: 'How to apply for a leave and check balance?',
            a: 'Go to Actions > Apply Leave to submit a request. You can check your remaining balances under Actions > Leave Balance. Your leave history and status are also available there.'
        },
        {
            category: 'Salary',
            q: 'When and where can I download my payslips?',
            a: 'Payslips are released monthly by HR. You can view and download them in PDF format under Actions > Payslips. For tax statement summaries, click on IT Statement.'
        },
        {
            category: 'Profile',
            q: 'How can I update my bank account details?',
            a: 'Navigate to Explore > People > My Profile, click Edit, fill in your updated details (like PAN, Aadhaar, or Bank Account), and save. Some updates will require Admin approval.'
        },
        {
            category: 'General',
            q: 'Who to contact for immediate technical support?',
            a: 'For any technical glitches or system login issues, please contact the IT Helpdesk directly via email at support@myfasthr.com or reach out to your HR administrator.'
        }
    ];

    const filteredFaqs = faqData.filter(faq => {
        const matchesCategory = selectedFaqCategory === 'All' || faq.category === selectedFaqCategory;
        const matchesSearch = faq.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                              faq.a.toLowerCase().includes(faqSearchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="bg-slate-50 min-h-screen flex justify-center">
            <style>{`
                @keyframes sunPulse {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                @keyframes windowPulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                @keyframes slideRight {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(400%); }
                }
                @keyframes slideLeft {
                    from { transform: translateX(100%); }
                    to { transform: translateX(-400%); }
                }
                @keyframes shootingStar {
                    0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 0; }
                    5% { opacity: 1; }
                    15% { transform: translateX(-300px) translateY(300px) rotate(-45deg); opacity: 0; }
                    100% { opacity: 0; }
                }
            `}</style>

            {/* Mobile constraints */}
            <div className="w-full bg-slate-50 md:bg-transparent relative flex flex-col pb-0">
                
                {/* Header Section */}
                <div className={`px-5 pt-6 ${activeTab === 'home' ? 'pb-2' : 'pb-0'} flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:mb-6`}>
                    <div className={`${activeTab !== 'home' ? 'hidden md:block' : ''} mt-4`}>
                        <h1 className="text-[26px] text-slate-500 font-medium tracking-tight">
                            Hello <span className="text-[#3A4561] font-bold uppercase">{metrics?.employee_name || 'EMPLOYEE'}</span> <span className="text-[26px]">👋</span>
                        </h1>
                    </div>
                    
                    {/* Sub-tabs Switcher */}
                    <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap max-w-full items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-md shrink-0">
                        {[
                            { id: 'home', label: 'Home', icon: Home },
                            { id: 'action', label: 'Action', icon: Zap },
                            { id: 'explore', label: 'Explore', icon: LayoutGrid },
                            { id: 'engage', label: 'Engage', icon: Radio },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        if (tab.id === 'home') {
                                            navigate('/dashboard');
                                        } else {
                                            navigate(`/dashboard?tab=${tab.id}`);
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 duration-200 shrink-0 ${
                                        isActive 
                                            ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.12)] border border-indigo-50/50' 
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                                >
                                    <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 px-5 pb-0">
                    {/* Global Announcements */}
                    {announcements.length > 0 && (
                        <div className="mb-6 space-y-3">
                            {announcements.map((ann) => (
                                <div 
                                    key={ann.id} 
                                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-wider relative animate-in slide-in-from-top-4 duration-300 ${
                                        ann.severity === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                        ann.severity === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                        'bg-blue-50 border-blue-100 text-blue-600'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm">📢</span>
                                        <p className="text-left leading-normal font-semibold font-outfit uppercase tracking-normal normal-case text-[13px]">{ann.message}</p>
                                    </div>
                                    <button 
                                        onClick={() => setAnnouncements(prev => prev.filter(a => a.id !== ann.id))}
                                        className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-650 shrink-0 font-extrabold text-[14px]"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {showRegularization && (
                        <div className="fixed inset-0 z-[110] bg-white">
                            <RegularizationView onBack={() => setShowRegularization(false)} />
                        </div>
                    )}

                    {showAttendanceInfo && (
                        <div className="fixed inset-0 z-[110] bg-white">
                            <AttendanceInfoView onBack={() => setShowAttendanceInfo(false)} />
                        </div>
                    )}


                    
                    {/* HOME TAB */}
                    {activeTab === 'home' && !punchFlowState && (
                        <div className="animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                {/* Left Column: Clock Banner, Quick Actions, Upcoming Holiday */}
                                <div className="md:col-span-7 lg:col-span-7 xl:col-span-8 space-y-6">
                                    {/* Premium Glassmorphic Cityscape Card */}
                                    <div className="rounded-[28px] border border-white/80 shadow-[0_8px_32px_rgba(149,157,165,0.15)] overflow-hidden relative bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-xl">
                                        <div className="h-[140px] w-full relative overflow-hidden flex items-end transition-colors duration-1000">
                                            <div className={`absolute inset-0 bg-gradient-to-b ${activeTheme.sky} transition-all duration-1000`}></div>
                                            
                                            {/* DEBUG TOGGLE */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const cycle = [8, 14, 18, 22, null];
                                                    const currentIndex = cycle.indexOf(testHour);
                                                    setTestHour(cycle[(currentIndex + 1) % cycle.length]);
                                                }}
                                                className="absolute top-3 left-3 z-30 px-3 py-1.5 bg-black/20 backdrop-blur-lg rounded-full border border-white/20 text-[10px] text-white/90 font-black tracking-widest uppercase hover:bg-black/40 transition-colors shadow-lg"
                                            >
                                                {testHour === null ? 'LIVE' : timeOfDay}
                                            </button>

                                            {/* Celestial Body */}
                                            <div className={`absolute rounded-full transition-all duration-1000 ${activeTheme.sun}`} style={{ animation: 'sunPulse 8s ease-in-out infinite' }}>
                                                {activeTheme.isMoon && (
                                                    <>
                                                        {/* Realistic Moon Surface */}
                                                        <div className="absolute inset-0 bg-[#F1F5F9] rounded-full overflow-hidden shadow-[inset_-8px_-8px_15px_rgba(0,0,0,0.2)]">
                                                            {/* Craters */}
                                                            <div className="absolute top-2 left-3 w-3 h-3 bg-slate-300/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-8 left-6 w-4 h-4 bg-slate-300/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-5 right-4 w-2.5 h-2.5 bg-slate-300/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute bottom-4 left-5 w-2 h-2 bg-slate-300/40 rounded-full blur-[1px]"></div>
                                                        </div>
                                                        {/* Moon Glow Overlay */}
                                                        <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(241,245,249,0.3)]"></div>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Skyline */}
                                            <div className="absolute bottom-0 left-0 w-full flex items-end justify-between px-4 opacity-90">
                                                {[
                                                    {h: 35, w: 16, ant: false}, {h: 50, w: 12, ant: true}, {h: 40, w: 18, ant: false}, 
                                                    {h: 70, w: 14, ant: false}, {h: 45, w: 12, ant: true}, {h: 60, w: 16, ant: false}, 
                                                    {h: 95, w: 20, ant: true}, {h: 55, w: 14, ant: false}, {h: 75, w: 16, ant: false}, 
                                                    {h: 40, w: 12, ant: false}, {h: 85, w: 18, ant: true}, {h: 50, w: 14, ant: false}, 
                                                    {h: 110, w: 22, ant: true}, {h: 65, w: 16, ant: false}, {h: 45, w: 12, ant: false}, 
                                                    {h: 70, w: 18, ant: true}, {h: 80, w: 16, ant: false}, {h: 40, w: 12, ant: false}, 
                                                    {h: 60, w: 14, ant: true}, {h: 35, w: 12, ant: false}
                                                ].map((b, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`relative bg-gradient-to-t ${activeTheme.buildings[i % 3]} rounded-t-[3px] transition-all duration-1000 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.1)] ${i > 11 ? 'hidden sm:block' : ''}`} 
                                                        style={{ height: `${b.h}px`, width: `${b.w}px` }}
                                                    >
                                                        {/* Building Antenna */}
                                                        {b.ant && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[1.5px] bg-slate-400/30" style={{ height: '8px' }}>
                                                                {activeTheme.showWindows && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[2px] bg-red-500/60 rounded-full animate-pulse"></div>}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Windows */}
                                                        {activeTheme.showWindows && (
                                                            <div className="absolute top-2 left-0 w-full flex flex-col gap-[4px] items-center opacity-90">
                                                                {Array.from({ length: Math.max(1, Math.floor(b.h / 15)) }).map((_, winIdx) => (
                                                                    <div key={winIdx} className="flex gap-[3px]">
                                                                        <div 
                                                                            className={`w-[4px] h-[3px] rounded-sm transition-all duration-1000 ${i % 2 === 0 && winIdx % 2 === 0 ? 'bg-[#FFDA57] shadow-[0_0_3px_#FFDA57]' : 'bg-slate-700/30'}`} 
                                                                            style={{ animation: i % 2 === 0 && winIdx % 2 === 0 ? `windowPulse ${2 + (i%2)}s infinite` : 'none', animationDelay: `${i * 0.1}s` }}
                                                                        ></div>
                                                                        <div 
                                                                            className={`w-[4px] h-[3px] rounded-sm transition-all duration-1000 ${i % 3 === 0 && winIdx % 3 === 0 ? 'bg-[#FFDA57] shadow-[0_0_3px_#FFDA57]' : 'bg-slate-700/30'}`} 
                                                                            style={{ animation: i % 3 === 0 && winIdx % 3 === 0 ? `windowPulse ${3 + (i%2)}s infinite` : 'none', animationDelay: `${i * 0.2}s` }}
                                                                        ></div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white/90 via-white/50 to-transparent z-10"></div>
                                        </div>
                                        
                                        {/* Time Card Content */}
                                        <div className="p-5 relative z-20 bg-white/70 backdrop-blur-2xl -mt-6 rounded-t-[28px] border-t border-white/80">
                                            <div className="flex justify-between items-center mb-6 pt-1">
                                                <div className="w-[84px] h-[84px] rounded-full bg-[#FDE2B5] flex items-center justify-center relative overflow-hidden shrink-0">
                                                    <div className="absolute top-[-16px] right-[-16px] w-[76px] h-[76px] rounded-full bg-[#EFA034]"></div>
                                                    <span className="text-[19px] font-[900] text-[#1B253C] relative z-10 flex items-baseline gap-[1px] tracking-tight">
                                                        {timeVal}
                                                        <span className="text-[13px] font-bold text-[#1B253C]">{ampm}</span>
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[#3A4561] font-bold text-[15px] tracking-tight">
                                                        {currentDay} | {metrics?.shift_start || '10:00'} - {metrics?.shift_end || '18:00'}
                                                    </p>
                                                    <p className="text-slate-500 font-semibold text-[14px] mt-0.5">Shift</p>
                                                    <p className="text-slate-400 text-[13px] mt-1 font-medium">{currentDateFormatted}</p>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={handlePunchClick}
                                                className={`group relative w-full py-3.5 rounded-[16px] font-[800] text-[17px] text-white tracking-wide active:scale-[0.96] transition-all duration-300 backdrop-blur-xl border border-white/40 border-b-black/20 ${
                                                    metrics?.is_checked_in 
                                                        ? 'bg-gradient-to-b from-[#3B82F6]/80 to-[#2563EB]/90 shadow-[0_8px_25px_rgba(59,130,246,0.4),inset_0_2px_1px_rgba(255,255,255,0.5)] hover:brightness-110' 
                                                        : 'bg-gradient-to-b from-[#10B981]/80 to-[#059669]/90 shadow-[0_8px_25px_rgba(16,185,129,0.4),inset_0_2px_1px_rgba(255,255,255,0.5)] hover:brightness-110'
                                                }`}
                                            >
                                                <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/30 to-transparent rounded-t-[14px] pointer-events-none"></div>
                                                <span className="relative z-10 drop-shadow-md">Sign {metrics?.is_checked_in ? 'Out' : 'In'}</span>
                                            </button>
                                        </div>
                                    </div>
                                                                      {/* New: Quick Actions Grid */}
                                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                                        {[
                                            { icon: Calendar, label: 'Leave', color: 'bg-orange-50 text-orange-500', onClick: () => navigate('/leaves') },
                                            { icon: FileText, label: 'Policy', color: 'bg-blue-50 text-blue-500', onClick: () => navigate('/dashboard?tab=explore&section=documents') },
                                            { icon: HelpCircle, label: 'Help', color: 'bg-purple-50 text-purple-500', onClick: () => navigate('/dashboard?tab=explore&section=helpdesk') },
                                            { icon: Users, label: 'Team', color: 'bg-emerald-50 text-emerald-500', onClick: () => navigate('/employees/org-chart') },
                                        ].map((item, idx) => (
                                            <button key={idx} onClick={item.onClick} className="flex flex-col items-center gap-1.5 sm:gap-2 group active:scale-95 transition-transform">
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                                                    <item.icon size={20} className="sm:w-[24px] sm:h-[24px]" strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[10px] sm:text-[12px] font-bold text-[#3A4561] text-center truncate w-full">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* New: Upcoming Holiday Card */}
                                    {metrics?.upcomingHolidays?.[0] && (
                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[28px] p-5 sm:p-6 text-white relative overflow-hidden shadow-lg">
                                            <div className="relative z-10 flex justify-between items-center gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-white/70 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 truncate">Upcoming Holiday</p>
                                                    <h4 className="text-lg sm:text-xl font-black truncate">{metrics.upcomingHolidays[0].name}</h4>
                                                    <p className="text-white/80 text-xs sm:text-[13px] font-medium mt-1 truncate">
                                                        {new Date(metrics.upcomingHolidays[0].date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </p>
                                                </div>
                                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-2 sm:p-3 flex flex-col items-center min-w-[60px] sm:min-w-[70px] shrink-0">
                                                    <span className="text-xl sm:text-2xl font-black leading-tight">
                                                        {Math.ceil((new Date(metrics.upcomingHolidays[0].date) - new Date()) / (1000 * 60 * 60 * 24))}
                                                    </span>
                                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase">Days Left</span>
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Right Column: Exception Days, Leave Balance, Payslip */}
                                <div className="md:col-span-5 lg:col-span-5 xl:col-span-4 space-y-6">
                                    {/* Exception Days Card */}
                                    <div className="bg-[#FFF8F0] rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between border border-[#FFE7CC]/50 gap-2">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#FF9F2E] shadow-sm shrink-0">
                                                <AlertCircle size={18} className="sm:w-[20px] sm:h-[20px]" strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[#3A4561] font-bold text-xs sm:text-[15px] truncate">
                                                {metrics?.lateCount !== undefined ? `${String(metrics.lateCount).padStart(2, '0')} Exception days` : '00 Exception days'}
                                            </span>
                                        </div>
                                        <button onClick={() => setShowRegularization(true)} className="text-[#4F6FF5] font-[800] text-xs sm:text-[15px] shrink-0 hover:underline">Regularize</button>
                                    </div>
                                    
                                    {/* Leave Balance Card */}
                                    <div className="bg-[#E6FFFA] rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between border border-[#B2F5EA]/50 gap-2">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#319795] shadow-sm shrink-0">
                                                <Coffee size={18} className="sm:w-[20px] sm:h-[20px]" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[#3A4561] font-bold text-xs sm:text-[15px] truncate">{String(metrics?.leaveBalance || 0).padStart(2, '0')} Days Balance</span>
                                                <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Annual Leave</span>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate('/leaves?action=apply')} className="text-[#319795] font-[800] text-xs sm:text-[15px] shrink-0 hover:underline">Apply</button>
                                    </div>
                                    
                                    {/* PIXEL-PERFECT PAYSLIP CARD */}
                                    <div className="bg-white rounded-[32px] pt-5 pb-8 px-4 xs:px-6 sm:px-8 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative">
                                        {/* Header Row */}
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-[#2D3748] text-xl sm:text-[24px] font-bold tracking-tight">Payslip</h3>
                                            <div className="relative pt-1.5">
                                                <TrendingUp size={20} className="sm:w-[24px] sm:h-[24px] text-[#2D3748]" />
                                                <div className="absolute bottom-0 -right-1 w-1.5 h-1.5 bg-[#00CFE8] rounded-full border border-white shadow-sm"></div>
                                            </div>
                                        </div>
 
                                        {/* Professional Floating Piggy Bank */}
                                        <div className="flex justify-between items-end mb-6 relative gap-2">
                                            <div className="relative w-20 sm:w-28 h-20 sm:h-28 flex items-center justify-center shrink-0">
                                                <style>{`
                                                    @keyframes softFloat {
                                                        0%, 100% { transform: translateY(0); }
                                                        50% { transform: translateY(-10px); }
                                                    }
                                                `}</style>
                                                
                                                <div className="relative z-20" style={{ animation: 'softFloat 5s ease-in-out infinite' }}>
                                                    <svg 
                                                        viewBox="0 0 100 86" 
                                                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2.5" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"
                                                    >
                                                        {/* Back banknote (rotated and offset) */}
                                                        <g transform="rotate(-8 50 43) translate(-2, -3)" className="text-slate-300">
                                                            <rect x="10" y="20" width="80" height="46" rx="6" />
                                                        </g>

                                                        {/* Front banknote */}
                                                        <g className="text-slate-800">
                                                            <rect x="10" y="20" width="80" height="46" rx="6" fill="white" />
                                                            
                                                            {/* Decorative corner borders */}
                                                            <path d="M15 31 V25 H21 M85 31 V25 H79 M15 55 V61 H21 M85 55 V61 H79" className="text-slate-300" strokeWidth="1.5" />
                                                            
                                                            {/* Center circle */}
                                                            <circle cx="50" cy="43" r="11" />
                                                            
                                                            {/* Rupee Symbol inside the center circle */}
                                                            <text 
                                                                x="50" 
                                                                y="48.5" 
                                                                textAnchor="middle" 
                                                                className="font-black text-[17px]" 
                                                                stroke="none" 
                                                                fill="currentColor"
                                                                style={{ fontFamily: 'Outfit, sans-serif' }}
                                                            >
                                                                ₹
                                                            </text>
                                                        </g>
                                                    </svg>
                                                    {/* Reflection Glow */}
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-slate-900/10 blur-lg rounded-full"></div>
                                                </div>
 
                                                {/* Ambient Professional Glows */}
                                                <div className="absolute inset-0 bg-pink-50/30 blur-3xl rounded-full"></div>
                                                <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-indigo-50/20 blur-2xl rounded-full"></div>
                                            </div>
 
                                            {/* Date Info */}
                                            <div className="text-right pb-2 min-w-0">
                                                <p className="text-[#2D3748] font-bold text-xs xs:text-sm sm:text-[18px] truncate">
                                                    {latestSlip ? `${getMonthName(latestSlip.month)} ${latestSlip.year}` : 'No Payslip'}
                                                </p>
                                                <p className="text-slate-400 text-xs sm:text-[14px] font-medium truncate">30 paid days</p>
                                            </div>
                                        </div>
 
                                        {/* Inner Values Card */}
                                        <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden relative">
                                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-100/30 blur-[30px] rounded-full"></div>
                                            
                                            <div className="p-3 sm:p-4 relative z-10">
                                                {/* Net Pay Row */}
                                                <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-[#10B981] font-bold text-[11px] sm:text-[13px] mb-0.5 truncate">Net Pay</p>
                                                        <h4 className="text-xl sm:text-[24px] font-bold text-[#10B981] tracking-tight truncate">
                                                            {showSalary ? `₹${latestNetPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹******'}
                                                        </h4>
                                                    </div>
                                                    {latestSlip && (
                                                        <button 
                                                            onClick={() => handleDownloadSlip(latestSlip.id, getMonthName(latestSlip.month), latestSlip.year)}
                                                            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] cursor-pointer active:scale-95 transition-transform shrink-0"
                                                        >
                                                            <Download size={18} className="sm:w-[20px] sm:h-[20px]" strokeWidth={2.5} />
                                                        </button>
                                                    )}
                                                </div>
 
                                                {/* Bottom Grid */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-slate-400 text-[10px] sm:text-[12px] font-medium mb-0.5 truncate">Gross Pay</p>
                                                        <p className="text-[#2D3748] font-bold text-xs sm:text-[15px] truncate">
                                                            {showSalary ? `₹${latestGrossPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹******'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right min-w-0">
                                                        <p className="text-slate-400 text-[10px] sm:text-[12px] font-medium mb-0.5 truncate">Deductions</p>
                                                        <p className="text-[#2D3748] font-bold text-xs sm:text-[15px] truncate">
                                                            {showSalary ? `₹${latestDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹******'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
 
                                        {/* Footer Toggle */}
                                        <div className="flex items-center justify-end gap-2 mt-4">
                                            <span className="text-[#718096] text-xs sm:text-[13px] font-medium">Show Salary</span>
                                            <button 
                                                onClick={() => setShowSalary(!showSalary)}
                                                className={`w-[44px] h-[24px] rounded-full relative transition-all duration-300 ${showSalary ? 'bg-[#4F6FF5]' : 'bg-[#E2E8F0]'}`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all duration-300 ${showSalary ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTION TAB */}
                    {activeTab === 'action' && !punchFlowState && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-[24px] font-bold text-[#1A202C] mb-6">Actions</h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                                {[
                                    { icon: Send, label: 'Apply Regularization', bg: 'bg-[#EBF1FF]', color: 'text-[#4F6FF5]' },
                                    { icon: Info, label: 'Attendance Info', bg: 'bg-[#EBF1FF]', color: 'text-[#4F6FF5]' },
                                    { icon: Coffee, label: 'Apply Leave', bg: 'bg-[#E6FFFA]', color: 'text-[#319795]' },
                                    { icon: LayoutGrid, label: 'Leave Balance', bg: 'bg-[#E6FFFA]', color: 'text-[#319795]' },
                                    { icon: Calendar, label: 'Holiday Calendar', bg: 'bg-[#E6FFFA]', color: 'text-[#319795]' },
                                    { icon: FileText, label: 'Payslips', bg: 'bg-[#FFF5F0]', color: 'text-[#DD6B20]' },
                                    { icon: ClipboardList, label: 'YTD Reports', bg: 'bg-[#FFF5F0]', color: 'text-[#DD6B20]' },
                                    { icon: Hand, label: 'IT Statement', bg: 'bg-[#FFF5F0]', color: 'text-[#DD6B20]' },
                                ].map((item, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                if (item.label === 'Apply Regularization') setShowRegularization(true);
                                                if (item.label === 'Attendance Info') setShowAttendanceInfo(true);
                                                if (item.label === 'Apply Leave') navigate('/leaves?action=apply');
                                                if (item.label === 'Leave Balance') navigate('/leaves');
                                                if (item.label === 'Holiday Calendar') navigate('/leaves?tab=holidays');
                                                if (item.label === 'Payslips') navigate('/payslips');
                                                if (item.label === 'YTD Reports') navigate('/payslips?tab=ytd');
                                                if (item.label === 'IT Statement') navigate('/payslips?tab=it');
                                            }}

                                            className="bg-white rounded-[18px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-slate-100/50"
                                        >
                                            <div className={`w-12 h-12 ${item.bg} rounded-[16px] flex items-center justify-center`}>
                                                <item.icon size={22} className={item.color} />
                                            </div>
                                            <span className="text-[16px] font-bold text-[#2D3748]">{item.label}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* EXPLORE TAB (Accordion Style as per Image 1-5) */}
                    {activeTab === 'explore' && !punchFlowState && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                            <h2 className="text-[28px] font-bold text-[#1A202C] mb-8 px-2">Explore</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {[
                                    { 
                                        id: 'attendance',
                                        title: 'Attendance', 
                                        desc: 'Manage your attendance.', 
                                        bg: 'bg-[#EBF1FF]', 
                                        btnColor: 'bg-[#4361EE]',
                                        actions: ['Attendance Info', 'Apply Regularization'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-24 bg-purple-200/50 rounded-2xl rotate-6 translate-x-2 translate-y-2"></div>
                                                <div className="absolute w-24 h-24 bg-white rounded-2xl shadow-sm border border-purple-100 flex flex-col overflow-hidden">
                                                    <div className="h-6 bg-purple-500 w-full flex gap-1 px-2 items-center">
                                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-4 gap-1.5 p-3">
                                                        {[...Array(8)].map((_, i) => <div key={i} className={`w-full h-2.5 rounded-[3px] ${i === 2 || i === 5 ? 'bg-orange-400' : 'bg-slate-100'}`}></div>)}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'leave',
                                        title: 'Leave', 
                                        desc: 'Check and apply for leaves.', 
                                        bg: 'bg-[#E6FFFA]', 
                                        btnColor: 'bg-[#008B8B]',
                                        actions: ['Apply Leave', 'Leave Balance', 'Holiday Calendar'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-24 bg-teal-200/40 rounded-full blur-2xl"></div>
                                                <div className="relative">
                                                    <Plane size={64} className="text-teal-500 -rotate-12" strokeWidth={1.5} />
                                                    <div className="absolute -bottom-2 -left-4 flex gap-1.5">
                                                        <div className="w-5 h-1.5 bg-teal-200 rounded-full"></div>
                                                        <div className="w-10 h-1.5 bg-teal-200 rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'salary',
                                        title: 'Salary', 
                                        desc: 'Get your salary breakdown.', 
                                        bg: 'bg-[#FFF5F0]', 
                                        btnColor: 'bg-[#ED8936]',
                                        actions: ['Payslips', 'YTD Reports', 'IT Statement'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-20 bg-orange-200/50 rounded-2xl rotate-3 translate-y-4"></div>
                                                <div className="absolute w-24 h-20 bg-white rounded-2xl shadow-sm border border-orange-100 flex items-center justify-center">
                                                    <Wallet size={40} className="text-orange-500" />
                                                </div>
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="absolute w-7 h-7 bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[12px] font-black text-white" 
                                                        style={{ 
                                                            right: `${15 + i * 18}px`, 
                                                            top: `${15 + (i%2) * 12}px`,
                                                            transform: `rotate(${i * 20}deg)`
                                                        }}>₹</div>
                                                ))}
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'worklife',
                                        title: 'My Worklife', 
                                        desc: 'Collaborate, learn, and grow together.', 
                                        bg: 'bg-[#F0FFF4]', 
                                        btnColor: 'bg-[#48BB78]',
                                        actions: ['Kudos'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-24 bg-green-200/40 rounded-full blur-xl"></div>
                                                <div className="relative">
                                                    <Zap size={72} className="text-green-500 fill-green-100" strokeWidth={1} />
                                                    <div className="absolute top-0 right-0 w-5 h-5 bg-yellow-400 rounded-full"></div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'people',
                                        title: 'People', 
                                        desc: 'A data hub for personal info and workmates.', 
                                        bg: 'bg-[#FFF5F7]', 
                                        btnColor: 'bg-[#D53F8C]',
                                        actions: ['My Profile', 'My Workmates'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-24 bg-pink-100/50 rounded-full blur-2xl"></div>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-white rounded-full shadow-md border border-pink-100 flex items-center justify-center z-20 relative">
                                                        <Users size={32} className="text-pink-500" />
                                                    </div>
                                                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-sm border border-pink-50 flex items-center justify-center z-10">
                                                        <User size={18} className="text-pink-300" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -left-3 w-10 h-10 bg-white rounded-full shadow-sm border border-pink-50 flex items-center justify-center z-10">
                                                        <User size={18} className="text-pink-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'todo',
                                        title: 'To Do', 
                                        desc: 'Review pending items.', 
                                        bg: 'bg-[#F0FDFA]', 
                                        btnColor: 'bg-[#1ABC9C]',
                                        actions: ['Review'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-24 bg-teal-100/40 rounded-full blur-xl"></div>
                                                <div className="absolute w-20 h-24 bg-white rounded-xl shadow-sm border border-teal-100 flex flex-col p-3 overflow-hidden">
                                                    <div className="h-2 w-full bg-teal-500 rounded-full mb-3"></div>
                                                    <div className="space-y-2">
                                                        {[...Array(3)].map((_, i) => (
                                                            <div key={i} className="flex gap-2">
                                                                <div className="w-3 h-3 bg-teal-100 rounded-[3px] flex-shrink-0"></div>
                                                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-4 right-4 w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                    <ClipboardList size={20} className="text-white" />
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'helpdesk',
                                        title: 'Helpdesk', 
                                        desc: 'Request assistance here.', 
                                        bg: 'bg-[#EFF6FF]', 
                                        btnColor: 'bg-[#4361EE]',
                                        actions: ['FAQs & Guides', 'Support Tickets'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-24 bg-blue-100/50 rounded-full blur-2xl"></div>
                                                <div className="relative">
                                                    <div className="w-20 h-20 bg-white rounded-3xl shadow-md border border-blue-100 flex items-center justify-center">
                                                        <Headphones size={44} className="text-blue-500" strokeWidth={1.5} />
                                                    </div>
                                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                        <Info size={16} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'documents',
                                        title: 'Documents', 
                                        desc: 'Check and download your office letters.', 
                                        bg: 'bg-[#F0FDF4]', 
                                        actions: ['View Documents'],
                                        doodle: (
                                            <div className="absolute right-2 top-4 w-32 h-32 flex items-center justify-center">
                                                <div className="absolute w-24 h-24 bg-green-100/50 rounded-full blur-xl"></div>
                                                <div className="relative">
                                                    <div className="absolute w-16 h-20 bg-white rounded-lg shadow-sm border border-green-100 -rotate-6 translate-x-1 translate-y-1"></div>
                                                    <div className="absolute w-16 h-20 bg-white rounded-lg shadow-sm border border-green-100 -rotate-3 -translate-x-1 -translate-y-1"></div>
                                                    <div className="relative w-16 h-20 bg-white rounded-lg shadow-md border border-green-200 flex flex-col p-2">
                                                        <div className="w-full h-2 bg-green-500/20 rounded-full mb-1"></div>
                                                        <div className="w-2/3 h-1.5 bg-green-500/10 rounded-full mb-1"></div>
                                                        <div className="w-full h-1.5 bg-green-500/10 rounded-full mb-4"></div>
                                                        <div className="flex-1 flex items-center justify-center">
                                                            <FileText size={24} className="text-green-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    },
                                ].map((item, idx) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => {
                                            if (item.actions.length > 0) {
                                                setExpandedExploreCard(expandedExploreCard === item.id ? null : item.id);
                                            }
                                        }}
                                        className={`${item.bg} rounded-[32px] p-7 relative overflow-hidden transition-all duration-300 border border-black/5 flex flex-col ${item.actions.length > 0 ? 'cursor-pointer' : 'cursor-default'} ${expandedExploreCard === item.id ? 'min-h-[220px]' : 'min-h-[150px]'}`}
                                    >
                                        <div className="relative z-10 w-full">
                                            <div className="max-w-[60%] sm:max-w-[65%] mb-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-[26px] font-[900] text-[#2D3748] tracking-tight">{item.title}</h3>
                                                    {item.actions.length > 0 && (
                                                        expandedExploreCard === item.id ? <ChevronUp size={24} className="text-slate-600" /> : <ChevronDown size={24} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <p className="text-[17px] text-[#4A5568] font-semibold leading-snug opacity-80">{item.desc}</p>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            {expandedExploreCard === item.id && item.actions.length > 0 && (
                                                <div className="flex flex-wrap gap-3 mt-4 animate-in fade-in slide-in-from-top-4 duration-300 w-full">
                                                    {item.actions.map((action, aIdx) => (
                                                        <button 
                                                            key={aIdx}
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if (action === 'Apply Regularization') setShowRegularization(true);
                                                                if (action === 'Attendance Info') setShowAttendanceInfo(true);
                                                                if (action === 'Apply Leave') navigate('/leaves?action=apply');
                                                                if (action === 'Leave Balance') navigate('/leaves');
                                                                if (action === 'Holiday Calendar') navigate('/leaves?tab=holidays');
                                                                if (action === 'Payslips') navigate('/payslips');
                                                                if (action === 'YTD Reports') navigate('/payslips?tab=ytd');
                                                                if (action === 'IT Statement') navigate('/payslips?tab=it');
                                                                if (action === 'Kudos') setShowKudos(true);
                                                                if (action === 'My Profile') navigate('/profile');
                                                                if (action === 'My Workmates') navigate('/employees/org-chart');
                                                                if (action === 'Review') setShowReviewModal(true);
                                                                if (action === 'View Documents') setExpandedExploreCard(expandedExploreCard === 'documents' ? null : 'documents');
                                                                if (action === 'FAQs & Guides') {
                                                                    setHelpdeskTab('faqs');
                                                                    setShowHelpdeskModal(true);
                                                                }
                                                                if (action === 'Support Tickets') {
                                                                    setHelpdeskTab('tickets');
                                                                    setShowNewTicketForm(false);
                                                                    setSelectedTicket(null);
                                                                    setShowHelpdeskModal(true);
                                                                }
                                                            }}

                                                            className={`${item.btnColor} text-white px-6 py-3 rounded-full text-[15px] font-bold shadow-md active:scale-95 transition-transform`}
                                                        >
                                                            {action}
                                                        </button>
                                                    ))}

                                                </div>
                                            )}

                                            {/* Documents Listing */}
                                            {expandedExploreCard === item.id && item.id === 'documents' && (
                                                <div className="mt-4 w-full animate-in fade-in duration-300 z-10 relative">
                                                    {loadingDocs ? (
                                                        <p className="text-sm font-semibold text-slate-500">Loading documents...</p>
                                                    ) : userDocuments.length === 0 ? (
                                                        <p className="text-sm font-semibold text-slate-500">No documents uploaded.</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                                                            {userDocuments.map(doc => (
                                                                <div key={doc.id} className="bg-white/80 rounded-2xl p-4 flex items-center justify-between border border-slate-100/50 shadow-sm gap-4">
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <div className="p-2.5 bg-green-50 rounded-xl text-green-600 shrink-0">
                                                                            <FileText size={18} />
                                                                        </div>
                                                                        <div className="overflow-hidden">
                                                                            <p className="text-xs font-bold text-slate-700 truncate" title={doc.file_name}>{doc.file_name}</p>
                                                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{doc.document_type || 'General'} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDownloadDoc(doc.file_path, doc.file_name);
                                                                        }}
                                                                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors shrink-0"
                                                                    >
                                                                        <Download size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Doodle Illustration */}
                                        <div className="absolute right-0 top-0 h-[150px] w-[40%] pointer-events-none">
                                            {item.doodle}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* ENGAGE TAB */}
                    {activeTab === 'engage' && !punchFlowState && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-24 max-w-3xl mx-auto w-full">
                            <h2 className="text-[28px] font-bold text-[#1A202C] mb-6 px-2">Engage</h2>
                            
                            {/* Filters */}
                            <div className="flex gap-3 mb-4 px-1">
                                <div className="flex-1 relative bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                                    <select 
                                        value={activityFilter} 
                                        onChange={e => setActivityFilter(e.target.value)}
                                        className="w-full bg-transparent appearance-none border-none outline-none text-[15px] font-semibold text-slate-600 cursor-pointer pr-6"
                                    >
                                        <option value="all">Activity: All Activity</option>
                                        <option value="kudos">Activity: Kudos Only</option>
                                        <option value="birthdays">Activity: Birthdays Only</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="flex-1 relative bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                                    <select 
                                        value={deptFilter} 
                                        onChange={e => setDeptFilter(e.target.value)}
                                        className="w-full bg-transparent appearance-none border-none outline-none text-[15px] font-semibold text-slate-600 cursor-pointer pr-6"
                                    >
                                        <option value="all">Group: All Departments</option>
                                        {uniqueDepts.map(dept => (
                                            <option key={dept} value={dept}>Group: {dept}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex justify-end mb-6 px-2">
                                <div className="relative flex items-center bg-white border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm">
                                    <select 
                                        value={sortOrder} 
                                        onChange={e => setSortOrder(e.target.value)}
                                        className="bg-transparent appearance-none border-none outline-none text-[14px] font-semibold text-slate-500 cursor-pointer pr-6 text-right"
                                    >
                                        <option value="desc">Sort: Newest post</option>
                                        <option value="asc">Sort: Oldest post</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Combined Feed */}
                            {feedItems.length > 0 ? (
                                feedItems.map(item => {
                                    if (item.type === 'birthday') {
                                        const emp = item.data;
                                        return (
                                            <div key={item.id} className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-slate-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 bg-white rounded-full border border-blue-100 flex items-center justify-center p-2 shadow-sm">
                                                        <div className="text-blue-600 font-black text-xl italic">{emp.first_name?.[0]}</div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] text-slate-400 font-medium">Today</p>
                                                    </div>
                                                </div>

                                                <p className="text-[16px] text-[#2D3748] font-medium leading-relaxed mb-6">
                                                    Happy Birthday {emp.first_name} {emp.last_name}, Have a great year ahead! 🥳🧁
                                                </p>

                                                {/* Birthday Card */}
                                                <div className="bg-white rounded-3xl overflow-hidden border border-pink-50 shadow-md mb-6">
                                                    <div className="h-28 bg-[#FFF5F7]"></div>
                                                    <div className="flex flex-col items-center -mt-12 pb-8">
                                                        <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-rose-500 text-white rounded-full shadow-lg border-[4px] border-white flex items-center justify-center text-[28px] font-black mb-4">
                                                            {emp.first_name?.[0]}{emp.last_name ? emp.last_name[0] : ''}
                                                        </div>
                                                        <p className="text-pink-500 font-bold text-[15px] mb-1">Happy Birthday!</p>
                                                        <h3 className="text-[22px] font-black text-[#2D3748]">{emp.first_name} {emp.last_name}</h3>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 mb-6 px-1">
                                                    <span className="text-sm">🚀</span>
                                                    <span className="text-[14px] text-blue-500 font-semibold">React to send a wish</span>
                                                </div>

                                                <div className="flex border-t border-slate-50 pt-4">
                                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 font-bold active:bg-slate-50 rounded-xl transition-colors">
                                                        <ThumbsUp size={20} strokeWidth={2} />
                                                        <span>React</span>
                                                    </button>
                                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 font-bold active:bg-slate-50 rounded-xl transition-colors">
                                                        <MessageSquare size={20} strokeWidth={2} />
                                                        <span>Comment</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    } else if (item.type === 'upcoming_birthday') {
                                        const emp = item.data;
                                        return (
                                            <div key={item.id} className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-slate-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 bg-white rounded-full border border-blue-100 flex items-center justify-center p-2 shadow-sm">
                                                        <div className="text-indigo-600 font-black text-xl italic">{emp.first_name?.[0]}</div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] text-slate-400 font-medium">Upcoming</p>
                                                    </div>
                                                </div>

                                                <p className="text-[16px] text-[#2D3748] font-medium leading-relaxed mb-6">
                                                    Upcoming Birthday alert! {emp.first_name} {emp.last_name}'s birthday is coming up in {emp.daysLeft} {emp.daysLeft === 1 ? 'day' : 'days'}! 🎉🎈
                                                </p>

                                                {/* Birthday Card */}
                                                <div className="bg-white rounded-3xl overflow-hidden border border-indigo-50 shadow-md mb-6">
                                                    <div className="h-28 bg-[#EEF2FF]"></div>
                                                    <div className="flex flex-col items-center -mt-12 pb-8">
                                                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full shadow-lg border-[4px] border-white flex items-center justify-center text-[28px] font-black mb-4">
                                                            {emp.first_name?.[0]}{emp.last_name ? emp.last_name[0] : ''}
                                                        </div>
                                                        <p className="text-indigo-500 font-bold text-[15px] mb-1">Upcoming Birthday!</p>
                                                        <h3 className="text-[22px] font-black text-[#2D3748]">{emp.first_name} {emp.last_name}</h3>
                                                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">on {new Date(emp.nextBdayDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                                    </div>
                                                </div>

                                                <div className="flex border-t border-slate-50 pt-4">
                                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 font-bold active:bg-slate-50 rounded-xl transition-colors">
                                                        <ThumbsUp size={20} strokeWidth={2} />
                                                        <span>React</span>
                                                    </button>
                                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 font-bold active:bg-slate-50 rounded-xl transition-colors">
                                                        <MessageSquare size={20} strokeWidth={2} />
                                                        <span>Comment</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    } else if (item.type === 'kudos') {
                                        const kudos = item.data;
                                        const badgeEmojis = {
                                            'Thank You': '🙏',
                                            'Team Player': '🤝',
                                            'Going Extra Mile': '🚀',
                                            'Good Job': '⭐'
                                        };
                                        const badgeEmoji = badgeEmojis[kudos.badge] || '🎉';
                                        return (
                                            <div key={item.id} className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-slate-100 text-left">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-full border border-indigo-100 flex items-center justify-center p-2 shadow-sm">
                                                        <span className="text-2xl">{badgeEmoji}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            <span className="text-indigo-600 font-black">{kudos.sender_first_name} {kudos.sender_last_name}</span> appreciated <span className="text-indigo-600 font-black">{kudos.recipient_first_name} {kudos.recipient_last_name}</span>
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(kudos.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {kudos.message && (
                                                    <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 mb-6 italic text-slate-600 text-sm font-semibold leading-relaxed">
                                                        "{kudos.message}"
                                                    </div>
                                                )}

                                                <div className="bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-3xl p-6 text-center border border-indigo-100/30 mb-6">
                                                    <span className="text-4xl block mb-2">{badgeEmoji}</span>
                                                    <p className="text-indigo-600 font-black text-lg uppercase tracking-wider mb-1">{kudos.badge}</p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase">Kudos Badge Awarded</p>
                                                </div>

                                                <div className="flex border-t border-slate-50 pt-4">
                                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 font-bold active:bg-slate-50 rounded-xl transition-colors">
                                                        <ThumbsUp size={20} strokeWidth={2} />
                                                        <span>React</span>
                                                    </button>
                                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 font-bold active:bg-slate-50 rounded-xl transition-colors">
                                                        <MessageSquare size={20} strokeWidth={2} />
                                                        <span>Comment</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-slate-100 text-center">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users size={28} />
                                    </div>
                                    <h4 className="text-[17px] font-bold text-slate-700">No Posts in Feed</h4>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Appreciate a teammate to start the conversation! ☀️</p>
                                </div>
                            )}

                            {/* Floating Create Button */}
                            <button 
                                onClick={() => setShowKudos(true)}
                                className="fixed bottom-24 right-6 bg-[#4361EE] text-white px-6 py-4 rounded-full flex items-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all z-50"
                            >
                                <Plus size={24} strokeWidth={2.5} />
                                <span className="font-bold text-[17px]">Create</span>
                            </button>
                        </div>
                    )}
                           {/* PUNCH FLOW DETAIL VIEW */}
                    {punchFlowState && (
                        <div className="max-w-xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-500 flex flex-col min-h-full pb-8 md:bg-white md:rounded-[32px] md:p-8 md:shadow-lg md:border md:border-slate-100 md:mt-6">
                            <div className="flex items-center gap-2 mb-6">
                                <button onClick={() => setPunchFlowState(null)} className="p-1 text-slate-600 active:scale-90 transition-transform">
                                    <ChevronLeft size={28} strokeWidth={1.5} />
                                </button>
                                <h2 className="text-[20px] font-bold text-[#2D3748] tracking-tight">Sign-{punchFlowState === 'in' ? 'In' : 'Out'} Details</h2>
                            </div>

                            {/* Location Accuracy Banner */}
                            {(() => {
                                if (locationLoading) {
                                    return (
                                        <div className="bg-blue-50/50 rounded-2xl p-4 mb-6 flex items-start justify-between border border-blue-100 shadow-sm animate-pulse w-full">
                                            <div className="flex gap-3">
                                                <MapPin size={24} className="text-blue-500 mt-1 shrink-0 animate-bounce" />
                                                <div>
                                                    <p className="text-[14px] text-blue-700 font-bold">Fetching Live Location...</p>
                                                    <p className="text-[12px] text-blue-500 font-medium opacity-80 mt-0.5">Acquiring high-accuracy GPS coordinates...</p>
                                                </div>
                                            </div>
                                            <div className="p-1 text-blue-500 animate-spin shrink-0">
                                                <RefreshCw size={20} strokeWidth={2} />
                                            </div>
                                        </div>
                                    );
                                }
                                if (locationError) {
                                    return (
                                        <div className="bg-rose-50/80 rounded-2xl p-4 mb-6 flex items-start justify-between border border-rose-200 shadow-sm w-full">
                                            <div className="flex gap-3">
                                                <AlertCircle size={24} className="text-rose-500 mt-1 shrink-0" />
                                                <div>
                                                    <p className="text-[14px] text-rose-700 font-bold">Location Access Blocked</p>
                                                    <p className="text-[12px] text-rose-600 font-semibold mt-0.5 leading-snug">{locationError}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={fetchLiveLocation}
                                                className="p-1 text-rose-500 hover:text-rose-700 active:scale-90 transition-transform shrink-0"
                                                title="Retry Location Fetch"
                                            >
                                                <RefreshCw size={20} strokeWidth={2} />
                                            </button>
                                        </div>
                                    );
                                }
                                if (locationCoords) {
                                    return (
                                        <div className="bg-[#F0FDF4] rounded-2xl p-4 mb-6 flex items-start justify-between border border-green-50 shadow-sm w-full">
                                            <div className="flex gap-3">
                                                <MapPin size={24} className="text-green-600 mt-1 shrink-0" />
                                                <div>
                                                    <p className="text-[14px] text-slate-700 font-bold">
                                                        Your Current Location Accuracy: {locationAccuracy ? `${Math.round(locationAccuracy)}m` : 'N/A'}
                                                    </p>
                                                    <p className="text-[13px] text-slate-500 font-semibold opacity-90 mt-0.5">
                                                        Long, Lat: {locationCoords.longitude.toFixed(7)}, {locationCoords.latitude.toFixed(7)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={fetchLiveLocation} 
                                                className="p-1 text-slate-500 hover:text-slate-700 active:scale-90 transition-transform shrink-0"
                                                title="Refresh Location"
                                            >
                                                <RefreshCw size={20} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="bg-amber-50/50 rounded-2xl p-4 mb-6 flex items-start justify-between border border-amber-100 shadow-sm w-full">
                                        <div className="flex gap-3">
                                            <AlertCircle size={24} className="text-amber-500 mt-1 shrink-0" />
                                            <div>
                                                <p className="text-[14px] text-amber-700 font-bold">Location Not Found</p>
                                                <p className="text-[12px] text-amber-600 font-medium mt-0.5">Click refresh to request live location permissions.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={fetchLiveLocation} 
                                            className="p-1 text-amber-500 hover:text-amber-700 active:scale-90 transition-transform shrink-0"
                                            title="Fetch Location"
                                        >
                                            <RefreshCw size={20} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                );
                            })()}

                            <div className="space-y-6 px-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[15px] text-slate-400 font-medium">Date</span>
                                    <span className="text-[16px] text-[#2D3748] font-semibold">{currentDateFormatted}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[15px] text-slate-400 font-medium">Time</span>
                                    <span className="text-[16px] text-[#2D3748] font-semibold">{timeString.split(' ')[0]} : {timeString.split(' ')[1]}</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[15px] text-slate-400 font-medium">Attendance Scheme</p>
                                    <p className="text-[16px] text-[#2D3748] font-semibold">Thursday | 10AM-6PM</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[15px] text-slate-400 font-medium">Sign {punchFlowState === 'in' ? 'In' : 'Out'} Location</p>
                                    <button 
                                        onClick={() => setShowLocationModal(true)}
                                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-[14px] p-4 flex justify-between items-center group active:bg-slate-100 transition-all"
                                    >
                                        <span className={`text-[16px] font-medium ${punchLocation ? 'text-[#2D3748]' : 'text-slate-400'}`}>
                                            {punchLocation || 'Please select your location'}
                                        </span>
                                        <ChevronDown size={20} className="text-slate-600" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[15px] text-slate-400 font-medium">Remarks</p>
                                    <textarea 
                                        value={punchRemarks}
                                        onChange={(e) => setPunchRemarks(e.target.value.substring(0, 200))}
                                        placeholder="Add Remarks"
                                        className="w-full border border-slate-200 rounded-[14px] p-4 bg-[#F8FAFC] resize-none h-[110px] text-[16px] text-[#2D3748] placeholder:text-slate-400 focus:outline-none focus:border-slate-300"
                                    ></textarea>
                                    <p className="text-[12px] text-slate-400 text-right">{punchRemarks.length}/200 characters</p>
                                </div>
                            </div>

                            <div className="mt-auto pt-8">
                                <button 
                                    disabled={!punchLocation || locationLoading || !!locationError || !locationCoords}
                                    onClick={submitPunch}
                                    className={`w-full py-3.5 rounded-full font-bold text-[17px] text-white transition-all duration-300 active:scale-[0.98] ${
                                        (!punchLocation || locationLoading || !!locationError || !locationCoords)
                                            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                            : 'bg-[#4361EE] shadow-lg shadow-blue-200 hover:brightness-105 active:scale-[0.97]'
                                    }`}
                                >
                                    {locationLoading 
                                        ? 'Fetching Location...' 
                                        : locationError 
                                            ? 'Location Permission Required' 
                                            : !locationCoords 
                                                ? 'Acquiring GPS Lock...'
                                                : `Sign ${punchFlowState === 'in' ? 'In' : 'Out'}`
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* LOCATION MODAL (Image 3 Style) */}
                {showLocationModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center animate-in fade-in duration-300">
                        <div className="bg-white w-full h-[85vh] rounded-t-[40px] p-8 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-[24px] font-bold text-[#1A202C] leading-tight max-w-[200px]">
                                    Select your Sign-{punchFlowState === 'in' ? 'In' : 'Out'} Location
                                </h3>
                                <button onClick={() => setShowLocationModal(false)} className="bg-slate-100 p-2 rounded-full text-slate-600 active:scale-90 transition-transform">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="relative mb-8">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search"
                                    className="w-full bg-[#F8FAFC] border-b border-slate-200 pl-12 py-4 text-[16px] focus:outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>

                            <div className="flex-1 space-y-2 overflow-y-auto pb-6">
                                {['Work from Home', 'Office', 'Client Location', 'On-Duty'].map((loc) => (
                                    <button
                                        key={loc}
                                        onClick={() => { setPunchLocation(loc); setShowLocationModal(false); }}
                                        className="w-full py-5 px-4 text-left font-semibold text-[18px] text-[#2D3748] active:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* KUDOS MODAL */}
                {showKudos && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-md rounded-[32px] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden text-left">
                            {!kudosSent ? (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-[22px] font-bold text-slate-800 tracking-tight">Give Kudos</h3>
                                            <p className="text-xs text-slate-400 font-semibold mt-1">Appreciate a teammate for their great work!</p>
                                        </div>
                                        <button onClick={() => setShowKudos(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 active:scale-90 transition-transform">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select Coworker</label>
                                            <select 
                                                value={kudosRecipient}
                                                onChange={e => setKudosRecipient(e.target.value)}
                                                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-[14px] px-4 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400"
                                            >
                                                <option value="">Choose a teammate...</option>
                                                {staffList.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                        </div>
 
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select Badge</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { label: 'Thank You', emoji: '🙏', color: 'bg-orange-50 border-orange-200 text-orange-600' },
                                                    { label: 'Team Player', emoji: '🤝', color: 'bg-blue-50 border-blue-200 text-blue-600' },
                                                    { label: 'Going Extra Mile', emoji: '🚀', color: 'bg-purple-50 border-purple-200 text-purple-600' },
                                                    { label: 'Good Job', emoji: '⭐', color: 'bg-emerald-50 border-emerald-200 text-emerald-600' }
                                                ].map(badge => (
                                                    <button
                                                        key={badge.label}
                                                        type="button"
                                                        onClick={() => setKudosBadge(badge.label)}
                                                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                                                            kudosBadge === badge.label 
                                                                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
                                                                : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                                                        }`}
                                                    >
                                                        <span className="text-xl">{badge.emoji}</span>
                                                        <span className={`text-[12px] font-bold ${kudosBadge === badge.label ? 'text-indigo-600' : 'text-slate-600'}`}>{badge.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
 
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Personal Message</label>
                                            <textarea 
                                                value={kudosMessage}
                                                onChange={e => setKudosMessage(e.target.value)}
                                                placeholder="Write something nice..."
                                                className="w-full border border-slate-200 rounded-[14px] p-4 bg-[#F8FAFC] resize-none h-[100px] text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                                            ></textarea>
                                        </div>
                                    </div>
 
                                    <button 
                                        onClick={handleSendKudos}
                                        className="w-full mt-6 py-3.5 bg-indigo-600 text-white rounded-full font-bold text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg shadow-indigo-100"
                                    >
                                        Send Kudos
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
                                        🎉
                                    </div>
                                    <h4 className="text-[20px] font-black text-slate-800">Kudos Sent Successfully!</h4>
                                    <p className="text-sm text-slate-400 font-semibold mt-2 px-4 leading-relaxed">
                                        Your appreciation for <span className="text-indigo-600 font-bold">{staffList.find(e => e.id === Number(kudosRecipient))?.name || 'Teammate'}</span> has been shared on the company feed.
                                    </p>
                                    <button 
                                        onClick={() => {
                                            setKudosSent(false);
                                            setShowKudos(false);
                                            setKudosRecipient('');
                                            setKudosMessage('');
                                        }}
                                        className="mt-8 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* REVIEW TASK MODAL */}
                {showReviewModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-md rounded-[32px] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 text-left">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-[22px] font-bold text-slate-800 tracking-tight">Review Tasks</h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-1">Pending action items for you</p>
                                </div>
                                <button onClick={() => setShowReviewModal(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 active:scale-90 transition-transform">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                {tasks.map(task => (
                                    <div key={task.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-3 flex flex-col justify-between">
                                        <div className="flex items-start justify-between gap-3 text-left">
                                            <span className="text-sm font-bold text-slate-700 leading-snug">{task.title}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                                                task.status === 'completed' 
                                                    ? 'bg-emerald-50 text-emerald-600' 
                                                    : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                {task.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100/50">
                                            {task.status === 'pending' && (
                                                <>
                                                    {task.link ? (
                                                        <button 
                                                            onClick={() => { setShowReviewModal(false); navigate(task.link); }}
                                                            className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                                                        >
                                                            Go To Task
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-amber-500 font-bold italic py-2">
                                                            Pending Manager Verification
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {task.status === 'completed' && (
                                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                    ✓ Done
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setShowReviewModal(false)}
                                className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {/* HELPDESK FAQ & TICKETS MODAL */}
                {showHelpdeskModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-[32px] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 text-left overflow-hidden max-h-[85vh]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-[22px] font-bold text-slate-800 tracking-tight">Helpdesk & Support</h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-1">Get support and view your query tickets</p>
                                </div>
                                <button onClick={() => { setShowHelpdeskModal(false); setFaqSearchQuery(''); setActiveFaqIndex(null); setSelectedTicket(null); setShowNewTicketForm(false); }} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 active:scale-90 transition-transform">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Helpdesk Tabs */}
                            <div className="flex border-b border-slate-100 mb-5 shrink-0">
                                <button 
                                    onClick={() => setHelpdeskTab('faqs')}
                                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-all ${helpdeskTab === 'faqs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    FAQs & Guides
                                </button>
                                <button 
                                    onClick={() => {
                                        setHelpdeskTab('tickets');
                                        setSelectedTicket(null);
                                        setShowNewTicketForm(false);
                                    }}
                                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-all ${helpdeskTab === 'tickets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Support Tickets
                                </button>
                            </div>

                            {helpdeskTab === 'faqs' ? (
                                <>
                                    {/* Search bar */}
                                    <div className="relative mb-5 shrink-0">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Search questions or keywords..."
                                            value={faqSearchQuery}
                                            onChange={e => setFaqSearchQuery(e.target.value)}
                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-[16px] pl-12 pr-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 transition-all"
                                        />
                                    </div>

                                    {/* Category Filter Pills */}
                                    <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar shrink-0 pb-1">
                                        {['All', 'General', 'Attendance', 'Leave', 'Salary', 'Profile'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => { setSelectedFaqCategory(cat); setActiveFaqIndex(null); }}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    selectedFaqCategory === cat 
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                                                        : 'bg-[#F8FAFC] border border-slate-100 hover:border-slate-200 text-slate-500'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Accordion Questions List */}
                                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4">
                                        {filteredFaqs.length > 0 ? (
                                            filteredFaqs.map((faq, index) => {
                                                const isOpen = activeFaqIndex === index;
                                                return (
                                                    <div key={index} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                                                        <button
                                                            onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                                                            className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-700 hover:bg-slate-50/50 transition-colors"
                                                        >
                                                            <span className="leading-snug">{faq.q}</span>
                                                            <span className="text-slate-400 shrink-0">
                                                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </span>
                                                        </button>
                                                        {isOpen && (
                                                            <div className="p-4 pt-0 text-xs font-medium text-slate-500 leading-relaxed border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
                                                                {faq.a}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-10">
                                                <p className="text-sm font-bold text-slate-400">No matching questions found.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Support Tickets View */
                                <div className="flex-1 flex flex-col overflow-hidden min-h-[350px]">
                                    {selectedTicket ? (
                                        /* Detailed Ticket Conversation Thread */
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            <div className="flex items-center gap-2 mb-4 shrink-0">
                                                <button 
                                                    onClick={() => setSelectedTicket(null)}
                                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg active:scale-95 transition-transform"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800 truncate max-w-[280px]">{selectedTicket.title}</h4>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{selectedTicket.category} • Priority: {selectedTicket.priority}</p>
                                                </div>
                                                <span className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    selectedTicket.status === 'Open' ? 'bg-orange-50 text-orange-500' :
                                                    selectedTicket.status === 'In Progress' ? 'bg-blue-50 text-blue-500' :
                                                    selectedTicket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-500' :
                                                    'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {selectedTicket.status}
                                                </span>
                                            </div>

                                            {/* Scrollable Conversation History */}
                                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                                                {/* Original Ticket Description */}
                                                <div className="bg-indigo-50/40 border border-indigo-100/40 p-4 rounded-xl text-left">
                                                    <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Issue Description</p>
                                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                                                    <span className="text-[9px] font-medium text-slate-400 block mt-2">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                                                </div>

                                                {/* Comments/Replies List */}
                                                {replies.map(reply => {
                                                    const isStaff = reply.sender_role === 'super_admin' || reply.sender_role === 'company_admin' || reply.sender_role === 'manager';
                                                    return (
                                                        <div key={reply.id} className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}>
                                                            <div className={`max-w-[85%] p-3.5 rounded-[20px] text-xs font-semibold leading-relaxed shadow-sm ${
                                                                isStaff 
                                                                    ? 'bg-slate-100 text-slate-700 rounded-tl-sm' 
                                                                    : 'bg-indigo-600 text-white rounded-tr-sm'
                                                            }`}>
                                                                <p className="whitespace-pre-wrap">{reply.message}</p>
                                                            </div>
                                                            <span className="text-[9px] font-medium text-slate-400 mt-1 px-1">
                                                                {isStaff ? `${reply.sender_first_name || 'Admin'} • ` : ''}{new Date(reply.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Send Reply Form */}
                                            <form onSubmit={handleSendReply} className="flex gap-2 mt-3 pt-2 border-t border-slate-100 shrink-0">
                                                <input
                                                    type="text"
                                                    placeholder="Type your response here..."
                                                    value={newReply}
                                                    onChange={e => setNewReply(e.target.value)}
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 transition-all"
                                                />
                                                <button 
                                                    type="submit"
                                                    disabled={!newReply.trim()}
                                                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:bg-slate-100 disabled:text-slate-300"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </form>
                                        </div>
                                    ) : showNewTicketForm ? (
                                        /* New Ticket Creation Form */
                                        <form onSubmit={handleCreateTicket} className="flex-1 flex flex-col justify-between overflow-y-auto">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-bold text-slate-800">Raise New Support Ticket</h4>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowNewTicketForm(false)}
                                                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                <div className="space-y-3 text-left">
                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Issue Category</label>
                                                        <select
                                                            value={newTicketCategory}
                                                            onChange={e => setNewTicketCategory(e.target.value)}
                                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400"
                                                        >
                                                            <option value="General">General Support</option>
                                                            <option value="IT">IT & System Logins</option>
                                                            <option value="HR">HR Policies & Documents</option>
                                                            <option value="Payroll">Payroll & Payslips</option>
                                                            <option value="Attendance">Attendance & Shifts</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Urgency Priority</label>
                                                        <div className="flex gap-2">
                                                            {['Low', 'Medium', 'High', 'Urgent'].map(prio => (
                                                                <button
                                                                    key={prio}
                                                                    type="button"
                                                                    onClick={() => setNewTicketPriority(prio)}
                                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                                        newTicketPriority === prio 
                                                                            ? prio === 'Low' ? 'bg-slate-100 text-slate-700 border-2 border-slate-300' :
                                                                              prio === 'Medium' ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' :
                                                                              prio === 'High' ? 'bg-orange-50 text-orange-600 border-2 border-orange-200' :
                                                                              'bg-red-50 text-red-600 border-2 border-red-200'
                                                                            : 'bg-[#F8FAFC] border border-slate-100 text-slate-400 font-bold'
                                                                    }`}
                                                                >
                                                                    {prio}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Subject Title</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Short summary of the issue..."
                                                            value={newTicketTitle}
                                                            onChange={e => setNewTicketTitle(e.target.value)}
                                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Detailed Description</label>
                                                        <textarea
                                                            placeholder="Please explain the details of the problem..."
                                                            rows={4}
                                                            value={newTicketDesc}
                                                            onChange={e => setNewTicketDesc(e.target.value)}
                                                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 resize-none"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submittingTicket || !newTicketTitle.trim() || !newTicketDesc.trim()}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-transform mt-5 disabled:bg-slate-100 disabled:text-slate-300"
                                            >
                                                {submittingTicket ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                                            </button>
                                        </form>
                                    ) : (
                                        /* Ticket List Pane */
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            <div className="flex justify-between items-center mb-3 shrink-0">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Tickets ({tickets.length})</span>
                                                <button 
                                                    onClick={() => setShowNewTicketForm(true)}
                                                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors"
                                                >
                                                    + Raise Ticket
                                                </button>
                                            </div>

                                            {/* Tickets Scroll area */}
                                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-4">
                                                {loadingTickets ? (
                                                    <p className="text-center py-10 text-xs font-bold text-slate-400">Loading tickets...</p>
                                                ) : tickets.length === 0 ? (
                                                    <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                        <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
                                                        <p className="text-xs font-bold text-slate-400">No support tickets raised yet.</p>
                                                    </div>
                                                ) : (
                                                    tickets.map(ticket => (
                                                        <div 
                                                            key={ticket.id}
                                                            onClick={() => {
                                                                setSelectedTicket(ticket);
                                                                fetchTicketDetails(ticket.id);
                                                            }}
                                                            className="bg-white hover:bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] gap-4"
                                                        >
                                                            <div className="min-w-0">
                                                                <h4 className="text-xs font-bold text-slate-800 truncate pr-2" title={ticket.title}>{ticket.title}</h4>
                                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">{ticket.category}</span>
                                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                                                        ticket.priority === 'Urgent' ? 'bg-red-50 text-red-500' :
                                                                        ticket.priority === 'High' ? 'bg-orange-50 text-orange-500' :
                                                                        'bg-slate-100 text-slate-400'
                                                                    }`}>{ticket.priority}</span>
                                                                    <span className="text-[9px] text-slate-400 font-medium">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                                ticket.status === 'Open' ? 'bg-orange-50 text-orange-500' :
                                                                ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-500' :
                                                                ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-500' :
                                                                'bg-slate-100 text-slate-400'
                                                            }`}>
                                                                {ticket.status}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer Quick Contact */}
                            <div className="mt-6 pt-5 border-t border-slate-100 shrink-0 bg-slate-50/40 rounded-t-[20px] -mx-8 -mb-8 px-8 pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-700">Still need help?</h4>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Reach out to your HR administrator directly</p>
                                </div>
                                <a 
                                    href="mailto:boss@myfasthr.com?subject=Helpdesk Query"
                                    className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full font-bold text-xs uppercase tracking-wider transition-colors inline-block text-center"
                                >
                                    Email HR Support
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;
