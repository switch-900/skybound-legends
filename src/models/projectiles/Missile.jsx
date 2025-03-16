import React, { useRef } from 'react';
import * as THREE from 'three';

const Missile = ({ color = '#ff4500' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      {/* Main missile body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Missile nose cone */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Fins */}
      <group position={[0, -0.4, 0]}>
        {/* Four fins at 90-degree angles */}
        <mesh castShadow rotation={[0, 0, 0]}>
          <boxGeometry args={[0.05, 0.2, 0.4]} />
          <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
        </mesh>
        
        <mesh castShadow rotation={[0, Math.PI/2, 0]}>
          <boxGeometry args={[0.05, 0.2, 0.4]} />
          <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      
      {/* Rocket exhaust effect */}
      <mesh position={[0, -0.7, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      
      {/* Exhaust light */}
      <pointLight position={[0, -0.7, 0]} color={color} intensity={2} distance={3} decay={2} />
    </group>
  );
};

export default Missile;
