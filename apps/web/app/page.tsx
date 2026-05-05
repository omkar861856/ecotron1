"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [diceValue, setDiceValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState("Place your bet and roll!");
  const [history, setHistory] = useState<number[]>([]);

  const rollDice = () => {
    if (rolling || balance < bet) return;

    setRolling(true);
    setMessage("Rolling...");
    
    // Animate balance change
    setBalance(prev => prev - bet);

    setTimeout(() => {
      const newValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(newValue);
      setRolling(false);
      
      if (newValue > 3) {
        const winAmount = bet * 2;
        setBalance(prev => prev + winAmount);
        setMessage(`You rolled a ${newValue}. YOU WIN $${winAmount}! 🎉`);
      } else {
        setMessage(`You rolled a ${newValue}. Better luck next time! 😅`);
      }
      
      setHistory(prev => [newValue, ...prev].slice(0, 5));
    }, 1500);
  };

  const getRotation = (val: number) => {
    switch (val) {
      case 1: return "rotateX(0deg) rotateY(0deg)";
      case 2: return "rotateX(-90deg) rotateY(0deg)";
      case 3: return "rotateX(0deg) rotateY(-90deg)";
      case 4: return "rotateX(0deg) rotateY(90deg)";
      case 5: return "rotateX(90deg) rotateY(0deg)";
      case 6: return "rotateX(180deg) rotateY(0deg)";
      default: return "rotateX(0deg) rotateY(0deg)";
    }
  };

  const renderDots = (val: number) => {
    return Array(9).fill(0).map((_, i) => <div key={i} className="dot" />);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="bg-glow" />
      
      {/* Top Banner Ad */}
      <div className="w-full flex justify-center mb-8 overflow-hidden rounded-xl">
        <div className="bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10 min-h-[90px] min-w-[320px] md:min-w-[728px] flex items-center justify-center">
          {/* 728x90 Ad */}
          <script dangerouslySetInnerHTML={{ __html: `
            atOptions = {
              'key' : 'c25ecd0c0fe9d93f6cf66f0016cbd198',
              'format' : 'iframe',
              'height' : 90,
              'width' : 728,
              'params' : {}
            };
          `}} />
          <script src="https://developdomicile.com/c25ecd0c0fe9d93f6cf66f0016cbd198/invoke.js" async />
          <span className="text-white/20 text-xs">Advertisement (728x90)</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start">
        
        {/* Left Skyscraper Ad */}
        <div className="hidden lg:flex flex-col items-center gap-4">
          <div className="glass-card p-2 min-h-[300px] w-[160px] flex items-center justify-center">
             {/* 160x300 Ad */}
             <script dangerouslySetInnerHTML={{ __html: `
                atOptions = {
                  'key' : '7f1e1c3d11870c7899ccce329cdd56e9',
                  'format' : 'iframe',
                  'height' : 300,
                  'width' : 160,
                  'params' : {}
                };
              `}} />
              <script src="https://developdomicile.com/7f1e1c3d11870c7899ccce329cdd56e9/invoke.js" async />
             <span className="text-white/20 text-xs text-center">Ad (160x300)</span>
          </div>
        </div>

        {/* Game Center */}
        <div className="flex-1 glass-card p-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-rose-400">
            LUCKY DICE
          </h1>
          <p className="text-white/60 mb-8">Roll > 3 to double your bet!</p>

          <div className="flex gap-12 items-center mb-12">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Balance</p>
              <p className="text-3xl font-mono text-emerald-400">${balance}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Bet Amount</p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setBet(Math.max(10, bet - 10))}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >-</button>
                <span className="text-2xl font-mono">${bet}</span>
                <button 
                  onClick={() => setBet(bet + 10)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >+</button>
              </div>
            </div>
          </div>

          <div className="dice-container">
            <div 
              className={`dice ${rolling ? 'rolling' : ''}`}
              style={{ transform: rolling ? undefined : getRotation(diceValue) }}
            >
              <div className="face front" data-value="1">{renderDots(1)}</div>
              <div className="face back" data-value="6">{renderDots(6)}</div>
              <div className="face right" data-value="3">{renderDots(3)}</div>
              <div className="face left" data-value="4">{renderDots(4)}</div>
              <div className="face top" data-value="2">{renderDots(2)}</div>
              <div className="face bottom" data-value="5">{renderDots(5)}</div>
            </div>
          </div>

          <div className="mt-12 text-center w-full">
            <p className={`text-lg font-medium mb-6 min-h-[28px] ${message.includes('WIN') ? 'text-rose-400 animate-bounce' : 'text-white/80'}`}>
              {message}
            </p>
            
            <button
              onClick={rollDice}
              disabled={rolling || balance < bet}
              className={`w-full max-w-sm py-4 rounded-2xl font-bold text-xl transition-all ${
                rolling || balance < bet 
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 active:scale-[0.98]'
              }`}
            >
              {rolling ? 'ROLLING...' : balance < bet ? 'INSUFFICIENT BALANCE' : 'ROLL DICE'}
            </button>
          </div>

          <div className="mt-12 w-full pt-8 border-t border-white/5">
            <p className="text-xs uppercase tracking-widest text-white/20 mb-4 text-center">Last 5 Rolls</p>
            <div className="flex justify-center gap-4">
              {history.map((val, i) => (
                <div key={i} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-mono">
                  {val}
                </div>
              ))}
              {history.length === 0 && <p className="text-white/10 italic">No rolls yet</p>}
            </div>
          </div>
        </div>

        {/* Right Section with Ad */}
        <div className="flex flex-col gap-8 w-full lg:w-auto">
          <div className="glass-card p-6 w-full lg:w-[320px]">
            <h3 className="text-sm font-semibold mb-4 text-white/40 uppercase tracking-wider text-center">Sponsored</h3>
            <div className="bg-white/5 rounded-xl min-h-[250px] flex items-center justify-center overflow-hidden border border-white/10">
               {/* 300x250 Ad */}
               <script dangerouslySetInnerHTML={{ __html: `
                atOptions = {
                  'key' : 'eca2cd8a7fd561c8d9ddc9b4e1302ac9',
                  'format' : 'iframe',
                  'height' : 250,
                  'width' : 300,
                  'params' : {}
                };
              `}} />
              <script src="https://developdomicile.com/eca2cd8a7fd561c8d9ddc9b4e1302ac9/invoke.js" async />
              <span className="text-white/20 text-xs">Ad (300x250)</span>
            </div>
          </div>
        </div>

      </div>

      <footer className="mt-16 text-white/20 text-xs text-center pb-8">
        &copy; 2026 Ecotron Lucky Games. Please play responsibly.
      </footer>

      <style jsx global>{\`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce {
          animation: bounce 0.5s infinite;
        }
      \`}</style>
    </main>
  );
}
