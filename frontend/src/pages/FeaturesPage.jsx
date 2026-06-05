import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, Users, FileText, Clock, ShieldCheck, 
  ArrowLeft, ArrowRight, CheckCircle2, Cpu, Database, Landmark
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const FeaturesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'workforce');
  
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);
  
  const [mappings, setMappings] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio_features_mapping');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Scroll to top on load & load branding
  useEffect(() => {
    window.scrollTo(0, 0);

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
  }, []);

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

  const modules = {
    workforce: {
      title: "Workforce Registry",
      badge: "Structure & Scale",
      icon: <Users size={28} />,
      desc: "Maintain clean hierarchy and departmental structures. Complete support for manager-employee reporting loops and dynamic salary levels.",
      bullets: [
        "Dynamic department creation & reporting hubs",
        "Manager-employee approval mapping trees",
        "Salary structure allocation tags",
        "Detailed profile cards with asset tracking tags"
      ],
      previewStats: [
        { label: "Active Org Levels", val: "5 Levels" },
        { label: "Reporting Nodes", val: "Dynamic" }
      ],
      cardBg: "bg-white",
      previewImage: mappings.workforce || "/assets/workforce_preview.png"
    },
    payroll: {
      title: "SaaS Payroll Engine",
      badge: "Statutory & Speed",
      icon: <FileText size={28} />,
      desc: "Configure multi-level allowances, dynamic variable bonuses, and compliance tax splits. Runs mass payroll distributions in 20 minutes instead of days.",
      bullets: [
        "Custom company allowance formulas",
        "Automatic PF, ESIC, LWF compliance splits",
        "Encrypted bank sheet generation",
        "Ledger accounts distribution outputs"
      ],
      previewStats: [
        { label: "Max Compute Time", val: "< 20 mins" },
        { label: "Compliance Slates", val: "100% Auto" }
      ],
      cardBg: "bg-[#F2EAF7]",
      previewImage: mappings.payroll || "/assets/payroll_preview.png"
    },
    attendance: {
      title: "Attendance Muster",
      badge: "Real-Time Telemetry",
      icon: <Clock size={28} />,
      desc: "Integrate physical biometric scanners directly via secure cloud sync APIs. Log shifts, roster configurations, and mobile geo-fenced coordinates.",
      bullets: [
        "Cloud Biometric sync API logs",
        "Geo-fenced mobile desk check-ins",
        "Late-coming penalty formulas",
        "Overtime roster scheduler boards"
      ],
      previewStats: [
        { label: "Machine Sync Rate", val: "Live Stream" },
        { label: "Roster Variations", val: "Unlimited" }
      ],
      cardBg: "bg-white",
      previewImage: mappings.attendance || "/assets/attendance_preview.png"
    },
    compliance: {
      title: "Compliance Vault",
      badge: "Encrypted & Auditable",
      icon: <ShieldCheck size={28} />,
      desc: "Store employee legal records in private encrypted folders. Built-in validator pipeline requires Super Admin validation before payroll unlocking.",
      bullets: [
        "Direct employee Aadhaar/PAN secure vault",
        "OCR metadata inspection tools",
        "Audit logs for document views",
        "Encrypted multi-tenant file system nodes"
      ],
      previewStats: [
        { label: "Encryption Mode", val: "AES-256" },
        { label: "Audit Track", val: "Immutable" }
      ],
      cardBg: "bg-white",
      previewImage: mappings.compliance || "/assets/compliance_preview.png"
    }
  };

  return (
    <div className="landing-body min-h-screen flex flex-col font-sans relative">
      {/* Decorative Blur Backdrops */}
      <div className="bg-mesh" />
      <div className="bg-mesh-right" />

      {/* 1. Navbar Header */}
      <header className="sticky top-0 z-50 bg-[#F2EAF7]/85 backdrop-blur-md border-b-[3.5px] border-[#2B0D3E] px-6 h-[72px] flex items-center">
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

          <div className="flex items-center gap-4">
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
                Get Started
              </button>
            </div>
            <MobileAuthDropdown />
          </div>
        </div>
      </header>

      {/* 2. Hero Header */}
      <section className="px-6 py-12 lg:py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6 reveal-on-scroll reveal-up">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-black uppercase text-[#7A3F91] hover:scale-105 transition-transform"
          >
            <ArrowLeft size={14} /> Back to main landing
          </button>
          
          <h1 className="text-4xl sm:text-6xl font-black text-[#2B0D3E] font-outfit leading-none tracking-tight">
            Explore Core <br/>
            <span className="text-[#7A3F91] underline decoration-[#C59DD9] decoration-wavy">System Modules.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#2B0D3E]/80 max-w-xl mx-auto leading-relaxed">
            Deep dive into the architecture of MyFastHR. Learn how our workforce engine, payroll ledger systems, muster logs, and compliance vault work in synchronization.
          </p>
        </div>
      </section>

      {/* 3. Interactive Detail Panel */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Navigation Tabs (Brutalist Menu Layout) - Hidden on mobile, shown on large screens */}
          <div className="hidden lg:block lg:col-span-4 space-y-4 reveal-on-scroll reveal-left">
            <h3 className="text-xs font-black uppercase text-[#2B0D3E]/50 tracking-widest text-left pl-2">Select Platform Module</h3>
            <div className="space-y-3.5">
              {Object.keys(modules).map((key) => {
                const item = modules[key];
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full p-5 rounded-2xl border-[3px] text-left transition-all flex items-center justify-between ${
                      isActive 
                        ? 'bg-[#7A3F91] text-white border-[#2B0D3E] shadow-[5px_5px_0px_0px_#2B0D3E] -translate-y-1' 
                        : 'bg-white text-[#2B0D3E] border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#2B0D3E]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                        isActive ? 'bg-white/20 border-white' : 'bg-[#F2EAF7] border-[#2B0D3E] text-[#7A3F91]'
                      }`}>
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">{item.badge}</span>
                        <h4 className="text-base font-black font-outfit tracking-tight">{item.title}</h4>
                      </div>
                    </div>
                    <ArrowRight size={18} className={`transform transition-transform ${isActive ? 'rotate-90 text-white' : 'text-[#2B0D3E]/50'}`} />
                  </button>
                );
              })}
            </div>

            {/* Architecture Highlight Block */}
            <div className="brutalist-box rounded-3xl p-6 bg-[#F2EAF7] border-[3px] border-[#2B0D3E] text-left space-y-4">
              <div className="flex items-center gap-3">
                <Database className="text-[#7A3F91]" size={20} />
                <h4 className="text-sm font-black uppercase text-[#2B0D3E] font-outfit">SaaS Node Architecture</h4>
              </div>
              <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-normal">
                Every enterprise company is deployed on an isolated virtual schema. This ensures zero data leaks, rapid database queries, and dedicated backups.
              </p>
            </div>
          </div>

          {/* Right Active Showcase Card (Claymorphic / Brutalist Fusion) */}
          <div className="col-span-1 lg:col-span-8 space-y-6 reveal-on-scroll reveal-right">
            {/* Mobile View App-style Tab Options (Horizontal Scroll Bar directly above showcase card) */}
            <div className="block lg:hidden w-full">
              <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-hide -mx-2 px-2 snap-x snap-mandatory">
                {Object.keys(modules).map((key) => {
                  const item = modules[key];
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-none snap-start px-4 py-3 rounded-xl border-[2.5px] border-[#2B0D3E] flex items-center gap-2.5 transition-all text-xs font-black uppercase tracking-wider ${
                        isActive
                          ? 'bg-[#7A3F91] text-white shadow-[3px_3px_0px_0px_#2B0D3E] -translate-y-0.5'
                          : 'bg-white text-[#2B0D3E] shadow-[1.5px_1.5px_0px_0px_#2B0D3E]'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                        isActive ? 'bg-white/20 border-white text-white' : 'bg-[#F2EAF7] border-[#2B0D3E] text-[#7A3F91]'
                      }`}>
                        {React.cloneElement(item.icon, { size: 14 })}
                      </div>
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div id="module-showcase" className="w-full brutalist-box bg-white rounded-[36px] p-8 lg:p-10 text-left border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] space-y-8 min-h-[450px] relative overflow-hidden">
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-[3px] border-[#2B0D3E] pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F2EAF7] border-[3px] border-[#2B0D3E] text-[#7A3F91] flex items-center justify-center shadow-[4px_4px_0px_0px_#2B0D3E]">
                    {modules[activeTab].icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7A3F91]">{modules[activeTab].badge}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#2B0D3E] font-outfit tracking-tight leading-none mt-1">{modules[activeTab].title}</h2>
                  </div>
                </div>

                <span className="px-4 py-1.5 clay-pill text-xs font-black uppercase text-[#7A3F91] tracking-wider">
                  Live Module
                </span>
              </div>

              {/* Description & Bullet points */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-7 space-y-6">
                  <p className="text-sm font-semibold text-[#2B0D3E]/80 leading-relaxed">
                    {modules[activeTab].desc}
                  </p>
                  
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-[#2B0D3E]/60 tracking-widest">Key Subcomponents</h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {modules[activeTab].bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs font-bold text-[#2B0D3E] hover:translate-x-1 transition-transform">
                          <CheckCircle2 size={16} className="text-[#7A3F91] shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Mini-Preview Stats Block */}
                <div className="md:col-span-5 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-[#2B0D3E]/60 tracking-widest">Performance Metrics</h4>
                  <div className="space-y-3">
                    {modules[activeTab].previewStats.map((stat, idx) => (
                      <div key={idx} className="p-4 bg-[#F2EAF7] border-[2.5px] border-[#2B0D3E] rounded-2xl shadow-[3px_3px_0px_0px_#2B0D3E]">
                        <span className="text-[9px] font-black uppercase text-[#7A3F91] tracking-wider block opacity-75">{stat.label}</span>
                        <span className="text-lg font-black text-[#2B0D3E] font-outfit">{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-white border-[2.5px] border-[#2B0D3E] rounded-2xl flex items-center gap-3">
                    <Cpu className="text-[#7A3F91]" size={20} />
                    <span className="text-[10px] font-black uppercase text-[#2B0D3E]/60 tracking-wider">Fully compiled sandbox</span>
                  </div>
                </div>
              </div>

              {/* Live Interface Screenshot Preview */}
              <div className="space-y-3.5 pt-4">
                <h4 className="text-[10px] font-black uppercase text-[#2B0D3E]/60 tracking-widest">Interface Preview</h4>
                <div className="brutalist-box rounded-2xl overflow-hidden border-[2.5px] border-[#2B0D3E] bg-[#F2EAF7] shadow-[4px_4px_0px_0px_#2B0D3E] hover:scale-[1.01] transition-transform">
                  {/* Browser top-bar */}
                  <div className="flex items-center gap-1.5 px-4 py-2 border-b-[2.5px] border-[#2B0D3E] bg-white">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2B0D3E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7A3F91]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C59DD9]" />
                    <span className="text-[9px] font-black uppercase text-[#2B0D3E]/50 tracking-wider ml-2">{modules[activeTab].title} Live console preview</span>
                  </div>
                  {/* Screenshot Image */}
                  <div className="bg-white p-2">
                    <img 
                      src={modules[activeTab].previewImage} 
                      alt={`${modules[activeTab].title} Dashboard Interface Preview`}
                      className="w-full h-auto object-cover rounded-xl border border-[#2B0D3E]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom CTA trigger */}
              <div className="pt-6 border-t border-[#F2EAF7] flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-wider">Ready to deploy sandbox?</span>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 brutalist-btn text-xs rounded-xl flex items-center gap-2"
                >
                  Spin Up {modules[activeTab].title} Console
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-[#2B0D3E] text-[#F2EAF7] px-6 py-12 border-t-[3.5px] border-black mt-auto">
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

export default FeaturesPage;
