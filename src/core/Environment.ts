import * as THREE from 'three';

export class Environment {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh | null = null;
  private stars: THREE.Points | null = null;
  private terrain: THREE.Mesh | null = null;
  private atmosphere: THREE.Mesh | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public async initialize(): Promise<void> {
    this.createStarfield();
    this.createTerrain();
    this.createAtmosphere();
  }

  private createStarfield(): void {
    const starCount = 10000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Random position in sphere
      const radius = 8000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);
      
      // Random star color (bluish to yellowish)
      const temp = 3000 + Math.random() * 7000;
      const [r, g, b] = this.temperatureToRGB(temp);
      starColors[i3] = r;
      starColors[i3 + 1] = g;
      starColors[i3 + 2] = b;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  private createTerrain(): void {
    const terrainGeometry = new THREE.PlaneGeometry(20000, 20000, 512, 512);
    const vertices = terrainGeometry.attributes.position.array as Float32Array;
    
    // Generate height map
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      
      // Multi-octave noise for realistic terrain
      let height = 0;
      height += this.noise(x * 0.001, z * 0.001) * 100;
      height += this.noise(x * 0.002, z * 0.002) * 50;
      height += this.noise(x * 0.004, z * 0.004) * 25;
      
      vertices[i + 1] = height;
    }
    
    terrainGeometry.computeVertexNormals();
    
    const terrainMaterial = new THREE.MeshLambertMaterial({
      color: 0x4a4a4a,
      wireframe: false
    });
    
    this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.position.y = -1000;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  private createAtmosphere(): void {
    const atmosphereGeometry = new THREE.SphereGeometry(12000, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.7 - dot(normalize(vPosition), vec3(0.0, 1.0, 0.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `
    });
    
    this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(this.atmosphere);
  }

  private noise(x: number, y: number): number {
    // Simple 2D noise function
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  private temperatureToRGB(temp: number): [number, number, number] {
    // Convert temperature to RGB color
    temp = temp / 100;
    
    let r, g, b;
    
    if (temp <= 66) {
      r = 255;
      g = temp < 19 ? 0 : 99.4708025861 * Math.log(temp - 10) - 161.1195681661;
    } else {
      r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    }
    
    if (temp >= 66) {
      b = 255;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    }
    
    return [
      Math.max(0, Math.min(255, r)) / 255,
      Math.max(0, Math.min(255, g)) / 255,
      Math.max(0, Math.min(255, b)) / 255
    ];
  }

  public update(deltaTime: number, craftPosition: THREE.Vector3): void {
    // Update atmosphere position to follow craft
    if (this.atmosphere) {
      this.atmosphere.position.copy(craftPosition);
    }
  }

  public loadMission(mission: string): void {
    // Load different environments based on mission
    switch (mission) {
      case 'atmospheric':
        this.scene.fog = new THREE.Fog(0x87CEEB, 1000, 8000);
        break;
      case 'space':
        this.scene.fog = new THREE.Fog(0x000000, 5000, 15000);
        break;
      case 'lunar':
        this.scene.fog = new THREE.Fog(0x1a1a1a, 2000, 10000);
        break;
    }
  }
}