import React, { useRef } from 'react';
import * as THREE from 'three';

const FighterAircraft = ({ color = '#e74c3c' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      {/* Sleek fuselage */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.25, 4, 8]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Swept-back wings */}
      <mesh castShadow position={[0, 0, 0]} rotation={[0, Math.PI * 0.05, 0]}>
        <boxGeometry args={[4, 0.08, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* Sharp tailfin */}
      <mesh castShadow position={[0, 0.4, -1.8]}>
        <boxGeometry args={[0.1, 0.9, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* Cockpit */}
      <mesh castShadow position={[0, 0.25, 0.6]} rotation={[Math.PI * 0.03, 0, 0]}>
        <capsuleGeometry args={[0.2, 0.8, 16, 16]} />
        <meshPhysicalMaterial 
          color="#000000" 
          transmission={0.95}
          opacity={0.8}
          metalness={0.1}
          roughness={0.05}
          transparent
        />
      </mesh>
      
      {/* Wing-tip missiles */}
      <mesh position={[1.8, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.8, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

export default FighterAircraft;
