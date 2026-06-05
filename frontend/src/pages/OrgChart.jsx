import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Network, Users, ChevronRight, ChevronDown, Activity, 
  Search, Building2, Mail, Smartphone, ExternalLink, X, Building,
  MapPin, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

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
                    className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-white shadow-2xl z-[120] border-l border-slate-100 flex flex-col font-outfit"
                >
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Employee Details</p>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Profile Details</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        {/* Profile Header */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-white text-3xl font-black shadow-2xl ${node.is_company_node ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                                    {node.is_company_node ? <Building size={40} /> : (node.first_name?.[0] || '?') + (node.last_name?.[0] || '?')}
                                </div>
                                {!node.is_company_node && (
                                    <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full border-4 border-white text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${
                                        node.live_status === 'online' ? 'bg-emerald-500' : 
                                        node.live_status === 'on_leave' ? 'bg-amber-500' : 'bg-slate-400'
                                    }`}>
                                        {node.live_status || 'Offline'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">{node.first_name} {node.last_name}</h3>
                                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">{node.designation}</p>
                            </div>
                        </div>

                        {!node.is_company_node && (
                            <>
                                {/* Contact Group */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic border-b border-slate-50 pb-2">Communication Hub</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <a href={`mailto:${node.email}`} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group">
                                            <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors"><Mail size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Address</p>
                                                <p className="text-sm font-bold text-slate-700">{node.email || 'N/A'}</p>
                                            </div>
                                        </a>
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                            <div className="p-2 bg-white rounded-xl text-slate-400"><Smartphone size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Direct Line</p>
                                                <p className="text-sm font-bold text-slate-700">{node.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                 {/* Reports To Group */}
                                 {node.manager_id && (
                                     <div className="space-y-4">
                                         <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic border-b border-slate-50 pb-2">Direct Reporting</h4>
                                         <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-black text-[10px]">
                                                 {allNodes?.find(e => e.id === node.manager_id)?.first_name?.[0]}
                                                 {allNodes?.find(e => e.id === node.manager_id)?.last_name?.[0]}
                                             </div>
                                             <div>
                                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reports To</p>
                                                 <p className="text-sm font-black text-slate-800 italic">
                                                     {allNodes?.find(e => e.id === node.manager_id)?.first_name} {allNodes?.find(e => e.id === node.manager_id)?.last_name}
                                                 </p>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                {/* Work Group */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic border-b border-slate-50 pb-2">Organizational Context</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emp ID</p>
                                            <p className="text-sm font-black text-slate-800 italic">{node.employee_id_number || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                            <p className="text-sm font-black text-slate-800 italic">{node.office_location || 'Remote'}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex">
                        {localStorage.getItem('user_role') !== 'employee' && (
                            <Link 
                                to="/employees" 
                                className="w-full py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm text-center"
                            >
                                View Staff Hub
                            </Link>
                        )}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

const OrgChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role] = useState(localStorage.getItem('user_role'));
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChart();
  }, []);

  const fetchChart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/org/chart');
      setData(res || []);
      const allIds = (Array.isArray(res) ? res : []).map(e => e.id);
      setExpandedNodes(new Set(allIds));
    } catch (err) {
      console.error('Org Chart fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const expandAll = () => {
    const allIds = data.map(e => e.id);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    const roots = data.filter(e => !e.manager_id).map(e => e.id);
    setExpandedNodes(new Set(roots));
  };

  const toggleNode = (id) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
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
    // Scroll the node card into view if found
    setTimeout(() => {
      const el = document.getElementById(`node-card-${node.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // Build Tree
  const tree = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const map = {};
    const roots = [];
    data.forEach(emp => map[emp.id] = { ...emp, children: [] });
    data.forEach(emp => {
      if (emp.manager_id && map[emp.manager_id]) {
        map[emp.manager_id].children.push(map[emp.id]);
      } else {
        roots.push(map[emp.id]);
      }
    });
    return roots;
  }, [data]);

  const totalStaff = Array.isArray(data) 
    ? (role === 'super_admin' ? data.filter(e => !e.is_company_node).length : data.length) 
    : 0;

  // Level Tree Node Component for Visual Level Chart
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
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0 ${
                node.is_company_node ? 'bg-indigo-600' : (node.manager_id ? 'bg-slate-900' : 'bg-indigo-500')
              }`}>
                {node.is_company_node ? <Building2 size={18} /> : (node.first_name?.[0] || '?') + (node.last_name?.[0] || '')}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{node.first_name} {node.last_name}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none mt-0.5">{node.designation}</p>
              </div>

              {/* Status */}
              {!node.is_company_node && (
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  node.live_status === 'online' ? 'bg-emerald-500 animate-pulse' : 
                  node.live_status === 'on_leave' ? 'bg-amber-500' : 'bg-slate-355 bg-slate-300'
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

          {/* Expand/Collapse Handle */}
          {hasChildren && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
              className={`w-6 h-6 rounded-full border bg-white flex items-center justify-center shadow-md -mb-3 z-20 hover:bg-slate-50 transition-colors mt-2`}
            >
              {isExpanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-indigo-600 font-bold" />}
            </button>
          )}
        </div>

        {/* Tree Connective Lines and children rendering */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="flex flex-col items-center"
            >
              {/* Vertical connector down from parent card */}
              <div className="w-px h-8 bg-slate-200 mt-3" />

              {/* Children Wrapper */}
              <div className="flex gap-8 relative px-4">
                {/* Horizontal branch line connecting sibling columns */}
                {node.children.length > 1 && (
                  <div className="absolute top-0 left-[calc(128px)] right-[calc(128px)] h-px bg-slate-200" />
                )}

                {node.children.map((child, idx) => (
                  <div key={child.id} className="flex flex-col items-center relative">
                    {/* Vertical connector line down to child card */}
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
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 font-outfit relative bg-slate-50 min-h-screen">
      <NodeSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          node={selectedNode} 
          allNodes={data}
      />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-150 p-6 md:p-8 rounded-2xl shadow-sm relative">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] italic mb-2">
              <Network size={12} /> Hierarchy Tree Chart
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 uppercase italic">
            Live Level Chart
          </h1>
          <p className="text-xs text-slate-400 mt-1">Hierarchical organization flow-map. Scroll horizontally to view branches.</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 items-center">
            {/* Live Stats */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{totalStaff} Employees</span>
            </div>

            <button onClick={expandAll} className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Expand All</button>
            <button onClick={collapseAll} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Collapse All</button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="flex bg-white border border-slate-100 p-4 rounded-xl shadow-sm max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search employee to focus node..."
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-slate-700"
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

      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Building Level Chart...</p>
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
              <Users size={36} className="text-slate-300" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No reporting tree available</p>
            </div>
          )}
        </div>
      )}

      {/* Legend Footer */}
      {!loading && data.length > 0 && (
        <div className="flex items-center justify-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Punched In</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>On Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span>Offline</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrgChart;
