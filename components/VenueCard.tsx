
import React from 'react';
import { Venue, UserProfile } from '../types';
import { getVenueStatus } from '../utils/dataProcessing';

interface VenueCardProps {
  venue: Venue;
  userProfile?: UserProfile | null;
  onBook: (venue: Venue) => void;
  onViewMenu: (venue: Venue) => void;
  onViewLocation: (venue: Venue) => void;
  onToggleSave?: (venueId: string) => void;
  isLarge?: boolean;
}

const getPriceTier = (price: number) => {
    if (price <= 350) return '$';
    if (price <= 700) return '$$';
    return '$$$';
};

const VenueCard: React.FC<VenueCardProps> = ({ venue, userProfile, onBook, onViewMenu, onViewLocation, onToggleSave, isLarge = false }) => {
  const hasLiveContent = userProfile?.myPalate?.some(p => p.venue === venue.name && p.category === 'atmosphere');
  const userRating = userProfile?.reservations?.find(r => r.venueId === venue.id && r.rating)?.rating;
  const status = getVenueStatus(venue.openingHours, venue.availability);
  const isSaved = userProfile?.savedVenues?.includes(venue.id);

  return (
    <div className={`rounded-[2rem] overflow-hidden flex flex-col h-full bg-zinc-900/60 border border-white/10 shadow-xl group relative ${isLarge ? 'p-1' : ''}`}>
      <div className={`relative ${isLarge ? 'h-32' : 'h-28'} bg-zinc-800 overflow-hidden rounded-[1.8rem]`}>
        {venue.imageAddress ? (
            <img 
              src={venue.imageAddress}
              alt={venue.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
        ) : (
            <div className={`w-full h-full flex items-center justify-center ${isLarge ? 'text-2xl' : 'text-[10px]'} text-gray-700 font-serif italic`}>
                {venue.name.charAt(0)}
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        
        {hasLiveContent && (
            <div className={`absolute top-3 right-3 flex items-center gap-1.5 bg-rose-500/90 backdrop-blur-md ${isLarge ? 'px-2 py-0.5' : 'px-1.5 py-0.5'} rounded-full border border-white/20 animate-pulse shadow-lg`}>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span className={`${isLarge ? 'text-[7px]' : 'text-[5px]'} font-black uppercase tracking-widest text-white`}>Live</span>
            </div>
        )}

        {status && (
            <div className={`absolute top-3 left-3 ${isLarge ? 'px-2 py-0.5' : 'px-1.5 py-0.5'} rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-20`}>
                <span className={`${isLarge ? 'text-[7px]' : 'text-[5px]'} font-black uppercase tracking-widest ${status === 'Open Now' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {status}
                </span>
            </div>
        )}

        {onToggleSave && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleSave(venue.id); }}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all active:scale-90 ${isSaved ? 'bg-rose-500 border-rose-400 text-white' : 'bg-black/40 text-white/60 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        )}

        <div className="absolute bottom-3 left-3 right-12">
             <h3 className={`text-white font-serif font-bold ${isLarge ? 'text-base' : 'text-sm'} leading-tight truncate drop-shadow-lg`}>{venue.name}</h3>
        </div>
      </div>
      
      <div className={`${isLarge ? 'p-4' : 'p-3'} flex-grow flex flex-col gap-3`}>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center w-full">
            <span className={`truncate font-black text-white/90 uppercase tracking-[0.1em] ${isLarge ? 'text-[9px]' : 'text-[8px]'}`}>{venue.cuisine}</span>
            <span className={`text-emerald-400 font-bold tracking-widest ${isLarge ? 'text-[11px]' : 'text-[9px]'}`}>{getPriceTier(venue.pricePerPerson)}</span>
          </div>
          <div className={`flex justify-between items-center opacity-60 ${isLarge ? 'text-[9px]' : 'text-[8px]'}`}>
            <span className="truncate max-w-[75%]">{venue.location}</span>
            <span className="text-amber-400 font-bold shrink-0">{userRating ? userRating.toFixed(1) : "5.0"} ★</span>
          </div>
        </div>

        {isLarge && venue.usp && (
            <p className="text-[9px] text-zinc-300 italic font-light leading-snug line-clamp-1 border-t border-white/5 pt-3 opacity-80">"{venue.usp}"</p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2.5">
            <button 
                onClick={(e) => { e.stopPropagation(); onViewMenu(venue); }}
                className={`bg-zinc-800 text-white ${isLarge ? 'text-[8px] py-2.5' : 'text-[8px] py-2'} font-black rounded-xl border border-white/10 uppercase tracking-[0.15em] active:bg-zinc-700 transition-all`}
            >
                Menu
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onBook(venue); }}
                className={`bg-white text-black ${isLarge ? 'text-[8px] py-2.5' : 'text-[8px] py-2'} font-black rounded-xl uppercase tracking-[0.15em] active:scale-95 transition-transform shadow-lg`}
            >
                Book
            </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
