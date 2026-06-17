import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Globe, ShieldCheck, Clock, Layers } from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../../utils/api';

const UniversalHeader = () => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(36);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const branding = await fetchBranding();
        if (branding) {
          if (branding.logo_url) {
            setLogoUrl(getAssetUrl(branding.logo_url));
            setLogoError(false);
          } else {
            setLogoError(true);
          }
          if (branding.app_name) {
            setAppName(branding.app_name);
          }
          if (branding.logo_height) {
            setLogoHeight(branding.logo_height);
          }
        }
      } catch (err) {
        console.error('Failed to load branding in header:', err);
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

  const handleDropdownItemClick = (path, options = {}) => {
    navigate(path, options);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 px-6 w-full bg-white border-b border-[#E9D5FF] shadow-sm h-[60px] flex items-center">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          {!logoError && logoUrl ? (
            <img 
              src={logoUrl} 
              alt={appName} 
              className="object-contain"
              style={{ height: '70px', maxHeight: '70px' }}
              onError={(e) => {
                setLogoError(true);
              }}
            />
          ) : null}
          {logoError || !logoUrl ? (
            <>
              <div 
                className="w-9 h-9 rounded-xl bg-[#6028D9] flex items-center justify-center text-white font-bold shadow-md"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[2.5]">
                  <path d="M4 12h3l2.5-6.5L13 19l2.5-8.5L18 12h2" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#111827]">
                {appName === 'MyFastHR' ? (
                  <>MyFast<span className="text-[#6028D9]">HR</span></>
                ) : appName}
              </span>
            </>
          ) : null}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#111827] relative">
          <button onClick={() => navigate('/')} className="hover:text-[#6028D9] transition-colors font-semibold text-sm bg-transparent border-none outline-none cursor-pointer">Home</button>

          {/* Products Dropdown */}
          <div className="relative group">
            <button 
              onClick={() => toggleDropdown('products')}
              onMouseEnter={() => setActiveDropdown('products')}
              className="flex items-center gap-1 hover:text-[#6028D9] transition-colors py-2 cursor-pointer bg-transparent border-none outline-none font-semibold text-sm"
            >
              Products <ChevronDown size={14} />
            </button>
            {activeDropdown === 'products' && (
              <div 
                onMouseLeave={() => setActiveDropdown(null)}
                className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#E9D5FF] rounded-xl shadow-lg p-3 grid gap-1.5 z-50 text-left"
              >
                <div onClick={() => handleDropdownItemClick('/features', { state: { tab: 'workforce' } })} className="p-2 hover:bg-[#F1F5F9] rounded-lg cursor-pointer font-bold text-xs text-[#111827]">
                  HRMS Registry
                </div>
                <div onClick={() => handleDropdownItemClick('/features', { state: { tab: 'attendance' } })} className="p-2 hover:bg-[#F1F5F9] rounded-lg cursor-pointer font-bold text-xs text-[#111827]">
                  Attendance Muster
                </div>
                <div onClick={() => handleDropdownItemClick('/features', { state: { tab: 'payroll' } })} className="p-2 hover:bg-[#F1F5F9] rounded-lg cursor-pointer font-bold text-xs text-[#111827]">
                  Payroll Engine
                </div>
                <div onClick={() => handleDropdownItemClick('/features', { state: { tab: 'leave' } })} className="p-2 hover:bg-[#F1F5F9] rounded-lg cursor-pointer font-bold text-xs text-[#111827]">
                  Leave Management
                </div>
              </div>
            )}
          </div>

          {/* Solutions Direct Link */}
          <button onClick={() => navigate('/case-studies')} className="hover:text-[#6028D9] transition-colors font-semibold text-sm bg-transparent border-none outline-none cursor-pointer">Solutions</button>


          <button onClick={() => navigate('/pricing')} className="hover:text-[#6028D9] transition-colors font-semibold text-sm bg-transparent border-none outline-none cursor-pointer">Pricing</button>

          {/* Resources Dropdown */}
          <div className="relative group">
            <button 
              onClick={() => toggleDropdown('resources')}
              onMouseEnter={() => setActiveDropdown('resources')}
              className="flex items-center gap-1 hover:text-[#6028D9] transition-colors py-2 cursor-pointer bg-transparent border-none outline-none font-semibold text-sm"
            >
              Resources <ChevronDown size={14} />
            </button>
            {activeDropdown === 'resources' && (
              <div 
                onMouseLeave={() => setActiveDropdown(null)}
                className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#E9D5FF] rounded-xl shadow-lg p-3 grid gap-1.5 z-50 text-left"
              >
                {[
                  { label: 'Blog', path: '/blog' },
                  { label: 'Comics', path: '/comics' }
                ].map(item => (
                  <div 
                    key={item.label} 
                    onClick={() => handleDropdownItemClick(item.path, item.options)}
                    className="p-2 hover:bg-[#F1F5F9] rounded-lg cursor-pointer font-semibold text-xs text-[#111827]"
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => navigate('/about')} className="hover:text-[#6028D9] transition-colors font-semibold text-sm bg-transparent border-none outline-none cursor-pointer">About Us</button>
          <button onClick={() => navigate('/support')} className="hover:text-[#6028D9] transition-colors font-semibold text-sm bg-transparent border-none outline-none cursor-pointer">Contact Us</button>
        </nav>

        {/* Action Buttons & Mobile Menu Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/book-demo')} className="btn-secondary px-4 py-1.5 text-xs">
              Book Demo
            </button>
            <button onClick={() => navigate('/login')} className="btn-primary px-4 py-1.5 text-xs">
              Login
            </button>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-gray-700 hover:text-[#6028D9] cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-[#E9D5FF] shadow-lg md:hidden p-6 space-y-4 text-left z-50">
          <div className="grid gap-3">
            <button onClick={() => handleDropdownItemClick('/features')} className="text-sm font-bold text-gray-800 text-left">Products</button>
            <button onClick={() => handleDropdownItemClick('/pricing')} className="text-sm font-bold text-gray-800 text-left">Pricing</button>
            <button onClick={() => handleDropdownItemClick('/comics')} className="text-sm font-bold text-gray-800 text-left">Corporate Comics</button>
            <button onClick={() => handleDropdownItemClick('/about')} className="text-sm font-bold text-gray-800 text-left">About Us</button>
            <button onClick={() => handleDropdownItemClick('/support')} className="text-sm font-bold text-gray-800 text-left">Contact Us</button>
          </div>
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <button onClick={() => handleDropdownItemClick('/book-demo')} className="btn-secondary w-full py-2.5 text-xs">
              Book Demo
            </button>
            <button onClick={() => handleDropdownItemClick('/login')} className="btn-primary w-full py-2.5 text-xs">
              Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default UniversalHeader;
