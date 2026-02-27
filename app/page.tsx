"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowUp, ArrowDown, Share2, Heart, Brain, Shield, 
  GraduationCap, Zap, Search, LogOut, ChevronRight, 
  ChevronLeft, Trophy, Clock, Bookmark, Lightbulb,
  Users, Activity, Target, PieChart
} from 'lucide-react';
import { supabase } from '../lib/supabase'; 

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
      
      {/* Backgrounds */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/island-bg.png')" }} />
      <div className="fixed inset-0 z-1 bg-overlay transition-colors duration-300" />

      <div className="relative z-10 text-foreground transition-colors duration-300">
        
        {/* Global Nav Bar */}
        <nav className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center justify-between border-slate-200/50">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
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
              <span className="font-black uppercase tracking-tighter text-sm sm:text-base text-slate-900">Skealed</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/ideas" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-widest">
             <Lightbulb size={14} /> Suggest Skill
             </Link>
              {user ? (
                  <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-rose-500 transition-colors p-1"><LogOut size={18} className="sm:w-[20px] sm:h-[20px]"/></button>
              ) : <Link href="/login" className="text-xs sm:text-sm font-bold text-slate-700 opacity-70 hover:opacity-100 whitespace-nowrap">SIGN IN</Link>}
              <Link href="/vault" className="bg-indigo-600 text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-lg active:scale-95 transition-all whitespace-nowrap">Dashboard</Link>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="pt-8 pb-10 sm:py-20 text-center">
          
          {/* THE NEW GRADIENT HEADLINE */}
          <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tighter max-w-4xl mx-auto px-4 leading-tight text-slate-800">
            Real-world skills.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
              5 minutes at a time.
            </span>
          </h1>

          <div className="relative max-w-lg mx-auto px-4 sm:px-6">
              <Search className="absolute left-8 sm:left-10 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                  type="text" 
                  placeholder="Search skills..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-md border border-slate-200/80 py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-slate-900"
              />
          </div>
        </header>

        {/* Main Content Area */}
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
                        href={`/categories/${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} 
                        className="group/title inline-flex items-center gap-2"
                    >
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 group-hover/title:text-indigo-500 transition-colors">
                            {category}
                        </h2>
                        <ChevronRight size={14} className="text-indigo-500 group-hover/title:translate-x-1 transition-transform"/>
                    </Link>
                    
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        
                        <div className="flex w-full sm:w-auto bg-slate-100 sm:bg-white/80 p-1.5 sm:p-2 rounded-xl backdrop-blur-md border border-slate-200 shadow-sm overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'top', icon: <Trophy size={14} className="sm:w-4 sm:h-4"/>, label: 'Top' },
                                { id: 'new', icon: <Clock size={14} className="sm:w-4 sm:h-4"/>, label: 'New' },
                                { id: 'saved', icon: <Bookmark size={14} className="sm:w-4 sm:h-4"/>, label: 'Saved' }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => setCategorySort({ ...categorySort, [category]: btn.id as SortType })}
                                    className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                                        currentSort === btn.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'
                                    }`}
                                >
                                    {btn.icon} {btn.label}
                                </button>
                            ))}
                        </div>

                        <div className="hidden sm:flex gap-2">
                            <button 
                              onClick={() => scroll(category, 'left')} 
                              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200/50 text-slate-600 shadow-sm"
                            >
                              <ChevronLeft size={16}/>
                            </button>
                            <button 
                              onClick={() => scroll(category, 'right')} 
                              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200/50 text-slate-600 shadow-sm"
                            >
                              <ChevronRight size={16}/>
                            </button>
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
                    
                    const lineClass = isFav ? 'bg-rose-500' : voteType === 'up' ? 'bg-emerald-500' : 'bg-indigo-600/30';

                    return (
                      <Link 
                        key={skill.id} 
                        href={`/drills/${skill.slug}`} 
                        className="min-w-[240px] max-w-[240px] snap-start bg-white/90 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                      >
                        <div className={`h-1 w-full shrink-0 ${lineClass}`}></div>
                        <div className="p-5 flex flex-col flex-grow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                {getIcon(skill.category)}
                            </div>
                            <button onClick={(e) => handleShare(e, skill)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Share2 size={16} /></button>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mb-6 leading-tight h-[60px] line-clamp-3">{skill.title}</h3>
                          
                          <div className="mt-auto pt-4 border-t border-slate-200/30 flex items-center justify-between">
                            
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

                            <button 
                              disabled={isCardLoading} 
                              onClick={(e) => handleToggleHeart(e, skill.id)} 
                              className={`p-1.5 rounded-full transition-all ${isFav ? 'text-rose-500 scale-110' : 'text-slate-400 hover:text-rose-500'}`}
                            >
                              <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                            </button>
                          </div>

                        </div>
                      </Link>
                    );
                  }) : (
                    <div className="w-full flex flex-col items-center justify-center py-10 opacity-40">
                        <Bookmark size={32} className="mb-2 text-slate-400"/>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No Saved Skills Here</p>
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