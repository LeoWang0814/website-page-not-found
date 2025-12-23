
import React, { useState, useEffect } from 'react';
import PhysicsMesh from './components/PhysicsMesh';
import GlassCard from './components/GlassCard';
import ThemeToggle from './components/ThemeToggle';

function App() {
  // Default to Light Mode (Day state)
  const [isDark, setIsDark] = useState(false);
  const [isPhoneLandscape, setIsPhoneLandscape] = useState(false);

  useEffect(() => {
    // Dark mode is now a slightly lighter, deep navy (#0a1229) instead of near-black (#020617)
    document.body.style.backgroundColor = isDark ? '#0a1229' : '#1e3a8a';
    document.body.style.transition = 'background-color 1s ease';

    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isPhoneScale = window.innerWidth <= 950 && window.innerHeight <= 500;
      setIsPhoneLandscape(isLandscape && isPhoneScale);
    };

    window.addEventListener('resize', checkOrientation);
    checkOrientation();
    return () => window.removeEventListener('resize', checkOrientation);
  }, [isDark]);

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col items-center justify-center transition-colors duration-1000 select-none`}>
      {/* Phone Landscape Warning Overlay */}
      {isPhoneLandscape && (
        <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center backdrop-blur-2xl p-8 text-center transition-colors duration-1000 ${isDark ? 'bg-[#0a1229]' : 'bg-[#1e3a8a]'}`}>
          <div className="w-12 h-12 mb-6 border border-blue-500/30 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-6 h-6 text-blue-400 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="font-mono text-xs font-bold tracking-[0.4em] uppercase text-blue-400 mb-2">Please Rotate Device</h2>
          <p className="text-blue-100/30 text-[9px] uppercase tracking-[0.3em] max-w-[220px] leading-relaxed">
            Portrait orientation required for optimal experience
          </p>
        </div>
      )}

      {/* Technical Background Layer */}
      <PhysicsMesh isDark={isDark} />
      
      {/* Header / UI Layer */}
      <div className="absolute top-0 w-full flex justify-between items-center px-6 md:px-12 py-5 md:py-8 z-50 pointer-events-none">
        <div className={`hidden md:block font-mono text-[9px] tracking-[0.6em] uppercase transition-colors duration-1000 pointer-events-auto select-none ${isDark ? 'text-blue-400/60' : 'text-blue-100/40'}`}>
          ERROR 404 // PAGE NOT FOUND
        </div>
        <div className="pointer-events-auto ml-auto">
          <ThemeToggle 
            isDark={isDark} 
            onToggle={setIsDark} 
            size={window.innerWidth < 768 ? 34 : 42} 
            delay={1000}
          />
        </div>
      </div>

      {/* Main Content Card */}
      <main className="relative z-10 w-full flex items-center justify-center px-5">
        <GlassCard isDark={isDark} />
      </main>

      {/* Decorative Footer Info (Desktop only) */}
      <div className={`absolute bottom-8 right-8 hidden lg:block font-mono text-[8px] tracking-[0.5em] transition-opacity duration-1000 uppercase ${isDark ? 'text-blue-400/30' : 'text-blue-100/20'}`}>
        LOCATOR: DETACHED_STATE
      </div>

      <h1 className="sr-only">404 Not Found - Leo Wang Portfolio</h1>
    </div>
  );
}

export default App;
