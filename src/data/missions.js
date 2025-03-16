export const MISSION_DEPENDENCIES = {
  mission1: ['tutorial'],
  mission2: ['mission1'],
  mission3: ['mission1', 'mission2'],
  mission4: ['mission3']
};

export const INITIAL_MISSIONS = [
  {
    id: 'tutorial',
    title: 'Flight Training',
    description: 'Learn to fly your aircraft by reaching the training checkpoints.',
    status: 'active',
    objectives: [
      { id: 'checkpoint1', description: 'Fly through the first ring', completed: false },
      { id: 'checkpoint2', description: 'Fly through the second ring', completed: false },
      { id: 'checkpoint3', description: 'Land on the training island', completed: false }
    ],
    rewards: {
      credits: 300,
      experience: 100,
      items: ['enginePart_basic']
    }
  }
];
