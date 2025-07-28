import * as THREE from 'three';

export class CloakingSystem {
  private scene: THREE.Scene;
  private cloakMaterial: THREE.ShaderMaterial | null = null;
  private isActive = false;
  private cloakIntensity = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public async initialize(): Promise<void> {
    this.createCloakMaterial();
  }

  private createCloakMaterial(): void {
    this.cloakMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float cloakIntensity;
        uniform vec3 cameraPosition;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(vNormal, viewDirection), 2.0);
          
          // Shimmer effect
          float shimmer = sin(time * 5.0 + vPosition.x * 0.1 + vPosition.y * 0.1) * 0.5 + 0.5;
          shimmer += noise(vUv * 10.0 + time * 0.1) * 0.3;
          
          // Distortion
          vec2 distortion = vec2(
            sin(time * 3.0 + vPosition.x * 0.05) * 0.02,
            cos(time * 2.0 + vPosition.y * 0.05) * 0.02
          );
          
          // Rainbow edge effect
          vec3 rainbow = vec3(
            sin(fresnel * 3.14159 + time * 2.0) * 0.5 + 0.5,
            sin(fresnel * 3.14159 + time * 2.0 + 2.0) * 0.5 + 0.5,
            sin(fresnel * 3.14159 + time * 2.0 + 4.0) * 0.5 + 0.5
          );
          
          float alpha = fresnel * shimmer * cloakIntensity;
          vec3 color = rainbow * alpha;
          
          gl_FragColor = vec4(color, alpha * 0.3);
        }
      `,
      uniforms: {
        time: { value: 0 },
        cloakIntensity: { value: 0 },
        cameraPosition: { value: new THREE.Vector3() }
      }
    });
  }

  public update(deltaTime: number, craftState: any): void {
    if (!this.cloakMaterial) return;

    const time = Date.now() * 0.001;
    this.cloakMaterial.uniforms.time.value = time;

    // Smoothly transition cloak intensity
    const targetIntensity = this.isActive ? 1.0 : 0.0;
    this.cloakIntensity += (targetIntensity - this.cloakIntensity) * deltaTime * 2;
    this.cloakMaterial.uniforms.cloakIntensity.value = this.cloakIntensity;

    // Update camera position for fresnel effect
    const camera = this.scene.getObjectByName('camera') as THREE.Camera;
    if (camera) {
      this.cloakMaterial.uniforms.cameraPosition.value.copy(camera.position);
    }
  }

  public setActive(active: boolean): void {
    this.isActive = active;
  }

  public isActive(): boolean {
    return this.isActive;
  }

  public getCloakMaterial(): THREE.ShaderMaterial | null {
    return this.cloakMaterial;
  }
}