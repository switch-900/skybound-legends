import React, { useRef } from 'react';
import * as THREE from 'three';

const BomberAircraft = ({ color = '#7f8c8d' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      {/* Large fuselage */}
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.5, 5, 8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Wide wings */}
      <mesh castShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[7, 0.15, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Twin tail stabilizers */}
      <mesh castShadow position={[0.7, 0.5, -2]}>
        <boxGeometry args={[0.1, 1, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[-0.7, 0.5, -2]}>
        <boxGeometry args={[0.1, 1, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Cockpit */}
      <mesh castShadow position={[0, 0.5, 1.8]}>
        <sphereGeometry args={[0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshPhysicalMaterial 
          color="#88ccff" 
          transmission={0.85}
          opacity={0.8}
          metalness={0.2}
          roughness={0.1}
          transparent
        />
      </mesh>
      
      {/* Bomb bay */}
      <mesh position={[0, -0.45, 0]}>
        <boxGeometry args={[0.8, 0.1, 2]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Engines */}
      <mesh position={[1.5, 0, 0.5]}>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[-1.5, 0, 0.5]}>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
};

export default BomberAircraft;
