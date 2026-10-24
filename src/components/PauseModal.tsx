import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home, Smartphone, Settings, Vibrate } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onOpenStoreGuide: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  onOpenStoreGuide,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-fade-in">
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl w-full max-w-sm p-6 flex flex-col shadow-2xl shadow-cyan-950/80">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto mb-2 text-cyan-400">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Mission Paused</h2>
          <p className="text-xs text-slate-400 mt-0.5">Orbital position held in telemetry lock</p>
        </div>

        {/* Action List */}
        <div className="space-y-2.5 mb-6">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Mission</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-full py-2.5 px-3 flex items-center justify-between bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors"
          >
            <span className="font-medium">Audio Synthesizer</span>
            <span className="flex items-center gap-1 font-mono text-cyan-300">
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400" /> ON
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" /> OFF
                </>
              )}
            </span>
          </button>

          {/* Haptics Vibration Toggle */}
          <button
            onClick={onToggleHaptics}
            className="w-full py-2.5 px-3 flex items-center justify-between bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors"
          >
            <span className="font-medium flex items-center gap-1.5">
              <Vibrate className="w-4 h-4 text-cyan-400" />
              Mobile Haptic Feedback
            </span>
            <span className="font-mono text-cyan-300">
              {hapticsEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Store Packaging Guide */}
          <button
            onClick={onOpenStoreGuide}
            className="w-full py-2.5 px-3 flex items-center justify-between bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors"
          >
            <span className="font-medium flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              App Store Publishing Guide
            </span>
            <span className="text-slate-500">&rarr;</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={onRestart}
            className="flex-1 py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Run</span>
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Abort to Title</span>
          </button>
        </div>
      </div>
    </div>
  );
};
