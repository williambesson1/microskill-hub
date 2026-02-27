"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, LogOut, Shield, GraduationCap, Brain, 
  Zap, Heart, ArrowUp, User, Camera, Trash2, Search, 
  X, ChevronLeft, ChevronRight, Lightbulb,
  Users, Activity, Target, PieChart
} from 'lucide-react';
import { supabase } from '../../lib/supabase'; 


export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [upvotedSkills, setUpvotedSkills] = useState<any[]>([]);
  const [heartedSkills, setHeartedSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const favRef = useRef<HTMLDivElement | null>(null);
  const voteRef = useRef<HTMLDivElement | null>(null);

  const getAccountData = async () => {
    const { data: { user: activeUser } } = await supabase.auth.getUser();
    if (!activeUser) { window.location.href = "/login"; return; }
    setUser(activeUser);

    const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', activeUser.id).single();
    if (profile) setAvatarUrl(profile.avatar_url);

    // FIX: Only fetch rows where the user explicitly upvoted (vote_type = 1)
    const { data: votes } = await supabase
      .from('user_votes')
      .select('skill_id')
      .eq('user_id', activeUser.id)
      .eq('vote_type', 1); 

    const { data: hearts } = await supabase.from('user_favorites').select('skill_id').eq('user_id', activeUser.id);

    const allIds = Array.from(new Set([...(votes?.map(v => v.skill_id) || []), ...(hearts?.map(h => h.skill_id) || [])]));
    if (allIds.length > 0) {
      const { data: allSkills } = await supabase.from('skills').select('*').in('id', allIds);
      setUpvotedSkills(allSkills?.filter(s => votes?.some(v => v.skill_id === s.id)) || []);
      setHeartedSkills(allSkills?.filter(s => hearts?.some(h => h.skill_id === s.id)) || []);
    }
    setLoading(false);
  };

  useEffect(() => { getAccountData(); }, []);

  const filteredHearts = heartedSkills.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredVotes = upvotedSkills.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, skillId: number) => {
    e.preventDefault(); e.stopPropagation();
    const { error } = await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('skill_id', skillId);
    if (!error) setHeartedSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: data.publicUrl });
      setAvatarUrl(data.publicUrl);
    } catch (error: any) { alert(error.message); } finally { setUploading(false); }
  };

  const handleWipeData = async () => {
    const confirm = window.confirm("Clear all activity?");
    if (confirm && user) {
      await supabase.from('user_votes').delete().eq('user_id', user.id);
      await supabase.from('user_favorites').delete().eq('user_id', user.id);
      setUpvotedSkills([]); setHeartedSkills([]);
      alert("Activity cleared.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("PERMANENTLY delete your account?");
    if (confirmed) {
      const { error } = await supabase.rpc('delete_user');
      if (error) alert(error.message);
      else { await supabase.auth.signOut(); window.location.href = "/"; }
    }
  };

  const getIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'clear thinking & logic': return <Brain size={18} />;
      case 'people & communication': return <Users size={18} />;
      case 'digital survival & media': return <Shield size={18} />;
      case 'mind & resilience': return <Activity size={18} />;
      case 'time & action': return <Target size={18} />;
      case 'real-world math & money': return <PieChart size={18} />;
      default: return <Zap size={18} />;
    }
  };

  return (
    <div className="min-h-screen font-sans relative">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/island-bg.png')" }} />
      <div className="fixed inset-0 z-1 bg-overlay transition-colors duration-300" />

      <div className="relative z-10 text-foreground">
        
        {/* === UNIFIED GLOBAL NAVIGATION BAR === */}
        <nav className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1 sm:gap-2">
            <Link 
                href="/" 
                className="p-1 sm:p-2 hover:bg-slate-200/20 rounded-full transition-colors text-slate-500"
            >
                <ChevronLeft size={20} className="sm:w-[24px] sm:h-[24px]" />
            </Link>
            <div className="h-6 sm:h-8 w-px bg-slate-200/50 dark:bg-slate-800/50 mx-1 sm:mx-2" />
            <Link href="/" className="flex items-center gap-2">
                
                {/* THE NEW SKILL PRISM LOGO */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 shadow-lg rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 border border-slate-200/50 dark:border-slate-700/50">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                    <defs>
                      <linearGradient id="indigoGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="roseGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                    <path d="M75 20 L25 20 L15 45 L50 45 Z" fill="url(#indigoGrad)" />
                    <path d="M50 45 L15 45 L25 80 L60 80 Z" fill="url(#roseGrad)" />
                    <path d="M85 55 L50 55 L60 80 L85 80 Z" fill="url(#emeraldGrad)" />
                    <path d="M25 20 L50 45 L75 20 Z" fill="white" fillOpacity="0.2" />
                    <path d="M15 45 L25 80 L50 45 Z" fill="black" fillOpacity="0.1" />
                  </svg>
                </div>

                <span className="font-black uppercase tracking-tighter text-sm sm:text-base hidden sm:inline-block">Skealed</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/ideas" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-widest">
             <Lightbulb size={14} /> Suggest Skill
             </Link>
              <button onClick={handleSignOut} className="text-slate-500 hover:text-rose-500 transition-colors p-1"><LogOut size={18} className="sm:w-[20px] sm:h-[20px]"/></button>
          </div>
        </nav>
        {/* ===================================== */}

        <main className="mx-auto max-w-5xl px-6 py-12">
          {/* Dashboard Header */}
          <section className="mb-8 bg-card backdrop-blur-lg rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="relative h-28 w-28 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : <User size={48} />}
              <label className="absolute bottom-0 right-0 bg-indigo-500 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-600 transition-all border-2 border-white dark:border-slate-800"><Camera size={16} /><input type="file" className="hidden" onChange={uploadAvatar} accept="image/*" disabled={uploading} /></label>
            </div>
            <div className="text-center md:text-left flex-grow"><h1 className="text-3xl font-black tracking-tighter mb-1 uppercase">My Dashboard</h1><p className="text-slate-500 font-medium opacity-80">{user?.email}</p></div>
          </section>

          {/* Search Bar */}
          <div className="relative mb-12">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search your saved skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 py-4 pl-14 pr-6 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all text-lg font-medium"
            />
          </div>

          {/* Favorites */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black tracking-tighter text-rose-500 flex items-center gap-3">Favorites <Heart size={24} fill="currentColor"/></h3>
              
              {/* UPDATED FAVORITE CAROUSEL ARROWS */}
              <div className="flex gap-2">
                <button 
                  onClick={() => scroll(favRef, 'left')} 
                  className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  <ChevronLeft size={18}/>
                </button>
                <button 
                  onClick={() => scroll(favRef, 'right')} 
                  className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  <ChevronRight size={18}/>
                </button>
              </div>
            </div>
            <div ref={favRef} className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-2">
              {filteredHearts.length > 0 ? filteredHearts.map(skill => (
                <div key={skill.id} className="relative min-w-[280px] snap-start">
                  <Link href={`/drills/${skill.slug}`} className="block bg-card backdrop-blur-md p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-lg transition-all h-full">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">{getIcon(skill.category)}</div>
                    <h4 className="text-lg font-bold leading-tight pr-8">{skill.title}</h4>
                  </Link>
                  <button onClick={(e) => handleRemoveFavorite(e, skill.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20"><X size={18} strokeWidth={3} /></button>
                </div>
              )) : <div className="w-full text-slate-400 font-bold uppercase tracking-widest text-xs py-10">No favorites found.</div>}
            </div>
          </section>

          {/* Upvoted */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black tracking-tighter text-emerald-500 flex items-center gap-3">Upvoted <ArrowUp size={24} strokeWidth={3}/></h3>
              
              {/* UPDATED UPVOTE CAROUSEL ARROWS */}
              <div className="flex gap-2">
                <button 
                  onClick={() => scroll(voteRef, 'left')} 
                  className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  <ChevronLeft size={18}/>
                </button>
                <button 
                  onClick={() => scroll(voteRef, 'right')} 
                  className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  <ChevronRight size={18}/>
                </button>
              </div>
            </div>
            <div ref={voteRef} className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-2">
              {filteredVotes.length > 0 ? filteredVotes.map(skill => (
                <Link key={skill.id} href={`/drills/${skill.slug}`} className="min-w-[280px] flex flex-col justify-between bg-card backdrop-blur-md p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-lg transition-all snap-start">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-emerald-500 flex items-center justify-center mb-6">{getIcon(skill.category)}</div>
                  <div className="flex items-center justify-between gap-4"><span className="font-bold text-sm leading-tight">{skill.title}</span><ArrowUp size={16} className="text-emerald-500 shrink-0" strokeWidth={3} /></div>
                </Link>
              )) : <div className="w-full text-slate-400 font-bold uppercase tracking-widest text-xs py-10">Nothing upvoted.</div>}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="pt-12 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
            <h3 className="text-sm font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-8 font-mono">Danger Zone</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Wipe Data Card */}
              <div className="bg-rose-50 dark:bg-rose-500/10 backdrop-blur-sm rounded-3xl p-6 border border-rose-200 dark:border-rose-500/20 flex flex-col justify-between items-start gap-4 transition-colors">
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <Trash2 size={18}/> Wipe My Activity
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    Clears your upvotes and favorites without deleting your account.
                  </p>
                </div>
                
                {/* UPDATED CLEAR DATA BUTTON */}
                <button 
                  onClick={handleWipeData} 
                  className="w-full py-4 rounded-2xl bg-white dark:bg-slate-100 text-red-600 font-black text-sm tracking-widest uppercase shadow-md border border-red-200 hover:bg-slate-50 transition-all active:scale-95 mt-4"
                >
                  Clear All Data
                </button>
              </div>
              
              {/* Delete Account Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between items-start gap-4 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    Delete Account Permanently
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    Permanently remove your email and all progress from the Hub.
                  </p>
                </div>
                <button onClick={handleDeleteAccount} className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20">
                  Delete Forever
                </button>
              </div>

            </div>
          </section>
        </main>
      </div>
    </div>
  );
}