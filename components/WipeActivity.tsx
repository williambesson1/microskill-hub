"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';

export default function WipeActivity() {
  return (
    <section className="mb-10 relative">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-red-600 mb-6">Danger Zone</h2>
      
      <div className="bg-card backdrop-blur-xl border border-red-200/50 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center">
        {/* A subtle red gradient layer */}
        <div className="absolute inset-0 z-0 bg-red-100/30 dark:bg-red-950/30" />
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-red-600"><Trash2 size={24}/></div>
            <h3 className="text-xl font-black uppercase tracking-widest text-red-600">Wipe My Activity</h3>
          </div>
          <p className="text-sm text-center text-slate-500 mb-8 leading-relaxed">
            Clears your upvotes and favorites without deleting your account. This action cannot be undone.
          </p>
          
          {/* THE UPDATED BUTTON FOR LEGIBILITY */}
          <button className="w-full py-4 rounded-2xl bg-white text-red-600 font-bold text-xs uppercase shadow-md border border-slate-200 hover:bg-slate-100 transition-all active:scale-95">
            Clear All Data
          </button>
        </div>
      </div>
    </section>
  );
}