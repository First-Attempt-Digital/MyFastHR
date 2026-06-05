import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, ArrowLeft, ArrowRight, HelpCircle, 
  Sparkles, ShieldCheck, Zap, Globe, MessageSquare 
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const PricingPage = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('INR'); // INR or USD
  const [employeeCount, setEmployeeCount] = useState(50);
  const [activeFaq, setActiveFaq] = useState(null);
  
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

  const pricingPlans = {
    INR: [
      {
        name: "Starter",
        price: 4100,
        suffix: "/mo",
        badge: "Essential",
        desc: "Ideal for growing startups needing clean workforce structure.",
        features: [
          "Up to 50 employees max",
          "Workforce Registry & Org Chart",
          "Basic Leave workflows",
          "Standard Email Support",
          "Isolated Client Database Schema"
        ],
        cta: "Spin Up Starter Sandbox",
        color: "bg-white",
        popular: false
      },
      {
        name: "Growth",
        price: 8200,
        suffix: "/mo",
        badge: "Most Popular",
        desc: "Advanced compliance and automatic payroll computations.",
        features: [
          "Up to 250 employees max",
          "SaaS Payroll Engine (PF/ESIC splits)",
          "Biometric Attendance Muster Sync",
          "Onboarding pipeline manager",
          "Priority Chat & Call Support"
        ],
        cta: "Deploy Growth Mainframe",
        color: "bg-[#7A3F91] text-white",
        popular: true
      },
      {
        name: "Enterprise",
        price: 20500,
        suffix: "/mo",
        badge: "Scale & Trust",
        desc: "Bespoke setups and maximum priority integrations.",
        features: [
          "Unlimited employees scale",
          "Compliance Vault with AES-256 keys",
          "Custom API sync hooks",
          "Isolated physical virtual VM node",
          "Dedicated Account Director"
        ],
        cta: "Schedule Custom Setup",
        color: "bg-white",
        popular: false
      }
    ],
    USD: [
      {
        name: "Starter",
        price: 49,
        suffix: "/mo",
        badge: "Essential",
        desc: "Ideal for growing startups needing clean workforce structure.",
        features: [
          "Up to 50 employees max",
          "Workforce Registry & Org Chart",
          "Basic Leave workflows",
          "Standard Email Support",
          "Isolated Client Database Schema"
        ],
        cta: "Spin Up Starter Sandbox",
        color: "bg-white",
        popular: false
      },
      {
        name: "Growth",
        price: 99,
        suffix: "/mo",
        badge: "Most Popular",
        desc: "Advanced compliance and automatic payroll computations.",
        features: [
          "Up to 250 employees max",
          "SaaS Payroll Engine (PF/ESIC splits)",
          "Biometric Attendance Muster Sync",
          "Onboarding pipeline manager",
          "Priority Chat & Call Support"
        ],
        cta: "Deploy Growth Mainframe",
        color: "bg-[#7A3F91] text-white",
        popular: true
      },
      {
        name: "Enterprise",
        price: 249,
        suffix: "/mo",
        badge: "Scale & Trust",
        desc: "Bespoke setups and maximum priority integrations.",
        features: [
          "Unlimited employees scale",
          "Compliance Vault with AES-256 keys",
          "Custom API sync hooks",
          "Isolated physical virtual VM node",
          "Dedicated Account Director"
        ],
        cta: "Schedule Custom Setup",
        color: "bg-white",
        popular: false
      }
    ]
  };

  // Dynamic estimate calculation based on slider
  const calculateDynamicEstimate = () => {
    let baseRate = currency === 'INR' ? 45 : 0.6; // Price per employee
    let calculated = employeeCount * baseRate;
    let minBase = currency === 'INR' ? 2500 : 35;
    return Math.max(minBase, Math.round(calculated));
  };

  const faqs = [
    {
      q: "How does the isolated database setup work?",
      a: "Unlike legacy multi-tenant systems, we assign an isolated virtual schema node to each enterprise. This guarantees that your organization database is structurally separated, ensuring zero leakage and rapid performance."
    },
    {
      q: "Can I upgrade or downgrade my tier at any time?",
      a: "Yes. Tiers can be scaled directly from the Super Admin console or via account manager support. Downgrades apply at the end of the current billing cycle."
    },
    {
      q: "Are there any hidden biometric integration charges?",
      a: "Standard Cloud Biometric API logs and telemetry sync are fully included in the Growth and Enterprise models. There are no additional per-device license costs."
    },
    {
      q: "What security compliance do you use?",
      a: "All personal employee assets and files inside the Compliance Vault are encrypted at-rest using AES-256 keys and accessible only via supervised Super Admin approval pipelines."
    }
  ];

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
            Transparent Pricing. <br/>
            <span className="text-[#7A3F91] underline decoration-[#C59DD9] decoration-wavy">Enterprise Scaled.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#2B0D3E]/80 max-w-xl mx-auto leading-relaxed">
            Choose the sandbox infrastructure that matches your organization size. No hidden licensing, no setup barriers.
          </p>

          {/* Currency Toggle */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 bg-white border-[2.5px] border-[#2B0D3E] rounded-2xl shadow-[3px_3px_0px_0px_#2B0D3E]">
              <button 
                onClick={() => setCurrency('INR')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                  currency === 'INR' ? 'bg-[#7A3F91] text-white' : 'text-[#2B0D3E] hover:bg-[#F2EAF7]'
                }`}
              >
                ₹ INR Pricing
              </button>
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                  currency === 'USD' ? 'bg-[#7A3F91] text-white' : 'text-[#2B0D3E] hover:bg-[#F2EAF7]'
                }`}
              >
                $ USD Global
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pricing Cards Section */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {pricingPlans[currency].map((plan, idx) => {
            const directions = ['reveal-left', 'reveal-up', 'reveal-right'];
            const delays = ['reveal-delay-100', 'reveal-delay-200', 'reveal-delay-300'];
            return (
              <div 
                key={idx}
                className={`w-full brutalist-box rounded-[32px] p-8 text-left border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] flex flex-col justify-between relative reveal-on-scroll ${directions[idx]} ${delays[idx]} ${
                  plan.popular ? 'bg-[#F2EAF7]/40 ring-4 ring-[#7A3F91]/20 scale-100 lg:scale-[1.03]' : 'bg-white'
                }`}
              >
              {plan.popular && (
                <span className="absolute top-5 right-5 px-3 py-1 bg-[#7A3F91] text-white text-[9px] font-black uppercase tracking-wider rounded-lg border-2 border-[#2B0D3E] shadow-[2px_2px_0px_0px_#2B0D3E]">
                  Popular Choice
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#7A3F91] tracking-wider bg-[#F2EAF7] px-2.5 py-1 rounded-md border border-[#2B0D3E]/20">
                    {plan.badge}
                  </span>
                  <h3 className="text-2xl font-black text-[#2B0D3E] font-outfit mt-4">{plan.name}</h3>
                  <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed mt-2">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1 py-4 border-y border-[#2B0D3E]/10">
                  <span className="text-4xl font-black text-[#2B0D3E] font-outfit">
                    {currency === 'INR' ? '₹' : '$'}{plan.price.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[#2B0D3E]/60">{plan.suffix}</span>
                </div>

                <div className="space-y-3.5">
                  <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-widest block">Included Capabilities</span>
                  <div className="space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-3 text-xs font-bold text-[#2B0D3E]">
                        <Check size={16} className="text-[#7A3F91] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-[#2B0D3E]/10">
                <button 
                  onClick={() => navigate('/login')}
                  className={`w-full py-4 text-xs font-black uppercase tracking-wider rounded-xl border-[2.5px] border-[#2B0D3E] transition-all shadow-[4px_4px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#2B0D3E] flex items-center justify-center gap-2 ${
                    plan.popular ? 'bg-[#7A3F91] text-white' : 'bg-white text-[#2B0D3E]'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );})}
        </div>
      </section>

      {/* 4. Interactive Live Estimate Calculator Slider */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto brutalist-box bg-white rounded-[32px] p-8 lg:p-10 text-left border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] space-y-8 reveal-on-scroll reveal-scale">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#7A3F91]" size={24} />
            <h3 className="text-xl font-black text-[#2B0D3E] font-outfit">Dynamic Estimate Calculator</h3>
          </div>
          <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed">
            Drag the slider to matches your exact headcount schema. Plan dynamically for scaling company volumes.
          </p>

          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center text-sm font-black text-[#2B0D3E]">
              <span>Active Employee Nodes:</span>
              <span className="text-lg text-[#7A3F91] font-outfit bg-[#F2EAF7] px-3.5 py-1.5 rounded-xl border-2 border-[#2B0D3E]">
                {employeeCount} Members
              </span>
            </div>

            <input 
              type="range" 
              min="5" 
              max="1000" 
              value={employeeCount} 
              onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
              className="w-full accent-[#7A3F91] h-3 bg-[#F2EAF7] border-2 border-[#2B0D3E] rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-black text-[#2B0D3E]/50 tracking-wider">
              <span>5 Members</span>
              <span>1000 Members</span>
            </div>
          </div>

          <div className="p-6 bg-[#F2EAF7] border-[2.5px] border-[#2B0D3E] rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-[#7A3F91] tracking-wider block">Estimated infrastructure budget</span>
              <span className="text-3xl font-black text-[#2B0D3E] font-outfit">
                {currency === 'INR' ? '₹' : '$'}{calculateDynamicEstimate().toLocaleString()}
                <span className="text-xs font-bold text-[#2B0D3E]/60">/mo</span>
              </span>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 brutalist-btn text-xs rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Spin Up Setup Now
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. FAQs Section */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-8 reveal-on-scroll reveal-up">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-[#2B0D3E] font-outfit tracking-tight">Frequently Answered Queries</h2>
            <p className="text-xs font-semibold text-[#2B0D3E]/60 max-w-md mx-auto">
              Get direct clarity regarding multi-tenant deployment rules and payment methods.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="brutalist-box rounded-2xl bg-white border-[2.5px] border-[#2B0D3E] shadow-[4px_4px_0px_0px_#2B0D3E] overflow-hidden"
                >
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 flex items-center justify-between text-left font-black text-sm text-[#2B0D3E]"
                  >
                    <span>{faq.q}</span>
                    <HelpCircle size={18} className={`text-[#7A3F91] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs font-semibold text-[#2B0D3E]/75 border-t border-[#2B0D3E]/10 bg-[#F2EAF7]/20 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
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

export default PricingPage;
