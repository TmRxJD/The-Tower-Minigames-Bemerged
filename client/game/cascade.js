// Cascade pipeline: gravity, refill, auto-shatter and explosion handling.
// Uses the shared bindings via board.get(key) to access live runtime state.
import {
  findAllGroups as _findAllGroups,
  hasStraightTriple as _hasStraightTriple,
  extractStraightRunPositions as _extractStraightRunPositions,
} from './matcher.js';

export function collapseColumns(get) {
  const board = get('board');
  const BOARD_ROWS = get('BOARD_ROWS');
  const BOARD_COLS = get('BOARD_COLS');
  for (let c = 0; c < BOARD_COLS; c++) {
    const col = [];
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (board[r][c]) {
        col.push(board[r][c]);
      }
    }
    for (let r = BOARD_ROWS - 1, i = 0; r >= 0; r--, i++) {
      board[r][c] = col[i] || null;
    }
  }
}

export function refillBoard(get, makeDrop) {
  const board = get('board');
  const BOARD_ROWS = get('BOARD_ROWS');
  const BOARD_COLS = get('BOARD_COLS');
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (!board[r][c]) {
        board[r][c] = (makeDrop || get('makeDrop'))();
      }
    }
  }
}

export async function cascadeResolve(get) {
  console.log('cascadeResolve called');
  const BOARD_ROWS = get('BOARD_ROWS');
  const BOARD_COLS = get('BOARD_COLS');
  const board = get('board');
  const renderBoard = get('renderBoard');
  const sleepAnimated = get('sleepAnimated');
  const makeDrop = get('makeDrop');
  const maybeConvertToMine = get('maybeConvertToMine');
  const awardShards = get('awardShards');
  const pendingExplosions = get('pendingExplosions');
  const bossHelper = get('bossHelper');
  const appendToDebug = get('appendToDebug');
  const processMineCountdowns = get('processMineCountdowns');
  const moveOccurredThisTurn = get('moveOccurredThisTurn');
  const moveCount = get('moveCount');
  const checkForValidMoves = get('checkForValidMoves');
  const createBoard = get('createBoard');
  const resetHintCyclingState = get('resetHintCyclingState');

  if (get('animating')) {
    return;
  }
  // set animating flag on bindings if possible
  try {
    const bindingsObj = get('__bindings_obj__');
    if (bindingsObj) {
      bindingsObj.animating = true;
    }
  } catch (e) {}

  let loop = 0;
  try {
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
              if (board[r][c]) {
                board[r][c].falling = true;
              }
              try {
                if (get('BOSS_MARKER') && get('BOSS_MARKER').r === r - 1 && get('BOSS_MARKER').c === c) {
                  get('BOSS_MARKER').r = r;
                }
              } catch (e) {}
              board[r - 1][c] = null;
              moved = true;
            }
          }
        }
        if (moved) {
          renderBoard && renderBoard();
          await (sleepAnimated && sleepAnimated(80));
          for (let rr = 0; rr < BOARD_ROWS; rr++) {
            for (let cc = 0; cc < BOARD_COLS; cc++) {
              if (board[rr][cc] && board[rr][cc].falling) {
                delete board[rr][cc].falling;
              }
            }
          }
        }
      } while (moved);

      // refill
      let filled = false;
      for (let c = 0; c < BOARD_COLS; c++) {
        for (let r = 0; r < BOARD_ROWS; r++) {
          if (!board[r][c]) {
            board[r][c] = makeDrop();
            if (board[r][c]) {
              board[r][c].spawning = true;
            }
            filled = true;
          }
        }
      }
      if (filled) {
        renderBoard && renderBoard();
        await (sleepAnimated && sleepAnimated(120));
        for (let rr = 0; rr < BOARD_ROWS; rr++) {
          for (let cc = 0; cc < BOARD_COLS; cc++) {
            if (board[rr][cc] && board[rr][cc].spawning) {
              delete board[rr][cc].spawning;
            }
          }
        }
      }

      // find groups using engine provided findAllGroups
      console.log('About to log board state, BOARD_ROWS:', BOARD_ROWS, 'BOARD_COLS:', BOARD_COLS);
      console.log('board is array:', Array.isArray(board), 'board length:', board ? board.length : 'null');
      console.log('Board state:');
      for (let r = 0; r < BOARD_ROWS; r++) {
        const row = [];
        for (let c = 0; c < BOARD_COLS; c++) {
          const cell = board[r][c];
          if (cell) {
            row.push({ rarity: cell.rarity,
              type: cell.type,
              templateId: cell.templateId });
          } else {
            row.push(null);
          }
        }
        console.log(`Row ${r}:`, row);
      }
      const autoShatterRares = get('autoShatterRares');
      const groups = _findAllGroups(
        board,
        cell => {
          if (!cell) {
            return false;
          }
          if (cell.templateId === '__MINE__' || cell.rarity === 'Mine') {
            return false;
          }
          if (cell.rarity === 'Common') {
            return true;
          }
          if (cell.rarity === 'Rare' && !cell.plus) {
            return !!autoShatterRares;
          }
          return false;
        },
        BOARD_ROWS,
        BOARD_COLS,
      );
      console.log('CascadeResolve: groups found', groups.length);
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        console.log(`Group ${i}: length ${g.length}, positions:`, g);
        const cells = g.map(p => board[p.r][p.c]);
        console.log(
          `Group ${i} cells:`,
          cells.map(c => ({ rarity: c.rarity,
            type: c.type,
            templateId: c.templateId })),
        );
      }
      const toShatterGroups = groups.filter(g => g.length >= 3 && _hasStraightTriple(g));
      console.log('CascadeResolve: toShatterGroups', toShatterGroups.length);
      if (toShatterGroups.length > 0) {
        console.log('To shatter groups:', toShatterGroups);
      }
      const allPositionsToRemove = [];
      for (const g of toShatterGroups) {
        const straight = _extractStraightRunPositions(g);
        for (const p of straight) {
          const c = board[p.r][p.c];
          if (c) {
            c.clearing = true;
          }
          allPositionsToRemove.push(p);
        }
      }
      renderBoard && renderBoard();
      await (sleepAnimated && sleepAnimated(160));
      const posCells = allPositionsToRemove.map(p => ({ r: p.r,
        c: p.c,
        cell: board[p.r] && board[p.r][p.c] }));
      for (const pc of posCells) {
        const rem = pc.cell;
        if (rem) {
          try {
            const shardMap = { Common: 5,
              Rare: 10,
              Epic: 40 };
            awardShards && awardShards(rem.type || 'Unknown', shardMap[rem.rarity] || 0);
          } catch (e) {}
          board[pc.r][pc.c] = null;
        }
      }
      renderBoard && renderBoard();
      await (sleepAnimated && sleepAnimated(120));
      if (loop > 12) {
        break;
      }
    }
  } finally {
    // clear animating flag if possible
    try {
      const bindingsObj = get('__bindings_obj__');
      if (bindingsObj) {
        bindingsObj.animating = false;
      }
    } catch (e) {}
    renderBoard && renderBoard();
    // process pendingExplosions if any
    try {
      const pendingExplosions = get('pendingExplosions');
      if (pendingExplosions && pendingExplosions.length > 0) {
        const queue = pendingExplosions.splice(0, pendingExplosions.length);
        for (const ex of queue) {
          const { r, c } = ex;
          for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
              const row = board[rr];
              if (row && row[cc]) {
                row[cc].clearing = true;
              }
            }
          }
          renderBoard && renderBoard();
          await (sleepAnimated && sleepAnimated(180));

          // Calculate boss damage from destroyed modules
          let bossDamage = 0;
          const bossMarker = get('__BOSS_MARKER');

          for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
              try {
                const row = board[rr];
                const rem = row && row[cc] ? row[cc] : null;
                if (rem) {
                  if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
                    const shardMap = { Common: 5,
                      Rare: 10,
                      Epic: 40 };
                    awardShards && awardShards(rem.type || 'Unknown', shardMap[rem.rarity] || 0);

                    // Calculate boss damage if boss is present at explosion center
                    if (bossMarker && bossMarker.r === r && bossMarker.c === c) {
                      const damageMap = {
                        Common: 1,
                        Rare: 2,
                        'Rare+': 3,
                        Epic: 9,
                        'Epic+': 18,
                        Legendary: 54,
                        'Legendary+': 72,
                        Mythic: 0,
                        'Mythic+': 0,
                        Ancestral: 0,
                        'Ancestral+': 0,
                        Boss: 0,
                      };
                      bossDamage += damageMap[rem.rarity] || 0;
                    }
                  }
                  if (rem.templateId === '__MINE__') {
                    pendingExplosions.push({ r: rr,
                      c: cc });
                  }
                }
              } catch (e) {}
              if (board[rr]) {
                board[rr][cc] = null;
              }
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

          renderBoard && renderBoard();
          await (sleepAnimated && sleepAnimated(120));
        }
        try {
          cascadeResolve(get);
        } catch (e) {}
        return;
      }
    } catch (e) {
      console.error('Pending explosion processing failed', e);
    }
    // after move, decrement mines etc. (simplified)
    try {
      const bindingsObj = get('__bindings_obj__');
      if (bindingsObj) {
        bindingsObj.moveOccurredThisTurn = false;
      }
    } catch (e) {}
    renderBoard && renderBoard();
  }
}

export async function resolveImmediateShatters(get) {
  // detect groups same as in cascadeResolve
  const board = get('board');
  const BOARD_ROWS = get('BOARD_ROWS');
  const BOARD_COLS = get('BOARD_COLS');
  const autoShatterRares = get('autoShatterRares');
  const renderBoard = get('renderBoard');
  const sleepAnimated = get('sleepAnimated');
  const awardShards = get('awardShards');
  const totalShatters = get('totalShatters');
  const setTotalShatters = get('setTotalShatters');

  const groups = _findAllGroups(
    board,
    cell => {
      if (!cell) {
        return false;
      }
      if (cell.rarity === 'Common') {
        return true;
      }
      if (cell.rarity === 'Rare' && !cell.plus) {
        return !!autoShatterRares;
      }
      return false;
    },
    BOARD_ROWS,
    BOARD_COLS,
  ).filter(g => g.length >= 3 && _hasStraightTriple(g));
  if (!groups || groups.length === 0) {
    return false;
  }

  // mark groups for clearing so we can show the clearing animation
  // mark only straight-run positions for clearing animation
  const immediatePositions = [];
  for (const g of groups) {
    const straight = _extractStraightRunPositions(g);
    for (const p of straight) {
      const c = board[p.r][p.c];
      if (c) {
        c.clearing = true;
      }
      immediatePositions.push(p);
    }
  }
  renderBoard();
  // small delay to show clearing animation
  await sleepAnimated(160);

  // now actually remove and award score
  for (const g of groups) {
    // compute only the straight-run positions inside this connected group
    const toRemove = _extractStraightRunPositions(g);
    for (const p of toRemove) {
      const rem = board[p.r][p.c];
      if (rem) {
        // Mines themselves are not worth shards; only surrounding modules count
        if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
          try {
            const shardMap = { Common: 5,
              Rare: 10,
              Epic: 40 };
            const shards = shardMap[rem.rarity] || 0;
            const shType = rem.type || 'Unknown';
            awardShards(shType, shards);
            const currentTotal = typeof totalShatters === 'function' ? totalShatters() : totalShatters;
            const newTotal = typeof currentTotal === 'number' ? currentTotal + 1 : 1;
            if (setTotalShatters) {
              setTotalShatters(newTotal);
            }
          } catch (e) {}
        }
      }
      board[p.r][p.c] = null;
    }
  }

  // collapse/fill will be animated by cascadeResolve; do a quick render now
  renderBoard();
  return true;
}
