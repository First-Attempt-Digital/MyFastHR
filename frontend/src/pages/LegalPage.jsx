import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, FileText, ArrowRight, Download,
  Search, ShieldAlert, Cpu, Heart, CheckCircle2, ChevronRight, MessageSquare
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import UniversalHeader from '../components/layout/UniversalHeader';
import UniversalFooter from '../components/layout/UniversalFooter';
import '../styles/landing.css';
import BlurText from '../components/common/BlurText';
import SplitText from '../components/common/SplitText';
import ScrollReveal from '../components/common/ScrollReveal';
import VariableProximity from '../components/common/VariableProximity';
import Antigravity from '../components/common/Antigravity';


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
  const pageRef = useRef(null);
  const legalIndexRef = useRef(null);
  const legalDetailsContainerRef = useRef(null);

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
    <div ref={pageRef} className="landing-body min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-white text-slate-800">
      {/* Dynamic Header */}
      <UniversalHeader />

      {/* Main Content Hero */}
      <div className="max-w-[1200px] mx-auto px-6 pt-16 flex-grow pb-24 w-full">
        <section className="relative px-6 py-16 text-center bg-[#F1F5F9]/60 overflow-hidden rounded-[32px] mb-16">
          <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
            <Antigravity
              count={120}
              magnetRadius={6}
              ringRadius={7}
              waveSpeed={0.4}
              waveAmplitude={1}
              particleSize={1.5}
              lerpSpeed={0.05}
              color={'#8b5cf6'}
              autoAnimate={true}
              particleVariance={1}
              particleShape="sphere"
            />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6 reveal-on-scroll reveal-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-100 bg-purple-50/20 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} style={{ color: 'var(--primary-purple)' }} />
            <span>
              <VariableProximity
                label="Platform Trust & Legal"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-slate-900 text-center flex justify-center">
            <BlurText text="Compliance & Transparency Guard" className="inline-flex" style={{ justifyContent: 'center' }} />
          </h1>

          <SplitText 
            text="Plain English translations side-by-side with statutory legal guidelines. No hidden loops, no data spoofing." 
            className="text-xs sm:text-sm md:text-base font-semibold text-gray-500 block"
            tag="p"
            textAlign="center"
            splitType="words"
            delay={20}
            duration={0.8}
          />

          {/* Toggle pill selector */}
          <div className="inline-flex p-1.5 rounded-2xl bg-purple-50 border border-purple-100 shadow-sm">
            <button
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer border-none outline-none ${activeTab === 'privacy'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 bg-transparent hover:bg-white/50'
                }`}
              style={{
                backgroundColor: activeTab === 'privacy' ? 'var(--primary-purple)' : undefined
              }}
            >
              <ShieldCheck size={16} />
              <VariableProximity
                label="Privacy Policy"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </button>
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer border-none outline-none ${activeTab === 'terms'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 bg-transparent hover:bg-white/50'
                }`}
              style={{
                backgroundColor: activeTab === 'terms' ? 'var(--primary-purple)' : undefined
              }}
            >
              <FileText size={16} />
              <VariableProximity
                label="Terms of Service"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </button>
          </div>
        </div>
        </section>

        {/* Toolbar (Search & Download) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-12 p-6 rounded-[24px] border border-purple-100 bg-white shadow-[0_8px_30px_rgba(96,40,217,0.03)] reveal-on-scroll reveal-up">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'privacy' ? 'privacy sections' : 'terms clauses'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.e?.target?.value || e.target.value)}
              className="w-full bg-slate-50 border border-purple-100 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#6028D9]/40 transition-colors"
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:inline">
              <VariableProximity
                label="Last Updated: June 1, 2026"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-100 bg-white font-bold text-xs active:scale-95 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
            >
              <Download size={14} />
              <VariableProximity
                label="Download Copy"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </button>
          </div>
        </div>

        {/* Two Column Layout (Outline & Main Content) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Outline Sidebar */}
          <div className="lg:col-span-4 sticky top-28 hidden lg:block space-y-6 reveal-on-scroll reveal-up">
            <div ref={legalIndexRef} className="p-6 rounded-[24px] border border-purple-100 bg-purple-50/10 shadow-sm text-left" style={{ position: 'relative' }}>
              <h3 className="text-base font-bold uppercase tracking-wider mb-4 border-b border-purple-50 pb-2">
                <VariableProximity
                  label="Document Index"
                  fromFontVariationSettings="'wght' 400"
                  toFontVariationSettings="'wght' 900"
                  containerRef={legalIndexRef}
                  radius={120}
                  falloff="linear"
                />
              </h3>

              <ul className="space-y-3">
                {filteredSections.map(sec => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className="w-full text-left flex items-start gap-2 group hover:text-[var(--primary-purple)] transition-colors bg-transparent border-none outline-none cursor-pointer text-gray-600 font-medium"
                    >
                      <ChevronRight size={16} className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--primary-purple)' }} />
                      <span className="text-xs leading-tight tracking-tight">
                        <VariableProximity
                          label={sec.title}
                          fromFontVariationSettings="'wght' 500"
                          toFontVariationSettings="'wght' 900"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-[24px] border border-purple-100 bg-white shadow-sm text-left flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <ShieldAlert size={20} className="text-red-500" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold tracking-tight">
                  <VariableProximity
                    label="Security Incident Report?"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </h4>
                <p className="text-[10px] font-bold text-gray-500">
                  <VariableProximity
                    label="Email: support@myfasthr.com"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Sections */}
          <div ref={legalDetailsContainerRef} className="lg:col-span-8" style={{ position: 'relative' }}>
            {filteredSections.length === 0 ? (
              <div className="p-12 rounded-[32px] border border-purple-100 bg-white shadow-sm text-center space-y-4 reveal-on-scroll reveal-up">
                <ShieldAlert size={48} className="mx-auto text-gray-300 animate-bounce" />
                <h3 className="text-lg font-bold">
                  <VariableProximity
                    label="No matching legal parameters found"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </h3>
                <p className="text-xs font-semibold text-gray-500 max-w-sm mx-auto">
                  <VariableProximity
                    label="Try adjusting your search filters to find standard legal declarations."
                    fromFontVariationSettings="'wght' 500"
                    toFontVariationSettings="'wght' 900"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredSections.map(sec => (
                  <div
                    key={sec.id}
                    id={sec.id}
                    className="p-8 rounded-[32px] border border-purple-100 bg-white shadow-[0_8px_30px_rgba(96,40,217,0.03)] hover:shadow-[0_12px_40px_rgba(96,40,217,0.08)] text-left space-y-6 transition-all duration-300 scroll-mt-24 reveal-on-scroll reveal-up"
                  >
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight border-b border-purple-50 pb-3">
                    <VariableProximity
                      label={sec.title}
                      fromFontVariationSettings="'wght' 400"
                      toFontVariationSettings="'wght' 900"
                      containerRef={legalDetailsContainerRef}
                      radius={120}
                      falloff="linear"
                    />
                  </h2>

                  <div className="text-xs md:text-sm font-medium leading-relaxed text-gray-600 whitespace-pre-line" style={{ position: 'relative' }}>
                    <VariableProximity
                      label={sec.desc}
                      fromFontVariationSettings="'wght' 400"
                      toFontVariationSettings="'wght' 900"
                      containerRef={legalDetailsContainerRef}
                      radius={120}
                      falloff="linear"
                    />
                  </div>

                  {/* TL;DR Highlight Card */}
                  <div className="p-5 rounded-2xl border border-purple-50 bg-purple-50/10 flex gap-4 items-start">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: 'var(--primary-purple)' }}
                    >
                      <Heart size={16} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                        <VariableProximity
                          label="TL;DR Summary (Plain English)"
                          fromFontVariationSettings="'wght' 700"
                          toFontVariationSettings="'wght' 950"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                      </span>
                      <div className="text-xs font-bold leading-snug block text-left" style={{ position: 'relative' }}>
                        <VariableProximity
                          label={sec.tldr}
                          fromFontVariationSettings="'wght' 400"
                          toFontVariationSettings="'wght' 950"
                          containerRef={legalDetailsContainerRef}
                          radius={120}
                          falloff="linear"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Footer */}
      <UniversalFooter />
    </div>
  );
};

export default LegalPage;

