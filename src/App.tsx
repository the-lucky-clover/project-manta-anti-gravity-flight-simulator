import React, { useEffect, useRef } from 'react';
import { GameEngine } from './core/GameEngine';
import { HUD } from './ui/HUD';
import { MissionSelector } from './ui/MissionSelector';
import { useGameState } from './core/GameState';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { gameState, updateGameState } = useGameState();

  useEffect(() => {
    if (canvasRef.current && !gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(canvasRef.current, updateGameState);
      gameEngineRef.current.initialize();
    }

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.dispose();
      }
    };
  }, [updateGameState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ touchAction: 'none' }}
      />
      
      {gameState.gameMode === 'menu' && (
        <MissionSelector
          onMissionSelect={(mission) => {
            updateGameState({ gameMode: 'playing', currentMission: mission });
            gameEngineRef.current?.startMission(mission);
          }}
        />
      )}
      
      {gameState.gameMode === 'playing' && (
        <HUD
          gameState={gameState}
          onSystemToggle={(system, enabled) => {
            updateGameState({ systems: { ...gameState.systems, [system]: enabled } });
            gameEngineRef.current?.toggleSystem(system, enabled);
          }}
          onPause={() => {
            updateGameState({ gameMode: 'paused' });
            gameEngineRef.current?.pause();
          }}
        />
      )}
    </div>
  );
}

export default App;