
import React, { useState, useMemo, useRef, TouchEvent, useEffect } from 'react';
import { Venue, UserProfile } from '../types';

interface SwipeDeckProps {
  venues: Venue[];
  profile: UserProfile;
  onSwipe: (venueId: string, direction: 'left' | 'right') => void;
  onBook: (venue: Venue) => void;
  onViewMenu: (venue: Venue) => void;
  onViewLocation: (venue: Venue) => void;
  onExit: () => void;
  isVibeView?: boolean;
}

const getPriceTier = (price: number) => {
    if (price <= 350) return '$';
    if (price <= 700) return '$$';
    return '$$$';
};

const SwipeDeck: React.FC<SwipeDeckProps> = ({ venues, profile, onSwipe, onBook, onViewMenu, onViewLocation, onExit, isVibeView }) => {
  // Stabilize the deck so it doesn't re-shuffle on every render
  const [deck, setDeck] = useState<Venue[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const saved = profile?.savedVenues || [];
    const binned = profile?.binnedVenues || [];
    
    let filtered = venues.filter(v => !saved.includes(v.id) && !binned.includes(v.id));
    if (filtered.length === 0) filtered = [...venues];

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
  }, [venues]); // Only re-deck if source venues change

  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentVenue = deck[currentIndex];
  const nextVenue = deck[currentIndex + 1];
  
  const livePhotos = useMemo(() => {
    if (!currentVenue) return [];
    return (profile?.myPalate || []).filter(p => p.venue === currentVenue.name && (p.category === 'atmosphere' || p.category === 'dish'));
  }, [currentVenue, profile?.myPalate]);

  const userRating = useMemo(() => {
      if (!currentVenue) return 5.0;
      const resRating = (profile?.reservations || [])?.find(r => r.venueId === currentVenue.id && r.rating)?.rating;
      return resRating || currentVenue.googleRating || 5.0;
  }, [currentVenue, profile?.reservations]);

  const handleAction = (direction: 'left' | 'right') => {
    if (!currentVenue) return;
    setSwipeDir(direction);
    
    setTimeout(() => {
      onSwipe(currentVenue.id, direction);
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
    
    if (Math.abs(deltaX) > Math.abs(deltaY) || Math.abs(deltaX) > 20) {
      setDragOffset({ x: deltaX, y: deltaY * 0.2 });
    }
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

  if (!currentVenue && deck.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6 pb-20">
        <div className="text-4xl">🥂</div>
        <div className="space-y-2">
            <h2 className="text-3xl font-serif text-white leading-tight">Palate Mapped.</h2>
            <p className="text-[16px] text-gray-500 font-light px-8 leading-relaxed">You've explored the initial curation.</p>
        </div>
        <button onClick={() => setCurrentIndex(0)} className="text-white text-[12px] uppercase tracking-[0.3em] font-black border border-white/20 px-8 py-4 rounded-full bg-white/5 active:scale-95 transition-all">Browse All Again</button>
        <button onClick={onExit} className="text-zinc-500 text-[12px] uppercase tracking-widest font-black">Concierge</button>
      </div>
    );
  }

  const rotation = dragOffset.x / 15;
  const opacity = Math.min(Math.abs(dragOffset.x) / 100, 1);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden pt-16 pb-16">
      <div className="mb-6 text-center">
        <h1 className="text-[16px] font-black uppercase tracking-[0.5em] text-white/50">
          {isVibeView ? "Curate Your Night" : "Pick your favorites"}
        </h1>
      </div>
      
      <div className="w-full flex items-center justify-center px-4 relative">
        {/* Next Card (The Peek) */}
        {nextVenue && !swipeDir && (
          <div className="absolute swipe-card-container z-0 scale-[0.94] translate-y-2 opacity-40 blur-[1px]">
             <div className="w-full h-[480px] bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/5">
                <img src={nextVenue.imageAddress} className="w-full h-full object-cover" alt="" />
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
          className={`relative swipe-card-container z-10 overflow-hidden touch-none
            ${swipeDir === 'left' ? '-translate-x-[150%] -rotate-12 opacity-0' : ''}
            ${swipeDir === 'right' ? 'translate-x-[150%] rotate-12 opacity-0' : ''}
          `}
        >
          <div className="w-full h-auto bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col pointer-events-auto">
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative overscroll-contain">
              <div className="relative aspect-[3/2] w-full flex-shrink-0">
                <img src={currentVenue.imageAddress} alt={currentVenue.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                {livePhotos.length > 0 && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-500/90 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-2xl animate-pulse">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <span className="text-[9px] font-black uppercase text-white tracking-widest">LIVE</span>
                    </div>
                )}
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="space-y-0.5">
                  <h2 className="text-3xl font-serif text-white tracking-tight leading-tight">{currentVenue.name}</h2>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest font-black">
                     <span>{currentVenue.location}</span>
                     <span className="text-emerald-400 text-lg tracking-[0.2em]">{getPriceTier(currentVenue.pricePerPerson)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                    <p className="text-gray-400 text-[14px] leading-[1.4] italic font-serif opacity-80">"{currentVenue.usp}"</p>
                    
                    <div className="flex items-center justify-center gap-8 py-1">
                         <button onClick={() => handleAction('left')} className="w-10 h-10 rounded-full border border-white/10 bg-white/5 text-gray-500 flex items-center justify-center active:scale-90 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                         </button>
                         <button onClick={() => handleAction('right')} className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-90 transition-transform relative group">
                            <span className="text-2xl leading-none">♥</span>
                            <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-10"></div>
                         </button>
                    </div>

                    {livePhotos.length > 0 && (
                        <div className="space-y-2 pt-1">
                            <h3 className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-black">Live Atmosphere</h3>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                {livePhotos.map(photo => (
                                    <div key={photo.id} className="min-w-[80px] aspect-square rounded-lg overflow-hidden border border-white/5">
                                        <img src={photo.images[0]} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-1 flex flex-col gap-2 pb-5">
                  {!isVibeView && (
                    <button onClick={(e) => { e.stopPropagation(); onViewMenu(currentVenue); }} className="w-full bg-zinc-800 text-white font-black py-3 rounded-xl text-[11px] uppercase tracking-[0.2em] active:bg-zinc-700 border border-white/5 transition-all flex items-center justify-center gap-2">
                        View Menu
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onBook(currentVenue); }} className="w-full bg-white text-black font-black py-3 rounded-xl text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl">
                      Book Reservation
                  </button>
                  
                  <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 text-sm font-bold">{userRating.toFixed(1)}</span>
                          <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(star => (
                                  <svg key={star} xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill={star <= Math.round(userRating) ? "currentColor" : "none"} stroke="currentColor" className="text-amber-400">
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                              ))}
                          </div>
                      </div>
                      <button 
                          onClick={(e) => { e.stopPropagation(); onViewLocation(currentVenue); }}
                          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors font-black uppercase tracking-widest"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          LOCATION
                      </button>
                  </div>
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

export default SwipeDeck;
