import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StandardAircraft = ({ color = '#3498db' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
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
    </group>
  );
};

export default StandardAircraft;
