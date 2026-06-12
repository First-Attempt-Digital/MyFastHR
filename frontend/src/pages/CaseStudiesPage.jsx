import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, Users, FileText, ArrowRight, 
  ArrowLeft, CheckCircle2, ChevronRight, BarChart3, TrendingUp 
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import UniversalHeader from '../components/layout/UniversalHeader';
import UniversalFooter from '../components/layout/UniversalFooter';
import '../styles/landing.css'; 
import BlurText from '../components/common/BlurText';
import SplitText from '../components/common/SplitText';
import ScrollReveal from '../components/common/ScrollReveal';
import Antigravity from '../components/common/Antigravity';

const CaseStudiesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);
  const [appName, setAppName] = useState('MyFastHR');

  const getInitialSector = () => {
    const params = new URLSearchParams(location.search);
    return params.get('sector') || 'all';
  };

  const [activeSector, setActiveSector] = useState(getInitialSector);
  const [companyScale, setCompanyScale] = useState(50);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setActiveSector(params.get('sector') || 'all');
  }, [location.search]);

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
            color: 'var(--primary-purple)',
            bg: 'var(--light-purple)',
            summaryText: `CASE STUDY: HIGHWAY KING ENTERPRISES\nSector: Logistics & Operations\nSize: 250+ Employees\n\nCHALLENGE:\nHighway King had manual attendance discrepancies across multiple physical hubs. Payroll took 4 whole operational days each month.\n\nSOLUTION:\nDeploying MyFastHR Biometric Sync Node. Real-time logging of punch coordinates directly with Knex schema updates.\n\nIMPACT:\n- Payroll compiler processing down from 32 hours to 20 minutes.\n- Biometric discrepancy rating dropped from 14% to 0%.`
          },
          {
            id: 2,
            title: 'Vardhman Textiles Ltd.',
            sector: 'manufacturing',
            size: '500+ Factory Workers',
            challenge: 'Multiple shift scheduling, manual overtime calculation errors, and delay in monthly payroll audit compliance.',
            solution: 'Deployed dynamic roster scheduling with automated late-coming & overtime penalty compiler.',
            metrics: [
              { label: 'Overtime calculation errors', before: '11%', after: '0.2%', status: 'prevented' },
              { label: 'Roster sync SLA', before: '3 Days', after: 'Real-time', status: 'synchronized' }
            ],
            color: '#0284C7',
            bg: '#E0F2FE',
            summaryText: `CASE STUDY: VARDHMAN TEXTILES LTD.\nSector: Manufacturing\nSize: 500+ Factory Workers\n\nCHALLENGE:\nMulti-shift scheduling and physical punch errors made overtime tracking highly inaccurate, delaying payroll runs.\n\nSOLUTION:\nMyFastHR dynamic shift roster with automatic overtime penalty computation models.\n\nIMPACT:\n- Overtime calculation disputes reduced from 11% to 0.2%.\n- Shift sync delays minimized to real-time syncs.`
          },
          {
            id: 3,
            title: 'Shree Cement Builders',
            sector: 'construction',
            size: '350+ Construction Staff',
            challenge: 'Managing daily wage employee logs across 8 construction sites with high proxy attendance rates.',
            solution: 'Mobile GPS geo-fenced checks combined with remote manager override authorizations.',
            metrics: [
              { label: 'Proxy attendance cases', before: '18%', after: '0%', status: 'prevented' },
              { label: 'Wage distribution delay', before: '6 Days', after: '1 Hour', status: 'saved' }
            ],
            color: '#4F46E5',
            bg: '#EEF2FF',
            summaryText: `CASE STUDY: SHREE CEMENT BUILDERS\nSector: Construction\nSize: 350+ Construction Staff\n\nCHALLENGE:\nProxy attendance and lack of verification at dispersed building sites inflated actual shift expenses.\n\nSOLUTION:\nGPS geo-fenced mobile verification and on-site supervisor approval controls.\n\nIMPACT:\n- Proxy attendance rates dropped to zero.\n- Instant wage ledger compiler reduced manual verification overhead from 6 days to 1 hour.`
          },
          {
            id: 4,
            title: 'Kanak Valley Supermarkets',
            sector: 'retail',
            size: '180+ Cashiers & Floor Staff',
            challenge: 'High employee churn rate, document onboarding delays, and mismatch in biometric check-in data.',
            solution: 'Super Admin OCR Document Vault verification with direct QR-based staff onboarding.',
            metrics: [
              { label: 'Onboarding lifecycle', before: '4 Days', after: '5 Minutes', status: 'saved' },
              { label: 'Data mismatch issues', before: '12%', after: '0%', status: 'resolved' }
            ],
            color: '#DB2777',
            bg: '#FCE7F3',
            summaryText: `CASE STUDY: KANAK VALLEY SUPERMARKETS\nSector: Retail\nSize: 180+ Staff\n\nCHALLENGE:\nOnboarding staff across stores took days due to background checks and physical document logs.\n\nSOLUTION:\nIntegrated OCR Document Vault and instant company self-onboarding portal.\n\nIMPACT:\n- Candidate onboarding finished within 5 minutes instead of 4 days.\n- System data mismatch cases drops to 0%.`
          },
          {
            id: 5,
            title: 'Narayana Health Hubs',
            sector: 'healthcare',
            size: '300+ Medical Staff',
            challenge: 'Doctor & nurse rotation mismatches, weekend shift overrides, and night shift allowance calculations.',
            solution: 'Custom dynamic Shift Roster and Weekend Override allocation rules.',
            metrics: [
              { label: 'Rotation dispute claims', before: '15%', after: '0.1%', status: 'prevented' },
              { label: 'Shift allowance computation', before: '24 Hours', after: 'Instant', status: 'saved' }
            ],
            color: '#059669',
            bg: '#D1FAE5',
            summaryText: `CASE STUDY: NARAYANA HEALTH HUBS\nSector: Healthcare\nSize: 300+ Medical Staff\n\nCHALLENGE:\nTracking active duty doctors and nurse shifts manually resulted in monthly payroll disputes.\n\nSOLUTION:\nMyFastHR Healthcare roster module featuring weekend shifts and automatic allowance processing.\n\nIMPACT:\n- Roaster disputes reduced from 15% to 0.1%.\n- Dynamic night allowances calculated instantly.`
          },
          {
            id: 6,
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
            id: 7,
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
    <div className="landing-body min-h-screen flex flex-col font-sans relative bg-white text-slate-800">
      {/* Decorative backdrops */}
      <div className="bg-mesh animate-pulse opacity-40" />
      <div className="bg-mesh-right opacity-45" />

      {/* Universal Header */}
      <UniversalHeader />

      {/* Hero Intro */}
      <section className="relative px-6 py-16 text-center overflow-hidden">
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
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-100 bg-purple-50/20 text-xs font-bold uppercase tracking-wider">
            📊 Metric-Proven Efficiency
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight tracking-tight">
            <SplitText text="Client Success &" className="inline-block" tag="span" textAlign="center" delay={30} /> <br />
            <span style={{ color: 'var(--primary-purple)' }}><BlurText text="Case Studies" className="inline-flex" /></span>
          </h1>
          <SplitText 
            text="See how operations hubs, skill institutes, and dev labs eliminated compliance overhead and payroll latency by shifting logs to MyFastHR Mainframe nodes." 
            className="text-xs sm:text-sm md:text-base font-semibold text-gray-500 max-w-2xl mx-auto block"
            tag="p"
            textAlign="center"
            splitType="words"
            delay={20}
            duration={0.8}
          />
        </div>
      </section>

      {/* Interactive Sector Filter and Cases Grid */}
      <section className="px-6 py-10 max-w-7xl mx-auto w-full space-y-12">
        
        {/* Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { id: 'all', label: 'All Industries' },
            { id: 'manufacturing', label: 'Manufacturing' },
            { id: 'construction', label: 'Construction' },
            { id: 'retail', label: 'Retail' },
            { id: 'healthcare', label: 'Healthcare' },
            { id: 'logistics', label: 'Logistics' },
            { id: 'education', label: 'Education' },
            { id: 'it', label: 'IT & Tech' }
          ].map(tab => {
            const isActive = activeSector === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSector(tab.id)}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'text-white shadow-md border-transparent'
                    : 'bg-white text-slate-700 border-purple-100 hover:border-purple-200 hover:bg-slate-50'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--primary-purple)' : undefined
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredCases.map(c => (
            <div 
              key={c.id}
              className="bg-white rounded-[24px] p-6 text-left flex flex-col justify-between space-y-6 border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] hover:shadow-[0_12px_40px_rgba(96,40,217,0.08)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span 
                    style={{ 
                      backgroundColor: c.bg.startsWith('var(') ? 'var(--light-purple)' : c.bg, 
                      color: c.color.startsWith('var(') ? 'var(--primary-purple)' : c.color, 
                      borderColor: 'transparent' 
                    }}
                    className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border"
                  >
                    {c.sector}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.size}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{c.title}</h3>
              </div>

              {/* Challenge / Solution details */}
              <div className="space-y-4 pt-4 border-t border-purple-50">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest block">Operational Challenge</span>
                  <ScrollReveal containerClassName="text-xs font-semibold text-slate-650 leading-relaxed text-slate-650 block text-left" baseOpacity={0.1}>
                    {c.challenge}
                  </ScrollReveal>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest block" style={{ color: 'var(--primary-purple)' }}>Mainframe Solution</span>
                  <p className="text-xs font-semibold text-slate-650 leading-relaxed text-slate-650">{c.solution}</p>
                </div>
              </div>

              {/* Visual Metrics comparison */}
              <div className="space-y-3 pt-4 border-t border-purple-50 flex-grow">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest block mb-2">Efficiency Metrics</span>
                {c.metrics.map((m, idx) => (
                  <div key={idx} className="bg-purple-50/20 p-3 rounded-xl border border-purple-100/40 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                      <span>{m.label}</span>
                      <span className="font-bold lowercase text-gray-400">({m.status})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-rose-500 line-through">{m.before}</span>
                      <ChevronRight size={14} className="text-gray-450 text-gray-400" />
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

      {/* Savings Estimator Widget */}
      <section className="px-6 py-20 bg-purple-50/10 border-t border-purple-100">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
          
          {/* Controls */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest bg-white border border-purple-100 px-3 py-1 rounded-full" style={{ color: 'var(--primary-purple)' }}>
              Mainframe Savings Estimator
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Estimate Your Corporate Impact
            </h2>
            <p className="text-sm font-semibold text-gray-500">
              Input your workforce scale to see potential annual savings based on the averaged performance metrics of Highway King & First Attempt Skills Training.
            </p>

            <div className="space-y-3 bg-white p-5 border border-purple-100 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-700">Total Active Staff</span>
                <span className="text-sm font-bold" style={{ color: 'var(--primary-purple)' }}>{companyScale} Employees</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={companyScale}
                onChange={(e) => setCompanyScale(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--primary-purple)' }}
              />
            </div>
          </div>

          {/* Estimates display */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Stat 1 */}
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] text-left space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Est. HR Hours Saved / Yr</span>
              <span className="text-3xl font-bold text-slate-950 block mt-1">
                {estHoursSaved} Hours
              </span>
              <p className="text-[9px] font-semibold text-gray-400 mt-1">Freeing management time from payroll rosters.</p>
            </div>

            {/* Stat 2 */}
            <div className="text-white p-6 rounded-2xl shadow-lg text-left space-y-1" style={{ background: 'var(--cta-gradient)' }}>
              <span className="text-[10px] font-bold uppercase text-white/80 tracking-wider">Audit Leakages Restored</span>
              <span className="text-3xl font-black block mt-1">
                ₹{estAuditSaving.toLocaleString()}
              </span>
              <p className="text-[9px] font-semibold text-white/70 mt-1">By preventing biometric mismatches & document gaps.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Universal Footer */}
      <UniversalFooter />
    </div>
  );
};

export default CaseStudiesPage;
