
import React, { useState, useMemo, useEffect } from 'react';
import { Reservation, MenuItem, UserProfile, Venue } from '../types';
import { getWinePairing, sendGeminiMessage } from '../services/geminiService';
import { normalize } from '../utils/dataProcessing';

interface CheckInViewProps {
  reservations: Reservation[];
  menuItems: MenuItem[];
  venues: Venue[];
  onCheckIn: (resId: string) => void;
  onOrderItem: (resId: string, itemId: string) => void;
  onOpenUpload: () => void;
  onCompleteSession: (resId: string, rating: number, feedback: string) => void;
}

const FEEDBACK_CATEGORIES = ['Vibe', 'Food', 'Service', 'Price'];

const CheckInView: React.FC<CheckInViewProps> = ({ reservations, menuItems, venues, onCheckIn, onOrderItem, onOpenUpload, onCompleteSession }) => {
  const [activeResId, setActiveResId] = useState<string | null>(null);
  const [isViewingSummary, setIsViewingSummary] = useState(false);
  const [winePairing, setWinePairing] = useState<string | null>(null);
  const [isGeneratingPairing, setIsGeneratingPairing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  // Feedback Flow States
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState(0);
  const [feedbackHistory, setFeedbackHistory] = useState<{ category: string; question: string; answer: string }[]>([]);
  const [currentAiQuestion, setCurrentAiQuestion] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [randomizedCategories, setRandomizedCategories] = useState<string[]>([]);
  const [finalRating, setFinalRating] = useState(5);

  const confirmedReservations = useMemo(() => {
    return reservations.filter(r => r.status === 'confirmed' || r.status === 'seated');
  }, [reservations]);

  const activeRes = useMemo(() => {
    return reservations.find(r => r.id === activeResId);
  }, [reservations, activeResId]);

  const activeVenue = useMemo(() => {
    if (!activeRes) return null;
    return venues.find(v => v.id === activeRes.venueId);
  }, [activeRes, venues]);

  const venueMenu = useMemo(() => {
    if (!activeVenue) return [];
    
    const normVenueName = normalize(activeVenue.name);
    
    return menuItems.filter(item => {
      const normItemSlug = normalize(item.venueSlug);
      const normItemVenueName = normalize(item.venueName || "");
      
      return normItemSlug === normVenueName || 
             normItemVenueName === normVenueName ||
             normItemSlug.includes(normVenueName) ||
             normVenueName.includes(normItemSlug);
    });
  }, [activeVenue, menuItems]);

  const orderedMenuItems = useMemo(() => {
    if (!activeRes || !activeRes.orderedItems) return [];
    return activeRes.orderedItems.map(id => menuItems.find(m => m.id === id)).filter(Boolean) as MenuItem[];
  }, [activeRes, menuItems]);

  const groupedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    venueMenu.forEach(item => {
      const course = item.course || 'Other';
      if (!groups[course]) groups[course] = [];
      groups[course].push(item);
    });
    
    const courseRank: Record<string, number> = {
      'Signature': 0, 'Signatures': 0, 
      'Caviar': 1, 'Raw': 1, 'Raw Bar': 1, 'Crudo': 1, 'Carpaccio': 1,
      'Aperitivos': 2, 'Light Bites': 2,
      'Starters': 3, 'Antipasti': 3, 'Entrées': 3, 'Appetizers': 3,
      'Dim Sum': 4, 'Sushi': 4, 'Makimono': 4, 'Nigiri': 4, 'Sashimi': 4,
      'Salads': 5, 'Insalate': 5,
      'Mains': 6, 'Main Course': 6, 'Plats': 6, 'Pasta': 6, 'Risotto': 6, 'Pizza': 6, 'Terra': 6, 'Mare': 6,
      'Sides': 7, 'Contorni': 7,
      'Desserts': 8, 'Dolci': 8, 'Sweets': 8, 'Postres': 8, 'Dolci (Desserts)': 8
    };

    return Object.keys(groups).sort((a, b) => {
      const rankA = courseRank[a] ?? 99;
      const rankB = courseRank[b] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    }).map(key => ({
      name: key,
      items: groups[key]
    }));
  }, [venueMenu]);

  const handleCompleteOrder = async () => {
    if (!activeRes) return;
    setIsGeneratingPairing(true);
    setIsViewingSummary(true);
    const pairing = await getWinePairing(orderedMenuItems, activeRes.venueName);
    setWinePairing(pairing || null);
    setIsGeneratingPairing(false);
  };

  const handlePingServer = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 3000);
    }, 1500);
  };

  const handleBack = () => {
    if (isFeedbackMode) return;
    if (isViewingSummary) {
      setIsViewingSummary(false);
      setWinePairing(null);
    } else {
      setActiveResId(null);
    }
  };

  const handleConfirmArrival = (id: string) => {
    onCheckIn(id);
  };

  const startFeedbackFlow = async () => {
    const shuffled = [...FEEDBACK_CATEGORIES].sort(() => Math.random() - 0.5);
    setRandomizedCategories(shuffled);
    setIsFeedbackMode(true);
    setFeedbackStep(0);
    await generateNextFeedbackQuestion(shuffled[0], []);
  };

  const generateNextFeedbackQuestion = async (category: string, history: any[]) => {
    setIsThinking(true);
    const prompt = `You are Sixth Sense Concierge. A guest is completing their session at ${activeRes?.venueName}. Ask a sophisticated, short, and intelligent question to get feedback about the "${category}" of the venue. Focus on detail. Don't use greeting, just the question.`;
    
    try {
      const response = await sendGeminiMessage([{ role: 'user', parts: [{ text: prompt }] }], "Concierge Feedback Mode");
      setCurrentAiQuestion(response.text || `How would you describe the ${category} today?`);
    } catch (e) {
      setCurrentAiQuestion(`How was the ${category} during your visit?`);
    } finally {
      setIsThinking(false);
    }
  };

  const submitFeedbackAnswer = async () => {
    if (!userInput.trim() || isThinking) return;

    const currentCategory = randomizedCategories[feedbackStep];
    const newHistory = [...feedbackHistory, { category: currentCategory, question: currentAiQuestion, answer: userInput.trim() }];
    setFeedbackHistory(newHistory);
    setUserInput('');

    if (feedbackStep < 3) {
      const nextStep = feedbackStep + 1;
      setFeedbackStep(nextStep);
      await generateNextFeedbackQuestion(randomizedCategories[nextStep], newHistory);
    } else {
      setFeedbackStep(4);
    }
  };

  const finishSession = () => {
    const summary = feedbackHistory.map(h => `${h.category}: ${h.answer}`).join(' | ');
    if (activeResId) {
      onCompleteSession(activeResId, finalRating, summary);
      resetFlow();
    }
  };

  const resetFlow = () => {
    setActiveResId(null);
    setIsFeedbackMode(false);
    setFeedbackStep(0);
    setFeedbackHistory([]);
    setIsViewingSummary(false);
    setWinePairing(null);
  };

  if (activeResId && activeRes) {
    if (isFeedbackMode) {
      return (
        <div className="h-full flex flex-col bg-black animate-in fade-in duration-500 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900 z-50">
             <div 
               className="h-full bg-emerald-500 transition-all duration-700" 
               style={{ width: `${(feedbackStep / 4) * 100}%` }}
             ></div>
          </div>

          <main className="flex-1 flex flex-col px-8 pb-32 overflow-y-auto scrollbar-hide justify-center items-center">
            {feedbackStep < 4 ? (
              <div className="w-full max-w-[400px] space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                <div className="space-y-4 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 block">Inquiry {feedbackStep + 1} of 4</span>
                  <h3 className="text-3xl font-serif text-white leading-tight italic">
                    {isThinking ? "Curating inquiry..." : currentAiQuestion}
                  </h3>
                </div>

                <div className="space-y-6">
                   <div className="relative">
                      <textarea 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Type or speak your thoughts..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-3xl p-6 text-white text-base font-light leading-relaxed outline-none focus:border-emerald-500/30 transition-all min-h-[160px] resize-none shadow-2xl"
                      />
                      <button className="absolute bottom-6 right-6 p-3 rounded-full bg-white/5 border border-white/10 text-zinc-400 active:scale-90 transition-all">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                      </button>
                   </div>
                   
                   <button 
                     onClick={submitFeedbackAnswer}
                     disabled={!userInput.trim() || isThinking}
                     className={`w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl shadow-2xl transition-all active:scale-95 ${(!userInput.trim() || isThinking) ? 'opacity-30 grayscale' : 'hover:bg-emerald-400'}`}
                   >
                     {isThinking ? 'Syncing...' : 'Continue'}
                   </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[400px] flex flex-col items-center justify-center text-center space-y-12 animate-in zoom-in duration-700">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 mb-4 shadow-2xl">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 className="text-4xl font-serif text-white tracking-tight">Visit Mapped.</h3>
                  <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-black">Final Neural Calibration</p>
                </div>

                <div className="space-y-6 w-full max-w-xs">
                   <p className="text-zinc-400 text-xs uppercase tracking-widest font-black">Overall Rating</p>
                   <div className="flex justify-center gap-3">
                      {[1,2,3,4,5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setFinalRating(star)}
                          className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${finalRating >= star ? 'bg-amber-400 border-amber-400 text-black shadow-lg scale-105' : 'bg-white/5 border-white/10 text-zinc-600'}`}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill={finalRating >= star ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </button>
                      ))}
                   </div>
                </div>

                <button 
                   onClick={finishSession}
                   className="w-full max-w-xs py-5 bg-white text-black font-black uppercase tracking-[0.4em] text-[12px] rounded-2xl shadow-2xl active:scale-95 transition-all mt-4"
                >
                  Close Session
                </button>
              </div>
            )}
          </main>
        </div>
      );
    }
    
    if (isViewingSummary) {
      return (
        <div className="h-full flex flex-col bg-zinc-950 animate-in fade-in zoom-in duration-300">
          <header className="h-20 flex items-end pb-4 px-4 border-b border-white/10 shrink-0">
            <button onClick={handleBack} className="p-2 -ml-2 text-zinc-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="flex-1 text-center mb-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Order Summary</h2>
            </div>
            <div className="w-8"></div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 overscroll-contain">
            <div className="text-center space-y-1">
              <h3 className="text-3xl font-serif text-white tracking-tight italic">Your Selections</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">{activeRes.venueName}</p>
            </div>

            <div className="space-y-4">
              {orderedMenuItems.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-4 border-b border-white/5 pb-3 animate-in fade-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                  <span className="text-zinc-700 font-mono text-xs pt-1">{(idx + 1).toString().padStart(2, '0')}</span>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="text-lg font-serif text-white">{item.item}</h4>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">{item.course}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-amber-500/20 flex-1"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/60 flex items-center gap-2">
                        Sommelier Pairing
                    </span>
                    <div className="h-px bg-amber-500/20 flex-1"></div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 rounded-3xl p-5 relative overflow-hidden group">
                    {isGeneratingPairing ? (
                        <div className="flex flex-col items-center justify-center py-2 space-y-3 opacity-40">
                             <div className="flex gap-1.5"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-200"></div></div>
                        </div>
                    ) : (
                        <p className="text-zinc-200 text-[13px] italic font-serif leading-relaxed text-center">{winePairing}</p>
                    )}
                </div>
            </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-black/50 backdrop-blur-md shrink-0 flex flex-col gap-2">
              <button onClick={handlePingServer} disabled={isPinging || pingSuccess} className={`w-full py-4 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all flex items-center justify-center gap-2 border shadow-lg ${pingSuccess ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-zinc-900 border-white/10 text-zinc-100 active:scale-95'}`}>
                {isPinging ? <span>Pinging...</span> : pingSuccess ? <span>Host Notified</span> : <span>Ping My Server</span>}
              </button>
              <button onClick={() => setIsViewingSummary(false)} className="w-full py-3 text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl active:opacity-50 transition-all">Modify Selection</button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-black animate-in fade-in slide-in-from-right duration-300 relative overflow-hidden">
        <header className="h-20 flex items-end pb-4 px-4 border-b border-white/5 shrink-0 z-50">
          <button onClick={handleBack} className="p-2 -ml-2 text-zinc-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex-1 text-center mb-1 overflow-hidden px-2">
            <h2 className="text-sm font-serif text-white truncate">{activeRes.venueName} Portal</h2>
          </div>
          <div className="w-8"></div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden relative">
          {!activeRes.isCheckedIn ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700 text-center py-20">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 animate-pulse shadow-2xl">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2"><path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-serif text-white italic leading-tight">Confirm Arrival</h3>
                <p className="text-[10px] text-zinc-500 font-black px-8 leading-relaxed uppercase tracking-[0.5em]">
                  SYNC NEURAL MANIFEST FOR <span className="text-white">{activeRes.venueName}</span>
                </p>
              </div>
              <button 
                onClick={() => handleConfirmArrival(activeRes.id)}
                className="w-full max-w-xs py-5 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl active:scale-95 transition-all shadow-[0_10px_50px_rgba(255,255,255,0.15)]"
              >
                Confirm Arrival
              </button>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col overflow-hidden animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 pt-4 shrink-0">
                    <div className="space-y-0.5 min-w-0 pr-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Establishment Active</span>
                    <h3 className="text-2xl font-serif text-white tracking-tight italic truncate">{activeRes.venueName}</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shrink-0">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">{activeRes.orderedItems?.length || 0} Selections</span>
                    </div>
                </div>
                
                {/* MENU SCROLL AREA - Explicit height handling for reliable scrolling */}
                <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain py-8 px-1">
                    {groupedMenu.length === 0 ? (
                        <div className="py-24 text-center border border-white/5 border-dashed rounded-[3rem] opacity-30 flex flex-col items-center justify-center space-y-4">
                           <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                           <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black px-12 leading-relaxed">Mapping establishment neural inventory...</p>
                        </div>
                    ) : (
                        <div className="space-y-12 pb-24">
                        {groupedMenu.map(group => (
                            <section key={group.name} className="space-y-6">
                            <div className="flex items-center gap-4 sticky top-0 z-20 bg-black/80 backdrop-blur-sm py-2">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 shrink-0">{group.name}</h4>
                                <div className="h-[1px] bg-gradient-to-r from-white/10 to-transparent flex-1"></div>
                            </div>
                            <div className="grid gap-4">
                                {group.items.map(item => {
                                const isOrdered = activeRes.orderedItems?.includes(item.id);
                                return (
                                    <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-5 flex gap-5 transition-all hover:bg-zinc-900/60 shadow-xl relative overflow-hidden group">
                                    <div className="flex-1 space-y-2 relative z-10">
                                        <div className="flex justify-between items-start">
                                        <h4 className="text-white font-serif text-lg leading-tight italic pr-2">{item.item}</h4>
                                        <span className="text-emerald-500 text-[11px] font-black font-mono pt-1">AED {item.price || '—'}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 font-light leading-relaxed line-clamp-3">{item.description}</p>
                                    </div>
                                    <button 
                                        onClick={() => onOrderItem(activeRes.id, item.id)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 border relative z-10 ${isOrdered ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-zinc-600 active:scale-90'}`}
                                    >
                                        {isOrdered ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6 9 17l-5-5"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>}
                                    </button>
                                    </div>
                                );
                                })}
                            </div>
                            </section>
                        ))}
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>

        {activeRes.isCheckedIn && (
          <div className="sticky bottom-0 p-5 bg-gradient-to-t from-black via-black to-transparent shrink-0 flex flex-col gap-3 z-50 border-t border-white/5">
              <div className="flex gap-3">
                 <button onClick={handlePingServer} disabled={isPinging || pingSuccess} className="flex-1 py-4 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all flex items-center justify-center gap-2 border bg-zinc-900 border-white/10 text-zinc-100 active:scale-95 shadow-xl">
                    {isPinging ? <span>Pinging...</span> : pingSuccess ? <span>Notified</span> : <span>Ping Server</span>}
                 </button>
                 <button 
                   onClick={startFeedbackFlow}
                   className="flex-1 py-4 bg-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-rose-500/10 active:scale-95 transition-all"
                 >
                   End Session
                 </button>
              </div>
              {activeRes.orderedItems && activeRes.orderedItems.length > 0 && (
                <button onClick={handleCompleteOrder} className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <span>Review Selections</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black animate-in fade-in duration-500 overflow-hidden">
      <header className="px-6 pt-24 pb-6 text-center space-y-2 shrink-0">
        <h2 className="text-5xl font-serif text-white tracking-tight italic uppercase">Arrival</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black">Establishment Sync</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide space-y-6 overscroll-contain">
        <button onClick={onOpenUpload} className="w-full bg-zinc-900/50 border border-emerald-500/20 rounded-[2.5rem] p-7 text-left relative overflow-hidden group active:scale-[0.98] transition-all shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-emerald-400 text-lg font-black uppercase tracking-widest">Verify the Vibe</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium uppercase tracking-widest">Capture live data & earn tokens</p>
            </div>
          </div>
        </button>

        {confirmedReservations.length === 0 ? (
          <div className="py-24 text-center border border-white/5 border-dashed rounded-[3rem] space-y-4 bg-zinc-900/10">
             <p className="text-[12px] text-zinc-600 uppercase tracking-[0.4em] leading-relaxed px-12 font-black">No active manifests found for current session cycle.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {confirmedReservations.map(res => (
              <button key={res.id} onClick={() => setActiveResId(res.id)} className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-7 text-left group active:scale-[0.98] transition-all relative overflow-hidden shadow-xl hover:bg-zinc-900/80">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <h4 className="text-2xl font-serif text-white tracking-tight italic truncate">{res.venueName}</h4>
                    <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">{res.dateTime}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest shadow-lg shrink-0 ${res.isCheckedIn ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-white/5 text-zinc-500 border-white/10'}`}>
                    {res.isCheckedIn ? 'SEATED' : 'READY'}
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white transition-all">
                   <span>SYNC PORTAL</span>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInView;
