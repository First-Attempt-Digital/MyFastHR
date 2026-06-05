import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Tag, HelpCircle } from 'lucide-react';

const GlobalBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Home', path: '/', icon: <Home size={18} /> },
    { label: 'Features', path: '/features', icon: <Compass size={18} /> },
    { label: 'Pricing', path: '/pricing', icon: <Tag size={18} /> },
    { label: 'Support', path: '/support', icon: <HelpCircle size={18} /> }
  ];

  const allowedPaths = ['/', '/features', '/pricing', '/support', '/infrastructure', '/blog', '/about', '/book-demo', '/privacy', '/terms', '/logo-animation', '/case-studies'];
  if (!allowedPaths.includes(currentPath)) {
    return null;
  }

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-[#F2EAF7] border-t-[3px] border-[#2B0D3E] px-4 py-2.5 pb-safe shadow-[0_-4px_12px_rgba(43,13,62,0.15)] transform translate-z-0">
      <div className="max-w-md mx-auto flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-200 ${isActive
                  ? 'text-[#7A3F91] scale-105 font-black'
                  : 'text-[#2B0D3E]/60 hover:text-[#2B0D3E] font-bold'
                }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${isActive
                  ? 'bg-[#7A3F91] text-white border-[#2B0D3E] shadow-[2.5px_2.5px_0px_0px_#2B0D3E]'
                  : 'bg-white text-[#2B0D3E] border-[#2B0D3E]/30'
                }`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-black uppercase text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalBottomNav;
