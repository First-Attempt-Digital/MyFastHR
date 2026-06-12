import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { fetchBranding, getAssetUrl } from '../../utils/api';
import Antigravity from '../common/Antigravity';

const UniversalFooter = () => {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState('');
  const [appName, setAppName] = useState('MyFastHR');
  const [logoHeight, setLogoHeight] = useState(32);
  const [isInstallable, setIsInstallable] = useState(!!window.deferredPrompt);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const branding = await fetchBranding();
        if (branding) {
          if (branding.logo_url) {
            setLogoUrl(getAssetUrl(branding.logo_url));
          }
          if (branding.app_name) {
            setAppName(branding.app_name);
          }
          if (branding.logo_height) {
            // Footers are usually slightly smaller, so we can scale or just use it
            setLogoHeight(branding.logo_height);
          }
        }
      } catch (err) {
        console.error('Failed to load branding in footer:', err);
      }
    };
    loadBranding();

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
    console.log(`Footer PWA install choice: ${outcome}`);
    window.deferredPrompt = null;
    setIsInstallable(false);
  };

  return (
    <footer className="relative bg-slate-950 text-gray-400 px-6 py-8 border-t border-purple-950 mt-auto text-left overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
        <Antigravity
          count={70}
          magnetRadius={8}
          ringRadius={8}
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
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Row 1: Brand & Link Columns */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex items-start gap-6 max-w-sm sm:max-w-md lg:max-w-lg shrink-0">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={appName} 
                className="object-contain bg-white p-2 rounded-2xl shrink-0 shadow-lg border border-purple-500/10"
                style={{ height: '96px', width: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackLogo = document.getElementById('footer-fallback-logo');
                  if (fallbackLogo) fallbackLogo.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              id="footer-fallback-logo"
              className="w-24 h-24 rounded-2xl bg-[#6028D9] flex items-center justify-center font-bold shrink-0 shadow-lg"
              style={{ display: logoUrl ? 'none' : 'flex' }}
            >
              <svg viewBox="0 0 24 24" className="w-12 h-12 fill-none stroke-current stroke-[2.5]">
                <path d="M4 12h3l2.5-6.5L13 19l2.5-8.5L18 12h2" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400 leading-relaxed">
                One platform for HR, payroll, attendance, compliance, and biometric integrations. Designed for Indian statutory regulations.
              </p>
              
              {/* Socials & Install CTA */}
              <div className="flex flex-wrap items-center gap-3">
                {isInstallable && (
                  <button 
                    onClick={handleInstallClick}
                    className="bg-purple-900/40 hover:bg-purple-900/80 border border-purple-500/30 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Download size={12} className="stroke-[2.5]" />
                    Install App
                  </button>
                )}
                <div className="flex gap-2">
                  {[
                    {
                      name: 'Facebook',
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      )
                    },
                    {
                      name: 'Twitter',
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      )
                    },
                    {
                      name: 'Linkedin',
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      )
                    },
                    {
                      name: 'Instagram',
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                      )
                    }
                  ].map(social => (
                    <a
                      key={social.name}
                      href="#"
                      className="text-gray-400 hover:text-white transition-all p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500/30 flex items-center justify-center cursor-pointer"
                      aria-label={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Legal tabs */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-2 border-t border-purple-950/40">
                <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/privacy')}>Privacy Policy</span>
                <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/terms')}>Terms of Service</span>
                <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/infrastructure')}>Security Sandbox Audit</span>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-3 gap-x-8 sm:gap-x-16 gap-y-4">
            {/* Products */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white">Products</div>
              <ul className="space-y-1.5 text-xs">
                {[
                  { label: 'HRMS Registry', tab: 'workforce' },
                  { label: 'Attendance Muster', tab: 'attendance' },
                  { label: 'Payroll Engine', tab: 'payroll' },
                  { label: 'Leave Management', tab: 'leave' },
                  { label: 'Mobile App', tab: 'mobile' }
                ].map(item => (
                  <li 
                    key={item.label} 
                    className="hover:text-white cursor-pointer list-none transition-colors" 
                    onClick={() => navigate('/features', { state: { tab: item.tab } })}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white">Solutions</div>
              <ul className="space-y-1.5 text-xs">
                {[
                  { label: 'Manufacturing', sector: 'manufacturing' },
                  { label: 'Construction', sector: 'construction' },
                  { label: 'Retail', sector: 'retail' },
                  { label: 'Healthcare', sector: 'healthcare' },
                  { label: 'Logistics', sector: 'logistics' }
                ].map(item => (
                  <li 
                    key={item.label} 
                    className="hover:text-white cursor-pointer list-none transition-colors" 
                    onClick={() => navigate(`/case-studies?sector=${item.sector}`)}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white">Resources</div>
              <ul className="space-y-1.5 text-xs">
                {[
                  { label: 'HR Blog', path: '/blog' },
                  { label: 'Corporate Comics', path: '/comics' },
                  { label: 'Help & Support', path: '/support' }
                ].map(item => (
                  <li 
                    key={item.label} 
                    className="hover:text-white cursor-pointer list-none transition-colors" 
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Row 2: Bottom Bar */}
        <div className="border-t border-purple-950/60 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[11px] text-gray-500">
            <span>© {new Date().getFullYear()} MyFastHR. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UniversalFooter;
