import React from 'react';
import { Plane, Rocket, Moon, Zap } from 'lucide-react';

interface MissionSelectorProps {
  onMissionSelect: (mission: string) => void;
}

export function MissionSelector({ onMissionSelect }: MissionSelectorProps) {
  const missions = [
    {
      id: 'atmospheric',
      title: 'Atmospheric Reconnaissance',
      description: 'Urban stealth operations and disaster response reconnaissance',
      icon: Plane,
      difficulty: 'Beginner'
    },
    {
      id: 'space',
      title: 'Deep Space Operations',
      description: 'Asteroid belt navigation and Jupiter system exploration',
      icon: Rocket,
      difficulty: 'Intermediate'
    },
    {
      id: 'lunar',
      title: 'Lunar Anomaly Investigation',
      description: 'Investigate unknown energy signatures on the lunar surface',
      icon: Moon,
      difficulty: 'Advanced'
    }
  ];

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="text-cyan-400" size={32} />
            <h1 className="text-4xl font-bold text-white">PROJECT MANTA</h1>
          </div>
          <p className="text-gray-300 text-lg">Anti-Gravity Flight Simulator</p>
          <p className="text-gray-400 mt-2">Based on the TR-3B Black Manta Platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {missions.map((mission) => {
            const IconComponent = mission.icon;
            return (
              <button
                key={mission.id}
                onClick={() => onMissionSelect(mission.id)}
                className="bg-gray-900 border border-cyan-400 rounded-lg p-6 hover:bg-gray-800 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <IconComponent className="text-cyan-400 group-hover:text-cyan-300" size={24} />
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {mission.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{mission.title}</h3>
                <p className="text-gray-300 text-sm">{mission.description}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-gray-900 border border-cyan-400 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Control Instructions</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="text-cyan-400 font-semibold mb-2">Desktop Controls:</h4>
              <ul className="space-y-1">
                <li>WASD / Arrow Keys: Movement</li>
                <li>Space / Q: Ascend</li>
                <li>Shift / E: Descend</li>
                <li>Mouse: Look Around</li>
              </ul>
            </div>
            <div>
              <h4 className="text-cyan-400 font-semibold mb-2">Mobile Controls:</h4>
              <ul className="space-y-1">
                <li>Touch & Drag: Look Around</li>
                <li>Tilt Device: Roll Control</li>
                <li>Tap Systems: Toggle Features</li>
                <li>Gyroscope: Motion Control</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Powered by Three.js • Optimized for Mobile & VR • 60fps Target
          </p>
        </div>
      </div>
    </div>
  );
}