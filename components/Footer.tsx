import Link from 'next/link';
import { Mail, Github, Twitter, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-20 border-t border-slate-200/50 dark:border-slate-800/50 bg-background/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-xl font-black tracking-tighter uppercase mb-4 text-indigo-600">
              Skealed
                          </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
            A community-driven platform for bite-sized learning.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-slate-400 hover:text-indigo-500 transition-colors"><Twitter size={20} /></Link>
              <Link href="#" className="text-slate-400 hover:text-indigo-500 transition-colors"><Github size={20} /></Link>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-6 text-slate-400">Platform</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/" className="hover:text-indigo-500 transition-colors">Home</Link></li>
              <li><Link href="/vault" className="hover:text-indigo-500 transition-colors">My Dashboard</Link></li>
              <li><Link href="/categories/ai-literacy" className="hover:text-indigo-500 transition-colors">AI Literacy</Link></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-6 text-slate-400">Legal</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/legal/terms" className="hover:text-indigo-500 transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-indigo-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-indigo-500 transition-colors">Cookie Settings</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-6 text-slate-400">Support</h3>
            <Link 
              href="mailto:support@paradisehub.com" 
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
            >
              <Mail size={16} /> Contact Us
            </Link>
            <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-3">
              <ShieldCheck size={24} className="text-indigo-500" />
              <p className="text-[10px] text-slate-500 leading-tight">
                Securely powered by <br/><span className="font-bold text-slate-800 dark:text-slate-200">Supabase Auth</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200/30 dark:border-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium">
            © {currentYear} Skealed. All rights reserved. Built locally in 2026.
          </p>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-black">
            <span>Status:</span>
            <span className="flex items-center gap-1 text-emerald-500">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Systems Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}