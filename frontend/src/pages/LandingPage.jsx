import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, FileText, Clock, ShieldCheck, 
  HelpCircle, ChevronRight, Check, ArrowRight, MessageSquare 
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('INR'); // INR or USD
  const [themeColor, setThemeColor] = useState('#7A3F91');
  const [themeBg, setThemeBg] = useState('#F2EAF7');
  
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);

  // States for ROI simulator
  const [roiEmployees, setRoiEmployees] = useState(45);
  const [roiSalary, setRoiSalary] = useState(32000);

  // States for live telemetry console
  const [telemetryLogs, setTelemetryLogs] = useState([
    { id: 1, node: 'Jaipur Node', text: 'Telemetry check: 240 active agents, secure node verified.', status: 'OK' },
    { id: 2, node: 'Mumbai Vault', text: 'ESIC compliance ledger updated for First Attempt Skills Training.', status: 'SYNC' },
    { id: 3, node: 'Delhi Sandbox', text: 'Isolated database container #18 synced successfully.', status: 'READY' }
  ]);
  const [nodePings, setNodePings] = useState({ jaipur: 12, mumbai: 24, delhi: 18 });


  // Auto-redirect authenticated users directly to dashboard & load branding
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }

    const loadBranding = async () => {
      try {
        const branding = await fetchBranding();
        if (branding) {
          if (branding.logo_url) {
            setLogoUrl(getAssetUrl(branding.logo_url));
            setLogoError(false);
          }
          if (branding.logo_height) {
            setLogoHeight(parseInt(branding.logo_height));
          }
          if (branding.app_name) {
            setAppName(branding.app_name);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic branding:', err);
      }
    };
    loadBranding();
  }, [navigate]);

  // Scroll Reveal Observer for entry/exit animations on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.05,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        } else {
          entry.target.classList.remove('revealed');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Telemetry loop effect
  useEffect(() => {
    const logPool = [
      { node: 'Jaipur Node', text: 'Rahul A. punched biometric in [Jaipur Hub]. Log ID: #4829', status: 'IN' },
      { node: 'Mumbai Vault', text: 'Secured document KYC approval request generated for Priya S.', status: 'KYC' },
      { node: 'Delhi Sandbox', text: 'Auto-calculation check: Provident Fund ledger reconciled.', status: 'CALC' },
      { node: 'Jaipur Node', text: 'Telemetry sync: Biometric machine #3 connected.', status: 'OK' },
      { node: 'Mumbai Vault', text: 'Isolated node backup complete. 0 errors detected.', status: 'OK' },
      { node: 'Delhi Sandbox', text: 'Impersonation session token audited for Super Admin.', status: 'AUDIT' },
      { node: 'Jaipur Node', text: 'Payslip PDF generated for employee #1059.', status: 'PDF' }
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      setTelemetryLogs(prev => [
        ...prev.slice(-3),
        { id: Date.now(), ...randomLog }
      ]);

      setNodePings({
        jaipur: Math.max(8, Math.min(25, 12 + Math.floor(Math.random() * 7 - 3))),
        mumbai: Math.max(18, Math.min(45, 24 + Math.floor(Math.random() * 9 - 4))),
        delhi: Math.max(12, Math.min(35, 18 + Math.floor(Math.random() * 7 - 3)))
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);


  const pricing = {
    INR: { Starter: '₹4,100', Growth: '₹8,200', Enterprise: '₹20,500', suffix: '/mo' },
    USD: { Starter: '$49', Growth: '$99', Enterprise: '$249', suffix: '/mo' }
  };

  return (
    <div className="landing-body min-h-screen flex flex-col font-sans relative">
      {/* Decorative Blur Backdrops */}
      <div className="bg-mesh" />
      <div className="bg-mesh-right" />

      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-50 bg-[#F2EAF7]/85 backdrop-blur-md border-b-[3.5px] border-[#2B0D3E] px-6 h-[72px] flex items-center animate-fade-in-up">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          {/* Logo with mobile responsive menu */}
          <GlobalHeaderMenu 
            logoUrl={logoUrl}
            appName={appName}
            logoHeight={logoHeight}
            logoError={logoError}
            setLogoError={setLogoError}
          />

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-bold text-[#2B0D3E]">
            <button onClick={() => navigate('/')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">Home</button>
            <button onClick={() => navigate('/features')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">Features</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">Pricing</button>
            <button onClick={() => navigate('/support')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">Support</button>
            <button onClick={() => navigate('/infrastructure')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">Infra</button>
            <button onClick={() => navigate('/blog')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">Blog</button>
            <button onClick={() => navigate('/about')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">About</button>
            <button onClick={() => navigate('/case-studies')} className="hover:text-[#7A3F91] transition-colors font-bold text-sm bg-transparent border-none outline-none cursor-pointer">Case Studies</button>
          </nav>

          {/* Auth Portals Links */}
          <div className="flex items-center gap-4">
            {/* Desktop View Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => navigate('/book-demo')}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] border-[2.5px] border-[#2B0D3E] bg-[#C59DD9]/40 hover:bg-[#C59DD9]/70 transition-all active:scale-95 shadow-[2px_2px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              >
                Book Demo
              </button>
              <button 
                onClick={() => navigate('/employee')}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] border-[2.5px] border-[#2B0D3E] bg-white hover:bg-[#C59DD9]/20 transition-all active:scale-95 shadow-[2px_2px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              >
                Employee Login
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-white bg-[#7A3F91] border-[2.5px] border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#2B0D3E] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                Admin Portal
              </button>
            </div>

            {/* Mobile View Three-Dot Dropdown */}
            <MobileAuthDropdown />
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative px-6 py-10 lg:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Texts */}
          <div className="lg:col-span-6 space-y-7 text-left reveal-on-scroll reveal-left">
            <h1 className="text-5xl sm:text-7xl font-black text-[#2B0D3E] font-outfit leading-[1.05] tracking-tight">
              <span className="block">Simplify Workforce</span>
              <span className="block text-[#7A3F91] underline decoration-[#C59DD9] decoration-[6px] decoration-wavy underline-offset-[8px]">
                Automate Payroll.
              </span>
            </h1>
            <p className="text-lg sm:text-xl font-bold text-[#2B0D3E]/80 leading-relaxed max-w-xl reveal-on-scroll reveal-left reveal-delay-100">
              Manage employee logs, dynamic leave workflows, biometric check-ins, statutory rules, and multi-tenant ledger accounts in one high-performance portal.
            </p>
            
            {/* Quick entry portal buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 reveal-on-scroll reveal-left reveal-delay-200">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 brutalist-btn text-sm rounded-2xl flex items-center justify-center gap-2 group"
              >
                Launch Admin Console
                <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/employee')}
                className="px-8 py-4 brutalist-btn-secondary text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                Access Employee Desk
              </button>
            </div>
          </div>

          {/* Right Hero Graphic: Claymorphic Brutalist mock-up tablet */}
          <div className="lg:col-span-6 flex justify-center relative reveal-on-scroll reveal-right reveal-delay-200">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#C59DD9]/30 to-[#7A3F91]/20 rounded-[40px] filter blur-xl opacity-70 float-animation pointer-events-none" />
            
            <div className="w-full max-w-lg brutalist-box rounded-[32px] p-6 bg-white float-animation relative">
              {/* Tablet Header Bar */}
              <div className="flex justify-between items-center border-b-[3px] border-[#2B0D3E] pb-4 mb-6">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#2B0D3E]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#7A3F91]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#C59DD9]" />
                </div>
                <span className="text-[10px] font-black uppercase text-[#2B0D3E]/60 tracking-widest font-outfit">MyFastHR Mainframe Preview</span>
              </div>

              {/* Mock Dashboard Content */}
              <div className="space-y-5 text-left">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    style={{ backgroundColor: themeBg }}
                    className="p-4 border-[2.5px] border-[#2B0D3E] rounded-2xl shadow-[4px_4px_0px_0px_#2B0D3E] hover:scale-105 transition-transform"
                  >
                    <span 
                      style={{ color: themeColor }}
                      className="text-[9px] font-black uppercase tracking-wider block"
                    >
                      Global Workforce
                    </span>
                    <span className="text-2xl font-black text-[#2B0D3E] font-outfit">240 Active</span>
                  </div>
                  <div 
                    style={{ backgroundColor: themeBg }}
                    className="p-4 border-[2.5px] border-[#2B0D3E] rounded-2xl shadow-[4px_4px_0px_0px_#2B0D3E] hover:scale-105 transition-transform"
                  >
                    <span 
                      style={{ color: themeColor }}
                      className="text-[9px] font-black uppercase tracking-wider block"
                    >
                      Payroll Handled
                    </span>
                    <span className="text-xl font-black text-[#2B0D3E] font-outfit">₹4.42 Cr</span>
                  </div>
                </div>

                {/* Progress bar mock */}
                <div className="p-4 bg-white border-[2.5px] border-[#2B0D3E] rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-extrabold text-[#2B0D3E]">
                    <span>KYC Onboarding Compliance</span>
                    <span style={{ color: themeColor }}>85% Verified</span>
                  </div>
                  <div 
                    style={{ backgroundColor: themeBg }}
                    className="w-full h-3 border-[2.5px] border-[#2B0D3E] rounded-full overflow-hidden"
                  >
                    <div 
                      style={{ backgroundColor: themeColor, width: '85%' }}
                      className="h-full" 
                    />
                  </div>
                </div>

                {/* Activity feed list mock */}
                <div className="space-y-2.5">
                  <span className="text-[9px] font-black uppercase text-[#2B0D3E]/50 tracking-widest block">System Telemetry Log</span>
                  <div 
                    style={{ backgroundColor: `${themeBg}80` }}
                    className="flex items-center gap-3 p-3 rounded-xl text-xs font-bold text-[#2B0D3E] hover:translate-x-1 transition-transform"
                  >
                    <Clock size={14} style={{ color: themeColor }} />
                    <span>Rahul A. punched biometric in [Jaipur Hub]</span>
                  </div>
                  <div 
                    style={{ backgroundColor: `${themeBg}80` }}
                    className="flex items-center gap-3 p-3 rounded-xl text-xs font-bold text-[#2B0D3E] hover:translate-x-1 transition-transform"
                  >
                    <FileText size={14} style={{ color: themeColor }} />
                    <span>Payslip distribution compiled successfully for May</span>
                  </div>
                </div>
              </div>

              {/* White-Label Live Theme Selector Controls */}
              <div className="mt-6 pt-4 border-t-[2.5px] border-[#2B0D3E] flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-[#2B0D3E]/60 tracking-wider">Try Live Customization</span>
                <div className="flex gap-2">
                  {[
                    { color: '#7A3F91', bg: '#F2EAF7', label: 'Indigo' },
                    { color: '#A155B9', bg: '#FDF2F8', label: 'Pink' },
                    { color: '#0F766E', bg: '#CCFBF1', label: 'Teal' },
                    { color: '#D97706', bg: '#FEF3C7', label: 'Amber' },
                  ].map(opt => (
                    <button
                      key={opt.color}
                      type="button"
                      onClick={() => {
                        setThemeColor(opt.color);
                        setThemeBg(opt.bg);
                      }}
                      style={{ backgroundColor: opt.color }}
                      className="w-5 h-5 rounded-full border border-black cursor-pointer active:scale-90 transition-transform"
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Logo Marquee (Brutalist Banner) */}
      <section className="bg-[#2B0D3E] py-6 border-t-[3.5px] border-b-[3.5px] border-black overflow-hidden flex items-center">
        <div className="marquee-container w-full">
          <div className="marquee-content text-white font-outfit font-black text-sm uppercase tracking-widest flex items-center">
            <span>🚀 Highway King Enterprises</span>
            <span>•</span>
            <span>💼 First Attempt Skills Training</span>
            <span>•</span>
            <span>🌟 Divyanshu Tech Labs</span>
            <span>•</span>
            <span>⚙️ Jaipur Central biometric Cluster</span>
            <span>•</span>
            <span>🔒 Isolated Sandbox Nodes Active</span>
            <span>•</span>
            <span>💸 ₹4.42 Cr Net Payroll Volume</span>
            <span>•</span>
            {/* Duplicate for infinite loop effect */}
            <span>🚀 Highway King Enterprises</span>
            <span>•</span>
            <span>💼 First Attempt Skills Training</span>
            <span>•</span>
            <span>🌟 Divyanshu Tech Labs</span>
            <span>•</span>
            <span>⚙️ Jaipur Central biometric Cluster</span>
            <span>•</span>
            <span>🔒 Isolated Sandbox Nodes Active</span>
            <span>•</span>
            <span>💸 ₹4.42 Cr Net Payroll Volume</span>
          </div>
        </div>
      </section>

      {/* 3. Features Showcase (Claymorphic Grids) */}
      <section id="features" className="px-6 py-24 bg-white border-b-[3.5px] border-[#2B0D3E]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto reveal-on-scroll reveal-up">
            <span className="text-xs font-black uppercase tracking-widest text-[#7A3F91] bg-[#F2EAF7] px-3 py-1 rounded-full">
              Modules & Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B0D3E] font-outfit tracking-tight">
              Fully Integrated SaaS Infrastructure
            </h2>
            <p className="text-sm sm:text-base font-semibold text-[#2B0D3E]/70 leading-relaxed">
              No spreadsheets, no mismatched logs. Every module works natively on our isolated database clusters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div 
              onClick={() => navigate('/features', { state: { tab: 'workforce' } })}
              className="clay-card-white p-6 space-y-5 flex flex-col text-left reveal-on-scroll reveal-up reveal-delay-100 cursor-pointer hover:scale-[1.03] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F2EAF7] border-[2.5px] border-[#2B0D3E] flex items-center justify-center shadow-[3.5px_3.5px_0px_0px_#2B0D3E] text-[#7A3F91] hover:rotate-6 transition-transform">
                <Users size={22} />
              </div>
              <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">Workforce Registry</h3>
              <p className="text-xs font-medium text-[#2B0D3E]/75 leading-relaxed flex-grow">
                Complete manager-employee reporting chains. Manage departments, dynamic designations, and onboarding pipelines.
              </p>
            </div>

            {/* Feature 2 */}
            <div 
              onClick={() => navigate('/features', { state: { tab: 'payroll' } })}
              className="clay-card-white p-6 space-y-5 flex flex-col text-left reveal-on-scroll reveal-up reveal-delay-200 cursor-pointer hover:scale-[1.03] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F2EAF7] border-[2.5px] border-[#2B0D3E] flex items-center justify-center shadow-[3.5px_3.5px_0px_0px_#2B0D3E] text-[#7A3F91] hover:rotate-6 transition-transform">
                <FileText size={22} />
              </div>
              <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">SaaS Payroll Engine</h3>
              <p className="text-xs font-medium text-[#2B0D3E]/75 leading-relaxed flex-grow">
                Calculate base salaries, allowances, LWF, ESIC, and PF automatically with custom company-wide deduction rules.
              </p>
            </div>

            {/* Feature 3 */}
            <div 
              onClick={() => navigate('/features', { state: { tab: 'attendance' } })}
              className="clay-card-white p-6 space-y-5 flex flex-col text-left reveal-on-scroll reveal-up reveal-delay-300 cursor-pointer hover:scale-[1.03] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F2EAF7] border-[2.5px] border-[#2B0D3E] flex items-center justify-center shadow-[3.5px_3.5px_0px_0px_#2B0D3E] text-[#7A3F91] hover:rotate-6 transition-transform">
                <Clock size={22} />
              </div>
              <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">Live Attendance Muster</h3>
              <p className="text-xs font-medium text-[#2B0D3E]/75 leading-relaxed flex-grow">
                Biometric scanner integrations, mobile apps coordinates logging, shift rosters, and real-time punch feeds.
              </p>
            </div>

            {/* Feature 4 */}
            <div 
              onClick={() => navigate('/features', { state: { tab: 'compliance' } })}
              className="clay-card-white p-6 space-y-5 flex flex-col text-left reveal-on-scroll reveal-up reveal-delay-400 cursor-pointer hover:scale-[1.03] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F2EAF7] border-[2.5px] border-[#2B0D3E] flex items-center justify-center shadow-[3.5px_3.5px_0px_0px_#2B0D3E] text-[#7A3F91] hover:rotate-6 transition-transform">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">Compliance Audit</h3>
              <p className="text-xs font-medium text-[#2B0D3E]/75 leading-relaxed flex-grow">
                Aadhaar card, statutory PAN, and biodata passport checks. Secure document vaults with Super Admin approval screens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Compliance Section */}
      <section id="compliance" className="px-6 py-24 bg-[#F2EAF7] relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 text-left space-y-6 reveal-on-scroll reveal-left">
            <span className="text-xs font-black uppercase tracking-widest text-[#7A3F91] bg-white border border-[#C59DD9] px-3 py-1 rounded-full">
              Enterprise Grade Security
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B0D3E] font-outfit tracking-tight leading-none">
              Statutory KYC & Audit Shield
            </h2>
            <p className="text-sm font-semibold text-[#2B0D3E]/80 leading-relaxed">
              Every tenant database operates on an isolated node framework. Employees upload verified legal documents directly through the secure employee desk, which are checked via our identity validation pipeline before unlocking payroll slots.
            </p>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 text-sm font-bold text-[#2B0D3E] hover:translate-x-1 transition-transform">
                <div className="w-5 h-5 rounded-full bg-[#C59DD9]/30 flex items-center justify-center border border-[#7A3F91]">
                  <Check size={12} className="text-[#7A3F91]" />
                </div>
                <span>End-to-End KYC Approval Workflows</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-[#2B0D3E] hover:translate-x-1 transition-transform">
                <div className="w-5 h-5 rounded-full bg-[#C59DD9]/30 flex items-center justify-center border border-[#7A3F91]">
                  <Check size={12} className="text-[#7A3F91]" />
                </div>
                <span>Encrypted PDF Document Storage Nodes</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-[#2B0D3E] hover:translate-x-1 transition-transform">
                <div className="w-5 h-5 rounded-full bg-[#C59DD9]/30 flex items-center justify-center border border-[#7A3F91]">
                  <Check size={12} className="text-[#7A3F91]" />
                </div>
                <span>Real-Time Admin Impersonation Audit Logs</span>
              </div>
            </div>
          </div>

          {/* Right Image/Clay Card Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 reveal-on-scroll reveal-right reveal-delay-200">
            <div className="clay-card-purple p-6 text-left space-y-4 flex flex-col justify-between h-48 hover:-rotate-1 transition-transform">
              <ShieldCheck size={28} className="float-slow" />
              <div>
                <h4 className="text-base font-black font-outfit">PAN Validation</h4>
                <p className="text-[10px] text-white/80 font-medium mt-1">Automatic verification of employee tax details.</p>
              </div>
            </div>
            <div className="clay-card-white p-6 text-left space-y-4 flex flex-col justify-between h-48 border-[3px] border-[#2B0D3E] shadow-[4px_4px_0px_0px_#2B0D3E] hover:rotate-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-[#F2EAF7] flex items-center justify-center text-[#7A3F91] border-2 border-[#2B0D3E]">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-base font-black text-[#2B0D3E] font-outfit">Aadhaar Verification</h4>
                <p className="text-[10px] text-[#2B0D3E]/70 font-medium mt-1">Direct upload and visual inspection panel.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive ROI & Savings Simulator */}
      <section id="roi-simulator" className="px-6 py-24 bg-white border-t-[3.5px] border-b-[3.5px] border-[#2B0D3E]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Panel: Sliders & Settings */}
          <div className="lg:col-span-6 space-y-6 text-left reveal-on-scroll reveal-left">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-[#7A3F91] bg-[#F2EAF7] px-3 py-1 rounded-full">
                SaaS Value Calculator
              </span>
              {/* Currency switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-[#F2EAF7] border-2 border-[#2B0D3E] rounded-xl shadow-[2px_2px_0px_0px_#2B0D3E]">
                <button 
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                    currency === 'INR' ? 'bg-[#7A3F91] text-white' : 'text-[#2B0D3E]'
                  }`}
                >
                  ₹ INR
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                    currency === 'USD' ? 'bg-[#7A3F91] text-white' : 'text-[#2B0D3E]'
                  }`}
                >
                  $ USD
                </button>
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B0D3E] font-outfit tracking-tight">
              Calculate Your Savings & Compliance ROI
            </h2>
            <p className="text-sm font-semibold text-[#2B0D3E]/70 leading-relaxed">
              Drag the sliders below to estimate the monthly statutory compliance calculations, estimated EPF load, and manual HR hours saved by deploying MyFastHR.
            </p>

            <div className="space-y-6 bg-[#F2EAF7]/50 p-6 border-[2.5px] border-[#2B0D3E] rounded-2xl shadow-[4px_4px_0px_0px_#2B0D3E]">
              {/* Slider 1: Employees count */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-[#2B0D3E]">Active Workforce Size</span>
                  <span className="text-sm font-black text-[#7A3F91] font-outfit">{roiEmployees} Employees</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={roiEmployees}
                  onChange={(e) => setRoiEmployees(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#C59DD9]/40 rounded-lg appearance-none cursor-pointer accent-[#7A3F91]"
                />
              </div>

              {/* Slider 2: Average Monthly Salary */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-[#2B0D3E]">Avg. Monthly Salary</span>
                  <span className="text-sm font-black text-[#7A3F91] font-outfit">
                    {currency === 'INR' ? '₹' : '$'}{roiSalary.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={150000}
                  step={5000}
                  value={roiSalary}
                  onChange={(e) => setRoiSalary(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#C59DD9]/40 rounded-lg appearance-none cursor-pointer accent-[#7A3F91]"
                />
              </div>
            </div>

            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-3.5 brutalist-btn text-xs rounded-xl flex items-center gap-2"
            >
              View Full Pricing Plans <ArrowRight size={14} />
            </button>
          </div>

          {/* Right Panel: Output metrics */}
          <div className="lg:col-span-6 space-y-6 reveal-on-scroll reveal-right reveal-delay-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Output 1: EPF Load */}
              <div className="brutalist-box bg-white p-6 rounded-2xl text-left space-y-2">
                <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-wider">Est. Monthly EPF Load (12%)</span>
                <span className="text-3xl font-black text-[#2B0D3E] font-outfit block">
                  {currency === 'INR' ? '₹' : '$'}{Math.round(roiEmployees * roiSalary * 0.12).toLocaleString()}
                </span>
                <p className="text-[10px] font-medium text-[#2B0D3E]/60">Calculated on standard base limits automatically.</p>
              </div>

              {/* Output 2: Time Saved */}
              <div className="brutalist-box bg-white p-6 rounded-2xl text-left space-y-2">
                <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-wider">HR Time Saved</span>
                <span className="text-3xl font-black text-[#7A3F91] font-outfit block">
                  {Math.round(roiEmployees * 0.8)} Hours/mo
                </span>
                <p className="text-[10px] font-medium text-[#2B0D3E]/60">Eliminates manual muster roll & spreadsheet processing.</p>
              </div>

              {/* Output 3: Monthly Net Payout */}
              <div className="brutalist-box bg-white p-6 rounded-2xl text-left space-y-2">
                <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-wider">Total Est. Payout Log</span>
                <span className="text-3xl font-black text-[#2B0D3E] font-outfit block">
                  {currency === 'INR' ? '₹' : '$'}{Math.round(roiEmployees * roiSalary).toLocaleString()}
                </span>
                <p className="text-[10px] font-medium text-[#2B0D3E]/60">Excluding variable incentives & shift rosters.</p>
              </div>

              {/* Output 4: Leakages Saved */}
              <div className="brutalist-box bg-[#7A3F91] text-white p-6 rounded-2xl text-left space-y-2 shadow-[4px_4px_0px_0px_#2B0D3E] border-[2.5px] border-[#2B0D3E]">
                <span className="text-[10px] font-black uppercase text-white/70 tracking-wider">Audit Leakages Prevented</span>
                <span className="text-3xl font-black font-outfit block text-[#C59DD9]">
                  {currency === 'INR' ? '₹' : '$'}{Math.round(roiEmployees * 820).toLocaleString()}/mo
                </span>
                <p className="text-[10px] font-medium text-white/80">Via Aadhaar verification & PAN compliance checks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 6. Testimonial Bubbles */}
      <section className="px-6 py-24 bg-[#F2EAF7]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-2 reveal-on-scroll reveal-up">
            <span className="text-xs font-black uppercase tracking-widest text-[#7A3F91] bg-white border border-[#C59DD9] px-3 py-1 rounded-full">
              Client Feedback
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B0D3E] font-outfit tracking-tight">
              Trusted by Leading Organizations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="clay-card-white p-8 text-left space-y-6 flex flex-col justify-between reveal-on-scroll reveal-up reveal-delay-100">
              <p className="text-xs font-semibold text-[#2B0D3E] leading-relaxed italic">
                "The biometric sync API with our Jaipur hardware worked seamlessly. MyFastHR reduced our payroll prep process from four days to twenty minutes."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#F2EAF7]">
                <div className="w-10 h-10 rounded-full bg-[#7A3F91] border-2 border-[#2B0D3E] flex items-center justify-center font-black text-white text-xs font-outfit hover:scale-110 transition-transform">
                  DK
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2B0D3E]">Devendra Kumar</h4>
                  <p className="text-[10px] text-[#2B0D3E]/60 font-bold uppercase">Operations Lead, Highway King</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="clay-card-white p-8 text-left space-y-6 flex flex-col justify-between reveal-on-scroll reveal-up reveal-delay-200">
              <p className="text-xs font-semibold text-[#2B0D3E] leading-relaxed italic">
                "The interface layout is extremely fresh. Our employees can easily upload Aadhaar/PAN documents for compliance checks. Truly a premium experience."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#F2EAF7]">
                <div className="w-10 h-10 rounded-full bg-[#7A3F91] border-2 border-[#2B0D3E] flex items-center justify-center font-black text-white text-xs font-outfit hover:scale-110 transition-transform">
                  AS
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2B0D3E]">Anil Sharma</h4>
                  <p className="text-[10px] text-[#2B0D3E]/60 font-bold uppercase">HR Director, First Attempt Skills</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="clay-card-white p-8 text-left space-y-6 flex flex-col justify-between reveal-on-scroll reveal-up reveal-delay-300">
              <p className="text-xs font-semibold text-[#2B0D3E] leading-relaxed italic">
                "We enjoy the super admin impersonation tool which makes debugging configurations instantly possible. Best HR SaaS platform in the Indian market."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#F2EAF7]">
                <div className="w-10 h-10 rounded-full bg-[#7A3F91] border-2 border-[#2B0D3E] flex items-center justify-center font-black text-white text-xs font-outfit hover:scale-110 transition-transform">
                  DM
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2B0D3E]">Divyanshu M.</h4>
                  <p className="text-[10px] text-[#2B0D3E]/60 font-bold uppercase">Founder, Divyanshu Company</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Mainframe Cluster Server Status & Sandbox Telemetry */}
      <section id="mainframe-telemetry" className="px-6 py-24 bg-white border-t-[3.5px] border-[#2B0D3E] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-10 w-72 h-72 bg-[#C59DD9]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-10 text-center relative z-10">
          <div className="space-y-4 max-w-2xl mx-auto reveal-on-scroll reveal-up">
            <span className="text-xs font-black uppercase tracking-widest text-[#7A3F91] bg-[#F2EAF7] px-3 py-1 rounded-full border border-[#2B0D3E]/20">
              Live Mainframe Infrastructure
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B0D3E] font-outfit tracking-tight">
              Real-Time Node Telemetry
            </h2>
            <p className="text-sm font-semibold text-[#2B0D3E]/70">
              MyFastHR utilizes isolated sandboxes for database operations. See simulated live status of clusters across major cloud zones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-on-scroll reveal-up reveal-delay-100">
            {/* Jaipur Node */}
            <div className="brutalist-box bg-[#F2EAF7] p-5 rounded-2xl text-left space-y-2 relative">
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[9px] font-black uppercase text-[#10b981]">Active</span>
              </div>
              <span className="text-xs font-black uppercase text-[#7A3F91] tracking-wider block">Jaipur Primary Node</span>
              <div className="text-sm font-bold text-[#2B0D3E]">Ping Latency: <span className="font-mono text-[#7A3F91]">{nodePings.jaipur}ms</span></div>
              <p className="text-[10px] text-[#2B0D3E]/60 font-semibold">Serving biometric endpoints & clock in/out muster rules.</p>
            </div>

            {/* Mumbai Vault */}
            <div className="brutalist-box bg-[#FDF2F8] p-5 rounded-2xl text-left space-y-2 relative">
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[9px] font-black uppercase text-[#10b981]">Isolated</span>
              </div>
              <span className="text-xs font-black uppercase text-[#A155B9] tracking-wider block">Mumbai Document Vault</span>
              <div className="text-sm font-bold text-[#2B0D3E]">Ping Latency: <span className="font-mono text-[#A155B9]">{nodePings.mumbai}ms</span></div>
              <p className="text-[10px] text-[#2B0D3E]/60 font-semibold">Encrypted file storage for verified PAN card & Aadhaar payloads.</p>
            </div>

            {/* Delhi Sandbox */}
            <div className="brutalist-box bg-[#CCFBF1] p-5 rounded-2xl text-left space-y-2 relative">
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[9px] font-black uppercase text-[#10b981]">Standby</span>
              </div>
              <span className="text-xs font-black uppercase text-[#0F766E] tracking-wider block">Delhi Replica Cluster</span>
              <div className="text-sm font-bold text-[#2B0D3E]">Ping Latency: <span className="font-mono text-[#0F766E]">{nodePings.delhi}ms</span></div>
              <p className="text-[10px] text-[#2B0D3E]/60 font-semibold">Redundant transaction logs & live impersonation audits.</p>
            </div>
          </div>

          {/* Terminal Screen Console */}
          <div className="brutalist-box bg-slate-900 border-[3.5px] border-black text-[#10b981] p-6 rounded-3xl text-left font-mono text-xs space-y-2 shadow-[8px_8px_0px_0px_#2B0D3E] max-w-2xl mx-auto reveal-on-scroll reveal-scale">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2.5 mb-3 text-slate-400">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-sans">myfasthr-mainframe-monitor v2.0</span>
            </div>

            <div className="space-y-1.5 h-36 overflow-y-auto">
              <div className="text-slate-400">// Connecting to isolated sandbox network logs...</div>
              <div className="text-slate-400">// Secure connection established. Stream start:</div>
              {telemetryLogs.map((log) => (
                <div key={log.id} className="flex gap-2 items-start animate-fade-in-up">
                  <span className="text-slate-500 select-none">[{new Date(log.id).toLocaleTimeString()}]</span>
                  <span className="text-pink-500 font-bold">[{log.node}]</span>
                  <span className="text-slate-200">{log.text}</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 font-bold uppercase tracking-wider">{log.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 reveal-on-scroll reveal-up">
            <button
              onClick={() => navigate('/book-demo')}
              className="px-8 py-4 brutalist-btn text-sm rounded-2xl inline-flex items-center gap-2.5"
            >
              Deploy Your Sandbox Node <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#2B0D3E] text-[#F2EAF7] px-6 py-12 border-t-[3.5px] border-black mt-auto reveal-on-scroll reveal-up">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            {!logoError ? (
              <img 
                src={logoUrl} 
                alt={`${appName} Logo`} 
                className="h-8 w-auto object-contain brightness-0 invert" 
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-xl font-black font-outfit text-white">{appName}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/support')}
              className="text-xs font-black uppercase text-[#C59DD9] hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
            >
              Support
            </button>
            <button 
              onClick={() => navigate('/case-studies')}
              className="text-xs font-black uppercase text-[#C59DD9] hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
            >
              Case Studies
            </button>
            <button 
              onClick={() => navigate('/privacy')}
              className="text-xs font-black uppercase text-[#C59DD9] hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-xs font-black uppercase text-[#C59DD9] hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
            >
              Terms
            </button>
            <div className="text-xs font-bold text-[#C59DD9]">
              © {new Date().getFullYear()} {appName} Corp. All rights reserved. Made in Jaipur.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
