"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Brain, Lightbulb, LogOut } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ThemeToggle from '../../../components/ThemeToggle';

export default function DrillPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
    };
    init();
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/island-bg.png')" }} />
      <div className="fixed inset-0 z-1 bg-overlay transition-colors duration-300" />

      {/* Global Navigation Bar */}
      <nav className="relative z-50 border-b bg-background/60 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => router.back()} className="p-1 sm:p-2 hover:bg-slate-200/20 rounded-full transition-colors text-slate-500">
              <ChevronLeft size={20} className="sm:w-[24px] sm:h-[24px]" />
          </button>
          <div className="h-6 sm:h-8 w-px bg-slate-200/50 dark:bg-slate-800/50 mx-1 sm:mx-2" />
          <Link href="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg text-white shadow-lg"><Brain size={20} className="sm:w-[22px] sm:h-[22px]"/></div>
              <span className="font-black uppercase tracking-tighter text-sm sm:text-base hidden sm:inline-block">Skealed</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/ideas" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-widest"><Lightbulb size={14} /> Suggest Skill</Link>
            <ThemeToggle />
            {user ? (
                <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-rose-500 transition-colors p-1"><LogOut size={18} className="sm:w-[20px] sm:h-[20px]"/></button>
            ) : <Link href="/login" className="text-xs sm:text-sm font-bold opacity-70 hover:opacity-100 whitespace-nowrap">SIGN IN</Link>}
            <Link href="/vault" className="bg-indigo-600 text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-lg active:scale-95 transition-all whitespace-nowrap">Dashboard</Link>
        </div>
      </nav>

      {/* The Drill iframe */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
          <iframe 
            src={`/apps/${slug}.html`} 
            className="w-full h-full border-0 bg-transparent"
            title={`${slug} interactive drill`}
            allowFullScreen
          />
        </div>
      </main>
    </div>
  );
}