# Skybound Legends

![Skybound Legends Banner](/images/skybound-banner.jpg)

## Game Description

**Skybound Legends** is an exhilarating open-world flying adventure that takes place in a vast sky realm of floating islands and ancient mysteries. Pilot your customizable aircraft through diverse biomes—from lush floating archipelagos to treacherous volcanic zones, crystalline formations, and forgotten ruins suspended in the clouds.

As an aspiring sky pilot, you'll navigate the complex politics of rival factions while uncovering the secrets of a lost sky civilization. Master the art of flight with realistic aerodynamics that balance arcade accessibility with simulation depth, allowing for thrilling dogfights, daring exploration, and precise maneuvers through challenging environments.

The game features a dynamic weather system where raging storms, dense fog, and peaceful clear skies not only transform the visual experience but directly affect your aircraft's handling and mission strategies. Day and night cycles create ever-changing lighting conditions that reveal new perspectives on the breathtaking world around you.

Progress through an engaging storyline while building your reputation across multiple factions. Customize your aircraft with performance upgrades, weapon systems, and visual modifications earned through missions, exploration, and combat. Join flying squadrons with other pilots for cooperative challenges or test your skills in competitive aerial tournaments.

With multiple progression paths focused on exploration, combat, or trade, Skybound Legends offers freedom to carve your own path through the skies while unraveling the mysteries of a forgotten world among the clouds.

## Key Features

- **Physics-Based Flight Model** - Experience realistic but accessible flight mechanics with lift, drag, and stall dynamics
- **Dynamic Open World** - Explore diverse biomes with unique visuals, resources, and challenges
- **Deep Customization** - Upgrade and personalize your aircraft with performance parts, weapons, and visual elements
- **Faction-Based Storyline** - Navigate complex relationships between rival sky factions
- **Progressive Mission System** - Take on increasingly challenging quests that unlock new areas and abilities
- **Dynamic Weather** - Adapt to changing weather conditions that affect flight physics and visibility
- **Day/Night Cycle** - Experience the world in different lighting with unique challenges at night
- **Combat System** - Engage in dogfights using various weapons and tactical maneuvers
- **Formation Flying** - Join AI wingmates or other players in coordinated flight patterns


skybound-legends/
├── package.json                # Project dependencies and configuration
├── vite.config.js              # Vite configuration file
├── public/                     # Static assets
│   ├── models/                 # 3D models
│   │   ├── aircraft/          # Aircraft models
│   │   │   ├── standard.glb
│   │   │   ├── fighter.glb
│   │   │   ├── bomber.glb
│   │   │   └── scout.glb
│   │   ├── islands/           # Island models
│   │   │   ├── standard.glb
│   │   │   ├── volcanic.glb
│   │   │   ├── crystal.glb
│   │   │   └── ancient.glb
│   │   └── projectiles/       # Projectile models
│   │       ├── bullet.glb
│   │       └── missile.glb
│   ├── textures/              # Texture files
│   │   ├── aircraft/          # Aircraft textures
│   │   ├── islands/           # Island textures
│   │   └── effects/           # Visual effect textures
│   │       ├── explosion.png
│   │       ├── smoke.png
│   │       └── icons/         # UI and status icons
│   ├── audio/                 # Audio files
│   │   ├── effects/           # Sound effects
│   │   ├── music/             # Background music
│   │   └── ambient/           # Ambient sounds
│   └── images/                # UI images and icons
│       └── skybound-banner.png
├── src/                       # Source code
│   ├── index.jsx              # Entry point
│   ├── App.jsx                # Main application component
│   ├── components/            # React components
│   │   ├── Game.jsx           # Main game component
│   │   ├── aircraft/          # Aircraft components
│   │   │   ├── PlayerAircraft.jsx      # Player aircraft with physics
│   │   │   ├── AircraftModel.jsx       # Visual aircraft model
│   │   │   ├── CameraFollow.jsx        # Camera that follows aircraft
│   │   │   ├── Cockpit.jsx             # First-person cockpit view
│   │   │   ├── EngineTrails.jsx        # Visual engine trails
│   │   │   ├── WeaponSystem.jsx        # Aircraft weapons
│   │   │   └── models/                 # Aircraft model components
│   │   │       ├── StandardAircraft.jsx
│   │   │       ├── FighterAircraft.jsx
│   │   │       ├── BomberAircraft.jsx
│   │   │       └── ScoutAircraft.jsx
│   │   ├── audio/             # Audio system components
│   │   │   ├── AudioSystem.jsx         # Main audio management
│   │   │   └── SoundEffect.jsx         # Individual sound effects
│   │   ├── physics/           # Physics system components
│   │   │   ├── PhysicsWorld.jsx        # Main physics world
│   │   │   ├── CollisionSystem.jsx     # Collision detection system
│   │   │   └── WorldBoundary.jsx       # World boundary physics
│   │   ├── ui/                # User interface components
│   │   │   ├── GameUI.jsx              # Main game UI overlay
│   │   │   ├── HUD.jsx                 # Heads-up display
│   │   │   ├── TutorialUI.jsx          # Tutorial system
│   │   │   ├── NotificationsUI.jsx     # Notification system
│   │   │   ├── MissionCompleteUI.jsx   # Mission complete screen
│   │   │   ├── LoadingScreen.jsx       # Loading screen
│   │   │   ├── HangarUI.jsx            # Aircraft customization UI
│   │   │   ├── MissionsUI.jsx          # Mission selection UI
│   │   │   ├── MapUI.jsx               # World map UI
│   │   │   ├── InventoryUI.jsx         # Inventory management
│   │   │   ├── ShopUI.jsx              # Shop interface
│   │   │   ├── PauseMenu.jsx           # Pause menu
│   │   │   └── SettingsMenu.jsx        # Settings menu
│   │   └── world/             # World environment components
│   │       ├── IslandSystem.jsx        # Island generation and management
│   │       ├── CloudSystem.jsx         # Cloud generation
│   │       ├── WeatherSystem.jsx       # Weather effects
│   │       ├── CheckpointSystem.jsx    # Mission checkpoints
│   │       ├── ProjectileSystem.jsx    # Projectile management
│   │       ├── ExplosionSystem.jsx     # Explosion effects
│   │       ├── PickupSystem.jsx        # Collectible items
│   │       ├── EnemyManager.jsx        # Enemy AI and spawning
│   │       ├── StatusIcon.jsx          # Enemy status indicators
│   │       └── islands/                # Island type components
│   │           ├── StandardIsland.jsx
│   │           ├── VolcanicIsland.jsx
│   │           ├── CrystalIsland.jsx
│   │           └── AncientIsland.jsx
│   ├── contexts/              # React contexts
│   │   └── GameContext.jsx    # Game state management
│   ├── data/                  # Game data
│   │   ├── aircraft.js        # Aircraft types and upgrades
│   │   ├── checkpoints.js     # Checkpoint data
│   │   ├── enemies.js         # Enemy types and behavior
│   │   ├── items.js           # Items and pickups
│   │   ├── missions.js        # Mission definitions
│   │   └── world.js           # World data including islands
│   └── utils/                 # Utility functions
│       ├── physics.js         # Physics utility functions
│       ├── storage.js         # Save/load game state
│       └── helpers.js         # General helper functions

# Skybound Legends

A 3D flight game built with React Three Fiber.

## Model Exporter

This project includes a model exporter tool to generate GLB files for all game models. You can:

1. Toggle between different model categories (aircraft, islands, projectiles)
2. Preview each model in 3D space
3. Export any model as a GLB file with one click

### Export Instructions

1. Run the application with `npm start` or `npm run dev`
2. The Model Exporter view is shown by default
3. Select a model category and browse through available models
4. Click "Export as GLB" to save the current model as a GLB file
5. Find exported models in your downloads folder

### Model Directory Structure

```
public/
├── models/
│   ├── aircraft/
│   │   ├── standard.glb
│   │   ├── fighter.glb
│   │   ├── bomber.glb
│   │   └── scout.glb
│   ├── islands/
│   │   ├── standard.glb
│   │   ├── volcanic.glb
│   │   ├── crystal.glb
│   │   └── ancient.glb
│   └── projectiles/
│       ├── bullet.glb
│       └── missile.glb
```

## Development

This project was bootstrapped with Create React App.

### Available Scripts

- `npm start` or `npm run dev` - Start development server
- `npm run build` - Build the app for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App