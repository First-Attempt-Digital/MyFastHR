import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, FileText, Clock, ShieldCheck,
  HelpCircle, ChevronRight, Check, ArrowRight, Play, X,
  Smartphone, Award, HardHat, Heart, BarChart3, Briefcase,
  Layers, Database, Laptop, ChevronDown, CheckCircle2,
  Calendar, CreditCard, ChevronUp, Star, HelpCircle as HelpIcon,
  BookOpen, Globe, Mail, Phone, MapPin, Settings, ShieldAlert
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

import { useRef } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const heroContainerRef = useRef(null);
  const ctaSectionRef = useRef(null);
  const [currency, setCurrency] = useState('INR');
  const [logoUrl, setLogoUrl] = useState('');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoError, setLogoError] = useState(true);

  // Stats for ROI calculator
  const [roiEmployees, setRoiEmployees] = useState(45);
  const [roiSalary, setRoiSalary] = useState(32000);

  // Walkthrough Demo states
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState(0);

  const walkthroughSteps = [
    {
      title: "1. Core HRMS & Registry",
      subtitle: "Employee Directory & Database Structure",
      desc: "Maintain clean, isolated multi-tenant records for employee personal data, job tags, dynamic reporting hierarchies, and hardware asset bindings.",
      bullets: [
        "Dynamic reporting hierarchy mapping trees",
        "Encrypted logical partition schemas",
        "Role-based dashboard permissions",
        "Complete asset ledger allocations"
      ],
      icon: <Users className="text-purple-600" size={36} />,
      statLabel: "OCR Processing",
      statVal: "Under 5s"
    },
    {
      title: "2. Attendance Muster Sync",
      subtitle: "Cloud Biometric & Mobile GPS Logs",
      desc: "Reconcile shift rosters and physical attendance feeds seamlessly. Features offline buffering, late penalty equations, and geofencing verification.",
      bullets: [
        "Real-time cloud biometric synchronizer",
        "GPS geo-fenced coordinates tracking",
        "Weekend and holiday override schedules",
        "Late penalty deductions calculation"
      ],
      icon: <Clock className="text-purple-600" size={36} />,
      statLabel: "Device Ping Rate",
      statVal: "Live Stream"
    },
    {
      title: "3. Payroll Ledger Engine",
      subtitle: "Statutory Tax & Calculation Computations",
      desc: "Process complex salary lists and compliance sheets in 20 minutes instead of days. Reconcile provident funds and employee insurance records automatically.",
      bullets: [
        "Statutory PF, ESIC & tax deductions compliance",
        "Custom allowances and formula builders",
        "One-click bank sheets compiling",
        "Direct PDF payslips distribution"
      ],
      icon: <FileText className="text-purple-600" size={36} />,
      statLabel: "Payroll Computation",
      statVal: "< 20 Mins"
    },
    {
      title: "4. Secure Document Vault",
      subtitle: "AES-256 Storage & Metadata Auditing",
      desc: "Secure Aadhaar, PAN, and address proof documents in logically separated folders. Prevent imposter activity with tamper-proof audit trails.",
      bullets: [
        "High-level AES-256 encryption at rest",
        "Direct OCR background document scanning",
        "Detailed admin review approval screen",
        "Immutable access logs verification footprints"
      ],
      icon: <ShieldCheck className="text-purple-600" size={36} />,
      statLabel: "Document Encryption",
      statVal: "AES-256"
    }
  ];

  // Dropdown states for navbar
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Telemetry simulator states
  const [telemetryLogs, setTelemetryLogs] = useState([
    { id: 1, node: 'Jaipur Hub', text: 'Telemetry check: 240 active agents, secure node verified.', status: 'OK' },
    { id: 2, node: 'Mumbai Vault', text: 'ESIC compliance ledger updated for First Attempt Skills Training.', status: 'SYNC' },
    { id: 3, node: 'Delhi Sandbox', text: 'Isolated database container #18 synced successfully.', status: 'READY' }
  ]);
  const [nodePings, setNodePings] = useState({ jaipur: 12, mumbai: 24, delhi: 18 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }

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
  }, [navigate]);

  useEffect(() => {
    const logPool = [
      { node: 'Jaipur Hub', text: 'Rahul A. punched biometric in [Jaipur Hub]. Log ID: #4829', status: 'IN' },
      { node: 'Mumbai Vault', text: 'Secured document KYC approval request generated for Priya S.', status: 'KYC' },
      { node: 'Delhi Sandbox', text: 'Auto-calculation check: Provident Fund ledger reconciled.', status: 'CALC' },
      { node: 'Jaipur Hub', text: 'Telemetry sync: Biometric machine #3 connected.', status: 'OK' },
      { node: 'Mumbai Vault', text: 'Isolated node backup complete. 0 errors detected.', status: 'OK' },
      { node: 'Delhi Sandbox', text: 'Impersonation session token audited for Super Admin.', status: 'AUDIT' }
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      setTelemetryLogs(prev => [
        ...prev.slice(-2),
        { id: Date.now(), ...randomLog }
      ]);
      setNodePings({
        jaipur: Math.max(8, Math.min(25, 12 + Math.floor(Math.random() * 7 - 3))),
        mumbai: Math.max(18, Math.min(45, 24 + Math.floor(Math.random() * 9 - 4))),
        delhi: Math.max(12, Math.min(35, 18 + Math.floor(Math.random() * 7 - 3)))
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
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

  const toggleDropdown = (menuName) => {
    if (activeDropdown === menuName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(menuName);
    }
  };

  return (
    <div className="landing-body">
      <UniversalHeader />

      {/* 2. Hero Section */}
      <section ref={heroContainerRef} className="relative px-6 pt-3 pb-12 lg:pt-4 lg:pb-16 bg-white overflow-hidden border-b border-[#E9D5FF]">
        {/* Background ambient gradients */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#E9D5FF]/30 rounded-full filter blur-3xl pointer-events-none" />

        <div className="absolute inset-0 pointer-events-none opacity-50 z-0">
          <Antigravity
            count={200}
            magnetRadius={8}
            ringRadius={8}
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

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6 text-left reveal-on-scroll reveal-left">
            <div className="badge-purple">
              <span>★</span> 
              <VariableProximity
                label="All-in-One Workforce Management Platform"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={heroContainerRef}
                radius={120}
                falloff="linear"
              />
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-[#111827] tracking-tight leading-[1.4] py-1">
              <SplitText text="One Platform for" className="inline-block" tag="span" textAlign="left" delay={30} /> <span style={{ color: 'var(--primary-purple, #6028D9)' }}><BlurText text="HR, Payroll, Attendance" className="inline" style={{ display: 'inline', color: 'var(--primary-purple, #6028D9)' }} /></span> <SplitText text="& Workforce Management" className="inline-block" tag="span" textAlign="left" delay={30} />
            </h1>

            <SplitText
              text="Manage Employees, Attendance, Payroll, Leave Management, Compliance and Biometric Integrations from a single cloud platform."
              className="text-base sm:text-lg text-gray-600 leading-relaxed block"
              tag="p"
              textAlign="left"
              splitType="words"
              delay={20}
              duration={0.8}
            />

            <div className="flex flex-wrap gap-4 pt-2">
              <button onClick={() => navigate('/book-demo')} className="btn-primary px-8 py-3.5 text-sm flex items-center gap-2 cursor-pointer border-none">
                <VariableProximity
                  label="Book Demo"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={heroContainerRef}
                  radius={120}
                  falloff="linear"
                />
                <ArrowRight size={16} />
              </button>
              <button onClick={() => { setShowDemoModal(true); setActiveWalkthroughStep(0); }} className="btn-secondary px-8 py-3.5 text-sm flex items-center gap-2 cursor-pointer border-none">
                <Play size={16} fill="currentColor" />
                <VariableProximity
                  label="Watch Demo"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={heroContainerRef}
                  radius={120}
                  falloff="linear"
                />
              </button>
            </div>

            {/* Badges line */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-[#111827]">
              {[
                { label: 'Cloud Based', icon: <Globe size={18} className="text-[#6028D9]" /> },
                { label: 'Secure', icon: <ShieldCheck size={18} className="text-[#6028D9]" /> },
                { label: 'Scalable', icon: <Layers size={18} className="text-[#6028D9]" /> },
                { label: '24x7 Support', icon: <Clock size={18} className="text-[#6028D9]" /> }
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 font-semibold text-xs py-2 px-3 bg-[#F1F5F9] rounded-lg">
                  {badge.icon}
                  <VariableProximity
                    label={badge.label}
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={heroContainerRef}
                    radius={120}
                    falloff="linear"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Preview Graphic (Scattered Premium CSS Cards inspired by Image 1) */}
          <div className="lg:col-span-6 w-full overflow-hidden flex items-center justify-center py-4 lg:py-0 reveal-on-scroll reveal-right delay-200">
            <div className="relative w-[480px] min-h-[460px] sm:min-h-[480px] lg:min-h-[520px] shrink-0 scale-[0.58] min-[360px]:scale-[0.68] min-[400px]:scale-[0.76] sm:scale-90 lg:scale-[0.85] origin-center">
              {/* Background decorative glow */}
              <div className="absolute w-72 h-72 rounded-full bg-purple-200/30 blur-3xl -top-10 -left-10 pointer-events-none" />
              <div className="absolute w-72 h-72 rounded-full bg-pink-200/20 blur-3xl -bottom-10 -right-10 pointer-events-none" />

              {/* Automation Card (Top Left) */}
            <div 
              className="absolute top-[14%] left-[2%] bg-white border border-[#E9D5FF] p-3.5 rounded-2xl shadow-md hover-float transition-all w-[115px] text-center z-20"
              style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '0s' }}
            >
              <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <svg className="w-10 h-10 text-pink-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15 C 8 20, 8 35, 20 35 C 32 35, 32 20, 28 15 C 25 12, 15 12, 12 15 Z" fill="#FDF2F8" stroke="#111827" strokeWidth="1.5" />
                  <path d="M15 12 C 16 8, 24 8, 25 12" stroke="#111827" strokeWidth="1.5" />
                  <path d="M12 15 L 28 15" stroke="#111827" strokeWidth="1.5" />
                  <path d="M20 18 L20 32" stroke="#DB2777" strokeWidth="2" />
                  <path d="M17 21 C 17 21, 23 19, 23 23 C 23 27, 17 25, 17 29 C 17 29, 23 30, 23 28" stroke="#DB2777" strokeWidth="2" />
                </svg>
              </div>
              <div className="text-base font-bold text-gray-800">234</div>
              <div className="text-[9px] text-gray-400 font-semibold mt-0.5">Automation</div>
            </div>

            {/* Analytics Card (Top Center) */}
            <div 
              className="absolute top-[3%] left-[27%] bg-white border border-[#E9D5FF] p-4 rounded-2xl shadow-md hover-float transition-all w-[145px] text-left z-10"
              style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '0.5s' }}
            >
              <div className="text-[11px] font-bold text-gray-800 mb-3">Analytics</div>
              <div className="flex gap-2.5 items-center mb-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <span className="text-[10px]">🔔</span>
                </div>
                <div className="space-y-1 w-full">
                  <div className="h-1.5 bg-gray-200 rounded-full w-[80%]" />
                  <div className="h-1 bg-gray-100 rounded-full w-[50%]" />
                </div>
              </div>
              <div className="flex gap-2.5 items-center">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-[10px]">📈</span>
                </div>
                <div className="space-y-1 w-full">
                  <div className="h-1.5 bg-gray-200 rounded-full w-[70%]" />
                  <div className="h-1 bg-gray-100 rounded-full w-[40%]" />
                </div>
              </div>
            </div>

            {/* Recognition Card (Top Right) */}
            <div 
              className="absolute top-[3%] right-[7%] bg-white border border-[#E9D5FF] p-3.5 rounded-2xl shadow-md hover-float transition-all w-[120px] text-center z-10"
              style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '1s' }}
            >
              <div className="relative w-16 h-16 mx-auto mb-1">
                <svg className="w-full h-full" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="#E0F2FE" />
                  
                  <path d="M22 36 C20 29, 20 23, 30 23 C40 23, 40 29, 38 36" fill="#FEE2E2" stroke="#111827" strokeWidth="1.5" />
                  <path d="M30 29 C28 29, 28 32, 30 32 C31 32, 31 29, 30 29 Z" fill="#111827" />
                  <circle cx="25" cy="27" r="4.5" fill="none" stroke="#111827" strokeWidth="1.5" />
                  <circle cx="35" cy="27" r="4.5" fill="none" stroke="#111827" strokeWidth="1.5" />
                  <line x1="29.5" y1="27" x2="30.5" y2="27" stroke="#111827" strokeWidth="1.5" />
                  <path d="M24 33 Q30 31 36 33 Q34 36 30 34 Q26 36 24 33" fill="#334155" />
                  <circle cx="20" cy="28" r="2.5" fill="#FEE2E2" stroke="#111827" strokeWidth="1.5" />
                  <circle cx="40" cy="28" r="2.5" fill="#FEE2E2" stroke="#111827" strokeWidth="1.5" />
                  <path d="M19 26 Q18 22 22 23" stroke="#111827" strokeWidth="1.5" fill="none" />
                  <path d="M41 26 Q42 22 38 23" stroke="#111827" strokeWidth="1.5" fill="none" />
                  <path d="M26 40 L30 36 L34 40 Z" fill="#FFF" stroke="#111827" strokeWidth="1.5" />
                  <path d="M26 37 L34 43 L34 37 L26 43 Z" fill="#EF4444" stroke="#111827" strokeWidth="1.5" />
                  
                  <g transform="translate(8, 38)">
                    <circle cx="10" cy="10" r="8" fill="#F472B6" stroke="#111827" strokeWidth="1.5" />
                    <path d="M7 16 L5 24 L9 21 L13 24 L11 16 Z" fill="#F472B6" stroke="#111827" strokeWidth="1.5" />
                    <circle cx="10" cy="10" r="4" fill="#FFF" />
                  </g>
                </svg>
              </div>
              <div className="text-[10px] font-bold text-gray-700">Recognition</div>
            </div>

            {/* Feedback Card (Middle Right) */}
            <div 
              className="absolute top-[26%] right-[2%] bg-white border border-[#E9D5FF] p-4 rounded-2xl shadow-md hover-float transition-all w-[185px] text-left z-20"
              style={{ animation: 'float 8s ease-in-out infinite', animationDelay: '1.5s' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-[10px] font-semibold text-gray-400">Feedback</div>
                  <div className="text-lg font-bold text-gray-800">4.8</div>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#FCE7F3" />
                    <path d="M23 12 C28 9, 29 16, 25 18 C23 20, 21 16, 23 12" fill="#111827" stroke="#111827" strokeWidth="1" />
                    <path d="M15 24 C14 18, 18 14, 22 15 C26 16, 26 21, 24 25" fill="#FEF3C7" stroke="#111827" strokeWidth="1.5" />
                    <path d="M17 19 Q16 19 16 20" stroke="#111827" strokeWidth="1.5" fill="none" />
                    <path d="M16 22 Q18 22 17 23" stroke="#111827" strokeWidth="1.5" fill="none" />
                    <path d="M19 25 L18 30 H24 L22 25" fill="#FFF" stroke="#111827" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
              
              <div className="relative h-28 w-full">
                <svg className="w-full h-full" viewBox="0 0 140 100">
                  <g fill="#FBBF24" stroke="#111827" strokeWidth="1">
                    <path d="M25 25 L27 20 L29 25 L34 25 L30 28 L32 33 L27 30 L22 33 L24 28 L20 25 Z" />
                    <path d="M47 15 L49 10 L51 15 L56 15 L52 18 L54 23 L49 20 L44 23 L46 18 L42 15 Z" />
                    <path d="M70 11 L72 6 L74 11 L79 11 L75 14 L77 19 L72 16 L67 19 L69 14 L65 11 Z" />
                    <path d="M93 15 L95 10 L97 15 L102 15 L98 18 L100 23 L95 20 L90 23 L92 18 L88 15 Z" />
                    <path d="M115 25 L117 20 L119 25 L124 25 L120 28 L122 33 L117 30 L112 33 L114 28 L110 25 Z" />
                  </g>
                  
                  <path d="M70 52 C74 52, 77 48, 77 44 C77 40, 74 37, 70 37 C66 37, 63 40, 63 44 C63 48, 66 52, 70 52 Z" fill="#FEE2E2" stroke="#111827" strokeWidth="1.5" />
                  <path d="M72 44 L74 45 L72 46" fill="none" stroke="#111827" strokeWidth="1.5" />
                  <path d="M67 48 Q70 50 73 48" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M58 75 L62 57 L78 57 L82 75 Z" fill="#E0F2FE" stroke="#111827" strokeWidth="1.5" />
                  <path d="M67 57 L70 61 L73 57" fill="none" stroke="#111827" strokeWidth="1.5" />
                  <path d="M58 57 C45 45, 30 50, 25 50" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M82 57 C92 45, 105 48, 110 47" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="108" y="38" width="10" height="18" rx="2" fill="#334155" stroke="#111827" strokeWidth="1.5" transform="rotate(10 113 47)" />
                  <line x1="110" y1="41" x2="114" y2="42" stroke="#10B981" strokeWidth="1.5" />
                  <circle cx="24" cy="50" r="2.5" fill="#FEE2E2" stroke="#111827" strokeWidth="1.5" />
                  <circle cx="108" cy="46" r="2.5" fill="#FEE2E2" stroke="#111827" strokeWidth="1.5" />
                  <line x1="20" y1="45" x2="16" y2="42" stroke="#111827" strokeWidth="1.5" />
                  <line x1="120" y1="42" x2="124" y2="39" stroke="#111827" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Payroll Card (Bottom Left / Center-Left) */}
            <div 
              className="absolute bottom-[8%] left-[2%] bg-white border border-[#E9D5FF] p-5 rounded-2xl shadow-md hover-float transition-all w-[210px] text-center z-20"
              style={{ animation: 'float 6.5s ease-in-out infinite', animationDelay: '2s' }}
            >
              <div className="text-xs font-bold text-gray-800 mb-3">Payroll</div>
              
              <div className="w-full h-32 flex items-center justify-center mb-3">
                <svg className="w-full h-full" viewBox="0 0 140 110">
                  <circle cx="70" cy="55" r="35" fill="#F1F5F9" />

                  <path d="M70 30 C74 30, 76 27, 76 23 C76 19, 73 16, 68 16 C63 16, 61 20, 61 24 C61 28, 65 30, 70 30 Z" fill="#FEF3C7" stroke="#111827" strokeWidth="1.5" />
                  <path d="M72 23 L74 24 L72 25" fill="none" stroke="#111827" strokeWidth="1.5" />
                  <path d="M63 17 Q68 12 73 17" fill="#334155" stroke="#111827" strokeWidth="1.5" />
                  <line x1="68" y1="30" x2="68" y2="35" stroke="#111827" strokeWidth="1.5" />
                  <line x1="72" y1="30" x2="72" y2="35" stroke="#111827" strokeWidth="1.5" />
                  <path d="M65 35 L70 39 L75 35" fill="none" stroke="#111827" strokeWidth="1.5" />
                  <path d="M62 35 L58 50 H82 L78 35 Z" fill="#E8E8FF" stroke="#111827" strokeWidth="1.5" />
                  
                  <rect x="25" y="45" width="90" height="52" rx="6" fill="#FFF" stroke="#111827" strokeWidth="1.8" />
                  <circle cx="42" cy="58" r="7" fill="#F97316" stroke="#111827" strokeWidth="1" />
                  <circle cx="49" cy="58" r="7" fill="#FBBF24" stroke="#111827" strokeWidth="1" />
                  <rect x="85" y="52" width="14" height="12" rx="2" fill="#F59E0B" stroke="#111827" strokeWidth="1.2" />
                  <line x1="92" y1="52" x2="92" y2="64" stroke="#111827" strokeWidth="1" />
                  <line x1="35" y1="73" x2="80" y2="73" stroke="#111827" strokeWidth="1.5" />
                  <line x1="35" y1="81" x2="60" y2="81" stroke="#111827" strokeWidth="1.5" />
                  <line x1="35" y1="89" x2="50" y2="89" stroke="#111827" strokeWidth="1.5" />

                  <circle cx="24" cy="71" r="3" fill="#FEF3C7" stroke="#111827" strokeWidth="1.5" />
                  <path d="M25 68 C27 68, 27 74, 25 74" stroke="#111827" strokeWidth="1.5" />
                  <circle cx="116" cy="71" r="3" fill="#FEF3C7" stroke="#111827" strokeWidth="1.5" />
                  <path d="M115 68 C113 68, 113 74, 115 74" stroke="#111827" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="text-[10px] text-gray-400 font-semibold">Automation</div>
            </div>

            {/* Objectives Card (Bottom Right / Center) */}
            <div 
              className="absolute bottom-[8%] right-[30%] bg-white border border-[#E9D5FF] p-3.5 rounded-2xl shadow-md hover-float transition-all w-[115px] text-center z-10"
              style={{ animation: 'float 7.5s ease-in-out infinite', animationDelay: '2.5s' }}
            >
              <div className="relative w-16 h-10 mx-auto mb-2 flex items-center justify-center">
                <svg className="w-14 h-14" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    strokeDasharray="50, 100"
                    transform="rotate(-180 18 18)"
                  />
                  <path
                    className="text-blue-500"
                    strokeWidth="3"
                    strokeDasharray="35, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    transform="rotate(-180 18 18)"
                  />
                </svg>
                <div className="absolute bottom-1 font-bold text-[9px] text-gray-800">$20M</div>
              </div>
              <div className="text-[10px] font-bold text-gray-400">Objectives</div>
            </div>

            {/* Expense Card (Bottom Far Right) */}
            <div 
              className="absolute bottom-[6%] right-[2%] bg-white border border-[#E9D5FF] rounded-2xl shadow-md hover-float transition-all w-[125px] overflow-hidden text-left z-20"
              style={{ animation: 'float 5.5s ease-in-out infinite', animationDelay: '3s' }}
            >
              <div className="p-3 pb-2 flex gap-2 items-center">
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-650 flex items-center justify-center shrink-0">
                  <FileText size={12} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">234</div>
                  <div className="text-[8px] text-gray-400 font-semibold">expense</div>
                </div>
              </div>
              <button className="w-full bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] font-bold py-2 text-[9px] flex items-center justify-center gap-1 border-none cursor-pointer">
                Approve <ArrowRight size={10} />
              </button>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* 3. Trust Section */}
      <section className="py-12 bg-[#F1F5F9] border-b border-[#E9D5FF] reveal-on-scroll reveal-scale">
        <div className="max-w-7xl mx-auto px-6 space-y-8 text-center">
          <div className="text-xs uppercase font-bold text-gray-500 tracking-widest">
            Trusted by 100+ Companies
          </div>

          {/* Logos grid */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70">
            {['ACME', 'ABC Corp', 'Vertex', 'GreenTech', 'Globex', 'Innafy', 'TechNova'].map((logo, idx) => (
              <div key={idx} className="font-bold text-base text-[#111827] tracking-wider font-heading flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#6028D9] rounded-full inline-block" />
                {logo}
              </div>
            ))}
          </div>

          {/* Core highlights row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6">
            {[
              { num: '100+', label: 'Happy Clients', desc: 'Across India & ME' },
              { num: '10,000+', label: 'Employees Managed', desc: 'Statutory ledgers verified' },
              { num: '₹1000 Cr+', label: 'Payroll Processed', desc: 'Secure & auto reconciled' },
              { num: '99.9%', label: 'System Uptime', desc: 'Isolated sandbox networks' },
              { num: '24x7', label: 'Tech Support', desc: 'Dedicated implementation' }
            ].map((stat, i) => {
              const delayClass = i === 0 ? 'delay-100' : i === 1 ? 'delay-200' : i === 2 ? 'delay-300' : i === 3 ? 'delay-400' : '';
              return (
                <div key={i} className={`p-4 bg-white border border-[#E9D5FF] rounded-xl text-center shadow-sm hover-float reveal-on-scroll reveal-up ${delayClass}`}>
                  <div className="text-xl font-bold text-[#6028D9]">{stat.num}</div>
                  <div className="text-xs font-semibold text-gray-800 mt-1">{stat.label}</div>
                  <div className="text-[9px] text-gray-500">{stat.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Modules Section */}
      <section className="py-20 bg-white border-b border-[#E9D5FF] reveal-on-scroll reveal-up">
        <div className="max-w-7xl mx-auto px-6 space-y-12 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
              Everything You Need to Manage Your Workforce
            </h2>
            <ScrollReveal containerClassName="text-sm text-gray-500 text-center" baseOpacity={0.1}>
              No spreadsheets, no mismatched logs. Every module works natively on our high performance database clusters.
            </ScrollReveal>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'HRMS Registry', icon: <Users size={24} />, desc: 'Complete employee reporting chains. Manage departments, designations, and onboarding pipelines.' },
                { title: 'Attendance Muster', icon: <Clock size={24} />, desc: 'Biometric hardware integrations, mobile GPS tracking, shift rosters, and real-time punch feeds.' },
                { title: 'Payroll Engine', icon: <FileText size={24} />, desc: 'Automate salary processing, salary structures, custom allowances, and direct bank payouts.' },
                { title: 'Leave Management', icon: <Calendar size={24} />, desc: 'Streamline leave requests, manager approval systems, carry-forward policies, and automated balance audits.' },
                { title: 'Compliance', icon: <ShieldCheck size={24} />, desc: 'Manage statutory ESIC/PF contributions, Professional Tax, LWF, and custom deduction compliance rules.' },
                { title: 'Mobile App', icon: <Smartphone size={24} />, desc: 'Employee self service interface for punch in, leave applications, payslip downloads on the fly.' }
              ].map((mod, idx) => {
                const delayClass = idx % 3 === 0 ? 'delay-100' : idx % 3 === 1 ? 'delay-200' : 'delay-300';
                return (
                  <div key={idx} className={`premium-card p-6 text-left space-y-4 flex flex-col justify-between hover-float reveal-on-scroll reveal-up ${delayClass}`}>
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-[#E9D5FF] text-[#6028D9] flex items-center justify-center">
                        {mod.icon}
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{mod.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{mod.desc}</p>
                    </div>
                    <div className="pt-2 text-xs font-bold text-[#6028D9] flex items-center gap-1 cursor-pointer hover:underline" onClick={() => navigate('/features')}>
                      Learn More <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>

          <div className="pt-6">
            <button onClick={() => navigate('/features')} className="btn-primary px-8 py-3 text-sm">
              Explore All Features
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-gradient-to-b from-white to-[#F9F6FF] border-b border-[#E9D5FF] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-100/30 rounded-full filter blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          
          {/* Left Column: Visual/Hero */}
          <div className="lg:col-span-5 space-y-6 text-left reveal-on-scroll reveal-left">
            <span className="badge-purple">The MyFastHR Advantage</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#111827] tracking-tight leading-tight">
              Why High-Growth Teams Choose Us
            </h2>
            <p className="text-base text-gray-600 leading-relaxed font-medium">
              We replace fragmented software and messy Excel imports with a single high-performance workforce ecosystem. Built for security, scale, and compliance.
            </p>
            
            <div className="p-6 rounded-2xl bg-white border border-[#E9D5FF] shadow-lg space-y-4">
              <div className="flex gap-4 items-center">
                <div className="text-3xl font-black text-[#6028D9]">85%</div>
                <div className="text-xs font-semibold text-gray-600 leading-tight">Reduction in manual HR payroll reconciliation time</div>
              </div>
              <div className="h-[1px] bg-gray-100 w-full" />
              <div className="flex gap-4 items-center">
                <div className="text-3xl font-black text-[#6028D9]">3s</div>
                <div className="text-xs font-semibold text-gray-600 leading-tight">Real-time punch sync from TimeWatch biometric machines</div>
              </div>
            </div>
          </div>

          {/* Right Column: Grid Benefits */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {[
              {
                title: "Unified HR & Payroll",
                desc: "No more manually exporting roster sheets or punching logs. Attendance muster flows natively into payroll calculations in one click.",
                icon: <Users size={20} />
              },
              {
                title: "Direct Hardware Partner",
                desc: "Our exclusive API tie-up with TimeWatch brings true plug-and-play biometric sync to your dashboard, completely skipping desktop sync middleware.",
                icon: <Clock size={20} />
              },
              {
                title: "Statutory Compliance",
                desc: "Automated provident fund (EPF), ESIC, professional tax deductions, and bank sheet compilations customized for Indian regulations.",
                icon: <ShieldCheck size={20} />
              },
              {
                title: "Logical Tenant Sandboxes",
                desc: "Your payroll files, Aadhaar cards, and PAN documents reside in logically partitioned databases encrypted with AES-256 for military-grade protection.",
                icon: <Layers size={20} />
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-[#E9D5FF] hover:border-purple-500/50 hover:shadow-[0_4px_20px_rgba(96,40,217,0.05)] transition-all duration-300 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6028D9] flex items-center justify-center border border-purple-100 shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Industry Solutions Section */}
      <section className="py-20 bg-[#F1F5F9] border-b border-[#E9D5FF]">
        <div className="max-w-7xl mx-auto px-6 space-y-12 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
              Tailored Solutions for Every Sector
            </h2>
            <p className="text-sm text-gray-500">
              Configured templates designed to comply with sectoral laws, shifts schedules, and contractor rosters.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Manufacturing', icon: <HardHat size={20} /> },
              { label: 'Construction', icon: <Building2 size={20} /> },
              { label: 'Retail', icon: <CreditCard size={20} /> },
              { label: 'Healthcare', icon: <Heart size={20} /> },
              { label: 'Education', icon: <BookOpen size={20} /> },
              { label: 'Logistics', icon: <Globe size={20} /> },
              { label: 'Corporate', icon: <Laptop size={20} /> }
            ].map((sol, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-[#E9D5FF] hover:border-[#6028D9] cursor-pointer transition-all hover:shadow-sm text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#E9D5FF] text-[#6028D9] flex items-center justify-center mx-auto">
                  {sol.icon}
                </div>
                <div className="text-xs font-bold text-gray-800">{sol.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Biometric Integrations */}
      <section className="py-20 bg-white border-b border-[#E9D5FF] reveal-on-scroll reveal-up">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="space-y-3 max-w-3xl mx-auto text-center">
            <span className="badge-purple">Official Hardware Partner</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
              TimeWatch Biometric Sync
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              MyFastHR features an exclusive direct API integration with TimeWatch devices, bringing real-time attendance logs directly to your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Left: TimeWatch Partner Card */}
            <div className="lg:col-span-5 p-8 rounded-3xl bg-gradient-to-b from-[#FAF8FF] to-white border border-[#E9D5FF] shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/40 rounded-full filter blur-2xl opacity-70 group-hover:bg-purple-200/50 transition-colors" />
              
              {/* Partner Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-[#6028D9] text-xs font-bold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6028D9] animate-pulse" />
                Official Partner
              </div>
              
              <div className="space-y-4">
                <div className="text-3xl font-black tracking-tight text-[#111827] font-sans">
                  TimeWatch
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Enterprise-grade biometric machines, face scanners, and RFID readers synced natively with MyFastHR.
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-purple-100">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sync Speed</div>
                  <div className="text-sm font-extrabold text-[#6028D9]">&lt; 3 Seconds</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Integration</div>
                  <div className="text-sm font-extrabold text-[#6028D9]">Direct REST API</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Device Health</div>
                  <div className="text-sm font-extrabold text-[#6028D9]">Live Status</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Authentication</div>
                  <div className="text-sm font-extrabold text-[#6028D9]">Face / Bio / Card</div>
                </div>
              </div>
            </div>

            {/* Right: Integration Features */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6028D9] shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">Direct Cloud-to-Device Webhooks</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Say goodbye to heavy local sync utilities or desktop sync software. Punch events stream securely from TimeWatch servers straight to your active attendance ledger.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6028D9] shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">Real-Time Roster Verification</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Punches are automatically verified against employee shift calendars to compute late entries, early exits, and overtime parameters instantly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6028D9] shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">Custom API Support for Legacy Systems</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Using other hardware like eSSL, ZKTeco, Matrix, or local legacy machines? Seamlessly build custom sync pipelines using our simple REST Webhooks framework.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Savings ROI Calculator */}
      <section className="py-20 bg-[#F1F5F9] border-b border-[#E9D5FF] reveal-on-scroll reveal-scale">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Sliders panel */}
          <div className="lg:col-span-6 space-y-6 text-left reveal-on-scroll reveal-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
              Calculate Your Savings & ROI
            </h2>
            <p className="text-sm text-gray-500">
              Drag the sliders below to estimate the monthly statutory compliance calculations, estimated EPF load, and manual HR hours saved by deploying MyFastHR.
            </p>

            <div className="space-y-6 bg-white p-6 rounded-xl border border-[#E9D5FF] shadow-sm animated-border-glow">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>Workforce Size</span>
                  <span className="text-[#6028D9]">{roiEmployees} Employees</span>
                </div>
                <input
                  type="range" min="5" max="500" step="5" value={roiEmployees}
                  onChange={(e) => setRoiEmployees(parseInt(e.target.value))}
                  className="w-full accent-[#6028D9]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>Average Monthly Salary</span>
                  <span className="text-[#6028D9]">₹ {roiSalary.toLocaleString()}</span>
                </div>
                <input
                  type="range" min="8000" max="100000" step="1000" value={roiSalary}
                  onChange={(e) => setRoiSalary(parseInt(e.target.value))}
                  className="w-full accent-[#6028D9]"
                />
              </div>
            </div>
          </div>

          {/* Metrics panel */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 reveal-on-scroll reveal-right delay-200">
            <div className="bg-white p-5 rounded-xl border border-[#E9D5FF] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Est. Monthly EPF Load (12%)</div>
              <div className="text-2xl font-bold text-[#6028D9] mt-2">₹ {Math.round(roiEmployees * roiSalary * 0.12).toLocaleString()}</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E9D5FF] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Manual HR Hours Saved</div>
              <div className="text-2xl font-bold text-[#6028D9] mt-2">{Math.round(roiEmployees * 0.9)} Hours/mo</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E9D5FF] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Net Payout</div>
              <div className="text-2xl font-bold text-[#6028D9] mt-2">₹ {Math.round(roiEmployees * roiSalary).toLocaleString()}</div>
            </div>

            <div className="bg-[#6028D9] p-5 rounded-xl text-white shadow-md">
              <div className="text-[10px] uppercase font-bold text-purple-200">Compliance Leakages Blocked</div>
              <div className="text-2xl font-bold text-white mt-2">₹ {Math.round(roiEmployees * 950).toLocaleString()}/mo</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimonials Section */}
      <section className="py-20 bg-white border-b border-[#E9D5FF]">
        <div className="max-w-7xl mx-auto px-6 space-y-12 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
              Trusted by Leading Organizations
            </h2>
            <p className="text-sm text-gray-500">See how operations leaders use MyFastHR to speed up payroll compliance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { name: 'Devendra Kumar', role: 'Operations Lead, Highway King', text: 'The biometric sync API with our Jaipur hardware worked seamlessly. MyFastHR reduced our payroll prep process from four days to twenty minutes.' },
              { name: 'Anil Sharma', role: 'HR Director, First Attempt Skills', text: 'The interface layout is extremely fresh. Our employees can easily upload Aadhaar/PAN documents for compliance checks. Truly a premium experience.' },
              { name: 'Rohan Gupta', role: 'CTO, Swiftscale Technologies', text: 'We enjoy the super admin impersonation tool which makes debugging configurations instantly possible. Best HR SaaS platform in the Indian market.' }
            ].map((t, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-[#F1F5F9] border border-[#E9D5FF] space-y-4">
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="text-xs text-gray-600 italic leading-relaxed">"{t.text}"</p>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-bold text-gray-900">{t.name}</div>
                  <div className="text-[10px] text-[#6028D9] font-medium">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* 10. CTA Section with Overlapping Mobile Mockup */}
      <section ref={ctaSectionRef} className="py-24 text-slate-900 overflow-hidden relative" style={{ backgroundColor: '#F3EEFF', backgroundImage: 'radial-gradient(#d8b4fe 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column Text & Buttons */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight text-[#2E1065]">
              <VariableProximity
                label="Ready to Simplify Your HR Operations?"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={ctaSectionRef}
                radius={120}
                falloff="linear"
              />
            </h2>
            <p className="text-lg text-slate-650 max-w-xl leading-relaxed">
              <VariableProximity
                label="Join 100+ high-growth companies using MyFastHR to automate muster rolls, manage dynamic shifts, and securely distribute payslips."
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 700"
                containerRef={ctaSectionRef}
                radius={120}
                falloff="linear"
              />
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={() => navigate('/book-demo')} className="bg-[#6028D9] font-bold px-8 py-4 rounded-lg text-sm hover:bg-[#4C1D95] text-white transition-colors shadow-lg cursor-pointer border-none">
                <VariableProximity
                  label="Book a Demo Today"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={ctaSectionRef}
                  radius={120}
                  falloff="linear"
                />
              </button>
              <button onClick={() => navigate('/login')} className="border border-[#6028D9] text-[#6028D9] font-bold px-8 py-4 rounded-lg text-sm hover:bg-[#6028D9]/5 transition-colors cursor-pointer bg-transparent">
                <VariableProximity
                  label="Try Free Trial"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={ctaSectionRef}
                  radius={120}
                  falloff="linear"
                />
              </button>
            </div>
          </div>

          {/* Right Column App Screen/Mockup overlapping layout */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end h-[350px]">
            <div className="absolute bottom-[-100px] w-[260px] h-[480px] rounded-[40px] shadow-2xl p-4 flex flex-col justify-between transform rotate-3 hover:rotate-0 transition-transform duration-300" style={{ backgroundColor: 'var(--dark-purple, #1c1535)', border: '6px solid var(--primary-purple, #4c1d95)' }}>
              {/* Notch */}
              <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-[10px] text-purple-200 font-semibold">9:41</span>
                <div className="w-16 h-4 bg-black rounded-full" />
                <span className="text-[10px] text-purple-200 font-semibold">5G</span>
              </div>

              {/* Phone contents */}
              <div className="flex-grow bg-white rounded-[28px] p-4 flex flex-col justify-between overflow-hidden text-gray-800">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black" style={{ color: 'var(--primary-purple, #6028D9)' }}>MyFastHR</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="text-sm font-bold">Punch In Successful!</div>
                  <div className="text-[10px] text-gray-500">Location: Jaipur Hub Office</div>

                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="text-[10px] font-bold text-gray-700">Today's Shift: 09:00 AM - 06:00 PM</div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#10B981] h-full w-[80%]" />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-[9px] text-purple-600 font-bold">Upcoming Holiday</div>
                  <div className="text-[11px] font-bold text-gray-800 mt-0.5">Independence Day (Aug 15)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showDemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[32px] border border-purple-100 max-w-2xl w-full p-8 shadow-2xl relative text-left space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full border border-purple-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer text-gray-500 hover:text-slate-800"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary-purple, #6028D9)' }}>
                Interactive Product Walkthrough
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Explore MyFastHR Features</h2>
            </div>

            {/* Steps tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-purple-50 pb-3">
              {walkthroughSteps.map((step, idx) => {
                const isActive = activeWalkthroughStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveWalkthroughStep(idx)}
                    className="px-2 py-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer border-none"
                    style={{
                      borderBottom: isActive ? '3px solid var(--primary-purple, #6028D9)' : '3px solid transparent',
                      color: isActive ? 'var(--primary-purple, #6028D9)' : '#94A3B8',
                      backgroundColor: isActive ? 'var(--light-purple, #F5F3FF)' : 'transparent'
                    }}
                  >
                    {step.title.split('. ')[1]}
                  </button>
                );
              })}
            </div>

            {/* Content panel */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              {/* Left Column: Icon & Info */}
              <div className="sm:col-span-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    {walkthroughSteps[activeWalkthroughStep].icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {walkthroughSteps[activeWalkthroughStep].title}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {walkthroughSteps[activeWalkthroughStep].subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-xs font-semibold leading-relaxed text-gray-500">
                  {walkthroughSteps[activeWalkthroughStep].desc}
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {walkthroughSteps[activeWalkthroughStep].bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Visual highlights */}
              <div className="sm:col-span-4 p-5 rounded-2xl bg-purple-50/20 border border-purple-100/40 text-center space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {walkthroughSteps[activeWalkthroughStep].statLabel}
                </div>
                <div className="text-2xl font-black text-slate-900" style={{ color: 'var(--primary-purple, #6028D9)' }}>
                  {walkthroughSteps[activeWalkthroughStep].statVal}
                </div>
                <p className="text-[9px] font-semibold text-gray-400 leading-snug">
                  Audited performance rating on logical nodes.
                </p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-purple-100">
              <button
                onClick={() => {
                  setShowDemoModal(false);
                  navigate('/book-demo');
                }}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 rounded-xl border border-purple-100 bg-white hover:bg-slate-50 cursor-pointer shadow-sm"
              >
                Book Personal Demo
              </button>
              <div className="flex gap-2">
                <button
                  disabled={activeWalkthroughStep === 0}
                  onClick={() => setActiveWalkthroughStep(prev => prev - 1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-transparent rounded-xl hover:bg-slate-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (activeWalkthroughStep < walkthroughSteps.length - 1) {
                      setActiveWalkthroughStep(prev => prev + 1);
                    } else {
                      setShowDemoModal(false);
                      navigate('/support');
                    }
                  }}
                  className="px-5 py-2 text-white text-xs font-bold rounded-xl border-none shadow-md cursor-pointer"
                  style={{ background: 'var(--cta-gradient)' }}
                >
                  {activeWalkthroughStep === walkthroughSteps.length - 1 ? 'Get in Touch' : 'Next Step'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <UniversalFooter />
    </div>
  );
};

export default LandingPage;
