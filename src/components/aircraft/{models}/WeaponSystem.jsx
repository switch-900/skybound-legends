// src/components/aircraft/WeaponSystem.jsx
import React from 'react';
import { useGame } from '../../contexts/GameContext';

const WeaponSystem = ({ weapons }) => {
  return (
    <group>
      {weapons.map((weapon, index) => (
        <Weapon key={weapon.id} weapon={weapon} index={index} />
      ))}
    </group>
  );
};

const Weapon = ({ weapon, index }) => {
  // Weapon mounting positions based on index
  const positions = [
    [1.8, -0.2, 0.5],  // Right wing
    [-1.8, -0.2, 0.5], // Left wing
    [1.2, -0.2, 0.5],  // Inner right wing
    [-1.2, -0.2, 0.5], // Inner left wing
  ];
  
  const position = positions[index % positions.length];
  
  return (
    <group position={position}>
      {/* Weapon model based on type */}
      {weapon.type === 'Machinegun' && (
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
        </mesh>
      )}
      
      {weapon.type === 'Rocket' && (
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
          <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
          <mesh position={[0, 0, 0.6]}>
            <coneGeometry args={[0.08, 0.2, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
          </mesh>
        </mesh>
      )}
      
      {weapon.type === 'Missile' && (
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 1.5, 8]} />
          <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
          <mesh position={[0, 0, 0.8]}>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.6]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.5, 0.05, 0.2]} />
            <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
          </mesh>
        </mesh>
      )}
    </group>
  );
};

export default WeaponSystem;