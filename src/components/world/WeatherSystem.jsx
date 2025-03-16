// src/components/world/WeatherSystem.jsx
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../../contexts/GameContext';

/**
 * WeatherSystem handles weather and atmospheric effects
 * It manages sky, fog, lighting and weather particles
 */
const WeatherSystem = ({ weather, dayNightCycle, quality = 'medium' }) => {
  const { scene } = useThree();
  const { actions } = useGame();
  
  // References to weather effect objects
  const particlesRef = useRef();
  const lightningRef = useRef();
  const rainRef = useRef();
  const fogRef = useRef(null);
  
  // Track active weather effects
  const activeEffects = useRef({
    lightning: false,
    rain: false,
    fog: false
  });
  
  // Particle count based on quality and weather
  const particleCount = useMemo(() => {
    const qualityMultiplier = {
      'low': 0.3,
      'medium': 1,
      'high': 2.5
    }[quality] || 1;
    
    return {
      'foggy': 1000 * qualityMultiplier,
      'stormy': 2000 * qualityMultiplier,
      'cloudy': 500 * qualityMultiplier,
      'clear': 0
    }[weather] || 0;
  }, [weather, quality]);
  
  // Load weather textures (rain drops, fog particles, etc.)
  const rainTexture = useTexture('/textures/effects/raindrop.png');
  const fogTexture = useTexture('/textures/effects/fog.png');
  const snowTexture = useTexture('/textures/effects/snowflake.png');
  
  // Create weather particles
  useEffect(() => {
    // Skip if no particles needed
    if (particleCount === 0) return;
    
    // Create particle materials based on weather type
    const particleMaterial = new THREE.PointsMaterial({
      size: weather === 'foggy' ? 40 : weather === 'stormy' ? 2 : 10,
      sizeAttenuation: true,
      map: weather === 'foggy' ? fogTexture : 
           weather === 'stormy' ? rainTexture : 
           snowTexture,
      transparent: true,
      opacity: weather === 'foggy' ? 0.5 : 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle geometry
    const radius = 500; // World radius
    const height = 300; // Max height
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Different distribution based on weather type
      if (weather === 'foggy') {
        // Fog particles around the player in a larger volume
        const theta = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * radius;
        const height = Math.random() * 200;
        
        positions[i3] = Math.cos(theta) * r;
        positions[i3 + 1] = height;
        positions[i3 + 2] = Math.sin(theta) * r;
        
        // Slow drifting motion
        velocities[i3] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      } 
      else if (weather === 'stormy') {
        // Rain particles - start high and fall down
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        
        positions[i3] = Math.cos(theta) * r;
        positions[i3 + 1] = 100 + Math.random() * 200; // Start high
        positions[i3 + 2] = Math.sin(theta) * r;
        
        // Fast downward velocity with some horizontal wind
        velocities[i3] = (Math.random() - 0.5) * 1; // Wind
        velocities[i3 + 1] = -5 - Math.random() * 10; // Falling
        velocities[i3 + 2] = (Math.random() - 0.5) * 1; // Wind
      }
      else {
        // Cloudy - slow moving particles
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        
        positions[i3] = Math.cos(theta) * r;
        positions[i3 + 1] = 50 + Math.random() * 100;
        positions[i3 + 2] = Math.sin(theta) * r;
        
        // Slow movement
        velocities[i3] = (Math.random() - 0.5) * 0.2;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
      }
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    // Create particle system
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.frustumCulled = false; // Don't cull particles
    
    // Add to scene
    scene.add(particles);
    particlesRef.current = particles;
    
    // Track active effects
    activeEffects.current.rain = weather === 'stormy';
    activeEffects.current.fog = weather === 'foggy';
    
    // Start appropriate weather sounds
    if (weather === 'stormy') {
      actions.playSound('rain', { volume: 0.4, loop: true });
      actions.playSound('thunder', { volume: 0.6 });
    }
    else if (weather === 'foggy') {
      actions.playSound('wind', { volume: 0.2, loop: true });
    }
    
    return () => {
      scene.remove(particles);
      
      // Stop weather sounds
      actions.stopSound('rain');
      actions.stopSound('wind');
    };
  }, [weather, particleCount, rainTexture, fogTexture, snowTexture]);
  
  // Create lightning for storms
  useEffect(() => {
    if (weather === 'stormy') {
      // Create lightning light
      const lightning = new THREE.PointLight('#ffffff', 0, 500, 1.5);
      lightning.position.set(0, 100, 0);
      scene.add(lightning);
      lightningRef.current = lightning;
      
      // Track active effects
      activeEffects.current.lightning = true;
    }
    
    return () => {
      if (lightningRef.current) {
        scene.remove(lightningRef.current);
        lightningRef.current = null;
        activeEffects.current.lightning = false;
      }
    };
  }, [weather]);
  
  // Create fog effect
  useEffect(() => {
    // Configure fog based on weather
    let fogColor, fogDensity;
    
    switch (weather) {
      case 'foggy':
        fogColor = '#CCCCCC';
        fogDensity = 0.015;
        break;
      case 'stormy':
        fogColor = '#666666';
        fogDensity = 0.007;
        break;
      case 'cloudy':
        fogColor = '#AAAAAA';
        fogDensity = 0.003;
        break;
      default: // clear
        fogColor = '#87CEEB';
        fogDensity = 0.001;
    }
    
    // Adjust fog color based on time of day
    if (dayNightCycle < 0.2 || dayNightCycle > 0.8) {
      // Night - darker fog
      fogColor = new THREE.Color(fogColor).multiplyScalar(0.5).getStyle();
      fogDensity *= 1.5; // Denser at night
    }
    
    // Create fog
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
    fogRef.current = scene.fog;
    
    return () => {
      scene.fog = null;
      fogRef.current = null;
    };
  }, [weather, dayNightCycle]);
  
  // Animate weather effects
  useFrame(({ clock, camera }) => {
    const time = clock.getElapsedTime();
    
    // Update particle positions
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      const velocities = particlesRef.current.geometry.attributes.velocity.array;
      
      // Move each particle based on its velocity
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Update position
        positions[i3] += velocities[i3] * (weather === 'stormy' ? 2 : 0.5);
        positions[i3 + 1] += velocities[i3 + 1] * (weather === 'stormy' ? 2 : 0.5);
        positions[i3 + 2] += velocities[i3 + 2] * (weather === 'stormy' ? 2 : 0.5);
        
        // Reset rain particles that fall below ground
        if (weather === 'stormy' && positions[i3 + 1] < 0) {
          // Reposition at top
          positions[i3] = camera.position.x + (Math.random() - 0.5) * 200;
          positions[i3 + 1] = camera.position.y + 100 + Math.random() * 100;
          positions[i3 + 2] = camera.position.z + (Math.random() - 0.5) * 200;
        }
        
        // Keep fog particles within bounds and moving around camera
        if (weather === 'foggy') {
          // Gradually move fog particles toward the camera to keep them nearby
          const dx = camera.position.x - positions[i3];
          const dz = camera.position.z - positions[i3 + 2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          if (dist > 150) {
            // Pull toward camera with slow acceleration
            velocities[i3] += dx / dist * 0.01;
            velocities[i3 + 2] += dz / dist * 0.01;
          }
          
          // Keep vertical position reasonable
          if (positions[i3 + 1] < 0 || positions[i3 + 1] > 200) {
            velocities[i3 + 1] = -velocities[i3 + 1];
          }
          
          // Add some random drift
          if (Math.random() < 0.01) {
            velocities[i3] += (Math.random() - 0.5) * 0.05;
            velocities[i3 + 2] += (Math.random() - 0.5) * 0.05;
          }
          
          // Limit max velocity
          const maxVel = 0.3;
          velocities[i3] = Math.max(-maxVel, Math.min(maxVel, velocities[i3]));
          velocities[i3 + 2] = Math.max(-maxVel, Math.min(maxVel, velocities[i3 + 2]));
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Lightning effect for storms
    if (activeEffects.current.lightning && lightningRef.current) {
      // Random lightning flashes
      if (Math.random() < 0.005) { // Chance of lightning each frame
        const flashDuration = 100 + Math.random() * 150;
        
        // Set random position for lightning
        const theta = Math.random() * Math.PI * 2;
        const r = 100 + Math.random() * 300;
        lightningRef.current.position.set(
          camera.position.x + Math.cos(theta) * r,
          150 + Math.random() * 100,
          camera.position.z + Math.sin(theta) * r
        );
        
        // Activate lightning
        lightningRef.current.intensity = 10 + Math.random() * 15;
        
        // Play thunder sound with delay based on distance
        const distance = camera.position.distanceTo(lightningRef.current.position);
        const soundDelay = distance / 343 * 1000; // Speed of sound is ~343 m/s
        setTimeout(() => {
          actions.playSound('thunder', { 
            volume: 0.3 + Math.random() * 0.4,
            playbackRate: 0.8 + Math.random() * 0.4
          });
        }, soundDelay);
        
        // Turn off after duration
        setTimeout(() => {
          if (lightningRef.current) {
            lightningRef.current.intensity = 0;
          }
        }, flashDuration);
      }
    }
    
    // Update fog based on time of day
    if (fogRef.current) {
      // Gradually adjust fog color based on time of day
      if (dayNightCycle < 0.2 || dayNightCycle > 0.8) {
        // Night - darker fog
        fogRef.current.color.multiplyScalar(0.999);
      } else {
        // Day - brighter fog
        const targetColor = new THREE.Color(
          weather === 'foggy' ? '#CCCCCC' : 
          weather === 'stormy' ? '#666666' : 
          weather === 'cloudy' ? '#AAAAAA' : 
          '#87CEEB'
        );
        fogRef.current.color.lerp(targetColor, 0.01);
      }
    }
  });
  
  // Calculate sun position based on day/night cycle
  const sunPosition = useMemo(() => {
    const timeOfDay = dayNightCycle * 24; // Convert to 24-hour format
    
    // Sunrise at 6h, sunset at 18h
    let altitude;
    if (timeOfDay >= 6 && timeOfDay <= 18) {
      // Day - sun above horizon
      const dayProgress = (timeOfDay - 6) / 12; // 0 at sunrise, 1 at sunset
      altitude = Math.sin(dayProgress * Math.PI); // 0 to 1 and back to 0
    } else {
      // Night - sun below horizon
      altitude = -0.2; // Just below horizon
    }
    
    // Calculate sun azimuth (horizontal position)
    const azimuth = ((timeOfDay / 24) * Math.PI * 2) - Math.PI/2;
    
    // Convert to Cartesian coordinates
    return [
      Math.cos(azimuth) * Math.cos(altitude) * 100,
      Math.sin(altitude) * 100,
      Math.sin(azimuth) * Math.cos(altitude) * 100
    ];
  }, [dayNightCycle]);
  
  // Determine if it's night time for stars visibility
  const isNight = dayNightCycle < 0.25 || dayNightCycle > 0.75;
  
  return (
    <>
      {/* Sky component with day/night cycle */}
      <Sky 
        distance={450000}
        sunPosition={sunPosition}
        inclination={dayNightCycle * 2 - 1} // -1 to 1
        azimuth={dayNightCycle * 2 * Math.PI}
        mieCoefficient={weather === 'foggy' ? 0.05 : 0.005}
        mieDirectionalG={0.8}
        rayleigh={isNight ? 0.5 : 2}
        turbidity={weather === 'cloudy' ? 10 : weather === 'stormy' ? 20 : 5}
      />
      
      {/* Stars (only visible at night) */}
      {isNight && (
        <Stars 
          radius={300} 
          depth={100} 
          count={quality === 'high' ? 5000 : quality === 'medium' ? 2000 : 1000}
          factor={4}
          saturation={1}
          fade={true}
        />
      )}
      
      {/* Main directional light (sun) */}
      <directionalLight
        position={sunPosition}
        intensity={
          weather === 'stormy' ? 0.3 :
          weather === 'foggy' ? 0.5 :
          weather === 'cloudy' ? 0.7 :
          isNight ? 0.1 : 1
        }
        castShadow={quality !== 'low'}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      {/* Ambient light (stronger at night for visibility) */}
      <ambientLight
        intensity={
          isNight ? 0.3 :
          weather === 'stormy' ? 0.2 :
          weather === 'foggy' ? 0.4 :
          weather === 'cloudy' ? 0.3 :
          0.1
        }
        color={
          isNight ? '#3465a4' :
          weather === 'stormy' ? '#666666' :
          '#ffffff'
        }
      />
      
      {/* Moon light at night */}
      {isNight && (
        <directionalLight
          position={[-sunPosition[0], -sunPosition[1], -sunPosition[2]]}
          intensity={0.2}
          color="#3465a4"
        />
      )}
      
      {/* Physics impact on aircraft - apply weather forces */}
      <WeatherPhysics weather={weather} dayNightCycle={dayNightCycle} />
    </>
  );
};

/**
 * Applies weather-based physics forces to aircraft
 */
const WeatherPhysics = ({ weather, dayNightCycle }) => {
  const { state } = useGame();
  const { player, aircraft } = state;
  
  // Apply wind and turbulence forces to player aircraft
  useFrame(({ clock }) => {
    if (!player.api) return; // Skip if player physics body not available
    
    const time = clock.getElapsedTime();
    
    // Base turbulence factors based on weather
    const turbulenceFactor = {
      'stormy': 0.5,
      'cloudy': 0.2,
      'foggy': 0.1,
      'clear': 0.05
    }[weather] || 0.05;
    
    // Higher turbulence at night
    const isNight = dayNightCycle < 0.25 || dayNightCycle > 0.75;
    const timeMultiplier = isNight ? 1.5 : 1.0;
    
    // Calculate turbulence forces (random but coherent)
    const turbX = Math.sin(time * 2.3) * Math.cos(time * 3.7) * turbulenceFactor * timeMultiplier;
    const turbY = Math.sin(time * 1.7) * Math.cos(time * 4.3) * turbulenceFactor * timeMultiplier;
    const turbZ = Math.sin(time * 3.1) * Math.cos(time * 2.9) * turbulenceFactor * timeMultiplier;
    
    // Apply lateral wind force for stormy weather
    let windX = 0, windZ = 0;
    if (weather === 'stormy') {
      // Prevailing wind direction that changes slowly
      const windAngle = time * 0.05;
      windX = Math.cos(windAngle) * 0.8;
      windZ = Math.sin(windAngle) * 0.8;
    }
    
    // Apply forces - scale by aircraft mass
    const mass = aircraft.model === 'bomber' ? 1.5 : 
                 aircraft.model === 'fighter' ? 0.8 : 1;
    
    // Only apply if aircraft is moving (not on ground/stationary)
    const vel = [];
    player.api.velocity.get(vel);
    const speed = Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2]);
    
    if (speed > 0.1) {
      // Apply turbulence (random forces in all directions)
      player.api.applyForce(
        [turbX * mass * 10, turbY * mass * 10, turbZ * mass * 10],
        [0, 0, 0]
      );
      
      // Apply wind (consistent force in one direction)
      if (weather === 'stormy') {
        player.api.applyForce(
          [windX * mass * 20, 0, windZ * mass * 20],
          [0, 0, 0]
        );
      }
    }
  });
  
  return null;
};

export default WeatherSystem;