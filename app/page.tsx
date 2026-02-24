"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowUp, ArrowDown, Share2, Heart, Brain, Shield, 
  GraduationCap, Zap, Search, LogOut, ChevronRight, 
  ChevronLeft, Trophy, Clock, Bookmark, Lightbulb
} from 'lucide-react';
import { supabase } from '../lib/supabase'; 
import ThemeToggle from '../components/ThemeToggle'; 

type SortType = 'top' | 'new' | 'saved';

export default function Home() {
  const [skills, setSkills] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<{[key: number]: 'up' | 'down' | null}>({});
  const [userFavorites, setUserFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isProcessing, setIsProcessing] = useState<{[key: number]: boolean}>({});
  const [categorySort, setCategorySort] = useState<{[key: string]: SortType}>({});
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchData = async (currentUser: any) => {
    const { data: skillsData } = await supabase.from('skills').select('*').order('votes', { ascending: false });
    setSkills(skillsData || []);

    if (currentUser) {
      const { data: votesData } = await supabase.from('user_votes').select('skill_id, vote_type').eq('user_id', currentUser.id);
      const voteMap = (votesData || []).reduce((acc, v) => ({ ...acc, [v.skill_id]: v.vote_type === 1 ? 'up' : 'down' }), {});
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
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      fetchData(newUser);
    });
    
    return () => authListener.subscription.unsubscribe();
  }, []);

  const scroll = (category: string, direction: 'left' | 'right') => {
    const container = scrollRefs.current[category];
    if (container) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getProcessedSkills = (categoryName: string, categorySkills: any[]) => {
    const sortType = categorySort[categoryName] || 'top';
    let filtered = [...categorySkills];

    if (sortType === 'saved') {
      filtered = filtered.filter(s => userFavorites.includes(s.id));
    }

    return filtered.sort((a, b) => {
      if (sortType === 'new') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.votes - a.votes; // Default 'top'
    });
  };

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
    try {
      if (navigator.share) await navigator.share({ title: skill.title, url });
      else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
    } catch (err) { console.log(err); }
  };

  const categories = skills.reduce((acc: any, skill) => {
    const cat = skill.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'security': return 'bg-rose-500'; 
      case 'grammar': return 'bg-blue-500'; 
      case 'ai literacy': return 'bg-violet-500';
      default: return 'bg-amber-500';
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

      <div className="relative z-10 text-foreground transition-colors duration-300">
        <nav className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50">
          <Link href="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg text-white shadow-lg"><Brain size={20} className="sm:w-[22px] sm:h-[22px]"/></div>
              <span className="font-black uppercase tracking-tighter text-sm sm:text-base">Skealed</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/ideas" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-widest">
             <Lightbulb size={14} /> Suggest Skill
             </Link>
              <ThemeToggle />
              {user ? (
                  <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-rose-500 transition-colors p-1"><LogOut size={18} className="sm:w-[20px] sm:h-[20px]"/></button>
              ) : <Link href="/login" className="text-xs sm:text-sm font-bold opacity-70 hover:opacity-100 whitespace-nowrap">SIGN IN</Link>}
              <Link href="/vault" className="bg-indigo-600 text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-lg active:scale-95 transition-all whitespace-nowrap">Dashboard</Link>
          </div>
        </nav>

        <header className="pt-8 pb-10 sm:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tighter max-w-4xl mx-auto px-4 leading-tight">Learn what actually matters. Fast.</h1>
          <div className="relative max-w-lg mx-auto px-4 sm:px-6">
              <Search className="absolute left-8 sm:left-10 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                  type="text" 
                  placeholder="Search skills..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              />
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">
          {loading ? (
            <div className="text-center py-20 font-black text-slate-400 text-3xl animate-pulse uppercase">Loading Paradise...</div>
          ) : Object.keys(categories).map(category => {
            const currentSort = categorySort[category] || 'top';
            const allCategorySkills = categories[category].filter((s:any) => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
            const filtered = getProcessedSkills(category, allCategorySkills);
            
            if (allCategorySkills.length === 0) return null;

            return (
              <section key={category} className="mb-12 sm:mb-16 last:mb-0 relative group">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 px-1 gap-3 sm:gap-4">
                    <Link 
                        href={`/categories/${category.toLowerCase().replace(/\s+/g, '-')}`} 
                        className="group/title inline-flex items-center gap-2"
                    >
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 group-hover/title:text-indigo-500 transition-colors">
                            {category}
                        </h2>
                        <ChevronRight size={14} className="text-indigo-500 group-hover/title:translate-x-1 transition-transform"/>
                    </Link>
                    
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex w-full sm:w-auto bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'top', icon: <Trophy size={12}/>, label: 'Top' },
                                { id: 'new', icon: <Clock size={12}/>, label: 'New' },
                                { id: 'saved', icon: <Bookmark size={12}/>, label: 'Saved' }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => setCategorySort({ ...categorySort, [category]: btn.id as SortType })}
                                    className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                                        currentSort === btn.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {btn.icon} {btn.label}
                                </button>
                            ))}
                        </div>
                        <div className="hidden sm:flex gap-2">
                            <button onClick={() => scroll(category, 'left')} className="p-1.5 rounded-full bg-background/40 hover:bg-background/80 transition-all border border-slate-200/50 dark:border-slate-800/50"><ChevronLeft size={16}/></button>
                            <button onClick={() => scroll(category, 'right')} className="p-1.5 rounded-full bg-background/40 hover:bg-background/80 transition-all border border-slate-200/50 dark:border-slate-800/50"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                </div>

                <div 
                  ref={el => { scrollRefs.current[category] = el; }}
                  className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide scroll-smooth-custom px-1 snap-x min-h-[150px]"
                >
                  {filtered.length > 0 ? filtered.map((skill: any) => {
                    const voteType = userVotes[skill.id];
                    const isFav = userFavorites.includes(skill.id);
                    const isCardLoading = isProcessing[skill.id];
                    return (
                      <Link 
                        key={skill.id} 
                        href={`/drills/${skill.slug}`} 
                        className="min-w-[240px] max-w-[240px] snap-start bg-card backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                      >
                        <div className={`h-1 w-full shrink-0 ${voteType === 'up' ? 'bg-emerald-500' : voteType === 'down' ? 'bg-rose-500' : 'bg-indigo-600/30'}`}></div>
                        <div className="p-5 flex flex-col flex-grow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-9 w-9 bg-indigo-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-indigo-600">
                                {getIcon(skill.category)}
                            </div>
                            <button onClick={(e) => handleShare(e, skill)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Share2 size={16} /></button>
                          </div>
                          <h3 className="text-base font-bold mb-6 leading-tight h-[60px] line-clamp-3">{skill.title}</h3>
                          
                          <div className="mt-auto pt-4 border-t border-slate-200/30 flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
                              <button 
                                disabled={isCardLoading} 
                                onClick={(e) => handleVote(e, skill.id, 'up')} 
                                className={`p-1 rounded-full transition-all ${voteType === 'up' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400'}`}
                              >
                                <ArrowUp size={14} strokeWidth={3}/>
                              </button>
                              
                              <span className={`px-1 text-xs font-black ${voteType === 'up' ? 'text-emerald-600 dark:text-emerald-400' : voteType === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {skill.votes}
                              </span>
                              
                              <button 
                                disabled={isCardLoading} 
                                onClick={(e) => handleVote(e, skill.id, 'down')} 
                                className={`p-1 rounded-full transition-all ${voteType === 'down' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'}`}
                              >
                                <ArrowDown size={14} strokeWidth={3}/>
                              </button>
                            </div>

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
                    <div className="w-full flex flex-col items-center justify-center py-10 opacity-40">
                        <Bookmark size={32} className="mb-2"/>
                        <p className="text-xs font-bold uppercase tracking-widest">No Saved Skills Here</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}