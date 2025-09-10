// utils/hintSystem.js - Hint system management for the merge game

// Hint system state variables
let hintMovesList = [];
let currentHintIndex = 0;
let lastBoardState = null;
let inactivityTimer = null;
let hintMove = null; // Current hint move for display
const INACTIVITY_TIMEOUT_MS = 20000; // 20 seconds

// Store dependencies for use in functions that need them
let dependencies = {};

/**
 * Sets the dependencies needed by the hint system
 * @param {Object} deps The dependencies object
 */
function setHintSystemDependencies(deps) {
  dependencies = deps;
}

/**
 * Updates the list of valid hint moves based on the current board state
 * Prioritizes moves that create rare merges, then other clears, then all valid moves
 */
function updateHintMovesList() {
  const {
    getBoardStateHash,
    board,
    findAllGroups,
    BOARD_ROWS,
    BOARD_COLS,
    hasStraightTriple,
    appendToDebug,
    findValidMovesList,
  } = dependencies;

  const currentBoardHash = getBoardStateHash();

  // Only recalculate if board has changed
  if (lastBoardState !== currentBoardHash) {
    lastBoardState = currentBoardHash;
    hintMovesList = [];
    currentHintIndex = 0;

    const moves = findValidMovesList();
    if (!moves || moves.length === 0) {
      return;
    }

    // First priority: moves that create 3+ commons in a row
    const commonClearMoves = [];
    for (const move of moves) {
      // Simulate the swap to check if it creates groups of 3+ commons
      const tempBoard = board().map(row => row.slice());
      const cell1 = tempBoard[move.r][move.c];
      const cell2 = tempBoard[move.nr][move.nc];
      tempBoard[move.r][move.c] = cell2;
      tempBoard[move.nr][move.nc] = cell1;

      // Check for groups of 3+ commons after the swap
      const groups = findAllGroups(tempBoard, cell => cell && cell.rarity === 'Common', BOARD_ROWS, BOARD_COLS);
      const hasCommonTriple = groups.some(g => g.length >= 3 && hasStraightTriple(g));

      if (hasCommonTriple) {
        commonClearMoves.push(move);
      }
    }

    // Prioritize: common clears first, then all valid moves
    if (commonClearMoves.length > 0) {
      hintMovesList = commonClearMoves.slice();
    } else {
      // Last resort: all valid moves (including those that don't create clears)
      hintMovesList = moves.slice();
    }

    appendToDebug &&
      appendToDebug(
        `Updated hint moves list: ${hintMovesList.length} moves available ` +
        `(common clears: ${commonClearMoves.length}, total valid: ${moves.length})`,
      );
  }
}

/**
 * Called when the inactivity timeout is reached
 * Shows a hint to the player or prompts to restart if no moves available
 */
function onInactivityTimeout() {
  const { findValidMovesList, appendToDebug, createBoard, renderBoard, renderInventory, cascadeResolve } = dependencies;

  // clear previous hint
  setHintMove(null);
  const moves = findValidMovesList();
  console.debug && console.debug('onInactivityTimeout moves count:', moves ? moves.length : 0);
  appendToDebug && appendToDebug('onInactivityTimeout moves: ' + (moves ? moves.length : 0));
  if (!moves || moves.length === 0) {
    // game over
    setTimeout(() => {
      // Ask the player before restarting to avoid unexpected auto-shuffles
      const restart = confirm('No valid moves left — restart the board?');
      if (restart) {
        createBoard();
        renderBoard();
        renderInventory();
        cascadeResolve();
      }
    }, 50);
    return;
  }

  // Update hint moves list and use cycling
  updateHintMovesList();

  if (hintMovesList.length > 0) {
    // Ensure current hint index is within bounds
    if (currentHintIndex >= hintMovesList.length) {
      currentHintIndex = 0;
    }

    // Use the cycling system for inactivity hints too
    const selectedMove = hintMovesList[currentHintIndex];
    setHintMove(selectedMove);

    // Move to next move in the list (wrap around)
    currentHintIndex = (currentHintIndex + 1) % hintMovesList.length;

    appendToDebug && appendToDebug('onInactivityTimeout chose move: ' + JSON.stringify(getHintMove()));
  } else {
    // Fallback if no moves available
    setHintMove(null);
  }

  renderBoard();
}

/**
 * Resets the inactivity timer
 * Called whenever the player interacts with the game
 */
function resetInactivity() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  inactivityTimer = setTimeout(onInactivityTimeout, INACTIVITY_TIMEOUT_MS);
}

/**
 * Sets up event listeners for user interactions that should reset inactivity
 */
function setupInactivityListeners() {
  ['click', 'pointerdown', 'contextmenu', 'keydown'].forEach(evt =>
    window.addEventListener(evt, resetInactivity, { capture: true }),
  );
}

/**
 * Resets the hint cycling state (used when board changes significantly)
 */
function resetHintCyclingState() {
  hintMovesList = [];
  currentHintIndex = 0;
  lastBoardState = null;
}

/**
 * Gets the current hint moves list
 * @returns {Array} The current hint moves list
 */
function getHintMovesList() {
  return hintMovesList;
}

/**
 * Gets the current hint index
 * @returns {number} The current hint index
 */
function getCurrentHintIndex() {
  return currentHintIndex;
}

/**
 * Sets the current hint index
 * @param {number} index The new hint index
 */
function setCurrentHintIndex(index) {
  currentHintIndex = index;
}

/**
 * Gets the last board state hash
 * @returns {string|null} The last board state hash
 */
function getLastBoardState() {
  return lastBoardState;
}

/**
 * Sets the last board state hash
 * @param {string|null} state The new board state hash
 */
function setLastBoardState(state) {
  lastBoardState = state;
}

/**
 * Gets the current hint move for display
 * @returns {Object|null} The current hint move or null if none available
 */
function getHintMove() {
  return hintMove;
}

/**
 * Sets the current hint move
 * @param {Object|null} move The hint move to set or null to clear
 */
function setHintMove(move) {
  hintMove = move;
}

export {
  updateHintMovesList,
  onInactivityTimeout,
  resetInactivity,
  setupInactivityListeners,
  resetHintCyclingState,
  getHintMovesList,
  getCurrentHintIndex,
  setCurrentHintIndex,
  getLastBoardState,
  setLastBoardState,
  getHintMove,
  setHintMove,
  INACTIVITY_TIMEOUT_MS,
  setHintSystemDependencies,
};
