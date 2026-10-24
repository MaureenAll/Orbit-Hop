# Orbit Hop

Orbit Hop is a high-speed arcade orbital survival game built for web, mobile browsers, and app store deployment. Players navigate an orbital satellite through low-Earth orbit, dodging space debris, defunct satellites, and booster stages while balancing altitude against atmospheric burn-up and deep space drift.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The following revisions have been incorporated based on your feedback:

- **Branding Update**: App and game officially named **Orbit Hop** (Short name: `OrbitHop`).
- **Store-Ready Mobile Architecture**:
  - **100% Offline Progressive Web App (PWA)**: Implemented with `vite-plugin-pwa`, complete Web App Manifest, offline caching, and responsive service worker.
  - **In-App Install Prompt**: Dedicated "Install Orbit Hop" button on the title screen and pause menu supporting native Android/Chrome install prompts and iOS Safari "Add to Home Screen" guidance.
  - **Turnkey Store Publishing**: Standard architecture compatible directly with **PWABuilder** or **Bubblewrap** for generating Google Play `.aab` Android App Bundles (Trusted Web Activity) and **Capacitor** for native iOS / Android Xcode and Android Studio projects.
  - **Touch & Mobile Ergonomics**: `touch-action: none`, full-screen touch zone with zero input lag, notch safe-area padding (`env(safe-area-inset-top)`), and subtle haptic pulse feedback (`navigator.vibrate`) on near-misses and collisions.
- **Dual-Mode Thrust Controls**: Instant toggle between **Hold-Thrust** (continuous burn with gravitational drop) and **Tap-Pulse** (rhythmic discrete hops).
- **Vector Arcade Retro Aesthetic**: Glowing neon vector lines, thruster plasma trails, orbital debris sparks, and smooth day-to-night orbital lighting transitions.
- **Orbit Telemetry HUD**: Monospace tabular readouts for altitude ($300\text{--}650\text{ km}$), orbital velocity ($27,000+\text{ km/h}$), distance traveled, and streak multiplier.
- **Procedural Web Audio Engine**: Zero-asset procedural synth oscillators for thruster hum, 1,000 km electronic chimes, near-miss adrenaline sweeps, and impact crunch.
- **Algorithmic Fairness Guarantee**: Spawner calculates maximum vertical transit time based on satellite velocity to guarantee 100% passable corridors and safe gap clearances ($\ge 140\text{px}$).

***

## 1. Overview & Core Concept

- **What It Does**: Fast-paced mobile-first arcade runner where players hop and thrust through orbital debris bands. The satellite maintains orbital velocity while dodging defunct satellites, booster cores, and micrometeoroids.
- **Target Audience & Platform**: Mobile and desktop gamers, indie game fans. Built to play instantaneously in any mobile browser or as an installed standalone app from Google Play / Apple App Store.
- **Key Value**: One-tap learning curve, deep mastery ceiling, instantaneous restarts, and offline play anywhere.

***

## 2. Mobile & Visual Experience Design

```
┌────────────────────────────────────────────────────────────────────────┐
│  ALTITUDE: 420 KM   ·   VELOCITY: 27,800 KM/H   ·   DISTANCE: 3,420 KM │
│  MODE: [HOLD-THRUST]                [📱 INSTALL APP]  [🔊 SOUND: ON]   │
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

### Mobile & Store Adaptation

1. **Touch Ergonomics & Viewport**:
   - Entire screen acts as the responsive thrust/hop touch surface.
   - Screen edges respect mobile hardware gestures and notch safe-areas (`pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`).
   - Default pull-to-refresh and pinch-zoom disabled on the canvas via `touch-action: none` and `overscroll-behavior: none`.

2. **In-App PWA Installation**:
   - Detects `beforeinstallprompt` on Android / Chrome desktop to offer a 1-tap "Install Orbit Hop" button.
   - Provides iOS Safari modal explaining "Share → Add to Home Screen" for zero-friction mobile deployment.
   - Automatically hides install prompts once running in `standalone` display mode.

3. **Store Packaging Readiness**:
   - Generates compliant `manifest.json` with 192x192, 512x512 icons, and maskable safe-zone icon.
   - Enables export to Google Play Store via PWABuilder / TWA CLI or iOS via Capacitor.

4. **Visual Polish & Game Feel**:
   - Deep void background (`#050814`) with starfield parallax.
   - Earth curvature with dynamic day/night terminator line cycling every 2,000 km.
   - Neon cyan ion thruster trail, gold solar panels, and amber/red debris warnings.
   - Micro-haptics (`navigator.vibrate`) for tactile feedback on mobile devices.

***

## 3. Key Technical Decisions & Trade-Offs

- **Decision 1: Direct 60 FPS HTML5 Canvas Engine**
  - *Chosen Approach*: Single decoupled `<canvas>` rendering loop with fixed delta time clamping (`Math.min(dt, 0.05)`).
  - *Why*: Guarantees rock-solid 60 FPS on low-power mobile phones, eliminating React re-render overhead.
- **Decision 2: Turnkey PWA + Store Compatibility**
  - *Chosen Approach*: `vite-plugin-pwa` with auto-updating Service Worker and asset precaching.
  - *Why*: Allows instant offline gameplay without any network connection, and enables 1-click generation of native app store packages (Google Play `.aab` and iOS Xcode project) using standard packaging tools.
- **Decision 3: Procedural Web Audio API Synth**
  - *Chosen Approach*: Real-time audio synthesis with Web Audio oscillators and filters.
  - *Why*: Zero MP3 downloads, sub-millisecond playback trigger, pitch-bending thruster modulation, and no audio latency on mobile.
- **Decision 4: Algorithmic Fair Spawning**
  - *Chosen Approach*: Spawner dynamically checks current satellite speed, gravity, and thrust acceleration to guarantee vertical corridors are strictly passable.
  - *Why*: Eliminates unwinnable RNG choke points, fostering fair competitive replayability.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Orbit Hop Mobile Web Shell                      │
├────────────────────────────────┬───────────────────────────────────────┤
│         React UI Shell         │         Canvas Game Engine            │
│  - State Machine Driver        │  - 60 FPS Fixed Delta Loop            │
│  - Telemetry HUD & Overlays    │  - Physics & Velocity Clamping        │
│  - PWA Install Prompts (iOS/And│  - Guaranteed Fair Procedural Spawner │
│  - Satellite Hangar Modal      │  - Particle System & Screen Shake     │
│  - LocalStorage Synchronization│  - Touch / Keyboard Event Stream      │
├────────────────────────────────┴───────────────────────────────────────┤
│              Audio & Device APIs (Web Audio Synth + Haptics)           │
├────────────────────────────────────────────────────────────────────────┤
│                 Service Worker (PWA Offline Precaching)                │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

```typescript
type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface OrbitHopProgress {
  highScoreKm: number;
  lifetimeKm: number;
  selectedSkin: string;
  unlockedSkins: string[];
  controlMode: 'hold' | 'pulse';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
```

***

## 5. Next Steps

Upon your approval, we will immediately execute the complete build of **Orbit Hop**, including the game engine, vector graphics, telemetry HUD, procedural synth, PWA installation, and mobile store packaging assets.
