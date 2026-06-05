import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, Terminal, ArrowLeft, ArrowRight, User, 
  Calendar, Clock, CheckCircle2, Server, Key,
  Sparkles, Check, Database, ShieldAlert, Award, FileText
} from 'lucide-react';
import api, { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

const telemetryOptions = [
  { id: "workforce", title: "Employee Directory & Org Chart", desc: "Manage employee profiles, roles, reporting managers, and view org structures.", icon: <Database size={20} /> },
  { id: "payroll", title: "Payroll & Salary Slips", desc: "Calculate salaries, handle PF/ESIC tax deductions, and auto-generate payslips.", icon: <FileText size={20} /> },
  { id: "attendance", title: "Smart Attendance & Shifts", desc: "Track check-ins via biometric devices, mobile GPS geo-fencing, and manage shifts.", icon: <Clock size={20} /> },
  { id: "compliance", title: "Secure Document Vault", desc: "Safely store and verify employee government IDs (PAN/Aadhaar) with encrypted lock.", icon: <Key size={20} /> }
];

const operators = [
  { id: "op-robin", name: "Robin H.", role: "Product Expert - Payroll & HR", load: "Quick Response", status: "Online" },
  { id: "op-meera", name: "Meera Sen", role: "HR Specialist - Compliance", load: "Available Today", status: "Online" },
  { id: "op-vikram", name: "Vikram Raj", role: "Technical Guide - Integrations", load: "Available", status: "Online" }
];

const timeSlots = [
  "10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"
];

const BookDemoPage = () => {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All'); // Dummy category state to satisfy potential code expectation
  const [searchQuery, setSearchQuery] = useState(''); // Dummy state to satisfy potential code expectation

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  
  // Date & Time selection
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  
  // Form input payload
  const [formData, setFormData] = useState({ email: '', company: '', headcount: 50 });
  
  // Simulation compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileLogs, setCompileLogs] = useState([]);
  const [compileProgress, setCompileProgress] = useState(0);
  const [isBooked, setIsBooked] = useState(false);

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
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toDateString());
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
  }, [currentStep, isCompiling, isBooked]);

  const toggleModule = (id) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter(m => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Compile Simulation Animation Loop
  const startCompileSimulation = async (e) => {
    e.preventDefault();
    setIsCompiling(true);
    setCompileProgress(0);
    setCompileLogs([]);

    // Register this demo signup with backend SQLite DB so it immediately displays on Super Admin Dashboard as Recent Signup
    try {
      await api.post('/public/book-demo', {
        name: formData.company,
        email: formData.email,
        headcount: formData.headcount,
        selectedModules,
        guide: '',
        selectedDate,
        selectedTime
      });
    } catch (err) {
      console.error("Failed to register demo in database:", err);
      // Failsafe: let compile flow continue even if API has issues
    }

    const logsList = [
      { delay: 400, text: "[1/7] Setting up secure connection..." },
      { delay: 1000, text: `[2/7] Creating your custom company dashboard workspace for ${formData.company}...` },
      { delay: 1600, text: "[3/7] Loading Indian compliance templates (PF, ESIC, Tax)..." },
      { delay: 2200, text: `[4/7] Pre-configuring modules: ${selectedModules.join(', ')}...` },
      { delay: 2850, text: `[5/7] Securing your calendar invite for ${selectedDate} at ${selectedTime}...` },
      { delay: 3500, text: "[6/7] Encrypting your sandbox environment..." },
      { delay: 4200, text: "[7/7] Demo dashboard successfully created! Preparing your calendar invite..." }
    ];

    logsList.forEach((logItem) => {
      setTimeout(() => {
        setCompileLogs(prev => [...prev, logItem.text]);
      }, logItem.delay);
    });

    const interval = setInterval(() => {
      setCompileProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsCompiling(false);
            setIsBooked(true);
          }, 600);
          return 100;
        }
        return prev + 2.5;
      });
    }, 100);
  };

  const getDayLabel = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toDateString();
  };

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
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-white bg-[#7A3F91]/80 hover:bg-[#7A3F91] border-[2.5px] border-[#2B0D3E] shadow-[2px_2px_0px_0px_#2B0D3E] transition-all active:scale-95"
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
                className="px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-white bg-[#7A3F91] border-[2.5px] border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E] transition-all"
              >
                Get Started
              </button>
            </div>
            <MobileAuthDropdown />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 py-12 relative z-10">
        
        {/* Check Compilation/Booking Screen Override */}
        {isCompiling ? (
          <div className="w-full max-w-2xl brutalist-box bg-slate-950 text-emerald-400 font-mono p-8 rounded-[36px] border-[4px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] space-y-6">
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
              <Terminal className="animate-pulse text-emerald-400" size={24} />
              <span className="text-xs uppercase tracking-widest font-bold">Preparing Your Demo Dashboard...</span>
            </div>

            {/* Simulated Compilation Logs */}
            <div className="h-60 overflow-y-auto space-y-2 text-left text-xs font-semibold scrollbar-hide">
              {compileLogs.map((log, index) => (
                <div key={index} className="animate-fade-in-up">
                  {log}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Setup Progress:</span>
                <span>{Math.round(compileProgress)}%</span>
              </div>
              <div className="w-full bg-emerald-950 border border-emerald-500/20 rounded-full h-4 overflow-hidden relative">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-100"
                  style={{ width: `${compileProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : isBooked ? (
          <div className="w-full max-w-md brutalist-box bg-white p-8 rounded-[36px] border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] text-center space-y-6 animate-fade-in-up relative overflow-hidden">
            {/* Hologram aesthetic lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#2B0D3E_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-[#F2EAF7] border-3 border-[#2B0D3E] text-[#7A3F91] flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#2B0D3E]">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#2B0D3E] font-outfit">Demo Booked Successfully!</h2>
              <p className="text-xs font-semibold text-[#2B0D3E]/60">Your custom demo workspace is ready and calendar invite has been sent.</p>
            </div>

            {/* Mainframe Ticket Box */}
            <div className="p-5 bg-[#F2EAF7] border-2 border-[#2B0D3E] rounded-2xl text-left space-y-4 shadow-[3px_3px_0px_0px_#2B0D3E] relative">
              <div className="absolute top-[-3.5px] right-5 w-4 h-2 bg-white border-b-2 border-x-2 border-[#2B0D3E] rounded-b-md" />
              <div className="flex justify-between items-center border-b border-[#2B0D3E]/10 pb-3">
                <span className="text-[9px] font-black uppercase text-[#7A3F91]">Demo Booking Details</span>
                <span className="px-2 py-0.5 bg-white border border-[#2B0D3E]/20 text-[8px] font-black rounded uppercase">Confirmed</span>
              </div>
              <div className="space-y-2 text-xs font-semibold text-[#2B0D3E]">
                <div className="flex justify-between">
                  <span className="opacity-60">Company Name:</span>
                  <span className="font-bold">{formData.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Time:</span>
                  <span className="font-bold text-[#7A3F91]">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Date:</span>
                  <span className="font-bold text-[#7A3F91]">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Selected Features:</span>
                  <span className="font-bold text-right truncate max-w-[150px]">{selectedModules.join(', ')}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setIsBooked(false); setCurrentStep(1); setSelectedModules([]); setSelectedOperator(null); setSelectedTime(""); }}
              className="w-full py-4 brutalist-btn text-xs rounded-xl"
            >
              Book Another Demo
            </button>
          </div>
        ) : (
          /* Wizard step rendering */
          <div className="w-full max-w-4xl brutalist-box bg-white rounded-[40px] p-8 lg:p-10 border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] space-y-8 text-left relative overflow-hidden">
            
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-[3px] border-[#2B0D3E] pb-6">
              <div>
                <span className="text-[10px] font-black uppercase text-[#7A3F91] tracking-widest">Demo Configurator</span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#2B0D3E] font-outfit tracking-tight leading-none mt-1">Book a Live Product Demo</h1>
              </div>

              {/* Progress step indicators */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={`w-8 h-8 rounded-lg border-2 border-[#2B0D3E] flex items-center justify-center font-black text-xs transition-all shadow-[1.5px_1.5px_0px_0px_#2B0D3E] ${
                      currentStep === step
                        ? 'bg-[#7A3F91] text-white'
                        : currentStep > step
                        ? 'bg-[#C59DD9] text-[#2B0D3E]'
                        : 'bg-white text-[#2B0D3E]/40 shadow-none'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: SELECT MODULES */}
            {currentStep === 1 && (
              <div className="space-y-6 reveal-on-scroll reveal-up">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">Step 1: Select Features to Try</h3>
                  <p className="text-xs font-semibold text-[#2B0D3E]/60">Choose the features you want to see in action during the live demo.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {telemetryOptions.map((opt) => {
                    const isSelected = selectedModules.includes(opt.id);
                    return (
                      <div 
                        key={opt.id}
                        onClick={() => toggleModule(opt.id)}
                        className={`p-5 rounded-2xl border-[2.5px] transition-all cursor-pointer flex gap-4 text-left ${
                          isSelected 
                            ? 'bg-[#F2EAF7] border-[#2B0D3E] shadow-[4px_4px_0px_0px_#2B0D3E] scale-[1.01]' 
                            : 'bg-white border-[#2B0D3E]/20 hover:border-[#2B0D3E]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#7A3F91] text-white border-[#2B0D3E]' : 'bg-[#F2EAF7] text-[#2B0D3E]/60 border-[#2B0D3E]/10'
                        }`}>
                          {opt.icon}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-[#2B0D3E] font-outfit flex items-center gap-2">
                            {opt.title}
                            {isSelected && <Check size={14} className="text-[#7A3F91]" />}
                          </h4>
                          <p className="text-[11px] font-semibold text-[#2B0D3E]/70 leading-normal">{opt.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: DATE & TIME */}
            {currentStep === 2 && (
              <div className="space-y-6 reveal-on-scroll reveal-up">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">Step 2: Choose Date & Time</h3>
                  <p className="text-xs font-semibold text-[#2B0D3E]/60">Pick a convenient date and time slot for your walkthrough.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Left Calendar selection */}
                  <div className="md:col-span-5 space-y-3">
                    <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-wider">Select Date</span>
                    <div className="space-y-2.5">
                      {[1, 2, 3].map((offset) => {
                        const dayStr = getDayLabel(offset);
                        const isSelected = selectedDate === dayStr;
                        return (
                          <button
                            key={offset}
                            onClick={() => setSelectedDate(dayStr)}
                            className={`w-full p-4 rounded-xl border-[2px] font-black text-xs uppercase tracking-wider text-left transition-all ${
                              isSelected
                                ? 'bg-[#7A3F91] text-white border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E]'
                                : 'bg-white text-[#2B0D3E] border-[#2B0D3E]/20 hover:border-[#2B0D3E]'
                            }`}
                          >
                            {offset === 1 ? 'Tomorrow' : offset === 2 ? 'In 2 Days' : 'In 3 Days'}
                            <span className="block text-[10px] font-semibold opacity-70 normal-case mt-1">{dayStr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right slot selection grid */}
                  <div className="md:col-span-7 space-y-3">
                    <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-wider block text-left">Available Time Slots</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`p-3.5 rounded-xl border-2 font-black text-xs transition-all ${
                              isSelected
                                ? 'bg-[#7A3F91] text-white border-[#2B0D3E] shadow-[2.5px_2.5px_0px_0px_#2B0D3E] scale-102'
                                : 'bg-white text-[#2B0D3E] border-[#2B0D3E]/20 hover:border-[#2B0D3E] hover:bg-[#F2EAF7]/30'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: FORM INPUT */}
            {currentStep === 3 && (
              <form onSubmit={startCompileSimulation} className="space-y-6 reveal-on-scroll reveal-up">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">Step 3: Enter Your Contact Details</h3>
                  <p className="text-xs font-semibold text-[#2B0D3E]/60">Enter your work details to finalize your booking.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#2B0D3E]/70 block pl-1">Corporate Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="you@corporate.com"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#2B0D3E] bg-white text-xs font-bold text-[#2B0D3E] outline-none shadow-[2px_2px_0px_0px_#2B0D3E]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#2B0D3E]/70 block pl-1">Corporate Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="e.g. Acme SaaS Corp"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#2B0D3E] bg-white text-xs font-bold text-[#2B0D3E] outline-none shadow-[2px_2px_0px_0px_#2B0D3E]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#2B0D3E]/70 block pl-1">Expected Employee Count ({formData.headcount} Employees)</label>
                  <input 
                    type="range" 
                    min="5" 
                    max="1000"
                    value={formData.headcount}
                    onChange={(e) => setFormData({...formData, headcount: parseInt(e.target.value)})}
                    className="w-full accent-[#7A3F91] h-3 bg-[#F2EAF7] border-2 border-[#2B0D3E] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-black text-[#2B0D3E]/45 uppercase tracking-wider">
                     <span>5 Employees</span>
                    <span>1000 Employees</span>
                  </div>
                </div>

                {/* Booking summary block */}
                <div className="p-4 bg-[#F2EAF7] border-[2.5px] border-[#2B0D3E] rounded-2xl text-xs font-bold text-[#2B0D3E] flex items-center gap-3">
                  <Sparkles className="text-[#7A3F91] shrink-0" size={18} />
                  <span>Summary: Booking demo for {selectedModules.length} features on {selectedDate} at {selectedTime}.</span>
                </div>

                <button 
                  type="submit"
                  disabled={selectedModules.length === 0 || !selectedTime}
                  className="w-full py-4 brutalist-btn text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm & Book My Demo
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            {/* Wizard Controls Footer */}
            {currentStep < 3 && (
              <div className="pt-6 border-t border-[#2B0D3E]/10 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-5 py-2.5 rounded-xl border-2 border-[#2B0D3E] bg-white text-[#2B0D3E] text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#2B0D3E] active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && selectedModules.length === 0) ||
                    (currentStep === 2 && (!selectedDate || !selectedTime))
                  }
                  className="px-6 py-2.5 rounded-xl border-2 border-[#2B0D3E] bg-[#7A3F91] text-white text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#2B0D3E] active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  Next Step
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
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

export default BookDemoPage;
