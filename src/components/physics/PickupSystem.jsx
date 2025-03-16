
// src/components/physics/PickupSystem.jsx
import React from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../contexts/GameContext';
import { createPickupPhysics } from '../../utils/physics';

/**
 * Manages all collectible pickups in the game world
 */
const PickupSystem = ({ pickups }) => {
  const { actions } = useGame();
  
  return (
    <group name="pickup-system">
      {pickups.map(pickup => (
        <Pickup 
          key={pickup.id} 
          pickup={pickup}
          onCollect={(id) => actions.removePickup(id)}
        />
      ))}
    </group>
  );
};

/**
 * Individual pickup component
 */
const Pickup = ({ pickup, onCollect }) => {
  const [ref, api] = useSphere(() => ({
    ...createPickupPhysics(pickup),
    onCollide: (e) => {
      // Check if player collided with this pickup
      if (e.body.userData?.type === 'aircraft' && e.body.userData?.id === 'player') {
        onCollect(pickup.id);
      }
    }
  }));
  
  // Pickup floating animation
  useFrame(({ clock }) => {
    if (ref.current) {
      const time = clock.getElapsedTime();
      ref.current.position.y = pickup.position[1] + Math.sin(time * 2) * 0.3;
      ref.current.rotation.y = time * 0.5;
    }
  });
  
  // Render appropriate pickup model based on type
  return (
    <group ref={ref} name={`pickup-${pickup.id}`}>
      {renderPickupModel(pickup.pickupType)}
    </group>
  );
};

/**
 * Helper to render different pickup models
 */
function renderPickupModel(pickupType) {
  // Each pickup type has its own visual representation
  switch (pickupType) {
    case 'health':
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.41]}>
            <boxGeometry args={[0.3, 0.8, 0.05]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.41]}>
            <boxGeometry args={[0.8, 0.3, 0.05]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <pointLight color="#ff0000" intensity={1} distance={5} />
        </group>
      );
      
    case 'fuel':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.3, 0.5, 1, 8]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
          <pointLight color="#ffaa00" intensity={1} distance={5} />
        </group>
      );
      
    case 'ammo':
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.8, 0.5, 0.5]} />
            <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </mesh>
          <pointLight color="#ffff00" intensity={0.7} distance={3} />
        </group>
      );
      
    case 'credits':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.3} emissive="#ffd700" emissiveIntensity={0.3} />
          </mesh>
          <pointLight color="#ffd700" intensity={1} distance={5} />
        </group>
      );
      
    case 'experience':
      return (
        <group>
          <mesh>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.5} />
          </mesh>
          <pointLight color="#00aaff" intensity={1} distance={5} />
        </group>
      );
      
    default:
      // Generic pickup
      return (
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
          <pointLight color="#ffffff" intensity={0.7} distance={3} />
        </mesh>
      );
  }
}

export default PickupSystem;