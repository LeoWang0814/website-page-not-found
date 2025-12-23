
import React, { useState } from 'react';
import { PROFILE } from '../constants';

interface GlassCardProps {
  isDark: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ isDark }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 1, y: -y * 1 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const textColor = isDark ? 'text-blue-100' : 'text-white';
  const subTextColor = isDark ? 'text-blue-500/80' : 'text-blue-200/60';
  const bodyTextColor = isDark ? 'text-slate-400' : 'text-blue-100/80';
  const borderColor = isDark ? 'border-blue-900/30' : 'border-white/10';
  const bgColor = isDark ? 'bg-black/30' : 'bg-white/5';
  
  const shadowStyle = isDark 
    ? 'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]' 
    : 'shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]';

  return (
    <div 
      className="relative z-10 w-full max-w-[380px] transition-transform duration-700 ease-out flex flex-col items-center select-none"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`w-full backdrop-blur-[40px] rounded-[24px] md:rounded-[36px] p-7 md:p-10 border transition-all duration-1000 relative overflow-hidden group 
        ${bgColor} ${borderColor} ${shadowStyle}`}
      >
        <div className={`absolute top-0 left-0 w-6 h-6 border-l border-t transition-colors duration-1000 ${isDark ? 'border-blue-900/40' : 'border-white/10'}`} />
        <div className={`absolute bottom-0 right-0 w-6 h-6 border-r border-b transition-colors duration-1000 ${isDark ? 'border-blue-900/40' : 'border-white/10'}`} />

        <div className="flex flex-col items-center text-center relative z-10">
          
          {/* 404 Header Area */}
          <div className="mb-5">
            <div className={`text-6xl md:text-7xl font-black tracking-tighter mb-1 opacity-25 ${isDark ? 'text-red-500' : 'text-white'}`}>
              404
            </div>
            <div className={`text-[9px] md:text-[11px] font-mono tracking-[0.5em] uppercase font-bold ${isDark ? 'text-red-900/70' : 'text-blue-100/70'}`}>
              NOT FOUND
            </div>
          </div>

          <div className="relative mb-6">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border p-0.5 bg-black/10 backdrop-blur-xl transition-all duration-1000 group-hover:scale-105 
              ${isDark ? 'border-blue-900/40' : 'border-white/20'}`}
            >
               <img 
                 src={PROFILE.profileImg} 
                 alt={PROFILE.mainName} 
                 className={`w-full h-full rounded-full object-cover transition-all duration-1000 ${isDark ? 'opacity-80 contrast-110' : 'opacity-100'}`}
               />
            </div>
            <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] animate-[spin_60s_linear_infinite] pointer-events-none opacity-[0.12]">
              <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" className={isDark ? 'text-blue-500' : 'text-blue-300'} />
            </svg>
          </div>

          <h2 className={`text-xl md:text-2xl font-bold tracking-tight mb-1 transition-colors duration-1000 ${textColor}`}>
            {PROFILE.mainName}
          </h2>
          <p className={`text-[7px] md:text-[8px] font-bold tracking-[0.4em] uppercase mb-5 transition-colors duration-1000 ${subTextColor}`}>
            {PROFILE.subName}
          </p>
          
          <div className={`h-[1px] w-8 mb-6 transition-colors duration-1000 ${isDark ? 'bg-blue-900/30' : 'bg-white/10'}`} />
          
          <p className={`text-[11px] md:text-[13px] leading-relaxed mb-8 font-light max-w-[280px] tracking-wide transition-colors duration-1000 ${bodyTextColor}`}>
            The page you are looking for could not be found. It may have been moved, deleted, or never existed.
          </p>

          <a 
            href={PROFILE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`group/btn relative w-full py-3 border rounded-lg transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden mb-8
              ${isDark 
                ? 'bg-blue-900/5 border-blue-900/40 hover:bg-blue-900/15 text-blue-400' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold tracking-[0.3em] text-[8px] uppercase whitespace-nowrap">Go to Repository</span>
          </a>

          {/* Interactive Hint Section */}
          <div className={`flex flex-col items-center gap-1.5 transition-opacity duration-1000 ${isDark ? 'opacity-30' : 'opacity-40'}`}>
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
              <span className={`text-[7px] md:text-[8px] uppercase tracking-[0.2em] font-mono ${isDark ? 'text-blue-500' : 'text-blue-100'}`}>
                Physical Simulation Still Active
              </span>
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
            </div>
            <span className={`text-[6px] md:text-[7px] uppercase tracking-[0.15em] font-mono opacity-80 ${isDark ? 'text-blue-600' : 'text-blue-200'}`}>
              Click and drag to slice the simulation
            </span>
          </div>
        </div>
      </div>
      
      {/* Refined Footer Footer Info */}
      <div className={`mt-5 md:mt-8 flex items-center gap-6 transition-all duration-1000 ${isDark ? 'opacity-10 text-blue-800' : 'opacity-20 text-blue-100'}`}>
        <span className="text-[6px] md:text-[7px] uppercase tracking-[0.6em]">Node: {PROFILE.mainName}</span>
        <span className="text-[6px] md:text-[7px] uppercase tracking-[0.6em]">Status: Detached</span>
      </div>
    </div>
  );
};

export default GlassCard;
