import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';

const SearchableSelect = ({ label, options, value, onChange, placeholder = "---Select---", required = false, error = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [openUpwards, setOpenUpwards] = useState(false);
    const containerRef = useRef(null);
    
    // Detect if dropdown should open upwards
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 250) {
                setOpenUpwards(true);
            } else {
                setOpenUpwards(false);
            }
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options?.filter(opt => {
        const labelText = typeof opt === 'string' ? opt : opt.label;
        return labelText?.toLowerCase().includes(search.toLowerCase());
    }) || [];

    const displayValue = options?.find(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        return val === value;
    });

    const getLabel = (opt) => typeof opt === 'string' ? opt : opt.label;
    const getValue = (opt) => typeof opt === 'string' ? opt : opt.value;

    return (
        <div className="space-y-1.5 relative" ref={containerRef}>
            {label && (
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border-2 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer transition-all ${
                    isOpen ? 'border-black ring-4 ring-black/5' : error ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'
                }`}
            >
                <span className={value ? 'text-black' : 'text-slate-400'}>
                    {displayValue ? getLabel(displayValue) : placeholder}
                </span>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <Plus size={16} className={isOpen ? 'text-black' : 'text-slate-400'} />
                </div>
            </div>

            {isOpen && (
                <div className={`absolute left-0 right-0 z-[100] bg-white border-2 border-black rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
                    openUpwards ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
                }`}>
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search existing..."
                                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs font-bold focus:outline-none focus:border-black transition-all"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => (
                                <div 
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(getValue(opt));
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors border-l-4 ${
                                        getValue(opt) === value 
                                        ? 'bg-black text-white border-black' 
                                        : 'text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200'
                                    }`}
                                >
                                    {getLabel(opt)}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No matches found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
