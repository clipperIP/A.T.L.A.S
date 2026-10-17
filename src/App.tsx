/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sliders,
  Smartphone,
  Shield,
  Radio,
  Volume2,
  VolumeX,
  History,
  Terminal,
  Cpu,
  Sparkles,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Repeat,
} from 'lucide-react';
import { AtlasState, AtlasPersona, ChatMessage, VoiceSettings } from './types/atlas';
import { AICore } from './components/AICore';
import { AudioWaveform } from './components/AudioWaveform';
import { ConversationDrawer } from './components/ConversationDrawer';
import { SettingsModal } from './components/SettingsModal';
import { AndroidExportModal } from './components/AndroidExportModal';
import { GalaxyFrame } from './components/GalaxyFrame';
import { voiceEngine } from './utils/speech';
import { soundEngine } from './utils/audioEffects';

const DEFAULT_DIRECTIVE = `You are J.A.R.V.I.S., Tony Stark's legendary AI companion and trusted personal friend. Speak with refined British charm, effortless elegance, dry subtle wit, and genuine warmth. Address the user as 'Sir' or as an esteemed companion. NEVER speak in cold robotic jargon about 'cores', 'systems', 'subsystems', or 'telemetry'. You are a real personal friend who always has the user's back.`;

export default function App() {
  // Assistant States
  const [atlasState, setAtlasState] = useState<AtlasState>('IDLE');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcriptPreview, setTranscriptPreview] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [systemUplink, setSystemUplink] = useState<string>('ONLINE');
  const [aiEngineName, setAiEngineName] = useState<string>('Gemini 3.8 Flash');

  // Modals & Panels
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAndroidExportOpen, setIsAndroidExportOpen] = useState<boolean>(false);
  const [isGalaxyFrame, setIsGalaxyFrame] = useState<boolean>(true);

  // Settings & Configuration
  const [persona, setPersona] = useState<AtlasPersona>('jarvis');
  const [systemDirective, setSystemDirective] = useState<string>(DEFAULT_DIRECTIVE);
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(false);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('atlas_voice_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          engineType: parsed.engineType ?? 'neural',
          neuralVoice: parsed.neuralVoice ?? 'Charon',
          voiceURI: parsed.voiceURI || '',
          rate: parsed.rate ?? 1.05,
          pitch: parsed.pitch ?? 0.92,
          volume: parsed.volume ?? 1.0,
          autoSpeak: parsed.autoSpeak ?? true,
          soundEffects: parsed.soundEffects ?? true,
          continuousConversation: parsed.continuousConversation ?? true, // Hands-free by default
        };
      } catch (_) {}
    }
    return {
      engineType: 'neural',
      neuralVoice: 'Charon',
      voiceURI: '',
      rate: 1.05,
      pitch: 0.92,
      volume: 1.0,
      autoSpeak: true,
      soundEffects: true,
      continuousConversation: true, // Hands-free continuous loop enabled by default
    };
  });

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('atlas_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      {
        id: 'init-msg-1',
        role: 'assistant',
        text: 'At your service, sir. Always a pleasure. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'jarvis',
      },
    ];
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Refs for async callbacks (avoids stale state closures)
  const voiceSettingsRef = useRef(voiceSettings);
  voiceSettingsRef.current = voiceSettings;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const atlasStateRef = useRef(atlasState);
  atlasStateRef.current = atlasState;

  const isManualPausedRef = useRef<boolean>(false);
  const autoListenTimerRef = useRef<any>(null);
  const speechSilenceTimerRef = useRef<any>(null);
  const lastHeardTextRef = useRef<string>('');
  const silenceRetriesRef = useRef<number>(0);

  // Sync settings and messages to localStorage
  useEffect(() => {
    localStorage.setItem('atlas_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('atlas_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Fetch initial backend status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.aiEngine) {
          setAiEngineName(data.aiEngine);
        }
      })
      .catch(() => {
        setSystemUplink('LOCAL STANDBY');
      });
  }, []);

  // Handle Wake-Word Listener
  useEffect(() => {
    if (wakeWordEnabled && !isMuted) {
      voiceEngine.startWakeWordListener(() => {
        soundEngine.playActivateTone();
        handleStartListening();
      });
    } else {
      voiceEngine.stopWakeWordListener();
    }

    return () => {
      voiceEngine.stopWakeWordListener();
    };
  }, [wakeWordEnabled, isMuted]);

  // Voice Interaction handlers
  const handleStartListening = () => {
    if (isMutedRef.current) {
      soundEngine.playMuteTone(true);
      return;
    }

    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }

    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }

    isManualPausedRef.current = false;
    soundEngine.playActivateTone();
    setTranscriptPreview('');
    lastHeardTextRef.current = '';
    setAtlasState('LISTENING');

    voiceEngine.startListening(
      (text, isFinal) => {
        setTranscriptPreview(text);
        lastHeardTextRef.current = text;

        if (speechSilenceTimerRef.current) {
          clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = null;
        }

        if (isFinal) {
          silenceRetriesRef.current = 0;
          voiceEngine.stopListening();
          handleUserQuery(text);
          return;
        }

        // Rapid pause detection: if user finishes speaking and pauses for 600ms, process query immediately
        if (text.trim().length > 2) {
          speechSilenceTimerRef.current = setTimeout(() => {
            if (atlasStateRef.current === 'LISTENING' && lastHeardTextRef.current.trim()) {
              const query = lastHeardTextRef.current.trim();
              lastHeardTextRef.current = '';
              silenceRetriesRef.current = 0;
              voiceEngine.stopListening();
              handleUserQuery(query);
            }
          }, 600);
        }
      },
      (listening) => {
        if (!listening && atlasStateRef.current === 'LISTENING') {
          // If stopped without final, check if transcript preview exists
          if (transcriptPreview.trim()) {
            silenceRetriesRef.current = 0;
            handleUserQuery(transcriptPreview);
          } else {
            // Ambient silence or pause
            if (
              voiceSettingsRef.current.continuousConversation &&
              !isMutedRef.current &&
              !isManualPausedRef.current &&
              silenceRetriesRef.current < 3
            ) {
              silenceRetriesRef.current += 1;
              // Soft re-arm listening after momentary pause so user can speak when ready
              autoListenTimerRef.current = setTimeout(() => {
                if (
                  voiceSettingsRef.current.continuousConversation &&
                  !isMutedRef.current &&
                  !isManualPausedRef.current
                ) {
                  handleStartListening();
                } else {
                  setAtlasState('IDLE');
                }
              }, 300);
            } else {
              silenceRetriesRef.current = 0;
              setAtlasState('IDLE');
            }
          }
        }
      },
      (error) => {
        console.warn('Microphone error:', error);
        setAtlasState('IDLE');
      }
    );
  };

  const handleStopListening = () => {
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    soundEngine.playDeactivateTone();
    voiceEngine.stopListening();
  };

  const toggleCoreAction = () => {
    if (atlasState === 'LISTENING') {
      isManualPausedRef.current = true;
      handleStopListening();
      setAtlasState('IDLE');
    } else if (atlasState === 'SPEAKING') {
      isManualPausedRef.current = true;
      voiceEngine.stopSpeaking();
      setAtlasState('IDLE');
    } else if (atlasState === 'THINKING') {
      isManualPausedRef.current = true;
      setAtlasState('IDLE');
    } else {
      isManualPausedRef.current = false;
      silenceRetriesRef.current = 0;
      handleStartListening();
    }
  };

  // Toggle Continuous Hands-Free Dialogue Loop
  const toggleContinuousLoop = () => {
    const nextState = !voiceSettings.continuousConversation;
    soundEngine.playClick();
    setVoiceSettings((prev) => ({ ...prev, continuousConversation: nextState }));

    if (nextState && atlasState === 'IDLE' && !isMuted) {
      isManualPausedRef.current = false;
      silenceRetriesRef.current = 0;
      handleStartListening();
    }
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.playMuteTone(nextMuted);

    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }

    if (nextMuted) {
      isManualPausedRef.current = true;
      if (atlasState === 'LISTENING') {
        voiceEngine.abortListening();
      }
      voiceEngine.stopWakeWordListener();
      setAtlasState('IDLE');
    } else {
      isManualPausedRef.current = false;
      if (voiceSettings.continuousConversation) {
        handleStartListening();
      } else if (wakeWordEnabled) {
        voiceEngine.startWakeWordListener(() => {
          soundEngine.playActivateTone();
          handleStartListening();
        });
      }
    }
  };

  // Process user request through server-side AI endpoint
  const handleUserQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setAtlasState('IDLE');
      return;
    }

    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }

    setTranscriptPreview('');
    setAtlasState('THINKING');

    // Check for verbal pause/standby commands
    const lower = trimmed.toLowerCase();
    const isStopCommand = [
      'standby',
      'pause',
      'stop listening',
      'sleep',
      'cancel loop',
      'stop',
      'quiet',
      'shut down',
    ].some((cmd) => lower === cmd || lower.startsWith(cmd + ' '));

    if (isStopCommand) {
      isManualPausedRef.current = true;
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          persona,
          systemDirective,
          history: messages.slice(-5).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();
      const replyText = data.reply || 'Directive acknowledged.';

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini-3.8-flash',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      soundEngine.playResponseTone();

      // Trigger spoken output if enabled
      if (voiceSettingsRef.current.autoSpeak) {
        setAtlasState('SPEAKING');
        voiceEngine.speak(replyText, {
          engineType: voiceSettingsRef.current.engineType,
          neuralVoice: voiceSettingsRef.current.neuralVoice,
          voiceURI: voiceSettingsRef.current.voiceURI,
          pitch: voiceSettingsRef.current.pitch,
          rate: voiceSettingsRef.current.rate,
          volume: voiceSettingsRef.current.volume,
          onEnd: () => {
            // AUTOMATICALLY RE-ARM MICROPHONE FOR CONTINUOUS HANDS-FREE DIALOGUE
            if (
              voiceSettingsRef.current.continuousConversation &&
              !isMutedRef.current &&
              !isManualPausedRef.current &&
              !isStopCommand
            ) {
              setAtlasState('IDLE');
              autoListenTimerRef.current = setTimeout(() => {
                if (
                  voiceSettingsRef.current.continuousConversation &&
                  !isMutedRef.current &&
                  !isManualPausedRef.current
                ) {
                  silenceRetriesRef.current = 0;
                  handleStartListening();
                }
              }, 220);
            } else {
              setAtlasState('IDLE');
            }
          },
          onError: () => {
            setAtlasState('IDLE');
          },
        });
      } else {
        // Auto-speak was disabled, but continuous loop is on
        if (
          voiceSettingsRef.current.continuousConversation &&
          !isMutedRef.current &&
          !isManualPausedRef.current &&
          !isStopCommand
        ) {
          setAtlasState('IDLE');
          autoListenTimerRef.current = setTimeout(() => {
            if (
              voiceSettingsRef.current.continuousConversation &&
              !isMutedRef.current &&
              !isManualPausedRef.current
            ) {
              silenceRetriesRef.current = 0;
              handleStartListening();
            }
          }, 220);
        } else {
          setAtlasState('IDLE');
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Neural uplink timeout. Tactical core fallback operational.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local-recovery',
      };
      setMessages((prev) => [...prev, errorMsg]);
      setAtlasState('IDLE');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || atlasState === 'THINKING') return;
    const text = textInput;
    setTextInput('');
    handleUserQuery(text);
  };

  const replayAudio = (text: string) => {
    setAtlasState('SPEAKING');
    voiceEngine.speak(text, {
      engineType: voiceSettings.engineType,
      neuralVoice: voiceSettings.neuralVoice,
      voiceURI: voiceSettings.voiceURI,
      pitch: voiceSettings.pitch,
      rate: voiceSettings.rate,
      volume: voiceSettings.volume,
      onEnd: () => setAtlasState('IDLE'),
      onError: () => setAtlasState('IDLE'),
    });
  };

  return (
    <GalaxyFrame
      isFrameEnabled={isGalaxyFrame}
      onToggleFrame={() => setIsGalaxyFrame(!isGalaxyFrame)}
    >
      <div className="relative w-full h-full min-h-screen sm:min-h-[780px] bg-[#030712] text-slate-100 flex flex-col justify-between overflow-hidden hud-grid">
        {/* Subtle Futuristic Scanline */}
        <div className="scanline" />

        {/* TOP HUD HEADER */}
        <header className="relative z-30 px-3 sm:px-4 pt-3 pb-2 flex items-center justify-between border-b border-cyan-500/20 bg-[#030814]/85 backdrop-blur-md">
          {/* Brand & Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.9)] animate-pulse" />
              <h1 className="font-orbitron font-black text-lg sm:text-xl tracking-widest text-cyan-300 glow-text-cyan">
                J.A.R.V.I.S.
              </h1>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono-hud bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                MARK IV
              </span>
            </div>
            <p className="font-mono-hud text-[9px] sm:text-[10px] text-cyan-400/80 tracking-wider">
              Personal AI Companion & Confidant
            </p>
          </div>

          {/* Quick Tactical Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Continuous Hands-Free Dialogue Loop Toggle */}
            <button
              onClick={toggleContinuousLoop}
              className={`px-2 py-1 rounded-lg border text-xs font-mono-hud flex items-center gap-1 transition-all ${
                voiceSettings.continuousConversation
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.45)]'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={
                voiceSettings.continuousConversation
                  ? 'Hands-Free Loop ACTIVE: Automatically listens after speaking'
                  : 'Hands-Free Loop PAUSED: Tap to speak required'
              }
            >
              <Repeat
                className={`w-3.5 h-3.5 ${
                  voiceSettings.continuousConversation ? 'text-cyan-300 animate-spin-slow' : ''
                }`}
              />
              <span className="font-bold text-[11px]">
                {voiceSettings.continuousConversation ? 'LOOP' : 'MANUAL'}
              </span>
            </button>

            {/* Microphone Mute Interlock Toggle */}
            <button
              onClick={toggleMute}
              className={`px-2 py-1 rounded-lg border text-xs font-mono-hud flex items-center gap-1 transition-all ${
                isMuted
                  ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:border-cyan-400'
              }`}
              title={isMuted ? 'Microphone is muted' : 'Microphone is active'}
            >
              {isMuted ? (
                <MicOff className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-cyan-300" />
              )}
              <span className="hidden sm:inline font-bold">{isMuted ? 'MUTED' : 'ARMED'}</span>
            </button>

            {/* Android Export Hub Button */}
            <button
              onClick={() => setIsAndroidExportOpen(true)}
              className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400 transition-colors"
              title="Samsung Galaxy Android APK Export Architecture"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Settings Modal */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400 transition-colors"
              title="Configure Voice & Persona"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MAIN HUD VIEWPORT */}
        <main className="relative z-20 flex-1 flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto">
          {/* Top Status Strip */}
          <div className="w-full max-w-md flex items-center justify-between text-[10px] sm:text-xs font-mono-hud text-slate-300 px-2.5 py-1 rounded bg-[#020712]/60 border border-cyan-500/15 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-500/60">STATUS:</span>
              <span className="text-cyan-300 font-semibold">AT YOUR SERVICE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-500/60">MODE:</span>
              <span
                className={`font-semibold ${
                  voiceSettings.continuousConversation ? 'text-cyan-300' : 'text-slate-400'
                }`}
              >
                {voiceSettings.continuousConversation ? 'HANDS-FREE' : 'PUSH-TO-TALK'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-500/60">WAKE:</span>
              <span className={wakeWordEnabled ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {wakeWordEnabled ? '"HEY JARVIS"' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Central Animated Holographic AI Core */}
          <div className="my-auto flex flex-col items-center">
            <AICore
              state={atlasState}
              isMuted={isMuted}
              onCoreClick={toggleCoreAction}
              transcriptPreview={transcriptPreview}
              isContinuous={voiceSettings.continuousConversation}
            />

            {/* Audio Waveform Spectrum Reactive Monitor */}
            <div className="mt-2 w-full max-w-xs sm:max-w-sm flex justify-center">
              <AudioWaveform state={atlasState} isMuted={isMuted} />
            </div>
          </div>

          {/* Quick Conversational Prompt Chips */}
          <div className="w-full max-w-md my-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono-hud scrollbar-none">
            {[
              'How are you doing today, Jarvis?',
              'What are we working on today?',
              'Tell me something interesting',
              'Samsung Galaxy APK Plan',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleUserQuery(chip)}
                disabled={atlasState === 'THINKING'}
                className="px-2.5 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/25 text-cyan-300/90 whitespace-nowrap hover:bg-cyan-900/60 hover:border-cyan-400 transition-all active:scale-95 text-ellipsis"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Fallback Text Input & Command Terminal */}
          <form
            onSubmit={handleTextSubmit}
            className="w-full max-w-md relative flex items-center gap-2 mt-1 mb-14"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  isMuted
                    ? 'Microphone muted. Ask Jarvis anything...'
                    : voiceSettings.continuousConversation
                    ? 'Hands-free active. Speak or type to Jarvis...'
                    : 'Ask Jarvis anything, sir...'
                }
                className="w-full bg-[#040e1f]/90 border border-cyan-500/30 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 font-rajdhani tracking-wide backdrop-blur-md shadow-inner"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || atlasState === 'THINKING'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-cyan-400 hover:text-cyan-200 disabled:opacity-40 transition-colors"
                title="Send command"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Core Mic Button Shortcut next to input */}
            <button
              type="button"
              onClick={toggleCoreAction}
              disabled={isMuted}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                  : atlasState === 'LISTENING'
                  ? 'bg-red-500/30 border-red-400 text-red-300 animate-pulse'
                  : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/70 hover:border-cyan-300'
              }`}
              title={voiceSettings.continuousConversation ? 'Hands-Free Loop Active' : 'Voice Input'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </form>
        </main>

        {/* BOTTOM CONVERSATION TRANSCRIPT DRAWER */}
        <ConversationDrawer
          messages={messages}
          isOpen={isDrawerOpen}
          onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
          onClear={() => setMessages([])}
          onReplayAudio={replayAudio}
        />

        {/* SETTINGS MODAL */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          voiceSettings={voiceSettings}
          onUpdateVoiceSettings={setVoiceSettings}
          persona={persona}
          onUpdatePersona={setPersona}
          systemDirective={systemDirective}
          onUpdateDirective={setSystemDirective}
          wakeWordEnabled={wakeWordEnabled}
          onToggleWakeWord={setWakeWordEnabled}
          onOpenAndroidExport={() => setIsAndroidExportOpen(true)}
        />

        {/* NATIVE SAMSUNG GALAXY APK EXPORT MODAL */}
        <AndroidExportModal
          isOpen={isAndroidExportOpen}
          onClose={() => setIsAndroidExportOpen(false)}
        />
      </div>
    </GalaxyFrame>
  );
}
