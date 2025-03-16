// src/components/aircraft/PlayerAircraft.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { useGLTF, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';

import { useGame } from '../../contexts/GameContext';
import AircraftModel from './AircraftModel';
import CameraFollow from './CameraFollow';
import EngineTrails from './EngineTrails';
import WeaponSystem from './WeaponSystem';
import Cockpit from './Cockpit';
import { 
  AIRCRAFT_PHYSICS, 
  calculateAerodynamicForces, 
  calculateCollisionDamage,
  createAircraftPhysics,
  COLLISION_GROUPS,
  PHYSICS_SETTINGS
} from '../../utils/physics';

const PlayerAircraft = () => {
  const { state, actions } = useGame();
  const { player, aircraft, input, world } = state;
  const { scene } = useThree();
  
  // Get physics properties based on aircraft model with upgrades applied
  const physicsProps = useMemo(() => {
    // Get base aircraft properties
    const baseProps = AIRCRAFT_PHYSICS[aircraft.model] || AIRCRAFT_PHYSICS.standard;
    
    // Apply engine upgrades
    return {
      ...baseProps,
      // Increase max speed with engine level (up to +40%)
      maxSpeed: baseProps.maxSpeed * (1 + (aircraft.engineLevel - 1) * 0.1),
      // Increase acceleration with engine level (up to +50%)
      acceleration: baseProps.acceleration * (1 + (aircraft.engineLevel - 1) * 0.125),
      // Slightly increase turn rate with engine level (up to +20%)
      turnRate: baseProps.turnRate * (1 + (aircraft.engineLevel - 1) * 0.05),
      // Improve lift slightly with engine level (up to +15%)
      liftFactor: baseProps.liftFactor * (1 + (aircraft.engineLevel - 1) * 0.0375)
    };
  }, [aircraft.model, aircraft.engineLevel]);
  
  // Create physics body for the aircraft
  const [physicsRef, api] = useBox(() => ({
    // Get base physics properties for this aircraft type
    ...createAircraftPhysics(
      aircraft.model,
      player.position,
      player.rotation,
      true
    ),
    // Add collision callback
    onCollide: handleCollision,
    // Override mass to account for upgrades
    mass: physicsProps.mass * (1 + (aircraft.armorLevel - 1) * 0.1)
  }), [aircraft.model, aircraft.armorLevel]);

  // Aircraft visual and flight status
  const [isStalling, setIsStalling] = useState(false);
  const [warningActive, setWarningActive] = useState(false);
  const [gForce, setGForce] = useState(1);
  const [altitudeWarning, setAltitudeWarning] = useState(false);
  
  // References for flight dynamics
  const lastWarning = useRef(0);
  const previousVelocity = useRef(new THREE.Vector3());
  const stallRecoveryAssist = useRef(false);
  const controlInputs = useRef({ pitch: 0, yaw: 0, roll: 0, throttle: 0 });
  
  // Smooth visuals with springs
  const [smoothRotation, setSmoothedRotation] = useSpring(() => ({
    rotation: [0, 0, 0],
    config: { mass: 1, tension: 210, friction: 20 }
  }));

  // Handle collisions with objects
  function handleCollision(event) {
    const { body, contact } = event;
    const impactVelocity = contact.impactVelocity;
    
    // Skip negligible impacts
    if (Math.abs(impactVelocity) < 1) return;
    
    // Get object type from userData
    const objectType = body.userData?.type || 'unknown';
    
    // Calculate damage using physics utility
    const damage = calculateCollisionDamage(
      impactVelocity, 
      'player',
      objectType, 
      aircraft.armorLevel
    );
    
    // Create explosion effect if impact is significant
    if (damage > 5) {
      actions.addExplosion(contact.contactPoint, damage / 20);
      
      // Add sound effect for significant impacts
      actions.playSound('impact', { 
        volume: Math.min(1.0, damage / 30),
        playbackRate: 0.8 + Math.random() * 0.4
      });
    }
    
    // Apply damage to player
    if (damage > 0) {
      actions.updatePlayerStats({ 
        health: Math.max(0, player.health - damage) 
      });
      
      // Show notification for significant damage
      if (damage > 10) {
        actions.addNotification(`Impact damage: -${damage} health!`);
      }
      
      // Check for aircraft destruction
      if (player.health - damage <= 0) {
        handleAircraftDestruction();
      }
    }
    
    // Special handling for pickups
    if (objectType === 'pickup') {
      handlePickup(body.userData);
    }
  }
  
  // Handle aircraft destruction
  function handleAircraftDestruction() {
    const position = [];
    api.position.get(position);
    
    // Create large explosion at aircraft position
    actions.addExplosion(position, 3);
    actions.addNotification("Aircraft destroyed!");
    
    // Play explosion sound
    actions.playSound('explosion');
    
    // Reset aircraft position to starting point with a delay
    setTimeout(() => {
      api.position.set(0, PHYSICS_SETTINGS.RESPAWN_HEIGHT, 0);
      api.velocity.set(0, 0, 0);
      api.rotation.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // Reset player state
      actions.updatePlayerStats({ 
        health: 100,
        fuel: 100,
      });
      
      // Show respawn notification
      actions.addNotification("Aircraft respawned");
      
      // Deduct credits as penalty if applicable
      if (player.credits > 100) {
        const penalty = Math.min(100, Math.floor(player.credits * 0.1));
        actions.addCredits(-penalty);
        actions.addNotification(`Repair cost: ${penalty} credits`);
      }
    }, 2000);
  }
  
  // Aircraft flight control logic
  useFrame((state, delta) => {
    // Skip if paused
    if (state.ui?.paused) return;
    
    // Get current position, rotation, and velocity from physics
    const position = [];
    const rotation = [];
    const velocity = [];
    const angularVel = [];
    
    api.position.get(position);
    api.rotation.get(rotation);
    api.velocity.get(velocity);
    api.angularVelocity.get(angularVel);
    
    // Convert arrays to THREE.Vector3/Euler objects for calculations
    const positionVec = new THREE.Vector3(...position);
    const rotationEuler = new THREE.Euler(...rotation);
    const velocityVec = new THREE.Vector3(...velocity);
    const angularVelVec = new THREE.Vector3(...angularVel);
    
    // Calculate g-force based on velocity changes
    const currentVelocity = velocityVec.clone();
    const prevVelocity = previousVelocity.current || currentVelocity.clone();
    const acceleration = currentVelocity.clone().sub(prevVelocity).length() / delta;
    const newGForce = 1 + (acceleration / 9.8); // 9.8 m/s² = 1G
    setGForce(THREE.MathUtils.clamp(newGForce, 0, 10));
    previousVelocity.current = currentVelocity.clone();
    
    // Check low altitude warning
    const isLowAltitude = position[1] < PHYSICS_SETTINGS.MIN_HEIGHT + 20;
    if (isLowAltitude !== altitudeWarning) {
      setAltitudeWarning(isLowAltitude);
      if (isLowAltitude) {
        actions.addNotification("WARNING: Low altitude!");
        actions.playSound('warning');
      }
    }
    
    // Fuel check - no fuel means gliding only with reduced control
    if (player.fuel <= 0) {
      // Apply gliding aerodynamics with reduced lift
      const glidingForces = calculateAerodynamicForces(
        positionVec,
        rotationEuler,
        velocityVec,
        {
          lift: physicsProps.liftFactor * 0.5, // Reduced lift when gliding
          drag: physicsProps.drag * 1.05, // Increased drag
          weight: physicsProps.mass * 0.01,
          stallSpeed: 0.05 // Easier to stall without engine power
        }
      );
      
      // Apply the calculated forces with reduced magnitude
      api.applyForce(
        [glidingForces.total.x, glidingForces.total.y, glidingForces.total.z],
        [0, 0, 0]
      );
      
      // Update stall status
      setIsStalling(glidingForces.isStalling);
      
      // Limited control torque when gliding
      const pitchControl = input.keyboard.w ? -0.3 : input.keyboard.s ? 0.3 : 0;
      const yawControl = input.keyboard.a ? -0.2 : input.keyboard.d ? 0.2 : 0;
      const rollControl = input.keyboard.q ? -0.3 : input.keyboard.e ? 0.3 : 0;
      
      api.applyTorque([
        pitchControl * 20, 
        yawControl * 10, 
        rollControl * 15
      ]);
      
      // Update player state
      actions.updatePlayerPosition(position, rotation, [velocityVec.x, velocityVec.y, velocityVec.z]);
      
      // Random fuel warning
      if (Math.random() < 0.01) {
        actions.addNotification("OUT OF FUEL!", 1000);
      }
      
      return;
    }
    
    // Process control inputs
    processControlInputs();
    
    // Apply aerodynamic forces
    const forces = calculateAerodynamicForces(
      positionVec,
      rotationEuler,
      velocityVec,
      {
        drag: physicsProps.drag,
        lift: physicsProps.liftFactor * (1 + (aircraft.engineLevel - 1) * 0.15),
        weight: physicsProps.mass * 0.0098, // Scale gravity by mass
        stallSpeed: 0.1 * (1 + (aircraft.engineLevel - 1) * 0.05), // Better engines stall less
        stallAngle: Math.PI / 4
      }
    );
    
    // Update stall state with feedback
    const newStallState = forces.isStalling;
    if (newStallState !== isStalling) {
      setIsStalling(newStallState);
      
      // Add stall warning notification when entering stall
      if (newStallState) {
        actions.addNotification("STALL WARNING!", 2000);
        stallRecoveryAssist.current = true;
        
        // Play stall warning sound
        actions.playSound('stallWarning');
        
        // Auto-disable stall recovery after 2 seconds
        setTimeout(() => {
          stallRecoveryAssist.current = false;
        }, 2000);
      }
    }
    
    // Apply aerodynamic forces
    api.applyForce(
      [forces.total.x, forces.total.y, forces.total.z],
      [0, 0, 0]
    );
    
    // Apply engine thrust based on throttle
    if (player.throttle > 0 && player.fuel > 0) {
      // Calculate thrust vector (forward direction)
      const forwardVector = new THREE.Vector3(0, 0, 1);
      forwardVector.applyEuler(rotationEuler);
      
      // Scale thrust by throttle and engine level
      const thrustMagnitude = player.throttle * physicsProps.acceleration * 
                             physicsProps.mass * (1 + (aircraft.engineLevel - 1) * 0.2);
      
      // Apply thrust force
      api.applyForce(
        [
          forwardVector.x * thrustMagnitude,
          forwardVector.y * thrustMagnitude,
          forwardVector.z * thrustMagnitude
        ],
        [0, 0, 0]
      );
      
      // Consume fuel based on throttle and engine efficiency
      const fuelConsumptionRate = 0.002 * player.throttle * (2 - (aircraft.engineLevel * 0.2));
      const newFuel = Math.max(0, player.fuel - fuelConsumptionRate);
      
      if (Math.floor(newFuel) !== Math.floor(player.fuel)) {
        actions.updatePlayerStats({ fuel: newFuel });
      }
    }
    
    // Apply control torques for rotation
    applyControlTorques(rotationEuler, velocityVec);
    
    // Update smoothed rotation for visual model
    setSmoothedRotation({ rotation });
    
    // Update player position in game state
    actions.updatePlayerPosition(position, rotation, velocity);
    
    // Stall warning effect (pulsing)
    if (isStalling) {
      const now = Date.now();
      if (now - lastWarning.current > 500) {  // Flash twice per second
        lastWarning.current = now;
        setWarningActive(prev => !prev);
      }
    } else if (warningActive) {
      setWarningActive(false);
    }
  });
  
  // Process control inputs from keyboard, gamepad, or touch
  function processControlInputs() {
    let pitch = 0, yaw = 0, roll = 0;
    let throttleChange = 0;
    
    if (input.touchControls.active) {
      // Use touch/gamepad controls
      pitch = input.touchControls.pitch * physicsProps.turnRate;
      yaw = input.touchControls.yaw * physicsProps.turnRate;
      roll = input.touchControls.roll * physicsProps.turnRate;
      
      // Set throttle directly
      actions.updatePlayerStats({ throttle: input.touchControls.throttle });
      
      // Weapon firing
      if (input.touchControls.firing) {
        aircraft.weapons.forEach(weapon => {
          actions.fireWeapon(weapon.id);
        });
      }
    } else {
      // Use keyboard controls
      if (input.keyboard.w) pitch -= physicsProps.turnRate;
      if (input.keyboard.s) pitch += physicsProps.turnRate;
      if (input.keyboard.a) yaw -= physicsProps.turnRate;
      if (input.keyboard.d) yaw += physicsProps.turnRate;
      if (input.keyboard.q) roll -= physicsProps.turnRate;
      if (input.keyboard.e) roll += physicsProps.turnRate;
      
      // Throttle
      if (input.keyboard.shift) throttleChange = 0.01;
      if (input.keyboard.control) throttleChange = -0.01;
      
      // Update throttle
      const newThrottle = Math.max(0, Math.min(1, player.throttle + throttleChange));
      if (newThrottle !== player.throttle) {
        actions.updatePlayerStats({ throttle: newThrottle });
      }
      
      // Weapon firing
      if (input.keyboard.space || input.keyboard.f) {
        aircraft.weapons.forEach(weapon => {
          actions.fireWeapon(weapon.id);
        });
      }
    }
    
    // Apply stall recovery assistance if needed
    if (stallRecoveryAssist.current) {
      // Auto-adjust to help recover from stall
      pitch = Math.max(0.02, pitch); // Force slight nose down
      roll = roll * 0.5; // Reduce roll input during recovery
    }
    
    // Store current control inputs for use in physics calculations
    controlInputs.current = { pitch, yaw, roll, throttleChange };
  }
  
  // Apply torques for aircraft rotation based on controls and flight characteristics
  function applyControlTorques(rotationEuler, velocityVec) {
    const { pitch, yaw, roll } = controlInputs.current;
    
    // Calculate airspeed for control effectiveness
    const airspeed = velocityVec.length();
    
    // Control effectiveness varies with airspeed (more effective at higher speeds)
    // But still has some effect at low speeds
    const baseEffectiveness = 0.3;
    const speedFactor = Math.min(airspeed * 2, 1);
    const controlEffectiveness = baseEffectiveness + speedFactor * (1 - baseEffectiveness);
    
    // Calculate control effectiveness reduction during stall
    const stallFactor = isStalling ? 0.3 : 1.0;
    
    // Scale torque by aircraft mass and control factors
    const torqueScaleFactor = physicsProps.mass * controlEffectiveness * stallFactor;
    
    // Different scaling for each axis based on aircraft characteristics
    const pitchFactor = 2 * (aircraft.model === 'fighter' ? 1.2 : 
                          aircraft.model === 'bomber' ? 0.8 : 1);
    const yawFactor = 1.5 * (aircraft.model === 'scout' ? 1.3 : 1);
    const rollFactor = 3 * (aircraft.model === 'fighter' ? 1.5 : 
                         aircraft.model === 'bomber' ? 0.7 : 1);
    
    // Apply torques
    api.applyTorque([
      pitch * pitchFactor * torqueScaleFactor,
      yaw * yawFactor * torqueScaleFactor,
      roll * rollFactor * torqueScaleFactor
    ]);
    
    // Apply auto-stabilization for better handling
    applyStabilization(rotationEuler, velocityVec);
  }
  
  // Apply auto-stabilization to make aircraft more stable
  function applyStabilization(rotationEuler, velocityVec) {
    // Skip stabilization during stall
    if (isStalling) return;
    
    // Get current rotation angles
    const [pitchAngle, yawAngle, rollAngle] = [rotationEuler.x, rotationEuler.y, rotationEuler.z];
    
    // Calculate stability forces (tendency to return to level flight)
    const rollStability = -rollAngle * 0.5 * physicsProps.mass;
    const pitchStability = -pitchAngle * 0.3 * physicsProps.mass;
    
    // Only apply if not actively controlling the aircraft
    const isControllingRoll = Math.abs(controlInputs.current.roll) > 0.01;
    const isControllingPitch = Math.abs(controlInputs.current.pitch) > 0.01;
    
    // Apply stabilization torques
    api.applyTorque([
      isControllingPitch ? 0 : pitchStability,
      0, // No yaw stabilization
      isControllingRoll ? 0 : rollStability
    ]);
  }

  // Handle pickup collision
  function handlePickup(pickupData) {
    const pickupType = pickupData.pickupType;
    
    switch (pickupType) {
      case 'health':
        // Health pickup
        const healthBoost = 25;
        actions.updatePlayerStats({ 
          health: Math.min(100, player.health + healthBoost) 
        });
        actions.addNotification(`+${healthBoost} health`);
        break;
        
      case 'fuel':
        // Fuel pickup
        const fuelBoost = 30;
        actions.updatePlayerStats({ 
          fuel: Math.min(100, player.fuel + fuelBoost) 
        });
        actions.addNotification(`+${fuelBoost} fuel`);
        break;
        
      case 'ammo':
        // Ammo pickup - replenish all weapons
        const updatedWeapons = aircraft.weapons.map(weapon => ({
          ...weapon,
          ammo: weapon.maxAmmo
        }));
        actions.updateAircraft({ weapons: updatedWeapons });
        actions.addNotification("Ammunition replenished");
        break;
        
      case 'credits':
        // Credit pickup
        const creditAmount = 100 + Math.floor(Math.random() * 100);
        actions.addCredits(creditAmount);
        break;
        
      case 'experience':
        // Experience pickup
        const expAmount = 50 + Math.floor(Math.random() * 50);
        actions.addExperience(expAmount);
        break;
        
      default:
        // Unknown pickup
        actions.addNotification(`Collected ${pickupType}`);
    }
    
    // Remove the pickup
    actions.removePickup(pickupData.id);
    
    // Play pickup sound
    actions.playSound('pickup');
  }

  return (
    <>
      <a.group ref={physicsRef} rotation={smoothRotation.rotation}>
        {/* Main aircraft model */}
        <AircraftModel 
          model={aircraft.model} 
          color={aircraft.color} 
          isStalling={isStalling}
          warningActive={warningActive}
          gForce={gForce}
          altitudeWarning={altitudeWarning}
        />
        
        {/* Cockpit interior (first-person view) */}
        <Cockpit 
          model={aircraft.model} 
          health={player.health}
          fuel={player.fuel}
          throttle={player.throttle}
          isStalling={isStalling}
          altitudeWarning={altitudeWarning}
          position={player.position}
        />
        
        {/* Weapons system */}
        <WeaponSystem 
          weapons={aircraft.weapons} 
          firing={input.keyboard.space || input.keyboard.f || input.touchControls.firing}
        />
      </a.group>
      
      {/* Engine trails */}
      <EngineTrails 
        position={player.position} 
        rotation={player.rotation} 
        active={player.throttle > 0.2 && player.fuel > 0} 
        color={aircraft.activeTrail}
        throttle={player.throttle}
      />
      
      {/* Camera that follows player */}
      <CameraFollow gForce={gForce} />
      
      {/* Damage effects when health is low */}
      {player.health < 30 && (
        <DamageEffects position={player.position} health={player.health} />
      )}
    </>
  );
};

// Visual damage effects component
const DamageEffects = ({ position, health }) => {
  const smokeIntensity = 1 - (health / 30);
  
  return (
    <>
      {/* Smoke trail for damaged aircraft */}
      <Trail
        width={1 + smokeIntensity}
        length={20}
        color="#555555"
        attenuation={(t) => (1 - t) * smokeIntensity}
      >
        <mesh position={[position[0], position[1] + 0.5, position[2]]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#444444" transparent opacity={0.7} />
        </mesh>
      </Trail>
      
      {/* Fire/sparks for critically damaged aircraft */}
      {health < 15 && (
        <pointLight 
          position={[position[0], position[1], position[2]]}
          color="#ff4400"
          intensity={2 * (1 - health/15)}
          distance={3}
          decay={2}
        />
      )}
    </>
  );
};

export default PlayerAircraft;