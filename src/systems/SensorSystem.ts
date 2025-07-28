import * as THREE from 'three';

export class SensorSystem {
  private scene: THREE.Scene;
  private radarSweep: THREE.Mesh | null = null;
  private scanLines: THREE.LineSegments | null = null;
  private isActive = true;
  private sweepAngle = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public async initialize(): Promise<void> {
    this.createRadarSweep();
    this.createScanLines();
  }

  private createRadarSweep(): void {
    const sweepGeometry = new THREE.ConeGeometry(500, 10, 32, 1, true);
    const sweepMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float sweepAngle;
        varying vec2 vUv;
        
        void main() {
          float angle = atan(vUv.x - 0.5, vUv.y - 0.5) + 3.14159;
          float sweep = smoothstep(0.0, 0.2, abs(sin(angle - sweepAngle)));
          float radius = length(vUv - 0.5) * 2.0;
          
          vec3 color = vec3(0.0, 1.0, 0.0);
          float alpha = sweep * (1.0 - radius) * 0.3;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      uniforms: {
        time: { value: 0 },
        sweepAngle: { value: 0 }
      }
    });

    this.radarSweep = new THREE.Mesh(sweepGeometry, sweepMaterial);
    this.radarSweep.rotation.x = -Math.PI / 2;
    this.scene.add(this.radarSweep);
  }

  private createScanLines(): void {
    const lineCount = 50;
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6); // 2 points per line, 3 coords per point

    for (let i = 0; i < lineCount; i++) {
      const i6 = i * 6;
      const angle = (i / lineCount) * Math.PI * 2;
      const radius = 100 + Math.random() * 400;
      
      positions[i6] = 0;
      positions[i6 + 1] = 0;
      positions[i6 + 2] = 0;
      
      positions[i6 + 3] = Math.cos(angle) * radius;
      positions[i6 + 4] = Math.sin(angle) * radius;
      positions[i6 + 5] = 0;
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    });

    this.scanLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.scanLines);
  }

  public update(deltaTime: number, craftState: any): void {
    if (!this.isActive) return;

    const time = Date.now() * 0.001;
    this.sweepAngle += deltaTime * 2;

    // Update radar sweep
    if (this.radarSweep && this.radarSweep.material instanceof THREE.ShaderMaterial) {
      this.radarSweep.material.uniforms.time.value = time;
      this.radarSweep.material.uniforms.sweepAngle.value = this.sweepAngle;
      this.radarSweep.position.copy(craftState.position);
    }

    // Update scan lines
    if (this.scanLines) {
      this.scanLines.position.copy(craftState.position);
      this.scanLines.rotation.z += deltaTime * 0.5;
    }
  }

  public setActive(active: boolean): void {
    this.isActive = active;
    
    if (this.radarSweep) {
      this.radarSweep.visible = active;
    }
    
    if (this.scanLines) {
      this.scanLines.visible = active;
    }
  }

  public isActive(): boolean {
    return this.isActive;
  }
}