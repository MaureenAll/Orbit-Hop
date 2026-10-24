import React from 'react';
import { Volume2, VolumeX, Pause, Flame, Sparkles } from 'lucide-react';
import { GameStats } from '../game/types';

interface GameHUDProps {
  stats: GameStats;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  soundEnabled,
  onToggleSound,
  onPause,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Top Perimeter Telemetry Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Left Telemetry Cluster */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 pointer-events-auto">
          {/* Distance (Primary Metric) */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider">
              DISTANCE
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg sm:text-2xl font-black text-cyan-300 tabular-nums">
                {stats.distanceKm.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs text-cyan-400/80 font-mono">KM</span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Altitude */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider">
              ALTITUDE
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-200 tabular-nums">
                {stats.altitudeKm}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">KM</span>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-px bg-slate-800" />

          {/* Velocity */}
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider">
              VELOCITY
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-200 tabular-nums">
                {stats.velocityKmh.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">KM/H</span>
            </div>
          </div>
        </div>

        {/* Center Streak Multiplier Pill */}
        {stats.streak > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/70 border border-amber-500/50 rounded-full animate-pulse shadow-lg shadow-amber-950/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 tabular-nums">
              {stats.streak}x MULTIPLIER
            </span>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="p-2 sm:px-3 sm:py-2 flex items-center gap-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline text-xs font-medium">
              {soundEnabled ? 'Audio' : 'Muted'}
            </span>
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            aria-label="Pause Mission"
            className="p-2 sm:px-3 sm:py-2 flex items-center gap-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Pause className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline text-xs font-medium">Pause</span>
          </button>
        </div>
      </div>

      {/* Atmospheric Re-entry Danger Warning */}
      {stats.reentryWarning && (
        <div className="w-full flex justify-center mb-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-950/90 border border-red-500 rounded-xl text-red-200 animate-pulse shadow-xl shadow-red-950/70">
            <Flame className="w-5 h-5 text-red-400 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wider text-red-400 font-mono">
                WARNING: DENSE ATMOSPHERE ENTRY
              </span>
              <span className="text-[11px] text-red-200">
                Thrust immediately to maintain orbital altitude!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Subtle Control Hint */}
      <div className="flex justify-between items-end w-full text-[11px] text-slate-500 font-mono">
        <span className="hidden sm:inline">
          HOLD SPACE OR TOUCH & HOLD TO THRUST · RELEASE TO FALL
        </span>
        <span className="ml-auto">
          LEO ORBITAL SECTOR 4
        </span>
      </div>
    </div>
  );
};
