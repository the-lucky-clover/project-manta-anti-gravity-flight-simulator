import * as THREE from 'three';
import { CraftController } from './CraftController';
import { PropulsionSystem } from '../systems/PropulsionSystem';
import { CloakingSystem } from '../systems/CloakingSystem';
import { SensorSystem } from '../systems/SensorSystem';
import { Environment } from './Environment';
import { AudioSystem } from './AudioSystem';
import { InputManager } from './InputManager';
import { GameState } from './GameState';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  
  private craft: CraftController;
  private propulsion: PropulsionSystem;
  private cloaking: CloakingSystem;
  private sensors: SensorSystem;
  private environment: Environment;
  private audio: AudioSystem;
  private input: InputManager;
  
  private updateGameState: (updates: Partial<GameState>) => void;
  private isInitialized = false;
  private isPaused = false;

  constructor(canvas: HTMLCanvasElement, updateGameState: (updates: Partial<GameState>) => void) {
    this.canvas = canvas;
    this.updateGameState = updateGameState;
    
    // Initialize Three.js core components
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.clock = new THREE.Clock();
    
    this.setupRenderer();
    this.setupScene();
    
    // Initialize systems
    this.craft = new CraftController(this.scene, this.camera);
    this.propulsion = new PropulsionSystem(this.scene);
    this.cloaking = new CloakingSystem(this.scene);
    this.sensors = new SensorSystem(this.scene);
    this.environment = new Environment(this.scene);
    this.audio = new AudioSystem();
    this.input = new InputManager(canvas);
    
    this.setupEventListeners();
  }

  private setupRenderer(): void {
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  private setupScene(): void {
    this.scene.fog = new THREE.Fog(0x000000, 1000, 5000);
    
    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
    
    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1000, 1000, 1000);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.pause();
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize all systems
      await Promise.all([
        this.craft.initialize(),
        this.propulsion.initialize(),
        this.cloaking.initialize(),
        this.sensors.initialize(),
        this.environment.initialize(),
        this.audio.initialize()
      ]);
      
      // Position camera in cockpit
      this.camera.position.set(0, 1.5, 0);
      this.camera.lookAt(0, 1.5, -1);
      
      this.isInitialized = true;
      this.start();
      
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
    }
  }

  private start(): void {
    if (this.animationId) return;
    
    const animate = () => {
      if (this.isPaused) return;
      
      this.animationId = requestAnimationFrame(animate);
      this.update();
      this.render();
    };
    
    animate();
  }

  private update(): void {
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update input
    this.input.update();
    
    // Update craft
    this.craft.update(deltaTime, this.input);
    
    // Update systems
    this.propulsion.update(deltaTime, this.craft.getState());
    this.cloaking.update(deltaTime, this.craft.getState());
    this.sensors.update(deltaTime, this.craft.getState());
    this.environment.update(deltaTime, this.craft.getPosition());
    this.audio.update(deltaTime, this.craft.getState());
    
    // Update game state
    this.updateGameState({
      position: this.craft.getPosition(),
      velocity: this.craft.getVelocity(),
      altitude: this.craft.getAltitude(),
      speed: this.craft.getSpeed(),
      gForce: this.craft.getGForce(),
      systems: {
        propulsion: this.propulsion.isActive(),
        cloaking: this.cloaking.isActive(),
        sensors: this.sensors.isActive()
      }
    });
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public startMission(mission: string): void {
    this.environment.loadMission(mission);
    this.craft.reset();
    this.isPaused = false;
    this.start();
  }

  public toggleSystem(system: string, enabled: boolean): void {
    switch (system) {
      case 'propulsion':
        this.propulsion.setActive(enabled);
        break;
      case 'cloaking':
        this.cloaking.setActive(enabled);
        break;
      case 'sensors':
        this.sensors.setActive(enabled);
        break;
    }
  }

  public pause(): void {
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resume(): void {
    this.isPaused = false;
    this.start();
  }

  public dispose(): void {
    this.pause();
    
    // Dispose of Three.js resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    this.audio.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
}