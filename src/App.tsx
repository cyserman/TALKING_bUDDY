import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Mic, Gamepad2, Library, Hammer, BookOpen } from 'lucide-react';
import NanoCall from './components/NanoCall';
import DrivingQuiz, { type QuizQuestion } from './components/DrivingQuiz';
import MarbleRunBuilder from './components/MarbleRunBuilder';
import FactsLibrary from './components/FactsLibrary';
import QuizMode from './components/QuizMode';
import { GoogleGenAI } from '@google/genai';

// ─── Types ─────────────────────────────────────────────────────────────────

type Screen = 'profile' | 'hub' | 'nanocall' | 'smashquiz' | 'marble' | 'library' | 'quiz';

interface Twin {
  name: string;
  color: 'blue' | 'purple';
  emoji: string;
  greeting: string;
}

const TWINS: Twin[] = [
  {
    name: 'Leif',
    color: 'blue',
    emoji: '🔵',
    greeting: 'Hey Leif! Ready to explore the universe?',
  },
  {
    name: 'Lewie',
    color: 'purple',
    emoji: '🟣',
    greeting: 'Hey Lewie! Let\'s go on an adventure!',
  },
];

// ─── Hub tiles ───────────────────────────────────────────────────────────────

interface HubTile {
  id: Screen;
  label: string;
  emoji: string;
  desc: string;
  bg: string;
  ring: string;
}

const HUB_TILES: HubTile[] = [
  {
    id: 'nanocall',
    label: 'Talk to Nano',
    emoji: '🎙️',
    desc: 'Voice chat with your AI space buddy!',
    bg: 'bg-blue-600',
    ring: 'ring-blue-400',
  },
  {
    id: 'smashquiz',
    label: 'Smash Quiz!',
    emoji: '🏎️',
    desc: 'Steer your car into the right answer!',
    bg: 'bg-rose-600',
    ring: 'ring-rose-400',
  },
  {
    id: 'quiz',
    label: 'Quiz Time',
    emoji: '🧩',
    desc: 'Answer questions from KidClaw!',
    bg: 'bg-emerald-600',
    ring: 'ring-emerald-400',
  },
  {
    id: 'marble',
    label: 'Marble Run',
    emoji: '🔮',
    desc: 'Build tracks and drop marbles!',
    bg: 'bg-indigo-600',
    ring: 'ring-indigo-400',
  },
  {
    id: 'library',
    label: 'Learn Zone',
    emoji: '📚',
    desc: 'Tap cards to hear cool facts!',
    bg: 'bg-amber-600',
    ring: 'ring-amber-400',
  },
];

// ─── Profile Selector ────────────────────────────────────────────────────────

const ProfileSelector: React.FC<{ onSelect: (twin: Twin) => void }> = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-12 relative z-10">
    <div className="bg-blob bg-blue-600" style={{ top: '-10%', left: '-10%' }} />
    <div className="bg-blob bg-purple-700" style={{ bottom: '-10%', right: '-10%' }} />

    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center space-y-3"
    >
      <div className="text-7xl mb-2">🚀</div>
      <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-glow">
        Wondertwins<br />Agency
      </h1>
      <p className="text-white/50 text-xl">Who's there today?</p>
    </motion.div>

    <div className="flex flex-col md:flex-row gap-8">
      {TWINS.map((twin, i) => (
        <motion.button
          key={twin.name}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.15 }}
          whileHover={{ scale: 1.06, y: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(twin)}
          className={`w-64 h-64 rounded-3xl glass flex flex-col items-center justify-center gap-5 
            hover:ring-4 transition-all duration-300
            ${twin.color === 'blue'
              ? 'hover:ring-blue-400 hover:bg-blue-500/20'
              : 'hover:ring-purple-400 hover:bg-purple-500/20'
            }`}
        >
          <div
            className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-2xl
              ${twin.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}
          >
            {twin.emoji}
          </div>
          <div className="text-center">
            <p className="text-3xl font-display font-bold">{twin.name}</p>
            <p className="text-white/50 text-sm mt-1">Tap to start!</p>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

// ─── Hub Screen ───────────────────────────────────────────────────────────────

const HubScreen: React.FC<{
  twin: Twin;
  onNavigate: (s: Screen) => void;
  onSwitchTwin: () => void;
}> = ({ twin, onNavigate, onSwitchTwin }) => (
  <div className="min-h-screen p-6 md:p-10 space-y-8 relative z-10">
    <div
      className={`bg-blob ${twin.color === 'blue' ? 'bg-blue-600' : 'bg-purple-700'}`}
      style={{ top: '-15%', left: '-10%' }}
    />
    <div className="bg-blob bg-indigo-800" style={{ bottom: '-15%', right: '-10%' }} />

    {/* Header */}
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg
            ${twin.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}
        >
          {twin.emoji}
        </div>
        <div>
          <p className="text-white/50 text-sm font-bold uppercase tracking-wider">Wondertwins Agency</p>
          <h1 className={`text-3xl font-display font-bold ${
            twin.color === 'blue' ? 'text-glow-blue' : 'text-glow-purple'
          }`}>
            Hey, {twin.name}! 👋
          </h1>
        </div>
      </div>
      <button
        onClick={onSwitchTwin}
        className="glass px-4 py-2 rounded-full text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        Switch Twin
      </button>
    </motion.header>

    {/* Tiles grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
      {HUB_TILES.map((tile, i) => (
        <motion.button
          key={tile.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          whileHover={{ scale: 1.05, y: -6 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate(tile.id)}
          className={`glass rounded-3xl p-6 flex flex-col items-center gap-4 text-center 
            hover:ring-2 transition-all duration-200 ${tile.ring}
            ${tile.id === 'nanocall' ? 'md:col-span-1 col-span-2' : ''}`}
        >
          <div className={`w-16 h-16 rounded-2xl ${tile.bg} flex items-center justify-center text-3xl shadow-lg`}>
            {tile.emoji}
          </div>
          <div>
            <p className="text-lg font-display font-bold leading-tight">{tile.label}</p>
            <p className="text-white/50 text-xs mt-1 leading-snug">{tile.desc}</p>
          </div>
        </motion.button>
      ))}
    </div>

    <p className="text-center text-white/20 text-xs font-display pb-4">
      Made with ❤️ for Leif & Lewie · Wondertwins Agency 🚀
    </p>
  </div>
);

// ─── Screen Wrapper ──────────────────────────────────────────────────────────

const ScreenWrapper: React.FC<{
  title: string;
  emoji: string;
  onBack: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}> = ({ title, emoji, onBack, children, fullWidth }) => (
  <div className={`min-h-screen p-6 md:p-10 space-y-6 relative z-10 ${fullWidth ? '' : 'max-w-3xl mx-auto'}`}>
    <div className="bg-blob bg-indigo-700" style={{ top: '-10%', right: '-10%' }} />
    <motion.header
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4"
    >
      <button
        onClick={onBack}
        className="glass p-3 rounded-full hover:bg-white/20 transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <span className="text-2xl">{emoji}</span>
      <h2 className="text-2xl font-display font-bold">{title}</h2>
    </motion.header>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {children}
    </motion.div>
  </div>
);

// ─── Smash Quiz loader ───────────────────────────────────────────────────────

const SmashQuizScreen: React.FC<{ twinName: string; onBack: () => void }> = ({ twinName, onBack }) => {
  const [question, setQuestion] = React.useState<QuizQuestion | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadQuestion = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const key = (process.env.GEMINI_API_KEY as string) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: key });
      const subjects = ['Geography', 'Stars', 'Math', 'Phonics', 'Physics'];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const res = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate a simple quiz question for a 5-year-old about ${subject}.
Return ONLY valid JSON:
{"question":"...","options":["...","...","...","..."],"correctAnswer":0}
Make it fun! correctAnswer is 0-based index.`,
        config: { responseMimeType: 'application/json' },
      });
      const data = JSON.parse(res.text ?? '{}') as QuizQuestion;
      setQuestion(data);
    } catch (e) {
      setError('Could not load a question. Check your connection!');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadQuestion(); }, [loadQuestion]);

  return (
    <ScreenWrapper title="Smash Quiz!" emoji="🏎️" onBack={onBack} fullWidth>
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-rose-400 border-t-transparent animate-spin" />
          <p className="text-white/60 font-display text-xl">Preparing the track, {twinName}...</p>
        </div>
      )}
      {error && (
        <div className="glass bg-red-500/10 border-red-500/30 rounded-2xl p-6 text-center text-red-400">
          <p className="font-bold text-lg mb-2">{error}</p>
          <button onClick={loadQuestion} className="glass px-6 py-3 rounded-full hover:bg-white/10 mt-2 text-white font-bold">
            Try Again
          </button>
        </div>
      )}
      {!loading && question && (
        <DrivingQuiz question={question} onAnswer={() => {}} onNewQuestion={loadQuestion} />
      )}
    </ScreenWrapper>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('profile');
  const [twin, setTwin] = useState<Twin | null>(null);

  const selectTwin = (t: Twin) => {
    setTwin(t);
    setScreen('hub');
    // Welcome greeting via browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t.greeting);
      u.pitch = 1.2; u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const navTo = (s: Screen) => setScreen(s);
  const goBack = () => setScreen('hub');

  return (
    <AnimatePresence mode="wait">
      {screen === 'profile' && (
        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ProfileSelector onSelect={selectTwin} />
        </motion.div>
      )}

      {screen === 'hub' && twin && (
        <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <HubScreen twin={twin} onNavigate={navTo} onSwitchTwin={() => setScreen('profile')} />
        </motion.div>
      )}

      {screen === 'nanocall' && twin && (
        <motion.div key="nanocall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ScreenWrapper title={`Talk to Nano, ${twin.name}!`} emoji="🎙️" onBack={goBack}>
            <NanoCall twinName={twin.name} twinColor={twin.color} />
          </ScreenWrapper>
        </motion.div>
      )}

      {screen === 'smashquiz' && twin && (
        <motion.div key="smashquiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <SmashQuizScreen twinName={twin.name} onBack={goBack} />
        </motion.div>
      )}

      {screen === 'quiz' && twin && (
        <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ScreenWrapper title="Quiz Time!" emoji="🧩" onBack={goBack}>
            <QuizMode twinName={twin.name} onBack={goBack} />
          </ScreenWrapper>
        </motion.div>
      )}

      {screen === 'marble' && (
        <motion.div key="marble" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ScreenWrapper title="Marble Run Builder" emoji="🔮" onBack={goBack} fullWidth>
            <MarbleRunBuilder />
          </ScreenWrapper>
        </motion.div>
      )}

      {screen === 'library' && twin && (
        <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ScreenWrapper title="Learn Zone" emoji="📚" onBack={goBack}>
            <FactsLibrary twinName={twin.name} />
          </ScreenWrapper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
