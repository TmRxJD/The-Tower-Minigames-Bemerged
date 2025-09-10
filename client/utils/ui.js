// utils/ui.js
// UI management utilities

import { makeScoreUI } from '../ui/score.js';

// Create score UI factory instance
let __scoreUI = null;
function getScoreUI() {
  if (!__scoreUI) {
    // We need to get the required context from main.js
    // This will be set up when the utility functions are called
    throw new Error('Score UI not initialized. Call updateScoreUI or ensureGameTimerPlaced first.');
  }
  return __scoreUI;
}

/**
 * Syncs the visible score element with the internal score variable.
 */
export function updateScoreUI() {
  try {
    const scoreUI = getScoreUI();
    return scoreUI.updateScoreUI();
  } catch (e) {
    // Fallback behavior when score UI is not yet available
    console.warn('Score UI not available, using fallback behavior');
    // Keep original fallback behavior
    const el = document.getElementById('score');
    if (!el) {
      return;
    }
    el.textContent = String(window.score || 0);
  }
}

/**
 * Ensures the #game-timer element exists directly under the score pill.
 */
export function ensureGameTimerPlaced() {
  try {
    const scoreUI = getScoreUI();
    return scoreUI.ensureGameTimerPlaced();
  } catch (e) {
    // Fallback behavior when score UI is not yet available
    console.warn('Score UI not available, using fallback behavior');
    const el = document.getElementById('game-timer');
    if (el) {
      try {
        el.textContent = String(window.gameTimerSeconds || 0);
      } catch (e) {} // eslint-disable-line no-empty
    }
  }
}

// Export a function to initialize the score UI factory
export function initScoreUI(ctx) {
  __scoreUI = makeScoreUI(ctx);
}
