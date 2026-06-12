import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, ArrowLeft, ArrowRight, 
  Calendar, Clock, User, Share2, MessageSquare, 
  Sparkles, CheckCircle2, ChevronRight, X
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

const defaultBlogs = [
  {
    id: "blog-1",
    title: "Scaling Hybrid Workforce Nodes Without Latency",
    excerpt: "Learn how modern enterprise structures deploy isolated micro-databases to coordinate remote workforce attendance telemetry without server logs overload.",
    content: "Hybrid remote work is no longer just a management preference; it is a complex distributed systems architecture problem. When thousands of employees across diverse geographic zones log attendance telemetry simultaneously, legacy databases suffer transactional bottlenecks. Under our SaaS database model, we deploy isolated virtual schema nodes that operate independently. Each tenant organization routes its clock-in request payload directly to an assigned server shard, bypassing global database locks and ensuring zero cross-tenant latency. Read on to discover how our engineering team achieved 100% uptime with live load-balanced clusters.",
    category: "HR Tech",
    author: "Robin H. (VP Engineering)",
    date: "May 28, 2026",
    readTime: "4 min read",
    tags: ["Hybrid Work", "Database", "Scale", "Telemetry"],
    image: "/assets/workforce_preview.png",
    relatedIds: ["blog-3", "blog-5"]
  },
  {
    id: "blog-2",
    title: "Automating PF and ESIC Splits: A Compliance Blueprint",
    excerpt: "Navigating statutory payroll calculations is often error-prone. Discover the math behind auto-compiling compliant ledger accounts.",
    content: "Monthly payroll run processes shouldn't consume days of manual audit loops. In modern compliance systems, computing Employee Provident Fund (PF) and Employee State Insurance Corporation (ESIC) contributions requires dynamic rate calculations mapped against salary slabs. By shifting allowance rules into custom mathematical schema definitions, payroll calculations compile in under 20 minutes. This blueprint explores the code algorithms that validate compliance splits against live tax rules, generate immutable audit ledgers, and download verified bank sheet outputs for instant payout release.",
    category: "Payroll",
    author: "Meera Sen (Compliance Director)",
    date: "May 15, 2026",
    readTime: "6 min read",
    tags: ["Compliance", "Payroll", "PF", "ESIC"],
    image: "/assets/payroll_preview.png",
    relatedIds: ["blog-4", "blog-6"]
  },
  {
    id: "blog-3",
    title: "The Shift to Biometric Telemetry & Geo-Fenced Muster Logs",
    excerpt: "How real-time cloud sync APIs are replacing traditional swipe-card terminals in next-generation offices.",
    content: "Legacy physical attendance systems are highly susceptible to proxy logging and hardware failure. With modern biometric APIs, swipe cards are replaced by encrypted face scanners and geofenced mobile checks. In this article, we outline the protocols for secure cloud biometric muster logs. Utilizing unique device hardware identifiers combined with encrypted GPS check-ins, companies ensure accurate, real-time employee attendance status without compromising individual privacy.",
    category: "HR Tech",
    author: "Alex Rivers (IoT Lead)",
    date: "May 08, 2026",
    readTime: "5 min read",
    tags: ["Biometric", "Muster", "IoT", "APIs"],
    image: "/assets/attendance_preview.png",
    relatedIds: ["blog-1", "blog-5"]
  },
  {
    id: "blog-4",
    title: "Building an Encrypted Documents Vault: AES-256 Rules",
    excerpt: "A deep dive into security practices for storing employee legal records and Aadhaar/PAN metadata safely.",
    content: "Employee onboarding documents contain highly sensitive, personally identifiable information (PII). A breach of this data can lead to severe regulatory fines and loss of trust. To safeguard employee assets, our Compliance Vault implements AES-256 bit envelope encryption keys. Each company gets unique cryptographic keys managed through dedicated key rings. This guide details how compliance managers scan, verify, and approve records through an immutable audit trail, keeping data protected.",
    category: "Compliance",
    author: "Vikram Raj (Chief Security Architect)",
    date: "April 29, 2026",
    readTime: "5 min read",
    tags: ["Security", "Compliance", "Encryption", "AES-256"],
    image: "/assets/compliance_preview.png",
    relatedIds: ["blog-2", "blog-6"]
  },
  {
    id: "blog-5",
    title: "Organizational Nodes: Mapping Manager-Employee Loops",
    excerpt: "Designing organic reporting structures that scale dynamically as teams double in size.",
    content: "A static PDF organizational chart is outdated the day it is printed. When teams scale rapidly, reporting structures must adapt dynamically. Utilizing recursive node trees, we map complex manager-employee approval loops in real time. This organizational registry ensures leave approvals, performance reviews, and salary adjustments route automatically to correct decision nodes, drastically reducing management delays.",
    category: "Culture",
    author: "Sarah Jenkins (HR Analyst)",
    date: "April 14, 2026",
    readTime: "3 min read",
    tags: ["Org Chart", "Structure", "Workforce", "Teams"],
    image: "/assets/workforce_preview.png",
    relatedIds: ["blog-1", "blog-3"]
  },
  {
    id: "blog-6",
    title: "Statutory Audits: Preparing for Corporate Compliance",
    excerpt: "An essential checklist for corporate audits, ensuring your company remains 100% compliant year-round.",
    content: "Preparing for a corporate payroll audit is notoriously stressful. By leveraging digital ledgers and automatic tax updates, systems track changes in real-time. This audit checklist breaks down how to maintain transparent ledger exports, secure wage distribution logs, and track statutory files, so that your next corporate audit is fully stress-free.",
    category: "Compliance",
    author: "Meera Sen (Compliance Director)",
    date: "March 30, 2026",
    readTime: "7 min read",
    tags: ["Compliance", "Auditing", "Taxation", "Ledgers"],
    image: "/assets/compliance_preview.png",
    relatedIds: ["blog-2", "blog-4"]
  }
];

const BlogPage = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const blogListContainerRef = useRef(null);
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(40);
  const [logoError, setLogoError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBlog, setSelectedBlog] = useState(null); // Active blog in modal

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
  }, [selectedCategory, searchQuery]); // Re-observe when filter results change

  // Filter Blogs based on search & category selection
  const filteredBlogs = defaultBlogs.filter((blog) => {
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'HR Tech', 'Payroll', 'Compliance', 'Culture'];

  return (
    <div ref={pageRef} className="landing-body min-h-screen flex flex-col bg-white font-sans relative overflow-x-hidden">
      {/* Dynamic Header */}
      <UniversalHeader />

      {/* 2. Hero Header Section */}
      <section className="relative px-6 py-16 lg:py-24 text-center bg-gradient-to-b from-purple-50/50 to-white overflow-hidden">
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase text-gray-600 bg-white border border-gray-200 hover:scale-105 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft size={14} /> 
            <VariableProximity
              label="Back to Home"
              fromFontVariationSettings="'wght' 700"
              toFontVariationSettings="'wght' 950"
              containerRef={pageRef}
              radius={120}
              falloff="linear"
            />
          </button>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            <SplitText text="Corporate Insights." className="inline-block" tag="span" textAlign="center" delay={30} /> <br/>
            <span className="italic" style={{ color: 'var(--primary-purple)' }}><BlurText text="Engineered for Teams." className="inline-flex" /></span>
          </h1>
          <SplitText 
            text="Troubleshooting logs, industry guidelines, and system architectures compiled by our engineering and product teams." 
            className="text-xs sm:text-sm md:text-base font-semibold text-gray-500 max-w-xl mx-auto leading-relaxed block"
            tag="p"
            textAlign="center"
            splitType="words"
            delay={20}
            duration={0.8}
          />

          {/* Search Box Input */}
          <div className="max-w-md mx-auto pt-4 relative">
            <div className="flex items-center bg-white border border-purple-100 rounded-2xl shadow-[0_8px_30px_rgba(96,40,217,0.03)] overflow-hidden px-4 focus-within:border-[#6028D9]/40 transition-colors">
              <Search className="text-gray-400 shrink-0" size={18} />
              <input 
                type="text" 
                placeholder="Search articles, categories, or keywords..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3.5 px-3 outline-none text-xs font-bold text-slate-800 placeholder-gray-400 bg-transparent border-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Filter Tabs */}
      <section className="px-6 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-3">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                  isActive
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-[#E9D5FF] hover:border-[#6028D9] hover:bg-purple-50/50'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--primary-purple)' : undefined,
                  boxShadow: isActive ? '0 4px 14px rgba(96, 40, 217, 0.25)' : '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <VariableProximity
                  label={cat}
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
      </section>

      {/* 4. Blog Posts Grid */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {filteredBlogs.length > 0 ? (
            <div ref={blogListContainerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ position: 'relative' }}>
              {filteredBlogs.map((blog) => (
                <div 
                  key={blog.id}
                  className="bg-white rounded-3xl p-6 border border-purple-100 hover:border-[#6028D9]/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_30px_rgba(96,40,217,0.03)] hover:shadow-[0_12px_40px_rgba(96,40,217,0.08)]"
                >
                  <div className="space-y-4">
                    {/* Image Block */}
                    <div className="w-full aspect-[16/10] rounded-2xl bg-purple-50/50 overflow-hidden relative border border-purple-100">
                      <img 
                        src={blog.image} 
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <span 
                        className="absolute top-3 left-3 px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg text-white animate-pulse"
                        style={{ backgroundColor: 'var(--primary-purple)' }}
                      >
                        <VariableProximity
                          label={blog.category}
                          fromFontVariationSettings="'wght' 700"
                          toFontVariationSettings="'wght' 950"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                      </span>
                    </div>

                    {/* Header details */}
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> 
                        <VariableProximity
                          label={blog.date}
                          fromFontVariationSettings="'wght' 500"
                          toFontVariationSettings="'wght' 900"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> 
                        <VariableProximity
                          label={blog.readTime}
                          fromFontVariationSettings="'wght' 500"
                          toFontVariationSettings="'wght' 900"
                          containerRef={pageRef}
                          radius={120}
                          falloff="linear"
                        />
                      </span>
                    </div>

                    {/* Title & Excerpt */}
                    <h3 className="text-lg font-bold text-slate-900 leading-tight hover:text-[var(--primary-purple)] transition-colors">
                      <VariableProximity
                        label={blog.title}
                        fromFontVariationSettings="'wght' 400"
                        toFontVariationSettings="'wght' 900"
                        containerRef={blogListContainerRef}
                        radius={120}
                        falloff="linear"
                      />
                    </h3>
                    <div className="text-xs text-gray-500 leading-relaxed line-clamp-3 font-medium block text-left" style={{ position: 'relative' }}>
                      <VariableProximity
                        label={blog.excerpt}
                        fromFontVariationSettings="'wght' 400"
                        toFontVariationSettings="'wght' 900"
                        containerRef={blogListContainerRef}
                        radius={120}
                        falloff="linear"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-purple-50 mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <VariableProximity
                        label={blog.author}
                        fromFontVariationSettings="'wght' 500"
                        toFontVariationSettings="'wght' 900"
                        containerRef={pageRef}
                        radius={120}
                        falloff="linear"
                      />
                    </span>
                    <button 
                      onClick={() => setSelectedBlog(blog)}
                      className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl text-white border-none cursor-pointer hover:shadow-lg transition-all"
                      style={{ background: 'var(--cta-gradient)' }}
                    >
                      <VariableProximity
                        label="Read Node"
                        fromFontVariationSettings="'wght' 700"
                        toFontVariationSettings="'wght' 950"
                        containerRef={pageRef}
                        radius={120}
                        falloff="linear"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-purple-100 p-16 text-center space-y-4 shadow-sm max-w-lg mx-auto">
              <BookOpen className="mx-auto text-gray-300" size={40} />
              <h3 className="text-lg font-bold text-slate-800">
                <VariableProximity
                  label="No Articles Matching Query"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={pageRef}
                  radius={120}
                  falloff="linear"
                />
              </h3>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                <VariableProximity
                  label={`We couldn't find any documents matched with "${searchQuery}". Try other key tokens or reset category filters.`}
                  fromFontVariationSettings="'wght' 400"
                  toFontVariationSettings="'wght' 900"
                  containerRef={pageRef}
                  radius={120}
                  falloff="linear"
                />
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="btn-primary px-5 py-2.5 text-xs rounded-xl cursor-pointer"
              >
                <VariableProximity
                  label="Reset Search"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={pageRef}
                  radius={120}
                  falloff="linear"
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. Detail Modal Popup */}
      {selectedBlog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedBlog(null)} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="w-full max-w-3xl bg-white rounded-[32px] border border-purple-100 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-purple-50 flex justify-between items-center bg-purple-50/25">
              <div className="flex items-center gap-3">
                <span 
                  className="px-3.5 py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg"
                  style={{ backgroundColor: 'var(--primary-purple)' }}
                >
                  <VariableProximity
                    label={selectedBlog.category}
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <VariableProximity
                    label={selectedBlog.readTime}
                    fromFontVariationSettings="'wght' 500"
                    toFontVariationSettings="'wght' 900"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </span>
              </div>
              <button 
                onClick={() => setSelectedBlog(null)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 lg:p-10 overflow-y-auto space-y-8 text-left">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  <VariableProximity
                    label={selectedBlog.title}
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <User size={12} style={{ color: 'var(--primary-purple)' }} /> 
                    <VariableProximity
                      label={`By ${selectedBlog.author}`}
                      fromFontVariationSettings="'wght' 500"
                      toFontVariationSettings="'wght' 900"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} style={{ color: 'var(--primary-purple)' }} /> 
                    <VariableProximity
                      label={`Published ${selectedBlog.date}`}
                      fromFontVariationSettings="'wght' 500"
                      toFontVariationSettings="'wght' 900"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </span>
                </div>
              </div>

              {/* Content body */}
              <div className="text-sm font-medium text-gray-600 leading-relaxed space-y-4 text-left">
                {selectedBlog.content.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx}>
                    <VariableProximity
                      label={paragraph}
                      fromFontVariationSettings="'wght' 400"
                      toFontVariationSettings="'wght' 900"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </p>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-4">
                {selectedBlog.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-3 py-1 text-[9px] font-bold uppercase rounded-lg"
                    style={{ backgroundColor: 'var(--light-purple)', color: 'var(--primary-purple)' }}
                  >
                    <VariableProximity
                      label={`#${tag}`}
                      fromFontVariationSettings="'wght' 700"
                      toFontVariationSettings="'wght' 950"
                      containerRef={pageRef}
                      radius={120}
                      falloff="linear"
                    />
                  </span>
                ))}
              </div>

              {/* Related Blogs Block */}
              <div className="pt-8 border-t border-purple-50 space-y-4">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest text-left">
                  <VariableProximity
                    label="Related Articles"
                    fromFontVariationSettings="'wght' 700"
                    toFontVariationSettings="'wght' 950"
                    containerRef={pageRef}
                    radius={120}
                    falloff="linear"
                  />
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedBlog.relatedIds.map((rId) => {
                    const relatedBlog = defaultBlogs.find(b => b.id === rId);
                    if (!relatedBlog) return null;
                    return (
                      <div 
                        key={relatedBlog.id}
                        onClick={() => setSelectedBlog(relatedBlog)}
                        className="p-4 bg-white border border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                      >
                        <h5 className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">
                          <VariableProximity
                            label={relatedBlog.title}
                            fromFontVariationSettings="'wght' 700"
                            toFontVariationSettings="'wght' 950"
                            containerRef={pageRef}
                            radius={120}
                            falloff="linear"
                          />
                        </h5>
                        <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider pt-3 mt-3 border-t border-purple-50" style={{ color: 'var(--primary-purple)' }}>
                          <span>
                            <VariableProximity
                              label={relatedBlog.category}
                              fromFontVariationSettings="'wght' 700"
                              toFontVariationSettings="'wght' 950;;"
                              containerRef={pageRef}
                              radius={120}
                              falloff="linear"
                            />
                          </span>
                          <span className="flex items-center gap-0.5">
                            <VariableProximity
                              label="Read"
                              fromFontVariationSettings="'wght' 700"
                              toFontVariationSettings="'wght' 950"
                              containerRef={pageRef}
                              radius={120}
                              falloff="linear"
                            />
                            <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-purple-50 bg-purple-50/10 flex justify-end">
              <button 
                onClick={() => setSelectedBlog(null)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-white border-none cursor-pointer"
                style={{ backgroundColor: 'var(--primary-purple)' }}
              >
                <VariableProximity
                  label="Close Article"
                  fromFontVariationSettings="'wght' 700"
                  toFontVariationSettings="'wght' 950"
                  containerRef={pageRef}
                  radius={120}
                  falloff="linear"
                />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Footer */}
      <UniversalFooter />
    </div>
  );
};

export default BlogPage;
