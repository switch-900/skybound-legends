

// src/components/physics/WorldBoundary.jsx
import React, { useEffect } from 'react';
import { useSphere, usePlane } from '@react-three/cannon';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../contexts/GameContext';
import { COLLISION_GROUPS, PHYSICS_SETTINGS } from '../../utils/physics';

/**
 * Creates invisible boundary to keep objects within the game world
 */
const WorldBoundary = ({ radius = PHYSICS_SETTINGS.WORLD_SIZE }) => {
  const { state, actions } = useGame();
  const { scene } = useThree();
  
  // Create spherical boundary - this detects when objects are leaving the world
  const [sphereRef] = useSphere(() => ({
    args: [radius], // radius
    position: [0, 0, 0],
    type: 'Static',
    isTrigger: true,
    collisionFilterGroup: COLLISION_GROUPS.BOUNDARY,
    collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.PROJECTILE,
    onCollide: handleBoundaryCollision
  }));
  
  // Ground plane to prevent objects from going too low
  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0], // horizontal plane
    position: [0, PHYSICS_SETTINGS.MIN_HEIGHT, 0],
    type: 'Static',
    collisionFilterGroup: COLLISION_GROUPS.BOUNDARY,
    collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY,
    onCollide: handleGroundCollision
  }));
  
  // Add fog to visually indicate the world boundary
  useEffect(() => {
    // Create fog that gets denser as you approach the boundary
    const boundaryFog = new THREE.FogExp2('#87CEEB', 0.002);
    scene.fog = boundaryFog;
    
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  
  // Handle boundary collision
  function handleBoundaryCollision(event) {
    const { body } = event;
    if (!body.userData) return;
    
    const type = body.userData.type;
    const id = body.userData.id;
    
    // Calculate position and distance from center
    const position = [];
    body.position.get(position);
    const pos = new THREE.Vector3(...position);
    const distFromCenter = pos.length();
    
    // Skip if not close to boundary
    if (distFromCenter < radius * 0.8) return;
    
    // Direction to center
    const dirToCenter = pos.clone().negate().normalize();
    
    // Handle different entity types
    if (type === 'aircraft') {
      if (id === 'player') {
        // Player is leaving the boundary - push back with increasing force
        const boundaryPenetration = (distFromCenter - radius * 0.8) / (radius * 0.2);
        const forceMagnitude = Math.pow(boundaryPenetration, 2) * 30;
        
        // Apply force toward center
        body.applyForce(
          [dirToCenter.x * forceMagnitude, dirToCenter.y * forceMagnitude, dirToCenter.z * forceMagnitude],
          [0, 0, 0]
        );
        
        // Only show notification if close to edge
        if (boundaryPenetration > 0.5 && Math.random() < 0.05) {
          actions.addNotification("WARNING: World boundary reached", 1000);
        }
      } else {
        // Enemy aircraft - apply force to keep within bounds
        const forceMagnitude = 20;
        body.applyForce(
          [dirToCenter.x * forceMagnitude, dirToCenter.y * forceMagnitude, dirToCenter.z * forceMagnitude],
          [0, 0, 0]
        );
      }
    } else if (type === 'projectile') {
      // Destroy projectiles that reach the boundary
      actions.removeProjectile(id);
    }
  }
  
  // Handle collision with ground
  function handleGroundCollision(event) {
    const { body, contact } = event;
    if (!body.userData) return;
    
    const type = body.userData.type;
    const id = body.userData.id;
    
    if (type === 'aircraft') {
      if (id === 'player') {
        // Player hit ground - apply damage based on velocity
        const contactVelocity = Math.abs(contact.impactVelocity);
        
        if (contactVelocity > 3) {
          // Significant impact - damage aircraft
          const damage = Math.floor(contactVelocity * 2);
          actions.updatePlayerStats({ 
            health: Math.max(0, state.player.health - damage) 
          });
          
          // Create explosion effect
          actions.addExplosion(contact.contactPoint, damage / 20);
          
          // Show notification
          actions.addNotification(`Ground impact! -${damage} health`, 2000);
          
          // Apply bounce force
          const bounceForce = contactVelocity * 10;
          body.applyForce([0, bounceForce, 0], [0, 0, 0]);
        } else {
          // Light contact - just bounce a bit
          body.applyForce([0, contactVelocity * 5, 0], [0, 0, 0]);
        }
      } else {
        // Enemy hit ground - damage based on velocity
        const contactVelocity = Math.abs(contact.impactVelocity);
        
        if (contactVelocity > 3) {
          // Damage the enemy
          actions.damageEnemy(id, Math.floor(contactVelocity * 2));
          
          // Create smaller explosion
          actions.addExplosion(contact.contactPoint, contactVelocity / 10);
        }
        
        // Apply bounce force
        const bounceForce = contactVelocity * 5;
        body.applyForce([0, bounceForce, 0], [0, 0, 0]);
      }
    }
  }
  
  return (
    <>
      <group ref={sphereRef} />
      <group ref={groundRef} />
    </>
  );
};

export default WorldBoundary;