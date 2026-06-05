import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, XCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd ? '/api' : 'http://localhost:5000/api';

const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            setStatus('error');
            return;
        }

        if (password.length < 8) {
            setMessage('Password must be at least 8 characters long');
            setStatus('error');
            return;
        }

        try {
            setStatus('loading');
            await axios.post(`${API_BASE_URL}/auth/set-password`, {
                token,
                password
            });
            setStatus('success');
            setMessage('Your password has been set successfully! You can now login using your Employee ID and this password.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to set password. Link may be expired.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-outfit p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <XCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Invalid Link</h1>
                    <p className="text-slate-500 text-sm font-medium mb-8">This password setup link is missing or invalid. Please contact your HR team.</p>
                    <button 
                        onClick={() => navigate('/employee')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-outfit p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-2xl shadow-indigo-100 max-w-md w-full border border-slate-100 relative overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
                
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-8">
                        <ShieldCheck size={28} />
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Secure Account</h1>
                    <p className="text-slate-500 text-sm font-medium mb-8">Set your professional password to activate your MyFastHR profile.</p>

                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mb-2">Success!</h2>
                                <p className="text-slate-500 text-sm font-medium mb-6">{message}</p>
                                <div className="flex items-center justify-center gap-2 text-indigo-600 text-xs font-bold animate-pulse uppercase tracking-widest">
                                    Redirecting to Login <ArrowRight size={14} />
                                </div>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">New Password</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"
                                    >
                                        <XCircle size={18} />
                                        <span className="text-xs font-bold">{message}</span>
                                    </motion.div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    {status === 'loading' ? 'Encrypting...' : 'Activate Account'}
                                </button>
                            </form>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>End-to-End Encrypted</span>
                        <span>Powered by MyFastHR</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SetPassword;
