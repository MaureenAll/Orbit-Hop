import React from 'react';
import { Play, Shield, Download, Smartphone, Volume2, VolumeX, Sparkles, ChevronRight } from 'lucide-react';
import { SatelliteSkin } from '../game/types';

interface TitleScreenProps {
  onStart: () => void;
  onOpenHangar: () => void;
  onOpenStoreGuide: () => void;
  onInstallPWA: () => void;
  isInstallable: boolean;
  highScoreKm: number;
  lifetimeKm: number;
  selectedSkin: SatelliteSkin;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenHangar,
  onOpenStoreGuide,
  onInstallPWA,
  isInstallable,
  highScoreKm,
  lifetimeKm,
  selectedSkin,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 select-none pointer-events-auto bg-gradient-to-b from-transparent via-[#050814]/40 to-[#050814]/90 z-20">
      {/* Top Bar Status / Utility Strip */}
      <div className="flex items-center justify-between w-full">
        {/* Record Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider font-mono">
              PERSONAL BEST
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-amber-300 tabular-nums">
              {highScoreKm.toLocaleString()} KM
            </span>
          </div>
        </div>

        {/* Top Right Utilities */}
        <div className="flex items-center gap-2">
          {/* PWA Direct Install Button */}
          {isInstallable && (
            <button
              onClick={onInstallPWA}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-950/60 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          )}

          {/* Store Guide Trigger */}
          <button
            onClick={onOpenStoreGuide}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Store Guide</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="p-2.5 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center text-center my-auto space-y-6 max-w-xl mx-auto">
        {/* Title SVG Lockup */}
        <div className="relative">
          <svg className="w-72 sm:w-96 h-28" viewBox="0 0 380 110" fill="none">
            <defs>
              <linearGradient id="orbitTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="orbitHopGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="titleGlow">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Orbiting arc ring */}
            <path
              d="M 30 75 Q 190 10 350 75"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.6"
            />

            {/* Orbit text */}
            <text
              x="50"
              y="68"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="52"
              fontWeight="900"
              letterSpacing="-1"
              fill="url(#orbitTitleGrad)"
              filter="url(#titleGlow)"
            >
              ORBIT
            </text>

            {/* Hop text */}
            <text
              x="228"
              y="68"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="52"
              fontWeight="900"
              letterSpacing="-1"
              fill="url(#orbitHopGrad)"
              filter="url(#titleGlow)"
            >
              HOP
            </text>

            {/* Satellite mark dot */}
            <circle cx="218" cy="24" r="5" fill="#38bdf8" filter="url(#titleGlow)" />
            <line x1="208" y1="24" x2="228" y2="24" stroke="#facc15" strokeWidth="2" />
          </svg>

          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide -mt-2">
            Survive the congested LEO orbital debris corridor.
          </p>
        </div>

        {/* Primary Launch Action CTA */}
        <div className="w-full max-w-sm flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="w-full py-4 px-8 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black text-lg tracking-wide shadow-xl shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>LAUNCH MISSION</span>
          </button>
        </div>

        {/* Equipped Chassis Pill */}
        <button
          onClick={onOpenHangar}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-xs text-slate-300 transition-colors"
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Equipped:</span>
          <span className="font-bold text-white">{selectedSkin.name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Flat Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono border-t border-slate-800/60 pt-4">
        <span>
          Press & Hold Space, Click, or Touch to Thrust · Release to Fall
        </span>
        <span className="mt-2 sm:mt-0">
          Lifetime: {lifetimeKm.toLocaleString()} KM
        </span>
      </div>
    </div>
  );
};
