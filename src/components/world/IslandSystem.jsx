// src/components/world/IslandSystem.jsx
import React, { useMemo, useRef } from 'react';
import { useCylinder, useCone } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Detailed, useGLTF, Instance, Instances } from '@react-three/drei';
import { useGame } from '../../contexts/GameContext';
import { createIslandPhysics, PHYSICS_MATERIALS } from '../../utils/physics';

/**
 * Island System that manages all islands in the game
 */
const IslandSystem = () => {
  const { state } = useGame();
  const { world } = state;
  
  // Group islands by type for efficient rendering with instancing
  const islandsByType = useMemo(() => {
    const grouped = {
      standard: [],
      volcanic: [],
      crystal: [],
      ancient: []
    };
    
    // Only include islands from discovered zones
    const visibleIslands = world.islands.filter(island => 
      world.discoveredZones.includes(island.zone)
    );
    
    // Group by type
    visibleIslands.forEach(island => {
      const type = island.type || 'standard';
      if (grouped[type]) {
        grouped[type].push(island);
      } else {
        grouped.standard.push(island);
      }
    });
    
    return grouped;
  }, [world.islands, world.discoveredZones]);

  return (
    <group name="island-system">
      {Object.entries(islandsByType).map(([type, islands]) => (
        islands.length > 0 && (
          <IslandGroup
            key={type}
            type={type}
            islands={islands}
            dayNightCycle={world.dayNightCycle}
            weather={world.weather}
          />
        )
      ))}
    </group>
  );
};

/**
 * Group of islands of the same type for optimized rendering
 */
const IslandGroup = ({ type, islands, dayNightCycle, weather }) => {
  // Try to load shared model for this island type
  const { scene: sharedModel } = useGLTF(`/models/islands/${type}.glb`, true);
  
  // Check if we have a physical model to use
  const hasModel = sharedModel && sharedModel.children.length > 0;
  
  // For instanced rendering of basic elements (trees, rocks, etc.)
  const vegetationRef = useRef();
  const detailsRef = useRef();
  
  // Animate certain island elements
  useFrame(({ clock }) => {
    // Only animate for certain island types
    if (type === 'volcanic' || type === 'crystal') {
      const time = clock.getElapsedTime();
      
      // Animate vegetation/details if refs exist
      if (vegetationRef.current) {
        vegetationRef.current.children.forEach((instance, i) => {
          // Subtle wind movement
          instance.rotation.x = Math.sin(time * 0.5 + i) * 0.03;
          instance.rotation.z = Math.cos(time * 0.3 + i * 2.1) * 0.03;
        });
      }
      
      if (detailsRef.current && type === 'crystal') {
        detailsRef.current.children.forEach((instance, i) => {
          // Crystal pulsing effect
          const scale = 1 + Math.sin(time * 0.8 + i * 1.7) * 0.05;
          instance.scale.set(scale, scale, scale);
        });
      }
    }
  });
  
  // Return appropriate island renderer based on type
  if (hasModel) {
    // Use glTF model with instancing for performance
    return (
      <ModelIslands 
        model={sharedModel}
        islands={islands}
        type={type}
        dayNightCycle={dayNightCycle}
        weather={weather}
      />
    );
  } else {
    // Use procedural islands
    return (
      <ProceduralIslands
        islands={islands}
        type={type}
        dayNightCycle={dayNightCycle}
        weather={weather}
        vegetationRef={vegetationRef}
        detailsRef={detailsRef}
      />
    );
  }
};

/**
 * Renders islands using glTF models with instancing
 */
const ModelIslands = ({ model, islands, type, dayNightCycle, weather }) => {
  // Clone the model once
  const modelClone = useMemo(() => model.clone(), [model]);
  
  return (
    <>
      {islands.map(island => (
        <Island
          key={island.id}
          island={island}
          type={type}
          dayNightCycle={dayNightCycle}
          weather={weather}
        >
          <primitive object={modelClone.clone()} scale={island.size / 10} />
        </Island>
      ))}
    </>
  );
};

/**
 * Renders islands using procedural geometry with instancing
 */
const ProceduralIslands = ({ islands, type, dayNightCycle, weather, vegetationRef, detailsRef }) => {
  // Get island base colors based on type and time of day
  const { baseColor, topColor, detailColor } = useMemo(() => {
    // Base palette
    const colors = {
      standard: {
        base: '#8B4513',
        top: '#228B22',
        detail: '#3a5a40'
      },
      volcanic: {
        base: '#444444',
        top: '#222222',
        detail: '#ff4500'
      },
      crystal: {
        base: '#444466',
        top: '#555577',
        detail: '#5555ff'
      },
      ancient: {
        base: '#997755',
        top: '#aa9977',
        detail: '#ddccbb'
      }
    };
    
    // Get colors for this type
    const palette = colors[type] || colors.standard;
    
    // Adjust colors based on time of day
    if (dayNightCycle < 0.25 || dayNightCycle > 0.75) {
      // Night - darker colors
      return {
        baseColor: new THREE.Color(palette.base).multiplyScalar(0.3),
        topColor: new THREE.Color(palette.top).multiplyScalar(0.3),
        detailColor: new THREE.Color(palette.detail).multiplyScalar(0.7)
      };
    } else {
      // Day - normal colors
      return {
        baseColor: new THREE.Color(palette.base),
        topColor: new THREE.Color(palette.top),
        detailColor: new THREE.Color(palette.detail)
      };
    }
  }, [type, dayNightCycle]);
  
  // Create shared materials for instancing
  const baseMaterial = useMemo(() => (
    new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1
    })
  ), [baseColor]);
  
  const topMaterial = useMemo(() => (
    new THREE.MeshStandardMaterial({
      color: topColor,
      roughness: 0.7,
      metalness: 0.1
    })
  ), [topColor]);
  
  const detailMaterial = useMemo(() => (
    new THREE.MeshStandardMaterial({
      color: detailColor,
      roughness: 0.5,
      metalness: type === 'crystal' ? 0.7 : 0.2,
      emissive: type === 'crystal' || type === 'volcanic' ? detailColor : '#000000',
      emissiveIntensity: type === 'crystal' ? 0.5 : type === 'volcanic' ? 0.3 : 0
    })
  ), [detailColor, type]);
  
  // Generate detail elements based on island type
  const renderDetails = (island) => {
    switch (type) {
      case 'volcanic':
        return <VolcanicDetails island={island} material={detailMaterial} />;
      case 'crystal':
        return <CrystalDetails island={island} material={detailMaterial} />;
      case 'ancient':
        return <AncientDetails island={island} material={detailMaterial} />;
      case 'standard':
      default:
        return <VegetationDetails island={island} material={detailMaterial} />;
    }
  };
  
  return (
    <>
      {/* Render each island with its physics body */}
      {islands.map(island => (
        <Island
          key={island.id}
          island={island}
          type={type}
          dayNightCycle={dayNightCycle}
          weather={weather}
        >
          <IslandBase 
            island={island} 
            type={type} 
            baseMaterial={baseMaterial} 
            topMaterial={topMaterial} 
          />
          {renderDetails(island)}
        </Island>
      ))}
    </>
  );
};

/**
 * Individual island with physics and level of detail rendering
 */
const Island = ({ island, type, dayNightCycle, weather, children }) => {
  const { actions } = useGame();
  
  // Create physics body - shape depends on island type
  const [physicsRef] = useMemo(() => {
    // Get physics properties
    const physics = createIslandPhysics(island);
    
    // Choose appropriate shape based on island type
    if (type === 'volcanic') {
      return useCone(() => ({
        ...physics,
        onCollide: (e) => handleCollision(e, island)
      }));
    } else {
      return useCylinder(() => ({
        ...physics,
        onCollide: (e) => handleCollision(e, island)
      }));
    }
  }, [island, type]);
  
  // Handle collisions with this island
  const handleCollision = (event, island) => {
    const { body, contact } = event;
    
    // Skip non-damaging collisions or low-velocity impacts
    if (!body.userData || Math.abs(contact.impactVelocity) < 3) return;
    
    // Different effects based on what hit the island
    if (body.userData.type === 'aircraft') {
      // Aircraft hit island
      if (contact.impactVelocity > 5) {
        // Create dust/debris effect at impact point
        actions.addEffect('debris', contact.contactPoint, {
          color: type === 'volcanic' ? '#444444' : 
                 type === 'crystal' ? '#555577' : 
                 type === 'ancient' ? '#aa9977' : '#8B4513',
          size: Math.min(Math.abs(contact.impactVelocity) / 10, 2),
          count: Math.floor(Math.abs(contact.impactVelocity) / 3)
        });
      }
    } else if (body.userData.type === 'projectile') {
      // Projectile hit island - smaller effect
      actions.addEffect('impact', contact.contactPoint, {
        size: 0.5
      });
    }
  };
  
  // Island lighting (dynamic based on type and time of day)
  const light = useMemo(() => {
    // Base light configuration
    const config = {
      volcanic: {
        color: '#ff4500',
        intensity: 2,
        distance: island.size * 10,
        position: [0, island.size * 0.8, 0]
      },
      crystal: {
        color: '#5555ff',
        intensity: 1.5,
        distance: island.size * 8,
        position: [0, island.size * 0.5, 0]
      },
      ancient: {
        color: '#fffbe3',
        intensity: 1,
        distance: island.size * 5,
        position: [0, island.size * 1.2, 0]
      },
      standard: {
        color: '#ffffff',
        intensity: 0.5,
        distance: island.size * 5,
        position: [0, island.size * 1, 0]
      }
    };
    
    // Get configuration for this type
    return config[type] || config.standard;
  }, [type, island.size]);
  
  // Day/night and weather adaptation
  const adaptedLight = useMemo(() => {
    // Start with base configuration
    const result = { ...light };
    
    // Adjust based on time of day
    if (dayNightCycle < 0.2 || dayNightCycle > 0.8) {
      // Night - brighter lights
      result.intensity *= 1.5;
    } else if (dayNightCycle > 0.4 && dayNightCycle < 0.6) {
      // Midday - dimmer lights
      result.intensity *= 0.5;
    }
    
    // Adjust based on weather
    if (weather === 'foggy') {
      result.distance *= 0.7; // Reduced light distance in fog
    } else if (weather === 'stormy') {
      result.intensity *= 1.2; // Brighter in storms
    }
    
    return result;
  }, [light, dayNightCycle, weather]);
  
  return (
    <Detailed distances={[0, 100, 250, 500]} name={`island-${island.id}`}>
      {/* High detail version with physics */}
      <group ref={physicsRef} position={island.position} name={`island-${island.id}-detailed`}>
        {children}
        
        {/* Island-specific light source */}
        {(type === 'volcanic' || type === 'crystal' || (type === 'ancient' && dayNightCycle < 0.2)) && (
          <pointLight 
            position={adaptedLight.position}
            color={adaptedLight.color}
            intensity={adaptedLight.intensity}
            distance={adaptedLight.distance}
            decay={2}
          />
        )}
        
        {/* Island name label for nearby islands */}
        <IslandLabel 
          name={island.name || `Island ${island.id}`} 
          size={island.size} 
          type={type}
        />
      </group>
      
      {/* Medium detail version (no physics) */}
      <group position={island.position} name={`island-${island.id}-medium`}>
        <mesh>
          {type === 'volcanic' ? (
            <coneGeometry args={[island.size, island.size * 2, 8]} />
          ) : (
            <cylinderGeometry args={[island.size, island.size * 1.3, island.size, 8]} />
          )}
          <meshStandardMaterial 
            color={type === 'volcanic' ? '#444444' : 
                   type === 'crystal' ? '#444466' : 
                   type === 'ancient' ? '#997755' : '#8B4513'} 
            roughness={0.9}
          />
        </mesh>
      </group>
      
      {/* Low detail version (far away) */}
      <mesh position={island.position} name={`island-${island.id}-low`}>
        <cylinderGeometry args={[island.size, island.size, island.size, 6]} />
        <meshBasicMaterial 
          color={type === 'volcanic' ? '#333333' : 
                 type === 'crystal' ? '#333355' : 
                 type === 'ancient' ? '#775533' : '#663311'} 
        />
      </mesh>
      
      {/* Lowest detail (very far) */}
      <mesh position={island.position} name={`island-${island.id}-lowest`}>
        <boxGeometry args={[island.size * 2, island.size, island.size * 2]} />
        <meshBasicMaterial 
          color={type === 'volcanic' ? '#222222' : 
                 type === 'crystal' ? '#222244' : 
                 type === 'ancient' ? '#664422' : '#552200'} 
        />
      </mesh>
    </Detailed>
  );
};

/**
 * Base geometry for procedural islands
 */
const IslandBase = ({ island, type, baseMaterial, topMaterial }) => {
  // Different geometry based on island type
  return (
    <group>
      {/* Base part */}
      <mesh receiveShadow>
        {type === 'volcanic' ? (
          <coneGeometry args={[island.size, island.size * 2, 16]} />
        ) : (
          <cylinderGeometry args={[island.size, island.size * 1.3, island.size * 0.8, 16]} />
        )}
        <primitive object={baseMaterial} />
      </mesh>
      
      {/* Top part */}
      {type !== 'volcanic' && (
        <mesh position={[0, island.size * 0.5, 0]} receiveShadow>
          {type === 'crystal' ? (
            <dodecahedronGeometry args={[island.size * 1.3, 0]} />
          ) : (
            <cylinderGeometry args={[island.size * 1.3, island.size, island.size * 0.3, 16]} />
          )}
          <primitive object={topMaterial} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Standard island vegetation (trees, rocks, etc.)
 */
const VegetationDetails = ({ island, material }) => {
  // Generate randomized tree positions based on island size
  const treePositions = useMemo(() => {
    const positions = [];
    const count = Math.max(5, Math.floor(island.size * 1.5));
    
    for (let i = 0; i < count; i++) {
      // Random position on island top
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * island.size * 0.8;
      positions.push({
        position: [
          Math.cos(angle) * distance,
          island.size * 0.8,
          Math.sin(angle) * distance
        ],
        scale: 0.3 + Math.random() * 0.4,
        rotation: [0, Math.random() * Math.PI * 2, 0]
      });
    }
    
    return positions;
  }, [island.size]);
  
  // Generate rock positions
  const rockPositions = useMemo(() => {
    const positions = [];
    const count = Math.max(3, Math.floor(island.size));
    
    for (let i = 0; i < count; i++) {
      // Random position on island top
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * island.size * 0.9;
      positions.push({
        position: [
          Math.cos(angle) * distance,
          island.size * 0.7,
          Math.sin(angle) * distance
        ],
        scale: 0.2 + Math.random() * 0.3,
        rotation: [
          Math.random() * 0.5,
          Math.random() * Math.PI * 2,
          Math.random() * 0.5
        ]
      });
    }
    
    return positions;
  }, [island.size]);
  
  return (
    <group>
      {/* Trees */}
      <Instances limit={treePositions.length}>
        {/* Tree trunk */}
        <cylinderGeometry args={[0.1, 0.2, 0.8, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
        
        {treePositions.map((tree, i) => (
          <group key={i} position={tree.position} rotation={tree.rotation} scale={tree.scale}>
            <Instance />
            
            {/* Tree top foliage - instanced separately for material difference */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <coneGeometry args={[0.5, 1, 8]} />
              <primitive object={material} />
            </mesh>
          </group>
        ))}
      </Instances>
      
      {/* Rocks */}
      <Instances limit={rockPositions.length}>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#777777" roughness={0.9} />
        
        {rockPositions.map((rock, i) => (
          <Instance 
            key={i} 
            position={rock.position} 
            rotation={rock.rotation} 
            scale={rock.scale} 
          />
        ))}
      </Instances>
    </group>
  );
};

/**
 * Volcanic island details (lava, craters, etc.)
 */
const VolcanicDetails = ({ island, material }) => {
  // Ref for lava animation
  const lavaRef = useRef();
  
  // Animate lava
  useFrame(({ clock }) => {
    if (lavaRef.current) {
      // Pulsating lava intensity
      lavaRef.current.intensity = 2 + Math.sin(clock.getElapsedTime() * 0.5) * 0.5;
    }
  });
  
  // Generate lava stream positions
  const lavaStreams = useMemo(() => {
    const streams = [];
    const count = Math.floor(1 + Math.random() * 3);
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      streams.push({
        position: [
          Math.cos(angle) * island.size * 0.5,
          island.size * 0.3 + Math.random() * island.size * 0.5,
          Math.sin(angle) * island.size * 0.5
        ],
        rotation: [
          Math.random() * 0.3,
          angle,
          Math.PI / 2 + (Math.random() - 0.5) * 0.3
        ],
        scale: [
          0.1,
          0.1 + Math.random() * 0.3,
          0.05 + Math.random() * 0.1
        ]
      });
    }
    
    return streams;
  }, [island.size]);
  
  return (
    <group>
      {/* Volcano crater */}
      <mesh position={[0, island.size, 0]}>
        <cylinderGeometry args={[island.size * 0.3, island.size * 0.4, island.size * 0.2, 16]} />
        <primitive object={material} />
      </mesh>
      
      {/* Lava glow */}
      <pointLight 
        ref={lavaRef}
        position={[0, island.size * 1.1, 0]} 
        color="#ff4500"
        intensity={2}
        distance={island.size * 10}
      />
      
      {/* Lava streams */}
      {lavaStreams.map((stream, i) => (
        <mesh key={i} position={stream.position} rotation={stream.rotation} scale={stream.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={material} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Crystal island details (crystals formations)
 */
const CrystalDetails = ({ island, material }) => {
  // Generate crystal positions
  const crystalPositions = useMemo(() => {
    const positions = [];
    const count = Math.max(5, Math.floor(island.size * 2));
    
    for (let i = 0; i < count; i++) {
      // Random position on island top
      const angle = Math.random() * Math.PI * 2;
      const distance = (0.3 + Math.random() * 0.7) * island.size;
      
      positions.push({
        position: [
          Math.cos(angle) * distance,
          island.size * 0.7 + Math.random() * island.size * 0.3,
          Math.sin(angle) * distance
        ],
        scale: [
          0.2 + Math.random() * 0.3,
          0.5 + Math.random() * 1.0,
          0.2 + Math.random() * 0.3
        ],
        rotation: [0, Math.random() * Math.PI * 2, 0]
      });
    }
    
    return positions;
  }, [island.size]);
  
  return (
    <Instances limit={crystalPositions.length} ref={detailsRef}>
      <coneGeometry args={[0.5, 1.5, 5]} />
      <primitive object={material} />
      
      {crystalPositions.map((crystal, i) => (
        <Instance 
          key={i} 
          position={crystal.position} 
          rotation={crystal.rotation} 
          scale={crystal.scale} 
        />
      ))}
    </Instances>
  );
};

/**
 * Ancient island details (ruins, pillars, temple)
 */
const AncientDetails = ({ island, material }) => {
  // Generate pillar positions
  const pillarPositions = useMemo(() => {
    const positions = [];
    const count = Math.floor(4 + Math.random() * 4);
    
    // Arrange in circle around center
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = island.size * 0.6;
      positions.push({
        position: [
          Math.cos(angle) * distance,
          island.size * 0.7,
          Math.sin(angle) * distance
        ],
        height: 0.5 + Math.random() * 1.0,
        broken: Math.random() > 0.7 // Some pillars are broken
      });
    }
    
    return positions;
  }, [island.size]);
  
  return (
    <group>
      {/* Temple base */}
      <mesh position={[0, island.size * 0.7, 0]} receiveShadow>
        <boxGeometry args={[island.size * 0.8, island.size * 0.2, island.size * 0.8]} />
        <primitive object={material} />
      </mesh>
      
      {/* Temple roof */}
      <mesh position={[0, island.size * 1.2, 0]} receiveShadow>
        <boxGeometry args={[island.size * 0.5, island.size * 0.1, island.size * 0.5]} />
        <primitive object={material} />
      </mesh>
      
      {/* Temple pillars */}
      {pillarPositions.map((pillar, i) => (
        <mesh key={i} position={pillar.position} receiveShadow>
          <cylinderGeometry 
            args={[
              island.size * 0.05, 
              island.size * 0.05, 
              island.size * pillar.height, 
              8
            ]} 
          />
          <primitive object={material} />
          
          {/* Broken top for some pillars */}
          {pillar.broken && (
            <mesh 
              position={[
                (Math.random() - 0.5) * island.size * 0.2,
                -island.size * 0.3,
                (Math.random() - 0.5) * island.size * 0.2
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              ]}
            >
              <cylinderGeometry 
                args={[
                  island.size * 0.05, 
                  island.size * 0.04, 
                  island.size * 0.2, 
                  8
                ]} 
              />
              <primitive object={material} />
            </mesh>
          )}
        </mesh>
      ))}
      
      {/* Ancient torches (only lit at night) */}
      {dayNightCycle < 0.2 || dayNightCycle > 0.8 ? (
        pillarPositions.filter((_, i) => i % 2 === 0).map((pillar, i) => (
          <pointLight
            key={i}
            position={[
              pillar.position[0],
              pillar.position[1] + island.size * 0.6,
              pillar.position[2]
            ]}
            color="#ff9933"
            intensity={0.8}
            distance={island.size * 3}
            decay={2}
          />
        ))
      ) : null}
    </group>
  );
};

/**
 * Island name label that faces the camera
 */
const IslandLabel = ({ name, size, type }) => {
  // Different styling based on island type
  const labelStyle = useMemo(() => {
    const styles = {
      volcanic: {
        color: '#ff9933',
        bgColor: '#550000',
        fontSize: 0.3
      },
      crystal: {
        color: '#aaccff',
        bgColor: '#223366',
        fontSize: 0.3
      },
      ancient: {
        color: '#ffddaa',
        bgColor: '#4b3621',
        fontSize: 0.3
      },
      standard: {
        color: '#ffffff',
        bgColor: '#336633',
        fontSize: 0.3
      }
    };
    
    return styles[type] || styles.standard;
  }, [type]);
  
  return (
    <Billboard
      position={[0, size * 1.5, 0]}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <Text
        color={labelStyle.color}
        fontSize={labelStyle.fontSize * size}
        maxWidth={size * 5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05 * size}
        outlineColor="black"
      >
        {name}
      </Text>
    </Billboard>
  );
};

export default IslandSystem;