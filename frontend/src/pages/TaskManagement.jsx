import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, Calendar, Users, Briefcase, 
  CheckSquare, Clock, MoreVertical, X, Paperclip, 
  Hash, Flag, ChevronRight, UserPlus, Trash2, CheckCircle2,
  AlertCircle, RefreshCw, LayoutGrid, List, Kanban,
  ArrowUpRight, Target, Zap, UserCheck, ShieldCheck, File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list, board
  const [activeMenuTaskId, setActiveMenuTaskId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuTaskId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setActiveMenuTaskId(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task: ' + (err.response?.data?.message || err.message));
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    assigned_by: null,
    assignee_ids: [],
    checklist: 'All',
    priority: 'Low',
    due_date: '',
    followers: [],
    description: '',
    attachments: [] // Local file objects
  });

  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false);
  const [showAssignedBySearch, setShowAssignedBySearch] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert('Failed to update task status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('assigned_by', formData.assigned_by || '');
      payload.append('assignee_ids', JSON.stringify(formData.assignee_ids));
      payload.append('priority', formData.priority);
      payload.append('due_date', formData.due_date);
      payload.append('description', formData.description);
      payload.append('checklist', formData.checklist);
      payload.append('followers', JSON.stringify(formData.followers));

      formData.attachments.forEach(file => {
        payload.append('attachments', file);
      });

      await api.post('/tasks', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowAddModal(false);
      resetForm();
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Error creating task. Please check your inputs.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      assigned_by: null,
      assignee_ids: [],
      checklist: 'All',
      priority: 'Low',
      due_date: '',
      followers: [],
      description: '',
      attachments: []
    });
  };

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-500/10 text-rose-600 border-rose-200/50';
      case 'Medium': return 'bg-amber-500/10 text-amber-600 border-amber-200/50';
      default: return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#FDFDFF] font-outfit overflow-hidden">
      {/* Ultra-Compact Top Bar */}
      <div className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                 <Target size={14} />
              </div>
              <h1 className="text-sm font-black text-slate-800 tracking-tight">Workforce Tasks</h1>
              <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-400">{tasks.length}</span>
           </div>

           <div className="h-4 w-[1px] bg-slate-200" />

           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={14} />
              </button>
              <button 
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={14} />
              </button>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Find anything..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 transition-all text-xs font-bold text-slate-600 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <button 
             onClick={() => setShowAddModal(true)}
             className="h-9 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center gap-2"
           >
             <Plus size={14} />
             New Task
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col p-6">
         {/* Minimal Metrics Row */}
         <div className="flex items-center gap-4 mb-6">
            <MetricPill label="All Tasks" value={tasks.length} active color="indigo" />
            <MetricPill label="High Priority" value={tasks.filter(t => t.priority === 'High').length} color="rose" />
            <MetricPill label="Today" value={tasks.filter(t => t.due_date?.split('T')[0] === new Date().toISOString().split('T')[0]).length} color="emerald" />
         </div>

         {/* Conditionally Render List or Board View */}
         {viewMode === 'board' ? (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
               {['Pending', 'In Progress', 'Completed'].map(colStatus => {
                  const colTasks = filteredTasks.filter(t => t.status === colStatus);
                  return (
                     <div key={colStatus} className="bg-slate-50/50 p-4 rounded-[24px] border border-slate-100 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                           <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${colStatus === 'Completed' ? 'bg-emerald-500' : colStatus === 'In Progress' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{colStatus}</h3>
                           </div>
                           <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black text-slate-400">{colTasks.length}</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                           {colTasks.length === 0 ? (
                              <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[20px] text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empty</div>
                           ) : colTasks.map(task => (
                              <div key={task.id} className="bg-white p-4 rounded-[20px] border border-slate-250/70 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all relative flex flex-col gap-3">
                                 <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black text-slate-350">#TK-{String(task.id).padStart(3, '0')}</span>
                                    <div className="relative">
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id); }}
                                          className="p-1 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all cursor-pointer inline-flex items-center justify-center bg-white shadow-sm"
                                          title="More Options"
                                       >
                                          <MoreVertical size={14} />
                                       </button>
                                       {activeMenuTaskId === task.id && (
                                          <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1">
                                             <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 rounded-lg hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                             >
                                                <Trash2 size={12} /> Delete Task
                                             </button>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                                 
                                 <div>
                                    <h4 className="text-xs font-black text-slate-800 tracking-tight leading-snug">{task.name}</h4>
                                    <p className="text-[10px] text-slate-500 mt-1 font-medium line-clamp-2">{task.description || 'No description'}</p>
                                 </div>
                                 
                                 <div className="flex items-center justify-between mt-1">
                                    <div className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${getPriorityStyle(task.priority)}`}>
                                       {task.priority}
                                    </div>
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                       {task.assignee_ids?.slice(0, 3).map(id => {
                                          const emp = employees.find(e => e.id === id);
                                          return (
                                             <div key={id} className="inline-block h-5 w-5 rounded-md ring-2 ring-white bg-slate-100 overflow-hidden border border-slate-200">
                                                {emp?.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-slate-400">{emp?.first_name?.charAt(0)}</div>}
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  );
               })}
            </div>
         ) : (
            /* Compact List View */
            <div className="flex-1 bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
               <div className="overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-slate-50">
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned By</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignees</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Priority</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {loading ? (
                         <tr><td colSpan="7" className="py-20 text-center"><RefreshCw size={20} className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                       ) : filteredTasks.length === 0 ? (
                         <tr><td colSpan="7" className="py-20 text-center text-slate-400 text-xs font-bold">No tasks matching search</td></tr>
                       ) : filteredTasks.map(task => (
                         <tr key={task.id} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-3.5">
                              <span className="text-[10px] font-black text-slate-300">#TK-{String(task.id).padStart(3, '0')}</span>
                           </td>
                           <td className="px-6 py-3.5">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-slate-700 tracking-tight leading-none mb-1">{task.name}</span>
                                 <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-slate-400">{task.checklist || 'General'}</span>
                                    {task.attachments?.length > 0 && (
                                      <div className="flex items-center gap-1 text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                         <Paperclip size={8} />
                                         {task.attachments.length} Files
                                      </div>
                                    )}
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter italic opacity-60">By</span>
                                 <span className="text-[11px] font-bold text-slate-600">{task.creator_first || 'Admin'}</span>
                              </div>
                           </td>
                           <td className="px-6 py-3.5">
                              <div className="flex -space-x-2 overflow-hidden">
                                 {task.assignee_ids?.slice(0, 3).map(id => {
                                    const emp = employees.find(e => e.id === id);
                                    return (
                                       <div key={id} className="inline-block h-6 w-6 rounded-lg ring-2 ring-white bg-slate-100 overflow-hidden border border-slate-200">
                                          {emp?.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400">{emp?.first_name?.charAt(0)}</div>}
                                       </div>
                                    );
                                 })}
                                 {task.assignee_ids?.length > 3 && (
                                    <div className="inline-block h-6 w-6 rounded-lg ring-2 ring-white bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[8px] font-black text-indigo-600">
                                       +{task.assignee_ids.length - 3}
                                    </div>
                                 )}
                                 {(!task.assignee_ids || task.assignee_ids.length === 0) && (
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">None</span>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 py-3.5 text-center">
                              <div className={`inline-flex px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${getPriorityStyle(task.priority)}`}>
                                 {task.priority}
                              </div>
                           </td>
                           <td className="px-6 py-3.5">
                              <div className="flex items-center gap-1.5">
                                 <div className={`w-1.5 h-1.5 rounded-full ${
                                    task.status === 'Completed' ? 'bg-emerald-500' : 
                                    task.status === 'In Progress' ? 'bg-indigo-500' : 'bg-amber-500'
                                 }`} />
                                 <select
                                    value={task.status}
                                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                    className="bg-transparent text-[9px] font-black text-slate-500 uppercase tracking-widest border-0 focus:ring-0 cursor-pointer p-0 select-none hover:text-indigo-600 transition-colors"
                                 >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                 </select>
                              </div>
                           </td>
                           <td className="px-6 py-3.5 text-right relative">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id); }}
                                 className="p-1.5 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all cursor-pointer inline-flex items-center justify-center bg-white shadow-sm"
                                 title="More Options"
                              >
                                 <MoreVertical size={14} />
                              </button>
                              {activeMenuTaskId === task.id && (
                                 <div className="absolute right-14 top-1/2 -translate-y-1/2 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 mr-1">
                                    <button
                                       onClick={() => handleDeleteTask(task.id)}
                                       className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 rounded-lg hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                       <Trash2 size={12} /> Delete Task
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
         )}
      </div>

      {/* Modern Compact Side Modal (Linear Style) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[9999] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.2)] border-l border-slate-100 flex flex-col h-full z-[10000]"
            >
               {/* Modal Header */}
               <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50 shrink-0">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <Plus size={14} />
                     </div>
                     <h2 className="text-sm font-black text-slate-800 tracking-tight">Create New Task</h2>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors p-2"><X size={18} /></button>
               </div>

               {/* Modal Body */}
               <div className="flex-1 overflow-y-auto p-8 space-y-7 scrollbar-hide">
                  {/* Name */}
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">What needs to be done?</label>
                     <input 
                       type="text" autoFocus
                       placeholder="Enter task title..."
                       className="w-full text-lg font-black text-slate-800 outline-none placeholder:text-slate-200 border-b border-transparent focus:border-indigo-600/10 pb-2 transition-all"
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     {/* Assigned By */}
                     <div className="space-y-2 relative">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned By</label>
                        <button 
                          type="button"
                          onClick={() => setShowAssignedBySearch(!showAssignedBySearch)}
                          className="flex items-center gap-2 w-full p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus:border-indigo-100"
                        >
                           <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden">
                              {formData.assigned_by && employees.find(e => e.id === formData.assigned_by) ? (
                                 <img src={employees.find(e => e.id === formData.assigned_by)?.photo || `https://ui-avatars.com/api/?name=${employees.find(e => e.id === formData.assigned_by)?.first_name}`} className="w-full h-full object-cover" />
                              ) : <ShieldCheck size={12} />}
                           </div>
                           <span className="text-[10px] font-black text-slate-600 truncate uppercase tracking-widest">
                              {formData.assigned_by && employees.find(e => e.id === formData.assigned_by) ? employees.find(e => e.id === formData.assigned_by)?.first_name : 'Select Boss'}
                           </span>
                        </button>
                        
                        {showAssignedBySearch && (
                          <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-[1000] mt-2 p-1.5 max-h-40 overflow-y-auto">
                             {employees.map(emp => (
                                <div 
                                  key={emp.id}
                                  onClick={() => { setFormData({...formData, assigned_by: emp.id}); setShowAssignedBySearch(false); }}
                                  className="p-2 rounded-lg hover:bg-indigo-50 cursor-pointer flex items-center gap-2 transition-colors"
                                >
                                   <div className="w-5 h-5 rounded-md bg-slate-100 overflow-hidden shrink-0">
                                      {emp.photo && <img src={emp.photo} className="w-full h-full object-cover" />}
                                   </div>
                                   <span className="text-[10px] font-bold text-slate-600">{emp.first_name} {emp.last_name}</span>
                                </div>
                             ))}
                          </div>
                        )}
                     </div>

                     {/* Priority */}
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priority Level</label>
                        <select 
                          className="w-full p-2.5 bg-slate-50 rounded-xl outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 border border-transparent focus:border-indigo-100 transition-all cursor-pointer"
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        >
                           <option value="Low">Low</option>
                           <option value="Medium">Medium</option>
                           <option value="High">High</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      {/* Checklist */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category / Checklist</label>
                        <select 
                          className="w-full p-2.5 bg-slate-50 rounded-xl outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 border border-transparent focus:border-indigo-100 transition-all cursor-pointer"
                          value={formData.checklist}
                          onChange={(e) => setFormData({...formData, checklist: e.target.value})}
                        >
                           <option value="All">All</option>
                           <option value="Onboarding">Onboarding</option>
                           <option value="Separation">Separation</option>
                           <option value="Compliance">Compliance</option>
                           <option value="General">General</option>
                        </select>
                     </div>

                     {/* Due Date */}
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deadline</label>
                        <div className="relative">
                           <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                           <input 
                              type="date"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-100 transition-all text-[11px] font-bold text-slate-600 cursor-pointer"
                              value={formData.due_date}
                              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                           />
                        </div>
                     </div>
                  </div>

                  {/* Assigned To (Multiple Selection) */}
                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned To</label>
                        <button 
                           type="button"
                           onClick={() => {
                              if (formData.assignee_ids.length === employees.length) {
                                 setFormData({...formData, assignee_ids: []});
                              } else {
                                 setFormData({...formData, assignee_ids: employees.map(e => e.id)});
                              }
                           }}
                           className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                           {formData.assignee_ids.length === employees.length ? 'Clear All' : 'Select All'}
                        </button>
                     </div>
                     <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                        {employees.map(emp => (
                           <div 
                              key={emp.id}
                              onClick={() => {
                                 if (formData.assignee_ids.includes(emp.id)) {
                                    setFormData({...formData, assignee_ids: formData.assignee_ids.filter(id => id !== emp.id)});
                                 } else {
                                    setFormData({...formData, assignee_ids: [...formData.assignee_ids, emp.id]});
                                 }
                              }}
                              className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                 formData.assignee_ids.includes(emp.id) ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 hover:border-indigo-200 bg-slate-50/50'
                              }`}
                           >
                              <div className="w-5 h-5 rounded-md bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                 {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <span className="text-[8px] text-slate-400">{emp.first_name?.charAt(0)}</span>}
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 truncate">{emp.first_name}</span>
                              {formData.assignee_ids.includes(emp.id) && <CheckCircle2 size={10} className="text-indigo-600 ml-auto" />}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detailed Instructions</label>
                     <textarea 
                       placeholder="Describe the task expectations..."
                       className="w-full h-24 p-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 transition-all text-[11px] font-bold text-slate-600 resize-none shadow-inner"
                       value={formData.description}
                       onChange={(e) => setFormData({...formData, description: e.target.value})}
                     />
                  </div>

                  {/* Attachment List */}
                  {formData.attachments.length > 0 && (
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attachments</label>
                        <div className="flex flex-wrap gap-2">
                           {formData.attachments.map((file, i) => (
                              <div key={i} className="px-3 py-1.5 bg-slate-50 rounded-lg flex items-center gap-2 border border-slate-100">
                                 <File size={10} className="text-slate-400" />
                                 <span className="text-[9px] font-bold text-slate-600 truncate max-w-[100px]">{file.name}</span>
                                 <X size={10} className="text-slate-300 hover:text-rose-500 cursor-pointer" onClick={() => setFormData({...formData, attachments: formData.attachments.filter((_, idx) => idx !== i)})} />
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* Modal Footer */}
               <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between shrink-0">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 cursor-pointer group transition-colors"
                  >
                     <Paperclip size={14} className="group-hover:rotate-12 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Attach Files</span>
                     <input 
                        type="file" multiple ref={fileInputRef} className="hidden"
                        onChange={(e) => {
                           const files = Array.from(e.target.files);
                           setFormData({...formData, attachments: [...formData.attachments, ...files]});
                        }}
                     />
                  </button>
                  <button 
                    onClick={handleCreateTask}
                    disabled={!formData.name}
                    className={`h-10 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${
                      !formData.name ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-0.5 active:scale-95'
                    }`}
                  >
                    Confirm & Publish
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MetricPill = ({ label, value, color }) => {
   const colors = {
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      amber: 'text-amber-600 bg-amber-50 border-amber-100',
      emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      rose: 'text-rose-600 bg-rose-50 border-rose-100',
   };
   
   return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${colors[color] || colors.indigo}`}>
         <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
         <span className="text-sm font-black">{value}</span>
      </div>
   );
};

export default TaskManagement;
