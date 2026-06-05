import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, ArrowLeft, ArrowRight, 
  Calendar, Clock, User, Share2, MessageSquare, 
  Sparkles, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../utils/api';
import GlobalHeaderMenu from '../components/layout/GlobalHeaderMenu';
import MobileAuthDropdown from '../components/layout/MobileAuthDropdown';
import '../styles/landing.css';

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
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] border-[2.5px] border-[#2B0D3E] bg-[#C59DD9]/40 hover:bg-[#C59DD9]/70 transition-all active:scale-95 shadow-[2px_2px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
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
                className="px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl text-white bg-[#7A3F91] border-[2.5px] border-[#2B0D3E] shadow-[3px_3px_0px_0px_#2B0D3E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#2B0D3E] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                Get Started
              </button>
            </div>
            <MobileAuthDropdown />
          </div>
        </div>
      </header>

      {/* 2. Hero Header Section */}
      <section className="px-6 py-12 lg:py-20 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-6 reveal-on-scroll reveal-up">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-black uppercase text-[#7A3F91] hover:scale-105 transition-transform"
          >
            <ArrowLeft size={14} /> Back to main landing
          </button>
          
          <h1 className="text-4xl sm:text-6xl font-black text-[#2B0D3E] font-outfit leading-none tracking-tight">
            Corporate Insights. <br/>
            <span className="text-[#7A3F91] underline decoration-[#C59DD9] decoration-wavy">Engineered for Teams.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#2B0D3E]/80 max-w-xl mx-auto leading-relaxed">
            Troubleshooting logs, industry guidelines, and system architectures compiled by our engineering and product teams.
          </p>

          {/* Search Box Input */}
          <div className="max-w-md mx-auto pt-4 relative">
            <div className="flex items-center bg-white border-[3px] border-[#2B0D3E] rounded-2xl shadow-[4px_4px_0px_0px_#2B0D3E] overflow-hidden px-4">
              <Search className="text-[#2B0D3E]/50 shrink-0" size={18} />
              <input 
                type="text" 
                placeholder="Search articles, categories, or keywords..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3.5 px-3 outline-none text-xs font-bold text-[#2B0D3E] placeholder-[#2B0D3E]/40 bg-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Filter Tabs */}
      <section className="px-6 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-3 reveal-on-scroll reveal-scale">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full border-2 font-black text-xs uppercase tracking-wider transition-all shadow-[2.5px_2.5px_0px_0px_#2B0D3E] active:translate-y-0.5 active:shadow-none ${
                selectedCategory === cat
                  ? 'bg-[#7A3F91] text-white border-[#2B0D3E]'
                  : 'bg-white text-[#2B0D3E] border-[#2B0D3E]/30 hover:border-[#2B0D3E] hover:bg-[#F2EAF7]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Blog Posts Grid */}
      <section className="px-6 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {filteredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog, idx) => {
                const delays = ['reveal-delay-100', 'reveal-delay-200', 'reveal-delay-300'];
                return (
                  <div 
                    key={blog.id}
                    className={`brutalist-box rounded-[32px] p-6 bg-white border-[3px] border-[#2B0D3E] shadow-[6px_6px_0px_0px_#2B0D3E] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#2B0D3E] transition-all flex flex-col justify-between reveal-on-scroll reveal-up ${delays[idx % 3]}`}
                  >
                    <div className="space-y-4">
                      {/* Image Block */}
                      <div className="w-full aspect-[16/10] rounded-2xl border-2 border-[#2B0D3E] bg-[#F2EAF7] overflow-hidden relative shadow-[2px_2px_0px_0px_#2B0D3E]">
                        <img 
                          src={blog.image} 
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 px-3 py-1 bg-white text-[9px] font-black uppercase tracking-wider rounded-lg border-2 border-[#2B0D3E] shadow-[1.5px_1.5px_0px_0px_#2B0D3E]">
                          {blog.category}
                        </span>
                      </div>

                      {/* Header details */}
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#2B0D3E]/50 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {blog.date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {blog.readTime}</span>
                      </div>

                      {/* Title & Excerpt */}
                      <h3 className="text-lg font-black text-[#2B0D3E] font-outfit leading-tight hover:text-[#7A3F91] transition-colors">{blog.title}</h3>
                      <p className="text-xs font-semibold text-[#2B0D3E]/70 leading-relaxed line-clamp-3">{blog.excerpt}</p>
                    </div>

                    <div className="pt-6 border-t border-[#2B0D3E]/10 flex items-center justify-between mt-6">
                      <span className="text-[10px] font-black text-[#2B0D3E]/40 uppercase tracking-widest">{blog.author}</span>
                      <button 
                        onClick={() => setSelectedBlog(blog)}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl text-white bg-[#7A3F91] border-2 border-[#2B0D3E] shadow-[2px_2px_0px_0px_#2B0D3E] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_#2B0D3E] transition-all"
                      >
                        Read Node
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="brutalist-box rounded-3xl p-16 bg-white border-[3px] border-[#2B0D3E] text-center space-y-4 shadow-[6px_6px_0px_0px_#2B0D3E] max-w-lg mx-auto reveal-on-scroll reveal-scale">
              <BookOpen className="text-[#7A3F91] mx-auto animate-bounce" size={40} />
              <h3 className="text-lg font-black text-[#2B0D3E] font-outfit">No Articles Matching Query</h3>
              <p className="text-xs font-semibold text-[#2B0D3E]/60 leading-relaxed">
                We couldn't find any documents matched with "{searchQuery}". Try other key tokens or reset category filters.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="px-5 py-2.5 brutalist-btn text-xs rounded-xl"
              >
                Reset Search
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
            className="absolute inset-0 bg-[#2B0D3E]/75 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="w-full max-w-3xl brutalist-box bg-white rounded-[36px] border-[3.5px] border-[#2B0D3E] shadow-[8px_8px_0px_0px_#2B0D3E] relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="p-6 border-b-[3px] border-[#2B0D3E] flex justify-between items-center bg-[#F2EAF7]/50">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 bg-[#7A3F91] text-white text-[10px] font-black uppercase tracking-wider rounded-lg border-2 border-[#2B0D3E] shadow-[2px_2px_0px_0px_#2B0D3E]">
                  {selectedBlog.category}
                </span>
                <span className="text-[10px] font-black text-[#2B0D3E]/50 uppercase tracking-widest">{selectedBlog.readTime}</span>
              </div>
              <button 
                onClick={() => setSelectedBlog(null)}
                className="w-10 h-10 rounded-xl bg-white border-2 border-[#2B0D3E] shadow-[2.5px_2.5px_0px_0px_#2B0D3E] hover:translate-y-0.5 hover:shadow-none flex items-center justify-center text-[#2B0D3E] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 lg:p-10 overflow-y-auto space-y-8 custom-scroll">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black text-[#2B0D3E] font-outfit leading-tight">{selectedBlog.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-[#2B0D3E]/60 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><User size={12} className="text-[#7A3F91]" /> By {selectedBlog.author}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#7A3F91]" /> Published {selectedBlog.date}</span>
                </div>
              </div>

              {/* Content body */}
              <div className="text-sm font-semibold text-[#2B0D3E]/85 leading-relaxed space-y-4 text-left">
                {selectedBlog.content.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-4">
                {selectedBlog.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-[#F2EAF7] border border-[#2B0D3E]/20 text-[9px] font-black uppercase text-[#7A3F91] rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Related Blogs Block */}
              <div className="pt-8 border-t border-[#2B0D3E]/10 space-y-4">
                <h4 className="text-xs font-black uppercase text-[#2B0D3E]/50 tracking-widest text-left">Related Articles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedBlog.relatedIds.map((rId) => {
                    const relatedBlog = defaultBlogs.find(b => b.id === rId);
                    if (!relatedBlog) return null;
                    return (
                      <div 
                        key={relatedBlog.id}
                        onClick={() => setSelectedBlog(relatedBlog)}
                        className="p-4 bg-white border-2 border-[#2B0D3E] rounded-2xl shadow-[3px_3px_0px_0px_#2B0D3E] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#2B0D3E] transition-all cursor-pointer flex flex-col justify-between text-left"
                      >
                        <h5 className="text-xs font-black text-[#2B0D3E] font-outfit leading-tight line-clamp-2">{relatedBlog.title}</h5>
                        <div className="flex justify-between items-center text-[8px] font-bold text-[#7A3F91]/80 uppercase tracking-wider pt-3 mt-3 border-t border-[#2B0D3E]/5">
                          <span>{relatedBlog.category}</span>
                          <span className="flex items-center gap-0.5">Read <ChevronRight size={10} /></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-[3px] border-[#2B0D3E] bg-[#F2EAF7]/30 flex justify-end">
              <button 
                onClick={() => setSelectedBlog(null)}
                className="px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] bg-white border-2 border-[#2B0D3E] shadow-[2.5px_2.5px_0px_0px_#2B0D3E] hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Close Article
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Footer */}
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

export default BlogPage;
