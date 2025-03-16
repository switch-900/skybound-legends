import React, { useRef } from 'react';
import * as THREE from 'three';

const ScoutAircraft = ({ color = '#2ecc71' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      {/* Lightweight fuselage */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.2, 2.5, 8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Small wings */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[3.5, 0.05, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Tail */}
      <mesh castShadow position={[0, 0.3, -1.1]}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Open cockpit */}
      <mesh castShadow position={[0, 0.25, 0.7]}>
        <capsuleGeometry args={[0.15, 0.4, 16, 16]} />
        <meshPhysicalMaterial 
          color="#88ccff" 
          transmission={0.95}
          opacity={0.7}
          metalness={0.1}
          roughness={0.05}
          transparent
        />
      </mesh>
      
      {/* Propeller */}
      <mesh position={[0, 0, 1.3]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 1.6, 0.02]} />
          <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.3} />
        </mesh>
      </mesh>
    </group>
  );
};

export default ScoutAircraft;
