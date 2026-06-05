import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, FileText, ArrowRight, 
  ArrowLeft, CheckCircle2, ChevronRight, BarChart3, TrendingUp 
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css'; // Reuse landing styling & transitions

const CaseStudiesPage = () => {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);
  const [appName, setAppName] = useState('MyFastHR');

  const [activeSector, setActiveSector] = useState('all');
  const [companyScale, setCompanyScale] = useState(50); // Sliders count
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const loadCaseStudies = async () => {
      try {
        const isProd = import.meta.env.PROD;
        const apiBase = isProd ? '/api' : 'http://localhost:5000/api';
        const response = await fetch(`${apiBase}/public/case-studies`);
        const data = await response.json();
        setCases(data);
      } catch (err) {
        console.error('Failed to load case studies:', err);
        // Fallback defaults
        setCases([
          {
            id: 1,
            title: 'Highway King Enterprises',
            sector: 'logistics',
            size: '250+ Employees',
            challenge: 'Manual attendance log mismatch from 3 hubs and 4 days of payroll compile delay.',
            solution: 'Automated biometric API synchronizer with Isolated Database instances.',
            metrics: [
              { label: 'Payroll compiling time', before: '32 Hours', after: '20 Minutes', status: 'saved' },
              { label: 'Biometric discrepancies', before: '14%', after: '0%', status: 'prevented' }
            ],
            color: '#7A3F91',
            bg: '#F2EAF7',
            summaryText: `CASE STUDY: HIGHWAY KING ENTERPRISES\nSector: Logistics & Operations\nSize: 250+ Employees\n\nCHALLENGE:\nHighway King had manual attendance discrepancies across multiple physical hubs. Payroll took 4 whole operational days each month.\n\nSOLUTION:\nDeploying MyFastHR Biometric Sync Node. Real-time logging of punch coordinates directly with Knex schema updates.\n\nIMPACT:\n- Payroll compiler processing down from 32 hours to 20 minutes.\n- Biometric discrepancy rating dropped from 14% to 0%.`
          },
          {
            id: 2,
            title: 'First Attempt Skills Training',
            sector: 'education',
            size: '120+ Staff members',
            challenge: 'PAN & Aadhaar physical audits took weekly management loops with compliance issues.',
            solution: 'Secure Client KYC Approval screen and Encrypted Document Vault storage.',
            metrics: [
              { label: 'Compliance Audit loop', before: '5 Days', after: '30 Seconds', status: 'saved' },
              { label: 'Document vault storage', before: 'Unencrypted', after: 'AES-256 Nodes', status: 'secured' }
            ],
            color: '#0F766E',
            bg: '#CCFBF1',
            summaryText: `CASE STUDY: FIRST ATTEMPT SKILLS TRAINING\nSector: Education / Professional Training\nSize: 120+ Staff members\n\nCHALLENGE:\nManual document checks and compliance audits caused massive back-and-forth communication loops.\n\nSOLUTION:\nKYC Approval Vault in MyFastHR. Allowed direct staff uploads with approval indicators.\n\nIMPACT:\n- Audit approval times reduced from 5 days to 30 seconds.\n- Fully secure Document Vault storage running AES-256 encryptions.`
          },
          {
            id: 3,
            title: 'Divyanshu Tech Labs',
            sector: 'it',
            size: '80+ Developers',
            challenge: 'Spreadsheet shift planning, weekend overrides, and timezone adjustments for remote developers.',
            solution: 'Rosters with Weekend Overrides & automated Leave workflows.',
            metrics: [
              { label: 'Overtime calculation errors', before: '8.4%', after: '0.1%', status: 'prevented' },
              { label: 'Regularization requests', before: '48 Hrs SLA', after: 'Real-time Approval', status: 'approved' }
            ],
            color: '#D97706',
            bg: '#FEF3C7',
            summaryText: `CASE STUDY: DIVYANSHU TECH LABS\nSector: IT Services\nSize: 80+ Developers\n\nCHALLENGE:\nTimezone offsets and multi-shift rosters led to constant manual overrides.\n\nSOLUTION:\nInteractive shifts dashboard with custom weekend overrides and manager telemetry approval.\n\nIMPACT:\n- Overtime discrepancies dropped from 8.4% to 0.1%.\n- SLA for leave regularizations reduced to real-time approvals.`
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadCaseStudies();
  }, []);

  const filteredCases = activeSector === 'all' 
    ? cases 
    : cases.filter(c => c.sector === activeSector);

  // Estimates based on slider scale
  const estHoursSaved = Math.round(companyScale * 0.8 * 12);
  const estAuditSaving = Math.round(companyScale * 140 * 12);

  return (
    <div className="landing-body min-h-screen flex flex-col font-sans relative">
      {/* Decorative backdrops */}
      <div className="bg-mesh" />
      <div className="bg-mesh-right" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F2EAF7]/85 backdrop-blur-md border-b-[3.5px] border-[#2B0D3E] px-6 h-[72px] flex items-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <GlobalHeaderMenu 
            logoUrl={logoUrl}
            appName={appName}
            logoHeight={logoHeight}
            logoError={logoError}
            setLogoError={setLogoError}
          />
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
            <button 
              onClick={() => navigate('/book-demo')}
              className="hidden md:block px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] border-[2.5px] border-[#2B0D3E] bg-[#C59DD9]/40 hover:bg-[#C59DD9]/70 transition-all shadow-[2px_2px_0px_0px_#2B0D3E]"
            >
              Book Demo
            </button>
            <MobileAuthDropdown />
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="relative px-6 py-16 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#2B0D3E] bg-[#C59DD9]/20 shadow-[2px_2px_0px_0px_#2B0D3E] text-[10px] font-black uppercase tracking-wider">
            📊 Metric-Proven Efficiency
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-[#2B0D3E] font-outfit leading-tight tracking-tight">
            Client Success & <br />
            <span className="text-[#7A3F91] underline decoration-[#C59DD9] decoration-wavy">Case Studies</span>
          </h1>
          <p className="text-base sm:text-lg font-semibold text-[#2B0D3E]/80 max-w-2xl mx-auto">
            See how operations hubs, skill institutes, and dev labs eliminated compliance overhead and payroll latency by shifting logs to MyFastHR Mainframe nodes.
          </p>
        </div>
      </section>

      {/* Interactive Sector Filter and Cases Grid */}
      <section className="px-6 py-10 max-w-7xl mx-auto w-full space-y-12">
        
        {/* Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { id: 'all', label: 'All Industries' },
            { id: 'logistics', label: 'Logistics / Hubs' },
            { id: 'education', label: 'Education / Training' },
            { id: 'it', label: 'IT & Software Dev' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSector(tab.id)}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 transition-all active:scale-95 ${
                activeSector === tab.id
                  ? 'bg-[#7A3F91] text-white border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E]'
                  : 'bg-white text-[#2B0D3E] border-[#2B0D3E] shadow-[2px_2px_0px_0px_#2B0D3E] hover:bg-[#F2EAF7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredCases.map(c => (
            <div 
              key={c.id}
              className="brutalist-box bg-white rounded-[32px] p-6 text-left flex flex-col justify-between space-y-6 hover:scale-[1.02] transition-transform"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span 
                    style={{ backgroundColor: c.bg, color: c.color, borderColor: '#2B0D3E' }}
                    className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border"
                  >
                    {c.sector}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{c.size}</span>
                </div>
                <h3 className="text-xl font-black text-[#2B0D3E] font-outfit">{c.title}</h3>
              </div>

              {/* Challenge / Solution details */}
              <div className="space-y-4 pt-4 border-t border-[#F2EAF7]">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-[#2B0D3E]/50 tracking-widest block">Operational Challenge</span>
                  <p className="text-xs font-semibold text-[#2B0D3E]/90 leading-relaxed">{c.challenge}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-[#7A3F91] tracking-widest block">Mainframe Solution</span>
                  <p className="text-xs font-semibold text-[#2B0D3E]/90 leading-relaxed">{c.solution}</p>
                </div>
              </div>

              {/* Visual Metrics comparison */}
              <div className="space-y-3 pt-4 border-t border-[#F2EAF7] flex-grow">
                <span className="text-[9px] font-black uppercase text-[#2B0D3E]/50 tracking-widest block mb-2">Efficiency Metres</span>
                {c.metrics.map((m, idx) => (
                  <div key={idx} className="bg-[#F2EAF7]/40 p-3 rounded-xl border border-[#2B0D3E]/10 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#2B0D3E]">
                      <span>{m.label}</span>
                      <span className="text-[#7A3F91] font-black lowercase">({m.status})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-red-500 line-through">{m.before}</span>
                      <ChevronRight size={14} className="text-[#2B0D3E]/50" />
                      <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {m.after}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* Interactive Savings Estimator Widget */}
      <section className="px-6 py-20 bg-[#F2EAF7] border-t-[3.5px] border-[#2B0D3E]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
          
          {/* Controls */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-[#7A3F91] bg-white border border-[#C59DD9] px-3 py-1 rounded-full">
              Mainframe Savings Estimator
            </span>
            <h2 className="text-3xl font-black text-[#2B0D3E] font-outfit tracking-tight">
              Estimate Your Corporate Impact
            </h2>
            <p className="text-sm font-semibold text-[#2B0D3E]/80">
              Input your workforce scale to see potential annual savings based on the averaged performance metrics of Highway King & First Attempt Skills Training.
            </p>

            <div className="space-y-3 bg-white p-5 border-[2.5px] border-[#2B0D3E] rounded-2xl shadow-[4px_4px_0px_0px_#2B0D3E]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-[#2B0D3E]">Total Active Staff</span>
                <span className="text-sm font-black text-[#7A3F91] font-outfit">{companyScale} Employees</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={companyScale}
                onChange={(e) => setCompanyScale(parseInt(e.target.value))}
                className="w-full h-2 bg-[#C59DD9]/40 rounded-lg appearance-none cursor-pointer accent-[#7A3F91]"
              />
            </div>
          </div>

          {/* Estimates display */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Stat 1 */}
            <div className="brutalist-box bg-white p-6 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Est. HR Hours Saved / Yr</span>
              <span className="text-3xl font-black text-[#2B0D3E] font-outfit block mt-1">
                {estHoursSaved} Hours
              </span>
              <p className="text-[9px] font-medium text-[#2B0D3E]/60 mt-1">Freeing management time from payroll rosters.</p>
            </div>

            {/* Stat 2 */}
            <div className="brutalist-box bg-[#7A3F91] text-white p-6 rounded-2xl shadow-[4px_4px_0px_0px_#2B0D3E] border-[2.5px] border-[#2B0D3E]">
              <span className="text-[10px] font-black uppercase text-white/70 tracking-wider">Audit Leakages Restored</span>
              <span className="text-3xl font-black text-[#C59DD9] font-outfit block mt-1">
                ₹{estAuditSaving.toLocaleString()}
              </span>
              <p className="text-[9px] font-medium text-white/80 mt-1">By preventing biometric mismatches & document gaps.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
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

export default CaseStudiesPage;
