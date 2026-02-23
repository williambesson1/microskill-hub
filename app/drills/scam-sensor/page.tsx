"use client"; // This tells Next.js this page is interactive

import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

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

  const handleChoice = (choice: boolean) => {
    if (choice === scenarios[currentIndex].isScam) {
      setScore(score + 1);
    }
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameState('end');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden text-slate-900 flex flex-col h-[600px] border-[8px] border-slate-800">
        
        {/* Drill Header */}
        <div className="bg-slate-800 p-6 text-white text-center">
            <div className="flex items-center justify-between">
                <Link href="/"><ArrowLeft size={20} /></Link>
                <h1 className="text-sm font-bold tracking-widest uppercase">Scam Sensor</h1>
                <div className="w-5"></div>
            </div>
        </div>

        {gameState === 'start' && (
          <div className="p-8 text-center flex-grow flex flex-col justify-center">
            <div className="text-6xl mb-6">🕵️‍♂️</div>
            <h2 className="text-2xl font-bold mb-4">Spot the Anomaly</h2>
            <p className="text-slate-600 mb-8 text-sm">You have 4 cases to review. Inspect the sender and tone carefully.</p>
            <button onClick={() => setGameState('play')} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg">START DRILL</button>
          </div>
        )}

        {gameState === 'play' && (
          <div className="p-4 flex-grow flex flex-col">
            <div className="bg-slate-100 rounded-2xl p-4 mb-6 flex-grow shadow-inner border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 uppercase">
                        {scenarios[currentIndex].sender[0]}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold truncate">{scenarios[currentIndex].sender}</div>
                        <div className="text-[10px] text-slate-500 truncate">{scenarios[currentIndex].meta}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-200 min-h-[120px]">
                    {scenarios[currentIndex].body}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
                <button onClick={() => handleChoice(true)} className="bg-rose-500 text-white py-4 rounded-2xl font-bold flex flex-col items-center shadow-lg active:scale-95">
                    <ShieldAlert size={20} className="mb-1" />
                    <span>SCAM</span>
                </button>
                <button onClick={() => handleChoice(false)} className="bg-emerald-500 text-white py-4 rounded-2xl font-bold flex flex-col items-center shadow-lg active:scale-95">
                    <ShieldCheck size={20} className="mb-1" />
                    <span>LEGIT</span>
                </button>
            </div>
          </div>
        )}

        {gameState === 'end' && (
          <div className="p-8 text-center flex-grow flex flex-col justify-center">
            <h2 className="text-3xl font-bold">Complete</h2>
            <div className="text-6xl font-black text-indigo-600 my-6">{score}/4</div>
            <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg">RETRY</button>
          </div>
        )}
      </div>
    </div>
  );
}