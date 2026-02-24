"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase'; 

export default function ScamSensor() {
  const scenarios = [
    { sender: "Apple Support", meta: "security@apple-verify-auth.me", body: "Your Apple ID logged in from a new device. Click to lock: bit.ly/id-lock-22", isScam: true },
    { sender: "Chase Bank", meta: "alerts@chase.com", body: "Debit card ending in 4242 used for $12.50 at 'Coffee 2026'. Respond NO if unauthorized.", isScam: false },
    { sender: "Mom", meta: "+1 (555) 012-9844", body: "Hey! My card isn't working at the taxi. Can you Venmo $50 to @AirportHelp-Admin? ASAP!", isScam: true },
    { sender: "Spotify", meta: "no-reply@spotify.com", body: "Your 'Year in Review 2025' is ready! See your top genres and beats.", isScam: false },
  ];

  const [gameState, setGameState] = useState('start');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Voting & User States
  const [user, setUser] = useState<any>(null);
  const [skillId, setSkillId] = useState<number | null>(null);
  const [userVote, setUserVote] = useState<number>(0); 
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const initDrill = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      if (!activeUser) return;
      setUser(activeUser);

      // 1. Get the ID for this drill from the 'skills' table
      const { data: skill } = await supabase
        .from('skills')
        .select('id')
        .eq('slug', 'scam-sensor')
        .single();
      
      if (skill) {
        setSkillId(skill.id);
        // 2. Load the user's existing vote from the DB
        const { data: vote } = await supabase
          .from('user_votes')
          .select('vote_type')
          .eq('user_id', activeUser.id)
          .eq('skill_id', skill.id)
          .maybeSingle(); // maybeSingle handles cases with no vote
        
        if (vote) setUserVote(vote.vote_type);
      }
    };
    initDrill();
  }, []);

  const handleChoice = (choice: boolean) => {
    if (choice === scenarios[currentIndex].isScam) setScore(score + 1);
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameState('end');
    }
  };

  // The Fix: Toggle logic that prevents duplicates
  const handleVote = async (type: 'up' | 'down') => {
    if (!user || !skillId || isVoting) return;
    setIsVoting(true);
    const voteValue = type === 'up' ? 1 : -1;

    try {
      if (userVote === voteValue) {
        // TOGGLE OFF: User clicked the same button again, delete the row
        await supabase.from('user_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('skill_id', skillId);
        setUserVote(0);
      } else {
        // TOGGLE ON/SWITCH: Upsert handles switching from +1 to -1
        await supabase.from('user_votes').upsert({
          user_id: user.id,
          skill_id: skillId,
          vote_type: voteValue
        }, { onConflict: 'user_id,skill_id' }); // Conflict resolution is key
        setUserVote(voteValue);
      }
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100 relative">
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/island-bg.png')" }} />
      
      <div className="relative z-10 max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden text-slate-900 flex flex-col h-[650px] border-[8px] border-slate-800">
        
        <div className="bg-slate-800 p-6 text-white text-center">
            <div className="flex items-center justify-between">
                <Link href="/"><ArrowLeft size={20} className="hover:text-indigo-400" /></Link>
                <h1 className="text-sm font-black tracking-widest uppercase">Scam Sensor</h1>
                <div className="w-5"></div>
            </div>
        </div>

        {gameState === 'start' && (
          <div className="p-8 text-center flex-grow flex flex-col justify-center">
            <div className="text-6xl mb-6">🕵️‍♂️</div>
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Spot the Anomaly</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium">Inspect the sender, meta-data, and tone carefully.</p>
            <button onClick={() => setGameState('play')} className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">START DRILL</button>
          </div>
        )}

        {gameState === 'play' && (
          <div className="p-4 flex-grow flex flex-col">
            <div className="bg-slate-50 rounded-[2rem] p-5 mb-6 flex-grow shadow-inner border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-black text-white uppercase text-xl shrink-0">
                        {scenarios[currentIndex].sender[0]}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-black truncate text-slate-800">{scenarios[currentIndex].sender}</div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">{scenarios[currentIndex].meta}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl text-slate-700 text-sm leading-relaxed border border-slate-200 min-h-[140px] shadow-sm italic overflow-y-auto">
                    "{scenarios[currentIndex].body}"
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
                <button onClick={() => handleChoice(true)} className="bg-rose-500 text-white py-5 rounded-2xl font-black flex flex-col items-center shadow-lg active:scale-95 transition-all">
                    <ShieldAlert size={24} className="mb-1" />
                    <span>SCAM</span>
                </button>
                <button onClick={() => handleChoice(false)} className="bg-emerald-500 text-white py-5 rounded-2xl font-black flex flex-col items-center shadow-lg active:scale-95 transition-all">
                    <ShieldCheck size={24} className="mb-1" />
                    <span>LEGIT</span>
                </button>
            </div>
          </div>
        )}

        {gameState === 'end' && (
          <div className="p-8 text-center flex-grow flex flex-col justify-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Drill Complete</h2>
            <div className="text-7xl font-black text-indigo-600 my-8">{score}/4</div>
            
            {/* VOTING SYSTEM */}
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => handleVote('up')}
                disabled={isVoting}
                className={`flex-grow py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                  userVote === 1 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' 
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <ArrowUp size={20} strokeWidth={3} /> {userVote === 1 ? 'MASTERED' : 'MASTERED?'}
              </button>
              
              <button 
                onClick={() => handleVote('down')}
                disabled={isVoting}
                className={`px-5 py-4 rounded-2xl transition-all border-2 ${
                  userVote === -1 
                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg' 
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <ArrowDown size={20} />
              </button>
            </div>

            <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg opacity-80 hover:opacity-100">RETRY DRILL</button>
          </div>
        )}
      </div>
    </div>
  );
}