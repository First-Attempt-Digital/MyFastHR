import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Shield, Server, Cpu, Globe, 
  ArrowLeft, ArrowRight, CheckCircle2, Lock, Zap
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const InfrastructurePage = () => {
  const navigate = useNavigate();
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
  }, []);

  return (
    <div className="landing-body min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      {/* Decorative Blur Backdrops */}
      <div className="bg-mesh animate-pulse" />
      <div className="bg-mesh-right" />

      {/* Floating Claymorphic Stickers */}
      <div className="absolute top-[20%] -left-12 w-28 h-28 rounded-full bg-gradient-to-br from-[#C59DD9] to-[#7A3F91] border-[3px] border-[#2B0D3E] shadow-[inset_-4px_-4px_10px_rgba(43,13,62,0.3),_inset_4px_4px_10px_rgba(255,255,255,0.4),_8px_8px_0px_0px_#2B0D3E] hidden md:block opacity-65 hover:scale-105 transition-transform" />
      <div className="absolute top-[50%] -right-16 w-36 h-36 rounded-[40px] bg-gradient-to-tr from-[#7A3F91] to-[#C59DD9] border-[3px] border-[#2B0D3E] shadow-[inset_-5px_-5px_12px_rgba(43,13,62,0.3),_inset_5px_5px_12px_rgba(255,255,255,0.4),_8px_8px_0px_0px_#2B0D3E] rotate-12 hidden md:block opacity-75 hover:scale-105 transition-transform" />

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

      {/* 2. Hero Header Section */}
      <section className="px-6 py-12 lg:py-20 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-6 reveal-on-scroll reveal-up">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-black uppercase text-[#7A3F91] hover:scale-105 transition-transform"
          >
            <ArrowLeft size={14} /> Back to main landing
          </button>
          
          <h1 className="text-4xl sm:text-6xl font-black text-[#2B0D3E] font-outfit leading-none tracking-tight">
            Isolated Schema. <br/>
            <span className="text-[#7A3F91] underline decoration-[#C59DD9] decoration-wavy">Enterprise Nodes.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#2B0D3E]/80 max-w-xl mx-auto leading-relaxed">
            Every business customer gets its own isolated virtual schema node. We guarantee maximum safety, high-speed queries, and automated live backup storage.
          </p>
        </div>
      </section>

      {/* 3. Dynamic Claymorphic Stack Architecture */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Node Block 1 */}
          <div className="brutalist-box rounded-[32px] p-8 bg-white border-[3px] border-[#2B0D3E] shadow-[6px_6px_0px_0px_#2B0D3E] space-y-6 flex flex-col justify-between reveal-on-scroll reveal-left reveal-delay-100">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#2B0D3E] shadow-[inset_-3px_-3px_8px_rgba(122,63,145,0.15),_inset_3px_3px_8px_rgba(255,255,255,0.9),_4px_4px_0px_0px_#2B0D3E] text-[#7A3F91] flex items-center justify-center">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-black text-[#2B0D3E] font-outfit">Isolated Database Nodes</h3>
              <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">
                Zero data mixing. Every tenant schema resides on isolated logical parameters, eliminating horizontal cross-tenant security failures.
              </p>
            </div>
            <div className="pt-4 border-t border-[#2B0D3E]/10 flex items-center gap-2 text-xs font-black text-[#7A3F91]">
              <Lock size={14} /> Encrypted DB Splits
            </div>
          </div>

          {/* Node Block 2 */}
          <div className="brutalist-box rounded-[32px] p-8 bg-white border-[3px] border-[#2B0D3E] shadow-[6px_6px_0px_0px_#2B0D3E] space-y-6 flex flex-col justify-between reveal-on-scroll reveal-up reveal-delay-200">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#2B0D3E] shadow-[inset_-3px_-3px_8px_rgba(122,63,145,0.15),_inset_3px_3px_8px_rgba(255,255,255,0.9),_4px_4px_0px_0px_#2B0D3E] text-[#7A3F91] flex items-center justify-center">
                <Server size={24} />
              </div>
              <h3 className="text-xl font-black text-[#2B0D3E] font-outfit">Hybrid Cloud Infrastructure</h3>
              <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">
                Hosted on enterprise grade cloud structures with automated live load balancing to handle massive, concurrent payroll calculations.
              </p>
            </div>
            <div className="pt-4 border-t border-[#2B0D3E]/10 flex items-center gap-2 text-xs font-black text-[#7A3F91]">
              <Zap size={14} /> Auto-Scaling Compute
            </div>
          </div>

          {/* Node Block 3 */}
          <div className="brutalist-box rounded-[32px] p-8 bg-white border-[3px] border-[#2B0D3E] shadow-[6px_6px_0px_0px_#2B0D3E] space-y-6 flex flex-col justify-between reveal-on-scroll reveal-right reveal-delay-300">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#2B0D3E] shadow-[inset_-3px_-3px_8px_rgba(122,63,145,0.15),_inset_3px_3px_8px_rgba(255,255,255,0.9),_4px_4px_0px_0px_#2B0D3E] text-[#7A3F91] flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-black text-[#2B0D3E] font-outfit">Immutable Security Ledger</h3>
              <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">
                Immutable audit trails tracking document reads, salary updates, and compliance approvals inside our secure portal.
              </p>
            </div>
            <div className="pt-4 border-t border-[#2B0D3E]/10 flex items-center gap-2 text-xs font-black text-[#7A3F91]">
              <CheckCircle2 size={14} /> AES-256 Keys Vault
            </div>
          </div>

        </div>
      </section>

      {/* 4. Claymorphic Graphic Display & Showcase */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto brutalist-box bg-white rounded-[36px] p-8 lg:p-10 text-left border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] space-y-6 reveal-on-scroll reveal-scale">
          <h3 className="text-2xl font-black text-[#2B0D3E] font-outfit tracking-tight">Isolated Database Schema Map</h3>
          <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">
            Visual breakdown of how database queries are mapped dynamically across tenant schema clusters without latency.
          </p>

          <div className="p-4 bg-[#F2EAF7]/50 rounded-2xl border-2 border-[#2B0D3E] relative overflow-hidden flex items-center justify-center min-h-[250px]">
            {/* Visual elements mapping */}
            <div className="flex flex-col sm:flex-row items-center gap-6 z-10 w-full justify-around p-4">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-[#2B0D3E] shadow-[inset_-3px_-3px_8px_rgba(122,63,145,0.2),_inset_3px_3px_8px_rgba(255,255,255,0.9),_4px_4px_0px_0px_#2B0D3E] flex flex-col items-center justify-center p-2 text-center">
                <Globe size={18} className="text-[#7A3F91]" />
                <span className="text-[9px] font-black uppercase mt-1">Tenant A</span>
              </div>
              <div className="w-8 h-[2px] bg-[#2B0D3E] hidden sm:block border-t border-dashed" />
              <div className="w-32 h-20 rounded-2xl bg-[#7A3F91] text-white border-2 border-[#2B0D3E] shadow-[inset_-3px_-3px_8px_rgba(43,13,62,0.3),_inset_3px_3px_8px_rgba(255,255,255,0.3),_4px_4px_0px_0px_#2B0D3E] flex flex-col items-center justify-center p-2 text-center">
                <Cpu size={18} />
                <span className="text-[9px] font-black uppercase mt-1">Virtual Mainframe</span>
              </div>
              <div className="w-8 h-[2px] bg-[#2B0D3E] hidden sm:block border-t border-dashed" />
              <div className="w-24 h-24 rounded-full bg-white border-2 border-[#2B0D3E] shadow-[inset_-3px_-3px_8px_rgba(122,63,145,0.2),_inset_3px_3px_8px_rgba(255,255,255,0.9),_4px_4px_0px_0px_#2B0D3E] flex flex-col items-center justify-center p-2 text-center">
                <Globe size={18} className="text-[#7A3F91]" />
                <span className="text-[9px] font-black uppercase mt-1">Tenant B</span>
              </div>
            </div>
            {/* Background design dots grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#2B0D3E_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-[#2B0D3E] text-[#F2EAF7] px-6 py-12 border-t-[3.5px] border-black mt-auto relative z-10">
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

export default InfrastructurePage;
