import React, { useState, useEffect } from 'react';
import { ChevronLeft, Home, Calendar, Info, X, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, Check, RefreshCw, Download } from 'lucide-react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const RegularizationView = ({ onBack, isFullPage = false }) => {
    const [userRole, setUserRole] = useState(localStorage.getItem('user_role') || 'employee');
    const isReviewer = ['company_admin', 'manager', 'super_admin'].includes(userRole);
    const [view, setView] = useState(isReviewer ? 'tabs' : 'intro'); // 'intro', 'tabs'
    const [activeTab, setActiveTab] = useState(isReviewer ? 'Pending' : 'Apply'); // 'Apply', 'Pending', 'History'
    const [myRequests, setMyRequests] = useState([]);
    const [reviewRequests, setReviewRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [date, setDate] = useState('');
    const [checkIn, setCheckIn] = useState('09:00');
    const [checkOut, setCheckOut] = useState('18:00');
    const [reason, setReason] = useState('');
    const [regularizationType, setRegularizationType] = useState('full_day');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [extendedHistory, setExtendedHistory] = useState(null);
    const [calLoading, setCalLoading] = useState(false);

    const handleIntroApply = () => {
        setView('tabs');
        setActiveTab('Apply');
    };

    const handleIntroViewPending = () => {
        setView('tabs');
        setActiveTab('Pending');
    };

    const fetchCalendarHistory = async () => {
        if (userRole === 'super_admin') return;
        setCalLoading(true);
        try {
            const data = await api.get('/attendance/history', {
                params: { month: calMonth, year: calYear, extended: 'true' }
            });
            setExtendedHistory(data);
        } catch (err) {
            console.error('Failed to fetch calendar history', err);
        } finally {
            setCalLoading(false);
        }
    };

    // Load data
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const myData = await api.get('/regularizations/mine');
            setMyRequests(myData || []);

            if (isReviewer) {
                const reviewData = await api.get('/regularizations/review');
                setReviewRequests(reviewData || []);
            }
        } catch (err) {
            console.error('Failed to fetch regularizations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'tabs') {
            fetchRequests();
        }
    }, [view, userRole]);

    useEffect(() => {
        if (view === 'tabs' && activeTab === 'Apply') {
            fetchCalendarHistory();
        }
    }, [view, activeTab, calMonth, calYear]);

    useEffect(() => {
        // Allow normal scrolling on mounted page
        document.body.style.overflow = 'auto';
        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.style.overflowY = 'auto';
        }
        return () => {
            // Restore default
            document.body.style.overflow = '';
            if (mainEl) {
                mainEl.style.overflowY = 'auto';
            }
        };
    }, []);

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if (!date) return setFormError('Please select a date.');
        if (!reason.trim()) return setFormError('Please provide a reason for regularization.');

        setSubmitting(true);
        try {
            await api.post('/regularizations', {
                date,
                check_in: checkIn ? `${checkIn}:00` : null,
                check_out: checkOut ? `${checkOut}:00` : null,
                reason,
                regularization_type: regularizationType
            });
            setFormSuccess('Your regularization request has been submitted successfully.');
            setDate('');
            setReason('');
            setRegularizationType('full_day');
            fetchRequests();
            fetchCalendarHistory();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit regularization request.';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReviewAction = async (id, status) => {
        try {
            await api.patch(`/regularizations/${id}/status`, { status });
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${status} request.`);
        }
    };

    const handleExport = () => {
        const dataToExport = reviewRequests.map(req => ({
            "Employee Code": req.employee_code,
            "Employee Name": `${req.first_name || ''} ${req.last_name || ''}`.trim(),
            "Request Date": req.date,
            "Requested Check In": req.check_in ? req.check_in.substring(0, 5) : '09:00',
            "Requested Check Out": req.check_out ? req.check_out.substring(0, 5) : '18:00',
            "Reason": req.reason,
            "Status": req.status,
            "Submitted At": req.created_at ? new Date(req.created_at).toLocaleDateString() : ''
        }));

        exportToCSV(dataToExport, "Subordinate_Regularization_Requests.csv");
    };

    if (isFullPage) {
        return (
            <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
                {/* Compact Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button 
                                onClick={onBack} 
                                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center shrink-0"
                            >
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                Attendance Regularization
                            </h1>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {isReviewer 
                                    ? `Review and manage subordinate attendance corrections (${reviewRequests.filter(r => r.status === 'pending').length} pending)` 
                                    : `Apply for attendance corrections and view your history`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Switcher & Export */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Tabs in clean pill switcher style */}
                    <div className="flex justify-between items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm max-w-md w-full">
                        {['Apply', 'Pending', 'History'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setFormError('');
                                    setFormSuccess('');
                                }}
                                className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all ${
                                    activeTab === tab 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {isReviewer && (
                        <button
                            onClick={handleExport}
                            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-bold text-xs flex items-center gap-2 active:scale-95 shrink-0"
                        >
                            <Download size={14} /> Export Requests
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="w-full">
                    {loading && (
                        <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center gap-4 border border-slate-100 shadow-sm animate-pulse">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading history...</p>
                        </div>
                    )}

                    {!loading && activeTab === 'Apply' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                            {/* Left Side: Calendar (7 cols on large screens) */}
                            <div className="lg:col-span-7 bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Attendance Calendar</h3>
                                        <p className="text-[11px] text-slate-400 font-bold mt-1">Select a date to apply regularization</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (calMonth === 1) {
                                                    setCalMonth(12);
                                                    setCalYear(prev => prev - 1);
                                                } else {
                                                    setCalMonth(prev => prev - 1);
                                                }
                                            }}
                                            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-[12px] font-black text-slate-700 min-w-[100px] text-center uppercase tracking-wider">
                                            {new Date(calYear, calMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (calMonth === 12) {
                                                    setCalMonth(1);
                                                    setCalYear(prev => prev + 1);
                                                } else {
                                                    setCalMonth(prev => prev + 1);
                                                }
                                            }}
                                            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar Loader / Grid */}
                                {calLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <RefreshCw size={24} className="animate-spin text-indigo-600 mb-2" />
                                        <span className="text-xs text-slate-400 font-bold">Syncing calendar...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Calendar grid */}
                                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
                                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                        </div>

                                        <div className="grid grid-cols-7 gap-2">
                                            {(() => {
                                                const cells = [];
                                                const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
                                                const offset = firstDay === 0 ? 6 : firstDay - 1;
                                                
                                                for (let i = 0; i < offset; i++) {
                                                    cells.push(<div key={`empty-${i}`} className="aspect-square bg-slate-50/30 rounded-2xl" />);
                                                }

                                                const totalDays = new Date(calYear, calMonth, 0).getDate();
                                                const getLocalYMD = (dateVal) => {
                                                    if (!dateVal) return '';
                                                    const d = new Date(dateVal);
                                                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                };
                                                const todayStr = getLocalYMD(new Date());

                                                for (let d = 1; d <= totalDays; d++) {
                                                    const dateObj = new Date(calYear, calMonth - 1, d);
                                                    const yyyy = calYear;
                                                    const mm = String(calMonth).padStart(2, '0');
                                                    const dd = String(d).padStart(2, '0');
                                                    const dateStr = `${yyyy}-${mm}-${dd}`;
                                                    
                                                    const isFuture = dateStr > todayStr;
                                                    const isToday = dateStr === todayStr;
                                                    
                                                    const attRecord = extendedHistory?.attendance?.find(a => getLocalYMD(a.check_in) === dateStr);
                                                    const leaveRecord = extendedHistory?.leaves?.find(l => {
                                                        const startStr = getLocalYMD(l.start_date);
                                                        const endStr = getLocalYMD(l.end_date);
                                                        return dateStr >= startStr && dateStr <= endStr;
                                                    });
                                                    const holidayRecord = extendedHistory?.holidays?.find(h => getLocalYMD(h.date) === dateStr);
                                                    
                                                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                                    const isWeekoff = extendedHistory?.weekoffs?.includes(dayName);
                                                    const regRequest = extendedHistory?.regularizations?.find(r => getLocalYMD(r.date) === dateStr);

                                                    let bgStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/50';
                                                    let badgeLabel = '';
                                                    let badgeStyle = '';
                                                    let subtitle = '';

                                                    if (isFuture) {
                                                        bgStyle = 'bg-slate-100/50 text-slate-300 cursor-not-allowed';
                                                    } else if (attRecord) {
                                                        if (attRecord.status === 'late') {
                                                            bgStyle = 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80';
                                                            badgeLabel = 'Late';
                                                            badgeStyle = 'bg-amber-500 text-white';
                                                        } else {
                                                            bgStyle = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80';
                                                            badgeLabel = 'Present';
                                                            badgeStyle = 'bg-emerald-500 text-white';
                                                        }
                                                        
                                                        const parseTime = (timeStr) => {
                                                            if (!timeStr) return '';
                                                            const parts = timeStr.split('T');
                                                            const timePart = parts[1] || parts[0];
                                                            return timePart.substring(0, 5);
                                                        };
                                                        const inTime = parseTime(attRecord.check_in);
                                                        const outTime = attRecord.check_out ? parseTime(attRecord.check_out) : '--:--';
                                                        subtitle = `${inTime}-${outTime}`;
                                                    } else if (leaveRecord) {
                                                        bgStyle = 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200/80';
                                                        badgeLabel = leaveRecord.status === 'approved' ? 'Leave' : 'Pending Leave';
                                                        badgeStyle = 'bg-purple-500 text-white';
                                                    } else if (holidayRecord) {
                                                        bgStyle = 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200/80';
                                                        badgeLabel = 'Holiday';
                                                        badgeStyle = 'bg-blue-500 text-white';
                                                        subtitle = holidayRecord.name;
                                                    } else if (isWeekoff) {
                                                        bgStyle = 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200/80';
                                                        badgeLabel = 'Week Off';
                                                        badgeStyle = 'bg-slate-400 text-white';
                                                    } else {
                                                        bgStyle = 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200/80';
                                                        badgeLabel = 'Absent';
                                                        badgeStyle = 'bg-rose-500 text-white';
                                                    }

                                                    let regIndicator = null;
                                                    if (regRequest) {
                                                        const regStatusColor = regRequest.status === 'approved' 
                                                            ? 'border-emerald-500 bg-emerald-500' 
                                                            : regRequest.status === 'rejected' 
                                                            ? 'border-rose-500 bg-rose-500' 
                                                            : 'border-amber-500 bg-amber-500';
                                                        
                                                        regIndicator = (
                                                            <div className="absolute top-1 right-1 flex items-center gap-1">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${regStatusColor}`} title={`Regularization ${regRequest.status}`} />
                                                            </div>
                                                        );
                                                    }

                                                    const isSelected = date === dateStr;

                                                    cells.push(
                                                        <button
                                                            key={`day-${d}`}
                                                            type="button"
                                                            disabled={isFuture}
                                                            onClick={() => {
                                                                setDate(dateStr);
                                                                if (attRecord) {
                                                                    const parseTime = (timeStr) => {
                                                                        if (!timeStr) return '09:00';
                                                                        const parts = timeStr.split('T');
                                                                        const timePart = parts[1] || parts[0];
                                                                        return timePart.substring(0, 5);
                                                                    };
                                                                    setCheckIn(parseTime(attRecord.check_in));
                                                                    setCheckOut(attRecord.check_out ? parseTime(attRecord.check_out) : '18:00');
                                                                } else {
                                                                    setCheckIn('09:00');
                                                                    setCheckOut('18:00');
                                                                }
                                                                setFormError('');
                                                                setFormSuccess('');
                                                            }}
                                                            className={`aspect-square relative rounded-2xl border p-2 md:p-3 flex flex-col justify-between items-start transition-all overflow-hidden ${bgStyle} ${
                                                                isSelected 
                                                                    ? 'ring-2 ring-indigo-650 ring-offset-2 border-transparent scale-98 shadow-md' 
                                                                    : 'hover:scale-[1.02] active:scale-95'
                                                            }`}
                                                        >
                                                            {regIndicator}
                                                            <span className={`text-[13px] sm:text-base font-black leading-none flex items-center justify-center ${isToday ? 'w-6 h-6 bg-indigo-600 text-white rounded-full text-xs' : ''}`}>
                                                                {d}
                                                            </span>
                                                            <div className="w-full flex flex-col text-left mt-1 md:mt-2">
                                                                {badgeLabel && (
                                                                    <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-tight truncate leading-tight mb-0.5">
                                                                        {badgeLabel}
                                                                    </span>
                                                                )}
                                                                {subtitle && (
                                                                    <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-400 truncate leading-tight">
                                                                        {subtitle}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                                return cells;
                                            })()}
                                        </div>
                                    </>
                                )}

                                {/* Calendar Legend */}
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-5 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-emerald-500 shrink-0" /> Present</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-amber-500 shrink-0" /> Late In</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-rose-500 shrink-0" /> Absent</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-purple-500 shrink-0" /> Leave</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-blue-500 shrink-0" /> Holiday</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-slate-400 shrink-0" /> Week Off</div>
                                </div>
                                <div className="flex flex-wrap gap-4 mt-2 text-[10px] font-bold text-slate-400">
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500 ring-offset-1" /> Regularization Pending</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500 ring-offset-1" /> Regularization Approved</div>
                                </div>
                            </div>

                            {/* Right Side: Form (5 cols on large screens) */}
                            <div className="lg:col-span-5 bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-5">
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Correction Request</h3>
                                
                                {formSuccess && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex gap-3 items-start text-[14px] font-bold">
                                        <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                                        <span>{formSuccess}</span>
                                    </div>
                                )}

                                {formError && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex gap-3 items-start text-[14px] font-bold">
                                        <XCircle size={20} className="shrink-0 text-rose-600" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleApplySubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-450 uppercase tracking-widest mb-2">Selected Date</label>
                                        <input 
                                            type="text" 
                                            required
                                            readOnly
                                            value={date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                            placeholder="Click a date on the calendar"
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[14px] bg-slate-50 cursor-pointer text-indigo-600"
                                        />
                                        <p className="text-[10px] text-indigo-500 font-bold mt-1.5">Please click on a date from the calendar to select.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-450 uppercase tracking-widest mb-2">Requested Check In</label>
                                            <input 
                                                type="time" 
                                                required
                                                value={checkIn}
                                                onChange={(e) => setCheckIn(e.target.value)}
                                                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[14px] bg-slate-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-450 uppercase tracking-widest mb-2">Requested Check Out</label>
                                            <input 
                                                type="time" 
                                                required
                                                value={checkOut}
                                                onChange={(e) => setCheckOut(e.target.value)}
                                                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[14px] bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-450 uppercase tracking-widest mb-2">Regularization Type</label>
                                        <select 
                                            value={regularizationType}
                                            onChange={(e) => setRegularizationType(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[14px] bg-slate-50 cursor-pointer text-slate-700"
                                        >
                                            <option value="full_day">Full Day Present</option>
                                            <option value="half_day">Half Day Present</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-450 uppercase tracking-widest mb-2">Reason for regularization</label>
                                        <textarea 
                                            required
                                            rows={4}
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="e.g. Forgot to punch out / Onsite meeting..."
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-[14px] bg-slate-50"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-98 transition-all disabled:opacity-50 shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? 'Submitting request...' : 'Apply Regularization'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === 'Pending' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Review requests section for manager/admin */}
                            {isReviewer && (
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Subordinate Approvals ({reviewRequests.filter(r => r.status === 'pending').length})</h4>
                                    {reviewRequests.filter(r => r.status === 'pending').length === 0 ? (
                                        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                                            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">No pending subordinate regularization requests.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {reviewRequests.filter(r => r.status === 'pending').map((item) => (
                                                <div key={item.id} className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h4 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">{item.first_name} {item.last_name}</h4>
                                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.employee_code}</p>
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">Needs Review</span>
                                                        </div>

                                                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2 mb-6 text-[12px]">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 font-bold uppercase tracking-tighter">Date:</span>
                                                                <span className="text-slate-800 font-black">{item.date}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 font-bold uppercase tracking-tighter">Type:</span>
                                                                <span className="text-slate-800 font-black">{item.regularization_type === 'half_day' ? 'Half Day' : 'Full Day'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 font-bold uppercase tracking-tighter">Adjusted Time:</span>
                                                                <span className="text-slate-800 font-black">
                                                                    {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                                </span>
                                                            </div>
                                                            <div className="pt-2 border-t border-slate-200/60">
                                                                <span className="text-slate-400 font-bold uppercase tracking-tighter block mb-1">Reason:</span>
                                                                <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button 
                                                            onClick={() => handleReviewAction(item.id, 'rejected')}
                                                            className="flex-1 py-2.5 px-4 border border-rose-150 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all bg-rose-50/30 hover:bg-rose-50"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReviewAction(item.id, 'approved')}
                                                            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                                                        >
                                                            <Check size={14} strokeWidth={2.5} /> Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Personal Pending Section */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">My Pending Requests</h4>
                                {myRequests.filter(r => r.status === 'pending').length === 0 ? (
                                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">No pending regularization requests.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myRequests.filter(r => r.status === 'pending').map((item) => (
                                            <div key={item.id} className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">{item.date}</h4>
                                                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">Applied: {new Date(item.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">Pending Review</span>
                                                </div>

                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-[12px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Type:</span>
                                                        <span className="text-slate-800 font-black">{item.regularization_type === 'half_day' ? 'Half Day' : 'Full Day'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Time Window:</span>
                                                        <span className="text-slate-800 font-black">
                                                            {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200/60">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter block mb-1">Reason:</span>
                                                        <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === 'History' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Subordinate approvals history */}
                            {isReviewer && (
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Subordinate Request History</h4>
                                    {reviewRequests.filter(r => r.status !== 'pending').length === 0 ? (
                                        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                                            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">No history available.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {reviewRequests.filter(r => r.status !== 'pending').map((item) => (
                                                <div key={item.id} className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">{item.first_name} {item.last_name}</h4>
                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.employee_code}</p>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                                                            item.status === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'
                                                        }`}>
                                                            {item.status === 'approved' ? 'Approved' : 'Rejected'}
                                                        </span>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-[12px]">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Date:</span>
                                                            <span className="text-slate-800 font-black">{item.date}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Requested:</span>
                                                            <span className="text-slate-800 font-black">
                                                                {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                            </span>
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-200/60">
                                                            <span className="text-slate-400 font-bold uppercase tracking-tighter block mb-1">Reason:</span>
                                                            <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Personal History */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">My History</h4>
                                {myRequests.filter(r => r.status !== 'pending').length === 0 ? (
                                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">No history available.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myRequests.filter(r => r.status !== 'pending').map((item) => (
                                            <div key={item.id} className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">{item.date}</h4>
                                                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">Applied: {new Date(item.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                                                        item.status === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'
                                                    }`}>
                                                        {item.status === 'approved' ? 'Approved' : 'Rejected'}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-[12px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter">Time Window:</span>
                                                        <span className="text-slate-800 font-black">
                                                            {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200/60">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter block mb-1">Reason:</span>
                                                        <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'intro') {
        return (
            <div className="flex flex-col h-screen bg-slate-50 animate-in fade-in duration-500">
                {/* Header */}
                <div className="h-16 bg-white flex items-center px-4 border-b border-slate-100 sticky top-0 z-10">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="ml-2 text-[20px] font-bold text-[#1e293b]">Regularization</h1>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-[#4361ee] mb-6">
                            <Calendar size={32} />
                        </div>

                        <h2 className="text-[20px] font-black text-slate-800 text-center mb-2">Need to adjust attendance?</h2>
                        <p className="text-[14px] text-slate-400 text-center font-medium mb-8 leading-relaxed">
                            Apply for regularization to correct check-in or check-out exceptions. Your manager and administrator will review the request.
                        </p>

                        <div className="flex gap-4 w-full">
                            <button 
                                onClick={handleIntroViewPending}
                                className="flex-1 py-3.5 px-4 border border-slate-200 rounded-full text-slate-700 font-extrabold text-[14px] active:scale-95 transition-all shadow-sm bg-white"
                            >
                                View Status
                            </button>
                            <button 
                                onClick={handleIntroApply}
                                className="flex-1 py-3.5 px-4 bg-[#4361ee] rounded-full text-white font-extrabold text-[14px] active:scale-95 transition-all shadow-md shadow-indigo-100"
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="h-16 bg-white flex items-center justify-between px-4 border-b border-slate-100 sticky top-0 z-10 shrink-0">
                <div className="flex items-center">
                    <button onClick={() => setView('intro')} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="ml-2 text-[20px] font-bold text-[#1e293b]">Regularization</h1>
                </div>
                <button onClick={onBack} className="p-2 text-slate-600 active:scale-90 transition-transform">
                    <Home size={22} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white border-b border-slate-100 px-2 shrink-0">
                {['Apply', 'Pending', 'History'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setFormError('');
                            setFormSuccess('');
                        }}
                        className={`flex-1 py-4 text-[15px] font-extrabold transition-all relative ${
                            activeTab === tab ? 'text-[#4361ee]' : 'text-slate-400'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[#4361ee] rounded-t-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pb-10">
                <div className="max-w-5xl mx-auto p-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="text-[13px] text-slate-400 font-bold mt-3">Syncing history...</span>
                        </div>
                    )}

                    {!loading && activeTab === 'Apply' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                            {/* Left Side: Calendar (7 cols on large screens) */}
                            <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-[18px] font-black text-slate-800">Attendance Calendar</h3>
                                        <p className="text-[12px] text-slate-400 font-bold mt-1">Select a date to apply regularization</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (calMonth === 1) {
                                                    setCalMonth(12);
                                                    setCalYear(prev => prev - 1);
                                                } else {
                                                    setCalMonth(prev => prev - 1);
                                                }
                                            }}
                                            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-[14px] font-black text-slate-700 min-w-[100px] text-center">
                                            {new Date(calYear, calMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (calMonth === 12) {
                                                    setCalMonth(1);
                                                    setCalYear(prev => prev + 1);
                                                } else {
                                                    setCalMonth(prev => prev + 1);
                                                }
                                            }}
                                            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar Loader */}
                                {calLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <RefreshCw size={24} className="animate-spin text-[#4361ee] mb-2" />
                                        <span className="text-[12px] text-slate-400 font-bold">Syncing calendar...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Days Header */}
                                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                <div key={day} className="text-[11px] font-black text-slate-400 uppercase tracking-wider py-2">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Days Grid */}
                                        <div className="grid grid-cols-7 gap-1.5">
                                            {(() => {
                                                const cells = [];
                                                const firstDayIndex = new Date(calYear, calMonth - 1, 1).getDay();
                                                const totalDays = new Date(calYear, calMonth, 0).getDate();
                                                
                                                // Adjust firstDayIndex to start with Monday (1) instead of Sunday (0)
                                                // index mapping: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
                                                const paddingCellsCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
                                                
                                                // Padding
                                                for (let i = 0; i < paddingCellsCount; i++) {
                                                    cells.push(<div key={`pad-${i}`} className="aspect-square bg-slate-50/20 rounded-xl"></div>);
                                                }

                                                const getLocalYMD = (dateVal) => {
                                                    if (!dateVal) return null;
                                                    const d = new Date(dateVal);
                                                    if (isNaN(d.getTime())) return null;
                                                    const y = d.getFullYear();
                                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    return `${y}-${m}-${day}`;
                                                };

                                                const todayStr = getLocalYMD(new Date());

                                                // Days
                                                for (let d = 1; d <= totalDays; d++) {
                                                    const dateObj = new Date(calYear, calMonth - 1, d);
                                                    const yyyy = calYear;
                                                    const mm = String(calMonth).padStart(2, '0');
                                                    const dd = String(d).padStart(2, '0');
                                                    const dateStr = `${yyyy}-${mm}-${dd}`;
                                                    
                                                    const isFuture = dateStr > todayStr;
                                                    const isToday = dateStr === todayStr;
                                                    
                                                    // Find matching records
                                                    const attRecord = extendedHistory?.attendance?.find(a => getLocalYMD(a.check_in) === dateStr);
                                                    const leaveRecord = extendedHistory?.leaves?.find(l => {
                                                        const startStr = getLocalYMD(l.start_date);
                                                        const endStr = getLocalYMD(l.end_date);
                                                        return dateStr >= startStr && dateStr <= endStr;
                                                    });
                                                    const holidayRecord = extendedHistory?.holidays?.find(h => getLocalYMD(h.date) === dateStr);
                                                    
                                                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                                    const isWeekoff = extendedHistory?.weekoffs?.includes(dayName);
                                                    
                                                    const regRequest = extendedHistory?.regularizations?.find(r => getLocalYMD(r.date) === dateStr);

                                                    // Determine styles and labels
                                                    let bgStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/50';
                                                    let badgeLabel = '';
                                                    let badgeStyle = '';
                                                    let subtitle = '';

                                                    if (isFuture) {
                                                        bgStyle = 'bg-slate-100/50 text-slate-300 cursor-not-allowed';
                                                    } else if (attRecord) {
                                                        if (attRecord.status === 'late') {
                                                            bgStyle = 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80';
                                                            badgeLabel = 'Late';
                                                            badgeStyle = 'bg-amber-500 text-white';
                                                        } else {
                                                            bgStyle = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80';
                                                            badgeLabel = 'Present';
                                                            badgeStyle = 'bg-emerald-500 text-white';
                                                        }
                                                        
                                                        // Format punch times
                                                        const parseTime = (timeStr) => {
                                                            if (!timeStr) return '';
                                                            const parts = timeStr.split('T');
                                                            const timePart = parts[1] || parts[0];
                                                            return timePart.substring(0, 5);
                                                        };
                                                        const inTime = parseTime(attRecord.check_in);
                                                        const outTime = attRecord.check_out ? parseTime(attRecord.check_out) : '--:--';
                                                        subtitle = `${inTime}-${outTime}`;
                                                    } else if (leaveRecord) {
                                                        bgStyle = 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200/80';
                                                        badgeLabel = leaveRecord.status === 'approved' ? 'Leave' : 'Pending Leave';
                                                        badgeStyle = 'bg-purple-500 text-white';
                                                    } else if (holidayRecord) {
                                                        bgStyle = 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200/80';
                                                        badgeLabel = 'Holiday';
                                                        badgeStyle = 'bg-blue-500 text-white';
                                                        subtitle = holidayRecord.name;
                                                    } else if (isWeekoff) {
                                                        bgStyle = 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200/80';
                                                        badgeLabel = 'Week Off';
                                                        badgeStyle = 'bg-slate-400 text-white';
                                                    } else {
                                                        bgStyle = 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200/80';
                                                        badgeLabel = 'Absent';
                                                        badgeStyle = 'bg-rose-500 text-white';
                                                    }

                                                    // Regularization Indicator border overlay
                                                    let regIndicator = null;
                                                    if (regRequest) {
                                                        const regStatusColor = regRequest.status === 'approved' 
                                                            ? 'border-emerald-500 bg-emerald-500' 
                                                            : regRequest.status === 'rejected' 
                                                            ? 'border-rose-500 bg-rose-500' 
                                                            : 'border-amber-500 bg-amber-500';
                                                        
                                                        regIndicator = (
                                                            <div className="absolute top-1 right-1 flex items-center gap-1">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${regStatusColor}`} title={`Regularization ${regRequest.status}`} />
                                                            </div>
                                                        );
                                                    }

                                                    const isSelected = date === dateStr;

                                                    cells.push(
                                                        <button
                                                            key={`day-${d}`}
                                                            type="button"
                                                            disabled={isFuture}
                                                            onClick={() => {
                                                                setDate(dateStr);
                                                                if (attRecord) {
                                                                    const parseTime = (timeStr) => {
                                                                        if (!timeStr) return '09:00';
                                                                        const parts = timeStr.split('T');
                                                                        const timePart = parts[1] || parts[0];
                                                                        return timePart.substring(0, 5);
                                                                    };
                                                                    setCheckIn(parseTime(attRecord.check_in));
                                                                    setCheckOut(attRecord.check_out ? parseTime(attRecord.check_out) : '18:00');
                                                                } else {
                                                                    setCheckIn('09:00');
                                                                    setCheckOut('18:00');
                                                                }
                                                                setFormError('');
                                                                setFormSuccess('');
                                                            }}
                                                            className={`aspect-square relative rounded-2xl border p-1.5 flex flex-col justify-between items-start transition-all overflow-hidden ${bgStyle} ${
                                                                isSelected 
                                                                    ? 'ring-2 ring-[#4361ee] ring-offset-2 border-transparent scale-98 shadow-sm' 
                                                                    : 'active:scale-95'
                                                            }`}
                                                        >
                                                            {regIndicator}
                                                            
                                                            <span className={`text-[13px] font-black leading-none ${isToday ? 'w-5 h-5 bg-[#4361ee] text-white flex items-center justify-center rounded-full text-[11px]' : ''}`}>
                                                                {d}
                                                            </span>

                                                            <div className="w-full flex flex-col text-left">
                                                                {badgeLabel && (
                                                                    <span className="text-[8px] font-black uppercase tracking-tight truncate leading-none mb-0.5">
                                                                        {badgeLabel}
                                                                    </span>
                                                                )}
                                                                {subtitle && (
                                                                    <span className="text-[7.5px] font-bold text-slate-400 truncate leading-none">
                                                                        {subtitle}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                                return cells;
                                            })()}
                                        </div>

                                        {/* Calendar Legend */}
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-5 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-emerald-500 shrink-0" /> Present</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-amber-500 shrink-0" /> Late In</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-rose-500 shrink-0" /> Absent</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-purple-500 shrink-0" /> Leave</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-blue-500 shrink-0" /> Holiday</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-2.5 h-2.5 rounded-md bg-slate-400 shrink-0" /> Week Off</div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 mt-2 text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500 ring-offset-1" /> Regularization Pending</div>
                                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500 ring-offset-1" /> Regularization Approved</div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Right Side: Form (5 cols on large screens) */}
                            <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <h3 className="text-[18px] font-black text-slate-800 mb-6">Correction Request</h3>
                                
                                {formSuccess && (
                                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex gap-3 items-start text-[14px] font-bold">
                                        <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                                        <span>{formSuccess}</span>
                                    </div>
                                )}

                                {formError && (
                                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex gap-3 items-start text-[14px] font-bold">
                                        <XCircle size={20} className="shrink-0 text-rose-600" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleApplySubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-[13px] font-black text-slate-450 uppercase tracking-wider mb-2">Selected Date</label>
                                        <input 
                                            type="text" 
                                            required
                                            readOnly
                                            value={date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                            placeholder="Click a date on the calendar"
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[15px] bg-slate-50 cursor-pointer text-indigo-600"
                                        />
                                        <p className="text-[11px] text-indigo-550 font-bold mt-1.5">Please click on a date from the calendar to select.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[13px] font-black text-slate-455 uppercase tracking-wider mb-2">Requested Check In</label>
                                            <input 
                                                type="time" 
                                                required
                                                value={checkIn}
                                                onChange={(e) => setCheckIn(e.target.value)}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-[15px] bg-slate-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-black text-slate-455 uppercase tracking-wider mb-2">Requested Check Out</label>
                                            <input 
                                                type="time" 
                                                required
                                                value={checkOut}
                                                onChange={(e) => setCheckOut(e.target.value)}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-[15px] bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[13px] font-black text-slate-450 uppercase tracking-wider mb-2">Reason for regularization</label>
                                        <textarea 
                                            required
                                            rows={4}
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="e.g. Forgot to punch out / Onsite meeting / Machine issue..."
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-[15px] bg-slate-50"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-[#4361ee] text-white rounded-full font-extrabold text-[15px] active:scale-98 transition-all disabled:opacity-50 shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? 'Submitting request...' : 'Apply Regularization'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === 'Pending' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Review requests section for manager/admin */}
                            {isReviewer && reviewRequests.filter(r => r.status === 'pending').length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-wider px-2">Subordinate Approvals ({reviewRequests.filter(r => r.status === 'pending').length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {reviewRequests.filter(r => r.status === 'pending').map((item) => (
                                            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="text-[16px] font-black text-slate-800">{item.first_name} {item.last_name}</h4>
                                                            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.employee_code}</p>
                                                        </div>
                                                        <span className="text-[12px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-bold">Needs Review</span>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 mb-4 text-[14px]">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 font-bold">Date:</span>
                                                            <span className="text-slate-800 font-black">{item.date}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 font-bold">Adjusted:</span>
                                                            <span className="text-slate-800 font-black">
                                                                {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                            </span>
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-200">
                                                            <span className="text-slate-400 font-bold block mb-1">Reason:</span>
                                                            <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => handleReviewAction(item.id, 'rejected')}
                                                        className="flex-1 py-3 px-4 border border-rose-100 text-rose-600 rounded-full font-extrabold text-[13px] active:scale-95 transition-all bg-rose-50/50 hover:bg-rose-50"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReviewAction(item.id, 'approved')}
                                                        className="flex-1 py-3 px-4 bg-[#4361ee] text-white rounded-full font-extrabold text-[13px] active:scale-95 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                                                    >
                                                        <Check size={16} strokeWidth={2.5} /> Approve
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Personal Pending Section */}
                            <div className="space-y-4">
                                <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-wider px-2">My Pending Requests</h4>
                                {myRequests.filter(r => r.status === 'pending').length === 0 ? (
                                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
                                        <p className="text-[14px] text-slate-400 font-bold">No pending regularization requests.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myRequests.filter(r => r.status === 'pending').map((item) => (
                                            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="text-[16px] font-black text-slate-800">{item.date}</h4>
                                                        <p className="text-[12px] text-slate-400 font-bold mt-0.5">Applied on {new Date(item.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className="text-[12px] text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-bold">Pending Review</span>
                                                </div>

                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-[14px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold">Time Window:</span>
                                                        <span className="text-slate-800 font-black">
                                                            {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200">
                                                        <span className="text-slate-400 font-bold block mb-1">Reason:</span>
                                                        <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === 'History' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Subordinate approvals history */}
                            {isReviewer && reviewRequests.filter(r => r.status !== 'pending').length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-wider px-2">Subordinate Request History</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {reviewRequests.filter(r => r.status !== 'pending').map((item) => (
                                            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="text-[16px] font-black text-slate-800">{item.first_name} {item.last_name}</h4>
                                                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.employee_code}</p>
                                                    </div>
                                                    <span className={`text-[12px] px-3 py-1 rounded-full font-bold ${
                                                        item.status === 'approved' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                                                    }`}>
                                                        {item.status === 'approved' ? 'Approved' : 'Rejected'}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-[14px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold">Date:</span>
                                                        <span className="text-slate-800 font-black">{item.date}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold">Requested:</span>
                                                        <span className="text-slate-800 font-black">
                                                            {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200">
                                                        <span className="text-slate-400 font-bold block mb-1">Reason:</span>
                                                        <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Personal History */}
                            <div className="space-y-4">
                                <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-wider px-2">My History</h4>
                                {myRequests.filter(r => r.status !== 'pending').length === 0 ? (
                                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
                                        <p className="text-[14px] text-slate-400 font-bold">No history available.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myRequests.filter(r => r.status !== 'pending').map((item) => (
                                            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="text-[16px] font-black text-slate-800">{item.date}</h4>
                                                        <p className="text-[12px] text-slate-400 font-bold mt-0.5">Applied on {new Date(item.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={`text-[12px] px-3 py-1 rounded-full font-bold ${
                                                        item.status === 'approved' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                                                    }`}>
                                                        {item.status === 'approved' ? 'Approved' : 'Rejected'}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-[14px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold">Time Window:</span>
                                                        <span className="text-slate-800 font-black">
                                                            {item.check_in ? item.check_in.substring(0, 5) : '09:00'} - {item.check_out ? item.check_out.substring(0, 5) : '18:00'}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200">
                                                        <span className="text-slate-400 font-bold block mb-1">Reason:</span>
                                                        <span className="text-slate-700 font-medium italic">"{item.reason}"</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegularizationView;
