
import React, { useState, useMemo, useRef, TouchEvent, useEffect } from 'react';
import { MenuItem, UserProfile } from '../types';

interface DishSwipeDeckProps {
  dishes: MenuItem[];
  profile: UserProfile;
  onSwipe: (dishId: string, direction: 'left' | 'right') => void;
  onExit: () => void;
}

const DishSwipeDeck: React.FC<DishSwipeDeckProps> = ({ dishes, profile, onSwipe, onExit }) => {
  const [deck, setDeck] = useState<MenuItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stabilize the deck so it doesn't re-shuffle on re-renders
  useEffect(() => {
    const saved = profile?.savedDishes || [];
    const binned = profile?.binnedDishes || [];
    
    let filtered = dishes.filter(d => !saved.includes(d.id) && !binned.includes(d.id));
    if (filtered.length === 0) filtered = [...dishes];

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
  }, [dishes]);

  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentDish = deck[currentIndex];
  const nextDish = deck[currentIndex + 1];

  const handleAction = (direction: 'left' | 'right') => {
    if (!currentDish) return;
    setSwipeDir(direction);
    
    setTimeout(() => {
      onSwipe(currentDish.id, direction);
      setSwipeDir(null);
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 300);
  };

  const onTouchStart = (e: TouchEvent) => {
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setIsDragging(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStart.current.x;
    const deltaY = e.touches[0].clientY - dragStart.current.y;
    setDragOffset({ x: deltaX, y: deltaY * 0.2 });
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = window.innerWidth * 0.35;
    if (dragOffset.x > threshold) {
      handleAction('right');
    } else if (dragOffset.x < -threshold) {
      handleAction('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  if (!currentDish && deck.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 pb-32">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-2xl font-serif text-white mb-6">Palate Fully Mapped</h2>
        <button 
          onClick={() => setCurrentIndex(0)} 
          className="text-emerald-400 text-[12px] uppercase tracking-widest font-black border border-emerald-500/30 px-8 py-3 rounded-full mb-3"
        >
          Browse All Again
        </button>
        <button onClick={onExit} className="text-zinc-500 text-[12px] uppercase tracking-widest font-black px-8 py-3">Back to Concierge</button>
      </div>
    );
  }

  if (deck.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 pb-32">
          <p className="text-zinc-500 font-serif italic text-lg">Loading database...</p>
        </div>
     );
  }

  const rotation = dragOffset.x / 15;
  const opacity = Math.min(Math.abs(dragOffset.x) / 100, 1);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden pb-16">
      <div className="mb-6 text-center">
        <h1 className="text-[16px] font-black uppercase tracking-[0.5em] text-white/50">
          Build Your Palate
        </h1>
      </div>

      <div className="w-full flex items-center justify-center px-4 relative">
        {/* Next Card (The Peek) */}
        {nextDish && !swipeDir && (
           <div className="absolute swipe-card-container z-0 scale-[0.96] translate-y-3 opacity-30 blur-[2px]">
              <div className="w-full h-[480px] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/5">
                 {nextDish.venueImage && (
                    <img src={nextDish.venueImage} className="w-full h-full object-cover grayscale" alt="" />
                 )}
              </div>
           </div>
        )}

        {/* Current Card */}
        <div 
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease'
          }}
          className={`relative swipe-card-container z-10 touch-none ${swipeDir === 'left' ? '-translate-x-[150%] -rotate-12 opacity-0' : swipeDir === 'right' ? 'translate-x-[150%] rotate-12 opacity-0' : ''}`}
        >
          <div className="w-full h-[480px] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/15 shadow-2xl flex flex-col relative group">
            {/* BACKGROUND IMAGE */}
            {currentDish.venueImage && (
              <div className="absolute inset-0 z-0">
                <img src={currentDish.venueImage} alt={currentDish.item} className="w-full h-full object-cover transition-transform duration-[10s] linear scale-110 group-hover:scale-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-black/30"></div>
              </div>
            )}

            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-end overscroll-contain">
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <span className="inline-block glass-panel text-[10px] font-black px-3 py-1 rounded-full text-white bg-black/50 uppercase tracking-[0.2em] border border-white/10 shadow-lg">
                    {currentDish.course}
                  </span>
                  <h2 className="text-4xl font-serif text-white tracking-tight leading-tight italic">{currentDish.item}</h2>
                </div>

                <p className="text-gray-200 text-[15px] italic font-light font-serif leading-[1.6] opacity-90">
                  {currentDish.description || "A signature creation prepared with artisanal techniques and the finest seasonal ingredients."}
                </p>
                
                <div className="flex items-center justify-center gap-10 py-4">
                     <button onClick={() => handleAction('left')} className="w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-gray-300 flex items-center justify-center active:scale-90 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>
                     <button onClick={() => handleAction('right')} className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform relative group">
                        <span className="text-3xl leading-none">🤤</span>
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20"></div>
                     </button>
                </div>

                <div className="text-center pt-2 border-t border-white/10">
                  <span className="text-[9px] text-zinc-400 uppercase tracking-[0.4em] font-black block mb-1">Origin Venue</span>
                  <span className="text-2xl font-serif italic text-white drop-shadow-md">{currentDish.venueName}</span>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="absolute top-1/2 left-6 -translate-y-1/2 bg-rose-600 text-white border border-white px-4 py-2 rounded-xl font-black uppercase text-xs rotate-[-15deg] transition-opacity duration-150 pointer-events-none z-20"
            style={{ opacity: dragOffset.x < 0 ? opacity : 0 }}
          >SKIP</div>
          <div 
            className="absolute top-1/2 right-6 -translate-y-1/2 bg-emerald-600 text-white border border-white px-4 py-2 rounded-xl font-black uppercase text-xs rotate-[15deg] transition-opacity duration-150 pointer-events-none z-20"
            style={{ opacity: dragOffset.x > 0 ? opacity : 0 }}
          >SAVE</div>
        </div>
      </div>
    </div>
  );
};

export default DishSwipeDeck;
