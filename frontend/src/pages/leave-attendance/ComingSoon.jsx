import React from 'react';
import { Settings } from 'lucide-react';

const ComingSoon = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-600 mb-8 shadow-inner">
                <Settings size={40} strokeWidth={2.5} className="animate-spin-slow" />
            </div>

            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Module under development</p>
            
            <div className="mt-12 flex gap-4">
                <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                <div className="h-1 w-4 bg-slate-200 rounded-full" />
                <div className="h-1 w-4 bg-slate-200 rounded-full" />
            </div>
        </div>
    );
};

export default ComingSoon;
