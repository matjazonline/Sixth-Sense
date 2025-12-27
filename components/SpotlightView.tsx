
import React, { useState, useRef, useEffect } from 'react';
import { Venue } from '../types';

interface SpotlightViewProps {
  venues: Venue[];
  onBook: (venue: Venue) => void;
}

interface Episode {
  id: string;
  episodeNumber: string;
  venueName: string;
  description: string;
  heroImage: string;
  embedType: 'soundcloud' | 'video-link';
  embedUrl: string;
  externalVideoUrl?: string;
  vibeTags: string[];
}

const EPISODES: Episode[] = [
  {
    id: 'mott-32-spotlight',
    episodeNumber: '01',
    venueName: 'Mott 32',
    description: 'Sky-high Cantonese sophistication in the heart of JBR. A dialogue between industrial heritage and metropolitan luxury.',
    // Opulent dark Chinese interior matching user photo 1
    heroImage: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80&w=1200',
    embedType: 'soundcloud',
    embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent("https://soundcloud.com/sixthsenseintelligence/mott-32-spotlight")}&color=%2310b981&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`,
    vibeTags: ['CANTONESE', 'HERITAGE', 'OPULENT']
  },
  {
    id: 'la-dame-de-pic-spotlight',
    episodeNumber: '02',
    venueName: 'La Dame de Pic',
    description: 'Anne-Sophie Pic brings her vision to The Link. High-precision French culinary arts within the world\'s longest cantilever at One Za\'abeel.',
    // Structural X-beams and Burj view matching user photo 2
    heroImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200',
    embedType: 'video-link',
    embedUrl: '',
    externalVideoUrl: 'https://www.youtube.com/watch?v=3cxnRdiUoBY',
    vibeTags: ['MODERNIST', 'SKYLINE', 'AVANT-GARDE']
  },
  {
    id: 'sirene-spotlight',
    episodeNumber: '03',
    venueName: 'Sirene Beach',
    description: 'A Grecian oasis where luxury meets the shore. Experience the vibrant spirit of GAIA by the sea, adorned with bougainvillea.',
    // White arches and bougainvillea matching user photo 3
    heroImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=1200',
    embedType: 'video-link',
    embedUrl: '',
    externalVideoUrl: 'https://www.youtube.com/watch?v=nv7s6JGzYHw',
    vibeTags: ['GRECIAN', 'ALFRESCO', 'COASTAL']
  }
];

const SpotlightView: React.FC<SpotlightViewProps> = ({ venues, onBook }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, clientHeight } = scrollContainerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < EPISODES.length) {
      setActiveIndex(newIndex);
    }
  };

  const handleBooking = (venueName: string) => {
    const venue = venues.find(v => v.name.toLowerCase().includes(venueName.toLowerCase())) || {
        id: `ep-${venueName}`,
        name: venueName,
        imageAddress: EPISODES[activeIndex].heroImage,
        cuisine: "Fine Dining",
        location: "Dubai",
        openingHours: "18:00 - 00:00",
        pricePerPerson: 800
    } as Venue;
    onBook(venue);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden relative select-none">
      
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 z-0">
        {EPISODES.map((ep, idx) => (
          <div 
            key={ep.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === activeIndex ? 'opacity-50' : 'opacity-0'}`}
          >
            <img 
              src={ep.heroImage} 
              className="w-full h-full object-cover" 
              alt="" 
            />
            {/* Cinematic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
          </div>
        ))}
      </div>

      {/* Persistent Branding Overlay */}
      <header className="absolute top-12 left-0 right-0 z-50 px-8 flex justify-between items-center pointer-events-none opacity-40">
         <span className="text-[10px] font-black tracking-[0.6em] text-zinc-300 uppercase italic">Spotlight</span>
         <div className="flex flex-col items-end gap-1">
            <div className="h-[1px] w-12 bg-white/20"></div>
            <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Neural Broadcast</span>
         </div>
      </header>

      {/* Main Content Scroller */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide relative z-10"
      >
        {EPISODES.map((episode, idx) => (
          <div key={episode.id} className="h-full w-full snap-start flex flex-col relative">
            
            {/* Episode Header */}
            <div className="pt-28 px-8 space-y-2 animate-in slide-in-from-top-8 duration-700">
               <div className="flex items-center gap-3">
                  <span className="text-emerald-500 font-black text-[9px] uppercase tracking-[0.5em]">Episode {episode.episodeNumber}</span>
                  <div className="h-[1px] bg-white/10 flex-1"></div>
               </div>
               <div className="flex gap-2 pt-1">
                 {episode.vibeTags.map(tag => (
                   <span key={tag} className="text-[7px] font-black tracking-widest text-zinc-400 border border-white/10 px-1.5 py-0.5 rounded uppercase">{tag}</span>
                 ))}
               </div>
            </div>

            {/* Media Zone (Glass Panels) */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
               <div className="w-full max-w-[280px] aspect-square relative group">
                  {/* The Transparent Glass Interface */}
                  <div className="absolute inset-0 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden p-1 transition-all duration-700 group-hover:border-white/20">
                     
                     {episode.embedType === 'soundcloud' ? (
                       <div className="w-full h-full rounded-[2.8rem] overflow-hidden opacity-90 grayscale brightness-110">
                         <iframe 
                            width="100%" 
                            height="100%" 
                            scrolling="no" 
                            frameBorder="no" 
                            allow="autoplay" 
                            src={episode.embedUrl}
                            title={`Audio ${episode.venueName}`}
                          />
                       </div>
                     ) : (
                       <div className="relative w-full h-full rounded-[2.8rem] overflow-hidden flex flex-col items-center justify-center gap-8">
                          {/* Neural Play Interaction */}
                          <a 
                            href={episode.externalVideoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)] relative z-10"
                          >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
                          </a>

                          <div className="text-center space-y-1 relative z-10">
                             <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/60 block">Watch Broadcast</span>
                             <div className="flex items-center justify-center gap-1.5">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                                <span className="text-[7px] text-emerald-500/80 uppercase tracking-widest font-black">Archive Active</span>
                             </div>
                          </div>
                       </div>
                     )}
                  </div>

                  {/* Aesthetic Corner Accents */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 border-t border-r border-white/20 rounded-tr-[2rem]" />
                  <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b border-l border-white/20 rounded-bl-[2rem]" />
               </div>
            </div>

            {/* Bottom Venue Summary */}
            <div className="p-10 pb-12 space-y-8 relative z-20">
               <div className="space-y-3 max-w-xs mx-auto text-center">
                  <h3 className="text-4xl font-serif text-white italic tracking-tight drop-shadow-2xl">{episode.venueName}</h3>
                  <p className="text-[12px] text-zinc-400 font-light leading-relaxed px-2">
                    {episode.description}
                  </p>
               </div>

               <div className="flex flex-col gap-4 max-w-[280px] mx-auto">
                  <button 
                    onClick={() => handleBooking(episode.venueName)}
                    className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl shadow-2xl active:scale-95 transition-all"
                  >
                    Secure Placement
                  </button>
                  {episode.externalVideoUrl && (
                    <a 
                      href={episode.externalVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors"
                    >
                      View Original Archive
                    </a>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Progress Indication */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-5">
        {EPISODES.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-[1px] transition-all duration-700 rounded-full ${idx === activeIndex ? 'h-10 bg-white shadow-[0_0_15px_white]' : 'h-2 bg-white/10'}`}
          />
        ))}
      </div>

      {/* Swipe Indicator */}
      {activeIndex < EPISODES.length - 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 opacity-30 animate-bounce pointer-events-none">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m7 13 5 5 5-5M7 6l5 5 5-5"/></svg>
        </div>
      )}
    </div>
  );
};

export default SpotlightView;
