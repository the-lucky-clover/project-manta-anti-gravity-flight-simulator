import * as THREE from 'three';

export class PropulsionSystem {
  private scene: THREE.Scene;
  private plasmaRings: THREE.Mesh[] = [];
  private particleSystem: THREE.Points | null = null;
  private isActive = true;
  private resonanceFrequency = 432.7;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public async initialize(): Promise<void> {
    this.createPlasmaEffects();
    this.createParticleSystem();
  }

  private createPlasmaEffects(): void {
    const ringPositions = [
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(-8.66, 0, 5),
      new THREE.Vector3(8.66, 0, 5)
    ];

    ringPositions.forEach((position, index) => {
      const ringGeometry = new THREE.TorusGeometry(3, 0.3, 8, 16);
      const ringMaterial = new THREE.ShaderMaterial({
        transparent: true,
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float intensity;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            float pulse = sin(time * 10.0 + vPosition.x * 0.1) * 0.5 + 0.5;
            float ring = smoothstep(0.3, 0.7, abs(sin(vUv.x * 6.28318)));
            
            vec3 color = vec3(0.0, 1.0, 1.0) * intensity;
            float alpha = ring * pulse * intensity;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        uniforms: {
          time: { value: 0 },
          intensity: { value: 1.0 }
        }
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      this.plasmaRings.push(ring);
      this.scene.add(ring);
    });
  }

  private createParticleSystem(): void {
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position around craft
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;
      
      // Random velocity
      velocities[i3] = (Math.random() - 0.5) * 10;
      velocities[i3 + 1] = (Math.random() - 0.5) * 10;
      velocities[i3 + 2] = (Math.random() - 0.5) * 10;
      
      // Cyan color
      colors[i3] = 0;
      colors[i3 + 1] = 1;
      colors[i3 + 2] = 1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particleSystem);
  }

  public update(deltaTime: number, craftState: any): void {
    if (!this.isActive) return;

    const time = Date.now() * 0.001;
    const speedFactor = Math.min(craftState.speed / 1000, 1);

    // Update plasma rings
    this.plasmaRings.forEach((ring, index) => {
      ring.rotation.y += deltaTime * (2 + speedFactor * 3);
      
      if (ring.material instanceof THREE.ShaderMaterial) {
        ring.material.uniforms.time.value = time;
        ring.material.uniforms.intensity.value = 0.5 + speedFactor * 0.5;
      }
    });

    // Update particle system
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;
      const velocities = this.particleSystem.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        // Update positions based on velocities
        positions[i] += velocities[i] * deltaTime;
        positions[i + 1] += velocities[i + 1] * deltaTime;
        positions[i + 2] += velocities[i + 2] * deltaTime;

        // Reset particles that go too far
        const distance = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
        if (distance > 100) {
          positions[i] = (Math.random() - 0.5) * 10;
          positions[i + 1] = (Math.random() - 0.5) * 10;
          positions[i + 2] = (Math.random() - 0.5) * 10;
        }
      }

      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
  }

  public setActive(active: boolean): void {
    this.isActive = active;
    
    this.plasmaRings.forEach(ring => {
      ring.visible = active;
    });
    
    if (this.particleSystem) {
      this.particleSystem.visible = active;
    }
  }

  public isActive(): boolean {
    return this.isActive;
  }
}