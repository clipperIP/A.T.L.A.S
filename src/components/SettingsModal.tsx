import React, { useEffect, useState } from 'react';
import { X, Sliders, Volume2, Shield, Mic, Bot, Sparkles, HelpCircle, Bell, Smartphone } from 'lucide-react';
import { AtlasPersona, VoiceSettings } from '../types/atlas';
import { voiceEngine } from '../utils/speech';
import { soundEngine } from '../utils/audioEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: VoiceSettings) => void;
  persona: AtlasPersona;
  onUpdatePersona: (persona: AtlasPersona) => void;
  systemDirective: string;
  onUpdateDirective: (directive: string) => void;
  wakeWordEnabled: boolean;
  onToggleWakeWord: (enabled: boolean) => void;
  onOpenAndroidExport: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voiceSettings,
  onUpdateVoiceSettings,
  persona,
  onUpdatePersona,
  systemDirective,
  onUpdateDirective,
  wakeWordEnabled,
  onToggleWakeWord,
  onOpenAndroidExport,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeTab, setActiveTab] = useState<'voice' | 'persona' | 'wakeword' | 'system'>('voice');

  useEffect(() => {
    if (isOpen) {
      voiceEngine.getAvailableVoices().then(setAvailableVoices);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testVoice = () => {
    soundEngine.playClick();
    voiceEngine.speak('At your service, sir. Always a pleasure to assist you.', {
      engineType: voiceSettings.engineType,
      neuralVoice: voiceSettings.neuralVoice,
      voiceURI: voiceSettings.voiceURI,
      pitch: voiceSettings.pitch,
      rate: voiceSettings.rate,
      volume: voiceSettings.volume,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#040d1a] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Corner Brackets */}
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-cyan-950/20">
          <div className="flex items-center gap-2 font-orbitron font-bold text-cyan-300 tracking-wider">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>A.T.L.A.S. CONFIGURATION MATRIX</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-500/20 bg-[#030914] text-xs font-mono-hud overflow-x-auto">
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'voice'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>VOICE SYNTHESIS</span>
          </button>
          <button
            onClick={() => setActiveTab('persona')}
            className={`px-4 py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'persona'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI PERSONA</span>
          </button>
          <button
            onClick={() => setActiveTab('wakeword')}
            className={`px-4 py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'wakeword'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>WAKE WORD</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'system'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>SECURITY</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-rajdhani">
          {/* VOICE TAB */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              {/* Voice Generation Engine */}
              <div>
                <label className="block text-xs font-mono-hud text-cyan-400 mb-2">
                  J.A.R.V.I.S. VOICE GENERATOR
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateVoiceSettings({ ...voiceSettings, engineType: 'neural' })
                    }
                    className={`p-3 rounded-xl text-left border transition-all ${
                      voiceSettings.engineType !== 'browser'
                        ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                        : 'border-cyan-500/20 bg-[#020610] text-slate-400 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="font-orbitron text-xs font-bold text-cyan-300 flex items-center justify-between mb-1">
                      <span>Neural Studio AI</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        MARVEL JARVIS
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 leading-snug">
                      Authentic deep British baritone synthesized by Gemini Neural Voice.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateVoiceSettings({ ...voiceSettings, engineType: 'browser' })
                    }
                    className={`p-3 rounded-xl text-left border transition-all ${
                      voiceSettings.engineType === 'browser'
                        ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                        : 'border-cyan-500/20 bg-[#020610] text-slate-400 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="font-orbitron text-xs font-bold text-cyan-300 mb-1">
                      Device System TTS
                    </div>
                    <div className="text-xs text-slate-400 leading-snug">
                      Uses your phone/browser installed British English speech voices.
                    </div>
                  </button>
                </div>
              </div>

              {/* Neural Voice Persona (when Neural Studio is selected) */}
              {voiceSettings.engineType !== 'browser' ? (
                <div>
                  <label className="block text-xs font-mono-hud text-cyan-400 mb-1.5">
                    NEURAL VOICE MODEL
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Charon' as const, label: 'Charon', tag: 'Paul Bettany Style (Recommended)' },
                      { id: 'Fenrir' as const, label: 'Fenrir', tag: 'Deep Resonant Baritone' },
                      { id: 'Puck' as const, label: 'Puck', tag: 'Light & Witty British' },
                    ].map((nv) => (
                      <button
                        key={nv.id}
                        type="button"
                        onClick={() =>
                          onUpdateVoiceSettings({ ...voiceSettings, neuralVoice: nv.id })
                        }
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          (voiceSettings.neuralVoice || 'Charon') === nv.id
                            ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200'
                            : 'border-cyan-500/20 bg-[#020610] text-slate-400 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="font-orbitron text-xs font-bold text-cyan-300">{nv.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{nv.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Browser Voice Dropdown */
                <div>
                  <label className="block text-xs font-mono-hud text-cyan-400 mb-1.5">
                    DEVICE SYSTEM VOICE
                  </label>
                  <select
                    value={voiceSettings.voiceURI}
                    onChange={(e) =>
                      onUpdateVoiceSettings({ ...voiceSettings, voiceURI: e.target.value })
                    }
                    className="w-full bg-[#020610] border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400 font-rajdhani"
                  >
                    <option value="">British J.A.R.V.I.S. (Auto-select Best UK Voice)</option>
                    {availableVoices.map((v, idx) => (
                      <option key={`${v.voiceURI || v.name}-${v.lang}-${idx}`} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sliders: Pitch, Rate, Volume */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-mono-hud text-slate-300 mb-1">
                    <span>SPEECH PITCH: {voiceSettings.pitch.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.05"
                    value={voiceSettings.pitch}
                    onChange={(e) =>
                      onUpdateVoiceSettings({
                        ...voiceSettings,
                        pitch: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono-hud text-slate-300 mb-1">
                    <span>SPEECH RATE: {voiceSettings.rate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={voiceSettings.rate}
                    onChange={(e) =>
                      onUpdateVoiceSettings({
                        ...voiceSettings,
                        rate: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-cyan-500/20 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-slate-300 font-semibold text-cyan-200">
                      Continuous Hands-Free Dialogue
                    </span>
                    <div className="text-xs text-slate-400">
                      Auto-listen after assistant speaks without having to tap each time
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceSettings.continuousConversation}
                    onChange={(e) =>
                      onUpdateVoiceSettings({
                        ...voiceSettings,
                        continuousConversation: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-cyan-400 rounded shrink-0 ml-3"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Auto-speak assistant responses</span>
                  <input
                    type="checkbox"
                    checked={voiceSettings.autoSpeak}
                    onChange={(e) =>
                      onUpdateVoiceSettings({
                        ...voiceSettings,
                        autoSpeak: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-cyan-400 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Tactical HUD audio feedback chimes</span>
                  <input
                    type="checkbox"
                    checked={voiceSettings.soundEffects}
                    onChange={(e) => {
                      soundEngine.enabled = e.target.checked;
                      onUpdateVoiceSettings({
                        ...voiceSettings,
                        soundEffects: e.target.checked,
                      });
                    }}
                    className="w-4 h-4 accent-cyan-400 rounded"
                  />
                </label>
              </div>

              <button
                onClick={testVoice}
                className="w-full py-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-orbitron text-xs tracking-wider hover:bg-cyan-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>TEST AUDIO CALIBRATION</span>
              </button>
            </div>
          )}

          {/* PERSONA TAB */}
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <label className="block text-xs font-mono-hud text-cyan-400">
                SELECT TACTICAL AI BEHAVIORAL PROTOCOL
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'jarvis' as AtlasPersona,
                    title: 'Marvel J.A.R.V.I.S.',
                    desc: 'Witty British friend & confidant. Warm, polite, loyal, zero cold robotic jargon.',
                  },
                  {
                    id: 'tactical' as AtlasPersona,
                    title: 'Tactical Analyst',
                    desc: 'Crisp, analytical, high intelligence, situational priority focus.',
                  },
                  {
                    id: 'military' as AtlasPersona,
                    title: 'Military Direct',
                    desc: 'Zero fluff, SITREP summaries, blunt tactical precision.',
                  },
                  {
                    id: 'cyberpunk' as AtlasPersona,
                    title: 'Cyberpunk Link',
                    desc: 'Futuristic neural interface tone, tech-fluent and responsive.',
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onUpdatePersona(p.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      persona === p.id
                        ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'border-cyan-500/20 bg-[#020610] hover:border-cyan-500/40 text-slate-400'
                    }`}
                  >
                    <div className="font-orbitron text-xs font-bold text-cyan-300 mb-1">
                      {p.title}
                    </div>
                    <div className="text-xs text-slate-400 leading-snug">{p.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-mono-hud text-cyan-400 mb-1">
                  CUSTOM SYSTEM DIRECTIVE OVERRIDE
                </label>
                <textarea
                  rows={3}
                  value={systemDirective}
                  onChange={(e) => onUpdateDirective(e.target.value)}
                  placeholder="Optional custom instructions to govern ATLAS reasoning..."
                  className="w-full bg-[#020610] border border-cyan-500/30 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono-hud"
                />
              </div>
            </div>
          )}

          {/* WAKE WORD TAB */}
          {activeTab === 'wakeword' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#020712] border border-cyan-500/30 flex items-start gap-3">
                <Mic className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-orbitron font-bold text-sm text-cyan-200">
                    "HEY ATLAS" WAKE-WORD DETECTION
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Activate continuous foreground listening for the phrase "Hey Atlas" or "Atlas" to wake the assistant hands-free.
                  </div>
                </div>
              </div>

              {/* Realistic Honesty Notice */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200/90 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <HelpCircle className="w-4 h-4" />
                  <span>HONEST TECHNICAL CLARIFICATION</span>
                </div>
                <p>
                  <strong>Web Sandbox Boundary:</strong> Web browsers pause audio streams when the screen turns off or the tab loses focus. Therefore, in-browser "Hey Atlas" operates while the screen is on and the tab is open.
                </p>
                <p>
                  <strong>True Screen-Off Wake-Word on Samsung Galaxy:</strong> Requires running the native Android 14+ Foreground Microphone Service with an embedded offline hotword model (e.g. Porcupine) and battery optimization exemption.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#020610] border border-cyan-500/20">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Active Foreground Wake-Word
                  </div>
                  <div className="text-xs text-slate-500">
                    {wakeWordEnabled ? 'Active (Say "Hey Atlas")' : 'Disabled'}
                  </div>
                </div>
                <button
                  onClick={() => onToggleWakeWord(!wakeWordEnabled)}
                  className={`px-4 py-1.5 rounded font-mono-hud text-xs font-bold transition-all ${
                    wakeWordEnabled
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.6)]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {wakeWordEnabled ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAndroidExport();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-900/50 to-cyan-900/40 border border-cyan-400/50 text-cyan-200 text-xs font-orbitron font-semibold tracking-wider hover:bg-cyan-900/60 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-cyan-300" />
                <span>INSPECT NATIVE ANDROID FOREGROUND SERVICE</span>
              </button>
            </div>
          )}

          {/* SYSTEM & SECURITY TAB */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#020712] border border-cyan-500/30">
                <div className="font-orbitron text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>SECURITY ARCHITECTURE</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                  <p>• API credentials are never exposed to client-side code.</p>
                  <p>• All AI queries proxy through the server-side Express runtime via <code className="text-cyan-300 font-mono">/api/chat</code>.</p>
                  <p>• AI model configured: <span className="text-cyan-300 font-semibold">Gemini 3.8 Flash</span>.</p>
                  <p>• API key status: Managed securely via server environment variables.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 font-mono-hud text-xs space-y-1 text-slate-300">
                <div className="text-cyan-400 font-bold mb-1">SYSTEM METRICS</div>
                <div>FRAMEWORK: React 19 + Vite 8 + Express</div>
                <div>DEVICE TARGET: Samsung Galaxy / Android 14+</div>
                <div>CORE BUILD: v3.4.0-TACTICAL</div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAndroidExport();
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-400 text-cyan-300 text-xs font-orbitron font-bold tracking-wider hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>OPEN ANDROID APK CONVERSION HUB</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-cyan-950/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-500 text-black font-orbitron font-bold text-xs tracking-wider hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
