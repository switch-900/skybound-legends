// src/utils/physics.js
import * as THREE from 'three';

// Physics settings and constants
export const PHYSICS_SETTINGS = {
  GRAVITY: -9.81,
  WORLD_SIZE: 1000,
  MIN_HEIGHT: 20,
  RESPAWN_HEIGHT: 30
};

/**
 * Physics material properties for different surfaces
 */
export const PHYSICS_MATERIALS = {
  AIRCRAFT: { friction: 0.2, restitution: 0.3 },  // Aircraft body
  ISLAND: { friction: 0.8, restitution: 0.2 },    // Land masses
  METAL: { friction: 0.3, restitution: 0.6 },     // Metal structures
  ICE: { friction: 0.05, restitution: 0.8 },      // Slippery surfaces
  RUBBER: { friction: 0.9, restitution: 0.3 },    // High friction
  BOUNCY: { friction: 0.2, restitution: 0.9 }     // Very bouncy
};

/**
 * Collision filter groups for physics interaction
 */
export const COLLISION_GROUPS = {
  DEFAULT: 1,       // Default group
  PLAYER: 2,        // Player aircraft
  ENEMY: 4,         // Enemy aircraft
  PROJECTILE: 8,    // Bullets, missiles, etc.
  ISLAND: 16,       // Islands and static terrain
  CHECKPOINT: 32,   // Mission checkpoints
  PICKUP: 64,       // Collectible items
  BOUNDARY: 128     // World boundaries
};

/**
 * Aircraft physics properties for different types
 */
export const AIRCRAFT_PHYSICS = {
  standard: {
    mass: 1000,
    maxSpeed: 0.5,
    acceleration: 0.01,
    turnRate: 0.03,
    drag: 0.99,
    liftFactor: 0.03,
    size: [3, 1, 5] // hitbox size [width, height, length]
  },
  fighter: {
    mass: 800,
    maxSpeed: 0.7,
    acceleration: 0.015,
    turnRate: 0.04,
    drag: 0.98,
    liftFactor: 0.025,
    size: [2.5, 0.8, 4.5]
  },
  bomber: {
    mass: 1500,
    maxSpeed: 0.4,
    acceleration: 0.008,
    turnRate: 0.02,
    drag: 0.995,
    liftFactor: 0.04,
    size: [4, 1.5, 6]
  },
  scout: {
    mass: 600,
    maxSpeed: 0.6,
    acceleration: 0.012,
    turnRate: 0.05,
    drag: 0.97,
    liftFactor: 0.02,
    size: [2.5, 0.8, 4]
  },
  kraken: {
    mass: 2500,
    maxSpeed: 0.35,
    acceleration: 0.005,
    turnRate: 0.015,
    drag: 0.995, 
    liftFactor: 0.05,
    size: [6, 2, 8]
  }
};

/**
 * Calculates aerodynamic forces for aircraft physics
 */
export function calculateAerodynamicForces(position, rotation, velocity, config = {}) {
  // Default physics configuration
  const physicsConfig = {
    drag: 0.98,              // Air resistance
    lift: 0.03,              // Lift factor
    weight: 9.81,            // Gravity
    stallSpeed: 0.1,         // Minimum speed before stall
    stallAngle: Math.PI / 4, // Maximum pitch angle before stall
    ...config
  };
  
  // Convert arrays to THREE.Vector3 objects
  const pos = Array.isArray(position) ? new THREE.Vector3(...position) : position;
  const rot = Array.isArray(rotation) ? new THREE.Euler(...rotation) : rotation;
  const vel = Array.isArray(velocity) ? new THREE.Vector3(...velocity) : velocity;
  
  // Get direction vectors
  const forwardVector = new THREE.Vector3(0, 0, 1);
  const upVector = new THREE.Vector3(0, 1, 0);
  const rightVector = new THREE.Vector3(1, 0, 0);
  
  // Apply aircraft rotation
  const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rot);
  forwardVector.applyMatrix4(rotationMatrix);
  upVector.applyMatrix4(rotationMatrix);
  rightVector.applyMatrix4(rotationMatrix);
  
  // Calculate current speed
  const speed = vel.length();
  
  // Stall detection - calculate angle between forward vector and horizontal plane
  const horizontalForward = new THREE.Vector3(forwardVector.x, 0, forwardVector.z).normalize();
  const pitchAngle = Math.acos(horizontalForward.dot(forwardVector));
  
  // Check for stall conditions
  const isStalling = speed < physicsConfig.stallSpeed && pitchAngle > physicsConfig.stallAngle;
  
  // Calculate forces
  const forces = {
    // Drag force
    drag: vel.clone().multiplyScalar(-(1 - physicsConfig.drag)),
    
    // Lift force - more complex calculation based on airspeed and angle of attack
    lift: new THREE.Vector3(0, 0, 0),
    
    // Weight (gravity)
    weight: new THREE.Vector3(0, -physicsConfig.weight, 0),
    
    // Total force (to be calculated)
    total: new THREE.Vector3(0, 0, 0),
    
    // Stall information
    isStalling: isStalling,
    pitchAngle: pitchAngle,
    speed: speed
  };
  
  // Calculate lift based on speed, orientation, and angle of attack
  if (!isStalling) {
    // Angle of attack effect - maximum lift at optimal angle
    const optimalAngle = Math.PI / 12; // 15 degrees
    const angleOfAttack = Math.min(pitchAngle, Math.PI / 2);
    const angleFactor = 1 - Math.abs(angleOfAttack - optimalAngle) / (Math.PI / 2);
    
    // Speed effect - lift increases with speed squared (simplified)
    const speedFactor = Math.min(speed * speed * 3, 1);
    
    // Combined lift
    const liftForce = speedFactor * angleFactor * physicsConfig.lift;
    forces.lift = upVector.clone().multiplyScalar(liftForce);
  } else {
    // During stall, add random turbulence and reduced lift
    forces.lift = upVector.clone().multiplyScalar(0.01);
    forces.lift.add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.05,
      (Math.random() - 0.5) * 0.025, // Less vertical turbulence
      (Math.random() - 0.5) * 0.05
    ));
    
    // Add slight nose-down torque during stall for more realistic behavior
    // This would be applied separately in the aircraft controller
  }
  
  // Calculate total force
  forces.total.add(forces.drag);
  forces.total.add(forces.lift);
  forces.total.add(forces.weight);
  
  return forces;
}

/**
 * Calculates collision damage based on impact velocity and object types
 */
export function calculateCollisionDamage(impactVelocity, targetType, sourceType, armorLevel = 1) {
  // Base damage multipliers for different object types
  const damageMultipliers = {
    island: 5,   // Islands do significant damage
    enemy: 2,    // Enemy collisions do moderate damage
    player: 2,   // Player collision does moderate damage
    projectile: 1, // Projectiles do their own damage value
    default: 1   // Default multiplier
  };
  
  // Get appropriate multiplier
  const multiplier = damageMultipliers[sourceType] || damageMultipliers.default;
  
  // Calculate base damage from impact velocity
  const baseDamage = Math.max(0, Math.abs(impactVelocity) * multiplier);
  
  // Apply armor reduction (each level reduces damage by 15%)
  const armorFactor = 1 - ((armorLevel - 1) * 0.15);
  
  // Calculate final damage
  const finalDamage = Math.floor(baseDamage * armorFactor);
  
  return Math.max(1, finalDamage); // Minimum 1 damage from collisions
}

/**
 * Helper to create physics body properties for aircraft
 */
export function createAircraftPhysics(type, position, rotation, isPlayer = false) {
  // Get config for this type, fallback to standard
  const config = AIRCRAFT_PHYSICS[type] || AIRCRAFT_PHYSICS.standard;
  
  // Set collision filters
  const collisionGroup = isPlayer ? COLLISION_GROUPS.PLAYER : COLLISION_GROUPS.ENEMY;
  const collisionMask = COLLISION_GROUPS.DEFAULT | 
                        COLLISION_GROUPS.ISLAND | 
                        COLLISION_GROUPS.BOUNDARY |
                        COLLISION_GROUPS.PICKUP |
                        (isPlayer ? COLLISION_GROUPS.ENEMY : COLLISION_GROUPS.PLAYER);
  
  // Return physics body properties
  return {
    mass: config.mass,
    position: position,
    rotation: rotation,
    type: 'Dynamic',
    linearDamping: 0.1,
    angularDamping: 0.6,
    material: PHYSICS_MATERIALS.AIRCRAFT,
    collisionFilterGroup: collisionGroup,
    collisionFilterMask: collisionMask,
    fixedRotation: false,
    allowSleep: false,
    userData: { 
      type: 'aircraft', 
      id: isPlayer ? 'player' : `enemy-${Date.now()}`,
      aircraftType: type,
      collisionResponse: true
    },
    args: config.size // width, height, length
  };
}

/**
 * Helper to create physics body properties for projectiles
 */
export function createProjectilePhysics(projectile) {
  // Different sizes based on projectile type
  const sizeMap = {
    'Machinegun': [0.1, 0.1, 0.3],
    'Rocket': [0.2, 0.2, 0.6],
    'Missile': [0.3, 0.3, 0.9],
    'Lightning': [0.1, 0.1, 2.0],
    'default': [0.1, 0.1, 0.3]
  };
  
  // Different masses based on projectile type
  const massMap = {
    'Machinegun': 1,
    'Rocket': 5,
    'Missile': 10,
    'Lightning': 0.5,
    'default': 1
  };
  
  const size = sizeMap[projectile.weaponType] || sizeMap.default;
  const mass = massMap[projectile.weaponType] || massMap.default;
  
  // Set collision filters based on owner
  const collisionGroup = COLLISION_GROUPS.PROJECTILE;
  let collisionMask = COLLISION_GROUPS.ISLAND | COLLISION_GROUPS.BOUNDARY;
  
  // Add appropriate target to collision mask
  if (projectile.owner === 'player') {
    collisionMask |= COLLISION_GROUPS.ENEMY;
  } else {
    collisionMask |= COLLISION_GROUPS.PLAYER;
  }
  
  return {
    mass: mass,
    position: projectile.position,
    rotation: projectile.rotation,
    velocity: projectile.velocity,
    type: 'Dynamic',
    linearDamping: 0.05,
    angularDamping: 0.2,
    material: PHYSICS_MATERIALS.METAL,
    collisionFilterGroup: collisionGroup,
    collisionFilterMask: collisionMask,
    allowSleep: false,
    userData: { 
      type: 'projectile', 
      id: projectile.id,
      owner: projectile.owner,
      weaponType: projectile.weaponType,
      damage: projectile.damage
    },
    args: size // width, height, length
  };
}

/**
 * Helper to create physics body properties for islands
 */
export function createIslandPhysics(island) {
  // Different shapes based on island type
  const shapeType = island.type === 'volcanic' ? 'cone' : 'cylinder';
  
  // Size based on island size with some padding for better collision
  const radius = island.size * 1.2;
  const height = island.size * 2;
  
  // For cone shape, we use different args
  const args = shapeType === 'cone' 
    ? [radius, height, 16] // radius, height, segments
    : [radius, radius * 1.3, height, 16]; // topRadius, bottomRadius, height, segments
  
  return {
    type: 'Static',
    position: island.position,
    material: PHYSICS_MATERIALS.ISLAND,
    collisionFilterGroup: COLLISION_GROUPS.ISLAND,
    collisionFilterMask: COLLISION_GROUPS.DEFAULT | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.PROJECTILE,
    userData: { 
      type: 'island', 
      id: island.id,
      islandType: island.type,
      zone: island.zone
    },
    args: args
  };
}

/**
 * Helper to create world boundary physics
 */
export function createWorldBoundaryPhysics() {
  return {
    // Use a large sphere as the world boundary
    type: 'Static',
    position: [0, 0, 0],
    isTrigger: true,
    collisionFilterGroup: COLLISION_GROUPS.BOUNDARY,
    collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.PROJECTILE,
    userData: { 
      type: 'boundary', 
      id: 'worldBoundary'
    },
    args: [PHYSICS_SETTINGS.WORLD_SIZE] // sphere radius
  };
}
