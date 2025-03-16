// src/components/physics/PhysicsWorld.jsx
import React from 'react';
import { Physics } from '@react-three/cannon';
import { useGame } from '../../contexts/GameContext';
import { PHYSICS_SETTINGS } from '../../utils/physics';
import WorldBoundary from './WorldBoundary';

/**
 * Creates the physics world container with appropriate settings
 */
const PhysicsWorld = ({ children, debug = false }) => {
  const { state } = useGame();
  const { settings } = state;
  
  // Determine physics quality based on settings
  const physicsQuality = settings?.physicsQuality || 'medium';
  
  // Configure physics simulation parameters based on quality
  const physicsConfig = {
    low: {
      iterations: 5,
      tolerance: 0.1,
      maxSteps: 3,
      broadphase: 'SAP', // Sweep and Prune for basic collision detection
      allowSleep: true
    },
    medium: {
      iterations: 8,
      tolerance: 0.05,
      maxSteps: 5,
      broadphase: 'SAP',
      allowSleep: true
    },
    high: {
      iterations: 12,
      tolerance: 0.01,
      maxSteps: 8,
      broadphase: 'SAP',
      allowSleep: false
    }
  };
  
  // Get config for selected quality
  const config = physicsConfig[physicsQuality] || physicsConfig.medium;
  
  return (
    <Physics
      gravity={[0, PHYSICS_SETTINGS.GRAVITY, 0]}
      iterations={config.iterations}
      tolerance={config.tolerance}
      broadphase={config.broadphase}
      allowSleep={config.allowSleep}
      maxSteps={config.maxSteps}
      defaultContactMaterial={{ friction: 0.5, restitution: 0.3 }}
    >
      {/* World boundary to keep objects within playable area */}
      <WorldBoundary radius={PHYSICS_SETTINGS.WORLD_SIZE} />
      
      {/* Game physics objects will be added here */}
      {children}
    </Physics>
  );
};

export default PhysicsWorld;