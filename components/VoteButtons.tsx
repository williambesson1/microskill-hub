"use client";

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VoteProps {
  skillId: number;
  userId: string;
  initialVote?: number;
}

export default function VoteButtons({ skillId, userId, initialVote = 0 }: VoteProps) {
  const [userVote, setUserVote] = useState<number>(initialVote);
  const [isVoting, setIsVoting] = useState(false);

  // Sync with initialVote if it changes (e.g., after a search)
  useEffect(() => {
    setUserVote(initialVote);
  }, [initialVote]);

  const handleVote = async (type: 'up' | 'down') => {
    if (isVoting) return; // Prevent double-clicks
    setIsVoting(true);

    const voteValue = type === 'up' ? 1 : -1;

    try {
      if (userVote === voteValue) {
        // TOGGLE OFF: If clicking the same button, delete the vote
        await supabase.from('user_votes').delete().eq('user_id', userId).eq('skill_id', skillId);
        setUserVote(0);
      } else {
        // UPSERT: Replace existing vote or create new one
        await supabase.from('user_votes').upsert({
          user_id: userId,
          skill_id: skillId,
          vote_type: voteValue
        }, { onConflict: 'user_id,skill_id' });
        setUserVote(voteValue);
      }
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {/* Upvote Button */}
      <button 
        onClick={(e) => { e.preventDefault(); handleVote('up'); }}
        disabled={isVoting}
        className={`p-3 rounded-xl flex items-center gap-2 transition-all border ${
          userVote === 1 
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' 
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-emerald-200'
        }`}
      >
        <ArrowUp size={18} strokeWidth={userVote === 1 ? 3 : 2} />
        <span className="text-xs font-bold uppercase">Mastered</span>
      </button>

      {/* Downvote Button */}
      <button 
        onClick={(e) => { e.preventDefault(); handleVote('down'); }}
        disabled={isVoting}
        className={`p-3 rounded-xl transition-all border ${
          userVote === -1 
            ? 'bg-rose-500 border-rose-500 text-white' 
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-rose-200'
        }`}
      >
        <ArrowDown size={18} />
      </button>
    </div>
  );
}