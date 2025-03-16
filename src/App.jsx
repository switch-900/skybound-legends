// src/App.jsx - Main component
import React, { Suspense, lazy, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';
import { GameProvider } from './contexts/GameContext';
import LoadingScreen from './components/ui/LoadingScreen';
import ModelExporter from './utils/ModelExporter';
import './App.css';

// Lazy load the main game component for better initial loading performance
const Game = lazy(() => import('./components/Game'));

export default function App() {
  const [mode, setMode] = useState('export'); // 'game' or 'export'

  return (
    <div className="w-screen h-screen bg-black">
      <GameProvider>
        <Suspense fallback={<LoadingScreen />}>
          {mode === 'export' ? (
            <ModelExporter />
          ) : (
            <Canvas shadows gl={{ antialias: true }}>
              <Game />
              {import.meta.env.DEV && <Perf position="top-left" />}
            </Canvas>
          )}
        </Suspense>
      </GameProvider>
      <div className="mode-toggle">
        <button onClick={() => setMode(mode === 'export' ? 'game' : 'export')}>
          Switch to {mode === 'export' ? 'Game' : 'Model Exporter'}
        </button>
      </div>
    </div>
  );
}