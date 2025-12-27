
import React from 'react';

interface AvatarProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  size?: 'normal' | 'small';
}

const Avatar: React.FC<AvatarProps> = ({ state, size = 'normal' }) => {
  const isSmall = size === 'small';

  // Dynamic monochrome classes based on state
  const coreColor = state === 'listening' ? 'from-zinc-100 to-zinc-400' : 
                    state === 'processing' ? 'from-white to-zinc-600' : 
                    'from-zinc-400 to-zinc-800';
  
  const glowColor = state === 'listening' ? 'rgba(255, 255, 255, 0.6)' : 
                    state === 'processing' ? 'rgba(161, 161, 170, 0.6)' : 
                    'rgba(113, 113, 122, 0.4)';

  // Sizing and Layout Logic
  const containerClass = isSmall ? 'w-12 h-12' : 'w-32 h-32 md:w-40 md:h-40 mx-auto my-6';
  const coreClass = isSmall ? 'w-7 h-7' : 'w-20 h-20 md:w-24 md:h-24';
  
  // Transform Origins for the orbiting nodes (must match half container height)
  const orbit1Origin = isSmall ? 'origin-[50%_1.5rem]' : 'origin-[50%_4rem] md:origin-[50%_5rem]';
  const orbit2Origin = isSmall ? 'origin-[50%_-1.5rem]' : 'origin-[50%_-4rem] md:origin-[50%_-5rem]';

  return (
    <div className={`relative ${containerClass} flex items-center justify-center select-none pointer-events-none transition-all duration-500`}>
      
      {/* 1. Outer Data Ring (Slow Rotation) */}
      <div className={`absolute inset-0 rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite] ${state === 'processing' ? 'animate-[spin_2s_linear_infinite]' : ''}`}></div>
      
      {/* 2. Middle Orbit Ring (Counter Rotation) */}
      <div className={`absolute ${isSmall ? 'inset-0.5' : 'inset-2'} rounded-full border border-dotted border-white/5 animate-[spin_15s_linear_infinite_reverse]`}></div>

      {/* 3. Holographic Glow Backdrop */}
      <div 
        className={`absolute ${isSmall ? 'inset-1' : 'inset-4'} rounded-full blur-xl transition-colors duration-1000 bg-current opacity-20 animate-pulse`}
        style={{ color: glowColor }}
      ></div>

      {/* 4. The Neural Core (The "Brain") */}
      <div className={`relative ${coreClass} rounded-full bg-gradient-to-tr ${coreColor} shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden transition-all duration-1000 border border-white/10`}>
        
        {/* Internal Neural Network Lines (SVG) - Simplified for small view */}
        <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay" viewBox="0 0 100 100">
           <path d="M10,50 Q25,25 50,50 T90,50" fill="none" stroke="white" strokeWidth="0.5" className="animate-[pulse_3s_ease-in-out_infinite]" />
           {!isSmall && (
             <>
               <path d="M50,10 Q25,25 50,50 T50,90" fill="none" stroke="white" strokeWidth="0.5" className="animate-[pulse_4s_ease-in-out_infinite]" />
               <path d="M20,20 L80,80 M80,20 L20,80" fill="none" stroke="white" strokeWidth="0.2" />
               <circle cx="20" cy="20" r="1" fill="white" />
               <circle cx="80" cy="80" r="1" fill="white" />
             </>
           )}
           <circle cx="50" cy="50" r={isSmall ? 10 : 2} fill="white" className="animate-ping" />
        </svg>
        
        {/* Core Shine */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/20 to-transparent rounded-full"></div>
      </div>

      {/* 5. Floating "Data Nodes" */}
      <div className={`absolute top-0 left-1/2 -ml-0.5 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white] animate-[orbit_4s_linear_infinite] ${orbit1Origin}`}></div>
      <div className={`absolute bottom-0 right-1/2 -mr-0.5 w-1 h-1 bg-white/70 rounded-full animate-[orbit_6s_linear_infinite_reverse] ${orbit2Origin}`}></div>

      {/* 6. Status Text (Only for normal size) */}
      {!isSmall && (
        <div className="absolute -bottom-8 w-full text-center">
             <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-mono">
                {state === 'idle' ? 'System Online' : state === 'listening' ? 'Receiving Audio' : 'Processing Neural Net'}
             </span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
