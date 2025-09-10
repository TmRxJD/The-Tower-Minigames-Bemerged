// utils/timer.js
// Game timer management utilities

import { formatTimer } from './format.js';

// Timer state
let gameTimerSeconds = 0;
let gameTimerInterval = null;
let gameTimerStart = null; // epoch ms when timer started

// formatTimer is provided by ./utils/format.js

/**
 * Starts the game timer, loading persisted start time if available.
 */
export function startGameTimer() {
  try {
    stopGameTimer();
    // load persisted start if available
    try {
      const saved = localStorage.getItem('gameTimerStart');
      if (saved && !isNaN(parseInt(saved, 10))) {
        gameTimerStart = parseInt(saved, 10);
      }
      if (!gameTimerStart) {
        gameTimerStart = Date.now();
        try {
          localStorage.setItem('gameTimerStart', String(gameTimerStart));
        } catch (e) {} // eslint-disable-line no-empty
      }
    } catch (e) {
      if (!gameTimerStart) {
        gameTimerStart = Date.now();
      }
    }
    try {
      localStorage.setItem('gameTimerRunning', '1');
    } catch (e) {} // eslint-disable-line no-empty
    gameTimerInterval = setInterval(() => {
      try {
        const elapsed = Math.floor((Date.now() - (gameTimerStart || Date.now())) / 1000);
        gameTimerSeconds = Math.max(0, elapsed);
        const el = document.getElementById('game-timer');
        if (el) {
          el.textContent = formatTimer(gameTimerSeconds);
        }
      } catch (e) {} // eslint-disable-line no-empty
    }, 1000);
    // immediate tick
    try {
      const el = document.getElementById('game-timer');
      if (el) {
        el.textContent = formatTimer(Math.floor((Date.now() - (gameTimerStart || Date.now())) / 1000));
      }
    } catch (e) {} // eslint-disable-line no-empty
  } catch (e) {} // eslint-disable-line no-empty
}

/**
 * Stops the game timer and updates localStorage.
 */
export function stopGameTimer() {
  try {
    if (gameTimerInterval) {
      clearInterval(gameTimerInterval);
      gameTimerInterval = null;
    }
    try {
      localStorage.setItem('gameTimerRunning', '0');
    } catch (e) {} // eslint-disable-line no-empty
  } catch (e) {} // eslint-disable-line no-empty
}

/**
 * Resets the game timer to zero and restarts it.
 */
export function resetGameTimer() {
  try {
    stopGameTimer();
    gameTimerSeconds = 0;
    gameTimerStart = Date.now();
    try {
      localStorage.setItem('gameTimerStart', String(gameTimerStart));
      localStorage.setItem('gameTimerRunning', '1');
    } catch (e) {} // eslint-disable-line no-empty
    const el = document.getElementById('game-timer');
    if (el) {
      el.textContent = formatTimer(gameTimerSeconds);
    }
  } catch (e) {} // eslint-disable-line no-empty
}

/**
 * Gets the current timer seconds.
 * @returns {number} Current timer seconds
 */
export function getGameTimerSeconds() {
  return gameTimerSeconds;
}

/**
 * Sets the game timer start time.
 * @param {number} startTime - Epoch milliseconds
 */
export function setGameTimerStart(startTime) {
  gameTimerStart = startTime;
}
