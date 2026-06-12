import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Shield, Cpu, 
  MapPin, Calendar, Award, Star, ArrowRight,
  ChevronDown
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

const AboutPage = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const aboutCtaRef = useRef(null);
  const valuesContainerRef = useRef(null);
  const teamContainerRef = useRef(null);
  
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

  const toggleDropdown = (menuName) => {
    if (activeDropdown === menuName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(menuName);
    }
  };

  const milestones = [
    {
      year: "2024",
      title: "Founding in Jaipur",
      desc: "MyFastHR was founded with a single mission: to eliminate the paperwork and manual audits from small-business HR routines."
    },
    {
      year: "2025",
      title: "Isolated Nodes Launch",
      desc: "Engineered and deployed isolated logical schema nodes for corporate tenants, bringing bank-grade isolation security to the platform."
    },
    {
      year: "2026",
      title: "Real-Time Telemetry Muster",
      desc: "Synced biometric terminals directly with SaaS ledger engines, enabling automated late penalties and overtime logs computation in real time."
    }
  ];

  const values = [
    {
      icon: <Cpu size={24} />,
      title: "Pure Automation",
      desc: "We build systems that compute splits, rosters, and penalties automatically, freeing managers for strategic tasks."
    },
    {
      icon: <Shield size={24} />,
      title: "Absolute Isolation",
      desc: "Your employee data deserves isolated parameters. We guarantee structural cross-tenant security locks."
    },
    {
      icon: <Users size={24} />,
      title: "Human Focus",
      desc: "Software should serve humans, not the other way around. Every check-in profile card is made clean and easy."
    }
  ];

  const team = [
    {
      name: "Robin H.",
      role: "VP Engineering",
      desc: "Distributed systems engineer. Built the core logical database node shard infrastructure.",
      avatarText: "RH"
    },
    {
      name: "Meera Sen",
      role: "Compliance Director",
      desc: "Statutory tax audit specialist. Oversees PF/ESIC formulas accuracy audits.",
      avatarText: "MS"
    },
    {
      name: "Vikram Raj",
      role: "Chief Security Architect",
      desc: "Cryptographic protocol designer. Managed the AES-256 vault configurations.",
      avatarText: "VR"
    }
  ];

  return (
    <div ref={pageRef} className="landing-body min-h-screen flex flex-col bg-white">
      <UniversalHeader />

      {/* 2. Hero Section */}
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
            <SplitText text="Our Story." className="inline-block" tag="span" textAlign="center" delay={30} /> <span className="text-[#6028D9]"><BlurText text="Built Differently." className="inline-flex" /></span>
          </h1>
          <SplitText 
            text="We are a small team of engineers, security architects, and compliance experts building the future of autonomous workplace operations from Jaipur." 
            className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed block"
            tag="p"
            textAlign="center"
            splitType="words"
            delay={20}
            duration={0.8}
          />
        </div>
      </section>

      {/* 3. Core Values */}
      <section className="px-6 py-16">
        <div ref={valuesContainerRef} className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8" style={{ position: 'relative' }}>
          {values.map((val, idx) => (
            <div key={idx} className="premium-card p-6 text-left space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#E9D5FF]/40 text-[#6028D9] flex items-center justify-center">
                  {val.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  <VariableProximity
                    label={val.title}
                    fromFontVariationSettings="'wght' 400"
                    toFontVariationSettings="'wght' 900"
                    containerRef={valuesContainerRef}
                    radius={100}
                    falloff="linear"
                  />
                </h3>
                <div className="text-xs text-gray-500 leading-relaxed block text-left" style={{ position: 'relative' }}>
                  <VariableProximity
                    label={val.desc}
                    fromFontVariationSettings="'wght' 400"
                    toFontVariationSettings="'wght' 900"
                    containerRef={valuesContainerRef}
                    radius={100}
                    falloff="linear"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Journey Timeline */}
      <section className="px-6 py-16 bg-[#F1F5F9]/40">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              <VariableProximity
                label="Our Journey Node"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              <VariableProximity
                label="How we scaled from Jaipur code repositories to serving corporate enterprise systems."
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 900"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </p>
          </div>

          <div className="relative border-l border-gray-300 ml-4 md:ml-32 space-y-10 py-2">
            {milestones.map((mil, idx) => (
              <div key={idx} className="relative pl-8 md:pl-10 text-left">
                <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#6028D9] border-2 border-white shadow-sm" />
                
                <div className="md:absolute md:left-[-150px] md:top-0 w-24 text-left">
                  <span className="badge-purple font-mono">
                    <VariableProximity
                      label={mil.year}
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E9D5FF] shadow-sm max-w-2xl mt-3 md:mt-0">
                  <h4 className="text-sm font-bold text-gray-800 leading-none mb-2">
                    <VariableProximity
                      label={mil.title}
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <VariableProximity
                      label={mil.desc}
                      fromFontVariationSettings="'wght' 400"
                      toFontVariationSettings="'wght' 900"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Team Section */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              <VariableProximity
                label="Core Leadership Nodes"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              <VariableProximity
                label="Meet the system operators coordinating the platform mainframe."
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 900"
                containerRef={pageRef}
                radius={120}
                falloff="linear"
              />
            </p>
          </div>

          <div ref={teamContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" style={{ position: 'relative' }}>
            {team.map((member, idx) => (
              <div key={idx} className="premium-card p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E9D5FF] to-[#6028D9] flex items-center justify-center text-white font-bold text-lg mx-auto shadow-inner">
                  <VariableProximity
                    label={member.avatarText}
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={teamContainerRef}
                    radius={100}
                    falloff="linear"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 leading-none">
                    <VariableProximity
                      label={member.name}
                      fromFontVariationSettings="'wght' 400"
                      toFontVariationSettings="'wght' 900"
                      containerRef={teamContainerRef}
                      radius={100}
                      falloff="linear"
                    />
                  </h4>
                  <span className="text-[10px] text-[#6028D9] font-bold uppercase tracking-wider block mt-1">
                    <VariableProximity
                      label={member.role}
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={teamContainerRef}
                      radius={100}
                      falloff="linear"
                    />
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  <VariableProximity
                    label={member.desc}
                    fromFontVariationSettings="'wght' 400"
                    toFontVariationSettings="'wght' 900"
                    containerRef={teamContainerRef}
                    radius={100}
                    falloff="linear"
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="px-6 py-16">
        <div ref={aboutCtaRef} className="max-w-4xl mx-auto bg-purple-50 rounded-2xl p-6 lg:p-8 text-center border border-purple-100 space-y-6" style={{ position: 'relative' }}>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-950 leading-tight">
            <VariableProximity
              label="Ready to verify compliance schemas?"
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={aboutCtaRef}
              radius={120}
              falloff="linear"
            />
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            <VariableProximity
              label="Deploy an isolated sandbox in under 10 minutes. Zero legacy setup hooks, zero credit cards required."
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={aboutCtaRef}
              radius={120}
              falloff="linear"
            />
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => navigate('/login')} className="btn-primary px-6 py-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <VariableProximity
                label="Get Started Admin Login"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={aboutCtaRef}
                radius={120}
                falloff="linear"
              />
              <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/pricing')} className="btn-secondary px-6 py-3 text-xs cursor-pointer">
              <VariableProximity
                label="View Pricing Matrix"
                fromFontVariationSettings="'wght' 700"
                toFontVariationSettings="'wght' 950"
                containerRef={aboutCtaRef}
                radius={120}
                falloff="linear"
              />
            </button>
          </div>
        </div>
      </section>

      <UniversalFooter />
    </div>
  );
};

export default AboutPage;
