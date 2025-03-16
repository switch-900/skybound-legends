// src/components/world/World.jsx
import React, { useMemo } from 'react';
import { useGame } from '../../contexts/GameContext';
import IslandGroup from './IslandGroup';
import CloudSystem from './CloudSystem';

const World = () => {
  const { state } = useGame();
  const { world } = state;
  
  // Filter islands by discovered zones
  const visibleIslands = useMemo(() => {
    return world.islands.filter(island => {
      return world.discoveredZones.includes(island.zone);
    });
  }, [world.islands, world.discoveredZones]);
  
  return (
    <group>
      {/* Island groups by zone */}
      {world.discoveredZones.map(zone => (
        <IslandGroup 
          key={zone}
          zone={zone}
          islands={visibleIslands.filter(island => island.zone === zone)}
          dayNightCycle={world.dayNightCycle}
          weather={world.weather}
        />
      ))}
      
      {/* Cloud system */}
      <CloudSystem 
        density={world.weather === 'cloudy' ? 2 : 
                world.weather === 'stormy' ? 3 : 
                world.weather === 'foggy' ? 4 : 1}
        weather={world.weather}
      />
    </group>
  );
};

export default World;