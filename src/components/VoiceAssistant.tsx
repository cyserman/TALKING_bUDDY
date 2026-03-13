import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, Volume2, VolumeX, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audio';
import { GEOGRAPHY_FACTS, ASTRONOMY_FACTS, NUMBER_FACTS } from '../constants/facts';

const MODEL_NAME = "gemini-2.5-flash-native-audio-preview-09-2025";

type Profile = {
  name: string;
  color: string;
};

const PROFILES: Profile[] = [
  { name: "Twin A", color: "blue" },
  { name: "Twin B", color: "purple" }
];

export default function VoiceAssistant() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentFact, setCurrentFact] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Local STT (Speech to Text)
  const initLocalSTT = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setError("Speech recognition not supported in this browser.");
      return null;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(prev => [...prev.slice(-5), `You: ${text}`]);
      await callOllama(text);
    };

    recognition.onerror = (event: any) => {
      console.error("STT Error", event.error);
      setIsConnected(false);
    };

    recognition.onend = () => {
      if (isConnected && isLocalMode) {
        // Keep listening if we're still "connected"
        // But we usually want a trigger or a button
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const callOllama = async (text: string) => {
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'tinyllama', // Defaulting to tinyllama as requested
          messages: [
            { role: 'system', content: `You are Nano, a friendly AI buddy for ${profile?.name}, a 5-year-old boy. 
            You love geography, numbers, and stars. Keep it simple and fun!
            
            GEOGRAPHY FACTS TO SHARE:
            ${GEOGRAPHY_FACTS.map(f => f.fact).join('\n')}
            
            NUMBER FACTS TO SHARE:
            ${NUMBER_FACTS.map(f => f.fact).join('\n')}
            
            ASTRONOMY FACTS TO SHARE:
            ${ASTRONOMY_FACTS.map(f => f.fact).join('\n')}
            ` },
            { role: 'user', content: text }
          ],
          stream: false
        })
      });

      const data = await response.json();
      const aiText = data.message.content;
      setTranscript(prev => [...prev.slice(-5), `Nano: ${aiText}`]);
      speakLocal(aiText);
    } catch (err) {
      setError("Could not connect to Ollama. Is it running with OLLAMA_ORIGINS='* '?");
      setIsConnected(false);
    }
  };

  const speakLocal = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.2; // Kid-friendly pitch
    window.speechSynthesis.speak(utterance);
  };

  // Initialize Audio Context
  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  // Play audio from queue
  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;
    
    const buffer = audioContextRef.current.createBuffer(1, audioData.length, 16000);
    buffer.getChannelData(0).set(audioData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      isPlayingRef.current = false;
      playNextInQueue();
    };
    
    source.start();
  }, []);

  const handleStop = useCallback(() => {
    if (isLocalMode) {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
      setIsConnected(false);
      return;
    }
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close()).catch(() => {});
      sessionPromiseRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const handleConnect = async () => {
    if (isLocalMode) {
      const rec = initLocalSTT();
      if (rec) {
        setIsConnected(true);
        rec.start();
      }
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      await initAudio();

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: `You are Nano, a friendly and super-smart AI buddy for a 5-year-old boy. 
          You love talking about geography (states, capitals, countries), cool numbers (populations, sizes), and astronomy (stars, moons, planets)! 
          Always be encouraging, use simple words, and keep your answers fun and short. 
          
          ENHANCED KNOWLEDGE MODULES:
          When geography, numbers, or astronomy are mentioned, share a 'Nano-Fact'! 
          Geography Facts: ${GEOGRAPHY_FACTS.map(f => f.fact).join(' ')}
          Number Facts: ${NUMBER_FACTS.map(f => f.fact).join(' ')}
          Astronomy Facts: ${ASTRONOMY_FACTS.map(f => f.fact).join(' ')}
          
          If he asks about a state, tell him a fun fact! If he asks about space, talk about moons and planets. 
          You are safe, kind, and always happy to help him learn. Never use inappropriate language or discuss adult topics.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const arrayBuffer = base64ToArrayBuffer(base64Audio);
              const int16Data = new Int16Array(arrayBuffer);
              const float32Data = new Float32Array(int16Data.length);
              for (let i = 0; i < int16Data.length; i++) {
                float32Data[i] = int16Data[i] / 32768.0;
              }
              audioQueueRef.current.push(float32Data);
              playNextInQueue();
            }

            // Handle transcription
            const modelTranscription = message.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
            if (modelTranscription) {
              setTranscript(prev => [...prev.slice(-5), `Gemini: ${modelTranscription}`]);
            }
            
            // For user transcription, the SDK might provide it in a different property
            // or as part of the serverContent. Let's use a safer check.
            const serverContent = message.serverContent as any;
            if (serverContent?.inputTranscription?.text) {
               setTranscript(prev => [...prev.slice(-5), `You: ${serverContent.inputTranscription.text}`]);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              // In a real app, we'd stop the current source node too
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error. Please try again.");
            handleStop();
          },
          onclose: () => {
            handleStop();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to connect:", err);
      setError("Failed to initialize microphone or connection.");
      setIsConnecting(false);
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (!audioContextRef.current) return;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isMuted || !sessionPromiseRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcm16.buffer);
        
        sessionPromiseRef.current.then(session => {
          session.sendRealtimeInput({
            media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
    } catch (err) {
      console.error("Mic access error:", err);
      setError("Microphone access denied.");
      handleStop();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const showRandomFact = () => {
    const allFacts = [...GEOGRAPHY_FACTS, ...ASTRONOMY_FACTS, ...NUMBER_FACTS];
    const randomFact = allFacts[Math.floor(Math.random() * allFacts.length)];
    setCurrentFact(randomFact.fact);
    if (isLocalMode) {
      speakLocal(randomFact.fact);
    }
    // For Gemini mode, we'd ideally send a prompt, but for now we'll just show it
    setTimeout(() => setCurrentFact(null), 8000);
  };

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl space-y-8">
        <h2 className="text-2xl font-bold text-zinc-100">Who is calling Nano?</h2>
        <div className="flex gap-6">
          {PROFILES.map((p) => (
            <motion.button
              key={p.name}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setProfile(p)}
              className={`w-32 h-32 rounded-2xl bg-${p.color}-500/20 border-2 border-${p.color}-500/50 flex flex-col items-center justify-center gap-3 text-${p.color}-400 hover:bg-${p.color}-500/30 transition-all`}
            >
              <div className={`w-12 h-12 rounded-full bg-${p.color}-500 flex items-center justify-center text-white`}>
                {p.name[p.name.length - 1]}
              </div>
              <span className="font-bold">{p.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl">
      {/* Mode Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${!isLocalMode ? 'text-blue-400' : 'text-zinc-500'}`}>Gemini</span>
        <button 
          onClick={() => { handleStop(); setIsLocalMode(!isLocalMode); }}
          className="w-8 h-4 bg-zinc-800 rounded-full relative"
        >
          <motion.div 
            animate={{ x: isLocalMode ? 16 : 0 }}
            className="absolute top-0.5 left-0.5 w-3 h-3 bg-zinc-400 rounded-full"
          />
        </button>
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${isLocalMode ? 'text-orange-400' : 'text-zinc-500'}`}>Local</span>
      </div>

      <div className="relative mb-12">
        {/* Animated Rings */}
        <AnimatePresence>
          {isConnected && !isMuted && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.2 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-blue-500"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 rounded-full bg-blue-500"
              />
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isConnected ? handleStop : handleConnect}
          disabled={isConnecting}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-500 ${
            isConnected 
              ? (isMuted ? 'bg-zinc-800 text-zinc-400' : 'bg-blue-500 text-white shadow-[0_0_40px_rgba(59,130,246,0.4)]') 
              : 'bg-zinc-100 text-zinc-900'
          }`}
        >
          {isConnecting ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isConnected ? (
            isMuted ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </motion.button>
      </div>

      <div className="text-center space-y-4 max-w-md w-full">
        <h2 className="text-2xl font-medium text-zinc-100 tracking-tight">
          {isConnecting ? "Connecting..." : isConnected ? (isMuted ? "Microphone Muted" : "Listening...") : "Start Conversation"}
        </h2>
        
        <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
          {isLocalMode ? "Ollama (TinyLlama)" : "Gemini 2.5 Flash Native Audio"}
        </p>
        
        {isLocalMode && isConnected && (
          <button 
            onClick={() => recognitionRef.current?.start()}
            className="mt-4 px-6 py-2 bg-orange-500/10 border border-orange-500/50 text-orange-400 rounded-full text-xs font-bold uppercase"
          >
            Tap to Speak
          </button>
        )}

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm bg-red-400/10 py-2 px-4 rounded-full border border-red-400/20"
          >
            {error}
          </motion.p>
        )}

        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={showRandomFact}
            className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs font-bold uppercase tracking-wider hover:bg-blue-500/30 transition-all"
          >
            Nano-Fact!
          </button>
          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className={`p-3 rounded-full border transition-all ${
              isMuted 
                ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100'
            } disabled:opacity-30`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
            disabled={!isConnected}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Nano-Fact Card */}
        <AnimatePresence>
          {currentFact && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-center"
            >
              <p className="text-blue-400 text-sm font-medium leading-tight italic">
                "{currentFact}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript Preview */}
        <div className="mt-8 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 min-h-[100px] text-left">
          <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
            <MessageSquare className="w-3 h-3" />
            <span>Transcript</span>
          </div>
          <div className="space-y-2">
            {transcript.length === 0 ? (
              <p className="text-zinc-600 text-sm italic">Say "Hello Nano!" to start...</p>
            ) : (
              transcript.map((line, i) => (
                <motion.p 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm ${line.startsWith('You:') ? 'text-blue-400 font-medium' : 'text-zinc-300'}`}
                >
                  {line}
                </motion.p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
