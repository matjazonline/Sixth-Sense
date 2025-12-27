
import React, { useState, useRef, useMemo } from 'react';
import { Venue, MenuItem, PalateItem } from '../types';

interface DishUploadProps {
  venues: Venue[];
  menuItems: MenuItem[];
  onUpload: (item: PalateItem) => void;
  onCancel: () => void;
}

const DishUpload: React.FC<DishUploadProps> = ({ venues, menuItems, onUpload, onCancel }) => {
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [dishName, setDishName] = useState('');
  const [contentType, setContentType] = useState<'dish' | 'atmosphere' | 'menu'>('dish');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedVenues = useMemo(() => {
    return [...venues].sort((a, b) => a.name.localeCompare(b.name));
  }, [venues]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files) as File[];
      const newImages: string[] = [];
      
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === fileArray.length) {
            setPreviewImages(prev => contentType === 'menu' ? [...prev, ...newImages] : newImages);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedVenueId || previewImages.length === 0) return;
    if (contentType === 'dish' && !dishName.trim()) return;

    setIsUploading(true);
    
    setTimeout(() => {
      const venue = venues.find(v => v.id === selectedVenueId);
      const newItem: PalateItem = {
        id: `upload-${Date.now()}`,
        images: previewImages,
        description: contentType === 'dish' ? dishName.trim() : contentType === 'menu' ? `Full menu for ${venue?.name}` : `Live vibe at ${venue?.name}`,
        venue: venue?.name || "Unknown Venue",
        date: new Date().toISOString(),
        category: contentType
      };
      setIsUploading(false);
      onUpload(newItem);
    }, 1500);
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden select-none">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 backdrop-blur-2xl sticky top-0 z-50">
         <div className="space-y-1">
            <h2 className="text-2xl font-serif text-white tracking-tight italic leading-tight">Verify Vibe</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Member Sync</p>
         </div>
         <button onClick={onCancel} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 active:scale-90 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
         </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-hide">
        {/* Type Toggles */}
        <section className="space-y-4">
           <label className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-black ml-1">Contextual Alignment</label>
           <div className="grid grid-cols-3 bg-zinc-900/40 p-1.5 rounded-2xl border border-white/5 gap-1.5 shadow-inner">
               {['dish', 'atmosphere', 'menu'].map((type) => (
                   <button 
                       key={type}
                       onClick={() => { setContentType(type as any); setPreviewImages([]); }}
                       className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${contentType === type ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.2)] scale-105 z-10' : 'text-zinc-600 hover:text-zinc-400'}`}
                   >
                       {type}
                   </button>
               ))}
           </div>
        </section>

        {/* Venue Select */}
        <section className="space-y-4">
           <label className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-black ml-1">Establishment</label>
           <div className="relative group">
              <select 
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-5 text-white text-base font-serif outline-none focus:border-emerald-500/40 transition-all appearance-none shadow-xl"
              >
                <option value="">Select venue...</option>
                {sortedVenues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-zinc-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
           </div>
        </section>

        {/* Dish Name if relevant */}
        {contentType === 'dish' && selectedVenueId && (
            <section className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              <label className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-black ml-1">Identity of Dish</label>
              <input 
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g. Miso Glazed Black Cod"
                className="w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-5 text-white text-base font-serif outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-800 shadow-xl"
              />
            </section>
        )}

        {/* Photo Capture Area */}
        <section className="space-y-4">
          <label className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-black ml-1">Sensory Capture</label>
          
          {previewImages.length > 0 ? (
            <div className="space-y-4 animate-in zoom-in duration-300">
                <div className={`grid ${contentType === 'menu' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                    {previewImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-[2.5rem] overflow-hidden group border border-white/20 shadow-2xl">
                            <img src={img} className="w-full h-full object-cover" alt="" />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/70 backdrop-blur-md text-white rounded-full flex items-center justify-center text-sm active:scale-90 transition-all border border-white/10"
                            >
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    ))}
                    {contentType === 'menu' && previewImages.length < 8 && (
                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="aspect-square bg-zinc-900/40 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all group"
                        >
                           <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-white transition-colors">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14"/></svg>
                           </div>
                        </button>
                    )}
                </div>
            </div>
          ) : (
            <div className="relative">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-zinc-900/30 border-2 border-dashed border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center gap-8 cursor-pointer active:scale-[0.98] transition-all group shadow-2xl overflow-hidden relative"
              >
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  <div className="relative">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center border-2 border-white/10 transition-all duration-700 relative z-10 ${contentType === 'atmosphere' ? 'bg-rose-500/10 text-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.15)]' : contentType === 'menu' ? 'bg-amber-500/10 text-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.15)]' : 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.15)]'}`}>
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 w-28 h-28 rounded-full border border-white/5 animate-ping opacity-20"></div>
                  </div>

                  <div className="text-center px-10 space-y-2 relative z-10">
                     <p className="text-white text-base font-serif italic tracking-wide">Sync Visual Data</p>
                     <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] leading-relaxed font-bold">Calibration ensures peak curation accuracy.</p>
                  </div>
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" multiple={contentType === 'menu'} onChange={handleFileChange} />
        </section>
      </div>

      <div className="p-6 bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-10">
          <button 
              onClick={handleSubmit}
              disabled={isUploading || !selectedVenueId || previewImages.length === 0 || (contentType === 'dish' && !dishName.trim())}
              className={`w-full py-5 bg-white text-black font-black text-[12px] uppercase tracking-[0.4em] rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 ${isUploading || !selectedVenueId || previewImages.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-emerald-400'}`}
          >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Syncing Neural Net...</span>
                </>
              ) : 'Commit to Profile'}
          </button>
          <div className="mt-4 flex justify-center opacity-40">
             <span className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500">+10 Credits on Verification</span>
          </div>
      </div>
    </div>
  );
};

export default DishUpload;
