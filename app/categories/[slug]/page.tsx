"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowUp, 
  ArrowDown, 
  Share2, 
  Heart, 
  Brain, 
  Shield, 
  GraduationCap, 
  Zap, 
  Search, 
  ChevronLeft, 
  Trophy, 
  Clock, 
  Bookmark 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase'; 
import ThemeToggle from '../../../components/ThemeToggle'; 

type SortType = 'top' | 'new' | 'saved';

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [skills, setSkills] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<{[key: number]: 'up' | 'down' | null}>({});
  const [userFavorites, setUserFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>('top');

  // FIX: Ensuring categoryTitle is always a string to remove the red line
  const categoryTitle = (slug?.toString() || "")
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const fetchData = async (currentUser: any) => {
    setLoading(true);
    const { data: skillsData } = await supabase
      .from('skills')
      .select('*')
      .ilike('category', categoryTitle) // Filter strictly by this category
      .order('votes', { ascending: false });
    
    setSkills(skillsData || []);

    if (currentUser) {
      const { data: votesData } = await supabase.from('user_votes').select('skill_id, vote_type').eq('user_id', currentUser.id);
      const voteMap = (votesData || []).reduce((acc, v) => ({ ...acc, [v.skill_id]: v.vote_type }), {});
      setUserVotes(voteMap);

      const { data: favData } = await supabase.from('user_favorites').select('skill_id').eq('user_id', currentUser.id);
      setUserFavorites(favData?.map(f => f.skill_id) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
      fetchData(activeUser);
    };
    init();
  }, [slug]);

  const filteredSkills = skills
    .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(s => sortType === 'saved' ? userFavorites.includes(s.id) : true)
    .sort((a, b) => {
      if (sortType === 'new') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return b.votes - a.votes;
    });

  const handleVote = async (e: React.MouseEvent, skillId: number, type: 'up' | 'down') => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Please sign in to vote!"); return; }
    const currentVote = userVotes[skillId];
    
    if (currentVote === type) {
      await supabase.from('user_votes').delete().eq('user_id', user.id).eq('skill_id', skillId);
      await supabase.rpc(type === 'up' ? 'decrement_votes' : 'increment_votes', { row_id: skillId });
    } else {
      await supabase.from('user_votes').upsert({ user_id: user.id, skill_id: skillId, vote_type: type });
      await supabase.rpc(type === 'up' ? 'increment_votes' : 'decrement_votes', { row_id: skillId });
      if (currentVote) await supabase.rpc(type === 'up' ? 'increment_votes' : 'decrement_votes', { row_id: skillId });
    }
    fetchData(user);
  };

  const handleShare = async (e: React.MouseEvent, skill: any) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/drills/${skill.slug}`;
    if (navigator.share) await navigator.share({ title: skill.title, url });
    else { await navigator.clipboard.writeText(url); alert("Copied!"); }
  };

  const handleToggleHeart = async (e: React.MouseEvent, skillId: number) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Please sign in!"); return; }
    const isFav = userFavorites.includes(skillId);
    if (isFav) await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('skill_id', skillId);
    else await supabase.from('user_favorites').insert({ user_id: user.id, skill_id: skillId });
    fetchData(user); 
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
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/island-bg.png')" }} />
      <div className="fixed inset-0 z-1 bg-overlay transition-colors duration-300" />

      <div className="relative z-10 text-foreground transition-colors duration-300">
        {/* Navbar with Back Button */}
        <nav className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl px-6 h-16 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => router.push('/')} 
                className="p-2 hover:bg-slate-200/20 rounded-full transition-colors text-slate-500"
            >
                <ChevronLeft size={24} />
            </button>
            <div className="h-8 w-px bg-slate-200/50 dark:bg-slate-800/50 mx-2" />
            <span className="font-black uppercase tracking-tighter text-sm sm:text-base">{categoryTitle}</span>
          </div>
          <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/vault" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg">MY VAULT</Link>
          </div>
        </nav>

        {/* Category Header Controls */}
        <header className="py-16 text-center">
          <h1 className="text-5xl font-black mb-10 tracking-tighter">{categoryTitle} Paradise</h1>
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder={`Search in ${categoryTitle}...`}
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex bg-slate-200/20 dark:bg-slate-800/40 p-1 rounded-lg backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30">
                {[
                    { id: 'top', icon: <Trophy size={12}/>, label: 'Top' },
                    { id: 'new', icon: <Clock size={12}/>, label: 'New' },
                    { id: 'saved', icon: <Bookmark size={12}/>, label: 'Saved' }
                ].map((btn) => (
                    <button
                        key={btn.id}
                        onClick={() => setSortType(btn.id as SortType)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[10px] font-bold transition-all ${
                            sortType === btn.id 
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {btn.icon} {btn.label}
                    </button>
                ))}
              </div>
          </div>
        </header>

        {/* 4-Column Responsive Grid */}
        <main className="max-w-7xl mx-auto p-6 md:p-12">
          {loading ? (
            <div className="text-center py-20 font-black text-slate-400 text-3xl animate-pulse uppercase">Mapping the Niche...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredSkills.length > 0 ? filteredSkills.map((skill: any) => {
                const voteType = userVotes[skill.id];
                const isFav = userFavorites.includes(skill.id);
                return (
                  <Link 
                    key={skill.id} 
                    href={`/drills/${skill.slug}`}
                    className="bg-card backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                  >
                    <div className={`h-1.5 w-full ${voteType === 'up' ? 'bg-emerald-500' : voteType === 'down' ? 'bg-rose-500' : 'bg-indigo-600/20'}`}></div>
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-9 w-9 bg-indigo-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-indigo-600">
                            {getIcon(skill.category)}
                        </div>
                        <button onClick={(e) => handleShare(e, skill)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Share2 size={16} /></button>
                      </div>

                      <h3 className="text-lg font-bold mb-8 leading-tight line-clamp-2 h-[56px]">{skill.title}</h3>
                      
                      <div className="mt-auto pt-4 border-t border-slate-200/30 flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-full">
                          <button onClick={(e) => handleVote(e, skill.id, 'up')} className={`p-1 rounded-full transition-all ${voteType === 'up' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-emerald-500'}`}><ArrowUp size={14} strokeWidth={3}/></button>
                          <span className={`px-1 text-[10px] font-black ${voteType === 'up' ? 'text-emerald-600' : voteType === 'down' ? 'text-rose-600' : 'text-slate-500'}`}>{skill.votes}</span>
                          <button onClick={(e) => handleVote(e, skill.id, 'down')} className={`p-1 rounded-full transition-all ${voteType === 'down' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500'}`}><ArrowDown size={14} strokeWidth={3}/></button>
                        </div>
                        <button onClick={(e) => handleToggleHeart(e, skill.id)} className={`p-1.5 rounded-full transition-all ${isFav ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'}`}>
                          <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <div className="col-span-full flex flex-col items-center justify-center py-24 opacity-30">
                    <Zap size={48} className="mb-4 animate-bounce" />
                    <p className="text-sm font-black uppercase tracking-widest text-center">No Skills Found in this Paradise</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}