// src/utils/storage.js
export function saveGameState(state) {
  try {
    localStorage.setItem('skybound_save', JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
}

export function loadGameState() {
  try {
    const savedState = localStorage.getItem('skybound_save');
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}
