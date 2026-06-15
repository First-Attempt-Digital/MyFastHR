import { 
  Search, Bell, Settings, Power, Home, Users, Calendar, 
  FileText, Activity, Clock, Shield, UserCircle, 
  Briefcase, LayoutGrid, Sparkles, Network, Building2, Lock, X, TrendingUp, Zap, Radio, ChevronDown, UserMinus, Plus, Upload, Database,
  UserCheck, History, RefreshCw, Landmark, Calculator, Coins, CheckCircle2
} from 'lucide-react';


import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { fetchBranding, getAssetUrl, setOpenDeleteSecurityModal, clearOpenDeleteSecurityModal } from '../../utils/api';
import DeleteSecurityModal from '../common/DeleteSecurityModal';

const AppMenuItem = ({ icon: Icon, label, path, active = false, disabled = false, color = "bg-indigo-50", iconColor = "text-indigo-600", onClick }) => {
  if (disabled) return null;

  return (
    <Link 
      to={path} 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
        active ? 'bg-slate-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <span className={`text-xs font-bold ${active ? 'text-slate-900' : 'text-slate-600'}`}>
        {label}
      </span>
    </Link>
  );
};

const SidebarMenuItem = ({ icon: Icon, label, path, active, color, iconColor }) => {
  return (
    <Link 
      to={path} 
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
        active 
          ? 'bg-indigo-50/70 border border-indigo-100/50 text-indigo-600' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${active ? color : 'bg-slate-50 group-hover:bg-indigo-50/50'}`}>
        <Icon size={18} className={active ? iconColor : 'text-slate-400 group-hover:text-indigo-600'} />
      </div>
      <span className="text-sm font-bold">{label}</span>
      {active && (
        <motion.div 
          layoutId="sidebarActiveIndicator"
          className="absolute left-0 w-1.5 h-8 bg-indigo-600 rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
};

const AppShell = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem('user_role') || 'company_admin');
  const [superAdminViewMode, setSuperAdminViewMode] = useState(localStorage.getItem('super_admin_view_mode') || 'platform');
  const [payrollDropdownOpen, setPayrollDropdownOpen] = useState(false);

  // Global Delete Security Key Challenge State
  const [globalDeleteChallenge, setGlobalDeleteChallenge] = useState({
      isOpen: false,
      resolve: null,
      reject: null
  });

  // Global Custom Confirm and Alert Modal States
  const [customConfirm, setCustomConfirm] = useState({
      isOpen: false,
      title: 'Confirmation Required',
      message: '',
      resolve: null
  });

  const [customAlert, setCustomAlert] = useState({
      isOpen: false,
      title: 'Alert',
      message: '',
      resolve: null
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');
  const menuRef = useRef(null);
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem('platform_logo_url') || '/uploads/branding/logo.png');
  const [logoHeight, setLogoHeight] = useState(parseInt(localStorage.getItem('platform_logo_height')) || 36);
  const [logoError, setLogoError] = useState(false);
  const [appName, setAppName] = useState(localStorage.getItem('platform_app_name') || 'MyFastHR');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [userMetrics, setUserMetrics] = useState(null);
  const [enabledFeatures, setEnabledFeatures] = useState(['payroll', 'kudos', 'helpdesk']);
  const [systemFreezeActive, setSystemFreezeActive] = useState(false);

  const loadLogo = async () => {
    try {
      const branding = await fetchBranding();
      if (branding) {
        if (branding.logo_url) {
          const fullLogoUrl = getAssetUrl(branding.logo_url);
          setLogoUrl(fullLogoUrl);
          localStorage.setItem('platform_logo_url', fullLogoUrl);
          setLogoError(false);
        }
        if (branding.logo_height) {
          setLogoHeight(parseInt(branding.logo_height));
          localStorage.setItem('platform_logo_height', branding.logo_height);
        }
        if (branding.app_name) {
          setAppName(branding.app_name);
          localStorage.setItem('platform_app_name', branding.app_name);
        }
        if (branding.primary_color) {
          localStorage.setItem('platform_primary_color', branding.primary_color);
        }
        setSystemFreezeActive(!!branding.system_freeze);
      }
    } catch (err) {
      console.error('Failed to load branding logo:', err);
    }
  };

  const SettingsMenuItem = ({ icon: Icon, label, path, onClick }) => (
    <Link 
      to={path} 
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all group"
    >
      <Icon size={16} className="text-slate-400 group-hover:text-indigo-600" />
      <span className="text-xs font-bold">{label}</span>
    </Link>
  );

  useEffect(() => {
    fetchNotifications();
    fetchCompanyStatus();
    loadLogo();
    
    // Register global delete verification prompt callback
    const deleteCallback = ({ resolve, reject, url }) => {
        setGlobalDeleteChallenge({
            isOpen: true,
            resolve,
            reject,
            url
        });
    };
    setOpenDeleteSecurityModal(deleteCallback);

    // Register global custom confirm & alert utilities
    window.customConfirm = (message, title = 'Confirm Action') => {
        return new Promise((resolve) => {
            setCustomConfirm({
                isOpen: true,
                title,
                message,
                resolve
            });
        });
    };

    window.customAlert = (message, title = 'Alert') => {
        return new Promise((resolve) => {
            setCustomAlert({
                isOpen: true,
                title,
                message,
                resolve
            });
        });
    };

    const interval = setInterval(() => {
        fetchNotifications();
        fetchCompanyStatus();
    }, 30000);
    
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleBrandingUpdate = () => {
      loadLogo();
      fetchCompanyStatus();
    };
    const handleSystemFreezeUpdate = () => {
      loadLogo();
    };
    window.addEventListener('branding_updated', handleBrandingUpdate);
    window.addEventListener('system_freeze_updated', handleSystemFreezeUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('branding_updated', handleBrandingUpdate);
      window.removeEventListener('system_freeze_updated', handleSystemFreezeUpdate);
      clearOpenDeleteSecurityModal(deleteCallback); // Clean up global callback safely
      delete window.customConfirm;
      delete window.customAlert;
    };
  }, []);

  const fetchCompanyStatus = async () => {
    try {
        const authRole = localStorage.getItem('user_role');
        const viewMode = localStorage.getItem('super_admin_view_mode') || 'platform';
        const defaultPlatformColor = localStorage.getItem('platform_primary_color') || '#6366f1';
        
        // Load company status metrics if logged in
        if (authRole && authRole !== 'super_admin') {
            const res = await api.get('/analytics/metrics'); 
            setSubscriptionStatus(res?.subscription_status || 'active');
            setUserMetrics(res);
        }

        // Fetch brand color via profile/me call (since users table left joins companies to fetch brand_color)
        if (authRole && !(authRole === 'super_admin' && viewMode === 'platform')) {
            const profile = await api.get('/profile/me');
            if (profile) {
                if (profile.brand_color) {
                    applyBrandColor(profile.brand_color);
                } else {
                    applyBrandColor(defaultPlatformColor);
                }
                if (profile.tenant_logo_url) {
                    const fullTenantLogoUrl = getAssetUrl(profile.tenant_logo_url);
                    setLogoUrl(fullTenantLogoUrl);
                    localStorage.setItem('platform_logo_url', fullTenantLogoUrl);
                    setLogoError(false);
                }
                if (profile.tenant_name) {
                    setAppName(profile.tenant_name);
                }
                if (profile.enabled_features) {
                    try {
                        const parsed = typeof profile.enabled_features === 'string'
                            ? JSON.parse(profile.enabled_features)
                            : profile.enabled_features;
                        setEnabledFeatures(Array.isArray(parsed) ? parsed : ['payroll', 'kudos', 'helpdesk']);
                    } catch (e) {
                        setEnabledFeatures(['payroll', 'kudos', 'helpdesk']);
                    }
                }
            } else {
                applyBrandColor(defaultPlatformColor);
            }
        } else {
            // Revert to platform color if platform admin mode or no color
            applyBrandColor(defaultPlatformColor);
            setEnabledFeatures(['payroll', 'kudos', 'helpdesk']);
        }
    } catch (err) {
        // Fallback for demo
    }
  };

  const applyBrandColor = (color) => {
    let styleEl = document.getElementById('dynamic-brand-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-brand-styles';
      document.head.appendChild(styleEl);
    }
    
    // Generate class override rules for Tailwind classes to match brand color dynamically
    // Also include a CSS custom property if any components use var(--primary-color)
    styleEl.innerHTML = `
      :root {
        --primary-color: ${color};
        --primary-color-hover: ${color}ee;
      }
      /* Tailwind BG classes override */
      .bg-indigo-600, .bg-blue-600, .bg-\\[\\#4361ee\\], .bg-\\[\\#00BFA5\\] { background-color: ${color} !important; }
      .hover\\:bg-indigo-700:hover, .hover\\:bg-blue-700:hover, .hover\\:bg-indigo-600:hover { background-color: ${color}ee !important; }
      
      /* Subtle transparent/light background variations */
      .bg-indigo-50, .bg-blue-50, .bg-\\[\\#4361ee\\]\\/5, .bg-\\[\\#00BFA5\\]\\/10, .bg-\\[\\#00BFA5\\]\\/5 { background-color: ${color}15 !important; }
      .bg-indigo-50\\/50, .bg-blue-50\\/50 { background-color: ${color}08 !important; }
      .bg-indigo-50\\/30, .bg-blue-50\\/30 { background-color: ${color}05 !important; }
      .bg-indigo-100, .bg-blue-100 { background-color: ${color}25 !important; }
      .bg-indigo-100\\/80, .bg-blue-100\\/80 { background-color: ${color}20 !important; }
      
      /* Border colors */
      .border-indigo-100, .border-blue-100, .border-\\[\\#4361ee\\]\\/20, .border-\\[\\#00BFA5\\] { border-color: ${color}40 !important; }
      .border-indigo-100\\/50, .border-blue-100\\/50 { border-color: ${color}25 !important; }
      .border-indigo-100\\/30, .border-blue-100\\/30 { border-color: ${color}15 !important; }
      .focus\\:ring-indigo-500\\/20:focus, .focus\\:ring-blue-500\\/20:focus { --tw-ring-color: ${color}35 !important; }
      
      /* Text classes override */
      .text-indigo-600, .text-blue-600, .text-indigo-500, .text-blue-500, .text-\\[\\#4361ee\\], .text-\\[\\#00BFA5\\] { color: ${color} !important; }
      .hover\\:text-indigo-600:hover, .hover\\:text-blue-600:hover { color: ${color} !important; }
      .group-hover\\:text-indigo-600:hover, .group-hover\\:text-blue-600:hover { color: ${color} !important; }
      .group-hover\\:text-indigo-600, .group-hover\\:text-blue-600 { color: ${color} !important; }
      .hover\\:border-indigo-600:hover, .hover\\:border-blue-600:hover, .hover\\:border-\\[\\#00BFA5\\]:hover { border-color: ${color} !important; }
      .hover\\:text-\\[\\#00BFA5\\]:hover { color: ${color} !important; }
      .hover\\:bg-\\[\\#00BFA5\\]\\/5:hover { background-color: ${color}15 !important; }
      .group-hover\\:bg-\\[\\#00BFA5\\]\\/10:hover { background-color: ${color}15 !important; }
      
      /* Accent indicators */
      .bg-\\[\\#4361ee\\] { background-color: ${color} !important; }
      .border-\\[\\#4361ee\\] { border-color: ${color} !important; }
      
      /* Shadow ring elements */
      .shadow-indigo-100, .shadow-blue-100, .shadow-\\[\\#00BFA5\\]\\/20, .shadow-\\[\\#00BFA5\\]\\/10 { --tw-shadow-color: ${color}20 !important; }
    `;
  };

  const fetchNotifications = async () => {
    try {
      const authRole = localStorage.getItem('user_role');
      if (!authRole) return;
      
      const res = await api.get('/notifications');
      setNotifications(res || []);
      const countRes = await api.get('/notifications/unread-count');
      setUnreadCount(countRes.count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Mark all read failed', err);
    }
  };

  const roles = {
    'super_admin': { label: 'Super Admin', token: 'test.super.token', color: 'bg-purple-600', short: 'SA' },
    'company_admin': { label: 'Company Admin', token: 'test.admin.token', color: 'bg-indigo-600', short: 'AD' },
    'manager': { label: 'Team Manager', token: 'test.manager.token', color: 'bg-emerald-600', short: 'TM' },
    'employee': { label: 'Employee', token: 'test.employee.token', color: 'bg-rose-600', short: 'EM' }
  };

  const menuItems = [
    { icon: Home, label: "Homepage", path: "/dashboard", color: "bg-fuchsia-50", iconColor: "text-fuchsia-500", visible: true },
    { icon: Building2, label: "Super Admin Portal", path: "/admin/companies", color: "bg-purple-50", iconColor: "text-purple-600", visible: (role === 'super_admin' && superAdminViewMode === 'platform') },
    { icon: Users, label: "Employee", path: "/employees/overview", color: "bg-teal-50", iconColor: "text-teal-500", visible: (role === 'company_admin' || role === 'manager' || (role === 'super_admin' && superAdminViewMode === 'tenant')) },
    { icon: FileText, label: "Payroll", path: "/payroll", color: "bg-rose-50", iconColor: "text-rose-500", visible: enabledFeatures.includes('payroll') && (role === 'company_admin' || (role === 'super_admin' && superAdminViewMode === 'tenant')) },
    { icon: Calendar, label: "Leave and Attendance", path: "/leaves", color: "bg-purple-50", iconColor: "text-purple-500", visible: (role !== 'employee' && !(role === 'super_admin' && superAdminViewMode === 'platform')) },
    { icon: Activity, label: "Analytics", path: "/analytics", color: "bg-cyan-50", iconColor: "text-cyan-500", visible: (role === 'company_admin' || role === 'manager' || (role === 'super_admin' && superAdminViewMode === 'tenant')) },
    { icon: Network, label: "Live Org-Chart", path: "/employees/org-chart", color: "bg-orange-50", iconColor: "text-orange-500", visible: (role === 'company_admin' || (role === 'super_admin' && superAdminViewMode === 'tenant')) },
    { icon: Shield, label: "Verification Hub", path: "/admin/compliance", color: "bg-blue-50", iconColor: "text-blue-500", visible: (role === 'company_admin' || (role === 'super_admin' && superAdminViewMode === 'tenant')) },
    { icon: Lock, label: "Identity Documents", path: "/identity-vault", color: "bg-slate-100", iconColor: "text-slate-600", visible: (role === 'super_admin' && superAdminViewMode === 'platform') },
    { icon: Settings, label: "Settings", path: "/settings", color: "bg-gray-100", iconColor: "text-gray-600", visible: (role === 'company_admin' || (role === 'super_admin' && superAdminViewMode === 'tenant')) },
    { icon: Briefcase, label: "Task", path: "/admin/tasks", color: "bg-violet-50", iconColor: "text-violet-500", visible: enabledFeatures.includes('kudos') && (role !== 'employee' && !(role === 'super_admin' && superAdminViewMode === 'platform')) },
    
    // Employee Specific Tabs
    { icon: UserCircle, label: "Profile", path: "/profile", color: "bg-indigo-50", iconColor: "text-indigo-500", visible: (role === 'employee') },
    { icon: Calendar, label: "Leaves", path: "/leaves", color: "bg-rose-50", iconColor: "text-rose-500", visible: (role === 'employee') },
    { icon: FileText, label: "Payslips", path: "/payslips", color: "bg-emerald-50", iconColor: "text-emerald-500", visible: enabledFeatures.includes('payroll') && (role === 'employee') },
    { icon: Clock, label: "Attendance Logs", path: "/attendance", color: "bg-blue-50", iconColor: "text-blue-500", visible: (role === 'employee') },
    { icon: TrendingUp, label: "Performance", path: "/analytics", color: "bg-amber-50", iconColor: "text-amber-500", visible: (role === 'employee') }
  ];

  const filteredItems = searchQuery.trim() === '' ? [] : menuItems.filter(item => 
    item.visible && item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExitImpersonation = () => {
    const originalToken = localStorage.getItem('super_admin_token');
    if (originalToken) {
      localStorage.setItem('auth_token', originalToken);
      localStorage.removeItem('super_admin_token');
      localStorage.setItem('user_role', 'super_admin');
      localStorage.setItem('super_admin_view_mode', 'platform');
      navigate('/dashboard');
      window.location.reload();
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-outfit overflow-hidden">
      {systemFreezeActive && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-6 py-2 text-xs font-black tracking-wider flex items-center justify-center shadow-md relative z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white inline-block animate-ping mr-1" />
            <span>⚠️ EMERGENCY SYSTEM-WIDE FREEZE ACTIVE: Write operations and logins are temporarily frozen.</span>
          </div>
        </div>
      )}
      {localStorage.getItem('super_admin_token') && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2 text-xs font-black tracking-wider flex items-center justify-between shadow-md relative z-50">
          <div className="flex items-center gap-2">
            <span className="animate-ping w-2 h-2 rounded-full bg-white inline-block mr-1" />
            <span>⚠️ PLATFORM MODE: CURRENTLY IMPERSONATING TENANT ADMINISTRATOR</span>
          </div>
          <button 
            onClick={handleExitImpersonation}
            className="bg-white hover:bg-slate-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Exit Impersonation
          </button>
        </div>
      )}
      {/* Top Navbar */}
      <header className="h-[72px] bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            {/* Logo & Menu Trigger Group */}
            <div 
              className="flex items-center gap-3 relative" 
              onMouseEnter={() => role !== 'employee' && setShowAppMenu(true)}
              onMouseLeave={() => role !== 'employee' && setShowAppMenu(false)}
            >
               {role !== 'employee' ? (
                 <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${showAppMenu ? 'bg-indigo-100/80 shadow-inner' : 'bg-indigo-50/50 hover:bg-indigo-100/80'}`}
                 >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <circle cx="4" cy="4" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="12" cy="4" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="20" cy="4" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="4" cy="12" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="12" cy="12" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="20" cy="12" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="4" cy="20" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="12" cy="20" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                       <circle cx="20" cy="20" r="2.5" fill="currentColor" className={showAppMenu ? 'text-indigo-600' : 'text-slate-700'} />
                    </svg>
                 </div>
               ) : (
                 <button 
                   onClick={() => setShowMobileDrawer(true)}
                   className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer mr-1"
                 >
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                     <line x1="4" x2="20" y1="12" y2="12" />
                     <line x1="4" x2="20" y1="6" y2="6" />
                     <line x1="4" x2="20" y1="18" y2="18" />
                   </svg>
                 </button>
               )}
   
               <Link to="/dashboard" className="flex items-center gap-2">
                 {!logoError ? (
                   <img 
                     src={logoUrl} 
                     alt="MyFastHR Logo" 
                     style={{ height: `${logoHeight || 36}px` }}
                     className="w-auto object-contain max-w-[180px] select-none pointer-events-none" 
                     onError={() => setLogoError(true)}
                   />
                 ) : (
                   <div className="flex items-center gap-2">
                     <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 italic font-black text-xl">
                       {appName?.substring(0, 1) || 'F'}
                     </div>
                     <span className="text-sm font-extrabold text-slate-800 tracking-tight hidden sm:inline-block">{appName}</span>
                   </div>
                 )}
               </Link>

             {/* Animated App Menu */}
             <AnimatePresence>
               {showAppMenu && (
                 <motion.div 
                    initial={{ opacity: 0, y: 5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-16 -left-4 w-72 bg-white rounded-[24px] shadow-2xl border border-slate-100 p-3 z-[60]"
                 >
                    <div className="px-3 py-1.5 mb-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Your Apps</span>
                    </div>
                    
                    <div className="space-y-0.5">
                       {menuItems.filter(item => item.visible).map((item, idx) => (
                         <AppMenuItem 
                            key={idx}
                            {...item}
                            active={location.pathname === item.path}
                            onClick={() => setShowAppMenu(false)}
                         />
                       ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between px-3">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${roles[role]?.color || 'bg-indigo-600'}`} />
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                        </div>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">Unite Marketplace</span>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Employee Sub-Nav - Only on Employees Page */}
            {(location.pathname.includes('/employees') || location.pathname.includes('/admin/employees')) && role !== 'employee' && (
              <div className="hidden lg:flex items-center gap-6 ml-8 border-l border-slate-100 pl-8">
                <Link 
                    to="/employees/overview" 
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        location.pathname === '/employees/overview' 
                        ? 'bg-[#E6FFFA] text-[#319795] shadow-sm border border-[#B2F5EA]' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Overview
                </Link>
                <Link 
                    to="/employees" 
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        location.pathname === '/employees' 
                        ? 'bg-[#E6FFFA] text-[#319795] shadow-sm border border-[#B2F5EA]' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Employee
                </Link>
                
                {/* Main Dropdown */}


              <div className="relative group">
                <div className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors py-4">
                    <span className="text-sm font-bold">Main</span>
                    <ChevronDown size={14} className="text-slate-400 mt-0.5 group-hover:text-slate-600 transition-colors" />
                </div>
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70] translate-y-2 group-hover:translate-y-0">
                  <Link to="/employees/onboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Plus size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Add Employee</span>
                      <span className="text-[10px] text-slate-400">Register new team member</span>
                    </div>
                  </Link>
                  <Link to="/employees/analytics" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <TrendingUp size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Analytics Hub</span>
                      <span className="text-[10px] text-slate-400">View workforce analytics</span>
                    </div>
                  </Link>

                  <Link to="/employees/org-chart" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Network size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Organization Chart</span>
                      <span className="text-[10px] text-slate-400">Visualize team hierarchy</span>
                    </div>
                  </Link>

                </div>
              </div>

              {/* Admin Dropdown */}
              <div className="relative group">
                <div className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors py-4">
                    <span className="text-sm font-bold">Admin</span>
                    <ChevronDown size={14} className="text-slate-400 mt-0.5 group-hover:text-slate-600 transition-colors" />
                </div>
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70] translate-y-2 group-hover:translate-y-0">
                  <Link to="/admin/letters/generate" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <FileText size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Generate Letter</span>
                      <span className="text-[10px] text-slate-400">Create official letters</span>
                    </div>
                  </Link>
                  <Link to="/admin/documents/bulk-upload" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Upload size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Bulk Documents upload</span>
                      <span className="text-[10px] text-slate-400">Upload multiple files</span>
                    </div>
                  </Link>
                  <Link to="/admin/documents/vault" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Database size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Document Vault</span>
                      <span className="text-[10px] text-slate-400">Store employee records</span>
                    </div>
                  </Link>
                  <Link to="/admin/letters/generate?open=new-template" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Sparkles size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Letter Templates</span>
                      <span className="text-[10px] text-slate-400">Manage document templates</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {location.pathname.includes('/leaves') && role !== 'employee' && (
            <div className="hidden lg:flex items-center gap-6 ml-8 border-l border-slate-100 pl-8">
              <Link 
                  to="/leaves/overview" 
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      location.pathname === '/leaves/overview'
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                  Overview
              </Link>
              <Link 
                  to="/leaves/employee-records" 
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      location.pathname === '/leaves/employee-records' || location.pathname === '/leaves'
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                  Employee Leave
              </Link>
              
              {/* Main Dropdown */}
              <div className="relative group">
                <div className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors py-4">
                    <span className="text-sm font-bold">Main</span>
                    <ChevronDown size={14} className="text-slate-400 mt-0.5 group-hover:text-slate-600 transition-colors" />
                </div>
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70] translate-y-2 group-hover:translate-y-0">
                  <Link to="/leaves/attendance-overview" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Users size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Attendance Overview</span>
                      <span className="text-[10px] text-slate-400">Daily Attendance</span>
                    </div>
                  </Link>
                  <Link to="/leaves/calendar" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Calendar size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Leave Calendar</span>
                      <span className="text-[10px] text-slate-400">Company Leave Calendar</span>
                    </div>
                  </Link>
                  <Link to="/leaves/who-is-in" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <UserCheck size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Who is in?</span>
                      <span className="text-[10px] text-slate-400">Who's Online</span>
                    </div>
                  </Link>
                  <Link to="/leaves/employee-records" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <FileText size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Employee Leave</span>
                      <span className="text-[10px] text-slate-400">Employee Leave Balance</span>
                    </div>
                  </Link>
                  <Link to="/leaves/shift-roaster" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <Calendar size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Shift Roaster</span>
                      <span className="text-[10px] text-slate-400">Shift Management</span>
                    </div>
                  </Link>
                  <Link to="/leaves/attendance-muster" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <FileText size={16} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Attendance Muster</span>
                      <span className="text-[10px] text-slate-400">Monthly Attendance Sheet</span>
                    </div>
                  </Link>
                  <Link to="/leaves/regularizations" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Regularization Approvals</span>
                      <span className="text-[10px] text-slate-400">Review attendance corrections</span>
                    </div>
                  </Link>
                </div>
              </div>


              {/* Admin Dropdown */}
              {role !== 'employee' && (
                <div className="relative group">
                  <div className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors py-4">
                      <span className="text-sm font-bold">Admin</span>
                      <ChevronDown size={14} className="text-slate-400 mt-0.5 group-hover:text-slate-600 transition-colors" />
                  </div>
                  <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70] translate-y-2 group-hover:translate-y-0">
                    <Link to="/leaves/granter" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <UserCheck size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Leave Granter</span>
                        <span className="text-[10px] text-slate-400">Manage leave assignments</span>
                      </div>
                    </Link>
                    <Link to="/leaves/assign-scheme" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <Shield size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Assign Attendance Rules</span>
                        <span className="text-[10px] text-slate-400">Assign policies to employees</span>
                      </div>
                    </Link>
                    <Link to="/leaves/manual-override" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <History size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Manual Override</span>
                        <span className="text-[10px] text-slate-400">Update attendance manually</span>
                      </div>
                    </Link>
                    <Link to="/leaves/attendance-muster?tab=entry_requests" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <CheckCircle2 size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Entry/Exit Approvals</span>
                        <span className="text-[10px] text-slate-400">Approve regularization requests</span>
                      </div>
                    </Link>
                    <Link to="/leaves/shift-override" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <Clock size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Shift Override</span>
                        <span className="text-[10px] text-slate-400">Assign customized shifts</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}


              {/* Setup Dropdown */}
              {role !== 'employee' && (
                <div className="relative group">
                  <div className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors py-4">
                      <span className="text-sm font-bold">Setup</span>
                      <ChevronDown size={14} className="text-slate-400 mt-0.5 group-hover:text-slate-600 transition-colors" />
                  </div>
                  <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70] translate-y-2 group-hover:translate-y-0">
                    <Link to="/leaves/holidays" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <Calendar size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Holiday List</span>
                        <span className="text-[10px] text-slate-400">Manage company holidays</span>
                      </div>
                    </Link>
                    <Link to="/leaves/weekend-override" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <Calendar size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Weekend Override</span>
                        <span className="text-[10px] text-slate-400">Update weekend configurations</span>
                      </div>
                    </Link>
                    <Link to="/leaves/employee-records" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all">
                      <Users size={16} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Employee Leave Records</span>
                        <span className="text-[10px] text-slate-400">Track historical leave records</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Payroll Sub-Nav */}
          {location.pathname.includes('/payroll') && role !== 'employee' && (
            <div className="hidden lg:flex items-center gap-1 ml-6 border-l border-slate-100 pl-6">
              {(() => {
                const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';
                const dropdownActive = ['register', 'inputs', 'separations'].includes(currentTab);
                
                let activeLabel = 'Payroll Sheets & FNF';
                if (currentTab === 'register') activeLabel = 'Pay Register';
                if (currentTab === 'inputs') activeLabel = 'Payroll Inputs';
                if (currentTab === 'separations') activeLabel = 'Separations';

                return (
                  <>
                    {/* Overview Tab */}
                    <Link
                      to="/payroll?tab=overview"
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentTab === 'overview'
                          ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <TrendingUp size={13} className={currentTab === 'overview' ? 'text-indigo-500' : 'text-slate-400'} />
                      Overview
                    </Link>

                    {/* Payroll Sheets & FNF Dropdown Tab */}
                    <div className="relative">
                      <button
                        onClick={() => setPayrollDropdownOpen(!payrollDropdownOpen)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                          dropdownActive
                            ? 'bg-indigo-50 text-indigo-600 shadow-sm border-indigo-100'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent'
                        }`}
                      >
                        <Coins size={13} className={dropdownActive ? 'text-indigo-500' : 'text-slate-400'} />
                        <span>{activeLabel}</span>
                        <ChevronDown size={11} className={`transition-transform duration-200 ${payrollDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {payrollDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setPayrollDropdownOpen(false)} />
                          <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                            <Link
                              to="/payroll?tab=register"
                              onClick={() => setPayrollDropdownOpen(false)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                currentTab === 'register'
                                  ? 'bg-indigo-50/70 text-indigo-600'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <Coins size={12} className={currentTab === 'register' ? 'text-indigo-500' : 'text-slate-400'} />
                              Pay Register
                            </Link>
                            <Link
                              to="/payroll?tab=inputs"
                              onClick={() => setPayrollDropdownOpen(false)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                currentTab === 'inputs'
                                  ? 'bg-indigo-50/70 text-indigo-600'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <FileText size={12} className={currentTab === 'inputs' ? 'text-indigo-500' : 'text-slate-400'} />
                              Payroll Inputs
                            </Link>
                            <Link
                              to="/payroll?tab=separations"
                              onClick={() => setPayrollDropdownOpen(false)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                currentTab === 'separations'
                                  ? 'bg-indigo-50/70 text-indigo-600'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <UserMinus size={12} className={currentTab === 'separations' ? 'text-indigo-500' : 'text-slate-400'} />
                              Separations & FNF
                            </Link>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Statutory Tab */}
                    <Link
                      to="/payroll?tab=global-rules"
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentTab === 'global-rules'
                          ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Calculator size={13} className={currentTab === 'global-rules' ? 'text-indigo-500' : 'text-slate-400'} />
                      Statutory
                    </Link>

                    {/* Loans Tab */}
                    <Link
                      to="/payroll?tab=loans"
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentTab === 'loans'
                          ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Coins size={13} className={currentTab === 'loans' ? 'text-indigo-500' : 'text-slate-400'} />
                      Loans
                    </Link>
                  </>
                );
              })()}
            </div>
          )}
        </div>







          {/* Search Bar - Desktop */}
          {role !== 'employee' && (
            <div className="hidden xl:flex flex-1 max-w-xs xl:max-w-md mx-4 xl:mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search metrics, employees, or modules... (Ctrl + K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none"
                />
                
                <AnimatePresence>
                  {searchQuery.trim() !== '' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-14 left-0 right-0 bg-white rounded-[24px] shadow-2xl border border-slate-100 p-2 z-[70] overflow-hidden"
                    >
                      {filteredItems.length > 0 ? (
                        <div className="space-y-0.5">
                          {filteredItems.map((item, idx) => (
                            <AppMenuItem 
                              key={idx}
                              {...item}
                              active={location.pathname === item.path}
                              onClick={() => setSearchQuery('')}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No matches found</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {role === 'super_admin' && (
              <button
                onClick={() => {
                  const newMode = superAdminViewMode === 'platform' ? 'tenant' : 'platform';
                  localStorage.setItem('super_admin_view_mode', newMode);
                  setSuperAdminViewMode(newMode);
                  navigate('/dashboard');
                  window.location.reload();
                }}
                className="px-4.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 border border-indigo-100/50"
              >
                <Shield size={14} />
                <span>{superAdminViewMode === 'platform' ? 'Switch to Tenant View' : 'Switch to Platform View'}</span>
              </button>
            )}
              <div className="relative">
                  <div 
                    onMouseEnter={() => setShowNotifications(true)}
                    onMouseLeave={() => setShowNotifications(false)}
                    className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                      <Bell size={20} />
                      {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">{unreadCount}</span>}

                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden z-[100]"
                          >
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Notifications</h3>
                                <button onClick={markAllRead} className="text-[9px] font-bold text-indigo-600 hover:underline">Clear All</button>
                            </div>
                            <div className="max-h-[320px] overflow-y-auto">
                                {notifications.length > 0 ? notifications.map((notif) => (
                                  <div key={notif.id} onClick={() => {
                                    markRead(notif.id);
                                    if (notif.type === 'leave' || (notif.title && notif.title.toLowerCase().includes('leave')) || (notif.message && notif.message.toLowerCase().includes('leave'))) {
                                      navigate('/leaves/employee-records');
                                    }
                                  }} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-indigo-50/20' : ''}`}>
                                      <div className="flex items-center justify-between mb-1">
                                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(notif.created_at).toLocaleTimeString()}</span>
                                          {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                      </div>
                                      <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-snug">{notif.title}</h4>
                                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                                  </div>
                                )) : (
                                  <div className="p-10 text-center">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No New Notifications</p>
                                  </div>
                                )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
              </div>

              {/* Settings/Profile Dropdown */}
              <div className="relative">
                  <button 
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showSettingsMenu ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-slate-300'}`}
                  >
                      {role === 'employee' ? (
                        <UserCircle size={18} className={showSettingsMenu ? 'text-indigo-600' : 'text-slate-500'} />
                      ) : (
                        <Settings size={18} className={showSettingsMenu ? 'animate-spin-slow text-indigo-600' : 'text-slate-400'} />
                      )}
                      <ChevronDown size={14} className={`transition-transform duration-300 ${showSettingsMenu ? 'rotate-180' : ''}`} />
                  </button>
 
                  <AnimatePresence>
                    {showSettingsMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute -right-2 mt-4 w-52 bg-white rounded-[20px] shadow-2xl border border-slate-100 p-2 z-[100]"
                      >
                          <div className="space-y-0.5">
                            {role === 'employee' ? (
                              <>
                                <SettingsMenuItem icon={UserCircle} label="My Profile" path="/profile" onClick={() => setShowSettingsMenu(false)} />
                                <SettingsMenuItem icon={Calendar} label="My Leaves" path="/leaves" onClick={() => setShowSettingsMenu(false)} />
                                <SettingsMenuItem icon={FileText} label="My Payslips" path="/payslips" onClick={() => setShowSettingsMenu(false)} />
                                <SettingsMenuItem icon={Clock} label="Attendance Logs" path="/attendance" onClick={() => setShowSettingsMenu(false)} />
                                <SettingsMenuItem icon={Network} label="Organization Chart" path="/employees/org-chart" onClick={() => setShowSettingsMenu(false)} />
                              </>
                            ) : (
                              <>
                                <SettingsMenuItem icon={UserCircle} label="My profile" path="/profile" onClick={() => setShowSettingsMenu(false)} />
                                <SettingsMenuItem icon={Settings} label="Settings" path="/settings" onClick={() => setShowSettingsMenu(false)} />
                                {role === 'super_admin' && (
                                  <SettingsMenuItem icon={Building2} label="Super Admin Portal" path="/admin/companies" onClick={() => setShowSettingsMenu(false)} />
                                )}
                                <SettingsMenuItem icon={Shield} label="Security" path="/admin/compliance" onClick={() => setShowSettingsMenu(false)} />
                              </>
                            )}
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
              
              <button className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all ml-1" onClick={() => { 
                  const prevRole = localStorage.getItem('user_role');
                  localStorage.clear(); 
                  window.location.href = prevRole === 'employee' ? '/employee' : '/login'; 
              }}>
                  <Power size={20} />
              </button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Sub-Navigation Bar — visible below lg breakpoint */}
      {role !== 'employee' && (
        <>
          {/* Payroll Mobile Sub-Nav */}
          {location.pathname.includes('/payroll') && (
            <div className="lg:hidden z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm overflow-visible">
              <div className="flex items-center gap-1.5 px-3 py-2 overflow-visible">
                {(() => {
                  const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';
                  const dropdownActive = ['register', 'inputs', 'separations'].includes(currentTab);

                  return (
                    <>
                      {/* Overview Tab */}
                      <Link
                        to="/payroll?tab=overview"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                          currentTab === 'overview'
                             ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                             : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <TrendingUp size={13} className={currentTab === 'overview' ? 'text-indigo-500' : 'text-slate-400'} />
                        Overview
                      </Link>

                      {/* Dropdown Select on Mobile */}
                      <div className="relative shrink-0 select-none">
                        <select
                          value={['register', 'inputs', 'separations'].includes(currentTab) ? currentTab : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              window.location.href = `/payroll?tab=${e.target.value}`;
                            }
                          }}
                          className={`appearance-none bg-transparent pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer ${
                            dropdownActive
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm'
                              : 'text-slate-500 border-transparent hover:text-slate-800'
                          }`}
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                            backgroundPosition: 'right 0.5rem center', 
                            backgroundSize: '1.25em 1.25em', 
                            backgroundRepeat: 'no-repeat' 
                          }}
                        >
                          <option value="" disabled className="text-slate-400 bg-white">Sheets & FNF</option>
                          <option value="register" className="text-slate-800 bg-white">Pay Register</option>
                          <option value="inputs" className="text-slate-800 bg-white">Payroll Inputs</option>
                          <option value="separations" className="text-slate-800 bg-white">Separations</option>
                        </select>
                      </div>

                      {/* Statutory Tab */}
                      <Link
                        to="/payroll?tab=global-rules"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                          currentTab === 'global-rules'
                             ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                             : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <Calculator size={13} className={currentTab === 'global-rules' ? 'text-indigo-500' : 'text-slate-400'} />
                        Statutory
                      </Link>

                      {/* Loans Tab */}
                      <Link
                        to="/payroll?tab=loans"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                          currentTab === 'loans'
                             ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                             : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <Coins size={13} className={currentTab === 'loans' ? 'text-indigo-500' : 'text-slate-400'} />
                        Loans
                      </Link>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Employee Mobile Sub-Nav */}
          {(location.pathname.includes('/employees') || location.pathname.includes('/admin/employees')) && (
            <div className="lg:hidden z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
              <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
                {[
                  { label: 'Overview', path: '/employees/overview' },
                  { label: 'Employee', path: '/employees' },
                  { label: 'Add Employee', path: '/employees/onboard' },
                  { label: 'Analytics', path: '/employees/analytics' },
                  { label: 'Org Chart', path: '/employees/org-chart' },
                  { label: 'Letters', path: '/admin/letters/generate' },
                  { label: 'Documents', path: '/admin/documents/vault' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      location.pathname === item.path
                        ? 'bg-[#E6FFFA] text-[#319795] shadow-sm border border-[#B2F5EA]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Leave Mobile Sub-Nav */}
          {location.pathname.includes('/leaves') && role !== 'employee' && (
            <div className="lg:hidden z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
              <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
                {[
                  { label: 'Overview', path: '/leaves/overview' },
                  { label: 'Employee Leave', path: '/leaves/employee-records', altPath: '/leaves' },
                  { label: 'Attendance', path: '/leaves/attendance-overview' },
                  { label: 'Regularizations', path: '/leaves/regularizations' },
                  { label: 'Calendar', path: '/leaves/calendar' },
                  { label: "Who's In", path: '/leaves/who-is-in' },
                  { label: 'Shift Roaster', path: '/leaves/shift-roaster' },
                  { label: 'Muster', path: '/leaves/attendance-muster' },
                  { label: 'Holidays', path: '/leaves/holidays' },
                ].map((item) => {
                  const isActive = location.pathname === item.path || (item.altPath && location.pathname === item.altPath);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden relative">
        {/* Left Sidebar for Employee (Desktop/Laptop) */}
        {role === 'employee' && (
          <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 shrink-0 p-4 pt-6 justify-between">
            <div className="flex flex-col gap-6">
              {/* Mini Profile Summary */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                  {userMetrics?.employee_name ? userMetrics.employee_name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate uppercase leading-none mb-1">
                    {userMetrics?.employee_name || 'Employee'}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee Portal</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-1">
                {[
                  { icon: Home, label: "Dashboard", path: "/dashboard", color: "bg-fuchsia-50", iconColor: "text-fuchsia-500", visible: true },
                  { icon: Calendar, label: "Leaves", path: "/leaves", color: "bg-rose-50", iconColor: "text-rose-500", matchPrefix: true, visible: true },
                  { icon: FileText, label: "Payslips", path: "/payslips", color: "bg-emerald-50", iconColor: "text-emerald-500", visible: enabledFeatures.includes('payroll') },
                  { icon: Clock, label: "Attendance Logs", path: "/attendance", color: "bg-blue-50", iconColor: "text-blue-500", visible: true },
                  { icon: Network, label: "Org Chart", path: "/employees/org-chart", color: "bg-orange-50", iconColor: "text-orange-500", visible: true },
                  { icon: UserCircle, label: "Profile", path: "/profile", color: "bg-indigo-50", iconColor: "text-indigo-500", visible: true }
                ].filter(item => item.visible).map((item, idx) => {
                  const isActive = item.matchPrefix 
                    ? location.pathname.startsWith(item.path) 
                    : location.pathname === item.path;
                  return (
                    <SidebarMenuItem 
                      key={idx}
                      {...item}
                      active={isActive}
                    />
                  );
                })}
              </div>
            </div>

            {/* Current Shift bottom block */}
            <div className="mt-auto">
              <div className="bg-indigo-50/30 border border-indigo-100/30 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Current Shift</p>
                <p className="text-xs font-black text-slate-700">
                  {userMetrics?.shift_start || '10:00'} - {userMetrics?.shift_end || '18:00'}
                </p>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-24 lg:pb-0">
          <div className="max-w-[1600px] mx-auto w-full min-h-full">
            {subscriptionStatus === 'trial' && (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-2.5 flex items-center justify-between text-white animate-in slide-in-from-top duration-700">
                 <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-1.5 rounded-lg border border-white/30">
                       <Sparkles size={14} className="text-white animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                       Free Trial: <span className="text-indigo-200">14 Days Remaining</span>
                    </p>
                 </div>
                 <button className="text-[8px] font-black uppercase tracking-widest bg-white text-indigo-600 px-4 py-1.5 rounded-full hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
                   Upgrade Plan
                 </button>
              </div>
            )}
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        {(() => {
          return (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-slate-100 flex items-center justify-around px-2 z-[100] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
              {role === 'employee' ? (
                <>
                  <MobileNavItem icon={Home} label="Dashboard" path="/dashboard" active={location.pathname === '/dashboard'} />
                  <MobileNavItem icon={Calendar} label="Leaves" path="/leaves" active={location.pathname.startsWith('/leaves')} />
                  <MobileNavItem icon={Clock} label="Attendance" path="/attendance" active={location.pathname === '/attendance'} />
                  <MobileNavItem icon={FileText} label="Payslips" path="/payslips" active={location.pathname === '/payslips'} />
                  <MobileNavItem icon={UserCircle} label="Profile" path="/profile" active={location.pathname === '/profile'} />
                </>
              ) : (
                <>
                  <MobileNavItem icon={Home} label="Home" path="/dashboard" active={location.pathname === '/dashboard'} />
                  <MobileNavItem icon={Clock} label="Attendance" path="/attendance" active={location.pathname === '/attendance'} />
                  <MobileNavItem icon={Calendar} label="Leaves" path="/leaves" active={location.pathname === '/leaves'} />
                  <MobileNavItem icon={UserCircle} label="Profile" path="/profile" active={location.pathname === '/profile'} />
                </>
              )}
            </nav>
          );
        })()}
        </div>
      </div>
      
      {/* Mobile Drawer Slide-over */}
      <AnimatePresence>
        {showMobileDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileDrawer(false)}
              className="fixed inset-0 bg-black z-[120] lg:hidden"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] max-w-[85vw] bg-white z-[130] shadow-2xl flex flex-col p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <Link to="/dashboard" className="flex items-center gap-2">
                  {!logoError ? (
                    <img 
                      src={logoUrl} 
                      alt="MyFastHR Logo" 
                      style={{ height: `${logoHeight || 36}px` }}
                      className="w-auto object-contain max-w-[180px] select-none pointer-events-none" 
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 italic font-black text-xl">
                        {appName?.substring(0, 1) || 'F'}
                      </div>
                      <span className="text-sm font-extrabold text-slate-800 tracking-tight">{appName}</span>
                    </div>
                  )}
                </Link>
                <button 
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Section in Drawer */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {userMetrics?.employee_name ? userMetrics.employee_name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate uppercase leading-none mb-1">
                    {userMetrics?.employee_name || 'Employee'}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Portal</span>
                </div>
              </div>

              {/* Nav Links */}
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                {[
                  { icon: Home, label: "Dashboard", path: "/dashboard", color: "bg-fuchsia-50", iconColor: "text-fuchsia-500", visible: true },
                  { icon: Calendar, label: "Leaves", path: "/leaves", color: "bg-rose-50", iconColor: "text-rose-500", visible: true },
                  { icon: FileText, label: "Payslips", path: "/payslips", color: "bg-emerald-50", iconColor: "text-emerald-500", visible: enabledFeatures.includes('payroll') },
                  { icon: Clock, label: "Attendance Logs", path: "/attendance", color: "bg-blue-50", iconColor: "text-blue-500", visible: true },
                  { icon: Network, label: "Org Chart", path: "/employees/org-chart", color: "bg-orange-50", iconColor: "text-orange-500", visible: true },
                  { icon: UserCircle, label: "Profile", path: "/profile", color: "bg-indigo-50", iconColor: "text-indigo-500", visible: true }
                ].filter(item => item.visible).map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setShowMobileDrawer(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      location.pathname === item.path 
                        ? 'bg-indigo-50/70 border border-indigo-100/50' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon size={18} className={item.iconColor} />
                    </div>
                    <span className={`text-sm font-bold ${location.pathname === item.path ? 'text-indigo-600' : 'text-slate-600'}`}>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Footer / Sign Out */}
              <div className="mt-auto pt-6 border-t border-slate-100">
                <button 
                  onClick={() => {
                    const prevRole = localStorage.getItem('user_role');
                    localStorage.clear(); 
                    window.location.href = prevRole === 'employee' ? '/employee' : '/login'; 
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                    <Power size={18} />
                  </div>
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DeleteSecurityModal 
          isOpen={globalDeleteChallenge.isOpen}
          url={globalDeleteChallenge.url}
          onClose={() => {
              if (globalDeleteChallenge.reject) {
                  globalDeleteChallenge.reject(new Error('Deletion cancelled by user.'));
              }
              setGlobalDeleteChallenge({ isOpen: false, resolve: null, reject: null });
          }}
          onConfirm={(verifiedPin) => {
              if (globalDeleteChallenge.resolve) {
                  globalDeleteChallenge.resolve(verifiedPin);
              }
              setGlobalDeleteChallenge({ isOpen: false, resolve: null, reject: null });
          }}
          title="Security Verification Required"
          message="This action requires security clearance. Please enter the 6-digit delete security code to complete this deletion."
      />

      {/* Global Custom Confirm Modal */}
      {customConfirm.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-outfit">
          <div className="relative w-full max-w-md bg-white border-2 border-black rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b-2 border-black bg-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
                  <Shield size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">{customConfirm.title}</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-100 px-2 py-0.5 rounded-full">Confirmation Required</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  customConfirm.resolve(false);
                  setCustomConfirm({ isOpen: false, title: '', message: '', resolve: null });
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-black hover:bg-slate-50 transition-colors"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm font-bold text-slate-500 leading-relaxed text-center">
                {customConfirm.message}
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    customConfirm.resolve(false);
                    setCustomConfirm({ isOpen: false, title: '', message: '', resolve: null });
                  }}
                  className="flex-1 py-3 border-2 border-black hover:bg-slate-50 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    customConfirm.resolve(true);
                    setCustomConfirm({ isOpen: false, title: '', message: '', resolve: null });
                  }}
                  className="flex-1 py-3 bg-black hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Custom Alert Modal */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-outfit">
          <div className="relative w-full max-w-md bg-white border-2 border-black rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b-2 border-black bg-rose-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600">
                  <Shield size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">{customAlert.title}</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">System Alert</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  customAlert.resolve();
                  setCustomAlert({ isOpen: false, title: '', message: '', resolve: null });
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-black hover:bg-slate-50 transition-colors"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm font-bold text-slate-500 leading-relaxed text-center">
                {customAlert.message}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    customAlert.resolve();
                    setCustomAlert({ isOpen: false, title: '', message: '', resolve: null });
                  }}
                  className="w-full py-3 bg-black hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MobileNavItem = ({ icon: Icon, label, path, active, disabled = false }) => {
  if (disabled) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-slate-400">
        <Icon size={20} />
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
    );
  }
  return (
    <Link to={path} className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${active ? 'text-indigo-600 font-bold scale-110' : 'text-slate-400 font-medium'}`}>
      <Icon size={20} className={active ? 'text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''} />
      <span className="text-[9px] uppercase tracking-wider">{label}</span>
    </Link>
  );
};


export default AppShell;
