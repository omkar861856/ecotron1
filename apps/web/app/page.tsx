"use client";

import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'resume' | 'rewrite' | 'summarize'>('resume');
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.ecotron.co.in/api/${activeTab === 'resume' ? 'resume' : activeTab === 'summarize' ? 'summarize' : 'generate'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: input,
          task: activeTab === 'rewrite' ? 'rewrite' : activeTab
        }),
      });
      const data = await response.json();
      setOutput(data.result);
    } catch (error) {
      setOutput("Error generating content. Please try again.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Ad Placeholder */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl h-24 mb-12 flex items-center justify-center text-white/20 text-sm">
          [Leaderboard Ad - 728x90]
        </div>

        <h1 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500">
          ECOTRON AI
        </h1>
        <p className="text-white/40 mb-12 text-lg">Production-grade AI utilities for modern creators.</p>

        <div className="flex gap-4 mb-8">
          {(['resume', 'rewrite', 'summarize'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-semibold capitalize transition-all ${
                activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-bold text-white/40 uppercase tracking-widest mb-4">
                Input Content
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-lg min-h-[200px] resize-none"
                placeholder={`Paste your ${activeTab} content here...`}
              />
              <button
                onClick={handleAction}
                disabled={loading || !input}
                className="w-full mt-6 bg-white text-black font-bold py-4 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
              >
                {loading ? "PROCESSING..." : `GENERATE ${activeTab.toUpperCase()}`}
              </button>
            </div>

            {output && (
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest">
                    AI Output
                  </label>
                  <button 
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md"
                  >
                    Copy
                  </button>
                </div>
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-white/90">
                  {output}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Ads */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl h-[250px] flex items-center justify-center text-white/20 text-xs text-center p-4">
              [Sidebar Ad - 300x250]
            </div>
            <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-6">
              <h3 className="font-bold mb-2">Why Ecotron?</h3>
              <p className="text-sm text-white/40">Local LLM inference means your data stays private and requests are lightning fast.</p>
            </div>
            <div className="sticky top-8 bg-white/5 border border-white/10 rounded-2xl h-[600px] flex items-center justify-center text-white/20 text-xs text-center p-4">
              [Sticky Ad - 300x600]
            </div>
          </div>
        </div>

        {/* Footer Ad */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl h-24 mt-12 flex items-center justify-center text-white/20 text-sm">
          [Footer Ad - 728x90]
        </div>
      </div>

      <footer className="mt-24 text-center text-white/20 text-xs border-t border-white/5 pt-8 pb-12">
        &copy; 2026 ECOTRON AI Platform. All rights reserved.
      </footer>
    </main>
  );
}
