import React, { useState, useEffect } from 'react';
import { 
    Shield, Upload, CheckCircle, AlertCircle, 
    FileText, Download, Trash2, Eye, 
    Lock, Sparkles, Filter, ChevronRight,
    Search, Clock, MoreHorizontal, FileUp,
    Check
} from 'lucide-react';
import api, { getAssetUrl } from '../utils/api';

const StatusBadge = ({ status }) => {
    const config = {
        'pending': { color: 'bg-amber-50 text-amber-600', icon: Clock, label: 'Pending Review' },
        'verified': { color: 'bg-emerald-50 text-emerald-600', icon: Check, label: 'Verified' },
        'rejected': { color: 'bg-rose-50 text-rose-600', icon: AlertCircle, label: 'Action Required' },
        'missing': { color: 'bg-slate-50 text-slate-400', icon: Shield, label: 'Awaiting Upload' }
    };

    const s = status || 'missing';
    const { color, icon: Icon, label } = config[s];

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight ${color}`}>
            <Icon size={12} />
            {label}
        </div>
    );
};

const IdentityHub = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);

    const docTypes = ['Aadhar Card', 'PAN Card', 'Experience Letter', 'Highest Degree'];

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/compliance/my-docs');
            setDocs(res || []);
        } catch (err) {
            console.error('Failed to fetch identity vault', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (type, file) => {
        setUploading(type);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('document_type', type);

        try {
            await api.post('/compliance/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchDocs();
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(null);
        }
    };

    const handleDownload = (doc) => {
        const url = getAssetUrl(`/uploads/kyc/${doc.file_path}`);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.file_name);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (docId) => {
        if (!confirm('Are you sure you want to remove this document from the vault?')) return;
        try {
            await api.delete(`/compliance/${docId}`);
            setPreviewDoc(null);
            fetchDocs();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 font-outfit text-slate-900">
            {/* Minimal Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">
                        <Shield size={14} /> Verification Status
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Identity Documents</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage and verify your professional credentials securely.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure Upload</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {docTypes.map(type => {
                            const doc = docs.find(d => d.document_type === type);
                            const isMissing = !doc;

                            return (
                                <div key={type} className="group relative bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:border-indigo-200 hover:shadow-sm">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-xl ${isMissing ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <StatusBadge status={doc?.status} />
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-900">{type}</h3>
                                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                                        {isMissing ? 'Awaiting document upload' : `Verified on ${new Date(doc.created_at).toLocaleDateString()}`}
                                    </p>

                                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        {!isMissing ? (
                                            <button 
                                                onClick={() => setPreviewDoc(doc)}
                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
                                            >
                                                <Eye size={14} /> View Document
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Not Uploaded</span>
                                        )}
                                        
                                        <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Constraints & Action Area */}
                <aside className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-8 space-y-6">
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Upload New Document</h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Select a document type to upload.</p>
                        </div>

                        <div className="space-y-2">
                            {docTypes.map(type => (
                                <div key={type} className="relative group">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                        onChange={(e) => handleUpload(type, e.target.files[0])}
                                        disabled={uploading === type}
                                    />
                                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                        uploading === type 
                                        ? 'bg-indigo-50 border-indigo-100 text-indigo-400' 
                                        : 'bg-white border-slate-200 text-slate-600 group-hover:border-indigo-400 group-hover:text-indigo-600 group-hover:shadow-sm'
                                    }`}>
                                        <span className="text-[11px] font-bold">{uploading === type ? 'Uploading...' : type}</span>
                                        <FileUp size={14} className={uploading === type ? 'animate-bounce' : 'opacity-40 group-hover:opacity-100'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Rules</h4>
                        <div className="space-y-4">
                            {[
                                { title: 'Authenticity', desc: 'Only original high-res scans are accepted.' },
                                { title: 'File Format', desc: 'Secure PDF, PNG, or JPEG containers only.' },
                                { title: 'Limit', desc: 'File size must not exceed 5MB.' }
                            ].map((rule, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 mt-2 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-800 leading-none">{rule.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">{rule.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Premium Modal Experience */}
            {previewDoc && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                     <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setPreviewDoc(null)} />
                     <div className="relative bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{previewDoc.document_type}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <StatusBadge status={previewDoc.status} />
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• Document ID: {previewDoc.file_path.substring(0,8)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleDownload(previewDoc)}
                                    className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    <Download size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(previewDoc.id)} 
                                    className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 p-12 overflow-auto flex items-center justify-center">
                            {previewDoc.mime_type?.includes('image') ? (
                                <img 
                                    src={getAssetUrl(`/uploads/kyc/${previewDoc.file_path}`)} 
                                    alt="KYC Preview" 
                                    className="max-w-full max-h-full rounded-lg shadow-2xl" 
                                />
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-white rounded-[24px] shadow-sm flex items-center justify-center mx-auto">
                                        <FileText size={32} className="text-indigo-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-slate-900">Secure View</p>
                                        <p className="text-xs text-slate-500 font-medium">You are viewing the PDF document in a secure window.</p>
                                    </div>
                                    <a 
                                        href={getAssetUrl(`/uploads/kyc/${previewDoc.file_path}`)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                    >
                                        Open Document
                                    </a>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default IdentityHub;
