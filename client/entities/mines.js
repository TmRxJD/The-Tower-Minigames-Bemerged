// Mine-related logic: createMineInstance, pendingExplosions queue, mine adjacency rules
import { uid } from '../utils/random.js';

// Bespoke canBeFodder function for mines - completely separate from merging rules
function canBeFodderForMines(baseCell, candidateCell) {
  if (!baseCell || !candidateCell) return false;
  const b = (baseCell && baseCell.cell) ? baseCell.cell : baseCell;
  const c = (candidateCell && candidateCell.cell) ? candidateCell.cell : candidateCell;
  // Mines can be used as wildcards for any base
  if (c.templateId === '__MINE__' || c.rarity === 'Mine') return true;
  if (c.rarity === 'Common' || b.rarity === 'Common') return false;
  if (c.type !== b.type) return false;
  if (b.rarity === 'Rare' && !b.plus) return c.rarity === 'Rare' && !c.plus && c.templateId === b.templateId;
  if (b.rarity === 'Rare' && b.plus) return !!c.plus && c.type === b.type && c.rarity === 'Rare';
  if (b.rarity === 'Epic' && !b.plus) return c.rarity === 'Epic' && !c.plus && c.templateId === b.templateId;
  if (b.rarity === 'Epic' && b.plus) return c.rarity === 'Epic' && c.plus === true && c.type === b.type;
  if (b.rarity === 'Legendary' && !b.plus) return c.rarity === 'Epic' && c.plus === true && c.templateId === b.templateId;
  if (b.rarity === 'Legendary' && b.plus) return c.rarity === 'Legendary' && c.plus === true && c.type === b.type;
  if (b.rarity === 'Mythic' && !b.plus) return c.rarity === 'Legendary' && c.plus === true;
  if (b.rarity === 'Mythic' && b.plus) return c.rarity === 'Epic' && c.plus === true;
  if (b.rarity === 'Ancestral') return c.rarity === 'Epic' && c.plus === true;
  return false;
}

// pending explosion queue (coords) — used when mines are removed by shatter or countdown
export const pendingExplosions = [];

// Create a mine instance object (special cell). Mines are represented by rarity 'Mine'.
export function createMineInstance() {
  const inst = {
    instanceId: uid(),
    templateId: '__MINE__',
    name: 'Mine',
    type: 'Mine',
    shape: 'circle',
    initials: 'M',
    unique: false,
    rarity: 'Mine',
    plus: false,
    stars: 0,
    // movesRemaining until explosion; visible on tile. Default 10 moves.
    movesRemaining: 10,
  };
  return inst;
}

// Determine whether a given cell is disabled because it's adjacent to a live mine
export function isDisabledByMine(cell, board, BOARD_ROWS, BOARD_COLS) {
  try {
    if (!cell) return false;
    if (cell.templateId === '__MINE__' || cell.rarity === 'Mine') return false;
    // Check all 8 surrounding tiles (3x3 area around the cell)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue; // Skip the cell itself
        const nr = (cell.r != null && cell.c != null) ? (cell.r + dr) : null;
        const nc = (cell.r != null && cell.c != null) ? (cell.c + dc) : null;
        if (nr == null || nc == null) continue;
        if (nr < 0 || nc < 0 || nr >= BOARD_ROWS || nc >= BOARD_COLS) continue;
        const nb = board[nr] && board[nc] ? board[nr][nc] : null;
        if (nb && nb.templateId === '__MINE__') return true;
      }
    }
    return false;
  } catch (e) { return false; }
}

// Determine whether a cell can be shattered (for mines and other special cases)
export function canBeShattered(cell, board, BOARD_ROWS, BOARD_COLS) {
  try {
    if (!cell) return false;
    // Mines can be shattered manually if they have two modules in-line that would be valid fodder for a Rare base
    if (cell.templateId === '__MINE__' || cell.rarity === 'Mine') {
      if (!board || !cell.r != null || !cell.c != null) return false;
      
      // Check horizontal lines - mine can be in any position in the 3-in-a-row
      for (let offset = -2; offset <= 0; offset++) {
        const c1 = cell.c + offset;
        const c2 = cell.c + offset + 1;
        const c3 = cell.c + offset + 2;
        if (c1 >= 0 && c2 >= 0 && c3 >= 0 && c1 < BOARD_COLS && c2 < BOARD_COLS && c3 < BOARD_COLS) {
          const cell1 = board[cell.r] && board[cell.r][c1];
          const cell2 = board[cell.r] && board[cell.r][c2];
          const cell3 = board[cell.r] && board[cell.r][c3];
          // Check if exactly one of the positions contains the mine and the other two contain modules
          const positions = [cell1, cell2, cell3];
          const mineCount = positions.filter(p => p && (p.templateId === '__MINE__' || p.rarity === 'Mine')).length;
          const modulePositions = positions.filter(p => p && p.templateId !== '__MINE__' && p.rarity !== 'Mine');
          
          if (mineCount === 1 && modulePositions.length === 2) {
            // Check if the 2 modules would be valid fodder for mine destruction
            // following normal merging rules
            const mod1 = modulePositions[0].cell;
            const mod2 = modulePositions[1].cell;
            
            // Special case: allow 2 commons of the same type
            const validCommons = mod1.rarity === 'Common' && mod2.rarity === 'Common' && mod1.type === mod2.type;
            
            // Check if they would be valid fodder for some base according to normal merge rules
            let validFodder = false;
            
            // Try different hypothetical bases to see if these 2 modules would be valid fodder
            const hypotheticalBases = [
              { rarity: 'Rare', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Rare', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Epic', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Epic', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Legendary', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Legendary', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Mythic', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Mythic', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Ancestral', plus: false, type: mod1.type, templateId: mod1.templateId }
            ];
            
            for (const base of hypotheticalBases) {
              // Check if both modules would be valid fodder for this base
              if (canBeFodderForMines(base, mod1) && canBeFodderForMines(base, mod2)) {
                validFodder = true;
                break;
              }
            }
            
            if (validCommons || validFodder) {
              return true;
            }
          }
        }
      }
      
      // Check vertical lines - mine can be in any position in the 3-in-a-row
      for (let offset = -2; offset <= 0; offset++) {
        const r1 = cell.r + offset;
        const r2 = cell.r + offset + 1;
        const r3 = cell.r + offset + 2;
        if (r1 >= 0 && r2 >= 0 && r3 >= 0 && r1 < BOARD_ROWS && r2 < BOARD_ROWS && r3 < BOARD_ROWS) {
          const cell1 = board[r1] && board[r1][cell.c];
          const cell2 = board[r2] && board[r2][cell.c];
          const cell3 = board[r3] && board[r3][cell.c];
          // Check if exactly one of the positions contains the mine and the other two contain modules
          const positions = [cell1, cell2, cell3];
          const mineCount = positions.filter(p => p && (p.templateId === '__MINE__' || p.rarity === 'Mine')).length;
          const modulePositions = positions.filter(p => p && p.templateId !== '__MINE__' && p.rarity !== 'Mine');
          
          if (mineCount === 1 && modulePositions.length === 2) {
            // Check if the 2 modules would be valid fodder for mine destruction
            // following normal merging rules
            const mod1 = modulePositions[0].cell;
            const mod2 = modulePositions[1].cell;
            
            // Special case: allow 2 commons of the same type
            const validCommons = mod1.rarity === 'Common' && mod2.rarity === 'Common' && mod1.type === mod2.type;
            
            // Check if they would be valid fodder for some base according to normal merge rules
            let validFodder = false;
            
            // Try different hypothetical bases to see if these 2 modules would be valid fodder
            const hypotheticalBases = [
              { rarity: 'Rare', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Rare', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Epic', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Epic', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Legendary', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Legendary', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Mythic', plus: false, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Mythic', plus: true, type: mod1.type, templateId: mod1.templateId },
              { rarity: 'Ancestral', plus: false, type: mod1.type, templateId: mod1.templateId }
            ];
            
            for (const base of hypotheticalBases) {
              // Check if both modules would be valid fodder for this base
              if (canBeFodderForMines(base, mod1) && canBeFodderForMines(base, mod2)) {
                validFodder = true;
                break;
              }
            }
            
            if (validCommons || validFodder) {
              return true;
            }
          }
        }
      }
      
      return false;
    }
    // Epics and higher can be shattered manually
    if (cell.rarity === 'Epic' || cell.rarity === 'Legendary' || cell.rarity === 'Mythic' || cell.rarity === 'Ancestral') {
      return true;
    }
    return false;
  } catch (e) { return false; }
}

// Mine spawn configuration
let MINE_SPAWN_PERCENT = 1; // default: 1% chance per new tile
try { const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem('devMineRate') : null; if (saved) MINE_SPAWN_PERCENT = Math.max(0, parseFloat(saved) || 1); } catch (e) {}

// Set mine spawn percentage (used by dev tools)
export function setMineSpawnPercent(percent) {
  MINE_SPAWN_PERCENT = Math.max(0, Math.min(100, percent));
  try { if (typeof localStorage !== 'undefined') localStorage.setItem('devMineRate', MINE_SPAWN_PERCENT.toString()); } catch (e) {}
}

// Get current mine spawn percentage
export function getMineSpawnPercent() {
  return MINE_SPAWN_PERCENT;
}

// Convert a drop to a mine based on spawn chance
export function maybeConvertToMine(drop) {
  try {
    const pct = Math.max(0, parseFloat(MINE_SPAWN_PERCENT || 0));
    if (pct > 0 && Math.random() * 100 < pct) {
      return createMineInstance();
    }
  } catch (e) {}
  return drop;
}

// Process mine countdowns and schedule explosions
export function processMineCountdowns(board, BOARD_ROWS, BOARD_COLS) {
  const toExplode = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (cell && cell.templateId === '__MINE__') {
        cell.movesRemaining = (typeof cell.movesRemaining === 'number') ? cell.movesRemaining - 1 : 9;
        if (cell.movesRemaining <= 0) {
          toExplode.push({ r, c });
        }
      }
    }
  }
  return toExplode;
}

// Handle mine explosion at a specific position
export function explodeMine(board, r, c, BOARD_ROWS, BOARD_COLS, awardShards, totalShatters, appendToDebug) {
  const affectedPositions = [];
  
  // Mark neighbors for clearing
  for (let rr = Math.max(0, r - 1); rr <= Math.min(BOARD_ROWS - 1, r + 1); rr++) {
    for (let cc = Math.max(0, c - 1); cc <= Math.min(BOARD_COLS - 1, c + 1); cc++) {
      if (board[rr][cc]) {
        board[rr][cc].clearing = true;
        affectedPositions.push({ r: rr, c: cc, cell: board[rr][cc] });
      }
    }
  }
  
  // Process the explosion after animation delay
  setTimeout(() => {
    // Calculate boss damage from destroyed modules
    let bossDamage = 0;
    const bossMarker = window.__BOSS_MARKER;
    
    for (const pos of affectedPositions) {
      try {
        const rem = pos.cell;
        if (rem) {
          // Only award for non-mine tiles
          if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
            try { 
              if (typeof totalShatters === 'function') totalShatters((prev) => (typeof prev === 'number') ? prev + 1 : 1);
            } catch (e) {}
            try {
              const shType = rem.type || 'Unknown';
              const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
              const shards = shardMap[rem.rarity] || 0;
              if (awardShards) awardShards(shType, shards);
            } catch (e) {}
            
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
          // If a neighbor removed by an explosion is itself a mine, queue it for its own explosion
          try { 
            if (rem.templateId === '__MINE__') { 
              pendingExplosions.push({ r: pos.r, c: pos.c }); 
            } 
          } catch (e) {}
        }
      } catch (e) {}
      board[pos.r][pos.c] = null;
    }
    
    // Apply boss damage if any was calculated
    if (bossDamage > 0) {
      try {
        // Import bossHelper dynamically to avoid circular dependencies
        import('./boss.js').then(({ default: bossHelper }) => {
          if (bossHelper && bossHelper.applyDamage) {
            bossHelper.applyDamage(bossDamage);
            if (appendToDebug) appendToDebug('Boss damaged by mine explosion for ' + bossDamage + ' hits');
          }
        }).catch(e => console.error('Failed to apply boss damage from mine explosion', e));
      } catch (e) {
        console.error('Failed to apply boss damage from mine explosion', e);
      }
    }
    
    // Mine explosions are now completely independent of boss system
  }, 180); // Animation delay
  
  return affectedPositions;
}