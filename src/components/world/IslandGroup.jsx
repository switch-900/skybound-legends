// src/components/world/IslandGroup.jsx
import React, { useMemo } from 'react';
import { useBox } from '@react-three/cannon';
import Island from './Island';

const IslandGroup = ({ zone, islands, dayNightCycle, weather }) => {
  // Create static physics bodies for all islands
  const islandBodies = useMemo(() => {
    return islands.map(island => {
      const [ref] = useBox(() => ({
        args: [island.size * 3, island.size * 2, island.size * 3],
        position: island.position,
        type: 'Static',
        material: { friction: 0.5, restitution: 0.3 },
        userData: { type: 'island', id: island.id, zone },
      }));
      
      return { ref, island };
    });
  }, [islands, zone]);
  
  return (
    <group name={`zone-${zone}`}>
      {islandBodies.map(({ ref, island }) => (
        <group key={island.id} ref={ref}>
          <Island 
            data={island}
            dayNightCycle={dayNightCycle}
            weather={weather}
          />
        </group>
      ))}
    </group>
  );
};

export default IslandGroup;