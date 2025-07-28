export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engines: OscillatorNode[] = [];
  private isInitialized = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
      
      this.createEngineSound();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private createEngineSound(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    // Create three oscillators for the three plasma rings
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 432.7 + (i * 10); // Based on harmonic resonance
      
      gain.gain.value = 0.1;
      
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      
      oscillator.start();
      this.engines.push(oscillator);
    }
  }

  public update(deltaTime: number, craftState: any): void {
    if (!this.isInitialized || !this.audioContext) return;
    
    // Modulate engine sound based on craft state
    const speedFactor = Math.min(craftState.speed / 1000, 1);
    const gForceFactor = Math.min(craftState.gForce / 5, 1);
    
    this.engines.forEach((engine, index) => {
      const baseFreq = 432.7 + (index * 10);
      const modulation = speedFactor * 100 + gForceFactor * 50;
      engine.frequency.value = baseFreq + modulation;
    });
  }

  public dispose(): void {
    if (this.audioContext) {
      this.engines.forEach(engine => engine.stop());
      this.audioContext.close();
    }
  }
}