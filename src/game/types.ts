/**
 * Game Types & Interfaces for Orbit Hop
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface SatelliteSkin {
  id: string;
  name: string;
  codename: string;
  lore: string;
  unlockKm: number;
  bodyColor: string;
  wingColor: string;
  accentColor: string;
  thrustColor: string;
  style: 'cubesat' | 'sputnik' | 'solar_sail' | 'vanguard' | 'aegis';
}

export interface Obstacle {
  id: number;
  type: 'debris_small' | 'debris_medium' | 'booster_core' | 'defunct_sat' | 'hazard_wall';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  width: number;
  height: number;
  passed: boolean;
  nearMissed: boolean;
  // For hazard walls
  gapY?: number;
  gapHeight?: number;
  // Vector polygon vertices for debris
  polyPoints?: { x: number; y: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  shape: 'circle' | 'spark' | 'smoke' | 'ring' | 'plasma_glow' | 'speed_streak';
  secondaryColor?: string;
  glowBlur?: number;
}

export interface GameStats {
  distanceKm: number;
  altitudeKm: number;
  velocityKmh: number;
  streak: number;
  nearMisses: number;
  debrisDodged: number;
  milestoneFlash: number;
  reentryWarning: boolean;
  dayNightRatio: number; // 0 = midday, 0.5 = sunset, 1.0 = deep night
}

export interface GameProgress {
  highScoreKm: number;
  lifetimeKm: number;
  selectedSkin: string;
  unlockedSkins: string[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  totalDodges: number;
  totalNearMisses: number;
}
