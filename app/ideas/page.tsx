"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
// We added Brain and LogOut to match the homepage navigation
import { ArrowLeft, ArrowUp, ArrowDown, Lightbulb, Plus, MessageSquare, Trash2, Brain, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ThemeToggle from '../../components/ThemeToggle';

export default function IdeasBoard() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<{[key: number]: 'up' | 'down' | null}>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState<{[key: number]: boolean}>({});

  // Define the Admin Email (Change this if you use a different login)
  const ADMIN_EMAIL = "guillaume.besson@gmail.com";

  const fetchIdeas = async (currentUser: any) => {
    const { data: ideasData } = await supabase
      .from('ideas')
      .select('*')
      .order('votes', { ascending: false })
      .order('created_at', { ascending: true });
      
    setIdeas(ideasData || []);

    if (currentUser) {
      const { data: votesData } = await supabase.from('idea_votes').select('idea_id, vote_type').eq('user_id', currentUser.id);
      const voteMap = (votesData || []).reduce((acc, v) => ({ ...acc, [v.idea_id]: v.vote_type === 1 ? 'up' : 'down' }), {});
      setUserVotes(voteMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
      fetchIdeas(activeUser); 
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to suggest an idea.");
    if (!newTitle.trim()) return alert("Title is required!");
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ideas').insert({
        user_id: user.id,
        title: newTitle,
        description: newDesc
      });
      if (error) throw error;
      setNewTitle("");
      setNewDesc("");
      fetchIdeas(user); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Delete Idea Function
  const handleDeleteIdea = async (ideaId: number) => {
    const confirm = window.confirm("Are you sure you want to delete this idea? This cannot be undone.");
    if (!confirm) return;

    try {
      const { error } = await supabase.from('ideas').delete().eq('id', ideaId);
      if (error) throw error;
      
      // Optimistic UI: Remove it from the screen instantly
      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete idea.");
    }
  };

  const handleVote = async (ideaId: number, type: 'up' | 'down') => {
    if (!user) return alert("Please sign in to vote!");
    if (isVoting[ideaId]) return;
    setIsVoting(prev => ({ ...prev, [ideaId]: true }));

    const currentVote = userVotes[ideaId];
    const voteValue = type === 'up' ? 1 : -1;

    try {
      if (currentVote === type) {
        setUserVotes(prev => ({ ...prev, [ideaId]: null }));
        setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, votes: i.votes + (type === 'up' ? -1 : 1) } : i));

        await supabase.from('idea_votes').delete().eq('user_id', user.id).eq('idea_id', ideaId);
        await supabase.rpc(type === 'up' ? 'decrement_idea_votes' : 'increment_idea_votes', { row_id: ideaId });
      } else {
        setUserVotes(prev => ({ ...prev, [ideaId]: type }));
        
        setIdeas(prev => prev.map(i => {
          if (i.id === ideaId) {
            let voteDiff = 0;
            if (!currentVote) voteDiff = type === 'up' ? 1 : -1;
            else voteDiff = type === 'up' ? 2 : -2; 
            return { ...i, votes: i.votes + voteDiff };
          }
          return i;
        }));

        const { error } = await supabase.from('idea_votes').upsert(
          { user_id: user.id, idea_id: ideaId, vote_type: voteValue }, 
          { onConflict: 'user_id,idea_id' }
        );
        if (error) throw error;
        
        if (!currentVote) {
          await supabase.rpc(type === 'up' ? 'increment_idea_votes' : 'decrement_idea_votes', { row_id: ideaId });
        } else {
          await supabase.rpc(type === 'up' ? 'increment_idea_votes' : 'decrement_idea_votes', { row_id: ideaId });
          await supabase.rpc(type === 'up' ? 'increment_idea_votes' : 'decrement_idea_votes', { row_id: ideaId });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong with your vote. Please refresh.");
    } finally {
      setIsVoting(prev => ({ ...prev, [ideaId]: false }));
    }
  };

  return (
    <div className="min-h-screen font-sans relative">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/island-bg.png')" }} />
      <div className="fixed inset-0 z-1 bg-overlay transition-colors duration-300" />

      <div className="relative z-10 text-foreground pb-20">
        
        {/* === NEW GLOBAL NAVIGATION BAR === */}
        <nav className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl px-6 h-16 flex items-center justify-between border-slate-200/50 dark:border-slate-800/50">
          <Link href="/" className="flex items-center gap-2">
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
              <span className="font-black uppercase tracking-tighter text-sm sm:text-base">Skealed</span>
          </Link>
          <div className="flex items-center gap-4">
              <ThemeToggle />
              {user ? (
                  <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-rose-500 transition-colors"><LogOut size={20}/></button>
              ) : <Link href="/login" className="text-sm font-bold opacity-70 hover:opacity-100">SIGN IN</Link>}
              <Link href="/vault" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95 transition-all">Dashboard</Link>
          </div>
        </nav>
        {/* ================================= */}

        <main className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-amber-500/10 text-amber-500 rounded-2xl mb-6">
              <Lightbulb size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-4 uppercase">Skill Suggestions</h1>
            <p className="text-slate-500 font-medium">Vote on community ideas or submit your own request for the Paradise Hub.</p>
          </header>

          {user ? (
            <div className="bg-card backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[2rem] shadow-lg mb-12">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} className="text-indigo-500"/> Submit an Idea</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input 
                  type="text" placeholder="E.g., How to detect phishing emails..." 
                  value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="bg-background/50 border border-slate-200/50 dark:border-slate-700/50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  maxLength={60} required
                />
                <textarea 
                  placeholder="Tell us why this skill is important (optional)..." 
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  className="bg-background/50 border border-slate-200/50 dark:border-slate-700/50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm min-h-[100px]"
                />
                <button disabled={isSubmitting} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                  {isSubmitting ? 'SUBMITTING...' : 'POST IDEA'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl text-center mb-12">
              <p className="font-bold text-indigo-600 mb-2">Have a great idea?</p>
              <Link href="/login" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors underline">Sign in to submit a skill request.</Link>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {loading ? <p className="text-center text-slate-400 font-bold uppercase tracking-widest py-10 animate-pulse">Loading Ideas...</p> : 
             ideas.length === 0 ? <p className="text-center text-slate-400 py-10">No ideas submitted yet. Be the first!</p> :
             ideas.map(idea => {
               const vType = userVotes[idea.id];
               
               // Check if the current user is the admin or the author of the idea
               const isOwnerOrAdmin = user?.email === ADMIN_EMAIL || user?.id === idea.user_id;

               return (
                 <div key={idea.id} className="bg-card backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-4 sm:p-6 rounded-[1.5rem] shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all hover:shadow-md">
                   
                   <div className="flex items-start gap-4">
                     <div className="hidden sm:flex h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl items-center justify-center text-slate-400 shrink-0 mt-1"><MessageSquare size={18} /></div>
                     <div>
                       <h3 className="font-bold text-lg leading-tight mb-1">{idea.title}</h3>
                       {idea.description && <p className="text-sm text-slate-500 line-clamp-2">{idea.description}</p>}
                     </div>
                   </div>

                   <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                     
                     {/* Voting Controls */}
                     <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-full">
                       <button 
                         disabled={isVoting[idea.id]} onClick={() => handleVote(idea.id, 'up')} 
                         className={`p-2 rounded-full transition-all ${vType === 'up' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-amber-500'}`}
                       >
                         <ArrowUp size={16} strokeWidth={vType === 'up' ? 3 : 2}/>
                       </button>
                       <span className={`px-2 text-sm font-black ${vType === 'up' ? 'text-amber-600' : vType === 'down' ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
                         {idea.votes}
                       </span>
                       <button 
                         disabled={isVoting[idea.id]} onClick={() => handleVote(idea.id, 'down')} 
                         className={`p-2 rounded-full transition-all ${vType === 'down' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-rose-500'}`}
                       >
                         <ArrowDown size={16} strokeWidth={vType === 'down' ? 3 : 2}/>
                       </button>
                     </div>

                     {/* Delete Button (Only visible to Admin or Author) */}
                     {isOwnerOrAdmin && (
                       <button 
                         onClick={() => handleDeleteIdea(idea.id)} 
                         className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
                         title="Delete Idea"
                       >
                         <Trash2 size={18} />
                       </button>
                     )}

                   </div>
                 </div>
               );
             })}
          </div>
        </main>
      </div>
    </div>
  );
}