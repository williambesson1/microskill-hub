"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // Note: two steps up (../..)
import { Mail, ArrowRight, Brain } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Check your email for the magic link!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-xl p-10 text-center">
        <Link href="/" className="inline-block mb-8">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white inline-block">
                <Brain size={32} />
            </div>
        </Link>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Sign In</h1>
        <p className="text-slate-500 mb-8 font-medium">No password needed. We'll email you a link.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="email"
              placeholder="Your email address"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Sending..." : "Send Magic Link"}
            <ArrowRight size={18} />
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold animate-in fade-in zoom-in">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}