// src/components/world/StatusIcon.jsx
import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ENEMY_STATES } from '../../data/enemies';

// Status Icon Component that handles loading and displaying the appropriate icon
export const StatusIcon = ({ state, position = [0, 2, 0], scale = 1 }) => {
  // Get the appropriate texture based on state
  const iconTexture = useTexture(getIconPath(state));
  
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial 
        map={iconTexture} 
        transparent={true}
        opacity={0.9}
        depthTest={false}
      />
    </sprite>
  );
};

// Function to get the appropriate texture path based on state
export function getIconPath(state) {
  switch (state) {
    case ENEMY_STATES.ATTACKING:
      return '/textures/icons/attacking.png';
    case ENEMY_STATES.RETREATING:
      return '/textures/icons/retreating.png';
    case ENEMY_STATES.PURSUING:
      return '/textures/icons/pursuing.png';
    case ENEMY_STATES.PATROLLING:
      return '/textures/icons/patrolling.png';
    case ENEMY_STATES.FORMATION:
      return '/textures/icons/formation.png';
    case ENEMY_STATES.IDLE:
      return '/textures/icons/idle.png';
    default:
      return '/textures/icons/default.png';
  }
}
