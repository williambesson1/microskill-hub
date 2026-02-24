"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, LogOut, Shield, GraduationCap, Brain, 
  Zap, Heart, ArrowUp, User, Camera, Trash2, Search, 
  X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { supabase } from '../../lib/supabase'; 
import ThemeToggle from '../../components/ThemeToggle';

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
      case 'security': return <Shield size={18} />;
      case 'grammar': return <GraduationCap size={18} />;
      case 'ai literacy': return <Brain size={18} />;
      default: return <Zap size={18} />;
    }
  };

  return (
    <div className="min-h-screen font-sans relative">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/island-bg.png')" }} />
      <div className="fixed inset-0 z-1 bg-overlay transition-colors duration-300" />

      <div className="relative z-10 text-foreground">
        <nav className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl px-6 h-16 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50">
          <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600"><ArrowLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest">Back</span></Link>
          <div className="flex items-center gap-4"><ThemeToggle /><button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><LogOut size={20}/></button></div>
        </nav>

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
              <div className="flex items-center gap-2">
                <button onClick={() => scroll(favRef, 'left')} className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"><ChevronLeft size={20} className="text-indigo-600" /></button>
                <button onClick={() => scroll(favRef, 'right')} className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"><ChevronRight size={20} className="text-indigo-600" /></button>
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
              <div className="flex items-center gap-2">
                <button onClick={() => scroll(voteRef, 'left')} className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"><ChevronLeft size={20} className="text-indigo-600" /></button>
                <button onClick={() => scroll(voteRef, 'right')} className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"><ChevronRight size={20} className="text-indigo-600" /></button>
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
          <section className="pt-12 border-t border-slate-200/30">
            <h3 className="text-1xl font-black uppercase tracking-widest text-rose-500/60 mb-8 font-mono">Danger Zone</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-rose-500/5 backdrop-blur-sm rounded-3xl p-6 border border-rose-500/20 flex flex-col justify-between items-start gap-4">
                <div><h4 className="font-bold text-rose-600 flex items-center gap-2"><Trash2 size={16}/> Wipe My Activity</h4><p className="text-xs text-slate-500 mt-1">Clears upvotes/favorites without deleting account.</p></div>
                <button onClick={handleWipeData} className="w-full py-3 rounded-2xl bg-white/50 hover:bg-rose-100 text-rose-600 font-bold text-xs uppercase tracking-tighter transition-all">Clear All Data</button>
              </div>
              <div className="bg-slate-900/5 backdrop-blur-sm rounded-3xl p-6 border border-slate-900/10 flex flex-col justify-between items-start gap-4">
                <div><h4 className="font-bold text-slate-800">Delete Account Permanently</h4><p className="text-xs text-slate-500 mt-1">Permanently remove email and all progress.</p></div>
                <button onClick={handleDeleteAccount} className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-tighter transition-all shadow-lg shadow-rose-500/20">Delete Forever</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}