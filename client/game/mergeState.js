// game/mergeState.js - Merge selection state management

/**
 * Factory function for merge state management
 * @param {Object} dependencies - Required dependencies
 * @param {Function} dependencies.appendToDebug - Debug logging function
 * @returns {Object} Merge state management functions and state
 */
export function makeMergeState({ appendToDebug }) {
  // Merge selection state variables
  let selected = []; // selections (first is base)
  let mergeSelecting = false; // true while user is in long-press merge selection mode
  let mineShatterSelecting = false; // true while user is in mine shatter selection mode
  let bossShatterSelecting = false; // true while user is in boss shatter selection mode
  let invalidClickCount = 0; // tracks consecutive clicks outside valid areas to exit selection modes
  let baseClickCount = 0; // tracks consecutive clicks on base to exit selection modes when requirements not met
  let candidateHighlights = new Set(); // set of 'r,c' strings for auto-highlighted candidates

  /**
   * Get current selected modules
   * @returns {Array} Current selected modules
   */
  function getSelected() {
    return selected;
  }

  /**
   * Set selected modules
   * @param {Array} newSelected - New selected modules
   */
  function setSelected(newSelected) {
    selected = newSelected;
  }

  /**
   * Add a module to selection
   * @param {Object} selection - Selection object with r, c, cell properties
   */
  function addToSelection(selection) {
    selected.push(selection);
  }

  /**
   * Remove a module from selection by position
   * @param {number} r - Row
   * @param {number} c - Column
   * @returns {boolean} True if removed, false if not found
   */
  function removeFromSelection(r, c) {
    const index = selected.findIndex(s => s.r === r && s.c === c);
    if (index >= 0) {
      selected.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear all selections
   */
  function clearSelection() {
    selected = [];
  }

  /**
   * Get merge selecting state
   * @returns {boolean} Whether in merge selection mode
   */
  function getMergeSelecting() {
    return mergeSelecting;
  }

  /**
   * Set merge selecting state
   * @param {boolean} value - New merge selecting state
   */
  function setMergeSelecting(value) {
    mergeSelecting = value;
  }

  /**
   * Get mine shatter selecting state
   * @returns {boolean} Whether in mine shatter selection mode
   */
  function getMineShatterSelecting() {
    return mineShatterSelecting;
  }

  /**
   * Set mine shatter selecting state
   * @param {boolean} value - New mine shatter selecting state
   */
  function setMineShatterSelecting(value) {
    mineShatterSelecting = value;
  }

  /**
   * Get boss shatter selecting state
   * @returns {boolean} Whether in boss shatter selection mode
   */
  function getBossShatterSelecting() {
    return bossShatterSelecting;
  }

  /**
   * Set boss shatter selecting state
   * @param {boolean} value - New boss shatter selecting state
   */
  function setBossShatterSelecting(value) {
    bossShatterSelecting = value;
  }

  /**
   * Get invalid click count
   * @returns {number} Current invalid click count
   */
  function getInvalidClickCount() {
    return invalidClickCount;
  }

  /**
   * Set invalid click count
   * @param {number} value - New invalid click count
   */
  function setInvalidClickCount(value) {
    invalidClickCount = value;
  }

  /**
   * Increment invalid click count
   */
  function incrementInvalidClickCount() {
    invalidClickCount++;
  }

  /**
   * Reset invalid click count
   */
  function resetInvalidClickCount() {
    invalidClickCount = 0;
  }

  /**
   * Get base click count
   * @returns {number} Current base click count
   */
  function getBaseClickCount() {
    return baseClickCount;
  }

  /**
   * Set base click count
   * @param {number} value - New base click count
   */
  function setBaseClickCount(value) {
    baseClickCount = value;
  }

  /**
   * Increment base click count
   */
  function incrementBaseClickCount() {
    baseClickCount++;
  }

  /**
   * Reset base click count
   */
  function resetBaseClickCount() {
    baseClickCount = 0;
  }

  /**
   * Get candidate highlights
   * @returns {Set} Current candidate highlights
   */
  function getCandidateHighlights() {
    return candidateHighlights;
  }

  /**
   * Add candidate highlight
   * @param {number} r - Row
   * @param {number} c - Column
   */
  function addCandidateHighlight(r, c) {
    candidateHighlights.add(`${r},${c}`);
  }

  /**
   * Remove candidate highlight
   * @param {number} r - Row
   * @param {number} c - Column
   */
  function removeCandidateHighlight(r, c) {
    candidateHighlights.delete(`${r},${c}`);
  }

  /**
   * Clear all candidate highlights
   */
  function clearCandidateHighlights() {
    candidateHighlights.clear();
  }

  /**
   * Set candidate highlights from array of positions
   * @param {Array} positions - Array of {r,c} positions
   */
  function setCandidateHighlights(positions) {
    candidateHighlights.clear();
    positions.forEach(pos => {
      candidateHighlights.add(`${pos.r},${pos.c}`);
    });
  }

  /**
   * Check if position is highlighted as candidate
   * @param {number} r - Row
   * @param {number} c - Column
   * @returns {boolean} Whether position is highlighted
   */
  function isCandidateHighlighted(r, c) {
    return candidateHighlights.has(`${r},${c}`);
  }

  /**
   * Check if any selection mode is active
   * @returns {boolean} Whether any selection mode is active
   */
  function isAnySelectionModeActive() {
    return mergeSelecting || mineShatterSelecting || bossShatterSelecting;
  }

  /**
   * Exit all selection modes and clear state
   */
  function exitAllSelectionModes() {
    mergeSelecting = false;
    mineShatterSelecting = false;
    bossShatterSelecting = false;
    selected = [];
    candidateHighlights.clear();
    invalidClickCount = 0;
    baseClickCount = 0;
  }

  /**
   * Get selection state summary for debugging
   * @returns {Object} State summary
   */
  function getStateSummary() {
    return {
      selectedCount: selected.length,
      mergeSelecting,
      mineShatterSelecting,
      bossShatterSelecting,
      invalidClickCount,
      baseClickCount,
      candidateHighlightsCount: candidateHighlights.size,
    };
  }

  return {
    // State getters
    getSelected,
    getMergeSelecting,
    getMineShatterSelecting,
    getBossShatterSelecting,
    getInvalidClickCount,
    getBaseClickCount,
    getCandidateHighlights,
    isCandidateHighlighted,
    isAnySelectionModeActive,
    getStateSummary,

    // State setters
    setSelected,
    setMergeSelecting,
    setMineShatterSelecting,
    setBossShatterSelecting,
    setInvalidClickCount,
    setBaseClickCount,

    // State modifiers
    addToSelection,
    removeFromSelection,
    clearSelection,
    addCandidateHighlight,
    removeCandidateHighlight,
    clearCandidateHighlights,
    setCandidateHighlights,
    incrementInvalidClickCount,
    resetInvalidClickCount,
    incrementBaseClickCount,
    resetBaseClickCount,
    exitAllSelectionModes,
  };
}
