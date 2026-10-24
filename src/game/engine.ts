import { soundEngine } from './audio';
import { SATELLITE_SKINS } from './skins';
import { GameStats, Obstacle, Particle, SatelliteSkin } from './types';
import { triggerHaptic, cancelHaptic } from '../utils/haptics';

export interface EngineCallbacks {
  onGameOver: (stats: GameStats) => void;
  onMilestone: (distanceKm: number) => void;
  onNearMiss: (streak: number) => void;
  onStatsUpdate: (stats: GameStats) => void;
}

export class OrbitHopEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  // Running state
  public isRunning = false;
  public isPaused = false;
  public skin: SatelliteSkin = SATELLITE_SKINS[0];
  public hapticsEnabled = true;

  // Canvas dimensions
  private width = 800;
  private height = 600;
  private dpr = 1;

  // Player physics
  private px = 180;
  private py = 300;
  private pvy = 0;
  private pRotation = 0;
  private pWidth = 44;
  private pHeight = 28;
  private isThrusting = false;
  private atmosphereTimer = 0;

  // Physics constants
  private readonly GRAVITY = 720; // px/s^2
  private readonly THRUST_ACCEL = 1450; // px/s^2 (hold mode)
  private readonly PULSE_IMPULSE = -380; // px/s (pulse mode)
  private readonly MAX_FALL_SPEED = 560; // px/s
  private readonly MAX_CLIMB_SPEED = -480; // px/s

  // World & scrolling
  private scrollSpeed = 300; // px/s
  private distanceTraveled = 0; // km
  private streakMultiplier = 1;
  private nearMisses = 0;
  private debrisDodged = 0;
  private lastMilestoneKm = 0;
  private milestoneFlashTimer = 0;
  private screenShake = 0;

  // Entities
  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];
  private stars: { x: number; y: number; size: number; layer: number; brightness: number }[] = [];
  private cityClusters: { x: number; y: number; size: number; alpha: number }[] = [];
  private nextObstacleX = 600;
  private obstacleIdCounter = 0;

  // Loop timing
  private lastTime = 0;
  private animFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.callbacks = callbacks;
    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);

    this.initStars();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  public destroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    soundEngine.stopThrust();
    cancelHaptic();
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  public setSkin(skin: SatelliteSkin) {
    this.skin = skin;
  }

  private handleResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = parent.clientWidth || window.innerWidth;
    this.height = parent.clientHeight || window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    this.px = Math.max(120, this.width * 0.22);
    this.initStars();
  }

  private initStars() {
    this.stars = [];
    const count = Math.floor((this.width * this.height) / 5500);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.78),
        size: Math.random() < 0.25 ? 2.2 : Math.random() < 0.7 ? 1.5 : 0.9,
        layer: Math.random() < 0.3 ? 0.3 : Math.random() < 0.7 ? 0.6 : 1.0,
        brightness: 0.4 + Math.random() * 0.6,
      });
    }

    // City lights on Earth night side
    this.cityClusters = [];
    const clusterCount = 18;
    for (let i = 0; i < clusterCount; i++) {
      this.cityClusters.push({
        x: (i / clusterCount) * this.width * 2,
        y: this.height * 0.88 + Math.random() * (this.height * 0.08),
        size: 3 + Math.random() * 6,
        alpha: 0.3 + Math.random() * 0.5,
      });
    }
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.py = this.height * 0.45;
    this.pvy = 0;
    this.pRotation = 0;
    this.isThrusting = false;
    this.atmosphereTimer = 0;
    this.distanceTraveled = 0;
    this.scrollSpeed = 320;
    this.streakMultiplier = 1;
    this.nearMisses = 0;
    this.debrisDodged = 0;
    this.lastMilestoneKm = 0;
    this.milestoneFlashTimer = 0;
    this.screenShake = 0;

    this.obstacles = [];
    this.particles = [];
    this.nextObstacleX = this.width + 180;
    this.lastTime = performance.now();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public pause() {
    this.isPaused = true;
    soundEngine.stopThrust();
    cancelHaptic();
  }

  public resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  // --- Input Handlers ---
  public handleInputDown() {
    if (!this.isRunning || this.isPaused) return;

    this.isThrusting = true;
    soundEngine.startThrust();
  }

  public handleInputUp() {
    if (this.isThrusting) {
      this.isThrusting = false;
      soundEngine.stopThrust();
    }
  }

  private loop(now: number) {
    if (!this.isRunning || this.isPaused) return;

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // Frame delta clamping

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  // --- Simulation Update ---
  private update(dt: number) {
    // 1. Distance & Orbital Speed Progression
    const kmPerSecond = (this.scrollSpeed / 10) * 1.25;
    this.distanceTraveled += kmPerSecond * dt;
    // Gradually ramp speed from 320px/s up to 600px/s at 20,000km
    this.scrollSpeed = 320 + Math.min(this.distanceTraveled * 0.014, 280);

    // 2. 1,000 km Milestones
    const currentMilestone = Math.floor(this.distanceTraveled / 1000) * 1000;
    if (currentMilestone > this.lastMilestoneKm && currentMilestone > 0) {
      this.lastMilestoneKm = currentMilestone;
      this.milestoneFlashTimer = 0.8;
      this.streakMultiplier = Math.min(this.streakMultiplier + 1, 5);
      soundEngine.playMilestone();
      if (this.hapticsEnabled) {
        triggerHaptic('milestone');
      }
      this.callbacks.onMilestone(currentMilestone);
      this.spawnMilestoneBurst();
    }

    if (this.milestoneFlashTimer > 0) {
      this.milestoneFlashTimer -= dt;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // 3. Player Physics (Hold to Thrust)
    if (this.isThrusting) {
      this.pvy -= this.THRUST_ACCEL * dt;
      this.spawnThrusterParticles(dt, 1.0);
    } else {
      this.spawnCruisingWake(dt);
    }

    // Gravity pull
    this.pvy += this.GRAVITY * dt;
    this.pvy = Math.max(this.MAX_CLIMB_SPEED, Math.min(this.pvy, this.MAX_FALL_SPEED));

    this.py += this.pvy * dt;

    // Subtle pitch rotation based on velocity
    const targetRot = Math.max(-0.35, Math.min(this.pvy * 0.0008, 0.45));
    this.pRotation += (targetRot - this.pRotation) * 12 * dt;

    // 4. Boundary Collision & Atmosphere Mechanics
    const ceilingY = 32;
    const atmosphereWarningY = this.height * 0.76;
    const atmosphereBurnY = this.height * 0.88;

    // Ceiling check
    if (this.py < ceilingY) {
      this.py = ceilingY;
      if (this.pvy < 0) this.pvy = 40;
    }

    // Lower boundary / atmosphere check
    const inAtmosphere = this.py > atmosphereWarningY;
    if (inAtmosphere) {
      this.spawnAtmosphericSparks();
      if (Math.random() < 0.25) {
        soundEngine.playAtmosphereWarning();
      }

      if (this.py >= atmosphereBurnY) {
        this.atmosphereTimer += dt;
        if (this.atmosphereTimer > 0.8) {
          // Re-entry burnup!
          this.triggerDeath('Burned up in Earth\'s dense upper atmosphere.');
          return;
        }
      } else {
        this.atmosphereTimer = Math.max(0, this.atmosphereTimer - dt * 0.5);
      }
    } else {
      this.atmosphereTimer = 0;
    }

    // 5. Starfield & City Lights Parallax Scroll
    for (const star of this.stars) {
      star.x -= this.scrollSpeed * 0.15 * star.layer * dt;
      if (star.x < 0) {
        star.x = this.width + Math.random() * 20;
        star.y = Math.random() * (this.height * 0.78);
      }
    }

    for (const city of this.cityClusters) {
      city.x -= this.scrollSpeed * 0.4 * dt;
      if (city.x < -100) {
        city.x = this.width + Math.random() * 100;
      }
    }

    // 6. Spawner & Obstacles
    this.updateSpawner(dt);
    this.updateObstacles(dt);

    // 7. Particles
    this.updateParticles(dt);

    // 8. Stats Callback Dispatch
    const dayNightCycleKm = 2000;
    const dayNightRatio = (Math.sin((this.distanceTraveled / dayNightCycleKm) * Math.PI) + 1) / 2;
    const altitudeKm = Math.round(550 - (this.py / this.height) * 250);
    const velocityKmh = Math.round(27200 + this.distanceTraveled * 0.4);

    this.callbacks.onStatsUpdate({
      distanceKm: Math.floor(this.distanceTraveled),
      altitudeKm,
      velocityKmh,
      streak: this.streakMultiplier,
      nearMisses: this.nearMisses,
      debrisDodged: this.debrisDodged,
      milestoneFlash: this.milestoneFlashTimer,
      reentryWarning: inAtmosphere,
      dayNightRatio,
    });
  }

  // --- Guaranteed Fair Spawner ---
  private updateSpawner(dt: number) {
    this.nextObstacleX -= this.scrollSpeed * dt;

    if (this.nextObstacleX <= this.width) {
      this.spawnFairObstacle();

      // Pacing interval based on speed: guarantees 1.3 to 1.8 seconds of reaction
      const minDistance = Math.max(340, this.scrollSpeed * 1.3);
      const randomVariance = Math.random() * 160;
      this.nextObstacleX = this.width + minDistance + randomVariance;
    }
  }

  private spawnFairObstacle() {
    this.obstacleIdCounter++;
    const id = this.obstacleIdCounter;
    const playableTop = 50;
    const playableBottom = this.height * 0.75;
    const playableRange = playableBottom - playableTop;

    // Obstacle types rotate smoothly with distance
    const roll = Math.random();
    let type: Obstacle['type'] = 'debris_small';

    if (this.distanceTraveled > 1500 && roll < 0.28) {
      type = 'hazard_wall';
    } else if (this.distanceTraveled > 800 && roll < 0.55) {
      type = 'booster_core';
    } else if (roll < 0.8) {
      type = 'debris_medium';
    } else {
      type = 'defunct_sat';
    }

    if (type === 'hazard_wall') {
      // Guaranteed Safe Gap: at least 155px tall, well above player height (36px)
      const gapHeight = Math.max(155, 190 - Math.min(this.distanceTraveled * 0.003, 35));
      const gapY = playableTop + 20 + Math.random() * (playableRange - gapHeight - 40);

      this.obstacles.push({
        id,
        type: 'hazard_wall',
        x: this.width + 60,
        y: 0,
        vx: -this.scrollSpeed,
        vy: 0,
        rotation: 0,
        rotationSpeed: 0,
        radius: 0,
        width: 38,
        height: this.height,
        passed: false,
        nearMissed: false,
        gapY,
        gapHeight,
      });
      return;
    }

    // For free-floating debris:
    const targetY = playableTop + Math.random() * playableRange;
    let radius = 14;
    let width = 28;
    let height = 28;
    let rotationSpeed = (Math.random() - 0.5) * 2.5;

    if (type === 'booster_core') {
      width = 54;
      height = 20;
      radius = 24;
      rotationSpeed = (Math.random() - 0.5) * 1.2;
    } else if (type === 'debris_medium') {
      width = 34;
      height = 34;
      radius = 18;
    } else if (type === 'defunct_sat') {
      width = 46;
      height = 32;
      radius = 22;
    }

    // Generate polygonal jagged points for debris
    const polyPoints: { x: number; y: number }[] = [];
    const numPoints = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.5);
      polyPoints.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }

    this.obstacles.push({
      id,
      type,
      x: this.width + 60,
      y: targetY,
      vx: -this.scrollSpeed,
      vy: (Math.random() - 0.5) * 30, // gentle orbital drift
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed,
      radius,
      width,
      height,
      passed: false,
      nearMissed: false,
      polyPoints,
    });
  }

  private updateObstacles(dt: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x += obs.vx * dt;
      obs.y += obs.vy * dt;
      obs.rotation += obs.rotationSpeed * dt;

      // Pass check
      if (!obs.passed && obs.x + obs.width < this.px - 20) {
        obs.passed = true;
        this.debrisDodged++;
      }

      // Near-Miss Adrenaline Check
      if (!obs.nearMissed && obs.passed) {
        obs.nearMissed = true;
        let dist = 999;

        if (obs.type === 'hazard_wall' && obs.gapY && obs.gapHeight) {
          const topEdgeDist = Math.abs(this.py - (obs.gapY - 14));
          const botEdgeDist = Math.abs(this.py - (obs.gapY + obs.gapHeight + 14));
          dist = Math.min(topEdgeDist, botEdgeDist);
        } else {
          dist = Math.hypot(obs.x - this.px, obs.y - this.py);
        }

        // Close shave threshold (between hull collision and 32px)
        if (dist <= 38 + obs.radius) {
          this.nearMisses++;
          this.streakMultiplier = Math.min(this.streakMultiplier + 1, 5);
          soundEngine.playNearMiss();
          if (this.hapticsEnabled) {
            triggerHaptic('nearMiss');
          }
          this.callbacks.onNearMiss(this.streakMultiplier);
          this.spawnNearMissRipples(this.px, this.py);
        }
      }

      // Collision Check
      if (this.checkCollision(obs)) {
        this.triggerDeath('Collision with orbital debris.');
        return;
      }

      // Cleanup offscreen
      if (obs.x < -120) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private checkCollision(obs: Obstacle): boolean {
    const pRadius = 14; // Tight hit sphere for fair collision

    if (obs.type === 'hazard_wall') {
      const wallX = obs.x;
      const wallW = obs.width;
      const gapY = obs.gapY || 0;
      const gapHeight = obs.gapHeight || 150;

      // If player horizontally intersects wall
      if (this.px + pRadius > wallX && this.px - pRadius < wallX + wallW) {
        // If player is outside safe gap
        if (this.py - pRadius < gapY || this.py + pRadius > gapY + gapHeight) {
          return true;
        }
      }
      return false;
    }

    // Circular / elliptical collision for debris
    const dx = this.px - obs.x;
    const dy = this.py - obs.y;
    const dist = Math.hypot(dx, dy);

    return dist < pRadius + obs.radius * 0.85;
  }

  private triggerDeath(reason: string) {
    this.isRunning = false;
    soundEngine.playExplosion();
    if (this.hapticsEnabled) {
      triggerHaptic('crash');
    }
    this.screenShake = 16;
    this.spawnExplosion(this.px, this.py);

    const altitudeKm = Math.round(550 - (this.py / this.height) * 250);
    const velocityKmh = Math.round(27200 + this.distanceTraveled * 0.4);

    this.callbacks.onGameOver({
      distanceKm: Math.floor(this.distanceTraveled),
      altitudeKm,
      velocityKmh,
      streak: this.streakMultiplier,
      nearMisses: this.nearMisses,
      debrisDodged: this.debrisDodged,
      milestoneFlash: 0,
      reentryWarning: false,
      dayNightRatio: 0.5,
    });
  }

  // --- Particles & FX ---
  private spawnThrusterParticles(dt: number, intensity = 1.0) {
    const skin = this.skin;
    const nozzleOffset = 22;
    const rearX = this.px - Math.cos(this.pRotation) * nozzleOffset;
    const rearY = this.py - Math.sin(this.pRotation) * nozzleOffset;

    // Number of particles spawned per frame depends on dt and intensity
    const emitCount = Math.max(1, Math.round(dt * 110 * intensity));

    for (let i = 0; i < emitCount; i++) {
      const spreadAngle = this.pRotation + Math.PI + (Math.random() - 0.5) * 0.35;
      const streamSpeed = 160 + Math.random() * 140;

      // 1. Expanding glowing plasma orbs
      this.particles.push({
        x: rearX + (Math.random() - 0.5) * 4,
        y: rearY + (Math.random() - 0.5) * 4,
        vx: Math.cos(spreadAngle) * streamSpeed - this.scrollSpeed * 0.85,
        vy: Math.sin(spreadAngle) * streamSpeed,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        size: 9 + Math.random() * 7,
        color: skin.thrustColor,
        secondaryColor: skin.accentColor,
        alpha: 0.95,
        shape: 'plasma_glow',
      });

      // 2. High-speed vector light streaks for dynamic speed sensation
      if (Math.random() < 0.5) {
        this.particles.push({
          x: rearX,
          y: rearY + (Math.random() - 0.5) * 6,
          vx: -this.scrollSpeed * 1.15 - (80 + Math.random() * 100),
          vy: Math.sin(spreadAngle) * 40,
          life: 0.25 + Math.random() * 0.15,
          maxLife: 0.4,
          size: 28 + Math.random() * 22,
          color: skin.thrustColor,
          secondaryColor: skin.accentColor,
          alpha: 0.9,
          shape: 'speed_streak',
        });
      }

      // 3. Glittering micro-sparks scattering with aerodynamic cone
      if (Math.random() < 0.6) {
        const sparkSpeed = 190 + Math.random() * 150;
        this.particles.push({
          x: rearX,
          y: rearY,
          vx: Math.cos(spreadAngle) * sparkSpeed - this.scrollSpeed * 0.5,
          vy: Math.sin(spreadAngle) * sparkSpeed,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          size: 3 + Math.random() * 3,
          color: Math.random() < 0.35 ? '#ffffff' : Math.random() < 0.7 ? skin.thrustColor : skin.wingColor,
          alpha: 1.0,
          shape: 'spark',
        });
      }
    }
  }

  private spawnCruisingWake(dt: number) {
    if (Math.random() > dt * 25) return;
    const skin = this.skin;
    const nozzleOffset = 18;
    const rearX = this.px - Math.cos(this.pRotation) * nozzleOffset;
    const rearY = this.py - Math.sin(this.pRotation) * nozzleOffset;

    this.particles.push({
      x: rearX,
      y: rearY + (Math.random() - 0.5) * 4,
      vx: -this.scrollSpeed * 0.9 - 40,
      vy: (Math.random() - 0.5) * 20,
      life: 0.3,
      maxLife: 0.3,
      size: 5 + Math.random() * 4,
      color: skin.thrustColor,
      secondaryColor: skin.accentColor,
      alpha: 0.4,
      shape: 'plasma_glow',
    });
  }

  private spawnThrustBurst() {
    const skin = this.skin;
    const nozzleOffset = 22;
    const rearX = this.px - Math.cos(this.pRotation) * nozzleOffset;
    const rearY = this.py - Math.sin(this.pRotation) * nozzleOffset;

    // Shockwave pulse ring
    this.particles.push({
      x: rearX,
      y: rearY,
      vx: -this.scrollSpeed * 0.5,
      vy: 0,
      life: 0.35,
      maxLife: 0.35,
      size: 14,
      color: skin.thrustColor,
      alpha: 0.95,
      shape: 'ring',
    });

    // Intense burst of glowing plasma puffs & speed streaks
    for (let i = 0; i < 20; i++) {
      const angle = this.pRotation + Math.PI + (Math.random() - 0.5) * 0.7;
      const speed = 200 + Math.random() * 220;

      this.particles.push({
        x: rearX + (Math.random() - 0.5) * 6,
        y: rearY + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed - this.scrollSpeed * 0.8,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.25,
        maxLife: 0.65,
        size: 10 + Math.random() * 8,
        color: skin.thrustColor,
        secondaryColor: skin.accentColor,
        alpha: 1.0,
        shape: 'plasma_glow',
      });

      if (i % 2 === 0) {
        this.particles.push({
          x: rearX,
          y: rearY + (Math.random() - 0.5) * 8,
          vx: -this.scrollSpeed * 1.3 - (100 + Math.random() * 120),
          vy: Math.sin(angle) * 60,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          size: 35 + Math.random() * 25,
          color: skin.thrustColor,
          secondaryColor: skin.accentColor,
          alpha: 0.95,
          shape: 'speed_streak',
        });
      }
    }
  }

  private spawnAtmosphericSparks() {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: this.px + (Math.random() - 0.5) * 30,
        y: this.py + 10 + Math.random() * 10,
        vx: -this.scrollSpeed * 0.8 + (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.8) * 80,
        life: 0.25,
        maxLife: 0.25,
        size: 3 + Math.random() * 3,
        color: Math.random() < 0.6 ? '#f97316' : '#ef4444',
        alpha: 1.0,
        shape: 'spark',
      });
    }
  }

  private spawnNearMissRipples(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.35,
      maxLife: 0.35,
      size: 15,
      color: '#38bdf8',
      alpha: 0.9,
      shape: 'ring',
    });
  }

  private spawnMilestoneBurst() {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 240;
      this.particles.push({
        x: this.px,
        y: this.py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#facc15' : '#38bdf8',
        alpha: 1.0,
        shape: 'spark',
      });
    }
  }

  private spawnExplosion(x: number, y: number) {
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.7 + Math.random() * 0.4,
        maxLife: 1.1,
        size: 4 + Math.random() * 6,
        color: Math.random() < 0.3 ? '#ef4444' : Math.random() < 0.6 ? '#f59e0b' : '#38bdf8',
        alpha: 1.0,
        shape: Math.random() < 0.5 ? 'spark' : 'circle',
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.shape === 'ring') {
        p.size += 90 * dt;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- Rendering Pipeline ---
  private render() {
    const ctx = this.ctx;

    // Apply screen shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Day / Night Sky Background
    this.renderSky(ctx);

    // 2. Starfield
    this.renderStarfield(ctx);

    // 3. Earth Horizon & Atmosphere
    this.renderEarth(ctx);

    // 4. Milestone Flash Overlay
    if (this.milestoneFlashTimer > 0) {
      ctx.fillStyle = `rgba(56, 189, 248, ${this.milestoneFlashTimer * 0.25})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 5. Obstacles
    this.renderObstacles(ctx);

    // 6. Particles
    this.renderParticles(ctx);

    // 7. Player Satellite
    this.renderSatellite(ctx);

    ctx.restore();
  }

  private renderSky(ctx: CanvasRenderingContext2D) {
    const dayNightCycleKm = 2000;
    const progress = (Math.sin((this.distanceTraveled / dayNightCycleKm) * Math.PI) + 1) / 2;

    // Deep space gradient: Day = dark blue dawn / Night = deep void black
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (progress > 0.5) {
      // Day phase
      grad.addColorStop(0, '#060d24');
      grad.addColorStop(0.65, '#0a163a');
      grad.addColorStop(1, '#0c2354');
    } else {
      // Night phase
      grad.addColorStop(0, '#02040a');
      grad.addColorStop(0.65, '#050814');
      grad.addColorStop(1, '#090e24');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private renderStarfield(ctx: CanvasRenderingContext2D) {
    const dayNightCycleKm = 2000;
    const progress = (Math.sin((this.distanceTraveled / dayNightCycleKm) * Math.PI) + 1) / 2;
    // Stars are much brighter at night
    const starOpacity = 0.35 + (1 - progress) * 0.65;

    for (const star of this.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * starOpacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Glow on bright foreground stars
      if (star.size > 2) {
        ctx.fillStyle = `rgba(56, 189, 248, ${star.brightness * starOpacity * 0.4})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderEarth(ctx: CanvasRenderingContext2D) {
    const dayNightCycleKm = 2000;
    const progress = (Math.sin((this.distanceTraveled / dayNightCycleKm) * Math.PI) + 1) / 2;

    const earthY = this.height * 0.78;
    const earthR = this.width * 1.3;
    const earthCenterX = this.width * 0.5;

    // Earth Body Arc
    const earthGrad = ctx.createRadialGradient(
      earthCenterX,
      earthY + earthR * 0.8,
      earthR * 0.4,
      earthCenterX,
      earthY + earthR * 0.8,
      earthR
    );

    if (progress > 0.5) {
      // Sunlit Earth (Azure ocean & clouds)
      earthGrad.addColorStop(0, '#0369a1');
      earthGrad.addColorStop(0.4, '#075985');
      earthGrad.addColorStop(0.8, '#082f49');
      earthGrad.addColorStop(1, '#020617');
    } else {
      // Night Earth (Deep indigo with city lights)
      earthGrad.addColorStop(0, '#090e24');
      earthGrad.addColorStop(0.6, '#050914');
      earthGrad.addColorStop(1, '#02040a');
    }

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthY + earthR * 0.8, earthR, 0, Math.PI * 2);
    ctx.fill();

    // City lights on night side
    if (progress <= 0.6) {
      const cityAlpha = (1 - progress) * 0.8;
      ctx.fillStyle = `rgba(253, 224, 71, ${cityAlpha})`;
      for (const city of this.cityClusters) {
        ctx.beginPath();
        ctx.arc(city.x, city.y, city.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Atmospheric Glow Limb
    ctx.beginPath();
    ctx.arc(earthCenterX, earthY + earthR * 0.8, earthR, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = progress > 0.5 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Soft outer atmospheric haze
    ctx.beginPath();
    ctx.arc(earthCenterX, earthY + earthR * 0.8, earthR + 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = progress > 0.5 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(129, 140, 248, 0.15)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Atmosphere Re-entry danger line
    const warnY = this.height * 0.78;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, warnY);
    ctx.lineTo(this.width, warnY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.rotation);

      if (obs.type === 'hazard_wall') {
        this.renderHazardWall(ctx, obs);
      } else if (obs.type === 'booster_core') {
        this.renderBoosterCore(ctx, obs);
      } else if (obs.type === 'defunct_sat') {
        this.renderDefunctSat(ctx, obs);
      } else {
        this.renderDebrisFragment(ctx, obs);
      }

      ctx.restore();
    }
  }

  private renderHazardWall(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const gapY = obs.gapY || 0;
    const gapHeight = obs.gapHeight || 150;
    const w = obs.width;

    // Top Barrier Segment
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2, 0, w, gapY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, 0, w, gapY);

    // Top Barrier Warning Striping
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    for (let y = 10; y < gapY - 10; y += 18) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, y);
      ctx.lineTo(w / 2 - 4, y + 8);
      ctx.stroke();
    }

    // Bottom Barrier Segment
    const botY = gapY + gapHeight;
    const botH = this.height - botY;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2, botY, w, botH);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, botY, w, botH);

    // Bottom Barrier Warning Striping
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    for (let y = botY + 10; y < this.height - 10; y += 18) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, y);
      ctx.lineTo(w / 2 - 4, y + 8);
      ctx.stroke();
    }

    // Safe Corridor Indicator Beacons
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(0, gapY + 4, 3, 0, Math.PI * 2);
    ctx.arc(0, botY - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBoosterCore(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const w = obs.width;
    const h = obs.height;

    // Main Stage Cylinder
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Interstage Ring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w / 6, -h / 2);
    ctx.lineTo(-w / 6, h / 2);
    ctx.stroke();

    // Rocket Nozzle
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 3);
    ctx.lineTo(-w / 2 - 8, -h / 2);
    ctx.lineTo(-w / 2 - 8, h / 2);
    ctx.lineTo(-w / 2, h / 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderDefunctSat(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const r = obs.radius;

    // Chassis Box
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
    ctx.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);

    // Dead / Broken Solar Wing
    ctx.fillStyle = '#312e81';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-r * 1.6, -r * 0.3, r * 0.8, r * 0.6);
    ctx.strokeRect(-r * 1.6, -r * 0.3, r * 0.8, r * 0.6);

    // Dish
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r * 0.9, 0, r * 0.4, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  private renderDebrisFragment(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    if (!obs.polyPoints || obs.polyPoints.length === 0) return;

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = obs.type === 'debris_medium' ? '#f59e0b' : '#94a3b8';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(obs.polyPoints[0].x, obs.polyPoints[0].y);
    for (let i = 1; i < obs.polyPoints.length; i++) {
      ctx.lineTo(obs.polyPoints[i].x, obs.polyPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Screen composite operation makes overlapping plasma particles bloom with intense glow
    ctx.globalCompositeOperation = 'screen';

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'plasma_glow') {
        const expansion = 1 + (1 - p.life / p.maxLife) * 1.5;
        const currentSize = p.size * expansion;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, p.color);
        if (p.secondaryColor) {
          grad.addColorStop(0.65, p.secondaryColor);
        }
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'speed_streak') {
        const streakLength = p.size * (1 + this.scrollSpeed / 280);
        const grad = ctx.createLinearGradient(p.x, p.y, p.x - streakLength, p.y);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, p.color);
        if (p.secondaryColor) {
          grad.addColorStop(0.7, p.secondaryColor);
        }
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1.8, 3.5 * p.alpha);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - streakLength, p.y + p.vy * 0.04);
        ctx.stroke();
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private renderSatellite(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.px, this.py);
    ctx.rotate(this.pRotation);

    const skin = this.skin;

    // Thruster exhaust flame when thrusting
    const isThrustActive = this.isThrusting || this.pvy < -120;

    if (isThrustActive) {
      const flameLen = 26 + Math.random() * 16;
      const flameW = 10 + Math.random() * 5;

      const flameGrad = ctx.createLinearGradient(-18, 0, -18 - flameLen, 0);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.25, skin.thrustColor);
      flameGrad.addColorStop(0.7, skin.accentColor);
      flameGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-18, -flameW / 2);
      ctx.lineTo(-18 - flameLen, 0);
      ctx.lineTo(-18, flameW / 2);
      ctx.closePath();
      ctx.fill();

      // Glowing nozzle core dot
      ctx.fillStyle = skin.thrustColor;
      ctx.beginPath();
      ctx.arc(-18, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-18, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (skin.style === 'sputnik') {
      this.drawSputnikSkin(ctx, skin);
    } else if (skin.style === 'solar_sail') {
      this.drawSolarSailSkin(ctx, skin);
    } else if (skin.style === 'vanguard') {
      this.drawVanguardSkin(ctx, skin);
    } else if (skin.style === 'aegis') {
      this.drawAegisSkin(ctx, skin);
    } else {
      this.drawCubeSatSkin(ctx, skin);
    }

    ctx.restore();
  }

  private drawCubeSatSkin(ctx: CanvasRenderingContext2D, skin: SatelliteSkin) {
    // Left Wing
    ctx.fillStyle = skin.wingColor;
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-44, -10, 24, 20);
    ctx.strokeRect(-44, -10, 24, 20);
    ctx.beginPath();
    ctx.moveTo(-32, -10);
    ctx.lineTo(-32, 10);
    ctx.stroke();

    // Right Wing
    ctx.fillRect(20, -10, 24, 20);
    ctx.strokeRect(20, -10, 24, 20);
    ctx.beginPath();
    ctx.moveTo(32, -10);
    ctx.lineTo(32, 10);
    ctx.stroke();

    // Wing Struts
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-12, 0);
    ctx.moveTo(12, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // Core Chassis
    ctx.fillStyle = skin.bodyColor;
    ctx.strokeStyle = skin.accentColor;
    ctx.lineWidth = 2;
    ctx.fillRect(-14, -14, 28, 28);
    ctx.strokeRect(-14, -14, 28, 28);

    // Sensor Eye
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSputnikSkin(ctx: CanvasRenderingContext2D, skin: SatelliteSkin) {
    // Four Antenna Whips
    ctx.strokeStyle = skin.wingColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-36, -26);
    ctx.moveTo(-6, 6);
    ctx.lineTo(-36, 26);
    ctx.moveTo(-10, -2);
    ctx.lineTo(-44, -12);
    ctx.moveTo(-10, 2);
    ctx.lineTo(-44, 12);
    ctx.stroke();

    // Pressure Sphere
    ctx.fillStyle = skin.bodyColor;
    ctx.strokeStyle = skin.accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Beacon Core
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSolarSailSkin(ctx: CanvasRenderingContext2D, skin: SatelliteSkin) {
    // Diamond Sail Membrane
    ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.strokeStyle = skin.wingColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, 32);
    ctx.lineTo(-24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Structural Spars
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, 32);
    ctx.moveTo(-24, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();

    // Central Payload Pod
    ctx.fillStyle = skin.bodyColor;
    ctx.strokeStyle = skin.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawVanguardSkin(ctx: CanvasRenderingContext2D, skin: SatelliteSkin) {
    // Parabolic Dish
    ctx.strokeStyle = skin.wingColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(12, 0, 20, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.stroke();

    // Heavy Platform Body
    ctx.fillStyle = skin.bodyColor;
    ctx.strokeStyle = skin.accentColor;
    ctx.lineWidth = 2;
    ctx.fillRect(-18, -12, 26, 24);
    ctx.strokeRect(-18, -12, 26, 24);

    // Twin Plasma Emitters
    ctx.fillStyle = skin.accentColor;
    ctx.fillRect(-22, -8, 4, 6);
    ctx.fillRect(-22, 2, 4, 6);
  }

  private drawAegisSkin(ctx: CanvasRenderingContext2D, skin: SatelliteSkin) {
    // Centrifuge Torus Ring
    ctx.strokeStyle = skin.wingColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Interceptor Hull
    ctx.fillStyle = skin.bodyColor;
    ctx.strokeStyle = skin.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shield Aura
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}
