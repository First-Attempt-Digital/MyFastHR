import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Tag, HelpCircle, Smile, Download, X } from 'lucide-react';

const GlobalBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isInstallable, setIsInstallable] = useState(!!window.deferredPrompt);
  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem('pwa_install_dismissed') === 'true'
  );

  useEffect(() => {
    const handleInstallable = () => {
      setIsInstallable(true);
    };
    window.addEventListener('app-installable', handleInstallable);
    return () => {
      window.removeEventListener('app-installable', handleInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`PWA install choice: ${outcome}`);
    window.deferredPrompt = null;
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: <Home size={18} /> },
    { label: 'Features', path: '/features', icon: <Compass size={18} /> },
    { label: 'Comics', path: '/comics', icon: <Smile size={18} /> },
    { label: 'Pricing', path: '/pricing', icon: <Tag size={18} /> },
    { label: 'Support', path: '/support', icon: <HelpCircle size={18} /> }
  ];

  const allowedPaths = ['/', '/features', '/pricing', '/support', '/infrastructure', '/blog', '/about', '/book-demo', '/privacy', '/terms', '/logo-animation', '/case-studies', '/comics'];
  if (!allowedPaths.includes(currentPath)) {
    return null;
  }

  return (
    <>
      {/* Premium Floating PWA Install Prompt Card */}
      {isInstallable && !isDismissed && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm z-[99999] bg-[#1c1535] text-white border-2 border-black rounded-2xl p-4 shadow-[8px_8px_0_0_#000] animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex gap-3 items-start relative">
            <div className="w-10 h-10 rounded-xl bg-[#FFFF00] text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#000]">
              <Download size={20} className="stroke-[2.5]" />
            </div>
            
            <div className="space-y-1 pr-6 text-left">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#FFFF00]">Install App</h4>
              <p className="text-[10px] text-purple-200 font-medium leading-relaxed">
                Add MyFastHR to your home screen for fast mobile checks and biometric sync logs.
              </p>
              <button 
                onClick={handleInstallClick}
                className="mt-2 bg-[#FFFF00] text-black border-2 border-black font-black uppercase text-[9px] tracking-wider px-3 py-1.5 rounded-lg shadow-[2.5px_2.5px_0_0_#000] hover:scale-105 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                Install Now
              </button>
            </div>

            <button 
              onClick={handleDismiss}
              className="absolute -top-1 -right-1 text-purple-300 hover:text-white bg-transparent border-none outline-none cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Global Bottom Navigation Bar */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white/80 backdrop-blur-md border-t border-[#E9D5FF] px-4 py-2 pb-safe shadow-[0_-8px_30px_rgba(96,40,217,0.08)] transform translate-z-0">
        <div className="max-w-md mx-auto flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative border-none bg-transparent outline-none cursor-pointer"
                style={{
                  color: isActive ? 'var(--primary-purple)' : '#6B7280',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  fontWeight: isActive ? '700' : '500'
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 mb-0.5"
                  style={{
                    backgroundColor: isActive ? 'rgba(96, 40, 217, 0.1)' : 'transparent',
                    color: isActive ? 'var(--primary-purple)' : '#6B7280',
                    borderColor: isActive ? 'rgba(96, 40, 217, 0.15)' : 'transparent',
                  }}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] tracking-tight text-center">
                  {item.label}
                </span>
                {isActive && (
                  <div 
                    className="absolute bottom-0 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--primary-purple)' }}
                  ></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default GlobalBottomNav;
