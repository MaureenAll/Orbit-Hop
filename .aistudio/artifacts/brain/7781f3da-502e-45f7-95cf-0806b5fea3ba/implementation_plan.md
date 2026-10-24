# Satellite Dodger

Satellite Dodger is an arcade orbital survival game built for web and mobile browsers. Players pilot an orbital satellite through low-Earth orbit, dodging space debris, spent booster stages, and micrometeoroid clouds while balancing altitude against atmospheric burn-up and orbital escape.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions were confirmed during initial clarification and form the foundation of the build:

- **Confirmed: Dual-Mode Thrust Controls**: Seamless in-game toggle between **Hold-Thrust** (continuous propulsion with gravitational drop on release) and **Tap-Pulse** (discrete agile hops). Both keyboard (`Space`/`ArrowUp`/`W`) and full-screen touch/mouse input supported.
- **Confirmed: Vector Arcade Retro Aesthetic**: Glowing vector line-work, vibrant thruster particle trails, orbital debris sparks, curved Earth horizon glow, and smooth day-to-night orbital lighting transitions.
- **Confirmed: Orbit Telemetry HUD**: Real-time altitude readout ($300\text{--}650\text{ km}$ Low Earth Orbit band), orbital velocity ($27,000+\text{ km/h}$), distance counter, dodge streak multiplier, and atmospheric re-entry warning bar.
- **Confirmed: Procedural Web Audio Synth**: Synthesized retro space audio via Web Audio API—smooth pitch-modulating thruster drone, 1,000 km milestone electronic chimes, near-miss pulse sweeps, explosion crunch, and mute toggle. Zero external MP3 asset dependency.
- **Confirmed: Unlockable Satellite Chassis**: Hangar system with unlockable satellite models (CubeSat Mk I, Sputnik V, Helios Solar Sailer, Vanguard Relay, and Aegis Orbital Station) earned via distance milestones.
- **Confirmed: Algorithmic Fairness Guarantee**: Obstacle spawner calculates required vertical transit time based on satellite velocity and thrust parameters to guarantee that every gap and debris field is passably traversable.

***

## 1. Overview & Core Concept

- **What It Does**: Puts the player in command of an operational satellite in an increasingly congested orbital corridor. Players maneuver vertically to evade derelict spacecraft fragments, solar panels, and asteroid fragments while maintaining safe orbital altitude.
- **Target Audience & Platform**: Casual gamers, retro arcade fans, and mobile/desktop browser players seeking rapid, satisfying "one more run" gameplay. Designed mobile-first with touch surface responsiveness and desktop keyboard refinement.
- **Key Value**: Instant zero-friction playability, responsive physics movement, visceral visual feedback with screen shake and particle bursts, and persistent progression.

***

## 2. User Experience & Visual Design

```
┌────────────────────────────────────────────────────────────────────────┐
│  ALTITUDE: 420 KM   ·   VELOCITY: 27,800 KM/H   ·   DISTANCE: 3,420 KM │
│  MODE: [HOLD-THRUST]                                [🔊 SOUND: ON]     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│        ✦       *        .       *          ✦                           │
│                     .               *                .       *         │
│                                                                        │
│             [=== 🛰️ SATELLITE ===>                                    │
│                (plasma trail)                                          │
│                                            [▲ DEBRIS HAZARD]           │
│                                                                        │
│                                    [■ BOOSTER CORE]                    │
│                                                                        │
│       ───────────────── DENSE ATMOSPHERE WARNING ─────────────────      │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ATMOSPHERIC RE-ENTRY ZONE ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└────────────────────────────────────────────────────────────────────────┘
```

### Key User Flows

1. **Title Screen & Live Hangar**:
   - Atmospheric vector Earth horizon gently rotating in the background with day/night orbital lighting.
   - High score display, distance milestone badges, and quick Satellite Hangar preview.
   - Primary **"Launch Mission"** action (`Space` / Tap to start).
   - Control mode selector: `Hold to Thrust` vs `Tap to Hop`.

2. **Active Orbit (Gameplay)**:
   - Full-viewport isolated HTML5 `<canvas>` running at 60 FPS.
   - Smooth vertical physics: upward thruster acceleration, gravitational decay, and inertial momentum.
   - Top and bottom boundaries: upper boundary triggers ionospheric ceiling warning; lower boundary dips into dense atmosphere with re-entry heat friction particles.
   - Dynamic Day/Night Cycle: transitions smoothly every 2,000 km between sunlit solar panel gleam and dark Earth eclipse with radiant city lights below and vibrant distant stars.
   - Real-time Orbit Telemetry HUD styled with uncluttered vector monospace readouts.
   - Milestone Celebrations: every 1,000 km triggers a visual horizon surge and harmonious electronic chime.

3. **Game Over & Debrief**:
   - Immediate impact freeze-frame (40ms hitstop) followed by vector debris fragmentation and screen shake.
   - Mission debrief card: Final Distance, New Personal Best callout, Close Dodges, Streak Multiplier, and unlocked satellite achievements.
   - Single-tap **"Relaunch Immediately"** button (`Space` / Enter / Tap) with zero delay.

### Visual Identity & Theme Tokens

- **Aesthetic Direction**: Neo-Vector Sci-Fi Arcade (inspired by Asteroids, Geometry Wars, and modern aerospace telemetry).
- **Color Palette**:
  - Deep Space Void: `#050814` to `#0a0f24`
  - Atmospheric Horizon Arc: `#1e3a8a` to `#0284c7` (day) / `#0f172a` to `#1e1b4b` (night)
  - Neon Thruster Ion Cyan: `#22d3ee`
  - Solar Array Gold: `#facc15`
  - Hazard Amber & Debris Crimson: `#f59e0b` / `#ef4444`
  - Radar HUD Text: `#94a3b8` / `#f8fafc`
- **Typography**: Clean display headline pairing with monospace tabular figures (`font-mono tabular-nums`) for high-precision telemetry metrics.

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct 60 FPS HTML5 Canvas Engine over Heavy Frameworks**
  - *Chosen Approach*: Lightweight dedicated Canvas 2D render loop decoupled from React state renders.
  - *Why*: Sub-millisecond touch/input responsiveness, zero framework bloat, flawless 60 FPS performance on both mobile phones and desktop browsers.
  - *Alternatives Considered*: Phaser 3 or Godot WASM. Canvas 2D provides instant loading, zero external bundle overhead, and seamless React UI integration.
- **Decision 2: Procedural Web Audio API Synthesizer**
  - *Chosen Approach*: Pure JavaScript Web Audio oscillator and biquad filter nodes for thruster drone, debris near-miss sweeps, milestone bells, and collision explosions.
  - *Why*: Immune to network latency or missing MP3 file errors, dynamic real-time pitch shifting as satellite speed ramps up, tiny memory footprint.
- **Decision 3: Guaranteed Passable Procedural Spawning**
  - *Chosen Approach*: Spawner algorithm analyzes the satellite's maximum vertical thrust velocity and terminal falling speed against oncoming scrolling velocity, maintaining a guaranteed minimum clearance gap ($\ge 140\text{px}$) with safe reaction corridors.
  - *Why*: Eliminates unavoidable "cheap deaths", rewarding player skill and reflexes.
- **Decision 4: Local Storage Persistence**
  - *Chosen Approach*: Stores high score distance, lifetime distance traveled, unlocked satellite skins, preferred control mode, and audio settings in `localStorage`.
  - *Why*: Instant offline-ready persistence without login walls or server bottlenecks.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                             App Container                              │
├────────────────────────────────┬───────────────────────────────────────┤
│         React UI Shell         │         Canvas Game Engine            │
│  - State Machine Driver        │  - 60 FPS Fixed Delta Loop (0.016s)   │
│  - Telemetry HUD & Overlays    │  - Physics Engine (Thrust/Gravity)    │
│  - Satellite Hangar Modal      │  - Procedural Fair Spawner            │
│  - Audio & Control Settings    │  - Collision Detection (AABB/Circles) │
│  - LocalStorage Synchronization│  - Particle System (Thruster & Sparks)│
├────────────────────────────────┴───────────────────────────────────────┤
│                     Procedural Web Audio Engine                        │
│  - Dynamic Thruster Noise/Tone  ·  Chimes  ·  Near-Miss Pulse  · Crash │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App.tsx
├── CanvasViewport (Isolated Canvas ref, 60fps loop, Touch & Keyboard handlers)
├── GameHUD (Distance, Altitude, Velocity, Streak, Sound Toggle, Mode Switch)
├── TitleScreenOverlay (Logo lockup, High Score, Hangar trigger, Launch CTA)
├── HangarModal (Satellite skin selector, stats, unlocks)
├── GameOverOverlay (Mission distance, Personal Best indicator, Instant Retry)
└── PauseModal (Controls reminder, audio volume, resume)
```

### Data Model & State

```typescript
interface PlayerSatellite {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  thrusting: boolean;
  skinId: string;
  shieldActive: boolean;
}

interface Obstacle {
  id: number;
  type: 'debris_small' | 'debris_medium' | 'booster_core' | 'defunct_sat' | 'hazard_wall';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  gapY?: number; // For hazard walls
  gapHeight?: number;
}

interface GameProgress {
  highScoreKm: number;
  lifetimeKm: number;
  selectedSkin: string;
  unlockedSkins: string[];
  controlMode: 'hold' | 'pulse';
  soundEnabled: boolean;
}
```

***

## 5. Next Steps

Upon your approval, we will immediately implement the full Satellite Dodger game with responsive physics, vector graphics, procedural audio, hangar unlocks, and guaranteed fair obstacle generation.
