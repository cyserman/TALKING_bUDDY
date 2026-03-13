import React from 'react';
import VoiceAssistant from './components/VoiceAssistant';
import { motion } from 'motion/react';
import { Sparkles, Github, Info, Rocket, Globe, Star } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#050510] text-zinc-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        
        {/* Floating Stars */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.2, scale: 0.5 }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3 + Math.random() * 5, delay: Math.random() * 5 }}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold tracking-tight text-xl">Nano-Nano Call</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800/50 text-xs text-zinc-400">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Exploring Earth & Space</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-8 lg:py-16 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Star className="w-3 h-3" />
            <span>Your AI Space Buddy</span>
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-zinc-100">
            Talk to <br />
            <span className="text-blue-500">Nano!</span>
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-lg leading-relaxed">
            Ready to explore the world and the stars? Nano is here to answer 
            all your questions about geography, numbers, and the universe!
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-sm">Geography</h3>
              <p className="text-xs text-zinc-500">Learn about states, capitals, and oceans!</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-2">
              <Star className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-sm">Astronomy</h3>
              <p className="text-xs text-zinc-500">Discover stars, moons, and planets!</p>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4 max-w-xs">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs text-zinc-400 leading-tight">
                Nano is a safe and friendly AI built just for you to learn and have fun!
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <VoiceAssistant />
        </motion.div>
      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-50" />
    </div>
  );
}
