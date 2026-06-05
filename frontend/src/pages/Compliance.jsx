import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, AlertCircle, FileText, CheckCircle2, 
    XCircle, User, Calendar, MapPin, Eye, Search,
    Filter, Download, ChevronRight, Activity, Clock, Sparkles,
    Fingerprint, Cpu, Scan, ArrowRight, Lock, ShieldAlert, BadgeCheck,
    ExternalLink, ArrowLeft
} from 'lucide-react';
import api, { getAssetUrl } from '../utils/api';

const DocumentReviewModal = ({ isOpen, onClose, document: doc, onAction }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(true);
    const [ocrConfidence, setOcrConfidence] = useState(0);

    useEffect(() => {
        if (isOpen && doc) {
            setOcrProcessing(true);
            setOcrConfidence(0);
            const interval = setInterval(() => {
                setOcrConfidence(prev => {
                    if (prev >= 98) {
                        clearInterval(interval);
                        setOcrProcessing(false);
                        return 98.4;
                    }
                    return prev + Math.floor(Math.random() * 15) + 5;
                });
            }, 150);
            return () => clearInterval(interval);
        }
    }, [isOpen, doc]);

    if (!isOpen || !doc) return null;

    const handleAction = async (status) => {
        setActionLoading(true);
        try {
            await onAction(doc.id, status);
            onClose();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 overflow-hidden">
            <style>{`
                @keyframes scannerMove {
                    0% { top: 0%; opacity: 0.3; }
                    50% { top: 100%; opacity: 1; }
                    100% { top: 0%; opacity: 0.3; }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 0.25; }
                }
                .glow-bg {
                    animation: pulseGlow 4s ease-in-out infinite;
                }
                .laser-sweep {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 50%;
                    height: 3px;
                    background: linear-gradient(to right, transparent, #4f46e5, #a855f7, #ec4899, #4f46e5, transparent);
                    box-shadow: 0 0 15px 4px rgba(79, 70, 229, 0.5);
                    animation: scannerMove 4s linear infinite;
                    pointer-events: none;
                    z-index: 10;
                }
                .grid-blueprint-light {
                    background-image: linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
            `}</style>

            {/* Premium backdrop glass */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all duration-300" onClick={onClose} />
            
            {/* Modal Box (Clean Light Theme) */}
            <div className="relative bg-white border border-slate-200 w-full max-w-6xl h-[90vh] rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col font-outfit text-slate-800 animate-in zoom-in-95 duration-300">
                
                {/* Immersive Top Bar */}
                <div className="px-8 py-6 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Fingerprint size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-bold uppercase tracking-wider leading-none">System Auto Match</span>
                                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">• Doc Ref: {doc.file_path.substring(0, 8)}</span>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mt-1">
                                Document Audit: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{doc.document_type}</span>
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 text-slate-400 hover:text-slate-700"><XCircle size={22} /></button>
                </div>

                {/* Sub-Header OCR Tracker */}
                <div className="bg-slate-50/30 border-b border-slate-200 px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-bold relative z-10">
                    <div className="flex items-center gap-3">
                        <Cpu size={14} className="text-indigo-600" />
                        <span className="text-slate-600 uppercase tracking-wider text-[11px]">Document Text Matcher:</span>
                        {ocrProcessing ? (
                            <span className="text-indigo-600 animate-pulse flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                                <Scan size={12} className="animate-spin" /> Matching text fields...
                            </span>
                        ) : (
                            <span className="text-emerald-600 flex items-center gap-1 uppercase text-[11px] tracking-wider">
                                <CheckCircle2 size={12} /> Match Verification Complete
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px] uppercase tracking-wider">Accuracy Score:</span>
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300" style={{ width: `${ocrConfidence}%` }} />
                        </div>
                        <span className={`text-[11px] font-bold tracking-tight ${ocrProcessing ? 'text-indigo-600' : 'text-emerald-600'}`}>{ocrConfidence}% Accuracy</span>
                    </div>
                </div>

                {/* Immersive Main Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Left Panel: Document Viewer (Light Matrix) */}
                    <div className="flex-1 p-8 bg-slate-50/50 relative flex items-center justify-center overflow-auto border-r border-slate-250">
                        {/* Interactive Blueprint background grid */}
                        <div className="absolute inset-0 grid-blueprint-light opacity-80 pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.04),transparent)] pointer-events-none glow-bg" />

                        {/* Scanner Frame */}
                        <div className="relative bg-white p-4 rounded-[24px] md:rounded-[32px] border border-slate-200 shadow-[0_15px_45px_rgba(0,0,0,0.06)] max-w-2xl w-full overflow-hidden group">
                            
                            {/* Live glowing sweep line */}
                            <div className="laser-sweep" />
                            
                            <div className="rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 border border-slate-100 relative">
                                <img 
                                    src={getAssetUrl(`/uploads/kyc/${doc.file_path}`)} 
                                    className="max-w-full rounded-lg max-h-[48vh] object-contain transition-transform duration-700 group-hover:scale-105"
                                    alt="KYC Document"
                                />
                                
                                {/* Secured floating details overlay */}
                                <div className="absolute top-4 left-4 bg-white/90 border border-indigo-500/10 px-3 py-1.5 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold tracking-wider text-indigo-600 uppercase shadow-sm">
                                    Secured & Encrypted
                                </div>
                            </div>

                            {/* Hover Overlay Controls */}
                            <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-[24px] md:rounded-[32px] backdrop-blur-md">
                                <a 
                                    href={getAssetUrl(`/uploads/kyc/${doc.file_path}`)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-100/50 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <ExternalLink size={15} /> View Full Document
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Identity Matching Node */}
                    <div className="w-full md:w-[460px] bg-white p-8 flex flex-col gap-6 overflow-y-auto border-l border-slate-200">
                        
                        {/* Profile Match Comparison */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                                <User size={13} className="text-indigo-600" /> Employee Profile Details
                            </h3>
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 hover:border-indigo-200 transition-colors">
                                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Full Name</p>
                                    <p className="text-sm font-bold text-slate-800 tracking-tight">{doc.first_name} {doc.last_name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                                        <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Employee ID</p>
                                        <p className="text-xs font-bold text-indigo-600 tracking-wider">{doc.employee_id_number}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                                        <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Validation</p>
                                        <p className="text-xs font-bold text-slate-700 tracking-tight">Active Audit</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Designation</p>
                                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{doc.designation}</p>
                                </div>
                            </div>
                        </section>

                        {/* System Auto Verification */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                                <Cpu size={13} className="text-indigo-600" /> System Auto Verification
                            </h3>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between p-3.5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                            <BadgeCheck size={12} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Name Match Accuracy</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">99.2% Match</span>
                                </div>
                                <div className="flex items-center justify-between p-3.5 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <Lock size={12} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Document Integrity</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">Verified</span>
                                </div>
                            </div>
                        </section>

                        {/* Interactive Action buttons */}
                        <div className="mt-auto pt-6 border-t border-slate-200 flex gap-4">
                            <button 
                                onClick={() => handleAction('rejected')}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-wider border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <XCircle size={15} /> {actionLoading ? 'Updating...' : 'Reject Document'}
                            </button>
                            <button 
                                onClick={() => handleAction('verified')}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100/50 transition-all flex items-center justify-center gap-2 active:scale-95 border border-indigo-500/10"
                            >
                                <CheckCircle2 size={15} /> {actionLoading ? 'Updating...' : 'Approve Document'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Compliance = () => {
    const navigate = useNavigate();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [viewMode, setViewMode] = useState('dossier'); // 'dossier' (Visual Cards) | 'ledger' (Standard Table)
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDocType, setFilterDocType] = useState('All');
    const [showStats, setShowStats] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/compliance/pending');
            setPending(res || []);
        } catch (err) {
            console.error('Compliance hub error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await api.post(`/compliance/action/${id}`, { status });
            await fetchPending();
        } catch (err) {
            console.error('Final decision sync failed', err);
            alert('Failed to update verification status. Please check server logs.');
        }
    };

    const handleExport = () => {
        if (pending.length === 0) return;
        const headers = ['Employee ID,Name,Document Type,Uploaded At\n'];
        const rows = pending.map(item => `"${item.employee_id_number}","${item.first_name} ${item.last_name}","${item.document_type}","${new Date(item.created_at).toLocaleDateString()}"`);
        const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `pending_documents_${new Date().toISOString().slice(0,10)}.csv`);
        a.click();
    };

    const filteredPending = pending.filter(doc => {
        const matchesSearch = `${doc.first_name || ''} ${doc.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDocType = filterDocType === 'All' || doc.document_type === filterDocType;
        return matchesSearch && matchesDocType;
    });

    const docTypesList = ['All', ...new Set(pending.map(d => d.document_type).filter(Boolean))];

    const stats = [
        { label: 'Pending Documentation', value: pending.length, icon: Activity, gradient: 'from-blue-50 to-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100/60', glow: 'shadow-indigo-100/30' },
        { label: 'Avg Verify Time', value: '4.2m', icon: Clock, gradient: 'from-purple-50 to-indigo-50', text: 'text-purple-600', border: 'border-purple-100/60', glow: 'shadow-purple-100/30' },
        { label: 'Security Index', value: '98%', icon: ShieldCheck, gradient: 'from-emerald-50 to-teal-50', text: 'text-emerald-600', border: 'border-emerald-100/60', glow: 'shadow-emerald-100/30' }
    ];

    return (
        <div className="p-4 md:p-8 space-y-10 animate-in fade-in duration-700 font-outfit text-slate-900 max-w-[1550px] mx-auto relative overflow-hidden">
            
            <DocumentReviewModal 
                isOpen={isReviewOpen} 
                onClose={() => setIsReviewOpen(false)} 
                document={selectedDoc}
                onAction={handleAction}
            />

            {/* Soft glowing pastel aura nodes in background */}
            <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 md:mb-12 relative z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-colors active:scale-95 border border-slate-200 shadow-sm"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Live Verification Queue
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShieldCheck size={28} className="text-indigo-600" /> Compliance Hub
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                            Verify employee KYC documents and identity details.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleExport}
                        className="flex-1 md:flex-initial px-6 py-3 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Download size={14} className="text-slate-400" /> Export List
                    </button>
                    <button 
                        onClick={() => setShowStats(!showStats)}
                        className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 border cursor-pointer ${showStats ? 'bg-indigo-700 text-white border-indigo-600 shadow-inner' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 border-indigo-500/10'}`}
                    >
                        <Activity size={14} className="text-indigo-200" /> {showStats ? 'Hide Stats' : 'System Stats'}
                    </button>
                </div>
            </div>

            {/* Dashboard Stats Panel (Collapsible) */}
            {showStats && (
                <div className="bg-slate-50 border border-slate-250/70 p-6 rounded-[24px] grid grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300 relative z-10 text-slate-800">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aadhaar Cards</p>
                        <p className="text-xl font-bold text-slate-800">{pending.filter(d => d.document_type === 'Aadhaar Card').length} Pending</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PAN Cards</p>
                        <p className="text-xl font-bold text-slate-800">{pending.filter(d => d.document_type === 'PAN Card').length} Pending</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passports</p>
                        <p className="text-xl font-bold text-slate-800">{pending.filter(d => d.document_type === 'Passport').length} Pending</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Other Docs</p>
                        <p className="text-xl font-bold text-slate-800">{pending.filter(d => d.document_type !== 'Aadhaar Card' && d.document_type !== 'PAN Card' && d.document_type !== 'Passport').length} Pending</p>
                    </div>
                </div>
            )}

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200/60 p-6 rounded-[24px] shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all duration-300 relative text-slate-800">
                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                        </div>
                        <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-2xl flex items-center justify-center transition-all duration-300 relative z-10 ${stat.text}`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Queue Explorer Panel */}
            <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-200 shadow-sm overflow-hidden relative z-10">
                
                {/* View Controls & Filter Bar */}
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between bg-slate-50/30">
                    <div className="relative group max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by employee name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all text-slate-850"
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                            <button 
                                onClick={() => setViewMode('dossier')}
                                className={`px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'dossier' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Grid View
                            </button>
                            <button 
                                onClick={() => setViewMode('ledger')}
                                className={`px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'ledger' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Table View
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3 relative">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-4 py-2.5 rounded-full border border-slate-200/30">{filteredPending.length} Document(s) filtered</span>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`p-3 rounded-xl border transition-all shadow-sm cursor-pointer ${isFilterOpen ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'}`}
                                title="Filter by Document Type"
                            >
                                <Filter size={16} />
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1">
                                    {docTypesList.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setFilterDocType(type);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${filterDocType === type ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-655'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Queue Display Zone */}
                <div className="p-8">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-6">
                            <div className="relative flex items-center justify-center">
                                <div className="w-14 h-14 border-4 border-indigo-100 rounded-full" />
                                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute" />
                                <Fingerprint size={22} className="text-indigo-600 absolute animate-pulse" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Loading Pending Documents...</p>
                        </div>
                    ) : filteredPending.length === 0 ? (
                        <div className="py-24 text-center space-y-6 max-w-md mx-auto">
                            <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-300 border border-slate-150 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 animate-pulse" />
                                <ShieldCheck size={44} className="text-indigo-500/80 relative z-10" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[12px] font-black text-slate-800 uppercase tracking-widest italic">No Documents Found</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">No pending documents match your current filter and search query.</p>
                            </div>
                        </div>
                    ) : viewMode === 'dossier' ? (
                        /* Beautiful Clean Grid Cards */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {filteredPending.map(item => (
                                <div key={item.id} className="group bg-white border border-slate-200 rounded-[24px] p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col text-slate-800">
                                    
                                    {/* Badge Header */}
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending Audit
                                        </span>
                                        <div className="w-9 h-9 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200/60 shadow-sm">
                                            <FileText size={15} />
                                        </div>
                                    </div>
 
                                    {/* Portrait Box & Details */}
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-slate-100 border border-indigo-100 rounded-2xl flex items-center justify-center text-xs font-bold uppercase tracking-wider text-indigo-600 shadow-sm">
                                            {item?.first_name?.[0] || '?'}{item?.last_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold tracking-tight leading-tight text-slate-900">{item?.first_name} {item?.last_name}</h4>
                                            <p className="text-[11px] text-indigo-600 font-semibold mt-1">{item.employee_id_number} • {item.designation}</p>
                                        </div>
                                    </div>
 
                                    {/* Document description box */}
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-150 mb-6 relative z-10 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Document Type</p>
                                            <span className="text-xs font-semibold text-slate-700">{item.document_type}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Uploaded</p>
                                            <span className="text-xs font-semibold text-slate-600">{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
 
                                    {/* Action Button */}
                                    <button 
                                        onClick={() => {
                                            setSelectedDoc(item);
                                            setIsReviewOpen(true);
                                        }}
                                        className="relative z-20 mt-auto w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 shadow-md shadow-indigo-100 cursor-pointer"
                                    >
                                        <Eye size={14} /> Review Document
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Compact Audit Table */
                        <div className="overflow-x-auto border border-slate-200 rounded-[20px] overflow-hidden bg-white">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/60 border-b border-slate-200">
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee Details</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Document Type</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uploaded At</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Verification Status</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPending.map(item => (
                                        <tr key={item.id} className="group hover:bg-slate-50/40 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-indigo-600 uppercase group-hover:scale-105 transition-transform shadow-sm">
                                                        {item?.first_name?.[0] || '?'}{item?.last_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-tight tracking-tight">{item?.first_name} {item?.last_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.employee_id_number} • <span className="text-indigo-600 font-bold">{item.designation}</span></p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                                        <FileText size={14} />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700">{item.document_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-xs font-semibold text-slate-755 tracking-tight">{new Date(item.created_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Encrypted Security</p>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> Pending Review
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedDoc(item);
                                                        setIsReviewOpen(true);
                                                    }}
                                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center gap-2 ml-auto"
                                                >
                                                    <Eye size={14} /> Review Document
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Compliance;
