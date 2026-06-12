import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Shield, Server, Cpu, Globe, 
  ArrowLeft, CheckCircle2, Lock, Zap
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import UniversalHeader from '../components/layout/UniversalHeader';
import UniversalFooter from '../components/layout/UniversalFooter';
import '../styles/landing.css';
import BlurText from '../components/common/BlurText';
import ScrollReveal from '../components/common/ScrollReveal';
import SplitText from '../components/common/SplitText';
import Antigravity from '../components/common/Antigravity';

const InfrastructurePage = () => {
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
    <div className="landing-body min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-white text-slate-800">
      {/* Decorative Blur Backdrops */}
      <div className="bg-mesh animate-pulse opacity-40" />
      <div className="bg-mesh-right opacity-45" />

      {/* Universal Header */}
      <UniversalHeader />

      {/* 2. Hero Header Section */}
      <section className="relative px-6 py-16 lg:py-24 text-center overflow-hidden">
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
        <div className="relative z-10 max-w-3xl mx-auto space-y-6 reveal-on-scroll reveal-up">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-100 bg-purple-50/30 text-xs font-bold uppercase text-slate-600 hover:bg-purple-50 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} style={{ color: 'var(--primary-purple)' }} /> Back to home
          </button>
          
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-none tracking-tight">
            <SplitText text="Isolated Schema." className="inline-block" tag="span" textAlign="center" delay={30} /> <br/>
            <span style={{ color: 'var(--primary-purple)' }}><BlurText text="Enterprise Nodes." className="inline-flex" /></span>
          </h1>
          <SplitText 
            text="Every business customer gets its own isolated virtual schema node. We guarantee maximum safety, high-speed queries, and automated live backup storage." 
            className="text-xs sm:text-sm md:text-base font-semibold text-gray-500 max-w-xl mx-auto leading-relaxed block"
            tag="p"
            textAlign="center"
            splitType="words"
            delay={20}
            duration={0.8}
          />
        </div>
      </section>

      {/* 3. Stack Architecture */}
      <section className="px-6 pb-24 relative z-10 w-full max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Node Block 1 */}
          <div className="rounded-[24px] p-8 bg-white border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] hover:shadow-[0_12px_40px_rgba(96,40,217,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-6 flex flex-col justify-between reveal-on-scroll reveal-left reveal-delay-100">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center" style={{ color: 'var(--primary-purple)' }}>
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Isolated Database Nodes</h3>
              <ScrollReveal containerClassName="text-xs font-medium text-gray-500 leading-relaxed block text-left" baseOpacity={0.1}>
                Zero data mixing. Every tenant schema resides on isolated logical parameters, eliminating horizontal cross-tenant security failures.
              </ScrollReveal>
            </div>
            <div className="pt-4 border-t border-purple-50 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--primary-purple)' }}>
              <Lock size={14} /> Encrypted DB Splits
            </div>
          </div>

          {/* Node Block 2 */}
          <div className="rounded-[24px] p-8 bg-white border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] hover:shadow-[0_12px_40px_rgba(96,40,217,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-6 flex flex-col justify-between reveal-on-scroll reveal-up reveal-delay-200">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center" style={{ color: 'var(--primary-purple)' }}>
                <Server size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Hybrid Cloud Infrastructure</h3>
              <ScrollReveal containerClassName="text-xs font-medium text-gray-500 leading-relaxed block text-left" baseOpacity={0.1}>
                Hosted on enterprise grade cloud structures with automated live load balancing to handle massive, concurrent payroll calculations.
              </ScrollReveal>
            </div>
            <div className="pt-4 border-t border-purple-50 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--primary-purple)' }}>
              <Zap size={14} /> Auto-Scaling Compute
            </div>
          </div>

          {/* Node Block 3 */}
          <div className="rounded-[24px] p-8 bg-white border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] hover:shadow-[0_12px_40px_rgba(96,40,217,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-6 flex flex-col justify-between reveal-on-scroll reveal-right reveal-delay-300">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center" style={{ color: 'var(--primary-purple)' }}>
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Immutable Security Ledger</h3>
              <ScrollReveal containerClassName="text-xs font-medium text-gray-500 leading-relaxed block text-left" baseOpacity={0.1}>
                Immutable audit trails tracking document reads, salary updates, and compliance approvals inside our secure portal.
              </ScrollReveal>
            </div>
            <div className="pt-4 border-t border-purple-50 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--primary-purple)' }}>
              <CheckCircle2 size={14} /> AES-256 Keys Vault
            </div>
          </div>

        </div>
      </section>

      {/* 4. Graphic Display & Showcase */}
      <section className="px-6 pb-24 relative z-10 w-full max-w-[1200px] mx-auto">
        <div className="bg-white rounded-[32px] p-8 lg:p-10 text-left border border-purple-100 shadow-[0_8px_30px_rgba(96,40,217,0.03)] space-y-6 reveal-on-scroll reveal-scale">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Isolated Database Schema Map</h3>
          <p className="text-xs font-semibold text-gray-500 leading-relaxed">
            Visual breakdown of how database queries are mapped dynamically across tenant schema clusters without latency.
          </p>

          <div className="p-6 bg-purple-50/10 rounded-2xl border border-purple-100/50 relative overflow-hidden flex items-center justify-center min-h-[250px]">
            {/* Visual elements mapping */}
            <div className="flex flex-col sm:flex-row items-center gap-6 z-10 w-full justify-around p-4">
              <div className="w-24 h-24 rounded-full bg-white border border-purple-100 shadow-md flex flex-col items-center justify-center p-2 text-center">
                <Globe size={18} style={{ color: 'var(--primary-purple)' }} />
                <span className="text-[9px] font-bold uppercase mt-1">Tenant A</span>
              </div>
              <div className="w-8 h-[2px] bg-purple-200 hidden sm:block border-t border-dashed" />
              <div className="w-32 h-20 rounded-2xl text-white shadow-lg flex flex-col items-center justify-center p-2 text-center" style={{ background: 'var(--cta-gradient)' }}>
                <Cpu size={18} />
                <span className="text-[9px] font-bold uppercase mt-1">Virtual Mainframe</span>
              </div>
              <div className="w-8 h-[2px] bg-purple-200 hidden sm:block border-t border-dashed" />
              <div className="w-24 h-24 rounded-full bg-white border border-purple-100 shadow-md flex flex-col items-center justify-center p-2 text-center">
                <Globe size={18} style={{ color: 'var(--primary-purple)' }} />
                <span className="text-[9px] font-bold uppercase mt-1">Tenant B</span>
              </div>
            </div>
            {/* Background design dots grid */}
            <div className="absolute inset-0 bg-[radial-gradient(var(--primary-purple)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Universal Footer */}
      <UniversalFooter />
    </div>
  );
};

export default InfrastructurePage;
