import React, { useEffect, useState } from 'react';
import { AtlasState } from '../types/atlas';

interface AudioWaveformProps {
  state: AtlasState;
  isMuted: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ state, isMuted }) => {
  const [bars, setBars] = useState<number[]>(new Array(24).fill(15));

  useEffect(() => {
    let animId: number;

    const updateBars = () => {
      setBars((prev) =>
        prev.map((_, i) => {
          if (isMuted) {
            return 8; // flatlined
          }
          if (state === 'LISTENING') {
            // High dynamic jitter representing live speech input
            const centerDist = Math.abs(i - 12) / 12;
            const variance = Math.random() * 85 + 15;
            return Math.max(10, Math.floor(variance * (1 - centerDist * 0.4)));
          }
          if (state === 'SPEAKING') {
            // Rhythmic speech cadence modulation
            const wave = Math.sin(Date.now() / 150 + i * 0.4) * 35 + 45;
            const jitter = Math.random() * 20;
            return Math.max(12, Math.min(100, Math.floor(wave + jitter)));
          }
          if (state === 'THINKING') {
            // Traveling wave pattern for neural processing
            const wave = Math.sin(Date.now() / 80 + i * 0.3) * 25 + 35;
            return Math.max(10, Math.floor(wave));
          }
          // IDLE state: gentle ambient respiratory wave
          const wave = Math.sin(Date.now() / 600 + i * 0.25) * 8 + 14;
          return Math.floor(wave);
        })
      );
      animId = requestAnimationFrame(updateBars);
    };

    animId = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(animId);
  }, [state, isMuted]);

  const getBarColor = (height: number) => {
    if (isMuted) return 'bg-red-500/30';
    if (state === 'LISTENING') {
      return height > 65 ? 'bg-red-400' : 'bg-red-500/70';
    }
    if (state === 'SPEAKING') {
      return height > 65 ? 'bg-cyan-300' : 'bg-sky-400';
    }
    if (state === 'THINKING') {
      return 'bg-cyan-400/80';
    }
    return 'bg-cyan-500/40';
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md px-4 py-2 flex items-center justify-center gap-1 sm:gap-1.5 h-14 bg-[#030a16]/60 rounded-xl border border-cyan-500/20 backdrop-blur-sm">
      {bars.map((height, idx) => (
        <div
          key={idx}
          className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${getBarColor(height)}`}
          style={{
            height: `${height}%`,
            boxShadow:
              state !== 'IDLE' && !isMuted
                ? state === 'LISTENING'
                  ? '0 0 8px rgba(239, 68, 68, 0.4)'
                  : '0 0 8px rgba(0, 240, 255, 0.5)'
                : 'none',
          }}
        />
      ))}
    </div>
  );
};
