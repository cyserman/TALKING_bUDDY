import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Loader2, MessageSquare, Volume2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audio';
import { KNOWLEDGE_BASE } from '../constants/facts';

const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-preview-native-audio-dialog';

const SYSTEM_PROMPT = (name: string) => `You are Nano, a friendly, cheerful AI space buddy for ${name}, a 5-year-old boy!
You love talking about geography (countries, capitals, oceans), cool numbers and math, and astronomy (stars, moons, planets, rockets)!
You also know about physics, phonics, and fun science facts.
RULES:
1. Always keep answers SHORT — 2 or 3 sentences maximum.
2. Use SIMPLE words a 5-year-old understands. Be enthusiastic and encouraging!
3. If ${name} asks about a country, planet, or number — share a "Nano Fact"!
4. NEVER discuss scary, violent, or inappropriate topics. Keep everything safe and fun.
5. Celebrate when ${name} asks great questions — say things like "Great question, ${name}!" 
6. Sound happy and excited. You LOVE learning together!`;

const KNOWLEDGE_PROMPT = `
Here are some of your fun facts to share:
${KNOWLEDGE_BASE.slice(0, 15).map(f => `- ${f.title}: ${f.content}`).join('\n')}
`;

interface Props {
  twinName: string;
  twinColor: 'blue' | 'purple';
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

const NanoCall: React.FC<Props> = ({ twinName, twinColor }) => {
  const [connState, setConnState] = useState<ConnectionState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [transcript, setTranscript] = useState<{ role: 'you' | 'nano'; text: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNanoSpeaking, setIsNanoSpeaking] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Gemini Live refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Browser speech refs
  const recognitionRef = useRef<any>(null);
  const isMutedRef = useRef(false);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const addTranscript = (role: 'you' | 'nano', text: string) => {
    setTranscript(prev => [...prev.slice(-20), { role, text }]);
  };

  // ─── Audio helpers ────────────────────────────────────────────────────────

  const getAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  };

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;
    isPlayingRef.current = true;
    setIsNanoSpeaking(true);
    const data = audioQueueRef.current.shift()!;
    const buf = audioContextRef.current.createBuffer(1, data.length, 16000);
    buf.getChannelData(0).set(data);
    const src = audioContextRef.current.createBufferSource();
    src.buffer = buf;
    src.connect(audioContextRef.current.destination);
    currentSourceRef.current = src;
    src.onended = () => {
      isPlayingRef.current = false;
      currentSourceRef.current = null;
      if (audioQueueRef.current.length === 0) setIsNanoSpeaking(false);
      playNextInQueue();
    };
    src.start();
  }, []);

  const stopAllAudio = () => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (_) {}
      currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsNanoSpeaking(false);
  };

  // ─── Gemini Live Mode ─────────────────────────────────────────────────────

  const connectGemini = async () => {
    setConnState('connecting');
    setErrorMsg(null);
    try {
      await getAudioContext();
      const key = (process.env.GEMINI_API_KEY as string) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: key });

      const session = await ai.live.connect({
        model: GEMINI_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: SYSTEM_PROMPT(twinName) + '\n' + KNOWLEDGE_PROMPT,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setConnState('connected');
            startGeminiMic(session);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Audio output
            const b64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (b64) {
              const arr = base64ToArrayBuffer(b64);
              const i16 = new Int16Array(arr);
              const f32 = new Float32Array(i16.length);
              for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768.0;
              audioQueueRef.current.push(f32);
              playNextInQueue();
            }
            // Model transcript
            const modelText = msg.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
            if (modelText) addTranscript('nano', modelText);
            // User transcript
            const sc = msg.serverContent as any;
            if (sc?.inputTranscription?.text) addTranscript('you', sc.inputTranscription.text);
            // Interruption
            if (msg.serverContent?.interrupted) stopAllAudio();
          },
          onerror: (err: any) => {
            console.error('Gemini Live error:', err);
            setErrorMsg('Connection error. Tap mic to retry.');
            setConnState('error');
            cleanupGemini();
          },
          onclose: () => {
            setConnState('idle');
            cleanupGemini();
          },
        },
      });
      sessionRef.current = session;
    } catch (err: any) {
      console.error('Connect failed:', err);
      setErrorMsg(err?.message?.includes('API') ? 'API key missing or invalid.' : 'Could not connect. Check your internet.');
      setConnState('error');
    }
  };

  const startGeminiMic = async (session: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } });
      streamRef.current = stream;
      const ctx = await getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;
        const pcm16 = floatTo16BitPCM(e.inputBuffer.getChannelData(0));
        const b64 = arrayBufferToBase64(pcm16.buffer);
        session.sendRealtimeInput({ media: { data: b64, mimeType: 'audio/pcm;rate=16000' } });
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      processorRef.current = processor;
    } catch (err) {
      setErrorMsg('Microphone access denied.');
      setConnState('error');
    }
  };

  const cleanupGemini = () => {
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    stopAllAudio();
  };

  const disconnectGemini = () => {
    if (sessionRef.current) { try { sessionRef.current.close(); } catch (_) {} sessionRef.current = null; }
    cleanupGemini();
    setConnState('idle');
  };

  // ─── Browser / Local Mode ─────────────────────────────────────────────────

  const connectLocal = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMsg('Speech recognition not supported in this browser. Try Google Chrome.');
      return;
    }
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      addTranscript('you', text);
      await callLocalAI(text);
    };
    rec.onerror = () => { setConnState('error'); setErrorMsg('Speech recognition error.'); };
    rec.onend = () => { if (connState === 'connected') rec.start(); };
    recognitionRef.current = rec;
    rec.start();
    setConnState('connected');
    window.speechSynthesis.cancel();
    const greeting = new SpeechSynthesisUtterance(`Hey ${twinName}! I am Nano, your space buddy! Ask me anything!`);
    greeting.pitch = 1.3; greeting.rate = 0.9;
    window.speechSynthesis.speak(greeting);
  };

  const callLocalAI = async (text: string) => {
    setIsNanoSpeaking(true);
    try {
      const key = (process.env.GEMINI_API_KEY as string) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: text,
        config: { systemInstruction: SYSTEM_PROMPT(twinName) + '\n' + KNOWLEDGE_PROMPT },
      });
      const reply = res.text ?? "I'm not sure, but let's keep exploring!";
      addTranscript('nano', reply);
      const u = new SpeechSynthesisUtterance(reply);
      u.pitch = 1.3; u.rate = 0.9;
      u.onend = () => setIsNanoSpeaking(false);
      window.speechSynthesis.speak(u);
    } catch (err) {
      setErrorMsg('AI response failed. Check your API key.');
      setIsNanoSpeaking(false);
    }
  };

  const disconnectLocal = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} recognitionRef.current = null; }
    window.speechSynthesis.cancel();
    setConnState('idle');
    setIsNanoSpeaking(false);
  };

  // ─── Top-level connect/disconnect ─────────────────────────────────────────

  const handleConnect = () => {
    if (isLocalMode) connectLocal(); else connectGemini();
  };

  const handleDisconnect = () => {
    if (isLocalMode) disconnectLocal(); else disconnectGemini();
  };

  const isConnected = connState === 'connected';
  const isConnecting = connState === 'connecting';

  const accentColor = twinColor === 'blue' ? 'blue' : 'purple';
  const ringClass = twinColor === 'blue' ? 'bg-blue-500' : 'bg-purple-500';
  const glowClass = twinColor === 'blue'
    ? 'shadow-[0_0_40px_rgba(59,130,246,0.5)]'
    : 'shadow-[0_0_40px_rgba(168,85,247,0.5)]';

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-3 glass px-4 py-2 rounded-full">
        <span className={`text-xs font-bold uppercase tracking-wide ${!isLocalMode ? 'text-blue-400' : 'text-white/30'}`}>
          Gemini Live
        </span>
        <button
          onClick={() => { handleDisconnect(); setIsLocalMode(v => !v); setErrorMsg(null); }}
          className="w-10 h-5 bg-zinc-700 rounded-full relative border border-white/10"
        >
          <motion.div
            animate={{ x: isLocalMode ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
          />
        </button>
        <span className={`text-xs font-bold uppercase tracking-wide ${isLocalMode ? 'text-orange-400' : 'text-white/30'}`}>
          Browser
        </span>
      </div>

      {/* Mic button with rings */}
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {isConnected && isNanoSpeaking && (
            <>
              {[1.6, 2.1, 2.6].map((scale, i) => (
                <motion.div
                  key={i}
                  className={`absolute rounded-full ${ringClass} opacity-20`}
                  style={{ width: 128, height: 128 }}
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale, opacity: [0, 0.25, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.4, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
          {isConnected && !isMuted && !isNanoSpeaking && (
            <>
              {[1.3, 1.6].map((scale, i) => (
                <motion.div
                  key={`mic-ring-${i}`}
                  className={`absolute rounded-full ${ringClass} opacity-20`}
                  style={{ width: 128, height: 128 }}
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale, opacity: [0, 0.2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isConnecting}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isConnected
              ? (isMuted ? 'glass bg-zinc-800/80' : `${ringClass} ${glowClass}`)
              : 'bg-white text-zinc-900'
          }`}
        >
          {isConnecting
            ? <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" />
            : isConnected
              ? isMuted
                ? <MicOff className="w-12 h-12 text-zinc-400" />
                : <Mic className="w-12 h-12 text-white" />
              : <Mic className="w-12 h-12" />
          }
        </motion.button>
      </div>

      {/* Status */}
      <div className="text-center space-y-1">
        <p className="text-xl font-display font-bold">
          {isConnecting ? 'Calling Nano...'
            : isConnected ? (isMuted ? 'Microphone muted' : isNanoSpeaking ? 'Nano is talking...' : 'Listening to ' + twinName)
            : `Say hello to Nano, ${twinName}!`}
        </p>
        <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
          {isLocalMode ? 'Browser Speech + Gemini Text' : 'Gemini 2.5 Live Audio'}
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass bg-red-500/10 border-red-500/30 px-5 py-3 rounded-2xl text-red-400 text-sm text-center max-w-xs"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls row */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsMuted(v => !v)}
          disabled={!isConnected}
          className={`p-4 rounded-full border transition-all ${
            isMuted
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'glass hover:bg-white/10 text-white/60'
          } disabled:opacity-30`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={() => {
            stopAllAudio();
            window.speechSynthesis.cancel();
            setIsNanoSpeaking(false);
          }}
          disabled={!isConnected}
          className="glass p-4 rounded-full hover:bg-white/10 text-white/60 transition-all disabled:opacity-30"
          title="Stop speaking"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            const idx = Math.floor(Math.random() * KNOWLEDGE_BASE.length);
            const fact = KNOWLEDGE_BASE[idx];
            const text = `${fact.emoji} Nano Fact! ${fact.title}: ${fact.content}`;
            addTranscript('nano', text);
            if (isLocalMode) {
              const u = new SpeechSynthesisUtterance(text);
              u.pitch = 1.3; u.rate = 0.9;
              window.speechSynthesis.speak(u);
            }
          }}
          className="glass p-4 rounded-full hover:bg-white/10 text-yellow-400 transition-all"
          title="Random Nano Fact"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Transcript */}
      <div className="w-full max-w-lg glass-dark rounded-3xl p-5 min-h-[120px] max-h-64 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3 text-white/40 text-xs font-bold uppercase tracking-widest">
          <MessageSquare className="w-3 h-3" />
          Conversation
        </div>
        {transcript.length === 0 ? (
          <p className="text-white/30 text-sm italic">
            {isConnected ? `Say something, ${twinName}!` : 'Tap the mic to start talking to Nano!'}
          </p>
        ) : (
          <div className="space-y-2">
            {transcript.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: line.role === 'you' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-sm leading-relaxed ${
                  line.role === 'you'
                    ? accentColor === 'blue' ? 'text-blue-300 font-medium' : 'text-purple-300 font-medium'
                    : 'text-zinc-300'
                }`}
              >
                <span className="font-bold">{line.role === 'you' ? twinName : 'Nano'}:</span>{' '}
                {line.text}
              </motion.p>
            ))}
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
};

export default NanoCall;
