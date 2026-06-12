import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, Terminal, ArrowLeft, ArrowRight, User, 
  Calendar, Clock, CheckCircle2, Server, Key,
  Sparkles, Check, Database, ShieldAlert, Award, FileText
} from 'lucide-react';
import api, { fetchBranding, getAssetUrl } from '../utils/api';
import UniversalHeader from '../components/layout/UniversalHeader';
import UniversalFooter from '../components/layout/UniversalFooter';
import '../styles/landing.css';
import BlurText from '../components/common/BlurText';
import SplitText from '../components/common/SplitText';
import ScrollReveal from '../components/common/ScrollReveal';
import Antigravity from '../components/common/Antigravity';

const telemetryOptions = [
  { id: "workforce", title: "Employee Directory & Org Chart", desc: "Manage employee profiles, roles, reporting managers, and view org structures.", icon: <Database size={20} /> },
  { id: "payroll", title: "Payroll & Salary Slips", desc: "Calculate salaries, handle PF/ESIC tax deductions, and auto-generate payslips.", icon: <FileText size={20} /> },
  { id: "attendance", title: "Smart Attendance & Shifts", desc: "Track check-ins via biometric devices, mobile GPS geo-fencing, and manage shifts.", icon: <Clock size={20} /> },
  { id: "compliance", title: "Secure Document Vault", desc: "Safely store and verify employee government IDs (PAN/Aadhaar) with encrypted lock.", icon: <Key size={20} /> }
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

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModules, setSelectedModules] = useState([]);
  
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
    <div className="landing-body min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-white text-slate-800">
      {/* Decorative Blur Backdrops */}
      <div className="bg-mesh animate-pulse opacity-40" />
      <div className="bg-mesh-right opacity-45" />

      {/* Universal Header */}
      <UniversalHeader />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
          <Antigravity
            count={150}
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
        <div className="relative z-10 flex w-full justify-center items-center">
        
        {/* Check Compilation/Booking Screen Override */}
        {isCompiling ? (
          <div className="w-full max-w-2xl bg-slate-950 text-emerald-400 font-mono p-8 rounded-[32px] border border-emerald-500/20 shadow-2xl space-y-6">
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
          <div className="w-full max-w-md bg-white p-8 rounded-[32px] border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] text-center space-y-6 animate-fade-in-up relative overflow-hidden">
            {/* Hologram aesthetic lines */}
            <div className="absolute inset-0 bg-[radial-gradient(var(--primary-purple)_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-purple-50 text-[var(--primary-purple)] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Demo Booked Successfully!</h2>
              <p className="text-xs font-semibold text-gray-500">Your custom demo workspace is ready and calendar invite has been sent.</p>
            </div>

            {/* Mainframe Ticket Box */}
            <div className="p-5 bg-purple-50/20 border border-purple-100 rounded-2xl text-left space-y-4 shadow-sm relative">
              <div className="flex justify-between items-center border-b border-purple-100 pb-3">
                <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--primary-purple)' }}>Demo Booking Details</span>
                <span className="px-2 py-0.5 bg-white border border-purple-100 text-[8px] font-bold rounded uppercase">Confirmed</span>
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="opacity-60">Company Name:</span>
                  <span className="font-bold">{formData.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Time:</span>
                  <span className="font-bold text-slate-950">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Date:</span>
                  <span className="font-bold text-slate-950">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Selected Features:</span>
                  <span className="font-bold text-right truncate max-w-[150px]">{selectedModules.join(', ')}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setIsBooked(false); setCurrentStep(1); setSelectedModules([]); setSelectedTime(""); }}
              className="w-full py-3.5 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer border-none shadow-md"
              style={{ background: 'var(--cta-gradient)' }}
            >
              Book Another Demo
            </button>
          </div>
        ) : (
          /* Wizard step rendering */
          <div className="w-full max-w-4xl bg-white rounded-[32px] p-8 lg:p-10 border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] space-y-8 text-left relative overflow-hidden">
            
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-100 pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--primary-purple)' }}>
                  <SplitText text="Demo Configurator" className="inline-block" tag="span" textAlign="left" delay={30} />
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
                  <BlurText text="Book a Live Product Demo" className="inline-flex" />
                </h1>
              </div>

              {/* Progress step indicators */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => {
                  const isActive = currentStep === step;
                  const isCompleted = currentStep > step;
                  return (
                    <div 
                      key={step}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                        isActive
                          ? 'text-white'
                          : isCompleted
                          ? 'bg-purple-50 text-[var(--primary-purple)] border-purple-100'
                          : 'bg-white text-gray-300 border-gray-100 shadow-none'
                      }`}
                      style={{
                        backgroundColor: isActive ? 'var(--primary-purple)' : undefined,
                        borderColor: isActive ? 'var(--primary-purple)' : undefined
                      }}
                    >
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 1: SELECT MODULES */}
            {currentStep === 1 && (
              <div className="space-y-6 reveal-on-scroll reveal-up">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900">Step 1: Select Features to Try</h3>
                  <ScrollReveal containerClassName="text-xs font-semibold text-gray-500 block text-left" baseOpacity={0.1}>
                    Choose the features you want to see in action during the live demo.
                  </ScrollReveal>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {telemetryOptions.map((opt) => {
                    const isSelected = selectedModules.includes(opt.id);
                    return (
                      <div 
                        key={opt.id}
                        onClick={() => toggleModule(opt.id)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 text-left ${
                          isSelected 
                            ? 'bg-purple-50/20 border-purple-200 shadow-sm scale-[1.01]' 
                            : 'bg-white border-purple-100 hover:border-purple-200'
                        }`}
                      >
                        <div 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected 
                              ? 'text-white border-transparent' 
                              : 'bg-purple-50/50 text-purple-400 border-purple-100/30'
                          }`}
                          style={{
                            backgroundColor: isSelected ? 'var(--primary-purple)' : undefined
                          }}
                        >
                          {opt.icon}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            {opt.title}
                            {isSelected && <Check size={14} style={{ color: 'var(--primary-purple)' }} />}
                          </h4>
                          <p className="text-[11px] font-semibold text-gray-500 leading-normal">{opt.desc}</p>
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
                  <h3 className="text-lg font-bold text-slate-900">Step 2: Choose Date & Time</h3>
                  <p className="text-xs font-semibold text-gray-500">Pick a convenient date and time slot for your walkthrough.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Left Calendar selection */}
                  <div className="md:col-span-5 space-y-3">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Select Date</span>
                    <div className="space-y-2.5">
                      {[1, 2, 3].map((offset) => {
                        const dayStr = getDayLabel(offset);
                        const isSelected = selectedDate === dayStr;
                        return (
                          <button
                            key={offset}
                            onClick={() => setSelectedDate(dayStr)}
                            className={`w-full p-4 rounded-xl border font-bold text-xs uppercase tracking-wider text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'text-white shadow-md border-transparent'
                                : 'bg-white text-slate-700 border-purple-100 hover:border-purple-200'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--primary-purple)' : undefined
                            }}
                          >
                            {offset === 1 ? 'Tomorrow' : offset === 2 ? 'In 2 Days' : 'In 3 Days'}
                            <span className={`block text-[10px] font-semibold normal-case mt-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{dayStr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right slot selection grid */}
                  <div className="md:col-span-7 space-y-3">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block text-left">Available Time Slots</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'text-white shadow-md border-transparent'
                                : 'bg-white text-slate-700 border-purple-100 hover:border-purple-200 hover:bg-purple-50/30'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--primary-purple)' : undefined
                            }}
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
                  <h3 className="text-lg font-bold text-slate-900">Step 3: Enter Your Contact Details</h3>
                  <p className="text-xs font-semibold text-gray-500">Enter your work details to finalize your booking.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-gray-400 block pl-1">Corporate Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="you@corporate.com"
                      className="w-full px-4 py-3 rounded-xl border border-purple-100 bg-slate-50 text-xs font-bold placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#6028D9]/40 transition-colors"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-gray-400 block pl-1">Corporate Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="e.g. Acme SaaS Corp"
                      className="w-full px-4 py-3 rounded-xl border border-purple-100 bg-slate-50 text-xs font-bold placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#6028D9]/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold uppercase text-gray-400 block pl-1">Expected Employee Count ({formData.headcount} Employees)</label>
                  <input 
                    type="range" 
                    min="5" 
                    max="1000"
                    value={formData.headcount}
                    onChange={(e) => setFormData({...formData, headcount: parseInt(e.target.value)})}
                    className="w-full h-2 bg-purple-100 rounded-lg cursor-pointer appearance-none"
                    style={{ accentColor: 'var(--primary-purple)' }}
                  />
                  <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                     <span>5 Employees</span>
                    <span>1000 Employees</span>
                  </div>
                </div>

                {/* Booking summary block */}
                <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-3">
                  <Sparkles className="shrink-0" style={{ color: 'var(--primary-purple)' }} size={18} />
                  <span>Summary: Booking demo for {selectedModules.length} features on {selectedDate} at {selectedTime}.</span>
                </div>

                <button 
                  type="submit"
                  disabled={selectedModules.length === 0 || !selectedTime}
                  className="w-full py-3.5 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-md cursor-pointer"
                  style={{ background: 'var(--cta-gradient)' }}
                >
                  Confirm & Book My Demo
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            {/* Wizard Controls Footer */}
            {currentStep < 3 && (
              <div className="pt-6 border-t border-purple-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-5 py-2.5 rounded-xl border border-purple-100 bg-white text-slate-700 text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-slate-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                  className="px-6 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 border-none"
                  style={{
                    background: 'var(--cta-gradient)'
                  }}
                >
                  Next Step
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

          </div>
        )}

        </div>
      </main>

      {/* Universal Footer */}
      <UniversalFooter />
    </div>
  );
};

export default BookDemoPage;
