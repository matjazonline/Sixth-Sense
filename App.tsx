
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CSV_DATA, MENU_ITEMS_CSV } from './constants';
import { parseCSV, parseMenuItems, filterAndRankVenues, generateTimeSlots, getDubaiTime, parseTimeToMinutes } from './utils/dataProcessing';
import { sendGeminiMessage, getSystemInstruction, LiveManager } from './services/geminiService';
import { Venue, UserPreferences, ChatMessage, UserProfile, MenuItem, PalateItem, Reservation } from './types';
import OnboardingModal from './components/OnboardingModal';
import SwipeDeck from './components/SwipeDeck';
import DishSwipeDeck from './components/DishSwipeDeck';
import DishUpload from './components/DishUpload';
import ProfileView from './components/ProfileView';
import WhatsOn from './components/WhatsOn';
import CheckInView from './components/CheckInView';
import SpotlightView from './components/SpotlightView';
import ChatVenueStack from './components/ChatVenueStack';
import VenueGridView from './components/VenueGridView';
import { Content } from '@google/genai';

const THINKING_STATES = ["Thinking", "Curating", "Calibrating", "Mapping Palate"];

const FOLLOW_UP_BANK = [
  "Would you like to explore a different area?",
  "Does this match the mood you’re in, or should I refine it?",
  "Fancy something similar, or a different cuisine?",
  "Shall I curate an alternative option?",
  "Would you prefer something more intimate?",
  "Should we look elsewhere, or stay nearby?",
  "Is this the experience you had in mind?",
  "Would you like to compare this with another venue?",
  "In the mood for something classic or adventurous?",
  "Would you like a quieter or livelier setting?",
  "Should I refine this by cuisine or atmosphere?",
  "Does this feel right, or shall I adjust?",
  "Would you prefer casual or elevated?",
  "Shall I show you another standout option?",
  "Is there a specific dish you’re craving?",
  "Would you like something more energetic?",
  "Happy with this, or shall we explore?",
  "Stay in this area or branch out?",
  "Should I fine-tune the selection?",
  "Tell me—what should we optimise for?"
];

const WELCOME_MESSAGES = [
  "Bonjour.",
  "Where can I curate your experience today?",
  "Welcome back.",
  "What are you in the mood for?",
  "Good to see you.",
  "Let’s find something exceptional.",
  "Your table awaits.",
  "Dining, curated to your taste.",
  "How may I assist?",
  "Tell me what you’re looking for."
];

const SUB_WELCOME_MESSAGES = [
  "I am your neural dining concierge. How may I curate your evening?",
  "Your dining experience starts here. How can I curate tonight for you?",
  "Allow me to curate your dining experience. Where shall we begin?",
  "I’m here to refine your evening. What would you like to explore?",
  "Sit back. I’ll curate your evening. What are you craving?"
];

const FALLBACK_RESPONSES = [
  "Based on your requirements, here are the finest venues currently available.",
  "I've mapped your request against our neural database. These venues represent the best fit.",
  "I have identified a selection that matches your specific criteria."
];

function safeJsonStringify(obj: any): string {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
        }
        return value;
    });
}

const App: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filters, setFilters] = useState<UserPreferences>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number>(150);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showUploadView, setShowUploadView] = useState(false);
  const [selectedMenuVenue, setSelectedMenuVenue] = useState<Venue | null>(null);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [selectedLocationVenue, setSelectedLocationVenue] = useState<Venue | null>(null);
  
  // Booking States
  const [selectedVenueForBooking, setSelectedVenueForBooking] = useState<Venue | null>(null);
  const [bookingPartySize, setBookingPartySize] = useState(2);
  const [bookingTime, setBookingTime] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(getDubaiTime().toISOString().split('T')[0]);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  const [currentView, setCurrentView] = useState<'chat' | 'whats-on' | 'check-in' | 'venues' | 'night' | 'taste' | 'spotlight'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [subWelcomeMsg, setSubWelcomeMsg] = useState('');
  
  // Follow-up state
  const [activeFollowUp, setActiveFollowUp] = useState<string | null>(null);
  const [lastFollowUpIndex, setLastFollowUpIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const parsedVenues = parseCSV(CSV_DATA);
    setVenues(parsedVenues);
    
    const parsedDishes = parseMenuItems(MENU_ITEMS_CSV, parsedVenues);
    
    const signatureDishesAsItems: MenuItem[] = parsedVenues
      .filter(v => v.signatureDish)
      .map(v => ({
        id: `sig-${v.id}`,
        venueSlug: v.name.toLowerCase().replace(/\s+/g, '-'),
        course: 'Signature',
        item: v.signatureDish.split('|')[0].trim(),
        description: v.usp || "Our curated signature creation.",
        price: v.pricePerPerson,
        dietaryTags: [v.cuisine],
        venueName: v.name,
        venueImage: v.imageAddress
      }));

    const allDishes = [...parsedDishes];
    signatureDishesAsItems.forEach(sig => {
      if (!allDishes.some(d => d.item.toLowerCase() === sig.item.toLowerCase())) {
        allDishes.push(sig);
      }
    });

    const restaurantDishes = allDishes.filter(item => {
        const venue = parsedVenues.find(v => v.name === item.venueName);
        return venue?.type.toLowerCase().trim() === 'restaurant';
    });
    
    setMenuItems(restaurantDishes);

    setWelcomeMsg(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);
    setSubWelcomeMsg(SUB_WELCOME_MESSAGES[Math.floor(Math.random() * SUB_WELCOME_MESSAGES.length)]);

    const saved = localStorage.getItem('sixth_sense_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          setUserProfile(parsed);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } catch (e) {
        setShowOnboarding(true);
      }
    } else {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (isProcessing) {
      interval = window.setInterval(() => {
        setThinkingIndex(prev => (prev + 1) % THINKING_STATES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isProcessing, activeFollowUp]);

  const saveProfileToLocalStorage = (profile: UserProfile) => {
    localStorage.setItem('sixth_sense_user_profile', safeJsonStringify(profile));
  };

  const handleToggleSaveVenue = (venueId: string) => {
    if (!userProfile) return;
    const currentSaved = userProfile.savedVenues || [];
    const isSaved = currentSaved.includes(venueId);
    
    const nextSaved = isSaved 
      ? currentSaved.filter(id => id !== venueId)
      : [...currentSaved, venueId];
      
    const updatedProfile = { ...userProfile, savedVenues: nextSaved };
    setUserProfile(updatedProfile);
    saveProfileToLocalStorage(updatedProfile);
  };

  const handleResetConcierge = () => {
    setMessages([]);
    setFilters({});
    setInputText('');
    setActiveFollowUp(null);
    setCurrentView('chat');
    setWelcomeMsg(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);
    setSubWelcomeMsg(SUB_WELCOME_MESSAGES[Math.floor(Math.random() * SUB_WELCOME_MESSAGES.length)]);
  };

  const handleCloseMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMenuClosing) return;
    setIsMenuClosing(true);
    
    if (menuIframeRef.current) {
        try {
            menuIframeRef.current.src = 'about:blank';
        } catch (e) {}
    }

    setSelectedMenuVenue(null);
    setIsMenuClosing(false);
  };

  const handleCloseLocation = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLocationVenue(null);
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    const msg = text.trim();
    setInputText('');
    setActiveFollowUp(null);
    const newMsgs = [...messages, { role: 'user', content: msg, timestamp: Date.now() } as ChatMessage];
    setMessages(newMsgs);
    setIsProcessing(true);

    try {
        const system = getSystemInstruction(venues.map(v => v.name), userProfile || undefined);
        const history: Content[] = newMsgs.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        
        const response = await sendGeminiMessage(history, system);
        let nextFilters = { ...filters };
        if (response.functionCalls && response.functionCalls.length > 0) {
            for (const fc of response.functionCalls) {
                if (fc.name === 'updateFilters') nextFilters = { ...nextFilters, ...fc.args };
            }
        }
        setFilters(nextFilters);
        const { scored } = filterAndRankVenues(venues, nextFilters, userProfile || undefined);
        const finalSuggestions = scored.slice(0, 5);

        const modelContent = response.text || (finalSuggestions.length > 0 ? "I've curated a few options that align with your profile and request:" : FALLBACK_RESPONSES[0]);

        setMessages(prev => [...prev, { role: 'model', content: modelContent, timestamp: Date.now(), suggestedVenues: finalSuggestions }]);
        
        if (finalSuggestions.length > 0) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * FOLLOW_UP_BANK.length);
          } while (randomIndex === lastFollowUpIndex);
          
          setLastFollowUpIndex(randomIndex);
          setActiveFollowUp(FOLLOW_UP_BANK[randomIndex]);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsProcessing(false);
    }
  };

  const toggleLiveMode = () => setIsLiveMode(!isLiveMode);

  const restaurantVenues = useMemo(() => venues.filter(v => v.type.toLowerCase().trim() === 'restaurant'), [venues]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedVenueForBooking) return [];
    const allSlots = generateTimeSlots(selectedVenueForBooking.openingHours);
    const dubaiNow = getDubaiTime();
    const todayStr = dubaiNow.toISOString().split('T')[0];
    
    if (bookingDate === todayStr) {
      const currentMin = dubaiNow.getHours() * 60 + dubaiNow.getMinutes();
      // Only show slots at least 15 mins in the future from now in Dubai
      return allSlots.filter(slot => parseTimeToMinutes(slot) > (currentMin + 15));
    }
    return allSlots;
  }, [selectedVenueForBooking, bookingDate]);

  const handleBookingConfirm = () => {
    if (!selectedVenueForBooking || !bookingTime) return;
    
    setIsBookingSuccess(true);
    
    setTimeout(() => {
      if (userProfile) {
        const newRes: Reservation = {
          id: `res-${Date.now()}`,
          venueId: selectedVenueForBooking.id,
          venueName: selectedVenueForBooking.name,
          dateTime: `${bookingDate} ${bookingTime}`,
          partySize: bookingPartySize,
          status: 'confirmed',
          source: 'app'
        };
        const updatedProfile = {
          ...userProfile,
          reservations: [newRes, ...(userProfile.reservations || [])]
        };
        setUserProfile(updatedProfile);
        saveProfileToLocalStorage(updatedProfile);
      }
      setSelectedVenueForBooking(null);
      setIsBookingSuccess(false);
      setBookingTime(null);
      setBookingPartySize(2);
    }, 2000);
  };

  const handleCheckIn = (resId: string) => {
    if (!userProfile) return;
    const updatedReservations = userProfile.reservations.map(r => 
      r.id === resId ? { ...r, isCheckedIn: true, status: 'seated' as const } : r
    );
    const updatedProfile = { ...userProfile, reservations: updatedReservations };
    setUserProfile(updatedProfile);
    saveProfileToLocalStorage(updatedProfile);
  };

  const handleOrderItem = (resId: string, itemId: string) => {
    if (!userProfile) return;
    const updatedReservations = userProfile.reservations.map(r => {
      if (r.id === resId) {
        const currentItems = r.orderedItems || [];
        const isAlreadyOrdered = currentItems.includes(itemId);
        const nextItems = isAlreadyOrdered 
          ? currentItems.filter(id => id !== itemId) 
          : [...currentItems, itemId];
        return { ...r, orderedItems: nextItems };
      }
      return r;
    });
    const updatedProfile = { ...userProfile, reservations: updatedReservations };
    setUserProfile(updatedProfile);
    saveProfileToLocalStorage(updatedProfile);
  };

  const handleCompleteSession = (resId: string, rating: number, feedback: string) => {
    if (!userProfile) return;
    const updatedReservations = userProfile.reservations.map(r => 
      r.id === resId ? { ...r, status: 'completed' as const, rating, feedback } : r
    );
    const updatedProfile = { ...userProfile, reservations: updatedReservations };
    setUserProfile(updatedProfile);
    saveProfileToLocalStorage(updatedProfile);
    setCurrentView('chat');
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveProfileToLocalStorage(newProfile);
    setShowProfileView(false);
  };

  const handleRecalibrate = () => {
    setShowProfileView(false);
    setShowOnboarding(true);
  };

  const handleUpload = (item: PalateItem) => {
    if (!userProfile) return;
    const updatedPalate = [item, ...(userProfile.myPalate || [])];
    const updatedProfile = { ...userProfile, myPalate: updatedPalate };
    setUserProfile(updatedProfile);
    saveProfileToLocalStorage(updatedProfile);
    setCredits(prev => prev + (item.category === 'menu' ? 5 : 1));
    setShowUploadView(false);
  };

  const renderInputPill = () => (
    <div className="w-full max-w-[500px] bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[28px] p-1.5 flex items-center shadow-2xl transition-all duration-500 relative">
        <button onClick={toggleLiveMode} className={`p-3 rounded-full transition-all active:scale-90 ${isLiveMode ? 'bg-zinc-400 text-black shadow-lg' : 'text-zinc-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        </button>
        <input 
          type="text" 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          placeholder={isLiveMode ? "Listening..." : "Tell Sixth Sense..."} 
          className="flex-1 bg-transparent px-3 py-2 outline-none text-[16px] placeholder:text-zinc-600 text-white" 
          onKeyDown={e => e.key === 'Enter' && handleUserMessage(inputText)} 
        />
        <button onClick={() => handleUserMessage(inputText)} disabled={!inputText.trim() || isProcessing} className={`p-3 rounded-full transition-all active:scale-95 ${inputText.trim() ? 'bg-white text-black shadow-lg' : 'text-zinc-800'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>
        </button>
    </div>
  );

  return (
    <div id="app-container" className="h-full flex flex-col bg-black overflow-hidden relative">
      {showOnboarding && <OnboardingModal dishes={menuItems} onComplete={(p) => {
        setUserProfile(p);
        saveProfileToLocalStorage(p);
        setShowOnboarding(false);
      }} />}

      <header className="h-14 flex items-center px-4 justify-between glass-panel border-b border-white/5 z-50 shrink-0" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="flex items-center gap-2">
            <button onClick={handleResetConcierge} className="text-sm font-black tracking-widest text-white uppercase">Sixth Sense</button>
            <span className="bg-zinc-400 text-[9px] font-black px-1.5 py-0.5 rounded text-black tracking-tighter shadow-sm">BETA</span>
        </div>
        <button onClick={() => setShowProfileView(true)} className="h-8 px-4 rounded-full bg-zinc-800 text-[10px] font-black tracking-widest uppercase text-white/70 hover:text-white transition-colors">Profile</button>
      </header>

      <main className="flex-1 relative overflow-hidden bg-[#050505]">
        {currentView === 'chat' && (
          <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-y-auto px-4 pt-1 scroll-touch scrollbar-hide z-10 flex flex-col">
              <div className={`min-h-full flex flex-col justify-end ${messages.length === 0 ? 'justify-center pb-20' : 'pb-6'}`}>
                {messages.length === 0 && (
                  <div className="w-full max-w-[360px] mx-auto text-center animate-in fade-in zoom-in duration-700 space-y-6 pb-4">
                    <div className="space-y-4">
                      <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
                        {welcomeMsg.includes('Bonjour') && userProfile?.name ? `${welcomeMsg.replace('.', '')}, ${userProfile.name}` : welcomeMsg}
                      </h2>
                      <p className="text-zinc-500 font-light px-4 text-base">{subWelcomeMsg}</p>
                    </div>
                    <div className="flex justify-center px-2 pt-4">
                      {renderInputPill()}
                    </div>
                  </div>
                )}

                {messages.length > 0 && (
                  <div className="space-y-6 w-full max-w-[600px] mx-auto">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} ${m.suggestedVenues ? 'w-full' : 'max-w-[85%]'}`}>
                          {m.suggestedVenues && (
                            <div className="w-full mb-2">
                              <ChatVenueStack 
                                venues={m.suggestedVenues} 
                                userProfile={userProfile} 
                                onBook={setSelectedVenueForBooking} 
                                onViewMenu={setSelectedMenuVenue} 
                                onViewLocation={setSelectedLocationVenue} 
                              />
                            </div>
                          )}
                          <div className={`px-4 py-2 rounded-[20px] ${m.role === 'user' ? 'bg-zinc-100 text-black rounded-tr-none' : 'bg-zinc-900 border border-white/10 text-gray-100 rounded-tl-none shadow-lg'}`}>
                            <p className="text-[15px] leading-relaxed">{m.content}</p>
                          </div>
                          
                          {i === messages.length - 1 && m.role === 'model' && activeFollowUp && (
                            <div className="mt-4 flex flex-row items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                               <div className="px-4 py-2 rounded-[20px] bg-zinc-900 border border-white/10 text-gray-100 rounded-tl-none shadow-lg max-w-[85%]">
                                  <p className="text-[15px] leading-relaxed">{activeFollowUp}</p>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isProcessing && <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black animate-pulse px-4 pt-2">{THINKING_STATES[thinkingIndex]}...</div>}
                    <div ref={messagesEndRef} className="h-2" />
                  </div>
                )}
              </div>
            </div>

            {messages.length > 0 && (
              <div className="shrink-0 z-40 px-4 pb-4 pt-1 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent flex justify-center">
                <div className="w-full max-w-[500px]">
                  {renderInputPill()}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'whats-on' && <WhatsOn venues={venues} onBook={setSelectedVenueForBooking} onViewMenu={setSelectedMenuVenue} />}
        {currentView === 'check-in' && userProfile && (
          <CheckInView 
            reservations={userProfile.reservations || []} 
            menuItems={menuItems} 
            venues={venues} 
            onCheckIn={handleCheckIn} 
            onOrderItem={handleOrderItem} 
            onOpenUpload={() => setShowUploadView(true)} 
            onCompleteSession={handleCompleteSession}
          />
        )}
        {currentView === 'venues' && userProfile && (
           <VenueGridView 
              venues={restaurantVenues} 
              userProfile={userProfile} 
              onBook={setSelectedVenueForBooking} 
              onViewMenu={setSelectedMenuVenue} 
              onViewLocation={setSelectedLocationVenue} 
              onToggleSave={handleToggleSaveVenue}
           />
        )}
        {currentView === 'taste' && userProfile && <DishSwipeDeck dishes={menuItems} profile={userProfile} onSwipe={()=>{}} onExit={() => setCurrentView('chat')} />}
        {currentView === 'spotlight' && <SpotlightView venues={venues} onBook={setSelectedVenueForBooking} />}
      </main>

      <nav className="h-[84px] grid grid-cols-6 glass-panel border-t border-white/5 shrink-0 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        {[
          { id: 'chat', label: 'Concierge', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 1 1 1 3.8 3.8z"/></svg> },
          { id: 'spotlight', label: 'Spotlight', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg> },
          { id: 'whats-on', label: 'Events', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y2="12"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg> },
          { id: 'check-in', label: 'Arrival', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z"/><path d="m9 10 2 2 4-4"/></svg> },
          { id: 'taste', label: 'Taste', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg> },
          { id: 'venues', label: 'Saved', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg> }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setCurrentView(item.id as any)} 
            className={`flex flex-col items-center justify-center gap-1.5 h-full relative transition-all duration-300 ${currentView === item.id ? 'text-white' : 'text-zinc-500'}`}
          >
              {currentView === item.id && (
                <div className="absolute inset-0 bg-white/[0.03] animate-in fade-in duration-500" />
              )}
              <div className={`flex items-center justify-center transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider text-center w-full px-1 truncate leading-none transition-all duration-300 ${currentView === item.id ? 'opacity-100 font-black' : 'opacity-50'}`}>
                {item.label}
              </span>
              {currentView === item.id && (
                <div className="absolute bottom-1 w-5 h-0.5 bg-white rounded-full shadow-[0_0_10px_white]" />
              )}
          </button>
        ))}
      </nav>

      {/* MODALS */}
      {showProfileView && userProfile && (
          <ProfileView 
            profile={userProfile} 
            credits={credits} 
            onSave={handleSaveProfile} 
            onClose={() => setShowProfileView(false)} 
            onRecalibrate={handleRecalibrate}
            allDishes={menuItems} 
            venues={venues} 
          />
      )}

      {showUploadView && userProfile && (
          <div className="absolute inset-0 z-[6000] bg-black animate-in slide-in-from-bottom duration-300 overflow-y-auto scrollbar-hide" style={{ paddingBottom: 'var(--safe-bottom)' }}>
             <DishUpload 
               venues={venues} 
               menuItems={menuItems} 
               onUpload={handleUpload} 
               onCancel={() => setShowUploadView(false)} 
             />
          </div>
      )}

      {selectedVenueForBooking && (
        <div className="absolute inset-0 z-[500] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-[340px] glass-panel border border-white/10 rounded-[32px] p-6 space-y-6 shadow-2xl overflow-y-auto scrollbar-hide max-h-[90%] overscroll-contain">
                {!isBookingSuccess ? (
                    <>
                        <div className="text-center space-y-2 shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Secure Request</span>
                            <h2 className="text-2xl font-serif text-white">{selectedVenueForBooking.name}</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Select Date</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {[0, 1, 2, 3, 4].map(dayOffset => {
                                        const d = getDubaiTime();
                                        d.setDate(d.getDate() + dayOffset);
                                        const dateStr = d.toISOString().split('T')[0];
                                        const dayLabel = dayOffset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
                                        const dateLabel = d.getDate();
                                        return (
                                            <button 
                                                key={dateStr}
                                                onClick={() => setBookingDate(dateStr)}
                                                className={`flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center border transition-all ${bookingDate === dateStr ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                                            >
                                                <span className="text-[8px] font-black uppercase mb-1">{dayLabel}</span>
                                                <span className="text-base font-serif">{dateLabel}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Party Size</label>
                                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2">
                                    <button onClick={() => setBookingPartySize(Math.max(1, bookingPartySize - 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform">-</button>
                                    <span className="text-xl font-serif text-white">{bookingPartySize} Guests</span>
                                    <button onClick={() => setBookingPartySize(Math.min(12, bookingPartySize + 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform">+</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Available Times</label>
                                <div className="max-h-[240px] overflow-y-auto scrollbar-hide pr-1">
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableTimeSlots.map(time => (
                                            <button 
                                                key={time}
                                                onClick={() => setBookingTime(time)}
                                                className={`py-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${bookingTime === time ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                    {availableTimeSlots.length === 0 && (
                                      <div className="py-12 text-center text-zinc-700 text-[10px] uppercase font-black border border-dashed border-white/5 rounded-2xl">No available slots for selected date</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 shrink-0 space-y-3">
                            <button 
                                onClick={handleBookingConfirm} 
                                disabled={!bookingTime}
                                className={`w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 ${!bookingTime ? 'opacity-30 grayscale' : 'hover:bg-emerald-500 shadow-xl'}`}
                            >
                                {bookingTime ? `Confirm ${bookingTime}` : 'Select Time'}
                            </button>
                            <button onClick={() => setSelectedVenueForBooking(null)} className="w-full py-2 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">Cancel</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center space-y-6 py-10 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-serif text-white italic">Booking Secured</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black leading-relaxed">Neural manifest updated at {selectedVenueForBooking.name}.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {selectedMenuVenue && (
        <div key={`menu-${selectedMenuVenue.id}`} className="absolute inset-0 z-[2000] bg-black animate-in slide-in-from-bottom duration-300 flex flex-col overflow-hidden">
           <header className="h-16 flex items-center px-6 justify-between border-b border-white/5 bg-black relative z-[2002] shrink-0">
              <h3 className="text-sm font-serif text-white font-bold truncate pr-4">{selectedMenuVenue.name} Menu</h3>
              <button 
                onClick={(e) => handleCloseMenu(e)} 
                className="hit-area-44 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
           </header>
           <div className="flex-1 w-full bg-zinc-900 relative z-[2001] overflow-hidden">
             {isMenuClosing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                   <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
             ) : (
               <iframe 
                  ref={menuIframeRef}
                  src={selectedMenuVenue.menuLink} 
                  className="w-full h-full border-none pointer-events-auto" 
                  title={`${selectedMenuVenue.name} Menu`}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms"
               />
             )}
           </div>
        </div>
      )}

      {selectedLocationVenue && (
        <div key={`loc-${selectedLocationVenue.id}`} className="absolute inset-0 z-[2000] bg-black animate-in slide-in-from-bottom duration-300 flex flex-col overflow-hidden">
           <header className="h-16 flex items-center px-6 justify-between border-b border-white/5 bg-black relative z-[2001] shrink-0">
              <h3 className="text-sm font-serif text-white font-bold truncate pr-4">{selectedLocationVenue.name} Location</h3>
              <button 
                onClick={(e) => handleCloseLocation(e)} 
                className="hit-area-44 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
                aria-label="Close location"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
           </header>
           <div className="flex-1 w-full bg-zinc-900 overflow-hidden">
             <iframe 
                src={selectedLocationVenue.googleLocationUrl} 
                className="w-full h-full border-none pointer-events-auto" 
                title="Location" 
                sandbox="allow-scripts allow-same-origin allow-forms"
             />
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
