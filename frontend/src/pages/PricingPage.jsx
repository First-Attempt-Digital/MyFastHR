import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ArrowLeft, ArrowRight, HelpCircle,
  Sparkles, ShieldCheck, Zap, Globe, MessageSquare,
  ChevronDown, HelpCircle as HelpIcon, Users, CreditCard, Award
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import UniversalHeader from '../components/layout/UniversalHeader';
import UniversalFooter from '../components/layout/UniversalFooter';
import '../styles/landing.css';
import BlurText from '../components/common/BlurText';
import SplitText from '../components/common/SplitText';
import ScrollFloat from '../components/common/ScrollFloat';
import ScrollReveal from '../components/common/ScrollReveal';
import Antigravity from '../components/common/Antigravity';

const PricingPage = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('INR'); // INR or USD
  const [employeeCount, setEmployeeCount] = useState(50);
  const [activeFaq, setActiveFaq] = useState(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoError, setLogoError] = useState(true);

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
          if (branding.app_name) {
            setAppName(branding.app_name);
          }
        }
      } catch (err) {
        console.error('Failed to load branding:', err);
      }
    };
    loadBranding();
  }, []);

  const pricingPlans = {
    INR: [
      {
        name: "Starter",
        price: 4100,
        suffix: "/mo",
        badge: "Essential Setup",
        desc: "Ideal for growing startups needing clean workforce structure.",
        features: [
          "Up to 50 employees max",
          "Workforce Registry & Org Chart",
          "Basic Leave workflows",
          "Standard Email Support",
          "Isolated Client Database Schema"
        ],
        cta: "Spin Up Starter Sandbox",
        popular: false,
        icon: <Users size={20} />,
        grad: "from-purple-50/30 to-white",
        iconBg: "bg-purple-50 text-purple-600"
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
        popular: true,
        icon: <Zap size={20} />,
        grad: "from-purple-100/50 via-purple-50/20 to-white",
        iconBg: "bg-[#6028D9] text-white"
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
        popular: false,
        icon: <Award size={20} />,
        grad: "from-indigo-50/30 to-white",
        iconBg: "bg-indigo-50 text-indigo-600"
      }
    ],
    USD: [
      {
        name: "Starter",
        price: 49,
        suffix: "/mo",
        badge: "Essential Setup",
        desc: "Ideal for growing startups needing clean workforce structure.",
        features: [
          "Up to 50 employees max",
          "Workforce Registry & Org Chart",
          "Basic Leave workflows",
          "Standard Email Support",
          "Isolated Client Database Schema"
        ],
        cta: "Spin Up Starter Sandbox",
        popular: false,
        icon: <Users size={20} />,
        grad: "from-purple-50/30 to-white",
        iconBg: "bg-purple-50 text-purple-600"
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
        popular: true,
        icon: <Zap size={20} />,
        grad: "from-purple-100/50 via-purple-50/20 to-white",
        iconBg: "bg-[#6028D9] text-white"
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
        popular: false,
        icon: <Award size={20} />,
        grad: "from-indigo-50/30 to-white",
        iconBg: "bg-indigo-50 text-indigo-600"
      }
    ]
  };

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
    <div className="landing-body min-h-screen flex flex-col bg-white">
      <UniversalHeader />

      <section className="relative px-6 pt-16 pb-10 text-center bg-[#110e20] text-white overflow-hidden border-b border-[#6028D9]/30">
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
          <Antigravity
            count={120}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color={'#c084fc'}
            autoAnimate={true}
            particleVariance={1}
            particleShape="sphere"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-400/30 text-xs font-bold bg-[#6028D9]/40 text-purple-200 hover:bg-[#6028D9]/60 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to main landing
          </button>

          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
            <SplitText text="Transparent Pricing." className="inline-block" tag="span" textAlign="center" delay={30} />{' '}
            <span className="text-[#c084fc]">
              <BlurText text="Enterprise Scaled." className="inline-flex" />
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-purple-200 max-w-2xl mx-auto leading-relaxed">
            Choose the sandbox infrastructure that matches your organization size. No hidden licensing, no setup barriers.
          </p>

          {/* Currency Toggle */}
          <div className="pt-6 flex justify-center">
            <div className="inline-flex items-center gap-1.5 p-1.5 bg-[#1c1535] border border-purple-900/40 rounded-2xl shadow-2xl">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currency === 'INR' ? 'bg-[#6028D9] text-white shadow-lg' : 'text-purple-300 hover:text-white'
                }`}
              >
                ₹ INR Pricing
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currency === 'USD' ? 'bg-[#6028D9] text-white shadow-lg' : 'text-purple-300 hover:text-white'
                }`}
              >
                $ USD Global
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pricing Cards */}
      <section className="px-6 pt-12 pb-16 bg-[#F8FAFC] relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch relative z-10">
          {pricingPlans[currency].map((plan, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-b ${plan.grad} rounded-3xl p-8 hover-float transition-all duration-350 relative shadow-lg hover:shadow-2xl flex flex-col justify-between border ${
                plan.popular ? 'border-[#6028D9] ring-4 ring-[#6028D9]/10 shadow-[#6028D9]/5 shadow-2xl' : 'border-gray-200/60'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#6028D9] to-[#8B5CF6] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md z-30">
                  Popular Choice
                </span>
              )}

              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <span className="badge-purple bg-purple-100/60 text-[#6028D9] border border-purple-250/20 rounded-lg text-xs font-bold px-3 py-1">
                    {plan.badge}
                  </span>
                  <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center shadow-inner`}>
                    {plan.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1 py-5 border-y border-gray-200/60">
                  <span className="text-5xl font-black text-gray-900 tracking-tight">
                    <span className="text-2xl font-bold text-[#6028D9] mr-0.5">{currency === 'INR' ? '₹' : '$'}</span>
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{plan.suffix}</span>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block">Included Capabilities</span>
                  <div className="space-y-3.5">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-3 text-xs text-gray-700 font-semibold">
                        <div className="w-5 h-5 rounded-full bg-purple-50 text-[#6028D9] flex items-center justify-center shrink-0 border border-purple-100">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>
      </section>

      {/* 4. Interactive Live Estimate Calculator */}
      <section className="px-6 py-16 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto bg-gradient-to-tr from-white via-white to-purple-50/20 rounded-3xl p-8 lg:p-10 text-left border border-[#E9D5FF] shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6028D9] flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Dynamic Scale & Estimate Calculator</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
              Drag the slider to match your exact workforce headcount. Our cloud infrastructure scales resources dynamically to prevent performance bottlenecks.
            </p>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <span className="text-gray-600">Active Employee Nodes:</span>
              <span className="text-sm text-[#6028D9] bg-purple-100/60 px-4 py-1.5 rounded-full border border-purple-200 font-black">
                {employeeCount} Members
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="range" min="5" max="1000" value={employeeCount}
                onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
                className="w-full accent-[#6028D9] h-2.5 bg-gray-100 rounded-lg cursor-pointer transition-all"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                <span>5 (Starter)</span>
                <span>250 (Growth)</span>
                <span>1000+ (Enterprise)</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-purple-50 to-white border border-purple-100/80 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">
            <div className="text-left space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">Estimated monthly setup cost</span>
              <span className="text-3xl font-black text-[#6028D9]">
                <span className="text-xl font-bold mr-0.5">{currency === 'INR' ? '₹' : '$'}</span>
                {calculateDynamicEstimate().toLocaleString()}
                <span className="text-sm font-semibold text-gray-400">/mo</span>
              </span>
            </div>
            <button onClick={() => navigate('/login')} className="btn-primary px-8 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-none shadow-md">
              Spin Up Setup Now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. FAQs Section */}
      <section className="px-6 py-24 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Frequently Answered Queries</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto block leading-relaxed">
              Get direct clarity regarding database isolation models, deployment rules, and billing cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`rounded-2xl bg-white border border-slate-200/60 overflow-hidden shadow-sm transition-all duration-300 ${
                    isOpen ? 'border-[#E9D5FF] ring-2 ring-purple-50' : 'hover:border-purple-200'
                  }`}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-gray-800 cursor-pointer border-none bg-transparent"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <div className={`w-7 h-7 rounded-full bg-purple-50 text-[#6028D9] flex items-center justify-center transition-transform shrink-0 ${isOpen ? 'rotate-180 bg-[#6028D9] text-white' : ''}`}>
                      <ChevronDown size={14} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-gray-500 border-t border-slate-50 bg-purple-50/10 leading-relaxed font-semibold">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <UniversalFooter />
    </div>
  );
};

export default PricingPage;
