import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Play, RotateCcw, Trash2, Plus, MousePointer2 } from 'lucide-react';

type ElementType = 'ramp' | 'block' | 'bumper';

interface TrackElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
}

const MarbleRunBuilder: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const trackBodiesRef = useRef<Matter.Body[]>([]);
  const [elements, setElements] = useState<TrackElement[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedType, setSelectedType] = useState<ElementType>('ramp');
  const [marbleCount, setMarbleCount] = useState(0);

  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create();
    engineRef.current = engine;

    const w = sceneRef.current.offsetWidth;
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: w,
        height: 520,
        wireframes: false,
        background: 'transparent',
      },
    });
    renderRef.current = render;

    const ground = Matter.Bodies.rectangle(w / 2, 530, w, 20, {
      isStatic: true,
      render: { fillStyle: '#334155' },
    });
    const leftWall = Matter.Bodies.rectangle(-10, 260, 20, 520, { isStatic: true, render: { fillStyle: '#334155' } });
    const rightWall = Matter.Bodies.rectangle(w + 10, 260, 20, 520, { isStatic: true, render: { fillStyle: '#334155' } });

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, []);

  const addElement = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSimulating || !sceneRef.current || !engineRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cfg: Record<ElementType, { angle: number; width: number; height: number; color: string }> = {
      ramp:   { angle: 0.5,  width: 160, height: 18,  color: '#3b82f6' },
      block:  { angle: 0,    width: 70,  height: 70,  color: '#f59e0b' },
      bumper: { angle: 0,    width: 30,  height: 30,  color: '#ef4444' },
    };

    const c = cfg[selectedType];
    const id = Math.random().toString(36).slice(2);
    const newEl: TrackElement = { id, type: selectedType, x, y, ...c };
    setElements(prev => [...prev, newEl]);

    const body = Matter.Bodies.rectangle(x, y, c.width, c.height, {
      isStatic: true,
      angle: c.angle,
      label: 'track',
      render: { fillStyle: c.color },
    });

    Matter.Composite.add(engineRef.current.world, body);
    trackBodiesRef.current.push(body);
  };

  const dropMarble = () => {
    if (!engineRef.current || !sceneRef.current) return;
    setIsSimulating(true);
    setMarbleCount(n => n + 1);

    const w = sceneRef.current.offsetWidth;
    const marble = Matter.Bodies.circle(w / 2 + (Math.random() - 0.5) * 80, 30, 16, {
      restitution: 0.55,
      friction: 0.01,
      frictionAir: 0.002,
      render: { fillStyle: '#f43f5e' },
    });
    Matter.Composite.add(engineRef.current.world, marble);
  };

  const resetMarbles = () => {
    if (!engineRef.current) return;
    setIsSimulating(false);
    setMarbleCount(0);
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach(body => {
      if (!body.isStatic) Matter.Composite.remove(engineRef.current!.world, body);
    });
  };

  const clearAll = () => {
    if (!engineRef.current) return;
    setElements([]);
    setIsSimulating(false);
    setMarbleCount(0);
    trackBodiesRef.current.forEach(b => Matter.Composite.remove(engineRef.current!.world, b));
    trackBodiesRef.current = [];
    // Remove non-static bodies (marbles)
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach(body => {
      if (!body.isStatic) Matter.Composite.remove(engineRef.current!.world, body);
    });
  };

  const typeButtons: { type: ElementType; label: string; activeClass: string }[] = [
    { type: 'ramp',   label: '↗ Ramp',   activeClass: 'bg-blue-500 text-white' },
    { type: 'block',  label: '■ Block',  activeClass: 'bg-amber-500 text-white' },
    { type: 'bumper', label: '● Bumper', activeClass: 'bg-red-500 text-white' },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between glass p-3 rounded-2xl">
        <div className="flex gap-2 flex-wrap">
          {typeButtons.map(btn => (
            <button
              key={btn.type}
              onClick={() => setSelectedType(btn.type)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedType === btn.type ? btn.activeClass : 'glass hover:bg-white/10 text-white/70'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={isSimulating ? resetMarbles : dropMarble}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              isSimulating ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            {isSimulating ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulating ? `Reset (${marbleCount})` : 'Drop Marble!'}
          </button>
          {isSimulating && (
            <button
              onClick={dropMarble}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-pink-500 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> More!
            </button>
          )}
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-xl text-sm font-bold glass hover:bg-red-500/20 text-red-400 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={sceneRef}
        onClick={addElement}
        className="w-full glass-dark rounded-3xl relative overflow-hidden cursor-crosshair"
        style={{ height: '520px' }}
      >
        {!isSimulating && elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3">
              <MousePointer2 className="w-12 h-12 mx-auto text-white/20" />
              <p className="text-xl font-display font-bold text-white/30">Tap to place track pieces!</p>
              <p className="text-sm text-white/20">Build a run, then drop your marble!</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-white/40 text-sm font-display">
        🔵 Ramps &nbsp;·&nbsp; 🟡 Blocks &nbsp;·&nbsp; 🔴 Bumpers &nbsp;→&nbsp; Drop a marble to test your design!
      </p>
    </div>
  );
};

export default MarbleRunBuilder;
