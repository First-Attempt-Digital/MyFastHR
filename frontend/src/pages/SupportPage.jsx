import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, ArrowLeft, ArrowRight, BookOpen, 
  MessageSquare, FileText, Settings, ShieldAlert,
  Search, ExternalLink, Send, CheckCircle2
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const SupportPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);
  
  // Ticket Form state
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

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

  const docArticles = [
    {
      id: "art-1",
      title: "How to configure custom allowance formulas?",
      category: "payroll",
      readTime: "3 min read",
      desc: "Step-by-step setup guides to map custom HRA, dynamic variables, and compliance splits inside your Payroll Settings dashboard."
    },
    {
      id: "art-2",
      title: "Syncing physical biometric machine logs",
      category: "attendance",
      readTime: "5 min read",
      desc: "API credentials mapping and secure token validation guidelines for syncing local fingerprint and face scanner data."
    },
    {
      id: "art-3",
      title: "Super Admin KYC verification pipeline",
      category: "security",
      readTime: "4 min read",
      desc: "Learn about file level AES-256 decryption steps and audit log traces inside the employee Compliance Vault."
    },
    {
      id: "art-4",
      title: "Mapping reporting manager trees",
      category: "workforce",
      readTime: "2 min read",
      desc: "Add multiple org hierarchy loops and manager-level approval trees directly inside the workforce profile desks."
    },
    {
      id: "art-5",
      title: "Generating statutory PF / ESIC sheets",
      category: "payroll",
      readTime: "3 min read",
      desc: "Auto-compile compliant bank export ledger files at the end of the monthly payroll cycle."
    },
    {
      id: "art-6",
      title: "Configuring late penalty rules",
      category: "attendance",
      readTime: "3 min read",
      desc: "Define custom grace periods, late thresholds, and salary half-day deduction rules."
    }
  ];

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setTicketForm({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  const filteredArticles = docArticles.filter(art => {
    const matchesCategory = activeCategory === 'all' || art.category === activeCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

      {/* 2. Hero Search Banner */}
      <section className="px-6 py-12 lg:py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6 reveal-on-scroll reveal-up">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-black uppercase text-[#7A3F91] hover:scale-105 transition-transform"
          >
            <ArrowLeft size={14} /> Back to main landing
          </button>
          
          <h1 className="text-4xl sm:text-6xl font-black text-[#2B0D3E] font-outfit leading-none tracking-tight">
            Support Center <br/>
            <span className="text-[#7A3F91] underline decoration-[#C59DD9] decoration-wavy">& Documentation.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#2B0D3E]/80 max-w-xl mx-auto leading-relaxed">
            Search developer APIs setup guides, company settings help files, and biometric sync instructions.
          </p>

          {/* Search box input */}
          <div className="max-w-lg mx-auto pt-4 relative">
            <div className="flex items-center bg-white border-[3px] border-[#2B0D3E] rounded-2xl shadow-[4px_4px_0px_0px_#2B0D3E] overflow-hidden px-4">
              <Search className="text-[#2B0D3E]/50 shrink-0" size={20} />
              <input 
                type="text" 
                placeholder="Search troubleshooting articles (e.g. biometric, HRA, PF)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 px-3 outline-none text-xs font-bold text-[#2B0D3E] placeholder-[#2B0D3E]/40 bg-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category selector & Docs list */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Category selector */}
          <div className="lg:col-span-3 space-y-3 reveal-on-scroll reveal-left">
            <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-widest text-left block pl-2">Filter Category</span>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-hide">
              {[
                { id: 'all', label: 'All Articles', icon: <BookOpen size={16} /> },
                { id: 'payroll', label: 'Payroll Engine', icon: <FileText size={16} /> },
                { id: 'attendance', label: 'Attendance Muster', icon: <Settings size={16} /> },
                { id: 'workforce', label: 'Workforce Registry', icon: <HelpCircle size={16} /> },
                { id: 'security', label: 'Security & Compliance', icon: <ShieldAlert size={16} /> }
              ].map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-black text-xs uppercase tracking-wider text-left transition-all shrink-0 ${
                      isActive 
                        ? 'bg-[#7A3F91] text-white border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E]' 
                        : 'bg-white text-[#2B0D3E] border-[#2B0D3E]/20 hover:border-[#2B0D3E] hover:bg-[#F2EAF7]/30'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right documentation matching list */}
          <div className="lg:col-span-9 space-y-6 reveal-on-scroll reveal-right">
            <div className="flex justify-between items-center pl-2">
              <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-widest">
                Showing {filteredArticles.length} Documentation Matches
              </span>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((art) => (
                  <div 
                    key={art.id} 
                    className="brutalist-box rounded-3xl p-6 bg-white border-[2.5px] border-[#2B0D3E] shadow-[4px_4px_0px_0px_#2B0D3E] hover:scale-[1.01] transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#7A3F91] bg-[#F2EAF7] px-2 py-0.5 rounded border border-[#2B0D3E]/10">
                          {art.category}
                        </span>
                        <span className="text-[9px] font-bold text-[#2B0D3E]/50">{art.readTime}</span>
                      </div>
                      <h4 className="text-base font-black text-[#2B0D3E] font-outfit leading-snug">{art.title}</h4>
                      <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">{art.desc}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#2B0D3E]/10 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-[#7A3F91] tracking-wider cursor-pointer hover:underline flex items-center gap-1.5">
                        Read Full Article <ExternalLink size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="brutalist-box rounded-3xl p-10 bg-white border-[2.5px] border-[#2B0D3E] text-center space-y-3 shadow-[4px_4px_0px_0px_#2B0D3E]">
                <h4 className="text-base font-black text-[#2B0D3E]">No Troubleshooting Files Found</h4>
                <p className="text-xs font-semibold text-[#2B0D3E]/60 max-w-sm mx-auto">
                  Try searching other keywords or contact support through the ticket form down below.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Contact Form Ticket Generation */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto brutalist-box bg-[#F2EAF7] rounded-[36px] p-8 lg:p-10 text-left border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] space-y-8 relative overflow-hidden reveal-on-scroll reveal-scale">
          
          <div className="flex items-center gap-3">
            <MessageSquare className="text-[#7A3F91]" size={24} />
            <h3 className="text-xl font-black text-[#2B0D3E] font-outfit">Open Support Ticket Node</h3>
          </div>
          <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">
            Need customized telemetry hooks or isolated VM migration? Submit details to connect with engineering directly.
          </p>

          {formSubmitted ? (
            <div className="p-8 bg-white border-[3px] border-[#2B0D3E] rounded-3xl text-center space-y-4 shadow-[4px_4px_0px_0px_#2B0D3E] animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F2EAF7] border-2 border-[#2B0D3E] text-[#7A3F91] mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-[#2B0D3E]">Ticket Registered Successfully</h4>
                <p className="text-xs font-semibold text-[#2B0D3E]/60 mt-1">Our engineering team will revert on your registered email within 2 hours.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTicketSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#2B0D3E]/70 block pl-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
                    placeholder="Enter name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#2B0D3E] bg-white text-xs font-bold text-[#2B0D3E] outline-none shadow-[2px_2px_0px_0px_#2B0D3E] focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#2B0D3E]/70 block pl-1">Registered Corporate Email</label>
                  <input 
                    type="email" 
                    required
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm({...ticketForm, email: e.target.value})}
                    placeholder="Enter corporate email"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#2B0D3E] bg-white text-xs font-bold text-[#2B0D3E] outline-none shadow-[2px_2px_0px_0px_#2B0D3E] focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#2B0D3E]/70 block pl-1">Subject / System Module</label>
                <input 
                  type="text" 
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  placeholder="e.g. Biometric sync fail, allowances taxation split"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#2B0D3E] bg-white text-xs font-bold text-[#2B0D3E] outline-none shadow-[2px_2px_0px_0px_#2B0D3E]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#2B0D3E]/70 block pl-1">Message Description</label>
                <textarea 
                  rows="4"
                  required
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                  placeholder="Provide logs or configuration error logs..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#2B0D3E] bg-white text-xs font-bold text-[#2B0D3E] outline-none shadow-[2px_2px_0px_0px_#2B0D3E]"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 brutalist-btn text-xs rounded-xl flex items-center justify-center gap-2"
              >
                Send Support Ticket
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 5. Footer */}
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

export default SupportPage;
