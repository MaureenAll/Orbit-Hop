import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Sparkles, Shield, Smartphone, Home } from 'lucide-react';
import { GameStats, SatelliteSkin } from '../game/types';
import { SATELLITE_SKINS } from '../game/skins';

interface GameOverModalProps {
  stats: GameStats;
  highScoreKm: number;
  isNewBest: boolean;
  lifetimeKm: number;
  selectedSkin: SatelliteSkin;
  onRestart: () => void;
  onHome: () => void;
  onOpenHangar: () => void;
  onOpenStoreGuide: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScoreKm,
  isNewBest,
  lifetimeKm,
  selectedSkin,
  onRestart,
  onHome,
  onOpenHangar,
  onOpenStoreGuide,
}) => {
  // Listen for Space or Enter for instant relaunch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  // Find next locked skin
  const nextSkin = SATELLITE_SKINS.find((s) => s.unlockKm > lifetimeKm);
  const nextTargetKm = nextSkin ? nextSkin.unlockKm : lifetimeKm;
  const progressPct = nextSkin
    ? Math.min(100, Math.round((lifetimeKm / nextTargetKm) * 100))
    : 100;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none animate-fade-in">
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl w-full max-w-md p-6 sm:p-8 flex flex-col shadow-2xl shadow-cyan-950/80">
        {/* Header / Record Banner */}
        <div className="text-center mb-6">
          {isNewBest ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500 text-amber-300 text-xs font-bold mb-3 animate-pulse">
              <Trophy className="w-3.5 h-3.5" />
              NEW ALL-TIME RECORD!
            </div>
          ) : (
            <span className="font-mono text-xs font-semibold text-red-400 tracking-wider">
              MISSION TERMINATED
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Flight Debrief
          </h2>
        </div>

        {/* Primary Distance Readout */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center mb-5">
          <span className="text-xs text-slate-400 font-mono font-medium">DISTANCE ACHIEVED</span>
          <div className="flex items-baseline justify-center gap-1.5 mt-1">
            <span className="font-mono text-3xl sm:text-4xl font-black text-cyan-300 tabular-nums">
              {stats.distanceKm.toLocaleString()}
            </span>
            <span className="font-mono text-sm text-cyan-400/80">KM</span>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono block">BEST</span>
            <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
              {highScoreKm.toLocaleString()} km
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono block">NEAR-MISSES</span>
            <span className="font-mono text-sm font-bold text-cyan-300 tabular-nums">
              {stats.nearMisses}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono block">DODGED</span>
            <span className="font-mono text-sm font-bold text-slate-200 tabular-nums">
              {stats.debrisDodged}
            </span>
          </div>
        </div>

        {/* Chassis Unlock Progress */}
        {nextSkin && (
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 mb-6">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Next Unlock: <strong className="text-white">{nextSkin.name}</strong>
              </span>
              <span className="font-mono text-cyan-400 font-semibold">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-400"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Primary CTA: Instant Restart */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all mb-3"
        >
          <RotateCcw className="w-4 h-4 stroke-[3]" />
          <span>RELAUNCH IMMEDIATELY (SPACE)</span>
        </button>

        {/* Secondary Utility Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHangar}
            className="flex-1 py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hangar</span>
          </button>
          <button
            onClick={onOpenStoreGuide}
            className="flex-1 py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Store Guide</span>
          </button>
          <button
            onClick={onHome}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
