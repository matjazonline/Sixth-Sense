
import React, { useState, useEffect, useMemo } from 'react';
import { Venue, MenuItem, Reservation, VenueStaffState, TimeBlock } from '../types';
import { generateTwoHourWindows } from '../utils/dataProcessing';

interface RestaurantPortalProps {
  venues: Venue[];
  menuItems: MenuItem[];
  onClose: () => void;
}

type Tab = 'availability' | 'reservations' | 'menu' | 'feedback';

const RestaurantPortal: React.FC<RestaurantPortalProps> = ({ venues, menuItems, onClose }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeVenueId, setActiveVenueId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('availability');
  const [staffState, setStaffState] = useState<VenueStaffState | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const savedSession = localStorage.getItem('sixth_sense_staff_session');
    if (savedSession) {
      setActiveVenueId(savedSession);
      setIsLoggedIn(true);
      loadVenueData(savedSession);
    }
  }, []);

  const loadVenueData = (vId: string) => {
    const saved = localStorage.getItem(`staff_state_${vId}`);
    if (saved) {
      setStaffState(JSON.parse(saved));
    } else {
      setStaffState({
        venueId: vId,
        blockedSlots: {},
        serviceNotes: '',
        soldOutItems: [],
        chefPicks: [],
        itemNotes: {}
      });
    }

    const venue = venues.find(v => v.id === vId);
    const today = new Date().toISOString().split('T')[0];
    
    const mockRes: Reservation[] = [
      {
        id: 'staff-res-1',
        venueId: vId,
        venueName: venue?.name || '',
        dateTime: `${today} 19:30`,
        partySize: 4,
        status: 'confirmed',
        guestName: 'Alexander Knight',
        guestPhone: '+971 50 123 4567',
        guestEmail: 'alex@knight.com',
        isVIP: true,
        source: 'concierge',
        internalNotes: 'Regular guest. Preferred table 12.'
      },
      {
        id: 'staff-res-2',
        venueId: vId,
        venueName: venue?.name || '',
        dateTime: `${today} 20:00`,
        partySize: 2,
        status: 'seated',
        guestName: 'Sarah Jenkins',
        guestPhone: '+971 52 987 6543',
        guestEmail: 'sarah.j@gmail.com',
        source: 'app',
        specialRequests: 'Celebrating Anniversary'
      },
      {
        id: 'staff-res-3',
        venueId: vId,
        venueName: venue?.name || '',
        dateTime: `2023-10-25 20:00`,
        partySize: 2,
        status: 'completed',
        guestName: 'Julian Rossi',
        rating: 5,
        feedback: 'Exceptional service and the truffle pasta was a highlight.',
        source: 'app'
      }
    ];
    setReservations(mockRes);
  };

  const handleLogin = () => {
    if (pin === '1234' && activeVenueId) {
      setIsLoggedIn(true);
      localStorage.setItem('sixth_sense_staff_session', activeVenueId);
      loadVenueData(activeVenueId);
      setError('');
    } else {
      setError('Invalid PIN (Try 1234)');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('sixth_sense_staff_session');
    setPin('');
    setActiveVenueId('');
    setStaffState(null);
  };

  const handleExitToProfile = () => {
    onClose();
  };

  const saveStaffState = (newState: VenueStaffState) => {
    setStaffState(newState);
    localStorage.setItem(`staff_state_${newState.venueId}`, JSON.stringify(newState));
  };

  const toggleSlotAvailability = (label: string) => {
    if (!staffState) return;
    const currentDayBlocked = staffState.blockedSlots[selectedDate] || [];
    const isBlocked = currentDayBlocked.includes(label);
    
    let nextDayBlocked: string[];
    if (isBlocked) {
      nextDayBlocked = currentDayBlocked.filter(l => l !== label);
    } else {
      nextDayBlocked = [...currentDayBlocked, label];
    }
    
    saveStaffState({
      ...staffState,
      blockedSlots: { ...staffState.blockedSlots, [selectedDate]: nextDayBlocked }
    });
  };

  const selectedVenue = useMemo(() => venues.find(v => v.id === activeVenueId), [venues, activeVenueId]);

  const availabilityBlocks = useMemo(() => {
    if (!selectedVenue) return [];
    return generateTwoHourWindows(selectedVenue.openingHours);
  }, [selectedVenue]);

  const venueSpecificMenu = useMemo(() => {
    if (!selectedVenue) return [];
    const venueSlug = selectedVenue.name.toLowerCase().replace(/\s+/g, '-');
    return menuItems.filter(item => 
      item.venueSlug === venueSlug || 
      item.venueName?.toLowerCase() === selectedVenue.name.toLowerCase()
    );
  }, [selectedVenue, menuItems]);

  const activeReservations = useMemo(() => {
    return reservations.filter(r => r.dateTime.startsWith(selectedDate) && r.status !== 'completed');
  }, [reservations, selectedDate]);

  const feedbackList = useMemo(() => {
    return reservations.filter(r => r.status === 'completed' && r.rating);
  }, [reservations]);

  const calendarDates = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        dateStr: d.toISOString().split('T')[0],
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.getDate()
      };
    });
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col bg-black overflow-hidden animate-in fade-in duration-300">
        <header className="h-16 border-b border-white/5 flex items-center px-4 shrink-0">
           <button onClick={handleExitToProfile} className="p-2 w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
           </button>
           <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Staff Secure Access</span>
           <div className="w-10"></div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-12 pb-20">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 text-white shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             </div>
             <h2 className="text-3xl font-serif text-white tracking-tight">Staff Portal</h2>
          </div>
          
          <div className="w-full max-w-xs space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Establishment Identity</label>
                <select 
                  value={activeVenueId}
                  onChange={e => setActiveVenueId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-emerald-500/50 appearance-none shadow-xl"
                >
                  <option value="">Select Establishment...</option>
                  {[...venues].sort((a,b) => a.name.localeCompare(b.name)).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Access PIN</label>
                <input 
                  type="password"
                  placeholder="0000"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white text-center text-3xl tracking-[0.4em] outline-none shadow-xl focus:border-white/30"
                />
              </div>
            </div>

            {error && <p className="text-rose-500 text-[10px] text-center font-bold uppercase tracking-widest">{error}</p>}

            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-2xl active:scale-95 transition-all"
            >
              Sign In
            </button>
            
            <button 
              onClick={handleExitToProfile}
              className="w-full py-2 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Back to Personal Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden animate-in fade-in duration-300">
      {/* STAFF HEADER */}
      <header className="h-16 flex items-center px-6 justify-between border-b border-white/5 bg-black shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleExitToProfile} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90 shadow-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/></svg>
          </button>
          <div className="min-w-0 pr-4">
            <h2 className="text-[12px] font-black uppercase tracking-widest text-white leading-none truncate">{selectedVenue?.name}</h2>
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black mt-1 block">Management Engine</span>
          </div>
        </div>
        <button onClick={handleLogout} className="text-[9px] font-black text-zinc-600 uppercase hover:text-rose-500 transition-colors shrink-0">Logout</button>
      </header>

      {/* TABS */}
      <nav className="grid grid-cols-4 border-b border-white/5 bg-zinc-950 px-2 shrink-0">
        {[
          { id: 'availability', label: 'Calendar' },
          { id: 'reservations', label: 'Bookings' },
          { id: 'menu', label: 'Inventory' },
          { id: 'feedback', label: 'Feedback' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`py-5 text-[9px] font-black uppercase tracking-[0.15em] transition-all relative shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-zinc-500'}`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 pb-24 space-y-8 scroll-touch scrollbar-hide">
        {activeTab === 'availability' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif text-white italic tracking-tight">Daily Schedule</h3>
                  <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">2hr Windows</span>
               </div>
               <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                 {calendarDates.map(({ dateStr, dayLabel, dateNum }) => {
                   const isActive = selectedDate === dateStr;
                   return (
                     <button 
                       key={dateStr}
                       onClick={() => setSelectedDate(dateStr)}
                       className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border transition-all ${isActive ? 'bg-white border-white scale-105 shadow-xl shadow-white/5' : 'bg-zinc-900 border-white/10 text-zinc-500'}`}
                     >
                       <span className={`text-[8px] font-black uppercase mb-1 ${isActive ? 'text-zinc-500' : 'text-zinc-600'}`}>{dayLabel}</span>
                       <span className={`text-xl font-serif ${isActive ? 'text-black font-bold' : 'text-zinc-200'}`}>{dateNum}</span>
                     </button>
                   );
                 })}
               </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center gap-4 text-zinc-700">
                   <div className="h-px bg-current flex-1"></div>
                   <span className="text-[9px] font-black uppercase tracking-[0.3em]">Toggle Blocked Windows</span>
                   <div className="h-px bg-current flex-1"></div>
                </div>

                <div className="grid gap-3">
                  {availabilityBlocks.length === 0 ? (
                    <div className="p-12 text-center border border-white/5 border-dashed rounded-3xl opacity-30">
                       <p className="text-[11px] font-black uppercase tracking-widest">No windows for these hours</p>
                    </div>
                  ) : availabilityBlocks.map(block => {
                    const isBlocked = staffState?.blockedSlots[selectedDate]?.includes(block.label);
                    return (
                      <button 
                        key={block.label}
                        onClick={() => toggleSlotAvailability(block.label)}
                        className={`group relative h-20 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col items-center justify-center ${isBlocked ? 'bg-zinc-950 border-rose-500/20 grayscale opacity-40' : 'bg-zinc-900 border-white/5 active:scale-[0.98]'}`}
                      >
                         <div className="relative z-10">
                            <span className={`text-[10px] font-black uppercase tracking-[0.4em] block mb-1 transition-colors ${isBlocked ? 'text-rose-500' : 'text-zinc-500'}`}>Window</span>
                            <span className={`text-2xl font-serif tracking-tight transition-colors ${isBlocked ? 'text-zinc-400 line-through' : 'text-white'}`}>{block.label}</span>
                         </div>
                         <div className={`absolute top-3 right-4 h-2 w-2 rounded-full ${isBlocked ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
                      </button>
                    );
                  })}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="space-y-2">
                <h3 className="text-xl font-serif text-white italic tracking-tight">Current Manifest</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{selectedDate}</p>
             </div>

             <div className="grid gap-4">
                {activeReservations.length === 0 ? (
                  <div className="py-20 text-center border border-white/5 border-dashed rounded-[2rem] opacity-30">
                     <p className="text-[11px] font-black uppercase tracking-widest">No active bookings</p>
                  </div>
                ) : activeReservations.map(res => (
                  <div key={res.id} className="bg-zinc-900 p-6 rounded-[2.5rem] border border-white/5 space-y-4 shadow-xl">
                     <div className="flex justify-between items-start">
                        <div>
                           <h5 className="text-2xl font-serif text-white leading-none">{res.guestName}</h5>
                           <div className="flex items-center gap-2 mt-3">
                              <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-400 font-black px-2 py-0.5 rounded-md uppercase tracking-widest">{res.dateTime.split(' ')[1]}</span>
                              <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-400 font-black px-2 py-0.5 rounded-md uppercase tracking-widest">{res.partySize} PAX</span>
                           </div>
                        </div>
                        {res.isVIP && (
                          <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center shadow-lg">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          </div>
                        )}
                     </div>
                     <div className="flex gap-2 pt-2">
                        <button className="flex-1 py-3 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl active:scale-95 transition-all shadow-lg shadow-emerald-500/10">Seated</button>
                        <button className="px-4 py-3 bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest rounded-xl active:scale-95 transition-all">No Show</button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <h3 className="text-xl font-serif text-white italic tracking-tight">Live Stock</h3>
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{venueSpecificMenu.length} PLATES</span>
             </div>
             <div className="grid gap-3 pb-20">
                {venueSpecificMenu.map(item => (
                  <div key={item.id} className="bg-zinc-900/60 p-5 rounded-3xl border border-white/5 flex items-center justify-center group hover:bg-zinc-900 transition-all shadow-lg">
                     <div className="flex-1 min-w-0 pr-4">
                        <p className="text-[13px] font-bold text-white truncate">{item.item}</p>
                        <p className="text-[9px] text-zinc-600 font-black uppercase mt-0.5">{item.course}</p>
                     </div>
                     <button className="px-4 py-2 bg-zinc-800 text-[9px] font-black uppercase text-emerald-500 border border-emerald-500/10 rounded-xl hover:bg-emerald-500 hover:text-black transition-all">Active</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'feedback' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h3 className="text-xl font-serif text-white italic tracking-tight">Guest Reviews</h3>
                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Neural Sentiment Analysis</p>
              </div>

              <div className="grid gap-4 pb-20">
                 {feedbackList.length === 0 ? (
                   <div className="py-20 text-center border border-white/5 border-dashed rounded-[2rem] opacity-30">
                      <p className="text-[11px] font-black uppercase tracking-widest">No feedback received yet</p>
                   </div>
                 ) : feedbackList.map(item => (
                   <div key={item.id} className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-lg">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-white font-bold text-[14px]">{item.guestName}</p>
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mt-1">{item.dateTime.split(' ')[0]}</p>
                         </div>
                         <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(star => (
                               <svg key={star} width="10" height="10" viewBox="0 0 24 24" fill={star <= (item.rating || 0) ? "#fbbf24" : "none"} stroke="#fbbf24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            ))}
                         </div>
                      </div>
                      <p className="text-zinc-400 text-[12px] italic leading-relaxed">"{item.feedback}"</p>
                      <div className="flex items-center gap-2 pt-2">
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${item.source === 'app' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-500/10 text-zinc-400'}`}>Source: {item.source}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </main>

      {/* PERSISTENT STATUS BAR */}
      <footer className="h-14 border-t border-white/5 bg-zinc-950 flex items-center px-6 justify-between text-[8px] font-black uppercase tracking-[0.4em] shrink-0">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
            <span className="text-emerald-500">Establishment Online</span>
         </div>
         <span className="text-zinc-700">VALAi Engine v3.0</span>
      </footer>
    </div>
  );
};

export default RestaurantPortal;
