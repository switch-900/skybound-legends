import React, { useRef } from 'react';
import { Box } from '@react-three/drei';

const CrystalIsland = ({ color = '#444466' }) => {
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
        <meshStandardMaterial color="#555577" roughness={0.9} />
      </mesh>
      
      {/* Large center crystal */}
      <mesh castShadow position={[0, 7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[4, 0]} />
        <meshPhysicalMaterial 
          color="#88ccff" 
          transmission={0.4}
          thickness={1}
          metalness={0.2}
          roughness={0}
          reflectivity={1}
          opacity={0.8}
          transparent
        />
      </mesh>
      
      {/* Small crystal clusters */}
      <Crystal position={[5, 3.5, 2]} rotation={[0.2, 0.5, 0.1]} size={1.5} color="#aaccff" />
      <Crystal position={[-3, 3.5, 4]} rotation={[-0.3, 1.2, 0.1]} size={1.2} color="#88aaff" />
      <Crystal position={[2, 3.5, -3]} rotation={[0.1, -0.5, 0.2]} size={1} color="#99bbff" />
      <Crystal position={[-4, 3.5, -1]} rotation={[0.3, 0.7, -0.1]} size={0.8} color="#7799ff" />
      <Crystal position={[4, 3.5, -4]} rotation={[-0.2, 0.3, 0.3]} size={1.3} color="#aaddff" />
    </group>
  );
};

// Helper component for crystal clusters
const Crystal = ({ position, rotation, size = 1, color = "#88ccff" }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <octahedronGeometry args={[size, 0]} />
        <meshPhysicalMaterial 
          color={color} 
          transmission={0.5}
          thickness={1}
          metalness={0.2}
          roughness={0.1}
          reflectivity={1}
          opacity={0.8}
          transparent
        />
      </mesh>
      <mesh castShadow position={[size * 0.7, size * 0.5, 0]} rotation={[0.5, 0.3, 0.2]}>
        <octahedronGeometry args={[size * 0.4, 0]} />
        <meshPhysicalMaterial 
          color={color} 
          transmission={0.5}
          thickness={1}
          metalness={0.2}
          roughness={0.1}
          reflectivity={1}
          opacity={0.8}
          transparent
        />
      </mesh>
      <mesh castShadow position={[-size * 0.5, size * 0.3, size * 0.4]} rotation={[0.2, -0.4, 0.3]}>
        <octahedronGeometry args={[size * 0.3, 0]} />
        <meshPhysicalMaterial 
          color={color} 
          transmission={0.5}
          thickness={1}
          metalness={0.2}
          roughness={0.1}
          reflectivity={1}
          opacity={0.8}
          transparent
        />
      </mesh>
    </group>
  );
};

export default CrystalIsland;
