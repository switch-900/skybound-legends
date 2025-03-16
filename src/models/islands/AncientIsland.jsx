import React, { useRef } from 'react';
import { Box } from '@react-three/drei';

const AncientIsland = ({ color = '#997755' }) => {
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
        <meshStandardMaterial color="#aa9977" roughness={0.9} />
      </mesh>
      
      {/* Central temple structure */}
      <mesh castShadow receiveShadow position={[0, 4, 0]}>
        <boxGeometry args={[6, 2, 6]} />
        <meshStandardMaterial color="#ccbbaa" roughness={0.7} />
      </mesh>
      
      <mesh castShadow receiveShadow position={[0, 6, 0]}>
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial color="#ccbbaa" roughness={0.7} />
      </mesh>
      
      <mesh castShadow receiveShadow position={[0, 8, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ccbbaa" roughness={0.7} />
      </mesh>
      
      {/* Temple columns */}
      <AncientColumn position={[3.5, 4, 3.5]} height={3} />
      <AncientColumn position={[3.5, 4, -3.5]} height={3} />
      <AncientColumn position={[-3.5, 4, 3.5]} height={3} />
      <AncientColumn position={[-3.5, 4, -3.5]} height={3} />
      
      {/* Stone path */}
      <mesh castShadow receiveShadow position={[0, 3.1, 7]} rotation={[0, 0, 0]}>
        <boxGeometry args={[3, 0.2, 6]} />
        <meshStandardMaterial color="#bbaa99" roughness={0.8} />
      </mesh>
      
      {/* Ancient statues */}
      <AncientStatue position={[3.5, 3.5, 7]} rotation={[0, -Math.PI/4, 0]} />
      <AncientStatue position={[-3.5, 3.5, 7]} rotation={[0, Math.PI/4, 0]} />
    </group>
  );
};

// Helper component for ancient columns
const AncientColumn = ({ position, height = 3 }) => {
  return (
    <group position={position}>
      {/* Column base */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.3, 8]} />
        <meshStandardMaterial color="#bbaa99" roughness={0.6} />
      </mesh>
      
      {/* Column shaft */}
      <mesh castShadow receiveShadow position={[0, height/2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, height, 8]} />
        <meshStandardMaterial color="#ccbbaa" roughness={0.7} />
      </mesh>
      
      {/* Column capital */}
      <mesh castShadow receiveShadow position={[0, height, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.3, 8]} />
        <meshStandardMaterial color="#bbaa99" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Helper component for ancient statues
const AncientStatue = ({ position, rotation }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.3, 1.2]} />
        <meshStandardMaterial color="#bbaa99" roughness={0.7} />
      </mesh>
      
      {/* Statue body */}
      <mesh castShadow receiveShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[0.8, 2.5, 0.8]} />
        <meshStandardMaterial color="#ccbbaa" roughness={0.8} />
      </mesh>
      
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 2.8, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#ddccbb" roughness={0.7} />
      </mesh>
    </group>
  );
};

export default AncientIsland;
