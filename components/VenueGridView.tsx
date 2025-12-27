
import React, { useState, useMemo } from 'react';
import { Venue, UserProfile } from '../types';
import VenueCard from './VenueCard';

interface VenueGridViewProps {
  venues: Venue[];
  userProfile: UserProfile;
  onBook: (venue: Venue) => void;
  onViewMenu: (venue: Venue) => void;
  onViewLocation: (venue: Venue) => void;
  onToggleSave: (venueId: string) => void;
}

const VenueGridView: React.FC<VenueGridViewProps> = ({ venues, userProfile, onBook, onViewMenu, onViewLocation, onToggleSave }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const savedVenues = useMemo(() => {
    return venues.filter(v => userProfile.savedVenues?.includes(v.id));
  }, [venues, userProfile.savedVenues]);

  const filteredVenues = useMemo(() => {
    let list = venues;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v => 
        v.name.toLowerCase().includes(q) || 
        v.cuisine.toLowerCase().includes(q) || 
        v.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [venues, searchQuery]);

  const exploreVenues = useMemo(() => {
      return filteredVenues.filter(v => !userProfile.savedVenues?.includes(v.id));
  }, [filteredVenues, userProfile.savedVenues]);

  return (
    <div className="h-full flex flex-col bg-black animate-in fade-in duration-500 overflow-hidden">
      {/* Header & Search */}
      <header className="px-6 pt-20 pb-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-5xl font-serif text-white tracking-tight italic uppercase">Collection</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black">Neural Venue Selector</p>
        </div>

        <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search cuisine, area, or name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-emerald-500/30 transition-all placeholder:text-zinc-600"
            />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide space-y-10">
        {/* Saved Section */}
        {savedVenues.length > 0 && !searchQuery && (
          <section className="space-y-4">
            <div className="flex items-center gap-4 px-2">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 shrink-0">Your Favorites</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {savedVenues.map(venue => (
                <div key={venue.id} className="h-full">
                  <VenueCard 
                    venue={venue} 
                    userProfile={userProfile} 
                    onBook={onBook} 
                    onViewMenu={onViewMenu} 
                    onViewLocation={onViewLocation}
                    onToggleSave={onToggleSave}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Explorer Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 shrink-0">
                {searchQuery ? 'Search Results' : 'Explore Establishments'}
            </span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          
          {exploreVenues.length === 0 ? (
             <div className="py-20 text-center border border-white/5 border-dashed rounded-[2rem] opacity-30">
                <p className="text-[11px] font-black uppercase tracking-widest">No venues found</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {exploreVenues.map(venue => (
                <div key={venue.id} className="h-full">
                  <VenueCard 
                    venue={venue} 
                    userProfile={userProfile} 
                    onBook={onBook} 
                    onViewMenu={onViewMenu} 
                    onViewLocation={onViewLocation}
                    onToggleSave={onToggleSave}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VenueGridView;
