import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Home, Compass, Tag, HelpCircle, Server, BookOpen, Info, Cpu } from 'lucide-react';

const GlobalHeaderMenu = ({ logoUrl, appName, logoHeight, logoError, setLogoError }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Home', path: '/', icon: <Home size={18} /> },
    { label: 'Features', path: '/features', icon: <Compass size={18} /> },
    { label: 'Pricing', path: '/pricing', icon: <Tag size={18} /> },
    { label: 'Support', path: '/support', icon: <HelpCircle size={18} /> },
    { label: 'Infra', path: '/infrastructure', icon: <Server size={18} /> },
    { label: 'Blog', path: '/blog', icon: <BookOpen size={18} /> },
    { label: 'About', path: '/about', icon: <Info size={18} /> },
    { label: 'Case Studies', path: '/case-studies', icon: <BookOpen size={18} /> },
    { label: 'Book Demo', path: '/book-demo', icon: <Cpu size={18} /> }
  ];

  const handleNav = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* 3-line Menu Button before logo (only visible on mobile/tablet) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="block md:hidden p-2 rounded-xl border-2 border-[#2B0D3E] bg-white text-[#2B0D3E] active:scale-95 shadow-[1.5px_1.5px_0px_0px_#2B0D3E] transition-all cursor-pointer z-50"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
        {!logoError ? (
          <img 
            src={logoUrl} 
            alt={`${appName} Logo`} 
            style={{ height: `${logoHeight || 40}px` }}
            className="w-auto object-contain max-w-[180px]" 
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-2xl font-black text-[#2B0D3E] font-outfit tracking-tight">{appName}</span>
        )}
      </div>

      {/* Mobile Drawer Overlay Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[72px] z-40 bg-[#2B0D3E]/40 backdrop-blur-sm md:hidden animate-fade-in-up" onClick={() => setIsOpen(false)}>
          <div 
            className="w-64 bg-white h-full border-r-[3.5px] border-[#2B0D3E] p-6 space-y-6 flex flex-col justify-between shadow-[5px_0px_0px_0px_#2B0D3E] animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-[#2B0D3E]/50 tracking-widest block pl-1">Navigation</span>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className="w-full p-3.5 rounded-xl border-[2.5px] border-[#2B0D3E] bg-white text-[#2B0D3E] font-black text-xs uppercase tracking-wider flex items-center gap-3 transition-all hover:bg-[#F2EAF7] shadow-[2.5px_2.5px_0px_0px_#2B0D3E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#F2EAF7] border border-[#2B0D3E] text-[#7A3F91] flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#2B0D3E]/10 space-y-3">
              <button 
                onClick={() => handleNav('/employee')}
                className="w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl text-[#2B0D3E] border-[2.5px] border-[#2B0D3E] bg-[#F2EAF7] hover:bg-[#C59DD9]/20 transition-all shadow-[2px_2px_0px_0px_#2B0D3E]"
              >
                Employee Desk
              </button>
              <button 
                onClick={() => handleNav('/login')}
                className="w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl text-white bg-[#7A3F91] border-[2.5px] border-[#2B0D3E] shadow-[2.5px_2.5px_0px_0px_#2B0D3E]"
              >
                Admin Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalHeaderMenu;
