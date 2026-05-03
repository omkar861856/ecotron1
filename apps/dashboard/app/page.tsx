"use client";

import React, { useState } from 'react';
import { 
  BarChart3, 
  Target, 
  Zap, 
  TrendingUp, 
  Globe,
  PlusCircle,
  ArrowUpRight,
  Activity,
  Layers,
  Database,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/10 overflow-x-hidden font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter text-slate-900">
            ECOTRON <span className="text-emerald-600">DASH</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">Network Status</button>
          <button className="px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-slate-900/10">
            Export Data
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter mb-2">Network Command</h1>
            <p className="text-slate-400 font-medium italic">High-performance ad distribution analytics.</p>
          </div>
          <div className="flex gap-2">
            {['1H', '24H', '7D', 'ALL'].map((p) => (
              <button key={p} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${p === '24H' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-400 border border-slate-200'}`}>
                {p}
              </button>
            ))}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Network Impressions', value: '1.2M', icon: <Layers />, color: 'text-emerald-600', trend: '+12.4%' },
            { label: 'Creative Clicks', value: '45.8K', icon: <Target />, color: 'text-blue-600', trend: '+8.2%' },
            { label: 'Conversion Rate', value: '3.82%', icon: <TrendingUp />, color: 'text-indigo-600', trend: '+2.1%' },
            { label: 'Active Placements', value: '124', icon: <Zap />, color: 'text-amber-600', trend: '+15' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-emerald-500/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl bg-slate-50 group-hover:bg-white group-hover:shadow-lg transition-all ${stat.color}`}>{stat.icon}</div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{stat.trend}</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">{stat.label}</div>
              <div className="text-4xl font-black italic tracking-tighter text-slate-900">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Tables/Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Active Distributions</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Live</div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pending</div>
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { name: 'Summer Peak Launch', budget: '$5,000', status: 'Live', reach: '240K' },
                  { name: 'Elite Crypto Bundle', budget: '$2,200', status: 'Pending', reach: '12K' },
                  { name: 'Cyber Monday Promo', budget: '$12,500', status: 'Live', reach: '890K' }
                ].map((camp, i) => (
                  <div key={i} className="flex items-center justify-between p-7 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-500/20 hover:shadow-2xl transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-black italic tracking-tight text-slate-900">{camp.name}</div>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{camp.budget} Allocated</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <div className="font-black italic text-lg text-slate-900">{camp.reach}</div>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-right">Reach</div>
                      </div>
                      <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${camp.status === 'Live' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        {camp.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="p-10 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/30">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-1000">
                <PlusCircle className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black italic tracking-tighter mb-6 leading-tight">Scale Your <br /><span className="text-emerald-500 text-4xl">Network</span></h3>
                <p className="text-slate-400 font-medium italic text-sm mb-10 leading-relaxed">Instantly upgrade to enterprise-grade distribution with global asset replication.</p>
                <button className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20">
                  Post New Ad <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </section>

            <section className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8">Infrastructure Health</h3>
              <div className="space-y-6">
                {[
                  { label: 'Mongo Cluster', val: 'Operational', icon: <Database className="w-4 h-4" /> },
                  { label: 'Redis Cache', val: 'Low Latency', icon: <Activity className="w-4 h-4" /> },
                  { label: 'Edge Nodes', val: '99.9% Uptime', icon: <Globe className="w-4 h-4" /> },
                  { label: 'Ad Engine', val: 'Stable', icon: <Cpu className="w-4 h-4" /> }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-emerald-600">{item.icon}</div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black italic text-emerald-600">{item.val}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
