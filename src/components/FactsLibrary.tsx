import React, { useState } from 'react';
import { Globe, Star, Calculator, BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KNOWLEDGE_BASE, Subject, Fact } from '../constants/facts';

const SUBJECT_CONFIG: Record<Subject, { icon: React.ReactNode; color: string; bg: string }> = {
  Geography: { icon: <Globe className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500' },
  Stars:      { icon: <Star className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500' },
  Math:       { icon: <Calculator className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500' },
  Phonics:    { icon: <BookOpen className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500' },
  Physics:    { icon: <Sparkles className="w-5 h-5" />, color: 'text-pink-400', bg: 'bg-pink-500' },
};

const SUBJECTS: Subject[] = ['Geography', 'Stars', 'Math', 'Phonics', 'Physics'];

const speak = (text: string) => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = 1.2;
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
};

interface Props {
  twinName: string;
}

const FactsLibrary: React.FC<Props> = ({ twinName }) => {
  const [active, setActive] = useState<Subject | null>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);

  const filtered: Fact[] = active ? KNOWLEDGE_BASE.filter(f => f.subject === active) : KNOWLEDGE_BASE;

  const handleSpeak = (fact: Fact) => {
    setSpeaking(fact.title);
    speak(`${fact.title}. ${fact.content}`);
    setTimeout(() => setSpeaking(null), 6000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-glow">
          {twinName}'s Knowledge Base 📚
        </h2>
        <p className="text-white/50 text-sm mt-1">Tap any card to hear KidClaw explain it!</p>
      </div>

      {/* Subject filter tabs */}
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => setActive(null)}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            active === null ? 'glass bg-white/30 text-white' : 'glass text-white/60 hover:text-white'
          }`}
        >
          ✨ All
        </button>
        {SUBJECTS.map(s => {
          const cfg = SUBJECT_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setActive(active === s ? null : s)}
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 transition-all ${
                active === s ? `${cfg.bg} text-white shadow-lg` : 'glass text-white/60 hover:text-white'
              }`}
            >
              {cfg.icon}
              {s}
            </button>
          );
        })}
      </div>

      {/* Fact cards */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.map((fact, i) => {
            const cfg = SUBJECT_CONFIG[fact.subject];
            const isSpeaking = speaking === fact.title;
            return (
              <motion.button
                key={fact.title}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSpeak(fact)}
                className={`glass-dark rounded-3xl p-5 text-left transition-all cursor-pointer ${
                  isSpeaking ? 'ring-2 ring-white/50 bg-white/10' : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{fact.emoji}</span>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color} flex items-center gap-1`}>
                      {cfg.icon}
                      {fact.subject}
                    </div>
                    <h3 className="text-lg font-display font-bold text-white leading-tight">{fact.title}</h3>
                  </div>
                  {isSpeaking && (
                    <div className="ml-auto flex gap-0.5">
                      {[0, 1, 2].map(j => (
                        <motion.div
                          key={j}
                          animate={{ scaleY: [1, 2.5, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: j * 0.15 }}
                          className="w-1.5 h-4 bg-white/60 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{fact.content}</p>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FactsLibrary;
