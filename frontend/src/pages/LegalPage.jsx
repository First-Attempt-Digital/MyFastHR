import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, FileText, ArrowRight, Download,
  Search, ShieldAlert, Cpu, Heart, CheckCircle2, ChevronRight, MessageSquare
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const privacySections = [
  {
    id: "info-collection",
    title: "1. Information We Collect",
    desc: "We collect information necessary to compute payroll, manage employee directories, and log check-ins/check-outs. This includes employee names, contact emails, basic identity document scans (like PAN and Aadhaar for Indian tax compliances), and hardware telemetry coordinates from biometric check-in integration endpoints.",
    tldr: "We collect only what's required for your HR, payroll processing, tax compliance, and biometric attendance sync."
  },
  {
    id: "data-use",
    title: "2. How We Use Information",
    desc: "All collected records are strictly utilized to run calculation loops. This includes computing monthly PF and ESIC compliance deductions, compiling smart shifts data, generating payroll ledger entries, and resolving attendance overrides. We never sell your telemetry logs, personal profiles, or documents to third-party ad brokers.",
    tldr: "We use details strictly to calculate payslips, attendance, and compliance audits. No third-party data selling."
  },
  {
    id: "tenant-isolation",
    title: "3. Tenant Isolation & Storage",
    desc: "To guarantee structural database security, MyFastHR runs on isolated schema structures. Each company tenant has its own isolated records boundary. Files uploaded to the Secure Document Vault are encrypted at rest using AES-256 protocols and can only be decrypted by authorized admins of your organization.",
    tldr: "Your data is completely isolated from other clients. All documents are encrypted with high-level AES-256 encryption."
  },
  {
    id: "security-measures",
    title: "4. Security & Auditing",
    desc: "We enforce role-based access parameters. Managers can only approve shift rosters under their direct supervision, and staff can only view their own slips. All operations, modifications, and system-wide overrides log a strict audit log footprint to prevent administrative database spoofing.",
    tldr: "Every change is tracked. Role-based permissions keep unauthorized users out of sensitive compliance files."
  },
  {
    id: "user-controls",
    title: "5. Your Rights & Choice",
    desc: "You maintain absolute authority over employee records. Admins can permanently purge employee profiles, override incorrect punch coordinates, and download complete backup files of company ledger logs. If a subscription is cancelled, all isolated tenant schemas are permanently wiped after 30 days.",
    tldr: "You own the data. Cancelled tenant environments are completely and permanently purged within 30 days."
  }
];

const termsSections = [
  {
    id: "terms-acceptance",
    title: "1. Acceptance of Terms",
    desc: "By registering a trial company or signing up for MyFastHR's subscription packages, you agree to comply with these terms. If you do not agree to these rules, you must not access the admin dashboards or sync any hardware biometric terminals with the platform.",
    tldr: "Using MyFastHR or booking a demo means you agree to play by these rules."
  },
  {
    id: "service-scope",
    title: "2. Platform SLA & Performance",
    desc: "MyFastHR works as a SaaS utility aiming for a 99.9% application availability window. Since shift overrides, biometric updates, and bank payroll transfers rely on local web connections and third-party bank settlement portals, occasional processing delay window updates are expected.",
    tldr: "We aim for 99.9% uptime. Biometric and bank transfers depend on external networks."
  },
  {
    id: "account-responsibility",
    title: "3. Account Integrity",
    desc: "Company administrators are fully responsible for managing active employee access credentials. You must ensure that employee passwords, platform security keys, and admin freeze pins are kept confidential. Any transaction or roster override performed under your credentials is presumed authorized.",
    tldr: "Keep your passwords and admin pins safe. You are responsible for all actions taken on your account."
  },
  {
    id: "billing-cancel",
    title: "4. Billing, Trials, & Purges",
    desc: "Trial companies created through the landing portal run on a zero-charge trial window. Active subscriptions are billed monthly on a per-active-employee threshold. You can stop subscription schedules at any point. Cancellation requests immediately halt active billing cycles.",
    tldr: "Trials are free. Active subscriptions are calculated per employee. Cancel anytime."
  },
  {
    id: "restrictions",
    title: "5. Platform Restrictions",
    desc: "You must not bypass multi-tenant isolation guardrails, run brute-force scripts against employee login portals, spoof biometric synchronization APIs, or reverse engineer payroll calculation algorithms. Violations will result in immediate tenant suspension.",
    tldr: "No hacking, spoofing check-ins, or reverse engineering. Breaking rules leads to instant suspension."
  },
  {
    id: "liability",
    title: "6. Disclaimer of Liability",
    desc: "MyFastHR provides automated payroll, attendance overrides, and tax compliance computation tools for guidance. The final accuracy check of statutory returns remains the responsibility of your company's accounts and compliance officers.",
    tldr: "We provide automated tools, but final compliance numbers must be verified by your tax experts."
  }
];

const LegalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Decide active tab based on query param or route
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('type');
    if (tab === 'terms') return 'terms';
    if (location.pathname === '/terms') return 'terms';
    return 'privacy';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);

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
  }, [activeTab, searchQuery]);

  // Sync tab state when path changes
  useEffect(() => {
    if (location.pathname === '/terms') {
      setActiveTabState('terms');
    } else if (location.pathname === '/privacy') {
      setActiveTabState('privacy');
    }
  }, [location.pathname]);

  const handleTabChange = (type) => {
    setActiveTabState(type);
    navigate(type === 'terms' ? '/terms' : '/privacy');
  };

  const sections = activeTab === 'privacy' ? privacySections : termsSections;

  const filteredSections = sections.filter(sec =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.tldr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = () => {
    const title = activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
    let text = `${appName} - ${title}\nLast Updated: June 1, 2026\n\n`;
    sections.forEach(sec => {
      text += `${sec.title}\n${sec.desc}\nSummary: ${sec.tldr}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="landing-body min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-[#FFFBF0] text-[#2B0D3E] selection:bg-[#FFDE6A] selection:text-[#2B0D3E]">
      {/* Decorative Blur Backdrops */}
      <div className="bg-mesh animate-pulse" />
      <div className="bg-mesh-right" />

      {/* Global Header */}
      <header className="sticky top-0 z-50 bg-[#FFFBF0]/85 backdrop-blur-md border-b-[3.5px] border-[#2B0D3E] px-6 h-[72px] flex items-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
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
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] border-[2.5px] border-[#2B0D3E] bg-[#C59DD9]/40 hover:bg-[#C59DD9]/70 transition-all active:scale-95 shadow-[2px_2px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer"
              >
                Book Demo
              </button>
              <button
                onClick={() => navigate('/employee')}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] border-[2.5px] border-[#2B0D3E] bg-white hover:bg-[#C59DD9]/20 transition-all active:scale-95 shadow-[2px_2px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer"
              >
                Employee Login
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-white bg-[#7A3F91] border-[2.5px] border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#2B0D3E] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
            <MobileAuthDropdown />
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <div className="max-w-[1200px] mx-auto px-6 pt-16 flex-grow">
        <div className="text-center space-y-6 max-w-2xl mx-auto mb-16 reveal-on-scroll reveal-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#2B0D3E] bg-white shadow-[2px_2px_0px_0px_#2B0D3E] text-xs font-black uppercase tracking-wider">
            <ShieldCheck size={14} className="text-[#7A3F91]" />
            <span>Platform Trust & Legal</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-[#2B0D3E] font-outfit">
            Compliance & Transparency Guard
          </h1>

          <p className="text-sm md:text-base font-semibold text-[#2B0D3E]/80">
            Plain English translations side-by-side with statutory legal guidelines. No hidden loops, no data spoofing.
          </p>

          {/* Toggle pill selector */}
          <div className="inline-flex p-1.5 rounded-2xl border-3 border-[#2B0D3E] bg-[#F2EAF7] shadow-[4.5px_4.5px_0px_0px_#2B0D3E]">
            <button
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${activeTab === 'privacy'
                  ? 'bg-[#7A3F91] text-white border-2 border-[#2B0D3E] shadow-[2px_2px_0px_0px_#2B0D3E]'
                  : 'text-[#2B0D3E] border-2 border-transparent hover:bg-white/50'
                }`}
            >
              <ShieldCheck size={16} />
              Privacy Policy
            </button>
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${activeTab === 'terms'
                  ? 'bg-[#7A3F91] text-white border-2 border-[#2B0D3E] shadow-[2px_2px_0px_0px_#2B0D3E]'
                  : 'text-[#2B0D3E] border-2 border-transparent hover:bg-white/50'
                }`}
            >
              <FileText size={16} />
              Terms of Service
            </button>
          </div>
        </div>

        {/* Toolbar (Search & Download) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-12 p-6 rounded-[24px] border-3 border-[#2B0D3E] bg-white shadow-[6px_6px_0px_0px_#2B0D3E] reveal-on-scroll reveal-up">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#2B0D3E]/50">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'privacy' ? 'privacy sections' : 'terms clauses'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFBF0] border-2 border-[#2B0D3E] rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold placeholder-[#2B0D3E]/50 focus:outline-none focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-[#2B0D3E]/60 uppercase tracking-widest hidden md:inline">
              Last Updated: June 1, 2026
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#2B0D3E] bg-white font-black text-xs active:scale-95 shadow-[3px_3px_0px_0px_#2B0D3E] transition-all hover:bg-slate-50 cursor-pointer"
            >
              <Download size={14} />
              Download Copy
            </button>
          </div>
        </div>

        {/* Two Column Layout (Outline & Main Content) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Outline Sidebar */}
          <div className="lg:col-span-4 sticky top-28 hidden lg:block space-y-6 reveal-on-scroll reveal-up">
            {/* Relatable 3D Sticker */}
            <div className="brutalist-box p-4 bg-white rounded-[24px] border-3 border-[#2B0D3E] shadow-[6px_6px_0px_0px_#2B0D3E] flex flex-col items-center justify-center relative overflow-hidden group">
              <img
                src={activeTab === 'privacy' ? '/assets/privacy_shield_sticker.png' : '/assets/terms_contract_sticker.png'}
                alt={activeTab === 'privacy' ? 'Privacy Shield Sticker' : 'Terms Contract Sticker'}
                className="w-48 h-48 object-contain transform group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
              />
              <span className="text-[9.5px] font-black uppercase text-[#2B0D3E]/60 tracking-wider mt-2 bg-[#F2EAF7] px-3 py-1 rounded-full border border-[#2B0D3E]/30">
                {activeTab === 'privacy' ? '🛡️ Guard Activated' : '📜 System Protocols'}
              </span>
            </div>

            <div className="p-6 rounded-[24px] border-3 border-[#2B0D3E] bg-[#F2EAF7] shadow-[6px_6px_0px_0px_#2B0D3E] text-left">
              <h3 className="text-base font-black uppercase tracking-wider mb-4 border-b-2 border-[#2B0D3E] pb-2">
                Document Index
              </h3>

              <ul className="space-y-3">
                {filteredSections.map(sec => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className="w-full text-left flex items-start gap-2 group hover:text-[#7A3F91] transition-colors bg-transparent border-none outline-none cursor-pointer"
                    >
                      <ChevronRight size={16} className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-1" />
                      <span className="text-xs font-black leading-tight tracking-tight">
                        {sec.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-[24px] border-3 border-[#2B0D3E] bg-[#FFF] shadow-[6px_6px_0px_0px_#2B0D3E] text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center border-2 border-[#2B0D3E] shrink-0">
                <ShieldAlert size={20} className="text-red-500" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black tracking-tight">Security Incident Report?</h4>
                <p className="text-[10px] font-bold text-[#2B0D3E]/60">Email: support@myfasthr.com</p>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Sections */}
          <div className="lg:col-span-8 space-y-8">
            {filteredSections.length === 0 ? (
              <div className="p-12 rounded-[32px] border-3 border-[#2B0D3E] bg-white shadow-[8px_8px_0px_0px_#2B0D3E] text-center space-y-4 reveal-on-scroll reveal-up">
                <ShieldAlert size={48} className="mx-auto text-[#7A3F91] animate-bounce" />
                <h3 className="text-lg font-black">No matching legal parameters found</h3>
                <p className="text-xs font-semibold text-[#2B0D3E]/60 max-w-sm mx-auto">
                  Try adjusting your search filters to find standard legal declarations.
                </p>
              </div>
            ) : (
              filteredSections.map(sec => (
                <div
                  key={sec.id}
                  id={sec.id}
                  className="p-8 rounded-[32px] border-3 border-[#2B0D3E] bg-white shadow-[8px_8px_0px_0px_#2B0D3E] text-left space-y-6 transition-all hover:translate-y-[-2px] scroll-mt-24 reveal-on-scroll reveal-up"
                >
                  <h2 className="text-xl md:text-2xl font-black tracking-tight border-b-2 border-slate-100 pb-3">
                    {sec.title}
                  </h2>

                  <p className="text-xs md:text-sm font-semibold leading-relaxed text-[#2B0D3E]/90 whitespace-pre-line">
                    {sec.desc}
                  </p>

                  {/* TL;DR Highlight Card (Neobrutalist Takeaway) */}
                  <div className="p-5 rounded-2xl border-2 border-[#2B0D3E] bg-[#FFDE6A]/20 shadow-[4px_4px_0px_0px_#2B0D3E] flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-[#FFDE6A] flex items-center justify-center border-2 border-[#2B0D3E] shrink-0">
                      <Heart size={16} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-wider">
                        TL;DR Summary (Plain English)
                      </span>
                      <p className="text-xs font-bold leading-snug">
                        {sec.tldr}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2B0D3E] text-[#F2EAF7] px-6 py-12 border-t-[3.5px] border-black mt-20 reveal-on-scroll reveal-up">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
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

export default LegalPage;
