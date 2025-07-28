import { useState, useCallback } from 'react';
import * as THREE from 'three';

export interface GameState {
  gameMode: 'menu' | 'playing' | 'paused';
  currentMission: string | null;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  altitude: number;
  speed: number;
  gForce: number;
  systems: {
    propulsion: boolean;
    cloaking: boolean;
    sensors: boolean;
  };
  hud: {
    visible: boolean;
    mode: 'normal' | 'stealth' | 'tactical';
  };
}

const initialGameState: GameState = {
  gameMode: 'menu',
  currentMission: null,
  position: new THREE.Vector3(0, 1000, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  altitude: 1000,
  speed: 0,
  gForce: 1,
  systems: {
    propulsion: true,
    cloaking: false,
    sensors: true
  },
  hud: {
    visible: true,
    mode: 'normal'
  }
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({
      ...prev,
      ...updates,
      systems: updates.systems ? { ...prev.systems, ...updates.systems } : prev.systems,
      hud: updates.hud ? { ...prev.hud, ...updates.hud } : prev.hud
    }));
  }, []);

  return { gameState, updateGameState };
}