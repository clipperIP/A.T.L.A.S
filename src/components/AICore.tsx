import React from 'react';
import { Mic, MicOff, Radio, Cpu, Volume2, Sparkles } from 'lucide-react';
import { AtlasState } from '../types/atlas';

interface AICoreProps {
  state: AtlasState;
  isMuted: boolean;
  onCoreClick: () => void;
  transcriptPreview?: string;
  isContinuous?: boolean;
}

export const AICore: React.FC<AICoreProps> = ({
  state,
  isMuted,
  onCoreClick,
  transcriptPreview,
  isContinuous = false,
}) => {
  // Determine state-specific colors and glow
  const isListening = state === 'LISTENING';
  const isThinking = state === 'THINKING';
  const isSpeaking = state === 'SPEAKING';
  const isIdle = state === 'IDLE';

  const getCoreGlowClass = () => {
    if (isMuted) return 'shadow-[0_0_40px_rgba(239,68,68,0.3)] border-red-500/40 text-red-400';
    if (isListening) return 'shadow-[0_0_60px_rgba(239,68,68,0.7)] border-red-400 text-red-300 animate-core-listen';
    if (isThinking) return 'shadow-[0_0_65px_rgba(0,240,255,0.8)] border-cyan-300 text-cyan-200 animate-pulse';
    if (isSpeaking) return 'shadow-[0_0_65px_rgba(14,165,233,0.8)] border-cyan-400 text-cyan-100 animate-core-speak';
    if (isContinuous) return 'shadow-[0_0_50px_rgba(0,240,255,0.6)] border-cyan-400 text-cyan-200 animate-core-idle';
    return 'shadow-[0_0_45px_rgba(0,240,255,0.45)] border-cyan-500/50 text-cyan-300 animate-core-idle';
  };

  const getStatusText = () => {
    if (isMuted) return 'MICROPHONE MUTED';
    if (isListening) return isContinuous ? 'LISTENING, SIR...' : 'LISTENING...';
    if (isThinking) return 'JUST A MOMENT, SIR...';
    if (isSpeaking) return 'RESPONDING...';
    if (isContinuous) return 'AT YOUR SERVICE, SIR';
    return 'AT YOUR SERVICE, SIR';
  };

  return (
    <div className="relative flex flex-col items-center justify-center my-4 select-none">
      {/* Outer Hologram Radial Rings Container */}
      <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
        {/* Layer 1: Outermost dashed radar ring */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 ${
            isThinking
              ? 'border-cyan-400/80 animate-spin-fast'
              : isListening
              ? 'border-red-400/70 animate-spin-slow'
              : 'border-cyan-500/25 animate-spin-slow'
          }`}
        />

        {/* Layer 2: Counter-rotating orbital tick ring */}
        <div
          className={`absolute inset-3 sm:inset-4 rounded-full border border-cyan-400/20 transition-all duration-700 ${
            isThinking
              ? 'border-cyan-300/80 animate-spin-reverse-fast'
              : 'animate-spin-reverse-slow'
          }`}
          style={{
            borderStyle: 'dotted',
            borderWidth: '2px',
          }}
        />

        {/* Layer 3: Cardinal HUD Tick Marks */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan-400/70" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan-400/70" />
          <div className="absolute left-1 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-cyan-400/70" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-cyan-400/70" />
        </div>

        {/* Layer 4: Tactical Hexagonal / Segmented Mid-Ring */}
        <div className="absolute inset-8 sm:inset-10 rounded-full border border-cyan-500/30 flex items-center justify-center pointer-events-none">
          {/* Segment marks */}
          <div className="absolute inset-0 flex items-center justify-center rotate-45">
            <div className="w-full border-t border-cyan-500/15" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center -rotate-45">
            <div className="w-full border-t border-cyan-500/15" />
          </div>
        </div>

        {/* Layer 5: Expanding Acoustic Ripple Rings when Listening or Speaking */}
        {(isListening || isSpeaking) && (
          <>
            <div className="absolute inset-6 rounded-full border border-cyan-400/40 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute inset-2 rounded-full border border-cyan-300/30 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Layer 6: Main Clickable Interactive AI Core Button */}
        <button
          onClick={onCoreClick}
          disabled={isMuted && isIdle}
          className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center backdrop-blur-md transition-all duration-500 active:scale-95 cursor-pointer border-2 bg-gradient-to-b from-[#08172e]/90 via-[#040d1c]/95 to-[#020610] ${getCoreGlowClass()} focus:outline-none focus:ring-2 focus:ring-cyan-400/50`}
          title={isMuted ? 'Microphone Muted - Disarm mute in upper right' : 'Tap to voice command ATLAS'}
          aria-label={getStatusText()}
        >
          {/* Internal holographic energy gradient */}
          <div className="absolute inset-2 rounded-full bg-radial from-cyan-400/20 via-sky-600/10 to-transparent pointer-events-none" />

          {/* Dynamic Core Center Icon */}
          <div className="relative z-20 flex flex-col items-center justify-center">
            {isMuted ? (
              <MicOff className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 transition-transform duration-300" />
            ) : isListening ? (
              <Radio className="w-11 h-11 sm:w-13 sm:h-13 text-red-400 animate-pulse transition-transform duration-300" />
            ) : isThinking ? (
              <Cpu className="w-11 h-11 sm:w-13 sm:h-13 text-cyan-300 animate-spin-slow transition-transform duration-300" />
            ) : isSpeaking ? (
              <Volume2 className="w-11 h-11 sm:w-13 sm:h-13 text-cyan-300 animate-bounce transition-transform duration-300" />
            ) : (
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-300 hover:text-cyan-100 transition-transform duration-300" />
            )}

            {/* Core Label */}
            <span className="font-orbitron font-bold text-[10px] sm:text-xs tracking-widest mt-2 uppercase text-center">
              {isListening
                ? "I'M LISTENING"
                : isThinking
                ? 'THINKING...'
                : isSpeaking
                ? 'SPEAKING'
                : isContinuous
                ? 'READY, SIR'
                : 'TAP TO CHAT'}
            </span>
          </div>

          {/* Core HUD micro telemetry inside button */}
          <div className="absolute bottom-3 font-mono-hud text-[9px] text-cyan-400/70 tracking-wider">
            {isMuted ? 'MUTED' : isContinuous ? 'HANDS-FREE' : 'J.A.R.V.I.S.'}
          </div>
        </button>
      </div>

      {/* Real-time speech transcript preview if listening */}
      {transcriptPreview && (
        <div className="mt-3 max-w-xs sm:max-w-md px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm text-center font-rajdhani tracking-wide animate-pulse backdrop-blur-md">
          "{transcriptPreview}"
        </div>
      )}

      {/* Sub-core Status Indicator */}
      <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded bg-[#071325]/80 border border-cyan-500/20 text-xs font-mono-hud tracking-wider">
        <span
          className={`w-2 h-2 rounded-full ${
            isMuted
              ? 'bg-red-500'
              : isListening
              ? 'bg-red-400 animate-ping'
              : isThinking
              ? 'bg-cyan-400 animate-ping'
              : isSpeaking
              ? 'bg-blue-400 animate-pulse'
              : 'bg-emerald-400 animate-pulse'
          }`}
        />
        <span className="text-slate-200 font-semibold">{getStatusText()}</span>
        <span className="text-cyan-500/50">|</span>
        <span className="text-cyan-400 font-semibold">J.A.R.V.I.S.</span>
      </div>
    </div>
  );
};
