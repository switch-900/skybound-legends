import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { exportToGLB, prepareForExport } from './modelExporter';

// Import all models
import StandardAircraft from '../models/aircraft/StandardAircraft';
import FighterAircraft from '../models/aircraft/FighterAircraft';
import BomberAircraft from '../models/aircraft/BomberAircraft';
import ScoutAircraft from '../models/aircraft/ScoutAircraft';

import StandardIsland from '../models/islands/StandardIsland';
import VolcanicIsland from '../models/islands/VolcanicIsland';
import CrystalIsland from '../models/islands/CrystalIsland';
import AncientIsland from '../models/islands/AncientIsland';

import Bullet from '../models/projectiles/Bullet';
import Missile from '../models/projectiles/Missile';

// Model configuration
const MODELS = {
  aircraft: [
    { component: StandardAircraft, name: 'standard', props: { color: '#3498db' } },
    { component: FighterAircraft, name: 'fighter', props: { color: '#e74c3c' } },
    { component: BomberAircraft, name: 'bomber', props: { color: '#7f8c8d' } },
    { component: ScoutAircraft, name: 'scout', props: { color: '#2ecc71' } }
  ],
  islands: [
    { component: StandardIsland, name: 'standard', props: { color: '#8B4513' } },
    { component: VolcanicIsland, name: 'volcanic', props: { color: '#444444' } },
    { component: CrystalIsland, name: 'crystal', props: { color: '#444466' } },
    { component: AncientIsland, name: 'ancient', props: { color: '#997755' } }
  ],
  projectiles: [
    { component: Bullet, name: 'bullet', props: { color: '#ffff00' } },
    { component: Missile, name: 'missile', props: { color: '#ff4500' } }
  ]
};

// Main ModelExporter component
const ModelExporter = () => {
  const [currentCategory, setCurrentCategory] = useState('aircraft');
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  
  const modelRef = useRef();
  
  const currentModels = MODELS[currentCategory] || [];
  const currentModel = currentModels[currentModelIndex] || currentModels[0];
  
  // Export current model
  const exportCurrentModel = () => {
    if (!modelRef.current) return;
    
    try {
      setExportStatus('Exporting...');
      
      // Get the scene object from ref
      const modelObject = prepareForExport(modelRef);
      
      // Generate directory path based on category
      const directory = currentCategory;
      const filename = currentModel.name;
      
      // Export to GLB
      exportToGLB(modelObject, filename);
      
      setExportStatus(`Exported ${filename}.glb successfully!`);
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setExportStatus('');
      }, 3000);
    } catch (err) {
      console.error('Error exporting model:', err);
      setExportStatus(`Export failed: ${err.message}`);
    }
  };
  
  // Navigate between models
  const prevModel = () => {
    setCurrentModelIndex((prev) => 
      prev > 0 ? prev - 1 : currentModels.length - 1
    );
  };
  
  const nextModel = () => {
    setCurrentModelIndex((prev) => 
      prev < currentModels.length - 1 ? prev + 1 : 0
    );
  };
  
  // Change category
  const changeCategory = (category) => {
    setCurrentCategory(category);
    setCurrentModelIndex(0);
  };
  
  // Render the currently selected model component
  const CurrentModelComponent = currentModel?.component || (() => null);
  
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', background: '#333', color: 'white' }}>
        <h1>3D Model Exporter</h1>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          {Object.keys(MODELS).map(category => (
            <button 
              key={category}
              onClick={() => changeCategory(category)}
              style={{
                padding: '8px 16px',
                background: category === currentCategory ? '#4CAF50' : '#555',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={prevModel}
            style={{ padding: '8px 16px', background: '#555', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Previous
          </button>
          
          <div style={{ margin: '0 10px' }}>
            <strong>{currentModel?.name}</strong> 
            ({currentModelIndex + 1}/{currentModels.length})
          </div>
          
          <button 
            onClick={nextModel}
            style={{ padding: '8px 16px', background: '#555', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Next
          </button>
          
          <button 
            onClick={exportCurrentModel}
            style={{ marginLeft: 'auto', padding: '8px 16px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Export as GLB
          </button>
          
          {exportStatus && (
            <div style={{ marginLeft: '10px', color: exportStatus.includes('failed') ? '#FF5555' : '#4CAF50' }}>
              {exportStatus}
            </div>
          )}
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [0, 2, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
          
          <group ref={modelRef}>
            <CurrentModelComponent {...currentModel.props} />
          </group>
          
          <ContactShadows 
            position={[0, -1, 0]} 
            opacity={0.4} 
            width={10} 
            height={10} 
            blur={1} 
            far={10} 
          />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
};

export default ModelExporter;
