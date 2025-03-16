

// src/components/physics/CollisionSystem.jsx
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../contexts/GameContext';
import { calculateCollisionDamage } from '../../utils/physics';

/**
 * System to handle advanced collisions using raycasting
 * This complements the built-in cannon.js collisions with more precise hit detection
 */
const CollisionSystem = () => {
  const { state, actions } = useGame();
  const { scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  
  // Process collisions every frame
  useFrame(() => {
    // Process projectile collisions using raycasting for better precision
    processProjectileCollisions();
    
    // Process other collision types as needed
    // ...
  });
  
  // Process projectile collisions using raycasting
  function processProjectileCollisions() {
    // Skip if no projectiles
    if (!state.world.projectiles || state.world.projectiles.length === 0) return;
    
    state.world.projectiles.forEach(projectile => {
      // Skip projectiles that don't have position data
      if (!projectile.position || !projectile.velocity) return;
      
      // Get current and previous position
      const currPos = new THREE.Vector3(...projectile.position);
      const prevPos = projectile.prevPosition 
        ? new THREE.Vector3(...projectile.prevPosition)
        : currPos.clone().sub(new THREE.Vector3(...projectile.velocity).multiplyScalar(0.1));
      
      // Direction and length of movement this frame
      const moveDir = new THREE.Vector3().subVectors(currPos, prevPos).normalize();
      const moveLength = prevPos.distanceTo(currPos);
      
      // Setup raycaster along projectile's path
      raycaster.current.set(prevPos, moveDir);
      raycaster.current.far = moveLength;
      
      // Collect objects to test against
      const targets = [];
      
      // Add appropriate targets based on projectile owner
      if (projectile.owner === 'player') {
        // Player projectiles hit enemies and islands
        scene.traverse(object => {
          if (object.userData?.type === 'enemy' ||
              object.userData?.type === 'island') {
            targets.push(object);
          }
        });
      } else {
        // Enemy projectiles hit player and islands
        scene.traverse(object => {
          if (object.userData?.type === 'aircraft' && 
              object.userData?.id === 'player' ||
              object.userData?.type === 'island') {
            targets.push(object);
          }
        });
      }
      
      // Perform the raycast
      const intersects = raycaster.current.intersectObjects(targets, true);
      
      // Process first (closest) intersection if any
      if (intersects.length > 0) {
        const hit = intersects[0];
        
        // Find the root object of what was hit
        let targetObject = hit.object;
        while (targetObject.parent && !targetObject.userData?.type) {
          targetObject = targetObject.parent;
        }
        
        const targetType = targetObject.userData?.type;
        const targetId = targetObject.userData?.id;
        
        // Process hit based on type
        if (targetType === 'island') {
          // Hit an island - create explosion and remove projectile
          actions.addExplosion(hit.point.toArray(), 0.5);
          actions.removeProjectile(projectile.id);
        }
        else if (targetType === 'enemy' && projectile.owner === 'player') {
          // Hit an enemy - apply damage
          const damage = projectile.damage || 10;
          
          // Different damage for different weapon types
          let finalDamage = damage;
          
          // Apply damage to the enemy
          actions.damageEnemy(targetId, finalDamage);
          
          // Create explosion effect
          actions.addExplosion(hit.point.toArray(), 0.8);
          
          // Remove the projectile
          actions.removeProjectile(projectile.id);
        }
        else if (targetType === 'aircraft' && targetId === 'player' && projectile.owner === 'enemy') {
          // Hit player aircraft - apply damage
          const damage = projectile.damage || 5;
          const armorLevel = state.aircraft.armorLevel || 1;
          
          // Apply armor reduction
          const armorFactor = 1 - ((armorLevel - 1) * 0.15);
          const finalDamage = Math.floor(damage * armorFactor);
          
          // Update player health
          actions.updatePlayerStats({ 
            health: Math.max(0, state.player.health - finalDamage) 
          });
          
          // Create hit effect
          actions.addExplosion(hit.point.toArray(), 0.8);
          
          // Show hit notification
          actions.addNotification(`Hit! -${finalDamage} health`);
          
          // Remove projectile
          actions.removeProjectile(projectile.id);
        }
      }
      
      // Store current position as previous position for next frame
      if (!projectile.prevPosition) {
        projectile.prevPosition = [...projectile.position];
      } else {
        projectile.prevPosition = [...projectile.position];
      }
    });
  }
  
  // No visual representation for the collision system
  return null;
};

export default CollisionSystem;