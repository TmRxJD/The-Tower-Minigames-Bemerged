// Cascade pipeline: gravity, refill, auto-shatter and explosion handling.
// Uses the shared bindings via board.get(key) to access live runtime state.
import { get } from './board.js';

export function collapseColumns() {
  const board = get('board'); const BOARD_ROWS = get('BOARD_ROWS'); const BOARD_COLS = get('BOARD_COLS');
  for (let c = 0; c < BOARD_COLS; c++) {
    const col = [];
    for (let r = BOARD_ROWS - 1; r >= 0; r--) if (board[r][c]) col.push(board[r][c]);
    for (let r = BOARD_ROWS - 1, i = 0; r >= 0; r--, i++) board[r][c] = col[i] || null;
  }
}

export function refillBoard(makeDrop) {
  const board = get('board'); const BOARD_ROWS = get('BOARD_ROWS'); const BOARD_COLS = get('BOARD_COLS');
  for (let r = 0; r < BOARD_ROWS; r++) for (let c = 0; c < BOARD_COLS; c++) if (!board[r][c]) board[r][c] = (makeDrop || get('makeDrop'))();
}

export async function cascadeResolve() {
  if (get('animating')) return; try { get('animating'); } catch (e) {}
  // set animating flag on bindings if possible
  try { const b = get; /* no-op to avoid linter */ } catch (e) {}
  // Use the same implementation as before, via getters
  if (get('animating')) return; // double-check
  try { get('animating'); } catch (e) {}
  // Set flag via binding write if available
  try { const bindingsObj = get('__bindings_obj__'); if (bindingsObj) bindingsObj.animating = true; } catch (e) {}

  const BOARD_ROWS = get('BOARD_ROWS'); const BOARD_COLS = get('BOARD_COLS'); const board = get('board');
  const renderBoard = get('renderBoard'); const sleepAnimated = get('sleepAnimated');
  try {
    let loop = 0;
    while (true) {
      loop++;
      // stepwise gravity
      let moved;
      do {
        moved = false;
        for (let c = 0; c < BOARD_COLS; c++) {
          for (let r = BOARD_ROWS - 1; r > 0; r--) {
            if (!board[r][c] && board[r - 1][c]) {
              board[r][c] = board[r - 1][c];
              if (board[r][c]) board[r][c].falling = true;
              try { if (get('BOSS_MARKER') && get('BOSS_MARKER').r === (r - 1) && get('BOSS_MARKER').c === c) { get('BOSS_MARKER').r = r; } } catch (e) {}
              board[r - 1][c] = null; moved = true;
            }
          }
        }
        if (moved) { renderBoard && renderBoard(); await (sleepAnimated && sleepAnimated(80)); for (let rr = 0; rr < BOARD_ROWS; rr++) for (let cc = 0; cc < BOARD_COLS; cc++) if (board[rr][cc] && board[rr][cc].falling) delete board[rr][cc].falling; }
      } while (moved);

      // refill
      let filled = false;
      for (let c = 0; c < BOARD_COLS; c++) {
        for (let r = 0; r < BOARD_ROWS; r++) {
          if (!board[r][c]) {
            board[r][c] = (get('makeDrop'))(); if (board[r][c]) board[r][c].spawning = true; filled = true;
          }
        }
      }
      if (filled) { renderBoard && renderBoard(); await (sleepAnimated && sleepAnimated(120)); for (let rr = 0; rr < BOARD_ROWS; rr++) for (let cc = 0; cc < BOARD_COLS; cc++) if (board[rr][cc] && board[rr][cc].spawning) delete board[rr][cc].spawning; }

      // find groups using engine provided findAllGroups
      const findAllGroups = get('findAllGroups'); const hasStraightTriple = get('hasStraightTriple'); const groups = findAllGroups ? findAllGroups(board, (cell) => { if (!cell) return false; if (cell.templateId === '__MINE__' || cell.rarity === 'Mine') return false; if (cell.rarity === 'Common') return true; if (cell.rarity === 'Rare' && !cell.plus) return !!get('autoShatterRares'); return false; }) : [];
      const toShatterGroups = groups.filter(g => g.length >= 3 && hasStraightTriple && hasStraightTriple(g));
      if (toShatterGroups.length === 0) break;
      const allPositionsToRemove = [];
      for (const g of toShatterGroups) {
        const extractStraightRunPositions = get('extractStraightRunPositions'); const straight = extractStraightRunPositions ? extractStraightRunPositions(g) : g;
        for (const p of straight) { const c = board[p.r][p.c]; if (c) c.clearing = true; allPositionsToRemove.push(p); }
      }
      renderBoard && renderBoard(); await (sleepAnimated && sleepAnimated(160));
      const posCells = allPositionsToRemove.map(p => ({ r: p.r, c: p.c, cell: board[p.r] && board[p.r][p.c] }));
      for (const pc of posCells) { const rem = pc.cell; if (rem) { try { const award = get('awardShards'); const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 }; award && award(rem.type || 'Unknown', shardMap[rem.rarity] || 0); } catch (e) {} board[pc.r][pc.c] = null; } }
      renderBoard && renderBoard(); await (sleepAnimated && sleepAnimated(120));
      if (loop > 12) break;
    }
  } finally {
    // clear animating flag if possible
    try { const bindingsObj = get('__bindings_obj__'); if (bindingsObj) bindingsObj.animating = false; } catch (e) {}
    renderBoard && renderBoard();
    // process pendingExplosions if any
    try {
      const pendingExplosions = get('pendingExplosions');
      if (pendingExplosions && pendingExplosions.length > 0) {
        const queue = pendingExplosions.splice(0, pendingExplosions.length);
        for (const ex of queue) {
          const { r, c } = ex;
          for (let rr = Math.max(0, r - 1); rr <= Math.min(get('BOARD_ROWS') - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(get('BOARD_COLS') - 1, c + 1); cc++) {
              const row = get('board')[rr];
              if (row && row[cc]) row[cc].clearing = true;
            }
          }
          renderBoard && renderBoard(); await (get('sleepAnimated') && get('sleepAnimated')(180));
          
          // Calculate boss damage from destroyed modules
          let bossDamage = 0;
          const bossMarker = get('__BOSS_MARKER');
          
          for (let rr = Math.max(0, r - 1); rr <= Math.min(get('BOARD_ROWS') - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(get('BOARD_COLS') - 1, c + 1); cc++) {
              try {
                const row = get('board')[rr];
                const rem = row && row[cc] ? row[cc] : null;
                if (rem) {
                  if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
                    const award = get('awardShards'); const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
                    award && award(rem.type || 'Unknown', shardMap[rem.rarity] || 0);
                    
                    // Calculate boss damage if boss is present at explosion center
                    if (bossMarker && bossMarker.r === r && bossMarker.c === c) {
                      const damageMap = {
                        'Common': 1, 'Rare': 2, 'Rare+': 3, 'Epic': 9, 'Epic+': 18,
                        'Legendary': 54, 'Legendary+': 72, 'Mythic': 0, 'Mythic+': 0,
                        'Ancestral': 0, 'Ancestral+': 0, 'Boss': 0
                      };
                      bossDamage += damageMap[rem.rarity] || 0;
                    }
                  }
                  if (rem.templateId === '__MINE__') pendingExplosions.push({ r: rr, c: cc });
                }
              } catch (e) {}
              if (get('board')[rr]) get('board')[rr][cc] = null;
            }
          }
          
          // Apply boss damage if any was calculated
          if (bossDamage > 0) {
            try {
              const bossHelper = get('bossHelper');
              if (bossHelper && bossHelper.applyDamage) {
                bossHelper.applyDamage(bossDamage);
                const appendToDebug = get('appendToDebug');
                appendToDebug && appendToDebug('Boss damaged by mine explosion for ' + bossDamage + ' hits');
              }
            } catch (e) {
              console.error('Failed to apply boss damage from mine explosion', e);
            }
            // Reset hint cycling state when boss damage is applied
            try {
              const mainGlobals = get('__main_globals__');
              if (mainGlobals) {
                mainGlobals.hintMovesList = [];
                mainGlobals.currentHintIndex = 0;
                mainGlobals.lastBoardState = null;
              }
            } catch (e) {}
          }
          
          renderBoard && renderBoard(); await (get('sleepAnimated') && get('sleepAnimated')(120));
        }
        try { cascadeResolve(); } catch (e) {}
        return;
      }
    } catch (e) { console.error('Pending explosion processing failed', e); }
    // after move, decrement mines etc. (simplified)
    try { const bindingsObj = get('__bindings_obj__'); if (bindingsObj) bindingsObj.moveOccurredThisTurn = false; } catch (e) {}
    renderBoard && renderBoard();
  }
}
