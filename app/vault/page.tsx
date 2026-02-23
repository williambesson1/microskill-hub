"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, LogOut, Shield, GraduationCap, Brain, Zap, Heart, ArrowUp, User } from 'lucide-react';
import { supabase } from '../../lib/supabase'; 
import ThemeToggle from '../../components/ThemeToggle';

export default function VaultPage() {
  const [user, setUser] = useState<any>(null);
  const [upvotedSkills, setUpvotedSkills] = useState<any[]>([]);
  const [heartedSkills, setHeartedSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getAccountData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      window.location.href = "/login"; 
      return; 
    }
    setUser(user);

    // 1. Fetch Upvoted IDs
    const { data: votes } = await supabase.from('user_votes').select('skill_id').eq('user_id', user.id);
    
    // 2. Fetch Hearted IDs
    const { data: hearts } = await supabase.from('user_favorites').select('skill_id').eq('user_id', user.id);

    // 3. Get the actual skill data for both
    const allIds = Array.from(new Set([...(votes?.map(v => v.skill_id) || []), ...(hearts?.map(h => h.skill_id) || [])]));
    
    if (allIds.length > 0) {
      const { data: allSkills } = await supabase.from('skills').select('*').in('id', allIds);
      
      setUpvotedSkills(allSkills?.filter(s => votes?.some(v => v.skill_id === s.id)) || []);
      setHeartedSkills(allSkills?.filter(s => hearts?.some(h => h.skill_id === s.id)) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    getAccountData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleWipeData = async () => {
    const confirm = window.confirm("Are you sure? This will remove all your upvotes and favorites. This cannot be undone.");
    if (confirm && user) {
      await supabase.from('user_votes').delete().eq('user_id', user.id);
      await supabase.from('user_favorites').delete().eq('user_id', user.id);
      setUpvotedSkills([]);
      setHeartedSkills([]);
      alert("Your activity has been cleared.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "DANGER: This will permanently delete your account and all saved progress. This cannot be undone. Proceed?"
    );

    if (confirmed) {
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        alert("Error deleting account: " + error.message);
      } else {
        await supabase.auth.signOut();
        window.location.href = "/";
      }
    }
  };

  const getIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'security': return <Shield />;
      case 'grammar': return <GraduationCap />;
      case 'ai literacy': return <Brain />;
      default: return <Zap />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Nav */}
      <nav className="border-b bg-white p-6 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={20} /> BACK TO HUB
          </Link>
          <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800">The Vault</h1>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-rose-500 transition-colors">
            <LogOut size={20}/>
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Profile Info Section */}
        <section className="mb-12 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <User size={40} />
          </div>
          <div className="text-center md:text-left flex-grow">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{user?.email?.split('@')[0]}</h2>
            <p className="text-slate-500 font-medium">{user?.email}</p>
          </div>
        </section>

        {/* Favorites Section (Hearts) */}
        <section className="mb-16">
          <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-6 flex items-center gap-2">
            <Heart size={14} fill="currentColor"/> Favorites for Later
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-hide">
            {heartedSkills.length > 0 ? heartedSkills.map(skill => (
                <Link key={skill.id} href={`/drills/${skill.slug}`} className="min-w-[280px] bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all snap-start group">
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 mb-4 transition-colors">
                    {getIcon(skill.category)}
                  </div>
                  <h4 className="font-bold text-slate-800 leading-snug">{skill.title}</h4>
                </Link>
            )) : (
              <div className="w-full bg-slate-100 rounded-2xl py-10 text-center border-2 border-dashed border-slate-200 text-slate-400 italic font-medium">
                No hearted items yet.
              </div>
            )}
          </div>
        </section>

        {/* Mastered Section (Upvotes) */}
        <section className="mb-20">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
            <ArrowUp size={14}/> Mastered & Upvoted
          </h3>
          {upvotedSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upvotedSkills.map(skill => (
                <Link key={skill.id} href={`/drills/${skill.slug}`} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors group">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 group-hover:text-emerald-500 flex items-center justify-center shrink-0">
                    {getIcon(skill.category)}
                  </div>
                  <div className="flex-grow font-bold text-slate-800">{skill.title}</div>
                  <ArrowUp size={18} className="text-emerald-500" />
                </Link>
              ))}
            </div>
          ) : (
             <div className="bg-slate-100 rounded-2xl py-10 text-center border-2 border-dashed border-slate-200 text-slate-400 italic font-medium">
                Go upvote some skills to see them here!
             </div>
          )}
        </section>

        {/* Danger Zone Section */}
        <section className="pt-12 border-t border-slate-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-8 font-mono">Danger Zone</h3>
          <div className="space-y-4">
            
            {/* Wipe Data Card */}
            <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-rose-900">Wipe My Activity</h4>
                <p className="text-sm text-rose-700 opacity-80">Clear all your saved favorites and upvotes without deleting your account.</p>
              </div>
              <button 
                onClick={handleWipeData}
                className="whitespace-nowrap px-6 py-3 rounded-2xl bg-white text-rose-600 font-bold shadow-sm hover:bg-rose-100 transition-all text-sm uppercase tracking-tighter"
              >
                Clear All Data
              </button>
            </div>

            {/* Permanent Delete Card */}
            <div className="bg-white rounded-3xl p-6 border border-rose-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-slate-800">Delete Account Permanently</h4>
                <p className="text-sm text-slate-500">Completely remove your login email and progress from our platform.</p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="whitespace-nowrap px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold shadow-lg hover:bg-rose-700 transition-all active:scale-95 text-sm uppercase tracking-tighter"
              >
                Delete Forever
              </button>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}