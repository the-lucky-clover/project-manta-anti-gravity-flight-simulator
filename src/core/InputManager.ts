export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  pitch: number;
  yaw: number;
  roll: number;
  touch: {
    active: boolean;
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
  };
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private keys: Set<string> = new Set();
  private inputState: InputState;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private gyroscopeEnabled = false;
  private gyroAlpha = 0;
  private gyroBeta = 0;
  private gyroGamma = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      pitch: 0,
      yaw: 0,
      roll: 0,
      touch: {
        active: false,
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0
      }
    };
    
    this.setupEventListeners();
    this.requestGyroscopePermission();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Mouse events (for desktop)
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Gyroscope events
    window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
  }

  private async requestGyroscopePermission(): Promise<void> {
    if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        this.gyroscopeEnabled = permission === 'granted';
      } catch (error) {
        console.warn('Gyroscope permission denied');
      }
    } else if ('DeviceOrientationEvent' in window) {
      this.gyroscopeEnabled = true;
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code);
    event.preventDefault();
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
    event.preventDefault();
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    this.inputState.touch.active = true;
    this.inputState.touch.x = touch.clientX;
    this.inputState.touch.y = touch.clientY;
    this.lastTouchX = touch.clientX;
    this.lastTouchY = touch.clientY;
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.inputState.touch.active) return;
    
    const touch = event.touches[0];
    this.inputState.touch.deltaX = touch.clientX - this.lastTouchX;
    this.inputState.touch.deltaY = touch.clientY - this.lastTouchY;
    this.lastTouchX = touch.clientX;
    this.lastTouchY = touch.clientY;
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.inputState.touch.active = false;
    this.inputState.touch.deltaX = 0;
    this.inputState.touch.deltaY = 0;
  }

  private handleMouseDown(event: MouseEvent): void {
    this.inputState.touch.active = true;
    this.inputState.touch.x = event.clientX;
    this.inputState.touch.y = event.clientY;
    this.lastTouchX = event.clientX;
    this.lastTouchY = event.clientY;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.inputState.touch.active) return;
    
    this.inputState.touch.deltaX = event.clientX - this.lastTouchX;
    this.inputState.touch.deltaY = event.clientY - this.lastTouchY;
    this.lastTouchX = event.clientX;
    this.lastTouchY = event.clientY;
  }

  private handleMouseUp(event: MouseEvent): void {
    this.inputState.touch.active = false;
    this.inputState.touch.deltaX = 0;
    this.inputState.touch.deltaY = 0;
  }

  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    if (!this.gyroscopeEnabled) return;
    
    this.gyroAlpha = event.alpha || 0;
    this.gyroBeta = event.beta || 0;
    this.gyroGamma = event.gamma || 0;
  }

  public update(): void {
    // Update keyboard input
    this.inputState.forward = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    this.inputState.backward = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    this.inputState.left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    this.inputState.right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    this.inputState.up = this.keys.has('Space') || this.keys.has('KeyQ');
    this.inputState.down = this.keys.has('ShiftLeft') || this.keys.has('KeyE');
    
    // Update rotation from touch/mouse
    const sensitivity = 0.002;
    if (this.inputState.touch.active) {
      this.inputState.yaw = -this.inputState.touch.deltaX * sensitivity;
      this.inputState.pitch = -this.inputState.touch.deltaY * sensitivity;
    } else {
      this.inputState.yaw = 0;
      this.inputState.pitch = 0;
    }
    
    // Update rotation from gyroscope
    if (this.gyroscopeEnabled && Math.abs(this.gyroGamma) > 5) {
      this.inputState.roll = this.gyroGamma * 0.01;
      this.inputState.pitch += this.gyroBeta * 0.005;
      this.inputState.yaw += this.gyroAlpha * 0.005;
    } else {
      this.inputState.roll = 0;
    }
    
    // Clamp rotation values
    this.inputState.pitch = Math.max(-1, Math.min(1, this.inputState.pitch));
    this.inputState.yaw = Math.max(-1, Math.min(1, this.inputState.yaw));
    this.inputState.roll = Math.max(-1, Math.min(1, this.inputState.roll));
  }

  public getState(): InputState {
    return { ...this.inputState };
  }
}