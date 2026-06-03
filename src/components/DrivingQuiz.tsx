import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text as KonvaText } from 'react-konva';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Props {
  question: QuizQuestion;
  onAnswer: (index: number) => void;
  onNewQuestion: () => void;
}

const speak = (text: string) => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = 1.2;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
};

export const DrivingQuiz: React.FC<Props> = ({ question, onAnswer, onNewQuestion }) => {
  const [carX, setCarX] = useState(0);
  const [blocks, setBlocks] = useState<{ id: number; text: string; x: number; y: number; index: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isNanoMode, setIsNanoMode] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 520 });
  const requestRef = useRef<number | null>(null);
  const gameOverRef = useRef(false);

  // Reset whenever question changes
  useEffect(() => {
    gameOverRef.current = false;
    setGameOver(false);
    setCorrect(null);

    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      setDimensions({ width: w, height: h });
      setCarX(w / 2 - 30);

      const spacing = w / question.options.length;
      const newBlocks = question.options.map((opt, i) => ({
        id: i,
        text: opt,
        x: spacing * i + spacing / 2 - 50,
        y: -80 - i * 40,
        index: i,
      }));
      setBlocks(newBlocks);
    }
    speak(question.question);
  }, [question]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setBlocks(prev => {
        const speed = isNanoMode ? 7 : 3;
        const next = prev.map(b => ({ ...b, y: b.y + speed }));

        if (!gameOverRef.current && containerRef.current) {
          const carY = dimensions.height - 130;
          const hitBlock = next.find(
            b => b.y + 60 > carY && b.y < carY + 100 && Math.abs(b.x + 50 - (carX + 30)) < 55
          );
          if (hitBlock) {
            gameOverRef.current = true;
            setGameOver(true);
            const isCorrect = hitBlock.index === question.correctAnswer;
            setCorrect(isCorrect);
            onAnswer(hitBlock.index);
            speak(isCorrect ? 'Amazing! That is correct!' : 'Not quite! Try again!');
            return next;
          }
          // Reset blocks if they all scroll past
          if (next.every(b => b.y > dimensions.height + 20)) {
            const spacing = dimensions.width / question.options.length;
            return question.options.map((opt, i) => ({
              id: i,
              text: opt,
              x: spacing * i + spacing / 2 - 50,
              y: -80 - i * 40,
              index: i,
            }));
          }
        }
        return next;
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [dimensions, isNanoMode, carX, question]);

  const handlePointerMove = (e: any) => {
    if (gameOver) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (pos) setCarX(Math.max(0, Math.min(pos.x - 30, dimensions.width - 60)));
  };

  const toggleNano = () => {
    setIsNanoMode(v => !v);
    if (!isNanoMode) speak('NanoClaw Turbo Mode! Zoom zoom!');
  };

  const carColor = isNanoMode ? '#06b6d4' : '#f43f5e';
  const shadowColor = isNanoMode ? '#06b6d4' : '#f43f5e';

  return (
    <div className="space-y-4">
      {/* Question banner */}
      <div className="glass rounded-2xl px-6 py-4 text-center">
        <p className="text-xl font-display font-bold leading-tight">{question.question}</p>
        <p className="text-white/50 text-sm mt-1">Steer with your finger — smash the right answer!</p>
      </div>

      <div ref={containerRef} className="w-full glass-dark rounded-3xl overflow-hidden relative" style={{ height: '520px' }}>
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
        >
          <Layer>
            {/* Road lane lines */}
            {[1, 2, 3].map(i => (
              <Rect
                key={i}
                x={(dimensions.width / 4) * i}
                y={0}
                width={3}
                height={dimensions.height}
                fill={isNanoMode ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.15)'}
                dash={[24, 16]}
              />
            ))}

            {/* Answer blocks falling down */}
            {blocks.map(b => (
              <React.Fragment key={b.id}>
                <Rect
                  x={b.x} y={b.y}
                  width={100} height={60}
                  fill={
                    gameOver
                      ? b.index === question.correctAnswer ? '#10b981' : '#ef4444'
                      : isNanoMode ? '#0891b2' : '#3b82f6'
                  }
                  cornerRadius={12}
                  shadowBlur={12}
                  shadowColor={isNanoMode ? '#06b6d4' : '#3b82f6'}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1.5}
                />
                <KonvaText
                  text={b.text}
                  x={b.x} y={b.y + 18}
                  width={100}
                  align="center"
                  fill="white"
                  fontSize={16}
                  fontStyle="bold"
                />
              </React.Fragment>
            ))}

            {/* The Race Car */}
            {/* Body */}
            <Rect
              x={carX} y={dimensions.height - 130}
              width={60} height={100}
              fill={carColor}
              cornerRadius={14}
              shadowBlur={24}
              shadowColor={shadowColor}
              shadowOpacity={0.8}
            />
            {/* Windshield */}
            <Rect x={carX + 8} y={dimensions.height - 120} width={44} height={28} fill="rgba(148,163,184,0.7)" cornerRadius={6} />
            {/* Rear window */}
            <Rect x={carX + 8} y={dimensions.height - 65} width={44} height={18} fill="rgba(148,163,184,0.5)" cornerRadius={4} />
            {/* Headlights */}
            <Circle x={carX + 14} y={dimensions.height - 125} radius={6} fill={isNanoMode ? '#00ffff' : '#fef08a'} shadowBlur={12} shadowColor={isNanoMode ? 'cyan' : 'yellow'} />
            <Circle x={carX + 46} y={dimensions.height - 125} radius={6} fill={isNanoMode ? '#00ffff' : '#fef08a'} shadowBlur={12} shadowColor={isNanoMode ? 'cyan' : 'yellow'} />

            {/* Result overlay */}
            {gameOver && (
              <KonvaText
                text={correct ? '⭐ CORRECT! ⭐' : '✗ Try Again!'}
                x={0} y={dimensions.height / 2 - 40}
                width={dimensions.width}
                align="center"
                fill={correct ? '#fbbf24' : '#f87171'}
                fontSize={52}
                fontStyle="bold"
                shadowBlur={20}
                shadowColor={correct ? '#f59e0b' : '#ef4444'}
              />
            )}
          </Layer>
        </Stage>

        {/* Nano Mode Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleNano}
            className={`p-3 rounded-2xl glass transition-all flex flex-col items-center gap-1 ${isNanoMode ? 'bg-cyan-500/40 border-cyan-400/60' : ''}`}
          >
            <Sparkles className={`w-6 h-6 ${isNanoMode ? 'text-cyan-300 animate-spin' : 'text-cyan-400'}`} />
            <span className="text-[9px] font-bold uppercase tracking-wide text-white/70">Nano</span>
          </button>
        </div>

        {/* Next race overlay */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-end justify-center pb-12 bg-black/30 backdrop-blur-sm"
          >
            <button
              onClick={() => {
                gameOverRef.current = false;
                setGameOver(false);
                setCorrect(null);
                onNewQuestion();
              }}
              className="glass px-12 py-5 rounded-full text-2xl font-display font-bold hover:bg-white/30 transition-all"
            >
              Next Race! 🏎️
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DrivingQuiz;
