import * as THREE from 'three';
import { InputManager } from './InputManager';

export interface CraftState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity: THREE.Vector3;
  mass: number;
  gravityReduction: number;
  speed: number;
  altitude: number;
  gForce: number;
}

export class CraftController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private craftMesh: THREE.Group;
  private state: CraftState;
  
  private readonly baseThrust = 500;
  private readonly maxSpeed = 2000;
  private readonly gravityStrength = 9.81;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.craftMesh = new THREE.Group();
    
    this.state = {
      position: new THREE.Vector3(0, 1000, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      mass: 1000,
      gravityReduction: 0.892, // 89.2% gravity cancellation
      speed: 0,
      altitude: 1000,
      gForce: 1
    };
  }

  public async initialize(): Promise<void> {
    this.createCraftGeometry();
    this.scene.add(this.craftMesh);
    this.craftMesh.position.copy(this.state.position);
  }

  private createCraftGeometry(): void {
    // Create TR-3B triangular craft
    const craftGeometry = new THREE.ConeGeometry(15, 2, 3);
    craftGeometry.rotateX(Math.PI / 2);
    
    const craftMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      specular: 0x333333,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    const craftBody = new THREE.Mesh(craftGeometry, craftMaterial);
    this.craftMesh.add(craftBody);
    
    // Add plasma rings at vertices
    this.createPlasmaRings();
    
    // Add cockpit
    const cockpitGeometry = new THREE.SphereGeometry(2, 16, 8);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
      color: 0x000033,
      transparent: true,
      opacity: 0.3
    });
    
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 1, 0);
    this.craftMesh.add(cockpit);
  }

  private createPlasmaRings(): void {
    const ringPositions = [
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(-8.66, 0, 5),
      new THREE.Vector3(8.66, 0, 5)
    ];
    
    ringPositions.forEach((pos, index) => {
      const ringGeometry = new THREE.TorusGeometry(2, 0.5, 8, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(pos);
      ring.rotation.x = Math.PI / 2;
      this.craftMesh.add(ring);
    });
  }

  public update(deltaTime: number, input: InputManager): void {
    this.updatePhysics(deltaTime, input);
    this.updateVisuals(deltaTime);
    this.updateCamera();
  }

  private updatePhysics(deltaTime: number, input: InputManager): void {
    const inputState = input.getState();
    
    // Reset acceleration
    this.state.acceleration.set(0, 0, 0);
    
    // Apply gravity (reduced by anti-gravity system)
    const gravity = this.gravityStrength * (1 - this.state.gravityReduction);
    this.state.acceleration.y -= gravity;
    
    // Apply thrust based on input
    const thrustForce = new THREE.Vector3();
    
    if (inputState.forward) thrustForce.z -= this.baseThrust;
    if (inputState.backward) thrustForce.z += this.baseThrust;
    if (inputState.left) thrustForce.x -= this.baseThrust;
    if (inputState.right) thrustForce.x += this.baseThrust;
    if (inputState.up) thrustForce.y += this.baseThrust;
    if (inputState.down) thrustForce.y -= this.baseThrust;
    
    // Apply rotation from input
    this.state.angularVelocity.x = inputState.pitch * 2;
    this.state.angularVelocity.y = inputState.yaw * 2;
    this.state.angularVelocity.z = inputState.roll * 2;
    
    // Apply thrust in world space
    thrustForce.applyEuler(this.state.rotation);
    this.state.acceleration.add(thrustForce.divideScalar(this.state.mass));
    
    // Update velocity
    this.state.velocity.add(this.state.acceleration.clone().multiplyScalar(deltaTime));
    
    // Apply drag
    const drag = 0.98;
    this.state.velocity.multiplyScalar(drag);
    
    // Limit speed
    if (this.state.velocity.length() > this.maxSpeed) {
      this.state.velocity.normalize().multiplyScalar(this.maxSpeed);
    }
    
    // Update position
    this.state.position.add(this.state.velocity.clone().multiplyScalar(deltaTime));
    
    // Update rotation
    this.state.rotation.x += this.state.angularVelocity.x * deltaTime;
    this.state.rotation.y += this.state.angularVelocity.y * deltaTime;
    this.state.rotation.z += this.state.angularVelocity.z * deltaTime;
    
    // Update derived values
    this.state.speed = this.state.velocity.length();
    this.state.altitude = this.state.position.y;
    this.state.gForce = Math.max(1, this.state.acceleration.length() / this.gravityStrength);
  }

  private updateVisuals(deltaTime: number): void {
    this.craftMesh.position.copy(this.state.position);
    this.craftMesh.rotation.copy(this.state.rotation);
    
    // Animate plasma rings
    this.craftMesh.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
        child.rotation.z += deltaTime * (2 + index * 0.5);
      }
    });
  }

  private updateCamera(): void {
    // Position camera in cockpit
    const cameraOffset = new THREE.Vector3(0, 1.5, 0);
    cameraOffset.applyEuler(this.state.rotation);
    this.camera.position.copy(this.state.position.clone().add(cameraOffset));
    
    // Camera follows craft rotation
    this.camera.rotation.copy(this.state.rotation);
    
    // Add slight camera shake based on G-force
    if (this.state.gForce > 2) {
      const shake = (this.state.gForce - 2) * 0.01;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
      this.camera.position.z += (Math.random() - 0.5) * shake;
    }
  }

  public getState(): CraftState {
    return { ...this.state };
  }

  public getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  public getVelocity(): THREE.Vector3 {
    return this.state.velocity.clone();
  }

  public getSpeed(): number {
    return this.state.speed;
  }

  public getAltitude(): number {
    return this.state.altitude;
  }

  public getGForce(): number {
    return this.state.gForce;
  }

  public reset(): void {
    this.state.position.set(0, 1000, 0);
    this.state.velocity.set(0, 0, 0);
    this.state.acceleration.set(0, 0, 0);
    this.state.rotation.set(0, 0, 0);
    this.state.angularVelocity.set(0, 0, 0);
    this.state.speed = 0;
    this.state.altitude = 1000;
    this.state.gForce = 1;
  }
}