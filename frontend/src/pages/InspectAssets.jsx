import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import '../styles/landing.css';

const InspectAssets = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState({
    workforce: localStorage.getItem('mf_feat_workforce') || '',
    payroll: localStorage.getItem('mf_feat_payroll') || '',
    attendance: localStorage.getItem('mf_feat_attendance') || '',
    compliance: localStorage.getItem('mf_feat_compliance') || ''
  });

  const images = ["media__1780299142738.png", "media__1780298798406.png", "media__1780298686948.png", "media__1780298556360.png", "media__1780298444551.png", "media__1780293863862.png", "media__1780293688314.png", "media__1780293498746.png", "media__1780293438827.png", "media__1780293313760.png", "media__1780293060454.png", "media__1780292930231.png", "media__1780292641520.png", "media__1780292216540.png", "media__1780289792946.png", "media__1780289648362.png", "media__1780289622561.png", "media__1780139650027.png", "media__1780139024843.png", "media__1780138806454.png", "media__1780138197539.png", "media__1780137989543.png", "media__1780137760466.png", "media__1780137568607.png", "media__1780137543200.png", "media__1780137275833.png", "media__1780137108730.png", "media__1780137090286.png", "media__1780137003351.png", "media__1780135215834.png", "media__1780134702406.png", "media__1780134624622.png", "media__1780134525623.png", "media__1780134462697.png", "media__1780130506109.png"];

  const handleSelect = (module, img) => {
    setSelected(prev => ({ ...prev, [module]: img }));
  };

  const handleSave = () => {
    localStorage.setItem('mf_feat_workforce', selected.workforce);
    localStorage.setItem('mf_feat_payroll', selected.payroll);
    localStorage.setItem('mf_feat_attendance', selected.attendance);
    localStorage.setItem('mf_feat_compliance', selected.compliance);

    // Save consolidated mapping
    const mapping = {
      workforce: selected.workforce ? `/assets/${selected.workforce}` : '/assets/workforce_preview.png',
      payroll: selected.payroll ? `/assets/${selected.payroll}` : '/assets/payroll_preview.png',
      attendance: selected.attendance ? `/assets/${selected.attendance}` : '/assets/attendance_preview.png',
      compliance: selected.compliance ? `/assets/${selected.compliance}` : '/assets/compliance_preview.png'
    };
    localStorage.setItem('portfolio_features_mapping', JSON.stringify(mapping));
    alert('🎉 Screenshots mapped successfully! Features Page will now use these exact screenshots.');
    navigate('/features');
  };

  return (
    <div className="landing-body min-h-screen p-8 text-left">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-[#2B0D3E] pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#2B0D3E] font-outfit uppercase tracking-tight flex items-center gap-3">
              <ImageIcon className="text-[#7A3F91]" /> Screenshot Mapper Utility
            </h1>
            <p className="text-xs font-semibold text-[#2B0D3E]/70 mt-1">
              Select the exact screenshots from your portal logs to display on the Features page.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/features')}
              className="px-4 py-2 brutalist-btn-secondary text-xs rounded-xl flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Features
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 brutalist-btn text-xs rounded-xl flex items-center gap-2"
            >
              <Save size={14} /> Save & Apply Screenshots
            </button>
          </div>
        </div>

        {/* Mappings Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['workforce', 'payroll', 'attendance', 'compliance'].map(mod => (
            <div key={mod} className="brutalist-box p-5 rounded-2xl bg-white space-y-3">
              <h3 className="text-xs font-black uppercase text-[#7A3F91] tracking-wider font-outfit">{mod} Screen</h3>
              <div className="text-[10px] font-bold text-[#2B0D3E]/60 truncate">
                {selected[mod] ? selected[mod] : '❌ No image selected'}
              </div>
              {selected[mod] && (
                <div className="border-2 border-[#2B0D3E] rounded-xl overflow-hidden h-28 bg-[#F2EAF7]">
                  <img src={`/assets/${selected[mod]}`} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Image Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-[#2B0D3E] uppercase font-outfit">Available Uploaded Screenshots (Most Recent First)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {images.map(img => (
              <div key={img} className="brutalist-box bg-white rounded-2xl overflow-hidden p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <div className="h-32 rounded-xl border border-[#2B0D3E]/20 overflow-hidden bg-[#F2EAF7] relative">
                  <img src={`/assets/${img}`} className="w-full h-full object-cover" />
                </div>
                <div className="mt-3 space-y-2">
                  <span className="text-[9px] font-black text-[#2B0D3E]/50 block truncate">{img}</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['workforce', 'payroll', 'attendance', 'compliance'].map(mod => (
                      <button
                        key={mod}
                        onClick={() => handleSelect(mod, img)}
                        className={`py-1 text-[8px] font-black uppercase rounded-lg border border-[#2B0D3E] transition-all ${
                          selected[mod] === img 
                            ? 'bg-[#7A3F91] text-white' 
                            : 'bg-[#F2EAF7] text-[#2B0D3E] hover:bg-[#C59DD9]/20'
                        }`}
                      >
                        {mod.slice(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InspectAssets;
