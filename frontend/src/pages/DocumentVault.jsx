import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Filter, Folder, FileText, 
  MoreVertical, Download, Eye, Trash2, 
  LayoutGrid, List, ChevronRight, User,
  Shield, Image as ImageIcon, Layers, Upload,
  Clock, Archive, ArrowRight, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const DocumentVault = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState(null); // batch_id of open folder
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawDocs, setRawDocs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [stats, setStats] = useState({
      totalFolders: 0,
      totalFiles: 0
  });

  const fetchVaultData = async () => {
     try {
       setLoading(true);
       const docs = await api.get('/documents/vault');
       setRawDocs(docs);
       processVaultData(docs);
     } catch (err) {
       console.error('Failed to fetch vault data:', err);
     } finally {
       setLoading(false);
     }
   };

  const processVaultData = (docs) => {
      const batchMap = {};
      const individualFiles = [];
      
      docs.forEach(doc => {
        const isBatched = doc.batch_id && String(doc.batch_id).trim() !== '' && String(doc.batch_id) !== 'null';

        if (isBatched) {
            if (!batchMap[doc.batch_id]) {
                batchMap[doc.batch_id] = {
                    id: doc.batch_id,
                    name: doc.batch_name || 'Untitled Folder',
                    date: doc.batch_date || (doc.created_at ? String(doc.created_at).split('T')[0] : 'N/A'),
                    description: doc.batch_description || 'Batch documents.',
                    fileCount: 0,
                    type: 'folder'
                };
            }
            batchMap[doc.batch_id].fileCount++;
        }
        
        // If NO folder is selected, show only non-batched files
        if (!selectedFolder) {
            if (!isBatched) {
                individualFiles.push(mapDocToFile(doc));
            }
        } else {
            if (doc.batch_id === selectedFolder) {
                individualFiles.push(mapDocToFile(doc));
            }
        }
      });

      setFolders(Object.values(batchMap));
      setFiles(individualFiles);
      setStats({
          totalFolders: Object.keys(batchMap).length,
          totalFiles: docs.length
      });
  };

  const mapDocToFile = (doc) => ({
    id: doc.id,
    name: doc.file_name,
    size: (doc.file_size / 1024 / 1024).toFixed(2) + ' MB',
    date: doc.created_at ? String(doc.created_at).split('T')[0] : 'N/A',
    type: doc.mime_type?.includes('pdf') ? 'pdf' : 'image',
    employee: doc.first_name ? `${doc.first_name} ${doc.last_name}` : 'General Doc',
    employeeId: doc.employee_id_number,
    empPk: doc.employee_id, // Primary Key for API calls
    category: doc.document_type || 'Other',
    path: doc.file_path
  });

  const deleteFile = async (id, empPk) => {
     if (!window.confirm('Are you sure you want to delete this document?')) return;
     try {
       await api.delete(`/documents/${id}?employeeId=${empPk}`);
       fetchVaultData();
     } catch (err) {
       console.error('Delete failed:', err);
       alert('Delete failed: ' + (err.response?.data?.message || err.message));
     }
  };

  const viewFile = (path) => {
     window.open(`${api.defaults.baseURL.replace('/api', '')}/uploads/kyc/${path}`, '_blank');
  };

  const downloadFile = async (path, name) => {
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
       console.error('Download failed:', err);
       // Fallback: Just open in new tab if blob download fails
       window.open(`${api.defaults.baseURL.replace('/api', '')}/uploads/kyc/${path}`, '_blank');
     }
  };

  const moveFiles = async (batchId, batchName) => {
     if (!batchId && !batchName) {
        alert('Please select a folder or enter a new folder name');
        return;
     }
     try {
       const res = await api.post('/documents/batch-move', {
         documentIds: selectedFiles,
         batchId,
         batchName: batchName || newFolderName
       });
       setSelectedFiles([]);
       setShowMoveMenu(false);
       setNewFolderName('');
       fetchVaultData();
       alert(`Successfully moved ${selectedFiles.length} files to "${res.batchName || batchName || newFolderName}"`);
     } catch (err) {
       console.error('Move failed:', err);
       alert('Move failed: ' + (err.response?.data?.message || err.message));
     }
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedFiles.length} documents permanently?`)) return;
    try {
      await Promise.all(selectedFiles.map(async (id) => {
         const file = rawDocs.find(d => d.id === id);
         return api.delete(`/documents/${id}?employeeId=${file.employee_id}`);
      }));
      setSelectedFiles([]);
      fetchVaultData();
      alert('Documents deleted successfully');
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const toggleFileSelection = (id) => {
    setSelectedFiles(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
     try {
       const res = await api.get('/document-categories');
       setCategories(res || []);
     } catch (err) {
       console.error('Failed to fetch categories:', err);
     }
  };

  useEffect(() => {
    fetchVaultData();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = rawDocs;
    if (searchQuery) {
        filtered = filtered.filter(d => 
            d.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (d.first_name && d.first_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(d => d.document_type === categoryFilter);
    }
    processVaultData(filtered);
  }, [searchQuery, categoryFilter, rawDocs, selectedFolder]);

  const openFolder = (id) => {
     setSelectedFolder(id);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeFolder = () => {
     setSelectedFolder(null);
  };

  const activeFolderName = folders.find(f => f.id === selectedFolder)?.name || 'Folder';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen font-outfit relative">
      {/* Floating Batch Actions */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl"
          >
             <div className="flex items-center gap-3 border-r border-white/10 pr-8">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                   {selectedFiles.length}
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Selected</p>
             </div>

             <div className="flex items-center gap-4">
                <div className="relative">
                   <button 
                     onClick={() => setShowMoveMenu(!showMoveMenu)}
                     className="px-6 py-2 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2"
                   >
                      <Folder size={14} />
                      Move to Folder
                   </button>

                   {showMoveMenu && (
                     <div className="absolute bottom-full mb-4 left-0 w-64 bg-white rounded-3xl shadow-2xl p-4 border border-slate-100 text-slate-900">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Choose Destination</p>
                        <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar mb-4">
                           {folders.map(folder => (
                             <button 
                               key={folder.id}
                               onClick={() => moveFiles(folder.id, folder.name)}
                               className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-700 transition-colors"
                             >
                                {folder.name}
                             </button>
                           ))}
                        </div>
                        <div className="pt-3 border-t border-slate-100">
                           <div className="relative mb-3">
                              <Folder size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                 type="text" 
                                 placeholder="New Folder Name..."
                                 value={newFolderName}
                                 onChange={(e) => setNewFolderName(e.target.value)}
                                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                              />
                           </div>
                           <button 
                             onClick={() => moveFiles(null, newFolderName)}
                             className="w-full h-12 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                           >
                              <Plus size={16} />
                              Create & Move
                           </button>
                        </div>
                     </div>
                   )}
                </div>

                <button 
                  onClick={deleteSelected}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Delete Selected"
                >
                   <Trash2 size={18} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Database size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Digital <span className="text-indigo-600">Vault</span></h1>
          </div>
          <p className="text-slate-500 font-medium">Access and manage all organization-wide documents and folders.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <LayoutGrid size={20} />
             </button>
             <button 
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <List size={20} />
             </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
         <StatCard icon={Folder} label="Total Folders" value={stats.totalFolders} color="text-indigo-600" bg="bg-indigo-50" />
         <StatCard icon={FileText} label="Total Files" value={stats.totalFiles} color="text-emerald-600" bg="bg-emerald-50" />
         <StatCard icon={Shield} label="Secured Docs" value="100%" color="text-amber-600" bg="bg-amber-50" />
         <StatCard icon={Clock} label="Status" value="Live" color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-2xl shadow-slate-200/50">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
             <h3 className="text-xl font-black text-slate-900">Library Explorer</h3>
             {/* Breadcrumbs */}
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <button 
                  onClick={closeFolder}
                  className={`transition-colors ${selectedFolder ? 'text-slate-400 hover:text-indigo-600' : 'text-indigo-600'}`}
                >
                   All Files
                </button>
                {selectedFolder && (
                   <>
                      <ChevronRight size={12} className="text-slate-300" />
                      <span className="text-indigo-600">{activeFolderName}</span>
                   </>
                )}
             </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search files or employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                />
             </div>
             <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar max-w-xs sm:max-w-md">
                <button 
                  onClick={() => setCategoryFilter('all')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${categoryFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  All
                </button>
                {categories.map(cat => {
                  const catId = cat.name.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => setCategoryFilter(catId)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${categoryFilter === catId ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
             </div>
          </div>
       </div>

       <div className="space-y-12">
          {/* Folders Section - Only show when no folder is selected */}
          {!selectedFolder && (
             <div>
                <div className="flex items-center gap-3 mb-6">
                   <Folder size={18} className="text-indigo-600" />
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Folders ({folders.length})</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {folders.map(folder => (
                     <motion.div 
                       key={folder.id}
                       onClick={() => openFolder(folder.id)}
                       whileHover={{ y: -5 }}
                       className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all group cursor-pointer"
                     >
                        <div className="flex items-center justify-between mb-6">
                           <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                              <Archive size={24} />
                           </div>
                           <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                              <MoreVertical size={18} />
                           </button>
                        </div>
                        
                        <h5 className="text-base font-black text-slate-900 mb-1">{folder.name}</h5>
                        <p className="text-[10px] text-slate-400 font-bold mb-4">{folder.fileCount} Files • {folder.date}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                           <div className="flex -space-x-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600 uppercase">A</div>
                              <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-emerald-600 uppercase">B</div>
                           </div>
                           <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                     </motion.div>
                   ))}
                   {folders.length === 0 && (
                      <div className="col-span-full py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl opacity-50">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No folders found in this view</p>
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* Files Section */}
          <div>
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <FileText size={18} className="text-indigo-600" />
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      {!selectedFolder ? `Unfoldered Documents (${files.length})` : `Folder Content (${files.length})`}
                   </h4>
                </div>
                {selectedFiles.length > 0 && (
                   <button 
                     onClick={() => setSelectedFiles([])}
                     className="text-[10px] font-black text-rose-500 uppercase tracking-widest"
                   >
                      Deselect All
                   </button>
                )}
             </div>
 
             {viewMode === 'list' ? (
                <div className="space-y-3">
                   {files.map(file => (
                     <div 
                        key={file.id}
                        className={`flex items-center justify-between p-4 border rounded-2xl transition-all group ${
                           selectedFiles.includes(file.id) 
                           ? 'bg-indigo-50/50 border-indigo-200' 
                           : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-100'
                        }`}
                     >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                           <button 
                              onClick={() => toggleFileSelection(file.id)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                 selectedFiles.includes(file.id) 
                                 ? 'bg-indigo-600 border-indigo-600 text-white' 
                                 : 'bg-white border-slate-200'
                              }`}
                           >
                              {selectedFiles.includes(file.id) && <div className="w-2 h-2 bg-white rounded-full shadow-inner" />}
                           </button>

                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${file.type === 'pdf' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                              {file.type === 'pdf' ? <FileText size={22} /> : <ImageIcon size={22} />}
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">{file.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{file.size}</span>
                                 <span className="text-slate-200">•</span>
                                 <div className="flex items-center gap-1 text-indigo-600">
                                    <User size={10} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      {file.employee} {file.employeeId ? `(#${file.employeeId})` : ''}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                    <Layers size={10} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                       {file.category}
                                    </span>
                                 </div>
                              </div>
                           </div>
                        </div>
    
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                           <button onClick={() => viewFile(file.path)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Eye size={18} /></button>
                           <button onClick={() => downloadFile(file.path, file.name)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Download size={18} /></button>
                           <button onClick={() => deleteFile(file.id, file.empPk)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                     </div>
                   ))}
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {files.map(file => (
                     <motion.div 
                        key={file.id}
                        whileHover={{ y: -5 }}
                        className={`border rounded-3xl p-5 transition-all group relative overflow-hidden ${
                           selectedFiles.includes(file.id) 
                           ? 'bg-indigo-50/50 border-indigo-200 ring-4 ring-indigo-500/10' 
                           : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/50'
                        }`}
                     >
                        {/* Selection Checkbox */}
                        <button 
                           onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}
                           className={`absolute top-4 left-4 z-10 w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all ${
                              selectedFiles.includes(file.id) 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                              : 'bg-white/80 backdrop-blur-md border-white/20'
                           }`}
                        >
                           {selectedFiles.includes(file.id) && <div className="w-3 h-3 bg-white rounded-full shadow-inner" />}
                        </button>

                        <div className={`w-full aspect-video rounded-2xl mb-4 flex items-center justify-center ${file.type === 'pdf' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                           {file.type === 'pdf' ? <FileText size={40} /> : <ImageIcon size={40} />}
                        </div>
                        <p className="text-sm font-black text-slate-900 truncate mb-1">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mb-4">{file.category} • {file.size}</p>
                        
                        <div className="flex items-center gap-2 mb-6">
                           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">{file.employee?.charAt(0)}</div>
                           <span className="text-[10px] font-black text-slate-600 truncate">{file.employee}</span>
                        </div>

                        <div className="flex items-center gap-2">
                           <button onClick={() => viewFile(file.path)} className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">View</button>
                           <button onClick={() => downloadFile(file.path, file.name)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-emerald-600 transition-all"><Download size={16} /></button>
                           <button onClick={() => deleteFile(file.id, file.empPk)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                        </div>
                     </motion.div>
                   ))}
                </div>
             )}
          </div>
       </div>
      </div>

      <div className="mt-12 p-8 bg-indigo-600 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
         
         <div className="relative z-10 text-center md:text-left">
            <h3 className="text-2xl font-black mb-2">Need to upload more documents?</h3>
            <p className="text-indigo-100 font-medium">Add batches of files and organize them into folders instantly.</p>
         </div>
         <button 
           onClick={() => window.location.href = '/admin/documents/bulk-upload'}
           className="relative z-10 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-2"
         >
            <Upload size={18} />
            Quick Bulk Upload
         </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
    <div className={`w-16 h-16 ${bg} ${color} rounded-[20px] flex items-center justify-center shrink-0 shadow-inner`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-xl font-black text-slate-800 tracking-tight">{value}</h4>
    </div>
  </div>
);

export default DocumentVault;
