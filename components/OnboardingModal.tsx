
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, MenuItem, PalateItem } from '../types';

interface OnboardingModalProps {
  dishes: MenuItem[];
  onComplete: (profile: UserProfile) => void;
}

const STEPS = [
  'Welcome',
  'Identity',
  'Taste Test 1',
  'Vibe',
  'Taste Test 2',
  'Preferences',
  'Finish'
];

const AREAS = ['Downtown', 'DIFC', 'Palm Jumeirah', 'Dubai Marina', 'Jumeirah Beach', 'Business Bay', 'Al Barsha'];

const NeuralFoodBrain: React.FC = () => (
  <div className="relative w-64 h-64 mx-auto mb-10">
    <div className="absolute inset-0 bg-zinc-600/20 rounded-full blur-[60px] animate-pulse"></div>
    <svg className="relative w-full h-full" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="neuralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4d4d8" />
          <stop offset="100%" stopColor="#52525b" />
        </linearGradient>
      </defs>
      <g stroke="url(#neuralGrad)" strokeWidth="0.2" fill="none" opacity="0.4">
        <path d="M50 20 L30 40 L70 40 Z" />
        <path d="M30 40 L20 60 L40 70 L50 50 Z" />
        <path d="M70 40 L80 60 L60 70 L50 50 Z" />
        <path d="M40 70 L50 90 L60 70" />
        <path d="M50 20 Q30 40 20 60" className="animate-pulse" strokeDasharray="2 2" />
        <path d="M50 20 Q70 40 80 60" className="animate-pulse" strokeDasharray="2 2" />
      </g>
      <circle cx="50" cy="20" r="3" fill="#d4d4d8" />
      <text x="47" y="21.5" className="text-[5px]">🧠</text>
      <circle cx="30" cy="40" r="2.5" fill="#a1a1aa" />
      <text x="27.5" y="41.5" className="text-[5px]">🍷</text>
      <circle cx="70" cy="40" r="2.5" fill="#a1a1aa" />
      <text x="67.5" y="41.5" className="text-[5px]">🍝</text>
      <circle cx="20" cy="60" r="2.5" fill="#71717a" />
      <text x="17.5" y="61.5" className="text-[5px]">🍣</text>
      <circle cx="80" cy="60" r="2.5" fill="#71717a" />
      <text x="77.5" y="61.5" className="text-[5px]">🥩</text>
      <circle cx="50" cy="90" r="2.5" fill="#3f3f46" />
      <text x="47.5" y="91.5" className="text-[5px]">🦞</text>
      <circle cx="50" cy="50" r="4" fill="white" className="animate-ping opacity-20" />
      <circle cx="50" cy="50" r="2" fill="white" />
    </svg>
  </div>
);

const OnboardingModal: React.FC<OnboardingModalProps> = ({ dishes, onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    phone: '',
    favouriteAreas: [],
    defaultPartySize: 2,
    dietaryRestrictions: [],
    budgetRange: '350-600',
    favoriteCuisines: [],
    dislikes: [],
    heroIngredients: [],
    spiceTolerance: 3,
    vibeLoudnessPreference: 'Balanced',
    vibeRomanceImportance: 5,
    vibePartyImportance: 3,
    vibeInstagramImportance: 3,
    indoorOutdoorPreference: 'Any',
    sunsetPreference: false,
    dressCodeComfort: 'Smart Casual',
    tablePreference: 'Any',
    smokingPreference: 'Any',
    bestTimePreference: 'Leisure',
    adventurousness: 'Balanced',
    myPalate: [],
    savedDishes: []
  });

  const onboardingDishes = useMemo(() => {
    if (!dishes || dishes.length < 4) return [];
    return [...dishes].sort(() => Math.random() - 0.5).slice(0, 8);
  }, [dishes]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(profile as UserProfile);
    }
  };

  const handleBack = () => {
    setStep(Math.max(0, step - 1));
  };

  const handleTap = (e: React.MouseEvent) => {
    // Disable background tap navigation on identity, finish, and welcome steps to avoid accidental navigation
    if (step === 0 || step === 1 || step === 5 || step === 6) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea')) return;
    
    const { clientX } = e;
    const { innerWidth } = window;
    if (clientX > innerWidth / 2) {
      handleNext();
    } else {
      handleBack();
    }
  };

  const toggleArea = (area: string) => {
    setProfile(prev => {
      const current = prev.favouriteAreas || [];
      if (current.includes(area)) {
        return { ...prev, favouriteAreas: current.filter(a => a !== area) };
      } else {
        return { ...prev, favouriteAreas: [...current, area] };
      }
    });
  };

  const selectDish = (dish: MenuItem) => {
    setProfile(prev => {
      const heros = prev.heroIngredients || [];
      const cuisines = prev.favoriteCuisines || [];
      const saved = prev.savedDishes || [];
      const currentPalate = prev.myPalate || [];
      
      const isAlreadySelected = saved.includes(dish.id);
      
      if (isAlreadySelected) {
        return {
          ...prev,
          heroIngredients: heros.filter(h => h !== dish.item),
          savedDishes: saved.filter(id => id !== dish.id),
          myPalate: currentPalate.filter(p => p.id !== `onboarding-${dish.id}`)
        };
      }

      const newPalateItem: PalateItem = {
        id: `onboarding-${dish.id}`,
        images: dish.venueImage ? [dish.venueImage] : [],
        description: dish.item,
        venue: dish.venueName || 'Unknown',
        date: new Date().toISOString(),
        category: 'dish'
      };

      const newCuisines = dish.dietaryTags.length > 0 ? [...cuisines, ...dish.dietaryTags] : cuisines;
      
      return {
        ...prev,
        heroIngredients: Array.from(new Set([...heros, dish.item])),
        favoriteCuisines: Array.from(new Set(newCuisines)),
        savedDishes: Array.from(new Set([...saved, dish.id])),
        myPalate: [...currentPalate, newPalateItem]
      };
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-8 animate-in fade-in duration-500">
            <NeuralFoodBrain />
            <div className="space-y-4">
              <h2 className="text-4xl font-serif text-white leading-tight">Welcome to the future of dining.</h2>
              <p className="text-zinc-500 font-light text-lg">Let's map your unique culinary palate.</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="mt-8 px-10 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[12px] rounded-full shadow-2xl active:scale-95 transition-all"
            >
              Start Curation Flow
            </button>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col justify-center h-full p-8 space-y-8 animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-serif text-white">Who are we hosting?</h2>
            <div className="space-y-6">
              <input 
                type="text" 
                autoFocus
                value={profile.name}
                onClick={(e) => e.stopPropagation()}
                onChange={e => setProfile(prev => ({...prev, name: e.target.value}))}
                className="w-full bg-transparent border-b-2 border-zinc-800 py-4 text-2xl text-white focus:border-white outline-none transition-all placeholder:text-white/10"
                placeholder="Your Name..."
              />
              <div className="space-y-4 pt-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Favourite Areas</p>
                <div className="grid grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto pr-2 scrollbar-hide">
                  {AREAS.map(area => (
                    <button 
                      key={area}
                      onClick={(e) => { e.stopPropagation(); toggleArea(area); }}
                      className={`py-3.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${profile.favouriteAreas?.includes(area) ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-zinc-400 border-white/10'}`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 2: // Taste Test 1
        const dishPair1 = onboardingDishes.slice(0, 2);
        return (
          <div className="flex flex-col justify-center h-full p-8 space-y-8 animate-in slide-in-from-right duration-500">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">Palate Test 01</span>
              <h2 className="text-3xl font-serif text-white">Pick your craving.</h2>
            </div>
            <div className="grid gap-4">
              {onboardingDishes.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                   <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Syncing Dish Database...</p>
                </div>
              ) : dishPair1.map(dish => (
                <button 
                  key={dish.id}
                  onClick={(e) => { e.stopPropagation(); selectDish(dish); }}
                  className={`relative h-44 rounded-2xl overflow-hidden group border transition-all ${profile.savedDishes?.includes(dish.id) ? 'border-white scale-[1.02] shadow-2xl' : 'border-white/10'}`}
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110 opacity-60 grayscale-[0.5]" style={{ backgroundImage: `url('${dish.venueImage || 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&q=80&w=600'}')` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-left">
                    <div className="text-white font-bold text-lg">{dish.item}</div>
                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">{dish.venueName}</div>
                    <div className="text-[10px] text-zinc-500 font-serif italic mt-1 line-clamp-1">{dish.description}</div>
                  </div>
                  {profile.savedDishes?.includes(dish.id) && <div className="absolute top-4 right-4 text-white text-xl bg-white/20 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center">✓</div>}
                </button>
              ))}
            </div>
          </div>
        );
      case 3: // DNA
        return (
          <div className="flex flex-col justify-center h-full p-8 space-y-12 animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-serif text-white">Define your DNA.</h2>
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Music Volume</p>
              <div className="flex gap-2">
                {['Quiet', 'Balanced', 'Lively'].map(l => (
                  <button 
                    key={l}
                    onClick={(e) => { e.stopPropagation(); setProfile(prev => ({...prev, vibeLoudnessPreference: l as any})); }}
                    className={`flex-1 py-4 rounded-xl border transition-all ${profile.vibeLoudnessPreference === l ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-zinc-400 border-white/10'} text-[10px] font-bold uppercase`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Atmosphere</p>
              <div className="flex gap-2">
                {['Indoor', 'Outdoor', 'Any'].map(v => (
                  <button 
                    key={v}
                    onClick={(e) => { e.stopPropagation(); setProfile(prev => ({...prev, indoorOutdoorPreference: v as any})); }}
                    className={`flex-1 py-4 rounded-xl border transition-all ${profile.indoorOutdoorPreference === v ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-zinc-400 border-white/10'} text-[10px] font-bold uppercase`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 4: // Taste Test 2
        const dishPair2 = onboardingDishes.slice(2, 4);
        return (
          <div className="flex flex-col justify-center h-full p-8 space-y-8 animate-in slide-in-from-right duration-500">
             <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">Palate Test 02</span>
              <h2 className="text-3xl font-serif text-white">Texture & Fire.</h2>
            </div>
            <div className="grid gap-4">
              {onboardingDishes.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                   <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Syncing Dish Database...</p>
                </div>
              ) : dishPair2.map(dish => (
                <button 
                  key={dish.id}
                  onClick={(e) => { e.stopPropagation(); selectDish(dish); }}
                  className={`relative h-44 rounded-2xl overflow-hidden group border transition-all ${profile.savedDishes?.includes(dish.id) ? 'border-white scale-[1.02] shadow-2xl' : 'border-white/10'}`}
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110 opacity-60 grayscale-[0.5]" style={{ backgroundImage: `url('${dish.venueImage || 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600'}')` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-left">
                    <div className="text-white font-bold text-lg">{dish.item}</div>
                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">{dish.venueName}</div>
                    <div className="text-[10px] text-zinc-500 font-serif italic mt-1 line-clamp-1">{dish.description}</div>
                  </div>
                  {profile.savedDishes?.includes(dish.id) && <div className="absolute top-4 right-4 text-white text-xl bg-white/20 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center">✓</div>}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col justify-center h-full p-8 space-y-12 animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-serif text-white">Logistics.</h2>
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Financials</p>
              <div className="flex gap-2">
                {[
                  { label: '$', value: '200-350' },
                  { label: '$$', value: '350-600' },
                  { label: '$$$', value: '600-1000' }
                ].map(tier => (
                  <button 
                    key={tier.label}
                    onClick={(e) => { e.stopPropagation(); setProfile(prev => ({...prev, budgetRange: tier.value as any})); }}
                    className={`flex-1 py-4 rounded-xl border transition-all ${profile.budgetRange === tier.value ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-zinc-500 border-white/10'} text-lg font-black tracking-widest`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
               <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Preferred Mode</p>
               <div className="flex gap-3">
                  {['Business', 'Leisure'].map(mode => (
                    <button 
                      key={mode}
                      onClick={(e) => { e.stopPropagation(); setProfile(prev => ({...prev, bestTimePreference: mode})); }}
                      className={`flex-1 py-5 rounded-2xl border transition-all ${profile.bestTimePreference === mode ? 'bg-zinc-100 text-black border-white shadow-xl' : 'bg-white/5 text-zinc-400 border-white/10'} text-[11px] font-black uppercase tracking-[0.2em]`}
                    >
                      {mode}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-8 animate-in zoom-in duration-700">
            <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-4xl animate-bounce shadow-2xl shadow-emerald-500/10">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-serif text-white">Palate mapped.</h2>
              <p className="text-zinc-400 font-light text-lg">Your neural profile is optimized and ready for curation.</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="mt-8 px-10 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[12px] rounded-full shadow-2xl active:scale-95 transition-all"
            >
              Enter Sixth Sense
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black flex items-center justify-center font-sans overflow-hidden select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-zinc-900/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] bg-zinc-900/40 rounded-full blur-[120px]"></div>
      </div>
      <div 
        className="relative w-full h-full max-w-[450px] bg-zinc-950 flex flex-col shadow-2xl"
        onClick={handleTap}
      >
        <div className="absolute top-0 left-0 w-full p-2 pt-4 flex gap-1 z-50" style={{ paddingTop: 'var(--safe-top, 16px)' }}>
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-300 ${i < step ? 'w-full' : i === step ? 'w-full animate-[progress_5s_linear]' : 'w-0'}`}
              />
            </div>
          ))}
        </div>
        <div className="flex-1 relative z-10 transition-all duration-300 overflow-y-auto pb-32 scrollbar-hide">
           {renderStepContent()}
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 pb-12 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-20 flex flex-col gap-4" style={{ paddingBottom: 'var(--safe-bottom, 24px)' }}>
          <div className="flex gap-4">
            {step > 0 && step < STEPS.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleBack(); }}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
              >
                Back
              </button>
            )}
            {step !== 0 && step < STEPS.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className={`flex-[2] py-4 bg-white text-black text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all`}
              >
                Continue
              </button>
            )}
          </div>
          {step !== 0 && step !== 1 && step !== 5 && step !== 6 && (
            <div className="text-center opacity-20 pointer-events-none">
              <span className="text-[8px] uppercase tracking-[0.5em] text-white">Tap right to proceed</span>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default OnboardingModal;
