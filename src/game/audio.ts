/**
 * Audio Engine for Orbit Hop
 * 100% procedural Web Audio API synthesizers - zero external MP3 asset dependency.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private thrusterOsc: OscillatorNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private isThrusting = false;
  public enabled = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && this.thrusterGain && this.ctx) {
      this.thrusterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  /**
   * Continuous thruster drone with dynamic pitch & filter modulation
   */
  public startThrust() {
    if (!this.enabled || this.isThrusting) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isThrusting = true;
    const now = this.ctx.currentTime;

    if (!this.thrusterOsc) {
      this.thrusterOsc = this.ctx.createOscillator();
      this.thrusterFilter = this.ctx.createBiquadFilter();
      this.thrusterGain = this.ctx.createGain();

      this.thrusterOsc.type = 'sawtooth';
      this.thrusterOsc.frequency.setValueAtTime(85, now);

      this.thrusterFilter.type = 'lowpass';
      this.thrusterFilter.frequency.setValueAtTime(320, now);
      this.thrusterFilter.Q.setValueAtTime(4, now);

      this.thrusterGain.gain.setValueAtTime(0.001, now);

      this.thrusterOsc.connect(this.thrusterFilter);
      this.thrusterFilter.connect(this.thrusterGain);
      this.thrusterGain.connect(this.ctx.destination);

      this.thrusterOsc.start();
    }

    if (this.thrusterGain && this.thrusterFilter && this.thrusterOsc) {
      this.thrusterGain.gain.cancelScheduledValues(now);
      this.thrusterGain.gain.setValueAtTime(this.thrusterGain.gain.value, now);
      this.thrusterGain.gain.linearRampToValueAtTime(0.18, now + 0.05);

      this.thrusterOsc.frequency.cancelScheduledValues(now);
      this.thrusterOsc.frequency.linearRampToValueAtTime(140, now + 0.15);

      this.thrusterFilter.frequency.cancelScheduledValues(now);
      this.thrusterFilter.frequency.linearRampToValueAtTime(650, now + 0.12);
    }
  }

  public stopThrust() {
    if (!this.isThrusting) return;
    this.isThrusting = false;
    if (!this.ctx || !this.thrusterGain || !this.thrusterOsc || !this.thrusterFilter) return;

    const now = this.ctx.currentTime;
    this.thrusterGain.gain.cancelScheduledValues(now);
    this.thrusterGain.gain.setValueAtTime(this.thrusterGain.gain.value, now);
    this.thrusterGain.gain.linearRampToValueAtTime(0.0001, now + 0.08);

    this.thrusterOsc.frequency.cancelScheduledValues(now);
    this.thrusterOsc.frequency.linearRampToValueAtTime(80, now + 0.08);

    this.thrusterFilter.frequency.cancelScheduledValues(now);
    this.thrusterFilter.frequency.linearRampToValueAtTime(250, now + 0.08);
  }

  /**
   * Discrete hop pulse chirp (used in Tap-Pulse mode)
   */
  public playHopPulse() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Adrenaline near-miss frequency sweep
   */
  public playNearMiss() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(6, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  /**
   * Crisp 1,000 km distance milestone arpeggio
   */
  public playMilestone() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const noteTime = startTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }

  /**
   * Atmosphere re-entry friction warning beep
   */
  public playAtmosphereWarning() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.05);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Hull impact and explosion crunch synth
   */
  public playExplosion() {
    this.stopThrust();
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.52);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.42);
  }
}

export const soundEngine = new SoundEngine();
