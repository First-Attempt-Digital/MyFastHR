import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Users, FileText, Clock, ShieldCheck,
  ArrowLeft, ArrowRight, CheckCircle2, Cpu, Database, Landmark,
  ChevronDown, Calendar
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


const FeaturesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageRef = useRef(null);
  const featureShowcaseContainerRef = useRef(null);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'workforce');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoError, setLogoError] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // R3F layout is 1024 (lg) breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [mappings, setMappings] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio_features_mapping');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

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

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const toggleDropdown = (menuName) => {
    if (activeDropdown === menuName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(menuName);
    }
  };

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
      previewImage: mappings.compliance || "/assets/compliance_preview.png"
    },
    leave: {
      title: "Leave Management",
      badge: "Time-off & Requests",
      icon: <Calendar size={28} />,
      desc: "Streamline time-off requests, manage automated leave balances, configure carry-forward policies, and handle multi-level manager approvals.",
      bullets: [
        "Multi-level manager approval workflows",
        "Automated leave balance calculators",
        "Carry-forward and encashment policy config",
        "Detailed leave ledger & historic audits"
      ],
      previewStats: [
        { label: "Approval turnaround", val: "Real-time" },
        { label: "Calculation accuracy", val: "100%" }
      ],
      previewImage: mappings.recruitment || "/assets/recruitment_preview.png"
    },
    mobile: {
      title: "Mobile Employee App",
      badge: "Self-Service & GPS",
      icon: <Cpu size={28} />,
      desc: "Give employees control with self-service punch-ins, payslip downloads, and leave requests. Features GPS tracking and biometric locks.",
      bullets: [
        "GPS geo-fenced attendance checks",
        "Direct payslip and form-16 downloads",
        "Leave application & manager approvals",
        "Offline punch buffer storage modes"
      ],
      previewStats: [
        { label: "Active App Users", val: "15,000+" },
        { label: "App Sync Uptime", val: "99.9%" }
      ],
      previewImage: mappings.mobile || "/assets/mobile_preview.png"
    }
  };

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
            <SplitText text="Explore Core" className="inline-block" tag="span" textAlign="center" delay={30} /> <span className="text-[#6028D9]"><BlurText text="System Modules" className="inline-flex" /></span>
          </h1>
          <SplitText
            text="Deep dive into the architecture of MyFastHR. Learn how our workforce engine, payroll ledger systems, muster logs, and compliance vault work in synchronization."
            className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed block"
            tag="p"
            textAlign="center"
            splitType="words"
            delay={20}
            duration={0.8}
          />
        </div>
      </section>

      {/* 3. Interactive Detail Panel */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Navigation Tabs */}
          <div className="hidden lg:block lg:col-span-4 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest pl-2">
              <VariableProximity
                label="Select Platform Module"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </h3>
            <div className="space-y-3">
              {Object.keys(modules).map((key) => {
                const item = modules[key];
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${isActive
                        ? 'bg-[#6028D9] text-white border-[#6028D9] shadow-md'
                        : 'bg-white text-gray-700 border-[#E9D5FF] hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isActive ? 'bg-white/20 border-white text-white' : 'bg-[#E9D5FF]/40 border-[#E9D5FF] text-[#6028D9]'
                        }`}>
                        {item.icon}
                      </div>
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider block ${isActive ? 'text-purple-200' : 'text-[#6028D9]'}`}>
                          <VariableProximity
                            label={item.badge}
                            fromFontVariationSettings="'wght' 700"
                            toFontVariationSettings="'wght' 950"
                            containerRef={pageRef}
                            radius={120}
                            falloff="linear"
                          />
                        </span>
                        <h4 className="text-sm font-bold tracking-tight">
                          <VariableProximity
                            label={item.title}
                            fromFontVariationSettings="'wght' 700"
                            toFontVariationSettings="'wght' 950"
                            containerRef={pageRef}
                            radius={120}
                            falloff="linear"
                          />
                        </h4>
                      </div>
                    </div>
                    <ArrowRight size={16} className={`transform transition-transform ${isActive ? 'rotate-90 text-white' : 'text-gray-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Architecture Highlight Block */}
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 space-y-3 mt-6">
              <div className="flex items-center gap-2">
                <Database className="text-[#6028D9]" size={18} />
                <h4 className="text-xs font-bold uppercase text-gray-800">
                  <VariableProximity
                    label="SaaS Node Architecture"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                <VariableProximity
                  label="Every enterprise company is deployed on an isolated virtual schema. This ensures zero data leaks, rapid database queries, and dedicated backups."
                  fromFontVariationSettings="'wght' 400"
                  toFontVariationSettings="'wght' 900"
                  containerRef={pageRef}
                  radius={120}
                  falloff="linear"
                />
              </p>
            </div>
          </div>

          {/* Right Active Showcase Card */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            {/* Mobile Tabs */}
            <div className="block lg:hidden w-full">
              <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {Object.keys(modules).map((key) => {
                  const item = modules[key];
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-none px-4 py-2.5 rounded-lg border flex items-center gap-2 transition-all text-xs font-bold uppercase cursor-pointer ${isActive
                          ? 'bg-[#6028D9] text-white border-[#6028D9] shadow-sm'
                          : 'bg-white text-gray-600 border-[#E9D5FF]'
                        }`}
                    >
                      <VariableProximity
                        label={item.title}
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

            {/* Showcase Card */}
            <div ref={featureShowcaseContainerRef} className="premium-card p-6 lg:p-8 text-left space-y-6 relative" style={{ position: 'relative' }}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E9D5FF]/40 text-[#6028D9] flex items-center justify-center">
                    {modules[activeTab].icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6028D9]">
                      <VariableProximity
                        label={modules[activeTab].badge}
                        fromFontVariationSettings="'wght' 700"
                        toFontVariationSettings="'wght' 950"
                        containerRef={featureShowcaseContainerRef}
                        radius={120}
                        falloff="linear"
                      />
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      <VariableProximity
                        label={modules[activeTab].title}
                        fromFontVariationSettings="'wght' 400"
                        toFontVariationSettings="'wght' 900"
                        containerRef={featureShowcaseContainerRef}
                        radius={120}
                        falloff="linear"
                      />
                    </h2>
                  </div>
                </div>
                <span className="badge-purple">
                  <VariableProximity
                    label="Live Module"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={featureShowcaseContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </span>
              </div>

              {/* Description & Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-7 space-y-6">
                  <div className="text-sm text-gray-600 leading-relaxed block" style={{ position: 'relative' }}>
                    <VariableProximity
                      label={modules[activeTab].desc}
                      fromFontVariationSettings="'wght' 400"
                      toFontVariationSettings="'wght' 900"
                      containerRef={featureShowcaseContainerRef}
                      radius={120}
                      falloff="linear"
                    />
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                      <VariableProximity
                        label="Key Subcomponents"
                        fromFontVariationSettings="'wght' 700"
                        toFontVariationSettings="'wght' 950"
                        containerRef={featureShowcaseContainerRef}
                        radius={120}
                        falloff="linear"
                      />
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {modules[activeTab].bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                          <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                          <VariableProximity
                            label={bullet}
                            fromFontVariationSettings="'wght' 500"
                            toFontVariationSettings="'wght' 900"
                            containerRef={featureShowcaseContainerRef}
                            radius={120}
                            falloff="linear"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="md:col-span-5 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                    <VariableProximity
                      label="Performance Metrics"
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={featureShowcaseContainerRef}
                      radius={120}
                      falloff="linear"
                    />
                  </h4>
                  <div className="space-y-3">
                    {modules[activeTab].previewStats.map((stat, idx) => (
                      <div key={idx} className="p-4 bg-[#F1F5F9] border border-[#E9D5FF] rounded-xl">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                          <VariableProximity
                            label={stat.label}
                            fromFontVariationSettings="'wght' 700"
                            toFontVariationSettings="'wght' 950"
                            containerRef={featureShowcaseContainerRef}
                            radius={120}
                            falloff="linear"
                          />
                        </span>
                        <span className="text-base font-bold text-gray-800 mt-0.5 block">
                          <VariableProximity
                            label={stat.val}
                            fromFontVariationSettings="'wght' 700"
                            toFontVariationSettings="'wght' 950"
                            containerRef={featureShowcaseContainerRef}
                            radius={120}
                            falloff="linear"
                          />
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-white border border-[#E9D5FF] rounded-xl flex items-center gap-2">
                    <Cpu className="text-[#6028D9]" size={18} />
                    <span className="text-[9px] font-bold uppercase text-gray-500">
                      <VariableProximity
                        label="Fully compiled sandbox"
                        fromFontVariationSettings="'wght' 700"
                        toFontVariationSettings="'wght' 950"
                        containerRef={featureShowcaseContainerRef}
                        radius={120}
                        falloff="linear"
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Interface Screenshot Preview */}
              <div className="space-y-3 pt-4">
                <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  <VariableProximity
                    label="Interface Preview"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={featureShowcaseContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </h4>
                <div className="rounded-xl overflow-hidden border border-[#E9D5FF] bg-gray-50">
                  <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-100 bg-white">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[9px] text-gray-400 ml-2">
                      <VariableProximity
                        label={`${modules[activeTab].title} Live console preview`}
                        fromFontVariationSettings="'wght' 500"
                        toFontVariationSettings="'wght' 900"
                        containerRef={featureShowcaseContainerRef}
                        radius={120}
                        falloff="linear"
                      />
                    </span>
                  </div>
                  <div className="bg-white p-2">
                    <img
                      src={modules[activeTab].previewImage}
                      alt={`${modules[activeTab].title} Dashboard Interface Preview`}
                      className="w-full h-auto object-cover rounded-lg border border-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs text-gray-500 font-medium">
                  <VariableProximity
                    label="Ready to deploy sandbox?"
                    fromFontVariationSettings="'wght' 500"
                    toFontVariationSettings="'wght' 900"
                    containerRef={featureShowcaseContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </span>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary px-6 py-3 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <VariableProximity
                    label={`Spin Up ${modules[activeTab].title} Console`}
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={featureShowcaseContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      <UniversalFooter />
    </div>
  );
};

export default FeaturesPage;
