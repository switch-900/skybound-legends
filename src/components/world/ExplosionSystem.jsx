// src/components/world/ExplosionSystem.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const ExplosionSystem = ({ explosions }) => {
  return (
    <group>
      {explosions.map(explosion => (
        <Explosion
          key={explosion.id}
          position={explosion.position}
          scale={explosion.scale}
          lifetime={explosion.lifetime}
          createdAt={explosion.createdAt}
        />
      ))}
    </group>
  );
};

const Explosion = ({ position, scale = 1, lifetime, createdAt }) => {
  const groupRef = useRef();
  const lightRef = useRef();
  
  // Load explosion textures
  const explosionTexture = useTexture('/textures/explosion.png');
  
  // Calculate progress (0 to 1)
  const progress = useMemo(() => {
    const elapsed = Date.now() - createdAt;
    return Math.min(elapsed / lifetime, 1);
  }, [createdAt, lifetime]);
  
  // Create explosion material
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: explosionTexture,
      transparent: true,
      opacity: 1 - progress,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [explosionTexture, progress]);
  
  // Animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Grow explosion
      const size = scale * (0.5 + progress * 2);
      groupRef.current.scale.set(size, size, size);
      
      // Random rotation
      groupRef.current.rotation.x = clock.getElapsedTime() * 0.5;
      groupRef.current.rotation.z = clock.getElapsedTime() * 0.7;
      
      // Light intensity fades over time
      if (lightRef.current) {
        lightRef.current.intensity = 3 * (1 - progress);
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Explosion sphere */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        {material}
      </mesh>
      
      {/* Light */}
      <pointLight
        ref={lightRef}
        color="#ff8800"
        intensity={3}
        distance={10 * scale}
        decay={2}
      />
      
      {/* Particles */}
      <Sparkles
        count={50 * scale}
        scale={[1, 1, 1]}
        size={1}
        speed={0.3}
        color="#ff4400"
        opacity={1 - progress}
      />
    </group>
  );
};

export default ExplosionSystem;