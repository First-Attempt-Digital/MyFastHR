import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    Users, Search, ChevronRight, ChevronDown, 
    Mail, Smartphone, MapPin, Building2, 
    X, Loader2, RefreshCw, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

// ─── Sidebar Detail Panel ─────────────────────────────────────────────────────
const NodeSidebar = ({ isOpen, onClose, node, allNodes }) => (
    <AnimatePresence>
        {isOpen && node && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[110]"
                    onClick={onClose}
                />
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-white shadow-2xl z-[120] border-l border-slate-100 flex flex-col font-outfit"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Employee Details</p>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Profile Card</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={18} className="text-slate-400" /></button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Avatar + Name */}
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="relative">
                                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center text-white text-2xl font-black shadow-xl ${node.is_company_node ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                                    {node.is_company_node ? <Building2 size={36} /> : (node.first_name?.[0] || '?') + (node.last_name?.[0] || '')}
                                </div>
                                {!node.is_company_node && (
                                    <div className={`absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full border-[3px] border-white text-[8px] font-black uppercase tracking-wider text-white shadow ${
                                        node.live_status === 'online' ? 'bg-emerald-500' : 
                                        node.live_status === 'on_leave' ? 'bg-amber-500' : 'bg-slate-400'
                                    }`}>
                                        {node.live_status === 'online' ? 'Active' : node.live_status === 'on_leave' ? 'Leave' : 'Offline'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">{node.first_name} {node.last_name}</h3>
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-1">{node.designation}</p>
                            </div>
                        </div>

                        {!node.is_company_node && (
                            <>
                                {/* Contact */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">Contact</h4>
                                    <a href={`mailto:${node.email}`} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group">
                                        <div className="p-1.5 bg-white rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors"><Mail size={14} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                            <p className="text-sm font-medium text-slate-700 truncate">{node.email || 'N/A'}</p>
                                        </div>
                                    </a>
                                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl">
                                        <div className="p-1.5 bg-white rounded-lg text-slate-400"><Smartphone size={14} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Phone</p>
                                            <p className="text-sm font-medium text-slate-700">{node.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reports To */}
                                {node.manager_id && (() => {
                                    const mgr = allNodes?.find(e => e.id === node.manager_id);
                                    return mgr ? (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">Reports To</h4>
                                            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-100 shrink-0">
                                                    {mgr.first_name?.[0]}{mgr.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{mgr.first_name} {mgr.last_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{mgr.designation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                                {/* Work Info */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">Work Info</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3.5 bg-slate-50 rounded-2xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Emp ID</p>
                                            <p className="text-sm font-bold text-slate-800">{node.employee_id_number || 'N/A'}</p>
                                        </div>
                                        <div className="p-3.5 bg-slate-50 rounded-2xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                            <p className="text-sm font-bold text-slate-800">{node.office_location || 'Remote'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Direct Reports */}
                                {(() => {
                                    const directReports = allNodes?.filter(e => e.manager_id === node.id) || [];
                                    if (directReports.length === 0) return null;
                                    return (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">Direct Reports ({directReports.length})</h4>
                                            <div className="space-y-2">
                                                {directReports.slice(0, 8).map(dr => (
                                                    <div key={dr.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 font-bold text-[10px] border border-slate-100 shrink-0">
                                                            {dr.first_name?.[0]}{dr.last_name?.[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-700 truncate">{dr.first_name} {dr.last_name}</p>
                                                            <p className="text-[9px] text-slate-400 font-medium truncate">{dr.designation}</p>
                                                        </div>
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            dr.live_status === 'online' ? 'bg-emerald-500' : 
                                                            dr.live_status === 'on_leave' ? 'bg-amber-500' : 'bg-slate-300'
                                                        }`} />
                                                    </div>
                                                ))}
                                                {directReports.length > 8 && (
                                                    <p className="text-[10px] text-slate-400 font-bold text-center pt-1">+{directReports.length - 8} more</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex">
                        {localStorage.getItem('user_role') !== 'employee' && (
                            <Link 
                                to="/employees" 
                                className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all text-center"
                            >
                                Employee Hub
                            </Link>
                        )}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeOrgChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [selectedNode, setSelectedNode] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchChart = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const res = await api.get('/org/chart');
            const employees = Array.isArray(res) ? res : [];
            setData(employees);
            
            if (!silent) {
                // Auto-expand all nodes on first load
                const allIds = employees.map(e => e.id);
                setExpandedNodes(new Set(allIds));
            }
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Org chart fetch failed:', err);
            if (!silent) setError('Failed to load organization chart. Please try again.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChart();
    }, [fetchChart]);

    // Auto-refresh every 60 seconds for live status updates
    useEffect(() => {
        const interval = setInterval(() => fetchChart(true), 60000);
        return () => clearInterval(interval);
    }, [fetchChart]);

    // Build tree
    const tree = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return [];
        const map = {};
        const roots = [];
        data.forEach(emp => { map[emp.id] = { ...emp, children: [] }; });
        data.forEach(emp => {
            if (emp.manager_id && map[emp.manager_id]) {
                map[emp.manager_id].children.push(map[emp.id]);
                map[emp.id]._parentId = emp.manager_id;
            } else {
                roots.push(map[emp.id]);
            }
        });
        return roots;
    }, [data]);

    const toggleNode = (id) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedNodes(new Set(data.map(e => e.id)));
    };

    const collapseAll = () => {
        const roots = data.filter(e => !e.manager_id).map(e => e.id);
        setExpandedNodes(new Set(roots));
    };

    const focusNode = (node) => {
        const next = new Set(expandedNodes);
        let current = node;
        while (current && current.manager_id) {
            next.add(current.manager_id);
            current = data.find(e => e.id === current.manager_id);
        }
        setExpandedNodes(next);
        setSelectedNode(node);
        setIsSidebarOpen(true);
        setTimeout(() => {
            const el = document.getElementById(`node-card-${node.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
    };

    const totalStaff = data.filter(e => !e.is_company_node).length;
    const onlineCount = data.filter(e => e.live_status === 'online').length;

    // Visual level tree node
    const LevelTreeNode = ({ node }) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div className="flex flex-col items-center shrink-0">
                {/* Node Card */}
                <div id={`node-card-${node.id}`} className="relative flex flex-col items-center z-10">
                    <motion.div 
                        onClick={() => { setSelectedNode(node); setIsSidebarOpen(true); }}
                        className={`
                            w-64 bg-white rounded-2xl p-4 border border-slate-200 shadow-md hover:shadow-xl hover:border-indigo-250 transition-all cursor-pointer relative
                            ${node.is_company_node ? 'border-l-4 border-l-indigo-600' : (node.manager_id ? 'border-l-4 border-l-slate-800' : 'border-l-4 border-l-indigo-500')}
                            ${selectedNode?.id === node.id ? 'ring-2 ring-indigo-500/30 bg-indigo-50/20' : ''}
                        `}
                        whileHover={{ y: -3 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0 ${
                                node.is_company_node ? 'bg-indigo-600' : (node.manager_id ? 'bg-slate-900' : 'bg-indigo-500')
                            }`}>
                                {node.is_company_node ? <Building2 size={18} /> : (node.first_name?.[0] || '?') + (node.last_name?.[0] || '')}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{node.first_name} {node.last_name}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none mt-0.5">{node.designation}</p>
                            </div>

                            {!node.is_company_node && (
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                    node.live_status === 'online' ? 'bg-emerald-500 animate-pulse' : 
                                    node.live_status === 'on_leave' ? 'bg-amber-500' : 'bg-slate-300'
                                }`} />
                            )}
                        </div>

                        {node.subordinate_count > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Users size={9} className="text-indigo-500" /> Directs: {node.children.length}</span>
                                <span>Total: {node.subordinate_count}</span>
                            </div>
                        )}
                    </motion.div>

                    {hasChildren && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                            className="w-6 h-6 rounded-full border bg-white flex items-center justify-center shadow-md -mb-3 z-20 hover:bg-slate-50 transition-colors mt-2"
                        >
                            {isExpanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-indigo-650 font-bold" />}
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-px h-8 bg-slate-200 mt-3" />
                            <div className="flex gap-8 relative px-4">
                                {node.children.length > 1 && (
                                    <div className="absolute top-0 left-[calc(128px)] right-[calc(128px)] h-px bg-slate-200" />
                                )}
                                {node.children.map((child) => (
                                    <div key={child.id} className="flex flex-col items-center relative">
                                        <div className="w-px h-6 bg-slate-200" />
                                        <LevelTreeNode node={child} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-outfit relative">
            {/* Detail Sidebar */}
            <NodeSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                node={selectedNode} 
                allNodes={data}
            />

            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Level Chart</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Interactive reporting level hierarchy and connectivity flow.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{totalStaff} Staff</span>
                        <span className="text-slate-350">•</span>
                        <span className="text-emerald-600">{onlineCount} Active</span>
                    </div>

                    <button onClick={expandAll} className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">
                        Expand All
                    </button>
                    <button onClick={collapseAll} className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-650 hover:border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">
                        Collapse All
                    </button>
                    <button onClick={() => fetchChart()} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Search Controls */}
            <div className="flex bg-white border border-slate-100 p-4 rounded-xl shadow-sm mb-6 max-w-md">
                <div className="relative w-full group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-650 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search employee to focus node..." 
                        className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all w-full"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            const found = data.find(emp => 
                                `${emp.first_name} ${emp.last_name || ''}`.toLowerCase().includes(e.target.value.toLowerCase())
                            );
                            if (found && e.target.value.trim() !== '') {
                                focusNode(found);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Visual Level Chart Box */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Building Level Chart...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <p className="text-xs font-bold text-rose-500">{error}</p>
                    <button onClick={() => fetchChart()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Retry</button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-150 p-6 md:p-12 shadow-sm overflow-x-auto custom-scrollbar min-h-[600px]">
                    {tree.length > 0 ? (
                        <div className="flex items-start justify-center min-w-max p-8">
                            <div className="flex flex-col items-center">
                                {tree.map(root => (
                                    <LevelTreeNode key={root.id} node={root} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                            <Users size={36} className="text-slate-350" />
                            <p className="text-xs font-black text-slate-450 uppercase tracking-widest">No reporting tree available</p>
                        </div>
                    )}
                </div>
            )}

            {/* Legend Bar */}
            {!loading && data.length > 0 && (
                <div className="mt-6 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">On Leave</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Offline</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeOrgChart;
