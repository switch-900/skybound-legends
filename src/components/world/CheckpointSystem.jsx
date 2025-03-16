// src/components/world/CheckpointSystem.jsx
import React from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../../contexts/GameContext';

const CheckpointSystem = ({ checkpoints }) => {
  const { actions } = useGame();
  
  return (
    <group>
      {checkpoints.map(checkpoint => (
        !checkpoint.triggered && (
          <Checkpoint 
            key={checkpoint.id}
            checkpoint={checkpoint}
            onTrigger={() => actions.updateCheckpoint(checkpoint.id)}
          />
        )
      ))}
    </group>
  );
};

const Checkpoint = ({ checkpoint, onTrigger }) => {
  const { id, position, radius, triggered } = checkpoint;
  
  // Create physics trigger for checkpoint
  const [ref, api] = useSphere(() => ({
    args: [radius],
    position,
    type: 'Static',
    isTrigger: true,
    onCollide: (e) => {
      // Check if player collided with checkpoint
      if (e.body.userData?.type === 'aircraft' && e.body.userData?.id === 'player') {
        onTrigger();
      }
    },
    userData: { type: 'checkpoint', id },
  }));
  
  // Animate checkpoint ring
  useFrame(({ clock }) => {
    if (ref.current && !triggered) {
      ref.current.rotation.z = clock.getElapsedTime() * 0.5;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });
  
  return (
    <group ref={ref} position={position}>
      <mesh>
        <torusGeometry args={[radius, radius * 0.06, 16, 32]} />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#FFD700" 
          emissiveIntensity={0.5} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
      <pointLight color="#FFD700" distance={radius * 3} intensity={1} />
    </group>
  );
};

export default CheckpointSystem;