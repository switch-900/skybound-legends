// src/contexts/GameContext.jsx
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { store } from 'statery';
import { useThree } from '@react-three/fiber';
import { MISSION_DEPENDENCIES } from '../data/missions';
import { ISLANDS_DATA } from '../data/world';
import { AIRCRAFT_MODELS, COLORS, TRAILS } from '../data/aircraft';
import { saveGameState, loadGameState } from '../utils/storage';

// Initial game state
const initialState = {
  // Player state
  player: {
    position: [0, 30, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0.2],
    throttle: 0.5,
    fuel: 100,
    health: 100,
    credits: 1000,
    experience: 0,
    level: 1,
    rank: 'Rookie Pilot',
    inventory: [],
    questsCompleted: 0,
    achievements: [],
    outOfBounds: false,
    lastSaveTime: Date.now(),
  },
  
  // Aircraft customization
  aircraft: {
    model: 'standard',
    color: '#3498db',
    engineLevel: 1,
    armorLevel: 1,
    fuelCapacity: 100,
    weapons: [
      {
        id: 'machinegun',
        type: 'Machinegun',
        level: 1,
        damage: 10,
        ammo: 500,
        maxAmmo: 500,
        cooldown: 100, // milliseconds
        lastFired: 0,
        projectileSpeed: 5,
        range: 200,
      }
    ],
    upgrades: [],
    skins: ['standard'],
    activeTrail: 'blue',
  },
  
  // World state
  world: {
    time: 0,
    dayNightCycle: 0.5,
    weather: 'clear',
    activeZone: 'startingIslands',
    discoveredZones: ['startingIslands'],
    islands: ISLANDS_DATA,
    enemies: [],
    npcs: [],
    projectiles: [],
    explosions: [],
    missions: [],
    events: [],
    checkpoints: [],
  },
  
  // Input state - centralizing all input handling
  input: {
    keyboard: {
      w: false,
      s: false,
      a: false,
      d: false,
      q: false,
      e: false,
      shift: false,
      control: false,
      space: false,
      f: false, // firing weapon
    },
    gamepad: null,
    touchControls: {
      active: false,
      throttle: 0.5,
      yaw: 0,
      pitch: 0,
      roll: 0,
      firing: false,
    },
  },
  
  // UI state
  ui: {
    currentScreen: 'game', // game, hangar, shop, map, missions, inventory
    showHUD: true,
    showMap: false,
    showInventory: false,
    showMissions: false,
    showMissionComplete: false,
    currentMissionComplete: null,
    paused: false,
    loadingProgress: 0,
    loadingComplete: false,
    notifications: [],
    dialogues: [],
    tutorial: {
      active: true,
      step: 0,
      messages: [
        "Welcome to Skybound Legends! Let's learn the basics of flight.",
        "Use W/S to control pitch (nose up/down), A/D for yaw (left/right turning).",
        "Q/E keys control roll (banking). Shift/Ctrl adjust your throttle.",
        "Complete flight training by flying through the glowing rings.",
        "Press SPACE to fire your weapons when you unlock combat missions.",
        "Good luck, pilot! The skies await."
      ]
    },
    debug: import.meta.env.DEV,
  },
  
  // Physics/collision state
  physics: {
    colliders: [],
    hitboxes: {},
  },
  
  // Multiplayer state (for future implementation)
  multiplayer: {
    connected: false,
    players: [],
    playerId: null,
    roomId: null,
  },

  // Game settings/configuration
  settings: {
    soundVolume: 0.7,
    musicVolume: 0.5,
    graphicsQuality: 'medium',
    controlScheme: 'keyboard',
    showFPS: false,
    autosaveInterval: 5 * 60 * 1000, // 5 minutes
  }
};

// Create a Statery store with initial state
export const gameStore = store(initialState);

// Create context for game actions
const GameActionContext = createContext(null);

// Game actions - more efficiently organized
const gameActions = {
  updatePlayerPosition: (position, rotation, velocity) => {
    gameStore.set(state => ({
      player: {
        ...state.player,
        position,
        rotation,
        velocity
      }
    }));
  },

  updatePlayerStats: (updates) => {
    gameStore.set(state => ({
      player: {
        ...state.player,
        ...updates
      }
    }));
  },

  updateAircraft: (updates) => {
    gameStore.set(state => ({
      aircraft: {
        ...state.aircraft,
        ...updates
      }
    }));
  },

  addExperience: (amount) => {
    gameStore.set(state => {
      const newExp = state.player.experience + amount;
      let newLevel = state.player.level;
      let newRank = state.player.rank;
      
      // Level thresholds (could be moved to a data file)
      const levels = [
        { level: 1, expRequired: 0, rank: 'Rookie Pilot' },
        { level: 2, expRequired: 200, rank: 'Junior Aviator' },
        { level: 3, expRequired: 500, rank: 'Sky Scout' },
        { level: 4, expRequired: 1000, rank: 'Cloud Chaser' },
        { level: 5, expRequired: 2000, rank: 'Storm Rider' },
        { level: 6, expRequired: 3500, rank: 'Wind Commander' },
        { level: 7, expRequired: 5500, rank: 'Ace Pilot' },
        { level: 8, expRequired: 8000, rank: 'Sky Captain' },
        { level: 9, expRequired: 12000, rank: 'Flight Master' },
        { level: 10, expRequired: 18000, rank: 'Skybound Legend' },
      ];
      
      // Check for level up
      for (const levelData of levels) {
        if (newExp >= levelData.expRequired && levelData.level > newLevel) {
          newLevel = levelData.level;
          newRank = levelData.rank;
        }
      }
      
      // Add notification if leveled up
      if (newLevel > state.player.level) {
        gameActions.addNotification(`Level Up! You are now level ${newLevel} - ${newRank}`);
      }
      
      return {
        player: {
          ...state.player,
          experience: newExp,
          level: newLevel,
          rank: newRank
        }
      };
    });
  },

  addCredits: (amount) => {
    gameStore.set(state => ({
      player: {
        ...state.player,
        credits: state.player.credits + amount
      }
    }));
    
    if (amount > 0) {
      gameActions.addNotification(`Earned ${amount} credits`);
    } else {
      gameActions.addNotification(`Spent ${Math.abs(amount)} credits`);
    }
  },

  addToInventory: (itemId, quantity = 1) => {
    gameStore.set(state => {
      const updatedInventory = [...state.player.inventory];
      const existingItemIndex = updatedInventory.findIndex(item => item.id === itemId);
      
      if (existingItemIndex >= 0) {
        updatedInventory[existingItemIndex].quantity += quantity;
      } else {
        // Would need to import items database
        const itemsDatabase = {}; // Placeholder - would be imported
        updatedInventory.push({
          id: itemId,
          ...itemsDatabase[itemId],
          quantity
        });
      }
      
      gameActions.addNotification(`Added ${quantity} ${itemId} to inventory`);
      
      return {
        player: {
          ...state.player,
          inventory: updatedInventory
        }
      };
    });
  },

  updateCheckpoint: (checkpointId) => {
    gameStore.set(state => {
      const updatedCheckpoints = state.world.checkpoints.map(checkpoint => 
        checkpoint.id === checkpointId 
          ? { ...checkpoint, triggered: true } 
          : checkpoint
      );
      
      // Check if this checkpoint is part of an active mission
      const updatedMissions = state.world.missions.map(mission => {
        if (mission.status === 'active') {
          const updatedObjectives = mission.objectives.map(objective => {
            if (objective.id === `checkpoint${checkpointId.split('_')[1]}`) {
              gameActions.addNotification(`Objective completed: ${objective.description}`);
              gameActions.addExperience(25);
              return { ...objective, completed: true };
            }
            return objective;
          });
          
          // Check if all objectives are complete
          const allComplete = updatedObjectives.every(obj => obj.completed);
          if (allComplete && !mission.objectives.every(obj => obj.completed)) {
            gameActions.completeMission(mission.id);
          }
          
          return { ...mission, objectives: updatedObjectives };
        }
        return mission;
      });
      
      return {
        world: {
          ...state.world,
          checkpoints: updatedCheckpoints,
          missions: updatedMissions
        }
      };
    });
  },

  completeMission: (missionId) => {
    gameStore.set(state => {
      const mission = state.world.missions.find(m => m.id === missionId);
      if (!mission || mission.status !== 'active') return state;
      
      // Award mission rewards
      gameActions.addCredits(mission.rewards.credits);
      gameActions.addExperience(mission.rewards.experience);
      
      if (mission.rewards.items) {
        mission.rewards.items.forEach(itemId => {
          gameActions.addToInventory(itemId, 1);
        });
      }
      
      // Unlock dependent missions using the dependency map
      const updatedMissions = state.world.missions.map(m => {
        if (m.id === missionId) {
          return { ...m, status: 'completed' };
        } else if (m.status === 'locked') {
          // Check if this mission should be unlocked
          const dependencies = MISSION_DEPENDENCIES[m.id] || [];
          const dependenciesCompleted = dependencies.every(depId => {
            const depMission = state.world.missions.find(dm => dm.id === depId);
            return depMission && depMission.status === 'completed';
          });
          
          if (dependenciesCompleted) {
            gameActions.addNotification(`New mission available: ${m.title}`);
            return { ...m, status: 'active' };
          }
        }
        return m;
      });
      
      gameActions.addNotification(`Mission Completed: ${mission.title}`);
      
      return {
        world: {
          ...state.world,
          missions: updatedMissions
        },
        player: {
          ...state.player,
          questsCompleted: state.player.questsCompleted + 1
        },
        ui: {
          ...state.ui,
          showMissionComplete: true,
          currentMissionComplete: missionId
        }
      };
    });
  },

  addNotification: (message, duration = 3000) => {
    const id = Date.now();
    gameStore.set(state => ({
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, { id, message, duration }]
      }
    }));
    
    // Auto-remove notification after duration
    setTimeout(() => {
      gameStore.set(state => ({
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== id)
        }
      }));
    }, duration);
  },

  changeScreen: (screen) => {
    gameStore.set(state => ({
      ui: {
        ...state.ui,
        currentScreen: screen,
        showMap: screen === 'map',
        showInventory: screen === 'inventory',
        showMissions: screen === 'missions'
      }
    }));
  },

  advanceTutorial: () => {
    gameStore.set(state => {
      if (state.ui.tutorial.step >= state.ui.tutorial.messages.length - 1) {
        return {
          ui: {
            ...state.ui,
            tutorial: {
              ...state.ui.tutorial,
              active: false
            }
          }
        };
      }
      
      return {
        ui: {
          ...state.ui,
          tutorial: {
            ...state.ui.tutorial,
            step: state.ui.tutorial.step + 1
          }
        }
      };
    });
  },

  updateWorld: (deltaTime) => {
    gameStore.set(state => {
      // Update day/night cycle (0-1)
      const newDayNight = (state.world.dayNightCycle + deltaTime * 0.0001) % 1;
      
      // Occasionally change weather with more realistic probabilities
      let newWeather = state.world.weather;
      const hourOfDay = newDayNight * 24;
      
      // Weather changes more likely at certain times of day
      const isAfternoon = hourOfDay > 12 && hourOfDay < 18;
      const weatherChangeChance = isAfternoon ? 0.0005 : 0.0001;
      
      if (Math.random() < weatherChangeChance) {
        const weatherTypes = ['clear', 'cloudy', 'stormy', 'foggy'];
        const currentIndex = weatherTypes.indexOf(state.world.weather);
        
        // More realistic weather progression
        // Clear -> cloudy -> stormy -> clear
        // or clear -> foggy -> clear
        let newIndex;
        
        if (currentIndex === 0) { // clear
          newIndex = Math.random() < 0.7 ? 1 : 3; // 70% cloudy, 30% foggy
        } else if (currentIndex === 1) { // cloudy
          newIndex = Math.random() < 0.6 ? 2 : 0; // 60% stormy, 40% clear
        } else if (currentIndex === 2) { // stormy
          newIndex = 0; // Always back to clear
        } else { // foggy
          newIndex = 0; // Always back to clear
        }
        
        newWeather = weatherTypes[newIndex];
        gameActions.addNotification(`Weather changing to ${newWeather}`);
      }
      
      // Update NPC and enemy positions using basic AI
      const updatedEnemies = state.world.enemies.map(enemy => {
        // Basic AI logic would go here
        return enemy;
      });
      
      // Handle projectiles movement and lifetime
      const updatedProjectiles = state.world.projectiles
        .filter(proj => proj.lifetime > 0)
        .map(proj => {
          // Update position based on velocity and direction
          const newPos = [
            proj.position[0] + proj.velocity[0] * deltaTime,
            proj.position[1] + proj.velocity[1] * deltaTime,
            proj.position[2] + proj.velocity[2] * deltaTime
          ];
          
          return {
            ...proj,
            position: newPos,
            lifetime: proj.lifetime - deltaTime
          };
        });
      
      // Update explosions (reduce their lifetime)
      const updatedExplosions = state.world.explosions
        .filter(exp => exp.lifetime > 0)
        .map(exp => ({
          ...exp,
          lifetime: exp.lifetime - deltaTime,
          scale: exp.scale * (1 + deltaTime * 0.01) // Grow slightly
        }));
      
      // Auto-save check
      const now = Date.now();
      let updatedPlayer = { ...state.player };
      
      if (now - state.player.lastSaveTime > state.settings.autosaveInterval) {
        saveGameState({ 
          player: state.player, 
          aircraft: state.aircraft,
          settings: state.settings
        });
        updatedPlayer.lastSaveTime = now;
        gameActions.addNotification("Game progress autosaved", 2000);
      }
      
      return {
        world: {
          ...state.world,
          time: state.world.time + deltaTime,
          dayNightCycle: newDayNight,
          weather: newWeather,
          enemies: updatedEnemies,
          projectiles: updatedProjectiles,
          explosions: updatedExplosions
        },
        player: updatedPlayer
      };
    });
  },

  fireWeapon: (weaponId) => {
    gameStore.set(state => {
      const weapon = state.aircraft.weapons.find(w => w.id === weaponId);
      if (!weapon || weapon.ammo <= 0) return state;
      
      const now = Date.now();
      if (now - weapon.lastFired < weapon.cooldown) return state;
      
      // Update weapon state
      const updatedWeapons = state.aircraft.weapons.map(w => {
        if (w.id === weaponId) {
          return {
            ...w,
            ammo: w.ammo - 1,
            lastFired: now
          };
        }
        return w;
      });
      
      // Create projectile
      const { position, rotation } = state.player;
      
      // Calculate projectile direction based on aircraft rotation
      // (This is simplified - real implementation would use quaternions or matrices)
      const forwardVector = [
        Math.sin(rotation[1]) * Math.cos(rotation[0]),
        -Math.sin(rotation[0]),
        Math.cos(rotation[1]) * Math.cos(rotation[0])
      ];
      
      // Create projectile a bit ahead of the aircraft
      const projectilePos = [
        position[0] + forwardVector[0] * 2,
        position[1] + forwardVector[1] * 2,
        position[2] + forwardVector[2] * 2
      ];
      
      const projectile = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: projectilePos,
        rotation: [...rotation],
        velocity: [
          forwardVector[0] * weapon.projectileSpeed,
          forwardVector[1] * weapon.projectileSpeed,
          forwardVector[2] * weapon.projectileSpeed
        ],
        damage: weapon.damage,
        lifetime: weapon.range / weapon.projectileSpeed, // Lifetime based on range and speed
        owner: 'player',
        weaponType: weapon.type
      };
      
      return {
        aircraft: {
          ...state.aircraft,
          weapons: updatedWeapons
        },
        world: {
          ...state.world,
          projectiles: [...state.world.projectiles, projectile]
        }
      };
    });
  },

  addExplosion: (position, size = 1) => {
    const explosionId = `explosion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    gameStore.set(state => ({
      world: {
        ...state.world,
        explosions: [
          ...state.world.explosions,
          {
            id: explosionId,
            position,
            scale: size,
            lifetime: 1000, // milliseconds
            createdAt: Date.now()
          }
        ]
      }
    }));
  },

  updateInput: (inputType, key, value) => {
    gameStore.set(state => ({
      input: {
        ...state.input,
        [inputType]: {
          ...state.input[inputType],
          [key]: value
        }
      }
    }));
  },

  togglePause: () => {
    gameStore.set(state => ({
      ui: {
        ...state.ui,
        paused: !state.ui.paused
      }
    }));
  },

  saveGame: () => {
    const state = gameStore.get();
    saveGameState({
      player: state.player,
      aircraft: state.aircraft,
      settings: state.settings
    });
    gameActions.addNotification("Game saved successfully");
  },

  loadGame: () => {
    const savedState = loadGameState();
    if (savedState) {
      gameStore.set(state => ({
        player: {
          ...state.player,
          ...savedState.player
        },
        aircraft: {
          ...state.aircraft,
          ...savedState.aircraft
        },
        settings: {
          ...state.settings,
          ...savedState.settings
        }
      }));
      gameActions.addNotification("Game loaded successfully");
    } else {
      gameActions.addNotification("No saved game found");
    }
  },

  updateSetting: (key, value) => {
    gameStore.set(state => ({
      settings: {
        ...state.settings,
        [key]: value
      }
    }));
  }
};

// GameProvider component
export function GameProvider({ children }) {
  // Setup keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'shift') {
        gameActions.updateInput('keyboard', 'shift', true);
      } else if (key === 'control') {
        gameActions.updateInput('keyboard', 'control', true);
      } else if (key === ' ' || key === 'space') {
        gameActions.updateInput('keyboard', 'space', true);
      } else if (key === 'escape') {
        gameActions.togglePause();
      } else if (['w', 'a', 's', 'd', 'q', 'e', 'f'].includes(key)) {
        gameActions.updateInput('keyboard', key, true);
      }
    };
    
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'shift') {
        gameActions.updateInput('keyboard', 'shift', false);
      } else if (key === 'control') {
        gameActions.updateInput('keyboard', 'control', false);
      } else if (key === ' ' || key === 'space') {
        gameActions.updateInput('keyboard', 'space', false);
      } else if (['w', 'a', 's', 'd', 'q', 'e', 'f'].includes(key)) {
        gameActions.updateInput('keyboard', key, false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Check for gamepad
    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (gamepads.length > 0 && gamepads[0]) {
        gameStore.set(state => ({
          input: {
            ...state.input,
            gamepad: gamepads[0]
          }
        }));
      }
    };
    
    window.addEventListener('gamepadconnected', checkGamepad);
    
    // Try loading saved game state
    const savedState = loadGameState();
    if (savedState) {
      gameStore.set(state => ({
        player: {
          ...state.player,
          ...savedState.player
        },
        aircraft: {
          ...state.aircraft,
          ...savedState.aircraft
        },
        settings: {
          ...state.settings,
          ...savedState.settings
        }
      }));
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('gamepadconnected', checkGamepad);
    };
  }, []);
  
  // Load initial missions
  useEffect(() => {
    import('../data/missions').then(({ INITIAL_MISSIONS }) => {
      gameStore.set(state => ({
        world: {
          ...state.world,
          missions: INITIAL_MISSIONS
        }
      }));
    });
    
    import('../data/checkpoints').then(({ INITIAL_CHECKPOINTS }) => {
      gameStore.set(state => ({
        world: {
          ...state.world,
          checkpoints: INITIAL_CHECKPOINTS
        }
      }));
    });
  }, []);

  return (
    <GameActionContext.Provider value={gameActions}>
      {children}
    </GameActionContext.Provider>
  );
}

// Custom hook to use game state and actions
export function useGame() {
  const actions = useContext(GameActionContext);
  if (!actions) {
    throw new Error('useGame must be used within a GameProvider');
  }
  
  // Return both the state object and actions
  return {
    state: gameStore.use(),
    actions
  };
}