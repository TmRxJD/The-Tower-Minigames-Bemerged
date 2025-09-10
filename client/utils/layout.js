// utils/layout.js
// Layout management utilities

/**
 * Adjusts the right column (inventory + dev tools) to vertically align with the board.
 */
export function adjustRightColumnToBoard() {
  const boardDiv = document.getElementById('game-board');
  const right = document.getElementById('right-column');
  if (!boardDiv || !right) {
    return;
  }
  // measure board height and position, then set right-column height to match so its
  // contents can be centered vertically relative to the board.
  const br = boardDiv.getBoundingClientRect();
  // compute target height: prefer the board's height but clamp to viewport if needed
  let targetH = Math.min(br.height, window.innerHeight - 40);
  if (targetH <= 0) {
    targetH = br.height || 400;
  }
  right.style.height = targetH + 'px';
  // center contents vertically
  right.style.display = 'flex';
  right.style.flexDirection = 'column';
  right.style.justifyContent = 'center';
}
