/**
 * Selection utility functions for determining selection types
 */

/**
 * Check if a selection is an inventory selection
 * @param {Object} selection - The selection object to check
 * @returns {boolean} True if the selection is from inventory
 */
export function isInvSel(selection) {
  return selection && typeof selection.inv !== 'undefined';
}

/**
 * Check if a selection is a board selection
 * @param {Object} selection - The selection object to check
 * @returns {boolean} True if the selection is from the board
 */
export function isBoardSel(selection) {
  return selection && typeof selection.r === 'number' && typeof selection.c === 'number';
}
