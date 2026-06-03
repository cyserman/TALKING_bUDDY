import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Volume2, Globe, Star, Calculator, BookOpen, Sparkles, ChevronLeft, Loader2 } from 'lucide-react';
import { Subject } from '../constants/facts';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Props {
  twinName: string;
  onBack: () => void;
}

const SUBJECT_CONFIG: Record<Subject, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  Geography: { icon: <Globe className="w-6 h-6" />,       color: 'text-blue-400',   bg: 'bg-blue-500',    label: 'Geography 🌎' },
  Stars:      { icon: <Star className="w-6 h-6" />,        color: 'text-purple-400', bg: 'bg-purple-500',  label: 'Stars 🌟' },
  Math:       { icon: <Calculator className="w-6 h-6" />,  color: 'text-emerald-400',bg: 'bg-emerald-500', label: 'Math 🔢' },
  Phonics:    { icon: <BookOpen className="w-6 h-6" />,    color: 'text-orange-400', bg: 'bg-orange-500',  label: 'Phonics 📖' },
  Physics:    { icon: <Sparkles className="w-6 h-6" />,    color: 'text-pink-400',   bg: 'bg-pink-500',    label: 'Physics ⚡' },
};

const SUBJECTS: Subject[] = ['Geography', 'Stars', 'Math', 'Phonics', 'Physics'];

const speak = (text: string) => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = 1.2;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
};

const QuizMode: React.FC<Props> = ({ twinName, onBack }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; correct: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const aiRef = useRef<GoogleGenAI | null>(null);

  const getAI = useCallback(() => {
    if (!aiRef.current) {
      // Support both AI Studio (process.env) and standalone Vite (import.meta.env)
      const key = (process.env.GEMINI_API_KEY as string) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      aiRef.current = new GoogleGenAI({ apiKey: key });
    }
    return aiRef.current;
  }, []);

  const generateQuestion = async (subject: Subject) => {
    setIsLoading(true);
    setFeedback(null);
    setQuestion(null);
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate a simple, fun quiz question for a 5-year-old about ${subject}.
Return ONLY valid JSON in this exact format:
{
  "question": "a short question here?",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0
}
Make the question engaging and age-appropriate. correctAnswer is the 0-based index of the correct option.`,
        config: { responseMimeType: 'application/json' },
      });
      const data = JSON.parse(response.text ?? '{}') as QuizQuestion;
      setQuestion(data);
      const optText = data.options.map((o, i) => `${i + 1}. ${o}`).join('. ');
      speak(`${data.question} Your choices are: ${optText}`);
    } catch (err) {
      console.error('Quiz generation failed', err);
      speak('Hmm, I could not load a question. Try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (!question || feedback) return;
    const correct = index === question.correctAnswer;
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    const msg = correct
      ? ['Amazing work!', 'Super smart!', 'You got it!', `Way to go, ${twinName}!`][Math.floor(Math.random() * 4)]
      : 'Not quite — the right answer was ' + question.options[question.correctAnswer] + '!';
    setFeedback({ msg, correct });
    speak(msg);
  };

  const handleSelectSubject = (s: Subject) => {
    setSelectedSubject(s);
    speak(`Let's do ${s}!`);
    generateQuestion(s);
  };

  // Subject picker screen
  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="glass p-3 rounded-full hover:bg-white/20 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-display font-bold">Pick a subject, {twinName}!</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SUBJECTS.map(s => {
            const cfg = SUBJECT_CONFIG[s];
            return (
              <motion.button
                key={s}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectSubject(s)}
                className="glass rounded-3xl p-8 flex flex-col items-center gap-4 hover:bg-white/20 transition-all group"
              >
                <div className={`p-5 rounded-2xl ${cfg.bg} shadow-lg group-hover:scale-110 transition-transform`}>
                  {cfg.icon}
                </div>
                <span className="text-xl font-display font-bold">{cfg.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  const cfg = SUBJECT_CONFIG[selectedSubject];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedSubject(null); setQuestion(null); setFeedback(null); }}
            className="glass p-3 rounded-full hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className={`p-3 rounded-2xl ${cfg.bg}`}>{cfg.icon}</div>
          <span className="text-xl font-display font-bold">{selectedSubject} Quiz</span>
        </div>
        <div className="glass px-4 py-2 rounded-full text-sm font-bold">
          ⭐ {score.correct}/{score.total}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-3xl p-12 flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 animate-spin text-white/60" />
            <p className="text-white/60 font-display text-xl">KidClaw is thinking...</p>
          </motion.div>
        )}

        {!isLoading && question && (
          <motion.div
            key={question.question}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            {/* Question card */}
            <div className="glass rounded-3xl p-8 text-center">
              <p className="text-3xl md:text-4xl font-display font-bold leading-tight">{question.question}</p>
            </div>

            {/* Answer buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((opt, i) => {
                let btnClass = 'glass-dark hover:bg-white/10 text-white';
                if (feedback) {
                  if (i === question.correctAnswer) btnClass = 'bg-emerald-500/80 border border-emerald-400 text-white';
                  else if (i !== question.correctAnswer) btnClass = 'bg-red-500/20 border border-red-500/30 text-white/40';
                }
                return (
                  <motion.button
                    key={i}
                    whileHover={!feedback ? { scale: 1.03 } : {}}
                    whileTap={!feedback ? { scale: 0.97 } : {}}
                    onClick={() => handleAnswer(i)}
                    disabled={!!feedback}
                    className={`rounded-3xl p-6 text-xl font-display font-medium flex items-center gap-5 text-left transition-all border border-white/10 ${btnClass}`}
                  >
                    <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg shrink-0">
                      {i + 1}
                    </span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center text-2xl font-display font-bold py-4 ${
                    feedback.correct ? 'text-emerald-400 text-glow' : 'text-orange-400'
                  }`}
                >
                  {feedback.correct ? '⭐ ' : '💡 '}{feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => generateQuestion(selectedSubject)}
                className="glass px-8 py-4 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all font-bold"
              >
                <RotateCcw className="w-5 h-5" /> New Question
              </button>
              <button
                onClick={() => speak(`${question.question} Your choices are: ${question.options.map((o, i) => `${i + 1}. ${o}`).join('. ')}`)}
                className="glass p-4 rounded-full hover:bg-white/20 transition-all"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizMode;
