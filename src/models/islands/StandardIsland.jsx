import React, { useRef } from 'react';
import { Sphere, Box } from '@react-three/drei';

const StandardIsland = ({ color = '#8B4513' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      {/* Island base */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[10, 12, 5, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Top terrain */}
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <cylinderGeometry args={[10, 10, 1, 16]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>
      
      {/* Trees */}
      <group position={[2, 3.5, 3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 1.5, 0]}>
          <coneGeometry args={[1.5, 3, 8]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.8} />
        </mesh>
      </group>
      
      <group position={[-3, 3.5, 1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 1.5, 0]}>
          <coneGeometry args={[1.2, 2.5, 8]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.8} />
        </mesh>
      </group>
      
      <group position={[0, 3.5, -2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 1.2, 0]}>
          <coneGeometry args={[1, 2, 8]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
};

export default StandardIsland;
