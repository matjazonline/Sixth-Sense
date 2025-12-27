
import React, { useState, useMemo } from 'react';
import { UserProfile, Reservation, PalateItem, MenuItem, CreditCard, Venue } from '../types';
import RestaurantPortal from './RestaurantPortal';

interface ProfileViewProps {
  profile: UserProfile;
  credits: number;
  onSave: (newProfile: UserProfile) => void;
  onClose: () => void;
  onRecalibrate: () => void;
  allDishes: MenuItem[];
  venues: Venue[];
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, credits, onSave, onClose, onRecalibrate, allDishes, venues }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>({ ...profile });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [showPortal, setShowPortal] = useState(false);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCard = () => {
    if (!newCard.number || !newCard.name || !newCard.expiry) return;
    
    const card: CreditCard = {
        id: `card-${Date.now()}`,
        cardholderName: newCard.name,
        lastFour: newCard.number.slice(-4),
        expiry: newCard.expiry,
        brand: newCard.number.startsWith('4') ? 'Visa' : 'MasterCard'
    };

    const updatedWallet = [...(editedProfile.wallet || []), card];
    handleChange('wallet', updatedWallet);
    setIsAddingCard(false);
    setNewCard({ number: '', name: '', expiry: '', cvv: '' });
  };

  const handleRemoveCard = (id: string) => {
    const updatedWallet = (editedProfile.wallet || []).filter(c => c.id !== id);
    handleChange('wallet', updatedWallet);
  };

  const likedDishes = useMemo(() => {
      return (editedProfile.savedDishes || []).map(id => 
          allDishes.find(d => d.id === id)
      ).filter(Boolean) as MenuItem[];
  }, [editedProfile.savedDishes, allDishes]);

  return (
    <div className="absolute inset-0 z-[300] bg-black flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* HEADER */}
      <header className="h-14 flex items-center px-4 justify-between border-b border-white/5 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button onClick={onClose} className="hit-area-44 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Neural Profile</span>
        <button onClick={() => onSave(editedProfile)} className="text-[10px] font-black uppercase tracking-widest text-zinc-100 px-3 py-2 border border-white/10 rounded-lg ml-2">Save</button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-12 scrollbar-hide pb-32">
        {/* AVATAR & STATUS */}
        <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-4xl font-serif text-white shadow-2xl relative">
                {editedProfile.name?.charAt(0) || 'U'}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-black flex items-center justify-center shadow-lg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-serif text-white tracking-tight">{editedProfile.name || 'Anonymous User'}</h2>
                <div className="flex flex-col items-center gap-3 mt-2">
                    <div className="px-3 py-1 bg-zinc-100/5 border border-zinc-100/10 rounded-full">
                        <span className="text-[9px] text-zinc-400 uppercase tracking-[0.3em] font-black">{credits} Credits Earned</span>
                    </div>
                    <button 
                      onClick={onRecalibrate}
                      className="text-[9px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-full hover:bg-emerald-500/10 transition-all active:scale-95"
                    >
                      Recalibrate Palate
                    </button>
                </div>
            </div>
        </div>

        {/* NEURAL WALLET */}
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-100/30">Secure Vault</h3>
                <span className="text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">Verified</span>
            </div>

            <div className="space-y-4">
                {(editedProfile.wallet || []).map(card => (
                    <div key={card.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between group shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-6 bg-zinc-800 rounded border border-white/10 flex items-center justify-center">
                                <span className="text-[8px] font-black text-white italic">{card.brand}</span>
                            </div>
                            <div>
                                <p className="text-[12px] text-white font-black tracking-widest">•••• {card.lastFour}</p>
                                <p className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">{card.cardholderName}</p>
                            </div>
                        </div>
                        <button onClick={() => handleRemoveCard(card.id)} className="p-2 text-zinc-800 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                ))}

                {isAddingCard ? (
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4 animate-in zoom-in duration-300 shadow-2xl">
                        <div className="space-y-3">
                            <input type="text" placeholder="NAME ON CARD" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value.toUpperCase()})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-[10px] font-black tracking-widest outline-none focus:border-white/30" />
                            <input type="text" placeholder="CARD NUMBER" maxLength={16} value={newCard.number} onChange={e => setNewCard({...newCard, number: e.target.value.replace(/\D/g, '')})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-[10px] font-black tracking-widest outline-none focus:border-white/30" />
                            <div className="flex gap-3">
                                <input type="text" placeholder="MM/YY" maxLength={5} value={newCard.expiry} onChange={e => setNewCard({...newCard, expiry: e.target.value})} className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-white text-[10px] font-black tracking-widest outline-none" />
                                <input type="password" placeholder="CVV" maxLength={3} value={newCard.cvv} onChange={e => setNewCard({...newCard, cvv: e.target.value})} className="w-20 bg-black border border-white/10 rounded-xl p-3 text-white text-[10px] font-black tracking-widest outline-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setIsAddingCard(false)} className="flex-1 py-3 text-[9px] font-black uppercase text-zinc-500">Cancel</button>
                            <button onClick={handleAddCard} className="flex-1 py-3 bg-white text-black text-[9px] font-black uppercase rounded-xl">Secure Data</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAddingCard(true)} className="w-full py-5 border border-dashed border-white/10 rounded-3xl flex items-center justify-center gap-3 text-zinc-500 hover:text-white transition-all group">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">Add Secure Method</span>
                    </button>
                )}
            </div>
        </section>

        {/* PREFERENCE BLUEPRINT */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-100/30 border-b border-white/5 pb-2">Palate Blueprint</h3>
            <div className="bg-zinc-900 border border-white/5 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="space-y-2">
                    <p className="text-[13px] text-zinc-200 font-serif italic leading-relaxed">
                        "{editedProfile.palateSummary || "Your profile is optimizing based on your interactions."}"
                    </p>
                </div>
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em] block">Hero Ingredients</span>
                    <div className="flex flex-wrap gap-2">
                      {editedProfile.heroIngredients.map(ing => (
                        <span key={ing} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] text-zinc-300 font-medium">{ing}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em] block">Taste Dislikes</span>
                    <div className="flex flex-wrap gap-2">
                      {editedProfile.dislikes.map(d => (
                        <span key={d} className="px-3 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-full text-[9px] text-rose-400 font-medium">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
        </section>

        {/* SAVED CREATIONS */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-100/30 border-b border-white/5 pb-2">Bookmarked Creations</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                {likedDishes.length === 0 ? (
                  <div className="w-full py-10 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">No dishes saved yet</p>
                  </div>
                ) : likedDishes.map(dish => (
                    <div key={dish.id} className="min-w-[150px] max-w-[150px] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl group">
                        <div className="aspect-[4/5] relative">
                            <img src={dish.venueImage} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt={dish.item} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                            <div className="absolute bottom-3 left-3 right-3"><p className="text-[11px] text-white font-serif italic truncate">{dish.item}</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* RESTAURANT PORTAL (STAFF) ENTRY */}
        <section className="pt-10 border-t border-white/5">
            <div className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-2">
               <button 
                  onClick={() => setShowPortal(!showPortal)}
                  className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-zinc-900/50 hover:bg-zinc-900 transition-all group active:scale-[0.98]"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-colors shadow-inner">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                     </div>
                     <div className="text-left">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:text-white transition-colors">Restaurant Portal (Staff)</h4>
                        <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black mt-1">Management & Reservation Logic</p>
                     </div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-zinc-700 transition-transform duration-500 ${showPortal ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
               </button>
            </div>
        </section>

        {/* RESET ACTION */}
        <section className="pt-12 text-center">
            <button 
                onClick={() => { if(confirm("Reset profile?")) { localStorage.clear(); window.location.reload(); } }}
                className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-700 hover:text-white transition-all active:scale-95"
            >
                Terminate Profile Session
            </button>
        </section>
      </div>

      <div className="p-6 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 shrink-0 z-10">
          <button onClick={() => onSave(editedProfile)} className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all">
              Save & Apply Neural Settings
          </button>
      </div>

      {showPortal && (
        <div className="fixed inset-0 z-[1000] bg-black animate-in fade-in duration-300">
           <RestaurantPortal venues={venues} menuItems={allDishes} onClose={() => setShowPortal(false)} />
        </div>
      )}
    </div>
  );
};

export default ProfileView;
