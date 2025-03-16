import React, { useRef } from 'react';
import { Sphere, Box } from '@react-three/drei';

const VolcanicIsland = ({ color = '#444444' }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      {/* Island base */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[10, 12, 5, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Volcano cone */}
      <mesh castShadow receiveShadow position={[0, 5, 0]}>
        <coneGeometry args={[8, 10, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </mesh>
      
      {/* Volcano crater */}
      <mesh castShadow receiveShadow position={[0, 10, 0]}>
        <cylinderGeometry args={[3, 4, 1.5, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.7} />
      </mesh>
      
      {/* Lava pool */}
      <mesh castShadow receiveShadow position={[0, 10, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.2, 16]} />
        <meshStandardMaterial 
          color="#ff4500" 
          emissive="#ff4500"
          emissiveIntensity={1}
          roughness={0.5} 
        />
      </mesh>
      
      {/* Lava streams */}
      <mesh castShadow receiveShadow position={[3, 6, 3]} rotation={[0.2, 0, 0.5]}>
        <boxGeometry args={[0.8, 0.3, 5]} />
        <meshStandardMaterial 
          color="#ff6600" 
          emissive="#ff4500"
          emissiveIntensity={0.8}
          roughness={0.6} 
        />
      </mesh>
      
      <mesh castShadow receiveShadow position={[-2, 5, -4]} rotation={[0.3, 1, -0.2]}>
        <boxGeometry args={[0.7, 0.2, 4]} />
        <meshStandardMaterial 
          color="#ff6600" 
          emissive="#ff4500"
          emissiveIntensity={0.8}
          roughness={0.6} 
        />
      </mesh>
      
      {/* Rocks */}
      <mesh castShadow receiveShadow position={[4, 3.5, 1]} rotation={[0.3, 0.5, 0.2]}>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>
      
      <mesh castShadow receiveShadow position={[-3, 4, 3]} rotation={[0.1, -0.3, 0.1]}>
        <boxGeometry args={[1.5, 2, 1.5]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>
    </group>
  );
};

export default VolcanicIsland;
