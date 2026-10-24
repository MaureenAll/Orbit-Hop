import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OrbitHopEngine } from './game/engine';
import { soundEngine } from './game/audio';
import { SATELLITE_SKINS } from './game/skins';
import { GameState, GameStats, SatelliteSkin } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { HangarModal } from './components/HangarModal';
import { StorePublishGuide } from './components/StorePublishGuide';
import { usePWAInstall } from './hooks/usePWAInstall';

const STORAGE_KEYS = {
  HIGH_SCORE: 'orbithop_highscore_km',
  LIFETIME: 'orbithop_lifetime_km',
  SKIN: 'orbithop_selected_skin',
  SOUND: 'orbithop_sound_enabled',
  HAPTICS: 'orbithop_haptics_enabled',
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<OrbitHopEngine | null>(null);

  // PWA install integration
  const { isInstallable, install } = usePWAInstall();

  // Saved progress & preferences
  const [highScoreKm, setHighScoreKm] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lifetimeKm, setLifetimeKm] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.LIFETIME) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HAPTICS);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [selectedSkin, setSelectedSkin] = useState<SatelliteSkin>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.SKIN);
      return SATELLITE_SKINS.find((s) => s.id === savedId) || SATELLITE_SKINS[0];
    } catch {
      return SATELLITE_SKINS[0];
    }
  });

  // Game UI State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [isHangarOpen, setIsHangarOpen] = useState(false);
  const [isStoreGuideOpen, setIsStoreGuideOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  // Live telemetry stats
  const [currentStats, setCurrentStats] = useState<GameStats>({
    distanceKm: 0,
    altitudeKm: 420,
    velocityKmh: 27200,
    streak: 1,
    nearMisses: 0,
    debrisDodged: 0,
    milestoneFlash: 0,
    reentryWarning: false,
    dayNightRatio: 0,
  });

  // Initialize Canvas Engine once
  useEffect(() => {
    if (!canvasRef.current) return;

    soundEngine.setEnabled(soundEnabled);

    const engine = new OrbitHopEngine(canvasRef.current, {
      onStatsUpdate: (stats) => {
        setCurrentStats(stats);
      },
      onMilestone: () => {
        // Handled in engine with audio & particles
      },
      onNearMiss: () => {
        // Handled in engine with audio & particles
      },
      onGameOver: (finalStats) => {
        setGameState('GAME_OVER');
        setCurrentStats(finalStats);

        // Update records
        setLifetimeKm((prev) => {
          const updated = prev + finalStats.distanceKm;
          try {
            localStorage.setItem(STORAGE_KEYS.LIFETIME, updated.toString());
          } catch {
            // Ignore storage failure
          }
          return updated;
        });

        setHighScoreKm((prev) => {
          if (finalStats.distanceKm > prev) {
            setIsNewBest(true);
            try {
              localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, finalStats.distanceKm.toString());
            } catch {
              // Ignore storage failure
            }
            return finalStats.distanceKm;
          }
          setIsNewBest(false);
          return prev;
        });
      },
    });

    engine.setSkin(selectedSkin);
    engine.setHapticsEnabled(hapticsEnabled);
    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []); // Run once on mount

  // Sync settings when changed

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSkin(selectedSkin);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SKIN, selectedSkin.id);
    } catch {}
  }, [selectedSkin]);

  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, soundEnabled.toString());
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setHapticsEnabled(hapticsEnabled);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.HAPTICS, hapticsEnabled.toString());
    } catch {}
  }, [hapticsEnabled]);

  // Actions
  const handleStartGame = useCallback(() => {
    setIsNewBest(false);
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      if (engineRef.current) {
        engineRef.current.pause();
      }
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      if (engineRef.current) {
        engineRef.current.resume();
      }
    }
  }, [gameState]);

  const handleRestart = useCallback(() => {
    setIsNewBest(false);
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  const handleHome = useCallback(() => {
    setGameState('TITLE');
    if (engineRef.current) {
      engineRef.current.pause();
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const handleToggleHaptics = useCallback(() => {
    setHapticsEnabled((prev) => !prev);
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameState === 'TITLE') {
          handleStartGame();
        } else if (gameState === 'PLAYING' && engineRef.current) {
          engineRef.current.handleInputDown();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameState === 'PLAYING' && engineRef.current) {
          engineRef.current.handleInputUp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleStartGame, handlePause, handleResume]);

  // Touch / Pointer Event Handlers on the Game Surface
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState === 'PLAYING' && engineRef.current) {
      engineRef.current.handleInputDown();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (gameState === 'PLAYING' && engineRef.current) {
      engineRef.current.handleInputUp();
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-screen h-screen overflow-hidden bg-[#050814] touch-none select-none"
    >
      {/* 60 FPS Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-pointer"
      />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenHangar={() => setIsHangarOpen(true)}
          onOpenStoreGuide={() => setIsStoreGuideOpen(true)}
          onInstallPWA={install}
          isInstallable={isInstallable}
          highScoreKm={highScoreKm}
          lifetimeKm={lifetimeKm}
          selectedSkin={selectedSkin}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Active Playing HUD */}
      {gameState === 'PLAYING' && (
        <GameHUD
          stats={currentStats}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onPause={handlePause}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          hapticsEnabled={hapticsEnabled}
          onToggleHaptics={handleToggleHaptics}
          onOpenStoreGuide={() => setIsStoreGuideOpen(true)}
        />
      )}

      {/* Game Over Debrief Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={currentStats}
          highScoreKm={highScoreKm}
          isNewBest={isNewBest}
          lifetimeKm={lifetimeKm}
          selectedSkin={selectedSkin}
          onRestart={handleRestart}
          onHome={handleHome}
          onOpenHangar={() => setIsHangarOpen(true)}
          onOpenStoreGuide={() => setIsStoreGuideOpen(true)}
        />
      )}

      {/* Orbital Hangar Modal */}
      <HangarModal
        isOpen={isHangarOpen}
        onClose={() => setIsHangarOpen(false)}
        selectedSkinId={selectedSkin.id}
        onSelectSkin={(skin) => {
          setSelectedSkin(skin);
          setIsHangarOpen(false);
        }}
        lifetimeKm={lifetimeKm}
      />

      {/* App Store Publishing Guide Modal */}
      <StorePublishGuide
        isOpen={isStoreGuideOpen}
        onClose={() => setIsStoreGuideOpen(false)}
      />
    </div>
  );
}
