// src/components/world/CloudSystem.jsx
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Cloud, Instance, Instances, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useBox } from '@react-three/cannon';
import { useGame } from '../../contexts/GameContext';
import { COLLISION_GROUPS } from '../../utils/physics';

/**
 * CloudSystem generates and manages clouds based on weather conditions
 */
const CloudSystem = ({ count = 10, weather = 'clear', dayNightCycle = 0.5 }) => {
  const { camera } = useThree();
  const { state, actions } = useGame();
  const cloudsRef = useRef();
  
  // Weather-specific cloud settings
  const cloudSettings = useMemo(() => ({
    'clear': {
      density: 0.3,
      speed: 0.02,
      opacity: 0.6,
      coverage: 0.3,
      size: 1,
      useSoftCollisions: false
    },
    'cloudy': {
      density: 0.6,
      speed: 0.04,
      opacity: 0.8,
      coverage: 0.7,
      size: 1.5,
      useSoftCollisions: true
    },
    'stormy': {
      density: 0.9,
      speed: 0.08,
      opacity: 1.0,
      coverage: 0.9,
      size: 2,
      useSoftCollisions: true
    },
    'foggy': {
      density: 0.8,
      speed: 0.01,
      opacity: 0.7,
      coverage: 0.6,
      size: 2.5,
      useSoftCollisions: true
    }
  }), []);
  
  // Get settings for current weather
  const settings = cloudSettings[weather] || cloudSettings.clear;
  
  // Generate cloud positions in a hemisphere around the player
  const cloudPositions = useMemo(() => {
    const positions = [];
    const worldRadius = 500;
    const cloudHeight = 80;
    const cloudRadius = 300;
    
    // Create positions based on coverage
    const effectiveCount = Math.ceil(count * settings.coverage);
    
    for (let i = 0; i < effectiveCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // Only upper hemisphere
      const r = 150 + Math.random() * cloudRadius;
      
      positions.push({
        id: `cloud_${i}`,
        position: [
          Math.cos(theta) * Math.sin(phi) * r,
          cloudHeight + Math.sin(phi) * cloudRadius,
          Math.sin(theta) * Math.sin(phi) * r
        ],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        scale: (0.7 + Math.random() * 0.6) * settings.size,
        speed: settings.speed * (0.8 + Math.random() * 0.4),
        opacity: settings.opacity * (0.8 + Math.random() * 0.4),
        segments: weather === 'stormy' ? 15 : 8,
        color: weather === 'stormy' ? '#555555' : 
               weather === 'foggy' ? '#AAAAAA' : 
               '#FFFFFF',
        density: settings.density,
        direction: [
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        ]
      });
    }
    
    return positions;
  }, [count, weather, settings]);
  
  // Create physical clouds if we need soft collisions
  const physicalClouds = useMemo(() => {
    if (!settings.useSoftCollisions) return [];
    
    // Only create physics for some clouds
    return cloudPositions
      .filter((_, i) => i % 3 === 0) // every third cloud
      .map(cloud => {
        // Create physics properties
        const [ref, api] = useBox(() => ({
          args: [cloud.scale * 20, cloud.scale * 10, cloud.scale * 20],
          position: cloud.position,
          rotation: cloud.rotation,
          type: 'Static',
          isTrigger: true,
          collisionFilterGroup: COLLISION_GROUPS.DEFAULT,
          collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY,
          onCollide: (e) => handleCloudCollision(e, cloud),
          userData: {
            type: 'cloud',
            id: cloud.id,
            density: cloud.density
          }
        }));
        
        return { ...cloud, ref, api };
      });
  }, [cloudPositions, settings.useSoftCollisions]);
  
  // Handle collision with cloud (reduce visibility, apply drag)
  function handleCloudCollision(event, cloud) {
    const { body } = event;
    
    if (!body.userData) return;
    
    // Different effects based on what hit the cloud
    if (body.userData.type === 'aircraft') {
      // Get velocity
      const velocity = [];
      body.velocity.get(velocity);
      const speed = Math.sqrt(velocity[0]**2 + velocity[1]**2 + velocity[2]**2);
      
      // Skip if very slow
      if (speed < 0.1) return;
      
      // Calculate resistance force (against movement direction)
      const resistanceFactor = cloud.density * 0.3;
      const resistanceForce = [
        -velocity[0] * resistanceFactor,
        -velocity[1] * resistanceFactor, 
        -velocity[2] * resistanceFactor
      ];
      
      // Apply drag force
      body.applyForce(resistanceForce, [0, 0, 0]);
      
      // Apply light turbulence
      const turbulenceFactor = cloud.density * 0.1;
      const turbulence = [
        (Math.random() - 0.5) * turbulenceFactor,
        (Math.random() - 0.5) * turbulenceFactor,
        (Math.random() - 0.5) * turbulenceFactor
      ];
      
      body.applyForce(turbulence, [0, 0, 0]);
      
      // Effect on player visibility if player aircraft
      if (body.userData.id === 'player') {
        // Add 'in cloud' visual effect
        actions.setInCloud(true, cloud.density);
        
        // Play cloud whoosh sound based on speed
        if (speed > 0.3) {
          actions.playSound('windRush', { 
            volume: Math.min(0.5, speed * 0.3), 
            playbackRate: 0.8 + speed * 0.2
          });
        }
        
        // Clear visibility effect after short delay
        clearTimeout(window.cloudTimeout);
        window.cloudTimeout = setTimeout(() => {
          actions.setInCloud(false, 0);
        }, 1000);
      }
    }
  }
  
  // Update cloud positions
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Skip if no cloud instances
    if (!cloudsRef.current) return;
    
    // Get camera position to keep clouds centered around player
    const cameraPosition = camera.position.clone();
    
    // Move each cloud according to its direction and speed
    cloudsRef.current.children.forEach((cloud, i) => {
      const data = cloudPositions[i];
      if (!data) return;
      
      // Base movement with some oscillation
      const newX = data.position[0] + data.direction[0] * data.speed;
      const newY = data.position[1] + Math.sin(time * 0.2 + i) * 0.1; // Gentle vertical oscillation
      const newZ = data.position[2] + data.direction[2] * data.speed;
      
      // Keep clouds centered around camera
      const dx = newX - cameraPosition.x;
      const dz = newZ - cameraPosition.z;
      const distSq = dx * dx + dz * dz;
      
      if (distSq > 350 * 350) {
        // Reset to other side if too far
        const angle = Math.atan2(dz, dx) + Math.PI; // Opposite direction
        const dist = 200 + Math.random() * 150;
        
        cloud.position.set(
          cameraPosition.x + Math.cos(angle) * dist,
          data.position[1],
          cameraPosition.z + Math.sin(angle) * dist
        );
        
        // Update original position data
        data.position[0] = cloud.position.x;
        data.position[2] = cloud.position.z;
      } else {
        // Normal movement
        cloud.position.set(newX, newY, newZ);
        
        // Update original position data
        data.position[0] = newX;
        data.position[1] = newY;
        data.position[2] = newZ;
      }
      
      // Slow rotation
      cloud.rotation.y += 0.0001 * data.speed * 50;
    });
    
    // Update physics clouds if enabled
    physicalClouds.forEach(cloud => {
      if (cloud.api) {
        // Find corresponding visual cloud
        const visIndex = cloudPositions.findIndex(c => c.id === cloud.id);
        if (visIndex >= 0 && cloudsRef.current.children[visIndex]) {
          // Get position from visual cloud
          const visualCloud = cloudsRef.current.children[visIndex];
          cloud.api.position.set(
            visualCloud.position.x,
            visualCloud.position.y,
            visualCloud.position.z
          );
        }
      }
    });
  });
  
  // Handle day/night color transitions
  const cloudColor = useMemo(() => {
    // Base color from weather
    const baseColor = weather === 'stormy' ? '#555555' : 
                      weather === 'foggy' ? '#AAAAAA' : 
                      '#FFFFFF';
    
    // Adjust based on time of day
    if (dayNightCycle < 0.25 || dayNightCycle > 0.75) {
      // Night - darker clouds
      return new THREE.Color(baseColor).multiplyScalar(0.5).getStyle();
    }
    
    return baseColor;
  }, [weather, dayNightCycle]);

  return (
    <group name="cloud-system">
      {/* Create cloud instances */}
      <Instances limit={cloudPositions.length} ref={cloudsRef}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial 
          color={cloudColor}
          transparent={true}
          opacity={0.1}
          envMapIntensity={0.5}
        />
        
        {cloudPositions.map((cloud, i) => (
          <group key={cloud.id} name={cloud.id}>
            <DynamicCloud 
              position={cloud.position}
              rotation={cloud.rotation}
              scale={cloud.scale}
              seed={i}
              segments={cloud.segments}
              opacity={cloud.opacity}
              color={cloud.color}
              weather={weather}
            />
          </group>
        ))}
      </Instances>
      
      {/* Add invisible physics objects for cloud collisions */}
      {physicalClouds.map(cloud => (
        <group key={`physics-${cloud.id}`} ref={cloud.ref} />
      ))}
    </group>
  );
};

/**
 * Individual cloud with dynamic appearance based on weather
 */
const DynamicCloud = ({ position, rotation, scale, seed, segments, opacity, color, weather }) => {
  const meshRef = useRef();
  
  // Make each cloud unique to avoid repetitive patterns
  const uniqueProps = useMemo(() => {
    const seededRandom = () => {
      // Simple seeded random function
      let x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    
    // Calculate fog level based on weather
    const fog = weather === 'foggy' ? 0.7 : 
                weather === 'stormy' ? 0.5 : 
                weather === 'cloudy' ? 0.3 : 
                0.1;
    
    return {
      // Make each cloud slightly different
      width: (1 + seededRandom() * 0.5) * scale * 10,
      height: (0.5 + seededRandom() * 0.3) * scale * 10,
      depth: (1 + seededRandom() * 0.5) * scale * 10,
      segments: segments || (weather === 'stormy' ? 15 : 8),
      opacity: opacity * (0.8 + seededRandom() * 0.4),
      fog,
      color,
      seed: Math.floor(seededRandom() * 100)
    };
  }, [seed, scale, weather, segments, opacity, color]);
  
  // Use useEffect instead of Instance for unique Cloud props
  useEffect(() => {
    if (!meshRef.current) return;
    
    // Create a THREE.Object3D to hold the Cloud
    const cloudObj = new THREE.Object3D();
    cloudObj.position.set(...position);
    cloudObj.rotation.set(...rotation);
    cloudObj.scale.set(scale, scale, scale);
    
    // Add the cloud to the mesh
    meshRef.current.add(cloudObj);
    
    return () => {
      meshRef.current.remove(cloudObj);
    };
  }, [position, rotation, scale]);
  
  // Use Instance to optimize rendering
  return (
    <Instance 
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <Cloud
        position={[0, 0, 0]}
        bounds={[
          uniqueProps.width,
          uniqueProps.height,
          uniqueProps.depth
        ]}
        segments={uniqueProps.segments}
        volume={uniqueProps.fog}
        opacity={uniqueProps.opacity}
        color={uniqueProps.color}
        seed={uniqueProps.seed}
        depthTest={true}
      />
    </Instance>
  );
};

export default CloudSystem;