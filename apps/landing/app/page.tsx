"use client";

import React from 'react';
import { 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight, 
  Layers, 
  Activity,
  Send,
  TrendingUp,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/10 overflow-x-hidden font-sans">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter text-slate-900">
            ECOTRON <span className="text-emerald-600">NET</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {['Publishers', 'Advertisers', 'Network', 'Dashboard'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">
              {item}
            </a>
          ))}
          <a href="https://dashboard.ecotron.co.in" className="px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-slate-900/10">
            Console Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Next-Gen Ad Distribution
            </div>
            <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.9]">
              SCALE YOUR <br />
              <span className="text-emerald-600">REACH</span> GLOBALLY
            </h1>
            <p className="text-xl text-slate-500 font-medium italic leading-relaxed max-w-lg">
              Ecotron provides high-performance ad distribution for publishers and free ad posting for businesses ready to scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#post-ad" className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/20">
                Post Free Ad <ArrowRight className="w-5 h-5" />
              </a>
              <button className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full" />
            <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-slate-200 to-white shadow-2xl">
              <div className="bg-white rounded-[2.8rem] p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Total Network Reach</div>
                    <div className="text-4xl font-black italic tracking-tighter text-slate-900">1.2B+</div>
                  </div>
                  <TrendingUp className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="h-40 w-full bg-slate-50 rounded-3xl flex items-end gap-2 p-6">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="flex-1 bg-emerald-500/20 rounded-t-lg relative group"
                    >
                      <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Post Ad Form Section */}
      <section id="post-ad" className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-5xl font-black italic tracking-tighter">Deploy Your Campaign</h2>
          <p className="text-slate-400 font-medium italic">High-performance ad distribution starting at $0.00.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          <form className="space-y-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 ml-2">Campaign Identity</label>
                <div className="relative">
                  <Send className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    placeholder="e.g. Winter Sale 2026"
                    className="w-full py-5 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 ml-2">Creative Asset URI</label>
                <div className="relative">
                  <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    placeholder="https://assets.com/banner.png"
                    className="w-full py-5 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 ml-2">Target Destination</label>
              <div className="relative">
                <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  placeholder="https://your-business.com/deal"
                  className="w-full py-5 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
            <button className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-4">
              Initialize Distribution <Zap className="w-5 h-5" />
            </button>
          </form>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-slate-900 fill-current" />
            </div>
            <span className="text-xl font-black italic tracking-tighter text-slate-900">ECOTRON</span>
          </div>
          <div className="text-sm font-bold text-slate-300 uppercase tracking-widest">
            © 2026 Ecotron Digital Ad Network. All Rights Reserved.
          </div>
          <div className="flex gap-8">
            {['Twitter', 'LinkedIn', 'Support'].map((item) => (
              <a key={item} href="#" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
