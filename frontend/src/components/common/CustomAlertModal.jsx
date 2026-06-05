import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, HelpCircle, X } from 'lucide-react';

const CustomAlertModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type = 'info', // 'info' | 'success' | 'warning' | 'error' | 'confirm'
    confirmText = 'OK',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const themes = {
        success: {
            icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
            border: 'border-emerald-100',
            bg: 'bg-emerald-50/50',
            btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
            titleColor: 'text-emerald-950'
        },
        error: {
            icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
            border: 'border-rose-100',
            bg: 'bg-rose-50/50',
            btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
            titleColor: 'text-rose-950'
        },
        warning: {
            icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
            border: 'border-amber-100',
            bg: 'bg-amber-50/50',
            btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
            titleColor: 'text-amber-950'
        },
        info: {
            icon: <Info className="w-8 h-8 text-indigo-500" />,
            border: 'border-indigo-100',
            bg: 'bg-indigo-50/50',
            btnBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
            titleColor: 'text-indigo-950'
        },
        confirm: {
            icon: <HelpCircle className="w-8 h-8 text-slate-500" />,
            border: 'border-slate-100',
            bg: 'bg-slate-50/50',
            btnBg: 'bg-slate-800 hover:bg-slate-900 shadow-slate-100',
            titleColor: 'text-slate-950'
        }
    };

    const theme = themes[type] || themes.info;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                {/* Backdrop overlay */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                    onClick={type !== 'confirm' ? onClose : undefined}
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className={`relative w-full max-w-sm bg-white rounded-2xl border ${theme.border} shadow-2xl overflow-hidden z-10`}
                >
                    {/* Header line decoration */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    
                    {/* Close Button for Alert types */}
                    {type !== 'confirm' && (
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-450 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                        >
                            <X size={16} className="stroke-[2.5]" />
                        </button>
                    )}

                    <div className="p-6 text-center space-y-4">
                        {/* Icon Wrap */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${theme.bg}`}>
                            {theme.icon}
                        </div>

                        {/* Title & Message */}
                        <div className="space-y-1">
                            <h3 className={`text-base font-extrabold tracking-tight ${theme.titleColor}`}>
                                {title || (type === 'confirm' ? 'Are you sure?' : 'Notification')}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 leading-relaxed px-2">
                                {message}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                            {type === 'confirm' ? (
                                <>
                                    <button 
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
                                    >
                                        {cancelText}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`flex-1 px-4 py-2 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md ${theme.btnBg}`}
                                    >
                                        {confirmText}
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={onClose}
                                    className={`w-full max-w-[120px] px-4 py-2 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md ${theme.btnBg}`}
                                >
                                    {confirmText}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CustomAlertModal;
