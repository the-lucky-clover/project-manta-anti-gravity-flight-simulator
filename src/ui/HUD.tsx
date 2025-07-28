import React from 'react';
import { GameState } from '../core/GameState';
import { Radar, Zap, Eye, Settings, Pause } from 'lucide-react';

interface HUDProps {
  gameState: GameState;
  onSystemToggle: (system: string, enabled: boolean) => void;
  onPause: () => void;
}

export function HUD({ gameState, onSystemToggle, onPause }: HUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none text-green-400 font-mono">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <div className="bg-black bg-opacity-60 p-3 rounded border border-green-400">
          <div className="text-xs mb-1">ALTITUDE</div>
          <div className="text-lg font-bold">{Math.round(gameState.altitude)}m</div>
        </div>
        
        <div className="bg-black bg-opacity-60 p-3 rounded border border-green-400">
          <div className="text-xs mb-1">SPEED</div>
          <div className="text-lg font-bold">{Math.round(gameState.speed)} m/s</div>
        </div>
        
        <div className="bg-black bg-opacity-60 p-3 rounded border border-green-400">
          <div className="text-xs mb-1">G-FORCE</div>
          <div className="text-lg font-bold">{gameState.gForce.toFixed(1)}G</div>
        </div>
      </div>

      {/* System Status */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-black bg-opacity-60 p-3 rounded border border-green-400">
          <div className="text-xs mb-2">SYSTEMS</div>
          <div className="space-y-1">
            <button
              onClick={() => onSystemToggle('propulsion', !gameState.systems.propulsion)}
              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded ${
                gameState.systems.propulsion ? 'text-green-400' : 'text-red-400'
              }`}
            >
              <Zap size={16} />
              <span>PROPULSION</span>
            </button>
            <button
              onClick={() => onSystemToggle('cloaking', !gameState.systems.cloaking)}
              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded ${
                gameState.systems.cloaking ? 'text-green-400' : 'text-red-400'
              }`}
            >
              <Eye size={16} />
              <span>CLOAKING</span>
            </button>
            <button
              onClick={() => onSystemToggle('sensors', !gameState.systems.sensors)}
              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded ${
                gameState.systems.sensors ? 'text-green-400' : 'text-red-400'
              }`}
            >
              <Radar size={16} />
              <span>SENSORS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-8 h-8 border-2 border-green-400 rounded-full relative">
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-0 left-1/2 w-px h-4 bg-green-400 transform -translate-x-1/2 -translate-y-full"></div>
          <div className="absolute bottom-0 left-1/2 w-px h-4 bg-green-400 transform -translate-x-1/2 translate-y-full"></div>
          <div className="absolute left-0 top-1/2 h-px w-4 bg-green-400 transform -translate-y-1/2 -translate-x-full"></div>
          <div className="absolute right-0 top-1/2 h-px w-4 bg-green-400 transform -translate-y-1/2 translate-x-full"></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-auto">
        <div className="bg-black bg-opacity-60 p-3 rounded border border-green-400">
          <div className="text-xs mb-1">COORDINATES</div>
          <div className="text-sm">
            X: {Math.round(gameState.position.x)}<br/>
            Y: {Math.round(gameState.position.y)}<br/>
            Z: {Math.round(gameState.position.z)}
          </div>
        </div>
        
        <div className="bg-black bg-opacity-60 p-3 rounded border border-green-400">
          <div className="text-xs mb-1">VELOCITY</div>
          <div className="text-sm">
            X: {Math.round(gameState.velocity.x)}<br/>
            Y: {Math.round(gameState.velocity.y)}<br/>
            Z: {Math.round(gameState.velocity.z)}
          </div>
        </div>
        
        <button
          onClick={onPause}
          className="bg-black bg-opacity-60 p-3 rounded border border-green-400 hover:bg-green-400 hover:text-black transition-colors"
        >
          <Pause size={24} />
        </button>
      </div>

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden">
        <div className="bg-black bg-opacity-60 p-2 rounded border border-green-400 text-xs">
          <div>TOUCH & DRAG: Look Around</div>
          <div>TILT DEVICE: Roll Control</div>
          <div>TAP SYSTEMS: Toggle</div>
        </div>
      </div>

      {/* Warning Indicators */}
      {gameState.gForce > 5 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
          <div className="bg-red-600 bg-opacity-80 p-4 rounded border-2 border-red-400 text-white font-bold text-center">
            HIGH G-FORCE WARNING<br/>
            {gameState.gForce.toFixed(1)}G
          </div>
        </div>
      )}
    </div>
  );
}