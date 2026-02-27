"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function DrillPage() {
  const { slug } = useParams();
  const router = useRouter();

  // Clean up the slug to make a nice title (e.g., "cognitive_bias_breaker" -> "COGNITIVE BIAS BREAKER")
  const formattedTitle = slug 
    ? String(slug).replace(/[-_]/g, ' ').toUpperCase()
    : 'SKILL DRILL';

  return (
    // Dark slate background matching the Scam Sensor vibe
    <div className="min-h-screen flex flex-col bg-slate-900 font-sans">
      
      {/* Sleek App-Style Header */}
      <header className="relative flex items-center h-16 px-4 shrink-0 text-white z-10">
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors z-20"
        >
          <ArrowLeft size={24} />
        </button>
        {/* Centered Title */}
        <h1 className="absolute inset-0 flex items-center justify-center text-sm font-black tracking-widest text-slate-100 pointer-events-none px-12 text-center line-clamp-1">
          {formattedTitle}
        </h1>
      </header>

      {/* Iframe Container - White card pulling up over the dark background */}
      <main className="flex-grow flex flex-col w-full max-w-md sm:max-w-4xl mx-auto bg-slate-50 dark:bg-slate-950 rounded-t-[2.5rem] sm:rounded-b-[2.5rem] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative">
        <iframe 
          src={`/apps/${slug}.html`} 
          className="absolute inset-0 w-full h-full border-0 bg-transparent"
          title={`${slug} interactive drill`}
          allowFullScreen
        />
      </main>
      
    </div>
  );
}