// src/components/Game.jsx
import React, { Suspense, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stats, Environment, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, SSAO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { GridFloor } from 'GridFloor';

import { useGame } from '../contexts/GameContext';
import PhysicsWorld from './physics/PhysicsWorld';
import PlayerAircraft from './aircraft/PlayerAircraft';
import IslandSystem from './world/IslandSystem';
import CloudSystem from './world/CloudSystem';
import WeatherSystem from './world/WeatherSystem';
import CheckpointSystem from './world/CheckpointSystem';
import ProjectileSystem from './world/ProjectileSystem';
import ExplosionSystem from './world/ExplosionSystem';
import PickupSystem from './world/PickupSystem';
import EnemyManager from './world/EnemyManager';
import CollisionSystem from './physics/CollisionSystem';
import AudioSystem from './audio/AudioSystem';
import HUD from './ui/HUD';
import TutorialUI from './ui/TutorialUI';
import NotificationsUI from './ui/NotificationsUI';
import LoadingScreen from './ui/LoadingScreen';

// Main game component that integrates all systems
const Game = () => {
  const { state, actions } = useGame();
  const { 
    player, aircraft, world, ui, settings 
  } = state;
  
  // Initialize game when component mounts
  useEffect(() => {
    // Start background music
    actions.playMusic('ambient', { volume: settings.musicVolume });
    
    // Set loading complete after all assets are loaded
    const loadingTimeout = setTimeout(() => {
      actions.setUIState({ loadingComplete: true });
    }, 2000);
    
    // Load saved game if available
    actions.loadGame();
    
    return () => {
      clearTimeout(loadingTimeout);
      actions.stopMusic('ambient');
    };
  }, []);
  
  // Show loading screen until assets are loaded
  if (!ui.loadingComplete) {
    return <LoadingScreen progress={ui.loadingProgress} />;
  }
  
  // Determine graphics quality settings
  const qualitySettings = {
    low: {
      shadows: false,
      bloom: false,
      ssao: false,
      depthOfField: false,
      particles: 0.5,
      clouds: 5,
      viewDistance: 300
    },
    medium: {
      shadows: true,
      bloom: true,
      ssao: false,
      depthOfField: true,
      particles: 1,
      clouds: 10,
      viewDistance: 500
    },
    high: {
      shadows: true,
      bloom: true,
      ssao: true,
      depthOfField: true,
      particles: 2,
      clouds: 15,
      viewDistance: 1000
    }
  };
  
  // Get current quality settings
  const quality = qualitySettings[settings.graphicsQuality] || qualitySettings.medium;
  
  return (
    <>
      {/* Physics world with all interactable objects */}
      <PhysicsWorld debug={ui.debug}>
        {/* Player aircraft with controls */}
        <PlayerAircraft />
        
        {/* World environment with islands */}
        <IslandSystem />
        
        {/* Cloud system */}
        <CloudSystem 
          count={quality.clouds} 
          weather={world.weather}
          dayNightCycle={world.dayNightCycle}
        />
        
        {/* Mission checkpoint system */}
        <CheckpointSystem checkpoints={world.checkpoints} />
        
        {/* Enemy aircraft manager */}
        <EnemyManager enemies={world.enemies} />
        
        {/* Projectile system for weapons */}
        <ProjectileSystem projectiles={world.projectiles} />
        
        {/* Pickup items */}
        <PickupSystem pickups={world.pickups} />
        
        {/* Collision system for precise hit detection */}
        <CollisionSystem />
      </PhysicsWorld>
      
      {/* Weather and environment effects */}
      <WeatherSystem 
        weather={world.weather} 
        dayNightCycle={world.dayNightCycle}
        quality={settings.graphicsQuality}
      />
      
      {/* Explosion visual effects */}
      <ExplosionSystem 
        explosions={world.explosions} 
        particleMultiplier={quality.particles}
      />
      
      {/* Environment lighting and skydome */}
      <Environment 
        preset={world.dayNightCycle < 0.25 || world.dayNightCycle > 0.75 ? "night" : "day"}
        background={true}
      />
      
      {/* Development grid (only in debug mode) */}
      {ui.debug && <GridFloor />}
      
      {/* Post-processing effects (based on quality settings) */}
      {(quality.bloom || quality.depthOfField || quality.ssao) && (
        <EffectComposer>
          {quality.bloom && (
            <Bloom 
              intensity={0.5} 
              luminanceThreshold={0.7}
              luminanceSmoothing={0.9}
            />
          )}
          
          {quality.depthOfField && (
            <DepthOfField
              focusDistance={0}
              focalLength={0.02}
              bokehScale={2}
              height={quality.bloom ? 700 : 480}
            />
          )}
          
          {quality.ssao && (
            <SSAO 
              blendFunction={BlendFunction.MULTIPLY}
              samples={16}
              radius={5}
              intensity={10}
            />
          )}
        </EffectComposer>
      )}
      
      {/* Audio system for sound effects and music */}
      <AudioSystem />
      
      {/* HUD and UI components */}
      <Suspense fallback={null}>
        <HUD />
        <TutorialUI />
        <NotificationsUI />
      </Suspense>
      
      {/* Asset preloading */}
      <Preload all />
      
      {/* Performance stats (only in debug mode) */}
      {ui.debug && <Stats />}
    </>
  );
};

// Main game interface that includes both 3D world and 2D overlay UI
const GameInterface = () => {
  const { state } = useGame();
  
  return (
    <>
      {/* 3D Game world */}
      <Game />
      
      {/* 2D UI overlays rendered outside the Canvas */}
      <GameOverlays />
    </>
  );
};

// 2D UI overlays outside the 3D world
const GameOverlays = () => {
  const { state, actions } = useGame();
  const { ui } = state;
  
  // Dynamically import UI components based on current screen
  const GameUI = React.lazy(() => import('./ui/GameUI'));
  const HangarUI = React.lazy(() => import('./ui/HangarUI'));
  const MissionsUI = React.lazy(() => import('./ui/MissionsUI'));
  const MapUI = React.lazy(() => import('./ui/MapUI'));
  const InventoryUI = React.lazy(() => import('./ui/InventoryUI'));
  const ShopUI = React.lazy(() => import('./ui/ShopUI'));
  const PauseMenu = React.lazy(() => import('./ui/PauseMenu'));
  const SettingsMenu = React.lazy(() => import('./ui/SettingsMenu'));
  
  return (
    <Suspense fallback={<div className="loading-overlay">Loading UI...</div>}>
      {/* Always visible game UI */}
      <GameUI />
      
      {/* Screen-specific UIs */}
      {ui.currentScreen === 'hangar' && <HangarUI />}
      {ui.currentScreen === 'missions' && <MissionsUI />}
      {ui.currentScreen === 'map' && <MapUI />}
      {ui.currentScreen === 'inventory' && <InventoryUI />}
      {ui.currentScreen === 'shop' && <ShopUI />}
      
      {/* Pause menu (overlay on top of everything) */}
      {ui.paused && <PauseMenu />}
      
      {/* Settings menu (when opened) */}
      {ui.showSettings && <SettingsMenu />}
    </Suspense>
  );
};

export default GameInterface;