"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; 
import { Mail, ArrowRight, Brain, Lightbulb, LogOut } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      setUser(activeUser);
    };
    init();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const redirectUrl = `${window.location.origin}/vault`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setMessage("Error: " + error.message);
      setIsSuccess(false);
    } else {
      setMessage("Check your email for the magic link!");
      setIsSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen font-sans relative flex flex-col">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/island-bg.png')" }} />
      <div className="fixed inset-0 z-1 bg-overlay transition-colors duration-300" />

      <div className="relative z-10 text-foreground flex flex-col min-h-screen">
        
        {/* REBALANCED MOBILE NAV */}
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

        <main className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-card backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[3rem] shadow-2xl p-10 text-center">
              <div className="mb-8 flex justify-center">
                  <div className="rounded-2xl bg-indigo-600 p-4 text-white shadow-lg">
                      <Brain size={36} />
                  </div>
              </div>
              <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter text-foreground">Sign In</h1>
              <p className="text-slate-500 mb-8 font-medium">No password needed. We'll email you a secure link.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    placeholder="Your email address"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-background/50 backdrop-blur-sm py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-foreground"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : "Send Magic Link"}
                  <ArrowRight size={18} />
                </button>
              </form>

              {message && (
                <div className={`mt-6 p-4 rounded-xl text-sm font-bold animate-in fade-in zoom-in border ${
                  isSuccess 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                }`}>
                  {message}
                </div>
              )}
            </div>
        </main>
      </div>
    </div>
  );
}