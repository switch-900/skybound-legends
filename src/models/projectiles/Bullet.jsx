import React, { useRef } from 'react';
import * as THREE from 'three';

const Bullet = ({ color = '#ffff00' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      {/* Bullet body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Bullet tip */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <coneGeometry args={[0.05, 0.1, 8]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Tracer effect */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.04, 0.2, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      
      {/* Light effect */}
      <pointLight color={color} intensity={1.5} distance={2} decay={2} />
    </group>
  );
};

export default Bullet;
