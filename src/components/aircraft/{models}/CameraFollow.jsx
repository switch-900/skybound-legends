// src/components/aircraft/CameraFollow.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../contexts/GameContext';

const CameraFollow = () => {
  const { state } = useGame();
  const { player, settings } = state;
  const { camera } = useThree();
  const [cameraMode, setCameraMode] = useState('chase'); // 'chase', 'cockpit', 'orbit'
  const timeRef = useRef(0);
  
  // Setup camera controls
  useEffect(() => {
    // Camera mode toggle on 'C' key
    const handleKeyPress = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setCameraMode(prev => {
          switch (prev) {
            case 'chase': return 'cockpit';
            case 'cockpit': return 'orbit';
            case 'orbit': return 'chase';
            default: return 'chase';
          }
        });
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);
  
  useFrame((state, delta) => {
    if (!player.position) return;
    
    // Convert arrays to THREE.Vector3 objects
    const pos = new THREE.Vector3().fromArray(player.position);
    const rot = new THREE.Euler().fromArray(player.rotation);
    
    // Create direction vectors
    const forwardDir = new THREE.Vector3(0, 0, 1);
    const upDir = new THREE.Vector3(0, 1, 0);
    
    // Apply aircraft rotation
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(rot);
    forwardDir.applyMatrix4(rotMatrix);
    upDir.applyMatrix4(rotMatrix);
    
    // Camera parameters based on mode
    switch (cameraMode) {
      case 'chase':
        // Chase camera behind and above aircraft
        const chaseOffset = new THREE.Vector3(-8, 2, -10);
        chaseOffset.applyMatrix4(rotMatrix);
        
        const targetPos = pos.clone().add(chaseOffset);
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(pos);
        break;
        
      case 'cockpit':
        // First-person view from cockpit
        const cockpitOffset = new THREE.Vector3(0, 0.5, 0.5);
        cockpitOffset.applyMatrix4(rotMatrix);
        
        camera.position.copy(pos.clone().add(cockpitOffset));
        
        // Look in aircraft's forward direction
        const lookTarget = pos.clone().add(forwardDir.multiplyScalar(10));
        camera.lookAt(lookTarget);
        break;
        
      case 'orbit':
        // Orbital camera that circles the aircraft
        timeRef.current += delta * 0.2;
        const orbitRadius = 15;
        const orbitHeight = 5;
        
        const orbitX = Math.sin(timeRef.current) * orbitRadius;
        const orbitZ = Math.cos(timeRef.current) * orbitRadius;
        
        camera.position.set(
          pos.x + orbitX,
          pos.y + orbitHeight,
          pos.z + orbitZ
        );
        
        camera.lookAt(pos);
        break;
    }
  });
  
  return null;
};

export default CameraFollow;