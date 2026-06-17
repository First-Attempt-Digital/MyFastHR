import React, { useState, useEffect } from 'react';
import { 
    Calendar, Users, Clock, CheckCircle, AlertCircle, 
    ArrowRight, Search, Filter, Download, UserCheck,
    ChevronDown, MapPin, Monitor, Smartphone, Briefcase, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const WhoIsIn = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [selectedMapEmployee, setSelectedMapEmployee] = useState(null);
    const [mapTab, setMapTab] = useState('in'); // 'in' or 'out'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShiftId, setSelectedShiftId] = useState('all');
    const [selectedOutlet, setSelectedOutlet] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedDesignation, setSelectedDesignation] = useState('all');
    const [shifts, setShifts] = useState([]);
    const [data, setData] = useState({
        summary: [],
        notYetIn: [],
        lateArrivals: [],
        onTime: [],
        onLeaveCount: 0
    });

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const shiftList = await api.get('/attendance/shift-list');
                setShifts(shiftList || []);
            } catch (err) {
                console.error('Failed to fetch shifts', err);
            }
        };
        fetchShifts();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/attendance/whos-in?date=${selectedDate}`);
            setData(response);
        } catch (err) {
            console.error('Failed to fetch Whos In data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadNotYetIn = () => {
        if (!filteredNotYetIn || filteredNotYetIn.length === 0) {
            alert('No records to export');
            return;
        }
        const headers = {
            id: 'Employee ID',
            name: 'Employee Name',
            shift_name: 'Shift Name',
            time: 'Expected Arrival'
        };
        exportToCSV(filteredNotYetIn, `Not_Yet_In_${selectedDate}.csv`, headers);
    };

    const handleDownloadLateArrivals = () => {
        if (!filteredLateArrivals || filteredLateArrivals.length === 0) {
            alert('No records to export');
            return;
        }
        const headers = {
            id: 'Employee ID',
            name: 'Employee Name',
            shift_name: 'Shift Name',
            late: 'Late By',
            time: 'Arrival Time'
        };
        exportToCSV(filteredLateArrivals, `Late_Arrivals_${selectedDate}.csv`, headers);
    };

    const handleDownloadOnTime = () => {
        if (!filteredOnTime || filteredOnTime.length === 0) {
            alert('No records to export');
            return;
        }
        const headers = {
            id: 'Employee ID',
            name: 'Employee Name',
            shift_name: 'Shift Name',
            early: 'Early By',
            time: 'Arrival Time'
        };
        exportToCSV(filteredOnTime, `On_Time_Arrivals_${selectedDate}.csv`, headers);
    };

    const formattedDisplayDate = new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const { summary, notYetIn, lateArrivals, onTime, onLeaveCount } = data;

    const matchText = (val, filterVal) => {
        if (filterVal === 'All' || filterVal === 'all') return true;
        if (!val) return false;
        const clean = (str) => String(str).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return clean(val) === clean(filterVal);
    };

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

    const selectedShiftName = selectedShiftId === 'all' 
        ? 'all' 
        : (shifts.find(s => String(s.id) === String(selectedShiftId))?.name || 'all');

    const uniqueOutlets = React.useMemo(() => {
        const outlets = new Map();
        const check = (o) => {
            if (o) {
                const clean = o.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const display = formatLabel(o);
                if (!outlets.has(clean)) {
                    outlets.set(clean, display);
                }
            }
        };
        [...(data.notYetIn || []), ...(data.lateArrivals || []), ...(data.onTime || [])].forEach(e => check(e.office_location));
        return ['all', ...Array.from(outlets.values()).sort()];
    }, [data.notYetIn, data.lateArrivals, data.onTime]);

    const uniqueDepts = React.useMemo(() => {
        const depts = new Map();
        const check = (e) => {
            const d = e.department_name || e.department;
            if (d) {
                const clean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const display = formatLabel(d);
                if (!depts.has(clean)) {
                    depts.set(clean, display);
                }
            }
        };
        [...(data.notYetIn || []), ...(data.lateArrivals || []), ...(data.onTime || [])].forEach(check);
        return ['all', ...Array.from(depts.values()).sort()];
    }, [data.notYetIn, data.lateArrivals, data.onTime]);

    const uniqueDesignations = React.useMemo(() => {
        const desgs = new Map();
        const check = (e) => {
            const d = e.designation || e.role;
            if (d) {
                const clean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const display = formatLabel(d);
                if (!desgs.has(clean)) {
                    desgs.set(clean, display);
                }
            }
        };
        [...(data.notYetIn || []), ...(data.lateArrivals || []), ...(data.onTime || [])].forEach(check);
        return ['all', ...Array.from(desgs.values()).sort()];
    }, [data.notYetIn, data.lateArrivals, data.onTime]);

    const filterList = (list) => {
        if (!list) return [];
        return list.filter(e => {
            const query = searchQuery.toLowerCase().trim();
            const nameMatch = e.name ? e.name.toLowerCase().includes(query) : false;
            const idMatch = e.id ? String(e.id).toLowerCase().includes(query) : false;
            const searchMatch = query === '' || nameMatch || idMatch;

            const shiftMatch = selectedShiftName === 'all' || e.shift_name === selectedShiftName;
            const outletMatch = matchText(e.office_location, selectedOutlet);
            const deptMatch = matchText(e.department_name || e.department, selectedDept);
            const designationMatch = matchText(e.designation || e.role, selectedDesignation);

            return searchMatch && shiftMatch && outletMatch && deptMatch && designationMatch;
        });
    };

    const filteredNotYetIn = filterList(notYetIn);
    const filteredLateArrivals = filterList(lateArrivals);
    const filteredOnTime = filterList(onTime);

    const filteredSummary = [
        { label: 'Not Yet In', count: filteredNotYetIn.length, percentage: (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount) > 0 ? Math.round((filteredNotYetIn.length / (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount)) * 100) + '%' : '0%', color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'Late Arrivals', count: filteredLateArrivals.length, percentage: (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount) > 0 ? Math.round((filteredLateArrivals.length / (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount)) * 100) + '%' : '0%', color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'On-Time', count: filteredOnTime.length, percentage: (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount) > 0 ? Math.round((filteredOnTime.length / (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount)) * 100) + '%' : '0%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Out of Office', count: onLeaveCount, percentage: (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount) > 0 ? Math.round((onLeaveCount / (filteredNotYetIn.length + filteredLateArrivals.length + filteredOnTime.length + onLeaveCount)) * 100) + '%' : '0%', color: 'text-slate-400', bg: 'bg-slate-50' }
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-10">
            {/* Header Controls */}
            <div className="flex flex-wrap items-end justify-between gap-4 px-2">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/10">
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="text-[11px] font-black text-slate-700 outline-none border-none cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Shifts</label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm min-w-[185px] justify-between focus-within:ring-2 focus-within:ring-indigo-500/10">
                            <select
                                value={selectedShiftId}
                                onChange={(e) => setSelectedShiftId(e.target.value)}
                                className="text-[11px] font-bold text-slate-700 outline-none border-none bg-transparent w-full cursor-pointer pr-4"
                            >
                                <option value="all">All Shifts</option>
                                {shifts.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Outlet</label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm min-w-[185px] justify-between focus-within:ring-2 focus-within:ring-indigo-500/10">
                            <select
                                value={selectedOutlet}
                                onChange={(e) => setSelectedOutlet(e.target.value)}
                                className="text-[11px] font-bold text-slate-700 outline-none border-none bg-transparent w-full cursor-pointer pr-4"
                            >
                                <option value="all">All Outlets</option>
                                {uniqueOutlets.filter(o => o !== 'all').map(o => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Dept</label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm min-w-[185px] justify-between focus-within:ring-2 focus-within:ring-indigo-500/10">
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="text-[11px] font-bold text-slate-700 outline-none border-none bg-transparent w-full cursor-pointer pr-4"
                            >
                                <option value="all">All Departments</option>
                                {uniqueDepts.filter(d => d !== 'all').map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Designation</label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm min-w-[185px] justify-between focus-within:ring-2 focus-within:ring-indigo-500/10">
                            <select
                                value={selectedDesignation}
                                onChange={(e) => setSelectedDesignation(e.target.value)}
                                className="text-[11px] font-bold text-slate-700 outline-none border-none bg-transparent w-full cursor-pointer pr-4"
                            >
                                <option value="all">All Designations</option>
                                {uniqueDesignations.filter(d => d !== 'all').map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/10">
                    <input 
                        type="text" 
                        placeholder="Search by name or ID" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none w-48" 
                    />
                    <Search size={14} className="text-slate-400" />
                    <div className="w-px h-4 bg-slate-100 mx-1" />
                    <Filter size={14} className="text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors" />
                </div>
            </div>

            {/* Main Stats Banner */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mx-2">
                <div className="px-6 py-2 bg-slate-50/50 border-b border-slate-50 text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employees Information for {formattedDisplayDate}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-50">
                    {filteredSummary.map((stat, i) => (
                        <div key={i} className="px-6 py-4 flex flex-col items-center justify-center text-center group hover:bg-slate-50/30 transition-all">
                            <span className={`text-sm font-black ${stat.color}`}>{stat.percentage}</span>
                            <span className="text-[10px] font-bold text-slate-500 mt-1">{stat.count} Employee(s) {stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                {/* Not Yet In */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Not Yet In ({filteredNotYetIn.length})</h3>
                        <Download size={14} onClick={handleDownloadNotYetIn} className="text-slate-300 cursor-pointer hover:text-slate-500" />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="bg-white sticky top-0">
                                <tr className="border-b border-slate-50">
                                    <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Expected</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredNotYetIn.map((e, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-[10px] font-black text-slate-800">{e.name}</p>
                                            <p className="text-[8px] font-bold text-slate-400">#{e.id} | {e.shift_name} | {e.office_location || 'Unassigned'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="text-[10px] font-bold text-slate-500">{e.time}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Late Arrivals */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Late Arrivals ({filteredLateArrivals.length})</h3>
                        <Download size={14} onClick={handleDownloadLateArrivals} className="text-slate-300 cursor-pointer hover:text-slate-500" />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="bg-white sticky top-0">
                                <tr className="border-b border-slate-50">
                                    <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Late By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLateArrivals.map((e, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-[10px] font-black text-slate-800">{e.name}</p>
                                            <p className="text-[8px] font-bold text-slate-400">#{e.id} | {e.shift_name} | {e.office_location || 'Unassigned'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-rose-500">{e.late}</p>
                                                    <p className="text-[8px] font-bold text-slate-400">{e.time}</p>
                                                </div>
                                                {((e.latitude && e.longitude) || (e.out_latitude && e.out_longitude)) && (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedMapEmployee(e);
                                                            setMapTab(e.latitude && e.longitude ? 'in' : 'out');
                                                        }}
                                                        className="p-1 hover:bg-slate-100 rounded-lg text-indigo-500 hover:text-indigo-700 transition-all active:scale-90"
                                                        title="View punch location"
                                                    >
                                                        <MapPin size={13} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* On Time */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">On Time ({filteredOnTime.length})</h3>
                        <Download size={14} onClick={handleDownloadOnTime} className="text-slate-300 cursor-pointer hover:text-slate-500" />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="bg-white sticky top-0">
                                <tr className="border-b border-slate-50">
                                    <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Early By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredOnTime.map((e, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-[10px] font-black text-slate-800">{e.name}</p>
                                            <p className="text-[8px] font-bold text-slate-400">#{e.id} | {e.shift_name} | {e.office_location || 'Unassigned'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-emerald-500">{e.early}</p>
                                                    <p className="text-[8px] font-bold text-slate-400">{e.time}</p>
                                                </div>
                                                {((e.latitude && e.longitude) || (e.out_latitude && e.out_longitude)) && (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedMapEmployee(e);
                                                            setMapTab(e.latitude && e.longitude ? 'in' : 'out');
                                                        }}
                                                        className="p-1 hover:bg-slate-100 rounded-lg text-indigo-500 hover:text-indigo-700 transition-all active:scale-90"
                                                        title="View punch location"
                                                    >
                                                        <MapPin size={13} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Out of Office */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Out of Office</h3>
                    </div>
                    <div className="p-2 grid grid-cols-4 gap-1 border-b border-slate-50 bg-slate-50/30">
                        {['On Leave', 'Holiday', 'Off Day', 'Rest Day'].map((tab, i) => (
                            <div key={i} className={`p-1.5 rounded-lg text-center flex flex-col border transition-all ${i === 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                <span className="text-[7px] font-black uppercase tracking-tighter">{tab}</span>
                                <span className="text-[9px] font-black">{i === 0 ? onLeaveCount : 0}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                            <Briefcase size={20} className="text-slate-400" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">No Employees are On Leave today</p>
                    </div>
                </div>
            </div>

            {/* Location Map Modal */}
            <AnimatePresence>
                {selectedMapEmployee && (
                    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setSelectedMapEmployee(null);
                                setMapTab('in');
                            }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />

                        {/* Modal Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-10 font-outfit"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-sm">
                                        {selectedMapEmployee.name?.split(' ').map(n => n[0]).slice(0,2).join('') || '??'}
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedMapEmployee.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400">ID: #{selectedMapEmployee.id} • {selectedMapEmployee.shift_name}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setSelectedMapEmployee(null);
                                        setMapTab('in');
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Dual Tabs for In/Out location */}
                            {selectedMapEmployee.latitude && selectedMapEmployee.longitude && selectedMapEmployee.out_latitude && selectedMapEmployee.out_longitude && (
                                <div className="px-6 pt-3 flex gap-2 bg-slate-50/20 border-b border-slate-50">
                                    {[
                                        { id: 'in', label: 'Check-In Location' },
                                        { id: 'out', label: 'Check-Out Location' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setMapTab(tab.id)}
                                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                                                mapTab === tab.id 
                                                    ? 'border-indigo-500 text-indigo-600 font-black' 
                                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Modal Content */}
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                                {/* Left Side: Map Details & Metadata */}
                                <div className="flex-1 space-y-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3 shadow-inner">
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Punch Information</h4>
                                        <div className="grid grid-cols-2 gap-3.5 text-left">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Punch Time</span>
                                                <span className="text-xs font-black text-slate-700">
                                                    {mapTab === 'in' ? selectedMapEmployee.time : (selectedMapEmployee.check_out || 'Not checked out')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Accuracy</span>
                                                <span className="text-xs font-black text-slate-700">
                                                    {mapTab === 'in' 
                                                        ? (selectedMapEmployee.accuracy ? `±${selectedMapEmployee.accuracy}m` : 'N/A')
                                                        : (selectedMapEmployee.out_accuracy ? `±${selectedMapEmployee.out_accuracy}m` : 'N/A')
                                                    }
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Coordinates</span>
                                                <span className="text-[10px] font-mono font-bold text-indigo-600">
                                                    {mapTab === 'in' 
                                                        ? `${selectedMapEmployee.latitude ? parseFloat(selectedMapEmployee.latitude).toFixed(6) : ''}, ${selectedMapEmployee.longitude ? parseFloat(selectedMapEmployee.longitude).toFixed(6) : ''}`
                                                        : `${selectedMapEmployee.out_latitude ? parseFloat(selectedMapEmployee.out_latitude).toFixed(6) : ''}, ${selectedMapEmployee.out_longitude ? parseFloat(selectedMapEmployee.out_longitude).toFixed(6) : ''}`
                                                    }
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Remarks</span>
                                                <span className="text-xs font-semibold text-slate-600 block bg-white border border-slate-100 p-2 rounded-xl mt-1 min-h-[40px] italic">
                                                    {(mapTab === 'in' ? selectedMapEmployee.remarks : selectedMapEmployee.out_remarks) || 'No remarks provided'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${
                                            mapTab === 'in' 
                                                ? `${selectedMapEmployee.latitude},${selectedMapEmployee.longitude}`
                                                : `${selectedMapEmployee.out_latitude},${selectedMapEmployee.out_longitude}`
                                        }`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
                                    >
                                        <MapPin size={13} />
                                        Open in Google Maps
                                    </a>
                                </div>

                                {/* Right Side: Map Canvas */}
                                <div className="w-full md:w-[320px] h-[280px] bg-slate-100 border border-slate-200/60 rounded-2xl overflow-hidden relative shadow-sm">
                                    {((mapTab === 'in' && selectedMapEmployee.latitude) || (mapTab === 'out' && selectedMapEmployee.out_latitude)) ? (
                                        <iframe
                                            title="Employee punch location map"
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            src={`https://maps.google.com/maps?q=${
                                                mapTab === 'in' 
                                                    ? `${selectedMapEmployee.latitude},${selectedMapEmployee.longitude}`
                                                    : `${selectedMapEmployee.out_latitude},${selectedMapEmployee.out_longitude}`
                                            }&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                            <AlertCircle size={24} className="mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-wider">No location coordinates captured</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WhoIsIn;
