let bindings = {};
export function initBoard(bind) { bindings = { ...(bindings||{}), ...(bind||{}) }; }

export function get(k) {
  const v = bindings[k];
  try {
    if (typeof v === 'function') return v();
  } catch (e) {}
  return v;
}

export function removeCells(cells, awardShards = true) {
  const board = get('board');
  const inventory = get('inventory');
  const pendingExplosions = get('pendingExplosions');
  const award = get('awardShards');
  if (!board) return;
  const minesRemoved = [];
  for (const s of cells) {
    if (!s) continue;
    if (s.inv) { inventory[s.inv] = null; continue; }
    if (typeof s.r === 'number' && typeof s.c === 'number') {
      try {
        const cell = (board[s.r] && board[s.r][s.c]) ? board[s.r][s.c] : null;
        if (cell && cell.templateId === '__MINE__') minesRemoved.push({ r: s.r, c: s.c });
        else if (cell) {
          if (awardShards) {
            const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
            try { award(cell.type || 'Unknown', shardMap[cell.rarity] || 0); } catch (e) {}
          }
        }
      } catch(e){}
      if (board[s.r]) board[s.r][s.c] = null;
      try { bindings.moveOccurredThisTurn = true; } catch (e) {}
      continue;
    }
    if (s.cell && s.cell.instanceId) {
      for (const k of Object.keys(inventory)) {
        const invCell = inventory[k];
        if (invCell && invCell.instanceId === s.cell.instanceId) inventory[k] = null;
      }
    }
  }
  if (minesRemoved.length > 0) {
    for (const m of minesRemoved) pendingExplosions.push(m);
  }
}

export function placeNewAt(selEntry, newMod) {
  const board = get('board'); const inventory = get('inventory');
  if (!selEntry) return;
  try { bindings.moveOccurredThisTurn = true; } catch (e) {}
  // inventory placement
  if (selEntry.inv) {
    inventory[selEntry.inv] = newMod;
    return;
  }
  // coordinate placement: ensure board exists and is usable
  if (typeof selEntry.r === 'number' && typeof selEntry.c === 'number') {
    if (!board) {
      try {
        console.error('placeNewAt: board binding is undefined or null', { selEntry, board, BOARD_ROWS: get('BOARD_ROWS'), BOARD_COLS: get('BOARD_COLS') });
      } catch (e) { console.error('placeNewAt: board missing and diagnostics failed', e); }
      return;
    }
    // defensive: create row if missing to avoid "cannot set property of undefined" errors
    if (!board[selEntry.r] || !Array.isArray(board[selEntry.r])) {
      const BOARD_COLS = get('BOARD_COLS') || 0;
      try {
        // log when we need to synthesize a missing row
        if (typeof console !== 'undefined' && console.warn) console.warn('placeNewAt: synthesizing missing board row', { row: selEntry.r, BOARD_COLS, boardLength: Array.isArray(board) ? board.length : null });
      } catch (e) {}
      board[selEntry.r] = new Array(BOARD_COLS).fill(null);
    }
    board[selEntry.r][selEntry.c] = newMod;
  }
}

import * as cascade from './cascade.js';

export function collapseColumns() { return cascade.collapseColumns(); }

export function refillBoard(makeDrop) { return cascade.refillBoard(makeDrop); }

export async function cascadeResolve() { return cascade.cascadeResolve(); }

export function findValidMovesList() {
  const board = get('board');
  const BOARD_ROWS = get('BOARD_ROWS');
  const BOARD_COLS = get('BOARD_COLS');
  const moves = [];
  
  if (!board) return moves;
  
  // Find all valid adjacency swaps (respecting Common-swap rules)
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      
      // Check adjacent cells
      const directions = [
        { dr: 0, dc: 1 },   // right
        { dr: 1, dc: 0 },   // down
        { dr: 0, dc: -1 },  // left
        { dr: -1, dc: 0 }   // up
      ];
      
      for (const dir of directions) {
        const nr = r + dir.dr;
        const nc = c + dir.dc;
        
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          const neighbor = board[nr][nc];
          if (!neighbor) continue;
          
          // Check Common-swap rules: at least one tile must be Common
          const srcIsCommon = cell.rarity === 'Common';
          const dstIsCommon = neighbor.rarity === 'Common';
          
          if (srcIsCommon || dstIsCommon) {
            moves.push({ r, c, nr, nc });
          }
        }
      }
    }
  }
  
  return moves;
}

export function checkForValidMoves() {
  return findValidMovesList().length > 0;
}

export function shatterAt(r, c) {
  const board = get('board');
  if (!board || !board[r] || !board[r][c]) return;
  const cell = board[r][c];
  if (cell.templateId !== '__MINE__' && cell.rarity !== 'Mine') return;
  
  // Clear the mine and surrounding 3x3 area
  for (let rr = Math.max(0, r - 1); rr <= Math.min(get('BOARD_ROWS') - 1, r + 1); rr++) {
    for (let cc = Math.max(0, c - 1); cc <= Math.min(get('BOARD_COLS') - 1, c + 1); cc++) {
      if (board[rr] && board[rr][cc]) {
        const cell = board[rr][cc];
        // Award shards for non-mine tiles
        if (cell.templateId !== '__MINE__' && cell.rarity !== 'Mine') {
          try {
            const award = get('awardShards');
            const shType = cell.type || 'Unknown';
            const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
            const shards = shardMap[cell.rarity] || 0;
            award(shType, shards);
          } catch (e) {}
        }
        board[rr][cc] = null;
      }
    }
  }
  
  // Trigger cascade
  try {
    const cascadeResolve = get('cascadeResolve');
    cascadeResolve();
  } catch (e) {}
}
