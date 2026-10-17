import React from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone } from 'lucide-react';

interface GalaxyFrameProps {
  children: React.ReactNode;
  isFrameEnabled: boolean;
  onToggleFrame: () => void;
}

export const GalaxyFrame: React.FC<GalaxyFrameProps> = ({
  children,
  isFrameEnabled,
  onToggleFrame,
}) => {
  if (!isFrameEnabled) {
    return <div className="w-full h-full min-h-screen flex flex-col">{children}</div>;
  }

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-6 bg-[#01040a] relative">
      {/* Frame Viewport Switcher in Corner */}
      <div className="hidden sm:flex fixed top-4 right-4 z-50 items-center gap-2">
        <button
          onClick={onToggleFrame}
          className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono-hud flex items-center gap-1.5 hover:bg-cyan-900/80 transition-colors shadow-lg"
          title="Toggle between Samsung Galaxy mockup and full-width display"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>EXPAND FULL HUD</span>
        </button>
      </div>

      {/* Samsung Galaxy Device Mockup Chassis */}
      <div className="relative w-full max-w-[430px] h-[92vh] max-h-[890px] bg-[#030712] rounded-[48px] p-3 shadow-[0_0_80px_rgba(0,240,255,0.25),0_25px_50px_rgba(0,0,0,0.9)] border-[3px] border-[#1e293b] flex flex-col overflow-hidden ring-1 ring-cyan-500/20">
        {/* Device Bezel Reflection Accent */}
        <div className="absolute inset-0 rounded-[45px] pointer-events-none border border-white/5" />

        {/* Android / Samsung One UI Status Bar */}
        <div className="relative z-30 h-7 px-6 flex items-center justify-between text-xs text-slate-300 font-mono-hud shrink-0 select-none bg-black/40">
          <span className="font-semibold tracking-wide text-[11px]">{currentTime}</span>

          {/* Centered Camera Punch-hole */}
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 flex items-center justify-center shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0a1424] opacity-80" />
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <span className="text-[9px] font-bold text-cyan-400">5G</span>
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px]">96%</span>
              <BatteryMedium className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Inner Screen Content */}
        <div className="relative z-20 flex-1 overflow-hidden flex flex-col rounded-b-[36px]">
          {children}
        </div>

        {/* Bottom Android Gesture Navigation Bar */}
        <div className="relative z-30 h-4 flex items-center justify-center shrink-0 bg-transparent">
          <div className="w-28 h-1 rounded-full bg-slate-600/70" />
        </div>
      </div>
    </div>
  );
};
