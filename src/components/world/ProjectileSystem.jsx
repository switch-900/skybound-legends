// src/components/world/ProjectileSystem.jsx
import React, { useMemo } from 'react';
import { useInstancedMesh, Trail } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../contexts/GameContext';

const ProjectileSystem = ({ projectiles }) => {
  const { actions } = useGame();
  
  // Group projectiles by type
  const projectilesByType = useMemo(() => {
    const grouped = {};
    
    projectiles.forEach(proj => {
      const type = proj.weaponType || 'default';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(proj);
    });
    
    return grouped;
  }, [projectiles]);
  
  return (
    <group>
      {Object.entries(projectilesByType).map(([type, projs]) => (
        <ProjectileGroup 
          key={type} 
          type={type} 
          projectiles={projs}
          onHit={(projectileId, hitInfo) => {
            // Handle hit logic
            if (hitInfo.body.userData?.type === 'enemy') {
              actions.addExplosion(hitInfo.contact.contactPoint, 1);
            } else if (hitInfo.body.userData?.type === 'island') {
              actions.addExplosion(hitInfo.contact.contactPoint, 0.5);
            }
            
            // Remove projectile
            // (already handled by lifetime in updateWorld, but could add immediate removal)
          }}
        />
      ))}
    </group>
  );
};

const ProjectileGroup = ({ type, projectiles, onHit }) => {
  // Create physics bodies for each projectile
  const projectileBodies = useMemo(() => {
    return projectiles.map(proj => {
      // Setup physics body properties based on projectile type
      const [ref, api] = useBox(() => {
        const size = type === 'Missile' ? 0.3 : type === 'Rocket' ? 0.2 : 0.1;
        
        return {
          args: [size, size, size * 3],
          position: proj.position,
          rotation: proj.rotation,
          type: 'Dynamic',
          mass: type === 'Missile' ? 5 : type === 'Rocket' ? 3 : 1,
          linearDamping: 0.1,
          collisionResponse: true,
          onCollide: (e) => {
            // Skip collisions with own aircraft
            if (e.body.userData?.id === 'player' && proj.owner === 'player') {
              return;
            }
            
            // Handle hit
            onHit(proj.id, e);
          },
          userData: { 
            type: 'projectile', 
            id: proj.id,
            owner: proj.owner,
            projectileType: type,
            damage: proj.damage
          },
        };
      });
      
      // Set initial velocity
      api.velocity.set(...proj.velocity);
      
      return { ref, proj, api };
    });
  }, [projectiles, type, onHit]);
  
  // Visual appearance based on projectile type
  const getProjectileColor = () => {
    switch (type) {
      case 'Missile':
        return '#ff4500';
      case 'Rocket':
        return '#ff8c00';
      case 'Machinegun':
      default:
        return '#ffff00';
    }
  };
  
  return (
    <group name={`projectile-group-${type}`}>
      {projectileBodies.map(({ ref, proj }) => (
        <group key={proj.id} ref={ref}>
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.3]} />
            <meshBasicMaterial color={getProjectileColor()} />
          </mesh>
          
          {/* Trail based on type */}
          <Trail
            width={type === 'Missile' ? 0.3 : type === 'Rocket' ? 0.2 : 0.1}
            length={type === 'Missile' ? 8 : type === 'Rocket' ? 5 : 3}
            color={getProjectileColor()}
            attenuation={(t) => (1 - t)}
          >
            <mesh position={[0, 0, -0.2]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color={getProjectileColor()} />
            </mesh>
          </Trail>
          
          {/* Light for the projectile */}
          <pointLight
            color={getProjectileColor()}
            intensity={type === 'Missile' ? 2 : type === 'Rocket' ? 1.5 : 1}
            distance={type === 'Missile' ? 5 : type === 'Rocket' ? 3 : 2}
          />
        </group>
      ))}
    </group>
  );
};

export default ProjectileSystem;