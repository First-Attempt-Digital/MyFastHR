import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Lock, Shield, Loader2, ArrowRight, Hash, Heart, Eye, EyeOff, Search, Home, Users, Briefcase, Calendar, FileText } from 'lucide-react';
import api, { fetchBranding, getAssetUrl } from '../utils/api';

const EmployeeLogin = () => {
    const { companySlug } = useParams();
    const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
    const [otpStep, setOtpStep] = useState('request'); // 'request' or 'verify'
    const [identifier, setIdentifier] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [logoUrl, setLogoUrl] = useState('/uploads/branding/logo.png');
    const [logoHeight, setLogoHeight] = useState(40);
    const [logoError, setLogoError] = useState(false);
    const [branding, setBranding] = useState({
        app_name: 'MyFastHR',
        login_title: 'Log in to your account',
        login_subtitle: 'Welcome back! Please enter your details below.',
        footer_copyright: '© 2026 MyFastHR. All rights reserved.'
    });

    const applyPortalBrandColor = (color) => {
        if (!color) return;
        let styleEl = document.getElementById('dynamic-brand-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-brand-styles';
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = `
            :root {
                --primary-color: ${color};
                --primary-color-hover: ${color}ee;
            }
            .bg-indigo-600, .bg-indigo-750, .bg-[#1abc9c], .bg-indigo-700:hover, .hover\\:bg-indigo-700:hover, .hover\\:bg-indigo-600:hover { background-color: ${color} !important; }
            .text-indigo-600, .text-indigo-650, .text-indigo-500, .hover\\:text-indigo-600:hover, .hover\\:text-indigo-650:hover, .hover\\:text-indigo-700:hover { color: ${color} !important; }
            .focus\\:border-indigo-500:focus, .focus\\:ring-indigo-500\\/5:focus, .focus\\:ring-indigo-500\\/20:focus { border-color: ${color} !important; }
            .shadow-indigo-100 { --tw-shadow-color: ${color}20 !important; }
            .bg-gradient-to-br { background-image: linear-gradient(135deg, ${color} 0%, ${color}ee 50%, #0f172a 100%) !important; }
        `;
    };

    React.useEffect(() => {
        if (localStorage.getItem('auth_token')) {
            navigate('/dashboard');
        }

        const loadLogo = async () => {
            try {
                if (companySlug) {
                    const data = await api.get(`/auth/tenant-branding/${companySlug}`);
                    if (data) {
                        if (data.logo_url) {
                            setLogoUrl(getAssetUrl(data.logo_url));
                            setLogoError(false);
                        } else {
                            setLogoError(true);
                        }
                        setBranding({
                            app_name: data.name || 'MyFastHR',
                            login_title: `Welcome to ${data.name || 'MyFastHR'}`,
                            login_subtitle: 'Please enter your employee details below.',
                            footer_copyright: `© ${new Date().getFullYear()} ${data.name || 'MyFastHR'}. All rights reserved.`
                        });
                        if (data.brand_color) {
                            applyPortalBrandColor(data.brand_color);
                        }
                    }
                } else {
                    const data = await fetchBranding();
                    if (data) {
                        if (data.logo_url) {
                            setLogoUrl(getAssetUrl(data.logo_url));
                            setLogoError(false);
                        }
                        if (data.logo_height) {
                            setLogoHeight(parseInt(data.logo_height));
                        }
                        setBranding({
                            app_name: data.app_name || 'MyFastHR',
                            login_title: data.login_title || 'Log in to your account',
                            login_subtitle: data.login_subtitle || 'Welcome back! Please enter your details below.',
                            footer_copyright: data.footer_copyright || '© 2026 MyFastHR. All rights reserved.'
                        });
                        if (data.primary_color) {
                            applyPortalBrandColor(data.primary_color);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load branding logo:', err);
            }
        };
        loadLogo();
    }, [navigate, companySlug]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { 
                identifier: identifier.trim(), 
                password: password.trim() 
            });

            localStorage.setItem('auth_token', res.accessToken);
            localStorage.setItem('user_role', res.user.role);
            localStorage.setItem('user_email', res.user.email);
            localStorage.setItem('employee_id', res.user.employee_id);

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification Failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/request-otp', { email: email.trim() });
            setOtpStep('verify');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-otp', { email: email.trim(), otp: otp.trim() });
            localStorage.setItem('auth_token', res.accessToken);
            localStorage.setItem('user_role', res.user.role);
            localStorage.setItem('user_email', res.user.email);
            localStorage.setItem('employee_id', res.user.employee_id);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-outfit select-none">
            {/* Left Side: Form Panel (Balanced 50% split, scrollbars removed) */}
            <div className="lg:col-span-6 h-full flex flex-col justify-between p-8 lg:p-12 bg-slate-50/50 relative z-10 shadow-xl shadow-slate-100 overflow-hidden">
                {/* Top Logo */}
                <div className="flex items-center justify-between w-full shrink-0">
                    {!logoError ? (
                        <img 
                            src={logoUrl} 
                            alt="MyFastHR Logo" 
                            style={{ height: `${logoHeight || 36}px` }}
                            className="w-auto object-contain max-w-[160px]" 
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-100 italic">
                                {branding.app_name?.substring(0, 1) || 'F'}
                            </div>
                            <span className="text-sm font-extrabold text-slate-800 tracking-tight">{branding.app_name}</span>
                        </div>
                    )}
                    
                    <span className="text-[10px] font-bold text-slate-450 bg-white border border-slate-200/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Employee Portal
                    </span>
                </div>

                {/* Form Wrapper */}
                <div className="w-full max-w-[390px] mx-auto my-auto space-y-5 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500 shrink-0">
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{branding.login_title}</h2>
                        <p className="text-sm text-slate-500 font-semibold">{branding.login_subtitle}</p>
                    </div>

                    {loginMode === 'password' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Employee ID Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Employee ID</label>
                                <div className="relative group">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter your Employee ID"
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-850 placeholder:text-slate-355 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••••••"
                                        className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-855 placeholder:text-slate-355 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
                                    <span className="leading-snug">{error}</span>
                                </div>
                            )}

                            {/* Remember me & Forgot Password */}
                            <div className="flex items-center justify-between px-1 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer" 
                                    />
                                    <span className="text-xs font-bold text-slate-500">Remember for 30 days</span>
                                </label>
                                <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Forgot password?</button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-indigo-200/50 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Log in
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            <div className="pt-3 flex flex-col items-center">
                                <button 
                                    type="button"
                                    onClick={() => { setLoginMode('otp'); setError(''); }}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 transition-colors"
                                >
                                    <Mail size={15} /> Login by Email (OTP)
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {otpStep === 'request' ? (
                                <form onSubmit={handleRequestOTP} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                required
                                                placeholder="Enter registered email"
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-850 placeholder:text-slate-350 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                            <span className="leading-snug">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-indigo-200/50 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Send OTP"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div className="text-center space-y-1 py-1.5 bg-slate-50 border border-slate-150/60 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification code sent to</p>
                                        <p className="text-xs font-extrabold text-indigo-650">{email}</p>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Enter OTP</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                placeholder="000000"
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-lg tracking-[0.4em] text-center font-bold text-slate-850 placeholder:text-slate-355 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-rose-50 border border-rose-100 text-rose-650 px-4 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
                                            <span className="leading-snug">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-teal-100 hover:shadow-teal-200 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify & Login"}
                                    </button>
                                    
                                    <button 
                                        type="button"
                                        onClick={() => setOtpStep('request')}
                                        className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-750 hover:underline text-center"
                                    >
                                        Resend Code?
                                    </button>
                                </form>
                            )}

                            <div className="pt-3 flex flex-col items-center">
                                <button 
                                    type="button"
                                    onClick={() => { setLoginMode('password'); setError(''); }}
                                    className="text-xs font-bold text-indigo-650 hover:text-indigo-750 flex items-center gap-2 transition-colors"
                                >
                                    <ArrowRight size={15} className="rotate-180" /> Back to ID Login
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OR Separator */}
                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-300 uppercase tracking-widest py-0.5">
                        <div className="h-[1px] bg-slate-200/60 flex-1" />
                        <span>Or</span>
                        <div className="h-[1px] bg-slate-200/60 flex-1" />
                    </div>

                    {/* Admin Switch Button */}
                    <button
                        onClick={() => navigate(companySlug ? `/login/${companySlug}` : '/login')}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-bold shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                        <Shield size={16} className="text-slate-400" />
                        Log in as Administrator
                    </button>
                </div>

                {/* Bottom Footer */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-200/40 shrink-0">
                    <span>{branding.footer_copyright}</span>
                    <div className="flex items-center gap-1">
                        <Shield size={12} className="text-slate-400" />
                        <span>Secure Node</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Interactive Backdrop & App Tablet Mockup */}
            <div className="lg:col-span-6 h-full hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-indigo-705 to-indigo-950 text-white relative overflow-hidden shrink-0">
                {/* Soft Abstract Backing Ambient Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square bg-indigo-500/30 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none" />
                
                {/* Dynamic Wavy Background Shape */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                
                {/* Top Branding & Slogan Group (No empty space at top, slogan sits beautifully) */}
                <div className="space-y-6 relative z-10 max-w-[420px] pt-4 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 font-black text-lg italic shadow-inner">
                            F
                        </div>
                        <span className="text-sm font-extrabold tracking-tight">MyFastHR Enterprise</span>
                    </div>

                    <div className="space-y-3.5">
                        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
                            Empowering modern workforce operations.
                        </h1>
                        <p className="text-indigo-200/90 text-xs font-semibold leading-relaxed">
                            Streamline payroll, attendance analytics, and shift schedules with our next-generation unified workplace platform.
                        </p>
                    </div>
                </div>

                {/* Empty Middle Container with Floating 3D Sticker */}
                <div className="flex-1 relative w-full z-20 flex items-center justify-center min-h-[390px]">
                    <style>{`
                        @keyframes float-sticker {
                            0% { transform: translateX(-140px) translateY(0px) rotate(-1deg); }
                            50% { transform: translateX(-140px) translateY(-10px) rotate(1deg); }
                            100% { transform: translateX(-140px) translateY(0px) rotate(-1deg); }
                        }
                    `}</style>
                    <img 
                        src="/assets/workspace_sticker_transparent.png" 
                        alt="Workspace Sticker" 
                        className="w-auto h-[380px] object-contain select-none pointer-events-none"
                        style={{ 
                            animation: 'float-sticker 6s ease-in-out infinite'
                        }}
                    />
                </div>

                {/* Overlapping App UI Showcase Tablet Container - Placed at bottom right, text will never overlap */}
                <div className="absolute right-[-15%] bottom-[-10%] w-[110%] max-w-[480px] aspect-[4/3] bg-slate-900 rounded-[28px] shadow-2xl p-2.5 border-4 border-slate-900/60 overflow-hidden rotate-[-3deg] select-none flex flex-col pointer-events-none">
                    <div className="flex-1 bg-white rounded-2xl overflow-hidden flex text-slate-800 font-outfit text-left">
                        {/* Sidebar Mockup */}
                        <div className="w-1/4 bg-slate-50 border-r border-slate-100 p-2.5 flex flex-col justify-between shrink-0">
                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5 px-1 py-1 bg-slate-100/60 rounded-xl">
                                    <div className="w-4 h-4 bg-indigo-600 rounded-lg flex items-center justify-center text-[8px] text-white font-black">F</div>
                                    <span className="text-[8px] font-black text-slate-800">MyFastHR</span>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 text-indigo-650 rounded-lg">
                                        <Home size={10} className="text-indigo-500" />
                                        <span className="text-[8px] font-bold">Dashboard</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400">
                                        <Users size={10} />
                                        <span className="text-[8px] font-bold">Employees</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400">
                                        <Briefcase size={10} />
                                        <span className="text-[8px] font-bold">Payroll</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400">
                                        <Calendar size={10} />
                                        <span className="text-[8px] font-bold">Leaves</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400">
                                        <FileText size={10} />
                                        <span className="text-[8px] font-bold">Documents</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-4.5 h-4.5 bg-slate-200 rounded-full shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[7px] font-extrabold text-slate-700 truncate">Robin H.</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Area Mockup */}
                        <div className="flex-1 bg-slate-50/50 p-3 space-y-3 overflow-hidden">
                            {/* Welcome Banner */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Overview</span>
                                    <h3 className="text-[10px] font-black text-slate-800 mt-0.5">Welcome Back</h3>
                                </div>
                                <div className="w-20 h-4.5 bg-white border border-slate-200 rounded-lg flex items-center px-1.5 gap-1 shadow-sm">
                                    <Search size={7} className="text-slate-400" />
                                    <div className="w-8 h-0.5 bg-slate-200 rounded" />
                                </div>
                            </div>

                            {/* Mini Metrics Cards */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-sm flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shrink-0">
                                        <Users size={10} />
                                    </div>
                                    <div>
                                        <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wider block">Total Members</span>
                                        <span className="text-[9px] font-black text-slate-800">118 Active</span>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-sm flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
                                        <Heart size={10} />
                                    </div>
                                    <div>
                                        <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                                        <span className="text-[9px] font-black text-slate-800">96.4% Good</span>
                                    </div>
                                </div>
                            </div>

                            {/* Employee Records Card */}
                            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-2.5 py-2 border-b border-slate-50 flex items-center justify-between">
                                    <span className="text-[8px] font-bold text-slate-800">Workforce Status Records</span>
                                    <span className="text-[6px] font-black text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded uppercase">Real-Time</span>
                                </div>
                                <div className="divide-y divide-slate-50 px-2.5 text-[7px] font-bold text-slate-650">
                                    <div className="flex justify-between items-center py-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 bg-indigo-50 rounded-full flex items-center justify-center text-[6px] text-indigo-500">CW</div>
                                            <span className="font-extrabold text-slate-855">Candice Wu</span>
                                        </div>
                                        <span className="text-slate-400">Technology</span>
                                        <span className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded text-[7px]">Active</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 bg-rose-50 rounded-full flex items-center justify-center text-[6px] text-rose-500">LC</div>
                                            <span className="font-extrabold text-slate-855">Liam Chen</span>
                                        </div>
                                        <span className="text-slate-400">Human Resources</span>
                                        <span className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded text-[7px]">Active</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 bg-amber-50 rounded-full flex items-center justify-center text-[6px] text-amber-500">SP</div>
                                            <span className="font-extrabold text-slate-855">Sophia Patel</span>
                                        </div>
                                        <span className="text-slate-400">Operations</span>
                                        <span className="bg-amber-50 text-amber-700 px-1 py-0.5 rounded text-[7px]">On Leave</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeLogin;
