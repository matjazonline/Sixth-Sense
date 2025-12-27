
import React, { useState, useRef, useEffect } from 'react';
import { Venue, UserProfile } from '../types';
import VenueCard from './VenueCard';

interface ChatVenueStackProps {
  venues: Venue[];
  userProfile?: UserProfile | null;
  onBook: (venue: Venue) => void;
  onViewMenu: (venue: Venue) => void;
  onViewLocation: (venue: Venue) => void;
}

const ChatVenueStack: React.FC<ChatVenueStackProps> = ({ venues, userProfile, onBook, onViewMenu, onViewLocation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipedDir, setSwipedDir] = useState<'left' | 'right' | 'undo' | null>(null);
  
  const dragStart = useRef({ x: 0, y: 0 });

  const currentVenue = venues[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipedDir(direction);
    setHistory(prev => [...prev, currentIndex]);
    setTimeout(() => {
      setSwipedDir(null);
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex(prev => (prev + 1) % venues.length);
    }, 300);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastIndex = history[history.length - 1];
    setSwipedDir('undo');
    setTimeout(() => {
      setSwipedDir(null);
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex(lastIndex);
      setHistory(prev => prev.slice(0, -1));
    }, 300);
  };

  const handleStart = (clientX: number, clientY: number) => {
    dragStart.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    setDragOffset({ x: deltaX, y: deltaY * 0.1 });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 50;
    if (dragOffset.x > threshold) {
      handleSwipe('right');
    } else if (dragOffset.x < -threshold) {
      handleSwipe('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
      const onMouseUp = () => handleEnd();
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!currentVenue) return null;

  const nextVenue = venues[(currentIndex + 1) % venues.length];
  const rotation = dragOffset.x / 18;

  return (
    <div className="relative w-full h-[352px] flex flex-col items-center justify-start perspective-1000">
      <div className="relative w-full h-[264px] flex items-center justify-center">
        {/* Background card (peek) */}
        <div className="absolute inset-0 scale-[0.92] translate-y-4 opacity-30 blur-[2px] pointer-events-none transition-all duration-300">
           <VenueCard venue={nextVenue} userProfile={userProfile} onBook={() => {}} onViewMenu={() => {}} onViewLocation={() => {}} isLarge={true} />
        </div>

        {/* Main Swiping Card */}
        <div 
          className={`relative w-full max-w-[220px] h-full transition-all cursor-grab active:cursor-grabbing 
            ${swipedDir === 'left' ? '-translate-x-[150%] -rotate-12 opacity-0' : 
              swipedDir === 'right' ? 'translate-x-[150%] rotate-12 opacity-0' : 
              swipedDir === 'undo' ? 'scale-110 opacity-0' : ''}`}
          style={{
            transform: !swipedDir ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease'
          }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          <div className="h-full w-full shadow-[0_20px_40px_-8px_rgba(0,0,0,0.8)] rounded-[2rem] overflow-hidden bg-black border border-white/15 pointer-events-auto">
              <VenueCard 
                  venue={currentVenue} 
                  userProfile={userProfile} 
                  onBook={onBook} 
                  onViewMenu={onViewMenu} 
                  onViewLocation={onViewLocation} 
                  isLarge={true}
              />
          </div>

          {/* Labels Overlay - Only Next label as Booking is confirmation */}
          <div 
              className="absolute top-8 left-6 bg-rose-600/90 backdrop-blur-md text-white px-2 py-1 rounded-md font-black uppercase text-[7px] rotate-[-15deg] transition-opacity pointer-events-none z-50 border border-white/20 shadow-lg"
              style={{ opacity: dragOffset.x < -20 ? 1 : 0 }}
          >NEXT</div>
        </div>
      </div>
      
      {/* Interaction Buttons - Standardized Alignment */}
      <div className="mt-6 flex items-center justify-center gap-8 z-50 h-11">
          <button 
            onClick={() => handleSwipe('left')}
            className="w-11 h-11 rounded-full border border-white/10 bg-zinc-900 text-zinc-400 flex items-center justify-center shadow-lg active:scale-90 transition-all hover:text-rose-500"
            aria-label="Skip to next"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <div className="flex gap-1.5 items-center justify-center h-full">
            {venues.slice(0, 5).map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex % 5 ? 'w-4 bg-white' : 'bg-white/10'}`}></div>
            ))}
          </div>

          <button 
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`w-11 h-11 rounded-full border border-white/10 flex items-center justify-center shadow-lg active:scale-90 transition-all ${history.length === 0 ? 'opacity-20 text-zinc-700' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            aria-label="Undo last swipe"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          </button>
      </div>
      
      <p className="mt-2 text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 opacity-60">Skip or Undo to Curate</p>
    </div>
  );
};

export default ChatVenueStack;
