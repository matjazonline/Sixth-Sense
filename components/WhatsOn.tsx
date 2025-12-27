import React from 'react';
import { Venue } from '../types';

interface WhatsOnProps {
  venues: Venue[];
  onBook: (venue: Venue) => void;
  onViewMenu: (venue: Venue) => void;
}

const WEEKLY_EVENTS = [
  { day: 'MONDAY', venues: ['Ce La Vi', 'Verde Beach'] },
  { day: 'TUESDAY', venues: ['Baoli', 'Raspoutine'] },
  { day: 'WEDNESDAY', venues: ['Verde', "L'amo Bistro"] },
  { day: 'THURSDAY', venues: ['Alaya', 'Nahate', 'Amelia', 'Ninive beach'] },
  { day: 'FRIDAY', venues: ['Casa Amor'] },
  { day: 'SATURDAY', venues: ['Sirene', 'Surf Club'] },
  { day: 'SUNDAY', venues: ['Billionaire', 'Sexy Fish'] }
];

const WhatsOn: React.FC<WhatsOnProps> = ({ venues, onBook, onViewMenu }) => {
  // Find a venue object by name, case insensitive and partial match
  const getVenueByName = (name: string): Venue => {
    const search = name.toLowerCase().trim();
    
    // Manual mapping for 'Verde' to ensure it picks the restaurant image/data, not the beach
    if (search === 'verde') {
      const verdeRest = venues.find(v => v.name === 'Verde Restaurant');
      if (verdeRest) return { ...verdeRest, name: 'Verde' }; // Return with display name 'Verde'
    }

    // Attempt to find in database
    const found = venues.find(v => 
        v.name.toLowerCase() === search || 
        v.name.toLowerCase().includes(search) ||
        search.includes(v.name.toLowerCase())
    );

    if (found) return found;

    // Fallback for venues not in CSV to ensure every event is bookable
    return {
        id: `synthetic-${name}`,
        name: name,
        googleLocationUrl: '',
        imageAddress: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&q=80&w=200',
        contactNumber: '',
        type: 'Restaurant',
        location: 'Dubai',
        commission: 0,
        familyFriendly: false,
        cuisine: 'Luxury Curation',
        openingHours: '19:00 - 03:00',
        daysClosed: [],
        availability: 'Open',
        pricePerPerson: 500,
        promoVenue: false,
        signatureDish: '',
        highTrafficArea: true,
        loudness: 8,
        romanticScore: 7,
        partyVibe: 9,
        instagrammable: 9,
        sunsetView: false,
        indoorOutdoor: 'Indoor',
        bestTimeToArrive: '21:00',
        businessFriendly: false,
        dressCode: 'Smart Elegant',
        birthdayVenue: true,
        usp: 'Curated high-energy dinner party experience.',
        menuLink: '',
        notes: '',
        extraDetails: '',
        googleRating: 4.8
    } as Venue;
  };

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="px-6 pt-20 pb-6 text-center space-y-2">
        <h2 className="text-5xl font-serif text-white tracking-tight italic uppercase">Dinner Parties</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black">Weekly Neural Curation</p>
      </header>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide">
        <div className="space-y-10">
          {WEEKLY_EVENTS.map((event) => (
            <section key={event.day} className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 shrink-0">
                  {event.day}
                </span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div className="grid gap-3">
                {event.venues.map((venueName) => {
                  const venueObj = getVenueByName(venueName);
                  const isSynthetic = venueObj.id.startsWith('synthetic-');
                  const hasMenu = !isSynthetic && venueObj.menuLink;

                  return (
                    <div 
                      key={venueName} 
                      className="group bg-zinc-900/50 border border-white/5 rounded-3xl p-4 flex items-center justify-between transition-all hover:bg-zinc-800/80 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4 flex-1 overflow-hidden pr-2">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                          {venueObj.imageAddress ? (
                            <img src={venueObj.imageAddress} className="w-full h-full object-cover" alt={venueObj.name} />
                          ) : (
                            <span className="text-xs font-serif text-white/20 italic">{venueObj.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <h4 className="text-white font-serif text-base leading-tight uppercase tracking-wider font-bold truncate">
                            {venueObj.name}
                          </h4>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black mt-1 truncate">
                            {venueObj.cuisine}
                          </span>
                        </div>
                      </div>

                      {/* Action Area - Symmetrical Layout */}
                      <div className="flex gap-1.5 w-[130px] shrink-0">
                        {hasMenu ? (
                           <>
                             <button 
                              onClick={() => onViewMenu(venueObj)}
                              className="flex-1 bg-zinc-800 text-white text-[8px] font-black uppercase tracking-tight py-2.5 rounded-xl hover:bg-zinc-700 transition-colors shadow-lg active:scale-90 border border-white/5 text-center"
                            >
                              Menu
                            </button>
                            <button 
                              onClick={() => onBook(venueObj)}
                              className="flex-1 bg-white text-black text-[8px] font-black uppercase tracking-tight py-2.5 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg active:scale-90 text-center"
                            >
                              Book
                            </button>
                           </>
                        ) : (
                          <button 
                            onClick={() => onBook(venueObj)}
                            className="w-full bg-white text-black text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg active:scale-90 text-center"
                          >
                            Book
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-16 text-center space-y-4 px-4 opacity-40">
           <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
           <p className="text-[8px] text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
             Events are updated weekly by Sixth Sense neural intelligence. Access to these venues is managed via our concierge desk to ensure priority placement.
           </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsOn;