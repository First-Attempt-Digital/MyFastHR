import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, ArrowLeft, ArrowRight, BookOpen, 
  MessageSquare, FileText, Settings, ShieldAlert,
  Search, ExternalLink, Send, CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import UniversalHeader from '../components/layout/UniversalHeader';
import UniversalFooter from '../components/layout/UniversalFooter';
import '../styles/landing.css';
import BlurText from '../components/common/BlurText';
import SplitText from '../components/common/SplitText';
import ScrollFloat from '../components/common/ScrollFloat';
import ScrollReveal from '../components/common/ScrollReveal';
import VariableProximity from '../components/common/VariableProximity';
import Antigravity from '../components/common/Antigravity';

const SupportPage = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const supportContainerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const [logoUrl, setLogoUrl] = useState('');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoError, setLogoError] = useState(true);
  
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

  const toggleDropdown = (menuName) => {
    if (activeDropdown === menuName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(menuName);
    }
  };

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
    <div ref={pageRef} className="landing-body min-h-screen flex flex-col bg-white">
      <UniversalHeader />

      {/* 2. Hero Header */}
      <section className="relative px-6 py-16 text-center bg-[#F1F5F9]/60 overflow-hidden">
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
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 badge-purple text-xs font-bold bg-[#E9D5FF] text-[#6028D9] hover:opacity-90 cursor-pointer border-none"
          >
            <ArrowLeft size={14} /> 
            <VariableProximity
              label="Back to main landing"
              fromFontVariationSettings="'wght' 700"
              toFontVariationSettings="'wght' 950"
              containerRef={pageRef}
              radius={120}
              falloff="linear"
            />
          </button>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] tracking-tight leading-tight">
            <SplitText text="Support Center" className="inline-block" tag="span" textAlign="center" delay={30} /> <span className="text-[#6028D9]"><BlurText text="& Documentation" className="inline-flex" /></span>
          </h1>
          <SplitText 
            text="Search developer APIs setup guides, company settings help files, and biometric sync instructions." 
            className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed block"
            tag="p"
            textAlign="center"
            splitType="words"
            delay={20}
            duration={0.8}
          />

          {/* Search box input */}
          <div className="max-w-lg mx-auto pt-4 relative">
            <div className="flex items-center bg-white border border-[#E9D5FF] rounded-xl shadow-sm overflow-hidden px-4">
              <Search className="text-gray-400 shrink-0" size={18} />
              <input 
                type="text" 
                placeholder="Search troubleshooting articles (e.g. biometric, HRA, PF)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3.5 px-2 outline-none text-xs font-medium text-gray-700 placeholder-gray-400 bg-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Contact Form Support Ticket */}
      <section className="px-6 py-12">
        <div ref={supportContainerRef} className="max-w-3xl mx-auto bg-purple-50 rounded-2xl p-6 lg:p-8 text-left border border-purple-100 space-y-6" style={{ position: 'relative' }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="text-[#6028D9]" size={22} />
            <h3 className="text-lg font-bold text-gray-950">
              <VariableProximity
                label="Open Support Ticket Node"
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 900"
                containerRef={supportContainerRef}
                radius={120}
                falloff="linear"
              />
            </h3>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed block text-left" style={{ position: 'relative' }}>
            <VariableProximity
              label="Need customized telemetry hooks or isolated VM migration? Submit details to connect with engineering directly."
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={supportContainerRef}
              radius={120}
              falloff="linear"
            />
          </div>

          {formSubmitted ? (
            <div className="p-8 bg-white border border-gray-100 rounded-xl text-center space-y-4 shadow-sm">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 text-[#6028D9] mx-auto">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">
                  <VariableProximity
                    label="Ticket Registered Successfully"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={supportContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  <VariableProximity
                    label="Our engineering team will revert on your registered email within 2 hours."
                    fromFontVariationSettings="'wght' 500"
                    toFontVariationSettings="'wght' 900"
                    containerRef={supportContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 block pl-1">
                    <VariableProximity
                      label="Full Name"
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={supportContainerRef}
                      radius={120}
                      falloff="linear"
                    />
                  </label>
                  <input 
                    type="text" required value={ticketForm.name}
                    onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
                    placeholder="Enter name"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E9D5FF] bg-white text-xs font-semibold outline-none focus:border-[#6028D9]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 block pl-1">
                    <VariableProximity
                      label="Corporate Email"
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={supportContainerRef}
                      radius={120}
                      falloff="linear"
                    />
                  </label>
                  <input 
                    type="email" required value={ticketForm.email}
                    onChange={(e) => setTicketForm({...ticketForm, email: e.target.value})}
                    placeholder="Enter email"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E9D5FF] bg-white text-xs font-semibold outline-none focus:border-[#6028D9]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 block pl-1">
                  <VariableProximity
                    label="Subject / System Module"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={supportContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </label>
                <input 
                  type="text" required value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  placeholder="e.g. Biometric sync fail, allowances taxation split"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E9D5FF] bg-white text-xs font-semibold outline-none focus:border-[#6028D9]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 block pl-1">
                  <VariableProximity
                    label="Message Description"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={supportContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </label>
                <textarea 
                  rows="4" required value={ticketForm.message}
                  onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                  placeholder="Provide logs or configuration error logs..."
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E9D5FF] bg-white text-xs font-semibold outline-none focus:border-[#6028D9]"
                />
              </div>

              <button type="submit" className="w-full btn-primary py-3.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <VariableProximity
                  label="Send Support Ticket"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={supportContainerRef}
                  radius={120}
                  falloff="linear"
                /> 
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 4. Category selector & Docs list */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Category selector */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-2 block">
              <VariableProximity
                label="Filter Category"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </span>
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
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-wider text-left transition-all shrink-0 cursor-pointer ${
                      isActive 
                        ? 'bg-[#6028D9] text-white border-[#6028D9] shadow-sm' 
                        : 'bg-white text-gray-600 border-[#E9D5FF] hover:bg-gray-50'
                    }`}
                  >
                    {cat.icon}
                    <VariableProximity
                      label={cat.label}
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right documentation list */}
          <div className="lg:col-span-9 space-y-6 text-left">
            <div className="flex justify-between items-center pl-2">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                <VariableProximity
                  label={`Showing ${filteredArticles.length} Documentation Matches`}
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={pageRef}
                  radius={120}
                  falloff="linear"
                />
              </span>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((art) => (
                  <div key={art.id} className="premium-card p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="badge-purple">
                          <VariableProximity
                            label={art.category}
                            fromFontVariationSettings="'wght' 700"
                            toFontVariationSettings="'wght' 950"
                            containerRef={pageRef}
                            radius={120}
                            falloff="linear"
                          />
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          <VariableProximity
                            label={art.readTime}
                            fromFontVariationSettings="'wght' 500"
                            toFontVariationSettings="'wght' 900"
                            containerRef={pageRef}
                            radius={120}
                            falloff="linear"
                          />
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        <VariableProximity
                          label={art.title}
                          fromFontVariationSettings="'wght' 700"
                          toFontVariationSettings="'wght' 950"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <VariableProximity
                          label={art.desc}
                          fromFontVariationSettings="'wght' 400"
                          toFontVariationSettings="'wght' 900"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#6028D9] cursor-pointer hover:underline flex items-center gap-1">
                        <VariableProximity
                          label="Read Full Article"
                          fromFontVariationSettings="'wght' 700"
                          toFontVariationSettings="'wght' 950"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                        <ExternalLink size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 bg-white border border-[#E9D5FF] rounded-2xl text-center space-y-2">
                <h4 className="text-sm font-bold text-gray-800">
                  <VariableProximity
                    label="No Troubleshooting Files Found"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  <VariableProximity
                    label="Try searching other keywords or contact support through the ticket form down below."
                    fromFontVariationSettings="'wght' 400"
                    toFontVariationSettings="'wght' 900"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <UniversalFooter />
    </div>
  );
};

export default SupportPage;
