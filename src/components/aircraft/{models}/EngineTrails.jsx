// src/components/aircraft/EngineTrails.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

const EngineTrails = ({ position, rotation, active, color = 'blue' }) => {
  const trailRef = useRef();
  const [trailColor, setTrailColor] = useState('#3498db'); // Default blue
  
  useEffect(() => {
    // Set trail color based on selection
    switch(color) {
      case 'red':
        setTrailColor('#e74c3c');
        break;
      case 'green':
        setTrailColor('#2ecc71');
        break;
      case 'purple':
        setTrailColor('#9b59b6');
        break;
      case 'orange':
        setTrailColor('#e67e22');
        break;
      case 'blue':
      default:
        setTrailColor('#3498db');
        break;
    }
  }, [color]);
  
  // Calculate trail position behind the aircraft
  const enginePos = new THREE.Vector3();
  const forwardVector = new THREE.Vector3(0, 0, -1);
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2], 'XYZ'));
  forwardVector.applyMatrix4(rotationMatrix);
  
  enginePos.set(
    position[0] - forwardVector.x * 1.5,
    position[1] - forwardVector.y * 1.5,
    position[2] - forwardVector.z * 1.5
  );
  
  return active ? (
    <Trail
      width={0.5}
      length={15}
      color={trailColor}
      attenuation={(t) => (1 - t)}
      ref={trailRef}
    >
      <mesh position={[enginePos.x, enginePos.y, enginePos.z]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={trailColor} />
      </mesh>
    </Trail>
  ) : null;
};

export default EngineTrails;
