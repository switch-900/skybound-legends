// src/components/aircraft/models/StandardAircraft.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function StandardAircraft({ color, isStalling, warningActive }) {
  const engineRef = useRef();
  
  // Animate engine glow based on throttle
  useFrame((state) => {
    if (engineRef.current) {
      engineRef.current.intensity = 1 + Math.sin(state.clock.getElapsedTime() * 10) * 0.2;
    }
  });
  
  return (
    <group>
      {/* Fuselage */}
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Wings */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[5, 0.1, 1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Tailfin */}
      <mesh castShadow position={[0, 0.5, -1.3]}>
        <boxGeometry args={[1.5, 0.8, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Cockpit */}
      <mesh castShadow position={[0, 0.3, 0.8]}>
        <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshPhysicalMaterial 
          color="#88ccff" 
          transmission={0.9}
          opacity={0.7}
          metalness={0.1}
          roughness={0.05}
          transparent
        />
      </mesh>
      
      {/* Engine glow */}
      <pointLight 
        ref={engineRef}
        position={[0, 0, -1.7]} 
        distance={2} 
        intensity={1.5} 
        color="#ff8800"
      />
      
      {/* Stall warning light */}
      {isStalling && (
        <>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial 
              color={warningActive ? '#ff0000' : '#440000'} 
              emissive={warningActive ? '#ff0000' : '#000000'} 
              emissiveIntensity={warningActive ? 2 : 0}
            />
          </mesh>
          <pointLight 
            position={[0, 0.5, 0]} 
            color="#ff0000" 
            intensity={warningActive ? 2 : 0} 
            distance={5}
          />
        </>
      )}
    </group>
  );
}