// src/components/world/Island.jsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Detailed } from '@react-three/drei';
import * as THREE from 'three';

// Island type components
import StandardIsland from './islands/StandardIsland';
import VolcanicIsland from './islands/VolcanicIsland';
import CrystalIsland from './islands/CrystalIsland';
import AncientIsland from './islands/AncientIsland';

const Island = ({ data, dayNightCycle, weather }) => {
  const { id, position, size, type, name, color } = data;
  
  // Try to load a GLB model first
  const { scene } = useGLTF(`/models/islands/${type}.glb`, true);
  
  // Island lighting based on time of day
  const lightRef = useRef();
  const lightColor = useMemo(() => {
    // Day-night cycle affects light color
    if (dayNightCycle < 0.2 || dayNightCycle > 0.8) {
      // Night - blue tint
      return new THREE.Color('#3465a4');
    } else if (dayNightCycle < 0.3 || dayNightCycle > 0.7) {
      // Dawn/dusk - orange tint
      return new THREE.Color('#ff7700');
    } else {
      // Day - white/yellow
      return new THREE.Color('#ffffff');
    }
  }, [dayNightCycle]);
  
  // Weather effects
  const fogEffect = useMemo(() => {
    switch (weather) {
      case 'foggy':
        return 0.6;
      case 'stormy':
        return 0.4;
      case 'cloudy':
        return 0.2;
      default:
        return 0;
    }
  }, [weather]);
  
  // Island animation for some types
  useFrame((state) => {
    if (lightRef.current) {
      // Subtle light flicker
      lightRef.current.intensity = 0.5 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });
  
  // Level of detail for performance
  return (
    <Detailed distances={[0, 50, 300, 1000]}>
      {/* High detail version */}
      <group position={position} scale={[size, size, size]}>
        {scene ? (
          <primitive object={scene.clone()} />
        ) : (
          <RenderIslandByType type={type} color={color} weatherEffect={fogEffect} />
        )}
        
        {/* Island name label (only in high detail) */}
        <group position={[0, size * 1.5, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.3]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.8 - fogEffect * 0.5}
              depthTest={false}
            />
          </mesh>
        </group>
        
        {/* Island ambient light */}
        <pointLight
          ref={lightRef}
          position={[0, size * 0.5, 0]}
          color={lightColor}
          intensity={0.5}
          distance={size * 10}
          decay={2}
        />
      </group>
      
      {/* Medium detail version */}
      <group position={position} scale={[size, size, size]}>
        <RenderSimplifiedIsland type={type} color={color} weatherEffect={fogEffect} />
      </group>
      
      {/* Low detail version (far away) */}
      <mesh position={position} scale={[size * 2, size, size * 2]}>
        <cylinderGeometry args={[1, 1.3, 1, 8]} />
        <meshLambertMaterial color={getIslandBaseColor(type, color)} />
      </mesh>
      
      {/* Lowest detail (very far) */}
      <mesh position={position} scale={[size * 2, size * 0.5, size * 2]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial color={getIslandBaseColor(type, color)} />
      </mesh>
    </Detailed>
  );
};

// Helper function to render island by type
function RenderIslandByType({ type, color, weatherEffect }) {
  switch (type) {
    case 'volcanic':
      return <VolcanicIsland color={color} weatherEffect={weatherEffect} />;
    case 'crystal':
      return <CrystalIsland color={color} weatherEffect={weatherEffect} />;
    case 'ancient':
      return <AncientIsland color={color} weatherEffect={weatherEffect} />;
    case 'standard':
    default:
      return <StandardIsland color={color} weatherEffect={weatherEffect} />;
  }
}

// Simplified version for medium distance
function RenderSimplifiedIsland({ type, color, weatherEffect }) {
  const baseColor = getIslandBaseColor(type, color);
  
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[1, 1.5, 1, 8]} />
        <meshLambertMaterial color={baseColor} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        {type === 'volcanic' ? (
          <coneGeometry args={[1, 1.5, 8]} />
        ) : (
          <cylinderGeometry args={[1.2, 1, 0.4, 8]} />
        )}
        <meshLambertMaterial color={getIslandTopColor(type, color)} />
      </mesh>
    </group>
  );
}

// Helper function to get base color by island type
function getIslandBaseColor(type, color) {
  switch (type) {
    case 'volcanic':
      return '#444444';
    case 'crystal':
      return '#444466';
    case 'ancient':
      return '#997755';
    default:
      return color || '#8B4513';
  }
}

// Helper function to get top color by island type
function getIslandTopColor(type, color) {
  switch (type) {
    case 'volcanic':
      return '#222222';
    case 'crystal':
      return '#555577';
    case 'ancient':
      return '#aa9977';
    default:
      return '#228B22';
  }
}

export default Island;