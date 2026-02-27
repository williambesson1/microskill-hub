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
  Bookmark,
  Lightbulb,
  LogOut,
  Users,
  Activity,
  Target,
  PieChart
} from 'lucide-react';
import { supabase } from '../../../lib/supabase'; 


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
  
  const [isProcessing, setIsProcessing] = useState<{[key: number]: boolean}>({});

// The Decoder Ring for our URLs
const rawSlug = slug?.toString() || "";
  
const CATEGORY_MAP: Record<string, string> = {
  'clear-thinking-logic': 'Clear Thinking & Logic',
  'people-communication': 'People & Communication',
  'digital-survival-media': 'Digital Survival & Media',
  'mind-resilience': 'Mind & Resilience',
  'time-action': 'Time & Action',
  'real-world-math-money': 'Real-World Math & Money',
};

// Check the map first. If it's a new custom category without an "&", fall back to the normal dash-replacement.
const categoryTitle = CATEGORY_MAP[rawSlug] || rawSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const fetchData = async (currentUser: any) => {
    setLoading(true);
    const { data: skillsData } = await supabase
      .from('skills')
      .select('*')
      .ilike('category', categoryTitle) 
      .order('votes', { ascending: false });
    
    setSkills(skillsData || []);

    if (currentUser) {
      const { data: votesData } = await supabase.from('user_votes').select('skill_id, vote_type').eq('user_id', currentUser.id);
      const voteMap = (votesData || []).reduce((acc: any, v: any) => ({ ...acc, [v.skill_id]: v.vote_type === 1 ? 'up' : 'down' }), {});
      setUserVotes(voteMap);

      const { data: favData } = await supabase.from('user_favorites').select('skill_id').eq('user_id', currentUser.id);
      setUserFavorites(favData?.map((f: any) => f.skill_id) || []);
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
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      fetchData(newUser);
    });
    
    return () => authListener.subscription.unsubscribe();
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
    
    if (isProcessing[skillId]) return;
    setIsProcessing(prev => ({ ...prev, [skillId]: true }));

    const currentVote = userVotes[skillId];
    const voteValue = type === 'up' ? 1 : -1;

    try {
      if (currentVote === type) {
        setUserVotes(prev => ({ ...prev, [skillId]: null })); 
        await supabase.from('user_votes').delete().eq('user_id', user.id).eq('skill_id', skillId);
        await supabase.rpc(type === 'up' ? 'decrement_votes' : 'increment_votes', { row_id: skillId });
      } else {
        setUserVotes(prev => ({ ...prev, [skillId]: type })); 
        
        const { error } = await supabase.from('user_votes').upsert({ 
          user_id: user.id, 
          skill_id: skillId, 
          vote_type: voteValue 
        }, { onConflict: 'user_id,skill_id' }); 

        if (error) throw error;

        if (!currentVote) {
          await supabase.rpc(type === 'up' ? 'increment_votes' : 'decrement_votes', { row_id: skillId });
        } else {
          await supabase.rpc(type === 'up' ? 'increment_votes' : 'decrement_votes', { row_id: skillId });
          await supabase.rpc(type === 'up' ? 'increment_votes' : 'decrement_votes', { row_id: skillId });
        }
      }
      fetchData(user);
    } catch (err: any) {
      console.error("Voting error:", err.message || err);
      setUserVotes(prev => ({ ...prev, [skillId]: currentVote }));
    } finally {
      setIsProcessing(prev => ({ ...prev, [skillId]: false }));
    }
  };

  const handleToggleHeart = async (e: React.MouseEvent, skillId: number) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Please sign in!"); return; }
    
    if (isProcessing[skillId]) return;
    setIsProcessing(prev => ({ ...prev, [skillId]: true }));

    const isFav = userFavorites.includes(skillId);
    try {
      if (isFav) {
        setUserFavorites(prev => prev.filter(id => id !== skillId));
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('skill_id', skillId);
      } else {
        setUserFavorites(prev => [...prev, skillId]);
        await supabase.from('user_favorites').insert({ user_id: user.id, skill_id: skillId });
      }
      fetchData(user); 
    } catch (err) {
      console.error(err);
      fetchData(user); 
    } finally {
      setIsProcessing(prev => ({ ...prev, [skillId]: false }));
    }
  };

  const handleShare = async (e: React.MouseEvent, skill: any) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/drills/${skill.slug}`;
    if (navigator.share) await navigator.share({ title: skill.title, url });
    else { await navigator.clipboard.writeText(url); alert("Copied!"); }
  };

  // UPDATED CATEGORY ICONS
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

      <div className="relative z-10 text-foreground transition-colors duration-300">
        
        {/* UNIFIED GLOBAL NAVIGATION BAR */}
        <nav className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl px-2 sm:px-6 h-16 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
                onClick={() => router.push('/')} 
                className="p-1 sm:p-2 hover:bg-slate-200/20 rounded-full transition-colors text-slate-500"
            >
                <ChevronLeft size={20} className="sm:w-[24px] sm:h-[24px]" />
            </button>
            <div className="h-6 sm:h-8 w-px bg-slate-200/50 dark:bg-slate-800/50 mx-1 sm:mx-2" />
            <Link href="/" className="flex items-center gap-2">
                
                {/* THE NEW SKILL PRISM LOGO */}
                <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 shadow-lg rounded-lg bg-white flex items-center justify-center p-1.5 border border-slate-200/50">
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
                {/* Forced text-slate-900 so the text never turns white on mobile */}
                <span className="font-black uppercase tracking-tighter text-sm sm:text-base hidden sm:inline-block text-slate-900">Skealed</span>
            </Link>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/ideas" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-widest">
             <Lightbulb size={14} /> Suggest Skill
             </Link>
              {user ? (
                  <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-rose-500 transition-colors p-1"><LogOut size={18} className="sm:w-[20px] sm:h-[20px]"/></button>
              ) : <Link href="/login" className="text-xs sm:text-sm font-bold opacity-70 hover:opacity-100 whitespace-nowrap">SIGN IN</Link>}
              <Link href="/vault" className="bg-indigo-600 text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-lg active:scale-95 transition-all whitespace-nowrap">Dashboard</Link>
          </div>
        </nav>

        <header className="pt-8 pb-10 sm:py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-6 sm:mb-10 tracking-tighter capitalize leading-tight">{categoryTitle}</h1>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder={`Search in ${categoryTitle}...`}
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                />
              </div>

              {/* SORT AREA - Light on mobile, adaptable on desktop */}
              <div className="flex w-full sm:w-auto bg-slate-100 sm:bg-white/80 dark:bg-slate-100 sm:dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-xl backdrop-blur-md border border-slate-200 sm:dark:border-slate-700 shadow-sm overflow-x-auto scrollbar-hide">
                {[
                    { id: 'top', icon: <Trophy size={14} className="sm:w-4 sm:h-4"/>, label: 'Top' },
                    { id: 'new', icon: <Clock size={14} className="sm:w-4 sm:h-4"/>, label: 'New' },
                    { id: 'saved', icon: <Bookmark size={14} className="sm:w-4 sm:h-4"/>, label: 'Saved' }
                ].map((btn) => (
                    <button
                        key={btn.id}
                        onClick={() => setSortType(btn.id as SortType)}
                        className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                            sortType === btn.id 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-slate-500 dark:text-slate-500 sm:dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-800 sm:dark:hover:text-slate-200 hover:bg-black/5'
                        }`}
                    >
                        {btn.icon} {btn.label}
                    </button>
                ))}
              </div>
          </div>
        </header>

        {/* 4-Column Responsive Grid */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 pt-0">
          {loading ? (
            <div className="text-center py-20 font-black text-slate-400 text-3xl animate-pulse uppercase">Loading Skills...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredSkills.length > 0 ? filteredSkills.map((skill: any) => {
                const voteType = userVotes[skill.id];
                const isFav = userFavorites.includes(skill.id);
                const isCardLoading = isProcessing[skill.id];
                
                // NEW CARD TOP LINE LOGIC (Red overrides Green overrides Purple)
                const lineClass = isFav ? 'bg-rose-500' : voteType === 'up' ? 'bg-emerald-500' : 'bg-indigo-600/30';

                return (
                  <Link 
                    key={skill.id} 
                    href={`/drills/${skill.slug}`}
                    className="bg-card backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col"
                  >
                    <div className={`h-1 w-full shrink-0 ${lineClass}`}></div>
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-9 w-9 bg-indigo-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-indigo-600">
                            {getIcon(skill.category)}
                        </div>
                        <button onClick={(e) => handleShare(e, skill)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Share2 size={16} /></button>
                      </div>

                      <h3 className="text-base font-bold mb-6 leading-tight h-[60px] line-clamp-3">{skill.title}</h3>
                      
                      <div className="mt-auto pt-4 border-t border-slate-200/30 flex items-center justify-between">
                        
                        {/* VOTE AREA - Forced Light Background */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200 shadow-inner">
                          <button 
                            disabled={isCardLoading} 
                            onClick={(e) => handleVote(e, skill.id, 'up')} 
                            className={`p-1 rounded-full transition-all ${voteType === 'up' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-500'}`}
                          >
                            <ArrowUp size={14} strokeWidth={3}/>
                          </button>
                          
                          <span className={`px-1 text-xs font-black ${voteType === 'up' ? 'text-emerald-600' : voteType === 'down' ? 'text-rose-600' : 'text-slate-600'}`}>
                            {skill.votes}
                          </span>
                          
                          <button 
                            disabled={isCardLoading} 
                            onClick={(e) => handleVote(e, skill.id, 'down')} 
                            className={`p-1 rounded-full transition-all ${voteType === 'down' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-rose-500'}`}
                          >
                            <ArrowDown size={14} strokeWidth={3}/>
                          </button>
                        </div>

                        {/* HEART BUTTON */}
                        <button 
                          disabled={isCardLoading} 
                          onClick={(e) => handleToggleHeart(e, skill.id)} 
                          className={`p-1.5 rounded-full transition-all ${isFav ? 'text-rose-500 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-rose-500'}`}
                        >
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