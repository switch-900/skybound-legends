// src/data/enemies.js
export const ENEMY_TYPES = {
    PATROL: 'patrol',
    AGGRESSIVE: 'aggressive',
    DEFENSIVE: 'defensive',
    SCOUT: 'scout',
    BOSS: 'boss',
  };
  
  export const ENEMY_FACTIONS = {
    PIRATES: 'pirates',
    MILITARY: 'military',
    MERCENARY: 'mercenary',
    WILDLIFE: 'wildlife',
  };
  
  export const ENEMY_STATES = {
    IDLE: 'idle',
    PATROLLING: 'patrolling',
    PURSUING: 'pursuing',
    ATTACKING: 'attacking',
    RETREATING: 'retreating',
    FORMATION: 'formation',
  };
  
  export const PATROL_PATTERNS = {
    CIRCLE: 'circle',
    FIGURE_EIGHT: 'figureEight',
    LINEAR: 'linear',
    RANDOM: 'random',
  };
  
  // Enemy presets for spawning
  export const ENEMY_PRESETS = {
    PIRATE_FIGHTER: {
      type: ENEMY_TYPES.AGGRESSIVE,
      faction: ENEMY_FACTIONS.PIRATES,
      model: 'fighter',
      color: '#8B0000',
      health: 80,
      maxSpeed: 0.4,
      acceleration: 0.015,
      rotationSpeed: 0.06,
      weaponType: 'Machinegun',
      weaponDamage: 8,
      weaponCooldown: 800,
      weaponRange: 60,
      projectileSpeed: 4,
      detectionRange: 120,
      attackRange: 50,
      giveUpRange: 200,
      experienceValue: 50,
      creditValue: 100,
      dropChance: 0.2,
      dropsItems: true
    },
    
    PIRATE_BOMBER: {
      type: ENEMY_TYPES.AGGRESSIVE,
      faction: ENEMY_FACTIONS.PIRATES,
      model: 'bomber',
      color: '#8B0000',
      health: 120,
      maxSpeed: 0.25,
      acceleration: 0.008,
      rotationSpeed: 0.04,
      weaponType: 'Rocket',
      weaponDamage: 20,
      weaponCooldown: 2000,
      weaponRange: 80,
      projectileSpeed: 3,
      detectionRange: 100,
      attackRange: 70,
      giveUpRange: 150,
      experienceValue: 80,
      creditValue: 150,
      dropChance: 0.3,
      dropsItems: true
    },
    
    MILITARY_PATROL: {
      type: ENEMY_TYPES.PATROL,
      faction: ENEMY_FACTIONS.MILITARY,
      model: 'standard',
      color: '#006400',
      health: 100,
      maxSpeed: 0.35,
      acceleration: 0.01,
      rotationSpeed: 0.05,
      weaponType: 'Machinegun',
      weaponDamage: 10,
      weaponCooldown: 1000,
      weaponRange: 70,
      projectileSpeed: 4,
      patrolPattern: PATROL_PATTERNS.CIRCLE,
      patrolRadius: 80,
      detectionRange: 150,
      attackRange: 60,
      giveUpRange: 200,
      experienceValue: 60,
      creditValue: 120,
      dropChance: 0.25,
      dropsItems: true
    },
    
    MILITARY_ELITE: {
      type: ENEMY_TYPES.AGGRESSIVE,
      faction: ENEMY_FACTIONS.MILITARY,
      model: 'fighter',
      color: '#006400',
      health: 150,
      maxSpeed: 0.45,
      acceleration: 0.02,
      rotationSpeed: 0.07,
      weaponType: 'Missile',
      weaponDamage: 25,
      weaponCooldown: 3000,
      weaponRange: 100,
      projectileSpeed: 5,
      detectionRange: 200,
      attackRange: 80,
      giveUpRange: 250,
      experienceValue: 100,
      creditValue: 200,
      dropChance: 0.4,
      dropsItems: true
    },
    
    MERCENARY_SCOUT: {
      type: ENEMY_TYPES.SCOUT,
      faction: ENEMY_FACTIONS.MERCENARY,
      model: 'scout',
      color: '#00008B',
      health: 70,
      maxSpeed: 0.5,
      acceleration: 0.02,
      rotationSpeed: 0.08,
      weaponType: 'Machinegun',
      weaponDamage: 6,
      weaponCooldown: 500,
      weaponRange: 50,
      projectileSpeed: 5,
      patrolPattern: PATROL_PATTERNS.RANDOM,
      patrolRadius: 150,
      detectionRange: 180,
      attackRange: 40,
      giveUpRange: 300,
      experienceValue: 40,
      creditValue: 80,
      dropChance: 0.2,
      dropsItems: true
    },
    
    SKY_KRAKEN: {
      type: ENEMY_TYPES.BOSS,
      faction: ENEMY_FACTIONS.WILDLIFE,
      model: 'kraken',
      color: '#8B8000',
      health: 500,
      maxSpeed: 0.3,
      acceleration: 0.008,
      rotationSpeed: 0.03,
      weaponType: 'Lightning',
      weaponDamage: 30,
      weaponCooldown: 2000,
      weaponRange: 60,
      projectileSpeed: 8,
      detectionRange: 150,
      attackRange: 60,
      giveUpRange: 200,
      experienceValue: 300,
      creditValue: 500,
      dropChance: 1.0,
      dropsItems: true,
      bossMusic: 'boss_battle'
    }
  };
  
  // Function to create an enemy instance with unique ID
  export function createEnemy(preset, position, options = {}) {
    const presetData = ENEMY_PRESETS[preset];
    if (!presetData) {
      console.error(`Enemy preset ${preset} not found!`);
      return null;
    }
    
    return {
      id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: position || [0, 100, 0],
      rotation: [0, 0, 0],
      initialState: ENEMY_STATES.PATROLLING,
      patrolCenter: position || [0, 100, 0],
      ...presetData,
      ...options
    };
  }
  
  // Function to create a formation of enemies
  export function createFormation(preset, leaderPosition, formationSize = 3, options = {}) {
    const leader = createEnemy(preset, leaderPosition, {
      ...options,
      isFormationLeader: true
    });
    
    const formation = [leader];
    
    // Create wingmen
    if (formationSize > 1) {
      formation.push(
        createEnemy(preset, leaderPosition, {
          ...options,
          formationLeaderId: leader.id,
          formationPosition: 'right',
          initialState: ENEMY_STATES.FORMATION
        })
      );
    }
    
    if (formationSize > 2) {
      formation.push(
        createEnemy(preset, leaderPosition, {
          ...options,
          formationLeaderId: leader.id,
          formationPosition: 'left',
          initialState: ENEMY_STATES.FORMATION
        })
      );
    }
    
    if (formationSize > 3) {
      formation.push(
        createEnemy(preset, leaderPosition, {
          ...options,
          formationLeaderId: leader.id,
          formationPosition: 'rightRear',
          initialState: ENEMY_STATES.FORMATION
        })
      );
    }
    
    if (formationSize > 4) {
      formation.push(
        createEnemy(preset, leaderPosition, {
          ...options,
          formationLeaderId: leader.id,
          formationPosition: 'leftRear',
          initialState: ENEMY_STATES.FORMATION
        })
      );
    }
    
    return formation;
  }
  
  // Initial enemies for testing
  export const INITIAL_ENEMIES = [
    createEnemy('PIRATE_FIGHTER', [50, 50, 50]),
    createEnemy('MILITARY_PATROL', [-80, 70, 30], {
      patrolCenter: [-80, 70, 30],
      patrolRadius: 60
    }),
    ...createFormation('MERCENARY_SCOUT', [0, 80, -100], 3)
  ];