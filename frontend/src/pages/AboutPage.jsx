import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Shield, Cpu, 
  MapPin, Calendar, Award, Star, ArrowRight
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const milestones = [
  {
    year: "2024",
    title: "Founding in Jaipur",
    desc: "MyFastHR was founded with a single mission: to eliminate the paperwork and manual audits from small-business HR routines."
  },
  {
    year: "2025",
    title: "Isolated Nodes Launch",
    desc: "Engineered and deployed isolated logical schema nodes for corporate tenants, bringing bank-grade isolation security to the platform."
  },
  {
    year: "2026",
    title: "Real-Time Telemetry Muster",
    desc: "Synced biometric terminals directly with SaaS ledger engines, enabling automated late penalties and overtime logs computation in real time."
  }
];

const values = [
  {
    icon: <Cpu size={24} />,
    title: "Pure Automation",
    desc: "We build systems that compute splits, rosters, and penalties automatically, freeing managers for strategic tasks."
  },
  {
    icon: <Shield size={24} />,
    title: "Absolute Isolation",
    desc: "Your employee data deserves isolated parameters. We guarantee structural cross-tenant security locks."
  },
  {
    icon: <Users size={24} />,
    title: "Human Focus",
    desc: "Software should serve humans, not the other way around. Every check-in profile card is made clean and easy."
  }
];

const team = [
  {
    name: "Robin H.",
    role: "VP Engineering",
    desc: "Distributed systems engineer. Built the core logical database node shard infrastructure.",
    avatarText: "RH"
  },
  {
    name: "Meera Sen",
    role: "Compliance Director",
    desc: "Statutory tax audit specialist. Oversees PF/ESIC formulas accuracy audits.",
    avatarText: "MS"
  },
  {
    name: "Vikram Raj",
    role: "Chief Security Architect",
    desc: "Cryptographic protocol designer. Managed the AES-256 vault configurations.",
    avatarText: "VR"
  }
];

const AboutPage = () => {
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

      {/* 1. Header Navbar */}
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

      {/* 2. Hero Section */}
      <section className="px-6 py-12 lg:py-20 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-6 reveal-on-scroll reveal-up">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-black uppercase text-[#7A3F91] hover:scale-105 transition-transform"
          >
            <ArrowLeft size={14} /> Back to main landing
          </button>
          
          <h1 className="text-4xl sm:text-6xl font-black text-[#2B0D3E] font-outfit leading-none tracking-tight">
            Our Story. <br/>
            <span className="text-[#7A3F91] underline decoration-[#C59DD9] decoration-wavy">Built Differently.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#2B0D3E]/80 max-w-xl mx-auto leading-relaxed">
            We are a small team of engineers, security architects, and compliance experts building the future of autonomous workplace operations from Jaipur.
          </p>
        </div>
      </section>

      {/* 3. Core Values Cards */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((val, idx) => {
            const delays = ['reveal-delay-100', 'reveal-delay-200', 'reveal-delay-300'];
            return (
              <div 
                key={idx}
                className={`brutalist-box rounded-[32px] p-8 bg-white border-[3px] border-[#2B0D3E] shadow-[6px_6px_0px_0px_#2B0D3E] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#2B0D3E] transition-all space-y-4 text-left reveal-on-scroll reveal-up ${delays[idx]}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#F2EAF7] border-2 border-[#2B0D3E] text-[#7A3F91] flex items-center justify-center shadow-[3.5px_3.5px_0px_0px_#2B0D3E]">
                  {val.icon}
                </div>
                <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">{val.title}</h3>
                <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Journey Milestones Timeline */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3 reveal-on-scroll reveal-up">
            <h2 className="text-3xl font-black text-[#2B0D3E] font-outfit tracking-tight">Our Journey Node</h2>
            <p className="text-xs font-semibold text-[#2B0D3E]/60 max-w-sm mx-auto">
              How we scaled from Jaipur code repositories to serving corporate enterprise systems.
            </p>
          </div>

          <div className="relative border-l-[3.5px] border-dashed border-[#2B0D3E] ml-4 md:ml-32 space-y-12 py-4">
            {milestones.map((mil, idx) => (
              <div 
                key={idx}
                className="relative pl-8 md:pl-10 text-left reveal-on-scroll reveal-right"
              >
                {/* Year Badge left-aligned on desktop, stacked on mobile */}
                <div className="absolute left-[-11.5px] top-1.5 w-5 h-5 rounded-full bg-[#7A3F91] border-4 border-[#2B0D3E]" />
                
                <div className="md:absolute md:left-[-150px] md:top-0 w-24 text-left">
                  <span className="text-xl font-black text-white bg-[#7A3F91] border-2 border-[#2B0D3E] px-3.5 py-1 rounded-xl shadow-[3px_3px_0px_0px_#2B0D3E] font-outfit">
                    {mil.year}
                  </span>
                </div>

                <div className="brutalist-box rounded-3xl p-6 bg-white border-[2.5px] border-[#2B0D3E] shadow-[4px_4px_0px_0px_#2B0D3E] mt-4 md:mt-0 max-w-2xl">
                  <h4 className="text-base font-black text-[#2B0D3E] font-outfit leading-none mb-2">{mil.title}</h4>
                  <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">{mil.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Team Grid */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3 reveal-on-scroll reveal-up">
            <h2 className="text-3xl font-black text-[#2B0D3E] font-outfit tracking-tight">Core Leadership Nodes</h2>
            <p className="text-xs font-semibold text-[#2B0D3E]/60 max-w-sm mx-auto">
              Meet the system operators coordinating the platform mainframe.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, idx) => {
              const delays = ['reveal-delay-100', 'reveal-delay-200', 'reveal-delay-300'];
              return (
                <div 
                  key={idx}
                  className={`brutalist-box rounded-[32px] p-6 bg-white border-[3px] border-[#2B0D3E] shadow-[6px_6px_0px_0px_#2B0D3E] text-center space-y-4 hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#2B0D3E] transition-all reveal-on-scroll reveal-up ${delays[idx]}`}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C59DD9] to-[#7A3F91] border-[3px] border-[#2B0D3E] shadow-[inset_-4px_-4px_10px_rgba(43,13,62,0.35),_inset_4px_4px_10px_rgba(255,255,255,0.4),_4px_4px_0px_0px_#2B0D3E] flex items-center justify-center text-white font-black text-2xl font-outfit mx-auto float-animation">
                    {member.avatarText}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#2B0D3E] font-outfit leading-none">{member.name}</h4>
                    <span className="text-[10px] font-black text-[#7A3F91] uppercase tracking-wider block mt-1">{member.role}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed px-2">{member.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto brutalist-box bg-[#F2EAF7] rounded-[36px] p-8 lg:p-10 text-center border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] space-y-6 reveal-on-scroll reveal-scale">
          <h3 className="text-2xl sm:text-3xl font-black text-[#2B0D3E] font-outfit leading-none tracking-tight">Ready to verify compliance schemas?</h3>
          <p className="text-xs font-semibold text-[#2B0D3E]/70 max-w-md mx-auto leading-relaxed">
            Deploy an isolated sandbox in under 10 minutes. Zero legacy setup hooks, zero credit cards required.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 brutalist-btn text-xs rounded-xl flex items-center justify-center gap-2"
            >
              Get Started Admin Login
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => navigate('/pricing')}
              className="px-8 py-3.5 brutalist-btn-secondary text-xs rounded-xl flex items-center justify-center gap-2"
            >
              View Pricing Matrix
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
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

export default AboutPage;
