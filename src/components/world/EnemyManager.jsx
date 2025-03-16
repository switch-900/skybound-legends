// src/components/world/EnemyManager.jsx
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useBox } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Trail, useGLTF, Text } from '@react-three/drei';
import { useGame } from '../../contexts/GameContext';
import AircraftModel from '../aircraft/AircraftModel';
import { 
  ENEMY_TYPES, 
  ENEMY_FACTIONS, 
  ENEMY_STATES, 
  PATROL_PATTERNS 
} from '../../data/enemies';

/**
 * Main EnemyManager component that handles all enemies in the game
 */
const EnemyManager = ({ enemies }) => {
  const { state, actions } = useGame();
  const { player, world } = state;
  
// Spawn new enemies based on player position and world state
useFrame(() => {
    // Get current player position and zone
    const playerPos = new THREE.Vector3(...playerPosition);
    const playerZone = worldState.activeZone;
    const now = Date.now();
    
    // Skip spawning if at enemy limit
    const maxEnemies = state.settings?.maxEnemies || 15;
    if (enemies.length >= maxEnemies) return;
    
    // Check if cooldown has passed since last spawn
    const lastSpawnTime = useRef(0);
    const spawnCooldown = 10000; // 10 seconds
    if (now - lastSpawnTime.current < spawnCooldown) return;
    
    // Calculate difficulty factor based on player level and progress
    const playerLevel = state.player.level || 1;
    const difficultyFactor = Math.min(playerLevel / 10, 1) * 
                             (state.settings?.difficulty || 1);
    
    // Spawn chance based on zone, player level and current enemy count
    const baseSpawnChance = 0.2; // 20% base chance per check
    const spawnChance = baseSpawnChance * difficultyFactor * 
                       (1 - (enemies.length / maxEnemies));
    
    // Random roll to determine if we spawn
    if (Math.random() > spawnChance) return;
    
    // Determine what type of spawn (single enemy or formation)
    const formationChance = 0.3 * difficultyFactor; // 30% chance scaled by difficulty
    const isFormation = Math.random() < formationChance;
    
    // Get appropriate enemy types for this zone
    const zoneEnemies = getZoneEnemyTypes(playerZone, playerLevel);
    if (zoneEnemies.length === 0) return;
    
    // Pick a random enemy type
    const enemyType = zoneEnemies[Math.floor(Math.random() * zoneEnemies.length)];
    
    // Find a valid spawn position (away from player but within view distance)
    const spawnPosition = calculateSpawnPosition(playerPos, worldState);
    if (!spawnPosition) return; // No valid position found
    
    // Create enemy or formation
    let newEnemies = [];
    
    if (isFormation) {
      // Formation size based on difficulty
      const formationSize = Math.floor(2 + Math.random() * 3 * difficultyFactor);
      newEnemies = createFormation(enemyType, [spawnPosition.x, spawnPosition.y, spawnPosition.z], formationSize);
    } else {
      // Single enemy
      const newEnemy = createEnemy(enemyType, [spawnPosition.x, spawnPosition.y, spawnPosition.z]);
      if (newEnemy) newEnemies = [newEnemy];
    }
    
    // Add enemies to world state
    if (newEnemies.length > 0) {
      actions.addEnemies(newEnemies);
      
      // Set the last spawn time
      lastSpawnTime.current = now;
      
      // Debug notification
      if (state.ui?.debug) {
        const formationText = isFormation ? `formation (${newEnemies.length})` : "enemy";
        actions.addNotification(`Spawned ${enemyType} ${formationText} at ${Math.round(spawnPosition.x)}, ${Math.round(spawnPosition.y)}, ${Math.round(spawnPosition.z)}`);
      }
    }
  });

// Helper functions for enemy spawning

// Determine appropriate enemy types for a zone and player level
function getZoneEnemyTypes(zone, playerLevel) {
  // Map zones to enemy types with minimum level requirements
  const zoneEnemies = {
    'startingIslands': [
      { type: 'PIRATE_FIGHTER', minLevel: 1 },
      { type: 'MILITARY_PATROL', minLevel: 2 },
      { type: 'MERCENARY_SCOUT', minLevel: 3 }
    ],
    'volcanicZone': [
      { type: 'PIRATE_FIGHTER', minLevel: 3 },
      { type: 'PIRATE_BOMBER', minLevel: 4 },
      { type: 'MILITARY_ELITE', minLevel: 5 }
    ],
    'crystalZone': [
      { type: 'MERCENARY_SCOUT', minLevel: 4 },
      { type: 'MILITARY_ELITE', minLevel: 5 }
    ],
    'ancientZone': [
      { type: 'PIRATE_BOMBER', minLevel: 5 },
      { type: 'MILITARY_ELITE', minLevel: 6 },
      { type: 'SKY_KRAKEN', minLevel: 8 }
    ]
  };
  
  // Get enemies for this zone
  const enemiesForZone = zoneEnemies[zone] || zoneEnemies['startingIslands'];
  
  // Filter by player level
  return enemiesForZone
    .filter(enemy => enemy.minLevel <= playerLevel)
    .map(enemy => enemy.type);
}

// Calculate a valid spawn position
function calculateSpawnPosition(playerPos, worldState) {
  const minDistance = 80; // Not too close to player
  const maxDistance = 150; // Not too far to be visible
  const minHeight = 30; // Not too low
  const maxHeight = 120; // Not too high
  const maxAttempts = 10; // Max attempts to find valid position
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random angle and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const height = minHeight + Math.random() * (maxHeight - minHeight);
    
    // Calculate position
    const spawnPos = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * distance,
      playerPos.y + (Math.random() - 0.5) * height,
      playerPos.z + Math.sin(angle) * distance
    );
    
    // Check if position is too close to islands
    let tooCloseToIsland = false;
    for (const island of worldState.islands) {
      const islandPos = new THREE.Vector3(...island.position);
      const distanceToIsland = spawnPos.distanceTo(islandPos);
      if (distanceToIsland < island.size * 3) {
        tooCloseToIsland = true;
        break;
      }
    }
    
    // Check if position is too close to other enemies
    let tooCloseToEnemy = false;
    for (const enemy of worldState.enemies) {
      const enemyPos = new THREE.Vector3(...enemy.position);
      const distanceToEnemy = spawnPos.distanceTo(enemyPos);
      if (distanceToEnemy < 30) {
        tooCloseToEnemy = true;
        break;
      }
    }
    
    // Return position if valid
    if (!tooCloseToIsland && !tooCloseToEnemy) {
      return spawnPos;
    }
  }
  
  // No valid position found after max attempts
  return null;
}

  return (
    <group name="enemy-manager">
      {enemies.map(enemy => (
        <Enemy 
          key={enemy.id} 
          enemy={enemy} 
          playerPosition={player.position}
          worldState={world}
        />
      ))}
    </group>
  );
};

/**
 * Individual Enemy component with AI behavior and physics
 */
const Enemy = ({ enemy, playerPosition, worldState }) => {
  const { state, actions } = useGame();
  const { scene } = useThree();
  
  // Internal state for enemy behavior
  const [behaviorState, setBehaviorState] = useState(enemy.initialState || ENEMY_STATES.PATROLLING);
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...enemy.position));
  const [lastFired, setLastFired] = useState(0);
  const [health, setHealth] = useState(enemy.health || 100);
  const [alertLevel, setAlertLevel] = useState(0); // 0-1 scale of alertness
  const [currentPatrolIndex, setCurrentPatrolIndex] = useState(0);
  const lastDirectionChange = useRef(0);
  const formationOffset = useRef(new THREE.Vector3());
  const avoidanceForce = useRef(new THREE.Vector3());
  
  // Load enemy model if available
  const { scene: enemyModel } = useGLTF(`/models/aircraft/${enemy.model || 'standard'}.glb`, true);
  
  // Different physics properties based on enemy type
  const physicsProps = useMemo(() => {
    switch (enemy.type) {
      case ENEMY_TYPES.BOSS:
        return { mass: 2000, linearDamping: 0.6, angularDamping: 0.8, size: [4, 1.5, 6] };
      case ENEMY_TYPES.AGGRESSIVE:
        return { mass: 800, linearDamping: 0.5, angularDamping: 0.7, size: [3, 1, 5] };
      case ENEMY_TYPES.SCOUT:
        return { mass: 500, linearDamping: 0.3, angularDamping: 0.6, size: [2.5, 0.8, 4] };
      default:
        return { mass: 1000, linearDamping: 0.7, angularDamping: 0.9, size: [3, 1, 5] };
    }
  }, [enemy.type]);

  // Create physics body for enemy
  const [ref, api] = useBox(() => ({
    mass: physicsProps.mass,
    position: enemy.position,
    rotation: enemy.rotation,
    type: 'Dynamic',
    linearDamping: physicsProps.linearDamping,
    angularDamping: physicsProps.angularDamping,
    collisionResponse: true,
    userData: { 
      type: 'enemy', 
      id: enemy.id,
      faction: enemy.faction || ENEMY_FACTIONS.PIRATES,
      enemyType: enemy.type || ENEMY_TYPES.PATROL
    },
    args: physicsProps.size, // Aircraft hitbox size
    onCollide: handleCollision,
  }), []);
  
  // Reference to debug text
  const debugTextRef = useRef();
  
  // Patrol path points based on pattern type
  const patrolPath = useMemo(() => {
    const patternType = enemy.patrolPattern || PATROL_PATTERNS.CIRCLE;
    const centerPoint = new THREE.Vector3(...(enemy.patrolCenter || enemy.position));
    const radius = enemy.patrolRadius || 50;
    const height = enemy.patrolHeight || 0;
    const points = [];
    
    switch (patternType) {
      case PATROL_PATTERNS.CIRCLE:
        // Create a circular path
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          points.push(new THREE.Vector3(
            centerPoint.x + Math.cos(angle) * radius,
            centerPoint.y + height,
            centerPoint.z + Math.sin(angle) * radius
          ));
        }
        break;
        
      case PATROL_PATTERNS.FIGURE_EIGHT:
        // Create a figure-eight path
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          points.push(new THREE.Vector3(
            centerPoint.x + Math.cos(angle) * radius,
            centerPoint.y + height,
            centerPoint.z + Math.sin(angle * 2) * radius / 2
          ));
        }
        break;
        
      case PATROL_PATTERNS.LINEAR:
        // Create a linear back-and-forth path
        points.push(
          new THREE.Vector3(centerPoint.x - radius, centerPoint.y + height, centerPoint.z),
          new THREE.Vector3(centerPoint.x + radius, centerPoint.y + height, centerPoint.z)
        );
        break;
        
      case PATROL_PATTERNS.RANDOM:
      default:
        // Create random points in a cube
        for (let i = 0; i < 5; i++) {
          points.push(new THREE.Vector3(
            centerPoint.x + (Math.random() - 0.5) * radius * 2,
            centerPoint.y + height + (Math.random() - 0.5) * radius / 2,
            centerPoint.z + (Math.random() - 0.5) * radius * 2
          ));
        }
        break;
    }
    
    return points;
  }, [enemy.patrolPattern, enemy.patrolCenter, enemy.patrolRadius, enemy.patrolHeight, enemy.position]);
  
  // Handle collisions with projectiles, islands, or player
  function handleCollision(event) {
    const { body, contact } = event;
    
    // Skip non-damaging collisions
    if (!body.userData) return;
    
    const impactVelocity = contact.impactVelocity;
    const objectType = body.userData.type;
    
    // Calculate damage based on collision type
    let damage = 0;
    let shouldCreateExplosion = false;
    
    if (objectType === 'projectile' && body.userData.owner === 'player') {
      // Projectile hit from player
      damage = body.userData.damage || 10;
      shouldCreateExplosion = true;
      
      // Increase alert level
      setAlertLevel(1.0);
      
      // Switch to attacking state if not already
      if (behaviorState !== ENEMY_STATES.ATTACKING) {
        setBehaviorState(ENEMY_STATES.ATTACKING);
      }
    } 
    else if (objectType === 'island') {
      // Collision with island
      damage = Math.max(10, Math.abs(impactVelocity) * 5);
      shouldCreateExplosion = true;
    }
    else if (objectType === 'aircraft' && body.userData.id === 'player') {
      // Collision with player
      damage = Math.max(5, Math.abs(impactVelocity) * 3);
      shouldCreateExplosion = Math.abs(impactVelocity) > 3;
    }
    
    // Apply damage if any
    if (damage > 0) {
      applyDamage(damage);
    }
    
    // Create explosion effect if needed
    if (shouldCreateExplosion) {
      actions.addExplosion(contact.contactPoint, damage / 20);
    }
  }
  
  // Apply damage to enemy and check if destroyed
  function applyDamage(amount) {
    const newHealth = health - amount;
    setHealth(newHealth);
    
    if (newHealth <= 0 && health > 0) {
      // Enemy is destroyed
      handleDestruction();
    } 
    else if (newHealth < 30 && behaviorState !== ENEMY_STATES.RETREATING) {
      // Low health - retreat
      setBehaviorState(ENEMY_STATES.RETREATING);
    }
  }
  
  // Handle enemy destruction
  function handleDestruction() {
    // Create explosion
    const position = [];
    api.position.get(position);
    actions.addExplosion(position, 3);
    
    // Award experience and potentially drop items
    actions.addExperience(enemy.experienceValue || 50);
    actions.addCredits(enemy.creditValue || 100);
    
    // Potentially drop items
    if (enemy.dropsItems && Math.random() < enemy.dropChance) {
      // Item drop logic would go here
    }
    
    // Check if this enemy was part of a mission objective
    checkMissionObjective(enemy.id);
    
    // If it's a boss, maybe trigger a special event
    if (enemy.type === ENEMY_TYPES.BOSS) {
      // Boss defeated logic
    }
    
    // Remove enemy from scene
    // This would be handled by the parent component in full implementation
    api.position.set(0, -1000, 0); // Move out of sight for now
  }
  
  // Check if killing this enemy completes a mission objective
  function checkMissionObjective(enemyId) {
    state.world.missions.forEach(mission => {
      if (mission.status === 'active') {
        mission.objectives.forEach(objective => {
          if (objective.type === 'defeat_enemy' && objective.targetId === enemyId) {
            actions.updateObjective(mission.id, objective.id, true);
          } else if (objective.type === 'defeat_enemies' && 
                    objective.targetFaction === enemy.faction) {
            // Increment counter for this type of enemy
            actions.incrementObjectiveCounter(mission.id, objective.id);
          }
        });
      }
    });
  }
  
  // Fire weapon if conditions are met
  function fireWeapon() {
    const now = Date.now();
    const cooldown = enemy.weaponCooldown || 1000; // milliseconds
    
    if (now - lastFired < cooldown) return;
    
    const position = [];
    const rotation = [];
    api.position.get(position);
    api.rotation.get(rotation);
    
    // Calculate projectile direction
    const forwardVector = new THREE.Vector3(0, 0, 1);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(...rotation)
    );
    forwardVector.applyMatrix4(rotationMatrix).normalize();
    
    // Create projectile data
    const projectile = {
      id: `enemy_proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: [
        position[0] + forwardVector.x * 2,
        position[1] + forwardVector.y * 2,
        position[2] + forwardVector.z * 2
      ],
      rotation: rotation,
      velocity: [
        forwardVector.x * (enemy.projectileSpeed || 3),
        forwardVector.y * (enemy.projectileSpeed || 3),
        forwardVector.z * (enemy.projectileSpeed || 3)
      ],
      owner: 'enemy',
      ownerId: enemy.id,
      damage: enemy.weaponDamage || 10,
      lifetime: (enemy.weaponRange || 150) / (enemy.projectileSpeed || 3),
      weaponType: enemy.weaponType || 'Machinegun'
    };
    
    // Add projectile to world
    actions.addProjectile(projectile);
    setLastFired(now);
    
    // Add muzzle flash effect
    const muzzlePos = [
      position[0] + forwardVector.x * 2.5,
      position[1] + forwardVector.y * 2.5,
      position[2] + forwardVector.z * 2.5
    ];
    actions.addExplosion(muzzlePos, 0.3);
  }
  
  // Calculate obstacle avoidance force
  function calculateAvoidanceForce(position) {
    const avoidForce = new THREE.Vector3();
    const pos = new THREE.Vector3(...position);
    
    // Check distance to all islands
    state.world.islands.forEach(island => {
      const islandPos = new THREE.Vector3(...island.position);
      const distance = pos.distanceTo(islandPos);
      const avoidanceRadius = island.size * 4; // Keep this distance from island
      
      if (distance < avoidanceRadius) {
        // Calculate avoidance vector (away from island)
        const avoidDir = new THREE.Vector3().subVectors(pos, islandPos).normalize();
        
        // Strength increases as we get closer
        const strength = 1 - (distance / avoidanceRadius);
        avoidForce.add(avoidDir.multiplyScalar(strength * 2));
      }
    });
    
    // Avoid other enemies
    state.world.enemies.forEach(otherEnemy => {
      if (otherEnemy.id === enemy.id) return; // Skip self
      
      const otherPos = new THREE.Vector3(...otherEnemy.position);
      const distance = pos.distanceTo(otherPos);
      const avoidanceRadius = 10; // Keep this distance from other enemies
      
      if (distance < avoidanceRadius) {
        const avoidDir = new THREE.Vector3().subVectors(pos, otherPos).normalize();
        const strength = 1 - (distance / avoidanceRadius);
        avoidForce.add(avoidDir.multiplyScalar(strength));
      }
    });
    
    // Avoid ground 
    if (position[1] < 20) {
      avoidForce.y += (20 - position[1]) * 0.1;
    }
    
    // Avoid ceiling
    if (position[1] > 200) {
      avoidForce.y -= (position[1] - 200) * 0.1;
    }
    
    return avoidForce;
  }
  
  // Find nearest safe retreat point
  function findSafeRetreatPoint(currentPos, faction) {
    // Find islands controlled by our faction
    const friendlyIslands = state.world.islands.filter(
      island => island.controlledBy === faction
    );
    
    if (friendlyIslands.length > 0) {
      // Find closest friendly island
      let closestIsland = friendlyIslands[0];
      let minDistance = Infinity;
      
      friendlyIslands.forEach(island => {
        const distance = currentPos.distanceTo(new THREE.Vector3(...island.position));
        if (distance < minDistance) {
          minDistance = distance;
          closestIsland = island;
        }
      });
      
      return new THREE.Vector3(...closestIsland.position).add(new THREE.Vector3(0, closestIsland.size * 2, 0));
    }
    
    // No friendly islands - retreat to map edge away from player
    const playerDir = new THREE.Vector3().subVectors(
      new THREE.Vector3(...playerPosition),
      currentPos
    ).normalize();
    
    // Retreat in opposite direction
    return currentPos.clone().sub(playerDir.multiplyScalar(300));
  }
  
  // Helper function to find formation leader
  function findFormationLeader() {
    if (!enemy.formationLeaderId) return null;
    
    return state.world.enemies.find(e => e.id === enemy.formationLeaderId);
  }
  
  // Advanced AI behavior system
  useFrame((state, delta) => {
    // Skip if game is paused
    if (state.ui?.paused) return;
    
    // Get current position, rotation, and velocity
    const position = [];
    const rotation = [];
    const velocity = [];
    api.position.get(position);
    api.rotation.get(rotation);
    api.velocity.get(velocity);
    
    // Convert to THREE.Vector3 objects
    const pos = new THREE.Vector3(...position);
    const rot = new THREE.Euler(...rotation);
    const vel = new THREE.Vector3(...velocity);
    
    // Get player position
    const playerPos = new THREE.Vector3(...playerPosition);
    const distanceToPlayer = pos.distanceTo(playerPos);
    
    // Update debug text if enabled
    if (debugTextRef.current) {
      debugTextRef.current.text = `${enemy.id} - ${behaviorState}\nHealth: ${Math.floor(health)}`;
    }
    
    // Calculate target position based on current behavior state
    let targetPos = new THREE.Vector3();
    
    switch (behaviorState) {
      case ENEMY_STATES.PATROLLING:
        // Follow patrol path
        targetPos.copy(patrolPath[currentPatrolIndex]);
        
        // Check if we've reached current patrol point
        if (pos.distanceTo(targetPos) < 10) {
          // Move to next patrol point
          setCurrentPatrolIndex((currentPatrolIndex + 1) % patrolPath.length);
        }
        
        // Check if player is in detection range
        if (distanceToPlayer < (enemy.detectionRange || 100)) {
          // Increase alert level gradually
          setAlertLevel(Math.min(alertLevel + 0.01, 1));
          
          // Switch to pursuing if alert level is high enough
          if (alertLevel > 0.8) {
            setBehaviorState(ENEMY_STATES.PURSUING);
          }
        } else {
          // Decrease alert level gradually
          setAlertLevel(Math.max(alertLevel - 0.005, 0));
        }
        break;
        
      case ENEMY_STATES.PURSUING:
        // Move towards player
        targetPos.copy(playerPos);
        
        // Switch to attacking if close enough
        if (distanceToPlayer < (enemy.attackRange || 50)) {
          setBehaviorState(ENEMY_STATES.ATTACKING);
        }
        
        // If player gets too far, go back to patrolling
        if (distanceToPlayer > (enemy.giveUpRange || 200)) {
          setBehaviorState(ENEMY_STATES.PATROLLING);
          setAlertLevel(0.5); // Remain somewhat alert
        }
        break;
        
      case ENEMY_STATES.ATTACKING:
        // Calculate an attack position - offset from player
        const attackOffset = new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 10 + 5,
          (Math.random() - 0.5) * 30
        );
        
        // Only change direction occasionally to avoid erratic movement
        const now = state.clock.getElapsedTime();
        if (now - lastDirectionChange.current > 2) {
          attackOffset.set(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 10 + 5,
            (Math.random() - 0.5) * 30
          );
          lastDirectionChange.current = now;
        }
        
        targetPos.copy(playerPos).add(attackOffset);
        
        // Fire weapons if facing player and in range
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(rot);
        const dirToPlayer = new THREE.Vector3().subVectors(playerPos, pos).normalize();
        const facingPlayer = forward.dot(dirToPlayer) > 0.7; // Roughly facing player
        
        if (facingPlayer && distanceToPlayer < (enemy.weaponRange || 60)) {
          fireWeapon();
        }
        
        // If player gets too far, switch to pursuing
        if (distanceToPlayer > (enemy.attackRange || 50) * 1.5) {
          setBehaviorState(ENEMY_STATES.PURSUING);
        }
        break;
        
      case ENEMY_STATES.RETREATING:
        // Retreat away from player
        const retreatDir = new THREE.Vector3().subVectors(pos, playerPos).normalize();
        targetPos.copy(pos).add(retreatDir.multiplyScalar(100));
        
        // Find nearest safe point (island of our faction, or edge of map)
        const safePoint = findSafeRetreatPoint(pos, enemy.faction);
        if (safePoint) {
          targetPos.copy(safePoint);
        }
        
        // If health improves or we're far enough, reconsider
        if (health > 40 && distanceToPlayer > 150) {
          setBehaviorState(ENEMY_STATES.PATROLLING);
        }
        break;
        
      case ENEMY_STATES.FORMATION:
        // Formation flying - follow leader with offset
        const leader = findFormationLeader();
        if (leader) {
          const leaderPos = new THREE.Vector3(...leader.position);
          const leaderRot = new THREE.Euler(...leader.rotation);
          
          // Maintain formation position relative to leader
          const formMatrix = new THREE.Matrix4().makeRotationFromEuler(leaderRot);
          const formationPos = formationOffset.current.clone().applyMatrix4(formMatrix);
          targetPos.copy(leaderPos).add(formationPos);
        } else {
          // No leader - revert to patrolling
          setBehaviorState(ENEMY_STATES.PATROLLING);
        }
        break;
        
      case ENEMY_STATES.IDLE:
      default:
        // Idle behavior - hover in place with slight movement
        targetPos.set(
          enemy.position[0] + Math.sin(state.clock.getElapsedTime() * 0.5) * 5,
          enemy.position[1] + Math.sin(state.clock.getElapsedTime() * 0.2) * 2,
          enemy.position[2] + Math.cos(state.clock.getElapsedTime() * 0.5) * 5
        );
        
        // If player comes close, become alert
        if (distanceToPlayer < (enemy.detectionRange || 100)) {
          setBehaviorState(ENEMY_STATES.PATROLLING);
        }
        break;
    }
    
    // Apply obstacle avoidance
    const avoidForce = calculateAvoidanceForce(position);
    avoidanceForce.current.copy(avoidForce);
    targetPos.add(avoidForce);
    
    // Calculate direction to target
    const direction = new THREE.Vector3().subVectors(targetPos, pos).normalize();
    
    // Calculate target rotation (simplified)
    const targetRotation = [
      Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
      Math.atan2(direction.x, direction.z),
      // Bank into turns
      velocity.length() > 0.1 ? -direction.x * 0.5 : 0
    ];
    
    // Smooth interpolation towards target rotation
    const rotationSpeed = enemy.rotationSpeed || 0.05;
    const newRotation = rotation.map((rot, i) => {
      return rot + (targetRotation[i] - rot) * rotationSpeed;
    });
    
    // Apply new rotation
    api.rotation.set(...newRotation);
    
    // Calculate acceleration force
    const maxSpeed = enemy.maxSpeed || 0.3;
    let acceleration = enemy.acceleration || 0.01;
    
    // Adjust speed based on behavior
    switch (behaviorState) {
      case ENEMY_STATES.PURSUING:
        acceleration *= 1.2;
        break;
      case ENEMY_STATES.RETREATING:
        acceleration *= 1.5; // Faster when retreating
        break;
      case ENEMY_STATES.ATTACKING:
        acceleration *= 0.8; // Slower, more controlled when attacking
        break;
    }
    
    // Move forward in facing direction
    const forwardVector = new THREE.Vector3(0, 0, 1);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...newRotation));
    forwardVector.applyMatrix4(rotationMatrix).normalize();
    
    // Calculate new velocity based on current and target direction
    const currentSpeed = vel.length();
    const targetSpeed = Math.min(maxSpeed, distanceToPlayer > 10 ? maxSpeed : currentSpeed * 0.95);
    const newSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, acceleration);
    
    // Apply the new velocity
    const newVel = forwardVector.multiplyScalar(newSpeed);
    
    // Add some "drag" to simulate air resistance
    const drag = enemy.drag || 0.98;
    newVel.x = newVel.x * drag + vel.x * (1 - drag);
    newVel.y = newVel.y * drag + vel.y * (1 - drag);
    newVel.z = newVel.z * drag + vel.z * (1 - drag);
    
    // Apply velocity
    api.velocity.set(newVel.x, newVel.y, newVel.z);
    
    // Update enemy position in world state
    actions.updateEnemyPosition(enemy.id, position, newRotation, [newVel.x, newVel.y, newVel.z]);
  });
  
  // Setup formation offset when in formation
  useEffect(() => {
    if (enemy.formationPosition) {
      // Set formation offset based on position in formation
      switch (enemy.formationPosition) {
        case 'right':
          formationOffset.current.set(20, 0, -5);
          break;
        case 'left':
          formationOffset.current.set(-20, 0, -5);
          break;
        case 'rightRear':
          formationOffset.current.set(15, 5, -20);
          break;
        case 'leftRear':
          formationOffset.current.set(-15, 5, -20);
          break;
        default:
          formationOffset.current.set(0, 0, -10);
      }
      
      // Start in formation state if we have a leader
      if (enemy.formationLeaderId) {
        setBehaviorState(ENEMY_STATES.FORMATION);
      }
    }
  }, [enemy.formationPosition, enemy.formationLeaderId]);
  
  // Visual effects based on health and state
  const smokeTrailIntensity = useMemo(() => {
    if (health < 30) return 1.0;
    if (health < 60) return 0.5;
    return 0;
  }, [health]);
  
  // Alert visualization (red for aggressive, yellow for alert, etc.)
  const alertColor = useMemo(() => {
    if (behaviorState === ENEMY_STATES.ATTACKING) return '#ff0000';
    if (behaviorState === ENEMY_STATES.PURSUING) return '#ff6600';
    if (alertLevel > 0.5) return '#ffcc00';
    return '#00ff00';
  }, [behaviorState, alertLevel]);
  
  return (
    <group ref={ref} name={`enemy-${enemy.id}`}>
      {/* Main aircraft model */}
      <AircraftModel 
        model={enemy.model || 'standard'} 
        color={enemy.color || faction2Color(enemy.faction)} 
        isStalling={false}
        warningActive={health < 30}
      />
      
      {/* Engine trails */}
      <Trail
        width={0.5}
        length={15}
        color={faction2Color(enemy.faction, 'trail')}
        attenuation={(t) => (1 - t)}
      >
        <mesh position={[0, 0, -1.7]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={faction2Color(enemy.faction, 'trail')} />
        </mesh>
      </Trail>
      
      {/* Damage smoke if health is low */}
      {smokeTrailIntensity > 0 && (
        <Trail
          width={2}
          length={20}
          color={'#888888'}
          attenuation={(t) => ((1 - t) * smokeTrailIntensity)}
        >
          <mesh position={[0, 0.5, -1]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color={'#555555'} transparent opacity={0.7} />
          </mesh>
        </Trail>
      )}
      
      {/* Status indicator light */}
      <mesh position={[0, 1, 0]} scale={0.3}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={alertColor} transparent opacity={0.7} />
      </mesh>
      
      {/* Debug text - only visible in debug mode */}
      {state.ui?.debug && (
        <Text
          ref={debugTextRef}
          position={[0, 2, 0]}
          fontSize={1}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="black"
        >
          {`${enemy.id} - ${behaviorState}\nHealth: ${Math.floor(health)}`}
        </Text>
      )}
      
      {/* Add status icon based on behavior */}
      {showStatusIcon(behaviorState) && (
        <sprite position={[0, 2, 0]} scale={1}>
          <spriteMaterial 
            map={getStatusIconTexture(behaviorState)} 
            transparent={true}
            opacity={0.9}
            depthTest={false}
          />
        </sprite>
      )}
    </group>
  );
};

// Helper function to get color based on faction
function faction2Color(faction, type = 'primary') {
  switch (faction) {
    case ENEMY_FACTIONS.PIRATES:
      return type === 'trail' ? '#ff5500' : '#8B0000';
    case ENEMY_FACTIONS.MILITARY:
      return type === 'trail' ? '#00ff00' : '#006400';
    case ENEMY_FACTIONS.MERCENARY:
      return type === 'trail' ? '#0077ff' : '#00008B';
    case ENEMY_FACTIONS.WILDLIFE:
      return type === 'trail' ? '#ffff00' : '#8B8000';
    default:
      return type === 'trail' ? '#ff0000' : '#ff0000';
  }
}

// Helper to determine if status icon should be shown
function showStatusIcon(state) {
  return state === ENEMY_STATES.ATTACKING || 
         state === ENEMY_STATES.RETREATING || 
         state === ENEMY_STATES.PURSUING;
}

// Complete implementation of getStatusIconTexture that creates procedural textures
function getStatusIconTexture(state) {
  // Create a canvas for drawing the icon
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  
  // Clear canvas with transparent background
  context.clearRect(0, 0, 64, 64);
  
  // Draw different icons based on state
  switch (state) {
    case ENEMY_STATES.ATTACKING:
      // Red attack icon (crosshair)
      drawAttackIcon(context);
      break;
    case ENEMY_STATES.RETREATING:
      // White flag/retreat icon
      drawRetreatIcon(context);
      break;
    case ENEMY_STATES.PURSUING:
      // Yellow exclamation mark
      drawPursuitIcon(context);
      break;
    case ENEMY_STATES.PATROLLING:
      // Blue radar/sweep icon
      drawPatrolIcon(context);
      break;
    case ENEMY_STATES.FORMATION:
      // Green formation icon
      drawFormationIcon(context);
      break;
    case ENEMY_STATES.IDLE:
      // Gray dot/sleep icon
      drawIdleIcon(context);
      break;
    default:
      // Question mark for unknown state
      drawDefaultIcon(context);
  }
  
  // Create and return a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return texture;
}

// Helper functions to draw each icon type
function drawAttackIcon(ctx) {
  // Red crosshair/target
  ctx.fillStyle = 'rgba(200, 0, 0, 0.7)';
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 3;
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner circle
  ctx.beginPath();
  ctx.arc(32, 32, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Cross lines
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.lineTo(32, 60);
  ctx.moveTo(4, 32);
  ctx.lineTo(60, 32);
  ctx.stroke();
}

function drawRetreatIcon(ctx) {
  // White flag for retreat
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = '#AAAAAA';
  ctx.lineWidth = 2;
  
  // Flag pole
  ctx.beginPath();
  ctx.moveTo(20, 10);
  ctx.lineTo(20, 54);
  ctx.stroke();
  
  // Flag
  ctx.beginPath();
  ctx.moveTo(20, 10);
  ctx.lineTo(44, 16);
  ctx.lineTo(44, 30);
  ctx.lineTo(20, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawPursuitIcon(ctx) {
  // Yellow exclamation mark
  ctx.fillStyle = '#FFDD00';
  ctx.strokeStyle = '#FF8800';
  ctx.lineWidth = 2;
  
  // Exclamation mark body
  ctx.beginPath();
  ctx.moveTo(26, 10);
  ctx.lineTo(38, 10);
  ctx.lineTo(34, 40);
  ctx.lineTo(30, 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Exclamation mark dot
  ctx.beginPath();
  ctx.arc(32, 50, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawPatrolIcon(ctx) {
  // Blue radar sweep
  ctx.fillStyle = 'rgba(0, 100, 200, 0.2)';
  ctx.strokeStyle = '#0088FF';
  ctx.lineWidth = 2;
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot
  ctx.beginPath();
  ctx.arc(32, 32, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Radar sweep
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.arc(32, 32, 28, -Math.PI/4, Math.PI/4);
  ctx.closePath();
  ctx.fill();
  
  // Sweep line
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.lineTo(60, 32);
  ctx.stroke();
}

function drawFormationIcon(ctx) {
  // Green formation dots
  ctx.fillStyle = '#22CC22';
  ctx.strokeStyle = '#008800';
  ctx.lineWidth = 2;
  
  // Leader dot
  ctx.beginPath();
  ctx.arc(32, 20, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Wing dots
  ctx.beginPath();
  ctx.arc(16, 38, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(48, 38, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Connection lines
  ctx.beginPath();
  ctx.moveTo(32, 20);
  ctx.lineTo(16, 38);
  ctx.moveTo(32, 20);
  ctx.lineTo(48, 38);
  ctx.stroke();
}

function drawIdleIcon(ctx) {
  // Gray sleeping "Z"s
  ctx.fillStyle = '#AAAAAA';
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  
  // Circular background
  ctx.beginPath();
  ctx.arc(32, 32, 24, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
  ctx.fill();
  
  // Draw Z's
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Multiple Z's of different sizes
  ctx.fillText('Z', 26, 24);
  ctx.fillText('Z', 32, 32);
  ctx.fillText('Z', 38, 40);
}

function drawDefaultIcon(ctx) {
  // Question mark
  ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 3;
  
  // Circular background
  ctx.beginPath();
  ctx.arc(32, 32, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Question mark
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 32, 32);
}

export default EnemyManager;