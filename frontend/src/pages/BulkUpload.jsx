import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, File, X, CheckCircle, AlertTriangle, 
  Search, Users, Layers, Shield, Info,
  Trash2, Plus, ArrowRight, Database, Cloud,
  FileText, Image as ImageIcon, Archive,
  ChevronRight, RefreshCw, Folder
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BulkUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [isGrouped, setIsGrouped] = useState(false);
  const [folderConfig, setFolderConfig] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [employees, setEmployees] = useState([]);
  const [showEmpList, setShowEmpList] = useState(null); 
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  useEffect(() => {
    fetchEmployees();
    fetchHistory();
    fetchCategories();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/documents/history');
      setHistory(res || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
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

  const fetchCategories = async () => {
    try {
      const res = await api.get('/document-categories');
      setDynamicCategories(res || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const addCategory = async () => {
     if (!newCategoryName.trim()) return;
     try {
        const res = await api.post('/document-categories', { name: newCategoryName });
        console.log('>>> [VAULT]: Category Added:', res);
        setDynamicCategories([...dynamicCategories, res]);
        setNewCategoryName('');
        const newId = res.name.toLowerCase().replace(/\s+/g, '_');
        setSelectedCategory(newId);
        // Refresh categories to be sure
        fetchCategories();
     } catch (err) {
        console.error('Add category failed:', err);
        alert(`Error: ${err.response?.data?.message || err.message}`);
     }
  };

  const deleteCategory = async (id) => {
     if (!window.confirm('Delete this category permanently?')) return;
     try {
        await api.delete(`/document-categories/${id}`);
        fetchCategories();
     } catch (err) {
        console.error('Delete failed:', err);
        alert(err.response?.data?.message || 'Cannot delete system categories');
     }
  };

  const updateCategory = async (id, name) => {
     try {
        await api.patch(`/document-categories/${id}`, { name });
        setEditingCategory(null);
        fetchCategories();
     } catch (err) {
        console.error('Update failed:', err);
     }
  };

  const categories = [
    ...dynamicCategories.map(cat => ({
      id: cat.name.toLowerCase().replace(/\s+/g, '_'),
      dbId: cat.id,
      name: cat.name,
      isCustom: cat.company_id !== null,
      Icon: Layers,
      color: cat.company_id === null ? 'text-indigo-500 bg-indigo-50' : 'text-purple-500 bg-purple-50'
    })),
    { id: 'other', name: 'Add Category', Icon: Plus, color: 'text-slate-500 bg-slate-50', isAdd: true }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  };

  const addFiles = (newFiles) => {
    const updatedFiles = [...files];
    Array.from(newFiles).forEach(file => {
      if (!updatedFiles.find(f => f.file.name === file.name)) {
        updatedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          customName: file.name,
          status: 'pending', 
          progress: 0,
          category: selectedCategory,
          employeeNames: [], // Support multiple names
          employeeIds: [], // Support multiple IDs
          tempSearch: '',  // Search field state
          error: null
        });
      }
    });
    setFiles(updatedFiles);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const updateFileDetail = (id, key, value) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const startUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    
    let interval;
    try {
        const formData = new FormData();
        formData.append('isGrouped', isGrouped ? 'true' : 'false');
        formData.append('batchName', isGrouped ? folderConfig.name : '');
        formData.append('batchDate', folderConfig.date);
        formData.append('batchDescription', folderConfig.description);
        
        const categoriesMap = [];
        const employeeIdsMap = [];
        const customNamesMap = [];
        
        files.forEach((item) => {
            categoriesMap.push(item.category);
            employeeIdsMap.push(item.employeeIds || []);
            customNamesMap.push(item.customName || item.file.name);
        });
        
        formData.append('categories', JSON.stringify(categoriesMap));
        formData.append('employeeIds', JSON.stringify(employeeIdsMap));
        formData.append('customNames', JSON.stringify(customNamesMap));

        // CRITICAL: Files must be appended last for some Multer configurations
        files.forEach((item) => {
            formData.append('documents', item.file);
        });

        let prog = 0;
        interval = setInterval(() => {
            prog += 10;
            if (prog <= 90) {
                setFiles(prev => prev.map(f => ({ ...f, progress: prog, status: 'uploading' })));
            }
        }, 150);

        await api.post('/documents/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (interval) clearInterval(interval);
        
        setFiles(prev => prev.map(f => ({ ...f, progress: 100, status: 'success' })));
        setUploading(false);
        setShowSuccess(true);
        
        // Clear files after success
        setTimeout(() => {
            setFiles([]);
            // Clear success message after 5 seconds
            setTimeout(() => {
              setShowSuccess(false);
              navigate('/admin/documents/vault');
            }, 5000);
        }, 1000);

    } catch (err) {
        if (interval) clearInterval(interval);
        console.error('Bulk upload failed:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
        alert(`Upload Error: ${errorMsg}`); // Direct feedback
        setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: errorMsg })));
        setUploading(false);
    }
  };

  const getFileIcon = (type) => {
    if (!type) return <File size={20} />;
    if (type.includes('image')) return <ImageIcon size={20} />;
    if (type.includes('pdf')) return <FileText size={20} />;
    if (type.includes('zip') || type.includes('rar')) return <Archive size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen font-outfit relative">
      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black"
          >
            <CheckCircle size={24} />
            Documents Uploaded & Vault Updated Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Upload size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bulk <span className="text-indigo-600">Upload</span></h1>
          </div>
          <p className="text-slate-500 font-medium">Manage and categorize documents in bulk for your entire workforce.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
             <button 
                onClick={() => setActiveTab('queue')}
                className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all ${activeTab === 'queue' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Queue
             </button>
             <button 
                onClick={() => {
                  setActiveTab('history');
                  fetchHistory();
                }}
                className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                History
             </button>
          </div>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[32px] opacity-60">
                   <Folder size={48} className="text-slate-300 mb-4" />
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No batch history found</p>
                </div>
              ) : (
                history.map(batch => (
                  <div key={batch.batch_id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                           <Archive size={28} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{batch.file_count} Files</span>
                     </div>
                     <h4 className="text-lg font-black text-slate-800 mb-1">{batch.batch_name}</h4>
                     <p className="text-[10px] text-slate-400 font-bold mb-4">{batch.batch_date}</p>
                     <p className="text-xs text-slate-500 line-clamp-2 font-medium mb-6">{batch.batch_description || 'No description provided.'}</p>
                     <button 
                       onClick={() => navigate('/admin/documents/vault')}
                       className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                        View in Vault
                        <ArrowRight size={14} />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative h-[300px] rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 ${
              dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-400'
            }`}
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 text-indigo-600">
               <Cloud size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Drag & Drop Documents</h3>
            <p className="text-sm text-slate-500 font-medium text-center mb-8">Support for PDF, JPG, PNG and Word files.</p>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
            >
              <Plus size={18} />
              Browse Files
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Bulk Config</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg"><Plus size={16} /></div>
                    <div>
                       <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Group into Folder</p>
                       <p className="text-[9px] text-slate-500 font-bold">Create a named collection</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setIsGrouped(!isGrouped)}
                    className={`w-12 h-6 rounded-full relative transition-all ${isGrouped ? 'bg-indigo-600' : 'bg-slate-200'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isGrouped ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>

              {isGrouped && (
                <div className="space-y-4 pt-2">
                   <input 
                     type="text" placeholder="Folder Name" value={folderConfig.name}
                     onChange={(e) => setFolderConfig({...folderConfig, name: e.target.value})}
                     className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                   />
                   <input 
                     type="date" value={folderConfig.date}
                     onChange={(e) => setFolderConfig({...folderConfig, date: e.target.value})}
                     className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                   />
                   <textarea 
                     placeholder="Folder Description..." value={folderConfig.description}
                     onChange={(e) => setFolderConfig({...folderConfig, description: e.target.value})}
                     className="w-full h-20 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all resize-none"
                   />
                </div>
              )}

              <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apply Category to All</label>
                    {editingCategory && (
                      <button onClick={() => setEditingCategory(null)} className="text-[9px] font-black text-rose-500 uppercase">Cancel Edit</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     {categories.map(cat => (
                       <div key={cat.id} className={`relative group/cat ${cat.isAdd ? 'col-span-2' : ''}`}>
                          {cat.isAdd ? (
                             <div className="flex flex-col gap-2">
                                <input 
                                  type="text"
                                  placeholder="New Category..."
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-[10px] font-bold outline-none focus:border-indigo-200"
                                />
                                <button 
                                  onClick={addCategory}
                                  className="w-full h-12 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                   <Plus size={16} />
                                   Save Category
                                </button>
                             </div>
                          ) : (
                             <button 
                               onClick={() => {
                                 if (editingCategory === cat.dbId) return;
                                 setSelectedCategory(cat.id);
                                 setFiles(files.map(f => ({ ...f, category: cat.id })));
                               }}
                               className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all relative ${
                                 selectedCategory === cat.id 
                                 ? 'border-indigo-500 bg-indigo-50 text-indigo-600' 
                                 : 'border-slate-100 hover:border-slate-200 text-slate-600'
                               }`}
                             >
                               <cat.Icon size={16} className={selectedCategory === cat.id ? 'text-indigo-600' : 'text-slate-400'} />
                               {editingCategory === cat.dbId ? (
                                 <input 
                                   autoFocus
                                   defaultValue={cat.name}
                                   onBlur={(e) => updateCategory(cat.dbId, e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && updateCategory(cat.dbId, e.target.value)}
                                   className="w-full bg-transparent outline-none text-[10px] font-black uppercase"
                                 />
                               ) : (
                                 <span className="text-[10px] font-black uppercase tracking-tight truncate pr-8">{cat.name}</span>
                               )}

                               {cat.isCustom && !editingCategory && (
                                 <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-all">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setEditingCategory(cat.dbId); }}
                                      className="p-1 hover:text-indigo-600 transition-colors"
                                    >
                                       <RefreshCw size={10} />
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat.dbId); }}
                                      className="p-1 hover:text-rose-600 transition-colors"
                                    >
                                       <Trash2 size={10} />
                                    </button>
                                 </div>
                               )}
                             </button>
                          )}
                       </div>
                     ))}
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                   <Info size={18} className="text-amber-500 shrink-0" />
                   <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                      Files are automatically scanned for security before being stored in our encrypted vault.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-100/50 overflow-hidden flex flex-col min-h-[600px]">
             <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div>
                   <h3 className="text-lg font-black text-slate-900">File Queue</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">{files.length} files added total</p>
                </div>
                {files.length > 0 && (
                   <button onClick={() => setFiles([])} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                   </button>
                )}
             </div>

             <div className="flex-1 p-8 space-y-4 overflow-y-auto max-h-[550px]">
                {files.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                     <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <Database size={40} className="text-slate-400" />
                     </div>
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Queue Empty</p>
                  </div>
                ) : (
                  files.map((item) => (
                    <div key={item.id} className="p-5 rounded-[24px] border border-slate-100 flex items-center gap-5 bg-white group hover:border-indigo-200 transition-all shadow-sm hover:shadow-md">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {item.status === 'success' ? <CheckCircle size={24} className="text-emerald-500" /> : getFileIcon(item.file.type)}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex flex-col mb-1">
                             <input 
                                type="text" 
                                value={item.customName}
                                onChange={(e) => updateFileDetail(item.id, 'customName', e.target.value)}
                                className="text-sm font-black text-slate-800 bg-transparent border-b border-dashed border-slate-100 outline-none focus:border-indigo-400 w-full mb-0.5 transition-all"
                                placeholder="Enter File Name..."
                             />
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{(item.file.size / 1024 / 1024).toFixed(2)} MB • {item.file.name}</p>
                          </div>
                          
                          <div className="flex items-center gap-6 mt-2">
                             <div className="flex items-center gap-1.5 text-indigo-600">
                                <Layers size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                   {categories.find(c => c.id === item.category)?.name}
                                </span>
                             </div>

                             <div className="flex-1 relative">
                                <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] border-b border-slate-100 pb-1">
                                  {item.employeeNames?.map((name, idx) => (
                                    <div key={idx} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1">
                                      {name}
                                      <button 
                                        onClick={() => {
                                          const newNames = item.employeeNames.filter((_, i) => i !== idx);
                                          const newIds = item.employeeIds.filter((_, i) => i !== idx);
                                          updateFileDetail(item.id, 'employeeNames', newNames);
                                          updateFileDetail(item.id, 'employeeIds', newIds);
                                        }}
                                        className="hover:text-rose-500"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ))}
                                  <div className="flex-1 flex items-center gap-2">
                                    <Users size={12} className="text-slate-400" />
                                    <input 
                                       type="text" placeholder={item.employeeNames?.length === 0 ? "Assign to Employees..." : ""}
                                       className="flex-1 bg-transparent text-[10px] font-bold text-slate-600 outline-none"
                                       value={item.tempSearch || ''}
                                       onFocus={() => setShowEmpList(item.id)}
                                       onBlur={() => setTimeout(() => setShowEmpList(null), 200)}
                                       onChange={(e) => {
                                         updateFileDetail(item.id, 'tempSearch', e.target.value);
                                         setShowEmpList(item.id);
                                       }}
                                    />
                                  </div>
                                </div>
                                {showEmpList === item.id && Array.isArray(employees) && (
                                  <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl mt-1 z-50 max-h-48 overflow-y-auto">
                                    {employees
                                      .filter(emp => {
                                        const fullName = `${emp?.first_name || ''} ${emp?.last_name || ''}`.toLowerCase();
                                        const search = (item.tempSearch || '').toLowerCase();
                                        return fullName.includes(search) && !item.employeeIds?.includes(emp.id);
                                      })
                                        .map(emp => (
                                          <div 
                                            key={emp.id}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const newNames = [...(item.employeeNames || []), `${emp.first_name} ${emp.last_name}`];
                                              const newIds = [...(item.employeeIds || []), emp.id];
                                              
                                              setFiles(prev => prev.map(f => f.id === item.id ? { 
                                                ...f, 
                                                employeeNames: newNames,
                                                employeeIds: newIds,
                                                tempSearch: ''
                                              } : f));
                                            }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-[10px] font-bold text-slate-600 border-b border-slate-50 last:border-0 flex items-center justify-between group transition-colors"
                                          >
                                            <div className="flex flex-col">
                                              <span className="group-hover:text-indigo-600">{emp.first_name} {emp.last_name}</span>
                                              <span className="text-[8px] text-slate-400">#{(emp.employee_id_number || '').slice(-8)}</span>
                                            </div>
                                            <Plus size={12} className="text-slate-300 group-hover:text-indigo-600" />
                                          </div>
                                        ))
                                    }
                                  </div>
                                )}
                             </div>
                             
                             {item.status === 'uploading' && (
                               <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <button onClick={() => removeFile(item.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <X size={20} />
                       </button>
                    </div>
                  ))
                )}
             </div>

             <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={startUpload}
                  disabled={files.length === 0 || uploading}
                  className={`flex items-center gap-3 px-12 py-4 rounded-[20px] text-sm font-black transition-all shadow-xl ${
                    files.length === 0 || uploading 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-100'
                  }`}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Start Bulk Upload
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      </div>
    )}

      {/* Footer Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatCard icon={Database} label="Storage Capacity" value="12.4 / 50 GB" progress={25} color="text-indigo-600" bg="bg-indigo-50" />
         <StatCard icon={Cloud} label="Daily Bandwidth" value="452 MB" progress={15} color="text-emerald-600" bg="bg-emerald-50" />
         <StatCard icon={Shield} label="Security Score" value="99.9%" progress={99} color="text-purple-600" bg="bg-purple-50" />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, progress, color, bg }) => (
  <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
    <div className={`w-16 h-16 ${bg} ${color} rounded-[20px] flex items-center justify-center shrink-0 shadow-inner`}>
      <Icon size={28} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-center justify-between mb-3">
         <h4 className="text-xl font-black text-slate-800 tracking-tight">{value}</h4>
         <span className={`text-[11px] font-black ${color}`}>{progress}%</span>
      </div>
      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
         <div className={`h-full ${color.replace('text', 'bg')}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  </div>
);

export default BulkUpload;
