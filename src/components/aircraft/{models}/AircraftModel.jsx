// src/components/aircraft/AircraftModel.jsx
import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Import standard models
import { StandardAircraft } from './models/StandardAircraft';
import { FighterAircraft } from './models/FighterAircraft';
import { BomberAircraft } from './models/BomberAircraft';
import { ScoutAircraft } from './models/ScoutAircraft';

const AircraftModel = ({ model, color, isStalling, warningActive }) => {
  const groupRef = useRef();
  
  // Try to load a GLB model first
  const { scene, nodes, materials } = useGLTF(`/models/aircraft/${model}.glb`, true);
  
  // Create materials
  const mainMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.7,
      roughness: 0.3,
    });
  }, [color]);
  
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#88ccff',
      transmission: 0.9,
      opacity: 0.7,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
    });
  }, []);
  
  // Stall warning effect
  const warningMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: warningActive ? '#ff0000' : '#440000',
      emissive: warningActive ? '#ff0000' : '#000000',
      emissiveIntensity: warningActive ? 2 : 0,
    });
  }, [warningActive]);
  
  // Render model or fallback to built-in component model
  if (scene) {
    // Apply materials to model parts
    useMemo(() => {
      scene.traverse((node) => {
        if (node.isMesh) {
          // Apply materials based on mesh name
          if (node.name.includes('body') || node.name.includes('fuselage')) {
            node.material = mainMaterial;
          } else if (node.name.includes('glass') || node.name.includes('canopy')) {
            node.material = glassMaterial;
          } else if (node.name.includes('warning')) {
            node.material = warningMaterial;
          }
        }
      });
    }, [scene, mainMaterial, glassMaterial, warningMaterial]);
    
    return (
      <group ref={groupRef} dispose={null}>
        <primitive object={scene} />
        {isStalling && (
          <pointLight position={[0, 0, 0]} color="#ff0000" intensity={warningActive ? 2 : 0} distance={5} />
        )}
      </group>
    );
  }
  
  // Fallback to component models
  switch (model) {
    case 'fighter':
      return <FighterAircraft color={color} isStalling={isStalling} warningActive={warningActive} />;
    case 'bomber':
      return <BomberAircraft color={color} isStalling={isStalling} warningActive={warningActive} />;
    case 'scout':
      return <ScoutAircraft color={color} isStalling={isStalling} warningActive={warningActive} />;
    case 'standard':
    default:
      return <StandardAircraft color={color} isStalling={isStalling} warningActive={warningActive} />;
  }
};

export default AircraftModel;
