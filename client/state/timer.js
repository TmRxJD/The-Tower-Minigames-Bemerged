// State Management Module
// Handles game state persistence, timer management, and settings

export function createStateManager({ SAVE_KEY, localStorage, appendToDebug, formatTimer }) {
  // Timer state
  let gameTimerSeconds = 0;
  let gameTimerInterval = null;
  let gameTimerStart = null; // epoch ms when timer started

  function startGameTimer() {
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
          } catch (e) {}
        }
      } catch (e) {
        if (!gameTimerStart) {
          gameTimerStart = Date.now();
        }
      }
      try {
        localStorage.setItem('gameTimerRunning', '1');
      } catch (e) {}
      gameTimerInterval = setInterval(() => {
        try {
          const elapsed = Math.floor((Date.now() - (gameTimerStart || Date.now())) / 1000);
          gameTimerSeconds = Math.max(0, elapsed);
          const el = document.getElementById('game-timer');
          if (el) {
            el.textContent = formatTimer(gameTimerSeconds);
          }
        } catch (e) {}
      }, 1000);
      // immediate tick
      try {
        const el = document.getElementById('game-timer');
        if (el) {
          el.textContent = formatTimer(Math.floor((Date.now() - (gameTimerStart || Date.now())) / 1000));
        }
      } catch (e) {}
    } catch (e) {}
  }

  function stopGameTimer() {
    try {
      if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
      }
      try {
        localStorage.setItem('gameTimerRunning', '0');
      } catch (e) {}
    } catch (e) {}
  }

  function resetGameTimer() {
    try {
      stopGameTimer();
      gameTimerSeconds = 0;
      gameTimerStart = Date.now();
      try {
        localStorage.setItem('gameTimerStart', String(gameTimerStart));
        localStorage.setItem('gameTimerRunning', '1');
      } catch (e) {}
      const el = document.getElementById('game-timer');
      if (el) {
        el.textContent = formatTimer(gameTimerSeconds);
      }
    } catch (e) {}
  }

  // Ensure the #game-timer element exists directly under the score pill.
  function ensureGameTimerPlaced() {
    try {
      const el = document.getElementById('game-timer');
      if (el) {
        try {
          el.textContent = formatTimer(gameTimerSeconds);
        } catch (e) {}
      }
    } catch (e) {}
  }

  // Persist timer state periodically
  function persistTimerState() {
    try {
      if (gameTimerStart) {
        localStorage.setItem('gameTimerStart', String(gameTimerStart));
      }
      localStorage.setItem('gameTimerRunning', gameTimerInterval ? '1' : '0');
    } catch (e) {}
  }

  // Setup periodic persistence
  setInterval(persistTimerState, 2000);

  // Persist on page unload
  window.addEventListener('beforeunload', persistTimerState);

  return {
    startGameTimer,
    stopGameTimer,
    resetGameTimer,
    ensureGameTimerPlaced,
    get gameTimerSeconds() {
      return gameTimerSeconds;
    },
    get gameTimerInterval() {
      return gameTimerInterval;
    },
    get gameTimerStart() {
      return gameTimerStart;
    },
  };
}
