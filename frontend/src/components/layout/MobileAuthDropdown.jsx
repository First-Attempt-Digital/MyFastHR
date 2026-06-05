import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, User, ShieldAlert } from 'lucide-react';

const MobileAuthDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative block md:hidden">
      {/* Three-dot options trigger button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full border-2 border-[#2B0D3E] bg-white text-[#2B0D3E] active:scale-95 shadow-[1.5px_1.5px_0px_0px_#2B0D3E] transition-all cursor-pointer flex items-center justify-center"
        aria-label="Auth options"
      >
        <MoreVertical size={18} />
      </button>

      {/* Floating circular actions drop overlay */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-45" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 z-50 flex flex-col gap-3 items-end animate-fade-in-up">
            
            {/* Employee Login Button */}
            <div className="flex items-center gap-2">
              <span 
                onClick={() => {
                  navigate('/employee');
                  setIsOpen(false);
                }}
                className="bg-white text-[#2B0D3E] border-2 border-[#2B0D3E] text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#2B0D3E] cursor-pointer hover:bg-[#F2EAF7]"
              >
                Employee
              </span>
              <button
                onClick={() => {
                  navigate('/employee');
                  setIsOpen(false);
                }}
                className="w-11 h-11 rounded-full border-[2.5px] border-[#2B0D3E] bg-[#F2EAF7] text-[#7A3F91] flex items-center justify-center shadow-[2px_2px_0px_0px_#2B0D3E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:scale-105 transition-all cursor-pointer"
              >
                <User size={18} />
              </button>
            </div>

            {/* Admin Portal Button */}
            <div className="flex items-center gap-2">
              <span 
                onClick={() => {
                  navigate('/login');
                  setIsOpen(false);
                }}
                className="bg-[#7A3F91] text-white border-2 border-[#2B0D3E] text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#2B0D3E] cursor-pointer hover:bg-[#7A3F91]/90"
              >
                Admin
              </span>
              <button
                onClick={() => {
                  navigate('/login');
                  setIsOpen(false);
                }}
                className="w-11 h-11 rounded-full border-[2.5px] border-[#2B0D3E] bg-[#7A3F91] text-white flex items-center justify-center shadow-[2px_2px_0px_0px_#2B0D3E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:scale-105 transition-all cursor-pointer"
              >
                <ShieldAlert size={18} />
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default MobileAuthDropdown;
