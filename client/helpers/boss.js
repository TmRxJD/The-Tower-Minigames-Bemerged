// Boss helper module
// Responsibilities:
// - track boss spawn, position, HP (hits remaining), and phase
// - provide hooks for spawn-on-drop, shatter-hit counting, move-advance destructive behavior
// - render a simple DOM overlay for boss HP and numeric counter

const DEFAULTS = {
  spawnChance: 1/250, // probability per tile drop to spawn
  requiredHits: 100,
  destructiveMoveThreshold: 20,
  destructiveEveryOtherMove: true,
};

let opts = { ...DEFAULTS };
let boss = null; // { r,c, hitsRemaining, destructiveActive, lastDestructiveTick }
let game = null; // weak reference to game api provided by main

function init(gameApi, devOptions = {}) {
  game = gameApi;
  opts = { ...opts, ...(devOptions || {}) };
  // Note: persistent save/load is managed by the main code. The helper should not read storage directly.
  ensureOverlay();
}

// Set the runtime state (boss and opts) from main. This does not perform any storage I/O.
function setState(state) {
  try {
    if (!state) return;
    if (state.opts && typeof state.opts === 'object') opts = { ...opts, ...state.opts };
    if (state.boss) {
      boss = { ...state.boss };
      try { game && game.setBossOnBoard && game.setBossOnBoard(boss); } catch (e) {}
      renderOverlay();
    } else if (state && typeof state.r === 'number') {
      boss = { r: state.r, c: state.c, hitsRemaining: state.hitsRemaining || opts.requiredHits, destructiveActive: !!state.destructiveActive, lastDestructiveTick: state.lastDestructiveTick || 0 };
      try { game && game.setBossOnBoard && game.setBossOnBoard(boss); } catch (e) {}
      renderOverlay();
    }
  } catch (e) {}
}

function ensureOverlay() {
  if (!document.getElementById('boss-overlay')) {
    const div = document.createElement('div');
    div.id = 'boss-overlay';
    div.style.position = 'absolute';
    div.style.left = '50%';
    div.style.transform = 'translateX(-50%)';
    div.style.top = '6px';
    div.style.zIndex = '120';
    div.style.pointerEvents = 'none';
    div.style.color = '#fff';
    div.style.fontWeight = '700';
    div.style.textAlign = 'center';
    document.body.appendChild(div);
  }
}

function renderOverlay() {
  ensureOverlay();
  const wrap = document.getElementById('boss-overlay');
  if (!wrap) return;
  try { console.debug && console.debug('renderOverlay called', { boss, opts }); } catch (e) {}
  wrap.innerHTML = '';
  if (!boss) return;
  const barBg = document.createElement('div');
  barBg.style.width = '300px';
  barBg.style.height = '18px';
  barBg.style.background = 'rgba(0,0,0,0.6)';
  barBg.style.border = '1px solid rgba(255,255,255,0.12)';
  barBg.style.borderRadius = '10px';
  barBg.style.overflow = 'hidden';
  const bar = document.createElement('div');
  const pct = Math.max(0, Math.min(1, boss.hitsRemaining / (opts.requiredHits || 1)));
  bar.style.width = Math.round(pct * 100) + '%';
  bar.style.height = '100%';
  bar.style.background = 'linear-gradient(90deg,#ff6b6b,#ffcf6b)';
  barBg.appendChild(bar);
  const label = document.createElement('div');
  label.textContent = `Boss HP: ${boss.hitsRemaining || 0}`;
  label.style.marginTop = '6px';
  wrap.appendChild(barBg);
  wrap.appendChild(label);
  try { console.debug && console.debug('renderOverlay updated DOM for boss hp', boss && boss.hitsRemaining); } catch (e) {}
}

function clearOverlay() {
  const el = document.getElementById('boss-overlay');
  if (el) el.innerHTML = '';
}

function spawnIfEligible(r, c) {
  // Called when a new tile is created at r,c (or when board init fills the board).
  if (!game) return;
  if (boss) return; // only one boss at a time
  // spawn roll
  const roll = Math.random();
  if (roll < opts.spawnChance) {
    boss = { r, c, hitsRemaining: opts.requiredHits, destructiveActive: false, lastDestructiveTick: 0 };
    try { game.setBossOnBoard(boss); } catch (e) {}
    renderOverlay();
    game.appendToDebug && game.appendToDebug('Boss spawned at ' + r + ',' + c + ' hits=' + boss.hitsRemaining);
  }
}

function onShatterResolved(usedPositions) {
  // usedPositions: array of {r,c,cell} that were included in a straight-run shatter
  if (!boss) return;
  try {
    game && game.appendToDebug && game.appendToDebug(`onShatterResolved called: usedPositions=${(usedPositions&&usedPositions.length)||0} boss=${boss.r},${boss.c} hp=${boss.hitsRemaining}`);
    console.debug && console.debug('onShatterResolved', { usedPositions, boss });
  } catch (e) {}
  // If boss tile is among usedPositions, ignore (boss is not a normal module)
  // Boss takes hits from tiles used in combos against it: if any of the usedPositions are in same row/col straight-run that touches boss, count hits
  // Determine if usedPositions form a straight run aligned with boss and adjacent
  let hits = 0;
  try {
    // Map rarities to hit weights
    const weight = { 'Common': 1, 'Rare': 2, 'Epic': 5 };
    // We'll detect straight-run segments in rows and columns among usedPositions.
    // 1) Build maps of positions by row and by column
    const rowMap = Object.create(null);
    const colMap = Object.create(null);
    const keyFor = (r,c) => r + ':' + c;
    const posByKey = Object.create(null);
    for (const p of usedPositions) {
      if (!p || typeof p.r !== 'number' || typeof p.c !== 'number') continue;
      posByKey[keyFor(p.r,p.c)] = p;
      rowMap[p.r] = rowMap[p.r] || [];
      rowMap[p.r].push(p.c);
      colMap[p.c] = colMap[p.c] || [];
      colMap[p.c].push(p.r);
    }
  // Helper to add hits for a set of coords (avoid double-counting via a seen set)
  const seen = new Set();
    const hitDetails = [];
    const addHitFor = (r,c) => {
      const k = keyFor(r,c);
      if (seen.has(k)) return;
      seen.add(k);
      const p = posByKey[k] || null;
      const cell = (p && p.cell) ? p.cell : (game && game.getCellAt && game.getCellAt(r,c));
      if (!cell) return;
      const w = weight[cell.rarity] || 1;
      hits += w;
      try { hitDetails.push({ r, c, rarity: cell.rarity, templateId: cell.templateId, weight: w }); } catch (e) {}
    };

    // Quick adjacency pass: if any used position is the same cell as boss or orthogonally adjacent, count it immediately.
    try {
      for (const p of usedPositions) {
        if (!p || typeof p.r !== 'number' || typeof p.c !== 'number') continue;
        const dr = Math.abs(p.r - boss.r);
        const dc = Math.abs(p.c - boss.c);
        if ((dr + dc) <= 1) {
          addHitFor(p.r, p.c);
        }
      }
    } catch (e) {}

    // 2) For each row, find consecutive segments of columns and if segment length >=3 and aligned with boss row
    for (const rrStr of Object.keys(rowMap)) {
      const rr = parseInt(rrStr,10);
      const cols = rowMap[rr].slice().sort((a,b)=>a-b);
      // find consecutive runs
      let segStart = null, segPrev = null;
      for (const c of cols.concat([null])) {
        if (segStart === null) { segStart = c; segPrev = c; continue; }
        if (c !== null && c === segPrev + 1) { segPrev = c; continue; }
        // segment ended at segPrev (from segStart..segPrev)
        if (segStart !== null && segPrev !== null) {
          const segLen = segPrev - segStart + 1;
          if (segLen >= 3) {
            // If this row is the boss row or the segment is adjacent to the boss horizontally, count all tiles in segment
            if (boss && (rr === boss.r || (Math.abs(rr - boss.r) === 0 && (boss.c >= segStart-1 && boss.c <= segPrev+1)))) {
              for (let cc = segStart; cc <= segPrev; cc++) addHitFor(rr, cc);
            } else if (boss && rr === boss.r && (boss.c >= segStart && boss.c <= segPrev)) {
              for (let cc = segStart; cc <= segPrev; cc++) addHitFor(rr, cc);
            }
            // Also if any tile in this segment is orthogonally adjacent to boss, count (covers common case)
            for (let cc = segStart; cc <= segPrev; cc++) {
              if (boss && ((rr === boss.r && Math.abs(cc - boss.c) === 1) || (cc === boss.c && Math.abs(rr - boss.r) === 1))) addHitFor(rr, cc);
            }
          } else if (segLen === 2) {
            // Special-case: two-Common straight runs adjacent to the boss should count (mirror mine behavior)
            // Verify both positions are Commons before counting
            const p1 = posByKey[keyFor(rr, segStart)];
            const p2 = posByKey[keyFor(rr, segPrev)];
            const bothCommons = p1 && p2 && p1.cell && p2.cell && p1.cell.rarity === 'Common' && p2.cell.rarity === 'Common';
            if (bothCommons && boss) {
              // If boss is on same row and directly adjacent to the run (left or right), count both
              if (rr === boss.r && (boss.c === segStart - 1 || boss.c === segPrev + 1)) {
                for (let cc = segStart; cc <= segPrev; cc++) addHitFor(rr, cc);
              }
              // If any tile in this short segment is orthogonally adjacent to boss, count that tile
              for (let cc = segStart; cc <= segPrev; cc++) {
                if ((rr === boss.r && Math.abs(cc - boss.c) === 1) || (cc === boss.c && Math.abs(rr - boss.r) === 1)) addHitFor(rr, cc);
              }
            }
          } else {
            // short segment: still consider individual tiles adjacent to boss
            for (let cc = segStart; cc <= segPrev; cc++) {
              if (boss && ((rr === boss.r && Math.abs(cc - boss.c) === 1) || (cc === boss.c && Math.abs(rr - boss.r) === 1))) addHitFor(rr, cc);
            }
          }
        }
        segStart = c; segPrev = c;
      }
    }

    // 3) For each column, perform the same logic (vertical runs)
    for (const ccStr of Object.keys(colMap)) {
      const cc = parseInt(ccStr,10);
      const rows = colMap[cc].slice().sort((a,b)=>a-b);
      let segStart = null, segPrev = null;
      for (const r of rows.concat([null])) {
        if (segStart === null) { segStart = r; segPrev = r; continue; }
        if (r !== null && r === segPrev + 1) { segPrev = r; continue; }
        if (segStart !== null && segPrev !== null) {
          const segLen = segPrev - segStart + 1;
          if (segLen >= 3) {
            if (boss && (cc === boss.c || (Math.abs(cc - boss.c) === 0 && (boss.r >= segStart-1 && boss.r <= segPrev+1)))) {
              for (let rr = segStart; rr <= segPrev; rr++) addHitFor(rr, cc);
            } else if (boss && cc === boss.c && (boss.r >= segStart && boss.r <= segPrev)) {
              for (let rr = segStart; rr <= segPrev; rr++) addHitFor(rr, cc);
            }
            for (let rr = segStart; rr <= segPrev; rr++) {
              if (boss && ((rr === boss.r && Math.abs(cc - boss.c) === 1) || (cc === boss.c && Math.abs(rr - boss.r) === 1))) addHitFor(rr, cc);
            }
          } else if (segLen === 2) {
            // Special-case vertical two-Common runs adjacent to boss
            const p1 = posByKey[keyFor(segStart, cc)];
            const p2 = posByKey[keyFor(segPrev, cc)];
            const bothCommons = p1 && p2 && p1.cell && p2.cell && p1.cell.rarity === 'Common' && p2.cell.rarity === 'Common';
            if (bothCommons && boss) {
              if (cc === boss.c && (boss.r === segStart - 1 || boss.r === segPrev + 1)) {
                for (let rr = segStart; rr <= segPrev; rr++) addHitFor(rr, cc);
              }
              for (let rr = segStart; rr <= segPrev; rr++) {
                if ((rr === boss.r && Math.abs(cc - boss.c) === 1) || (cc === boss.c && Math.abs(rr - boss.r) === 1)) addHitFor(rr, cc);
              }
            }
          } else {
            for (let rr = segStart; rr <= segPrev; rr++) {
              if (boss && ((rr === boss.r && Math.abs(cc - boss.c) === 1) || (cc === boss.c && Math.abs(rr - boss.r) === 1))) addHitFor(rr, cc);
            }
          }
        }
        segStart = r; segPrev = r;
      }
    }
    try {
      game && game.appendToDebug && game.appendToDebug('onShatterResolved computed hits=' + hits + ' details=' + JSON.stringify(hitDetails));
      console.debug && console.debug('onShatterResolved result', { hits, hitDetails });
    } catch (e) {}
  } catch (e) {}
  if (hits > 0) {
    boss.hitsRemaining = Math.max(0, (boss.hitsRemaining || 0) - hits);
  renderOverlay();
  try { game && game.setBossOnBoard && game.setBossOnBoard(boss); } catch (e) {}
    // ensure the main renderer updates any in-cell boss overlays immediately
    try { game && game.renderBoard && game.renderBoard(); } catch (e) {}
    if (boss.hitsRemaining <= 0) {
      // boss defeated: remove boss and trigger a reward/visual
  try { game.appendToDebug && game.appendToDebug('Boss defeated'); } catch (e) {}
      try { game.onBossDefeated && game.onBossDefeated(boss); } catch (e) {}
  try { game.appendToDebug && game.appendToDebug('Clearing boss state and marker (pre) window.__BOSS_MARKER=' + (typeof window !== 'undefined' ? JSON.stringify(window.__BOSS_MARKER) : '<no-window>')); } catch (e) {}
  boss = null; clearOverlay();
  try { game.setBossOnBoard && game.setBossOnBoard(null); } catch (e) {}
  try { if (typeof window !== 'undefined') window.__BOSS_MARKER = null; } catch (e) {}
  try { game.appendToDebug && game.appendToDebug('Cleared boss marker (post) window.__BOSS_MARKER=' + (typeof window !== 'undefined' ? JSON.stringify(window.__BOSS_MARKER) : '<no-window>')); } catch (e) {}
  try { game && game.renderBoard && game.renderBoard(); } catch (e) {}
    }
  }
}

function onMoveAdvance() {
  // called after moveCount increments when player made a move
  if (!boss) return;
  try {
    // Activate destructive behavior only after the configured threshold moves have completed.
    const tick = game.moveCount || 0;
    const threshold = Number(opts.destructiveMoveThreshold || 0);
    const ticksSinceThreshold = tick - threshold;
    try { game && game.appendToDebug && game.appendToDebug('onMoveAdvance tick=' + tick + ' threshold=' + threshold + ' destructiveActive=' + !!boss.destructiveActive + ' lastDestructiveTick=' + (boss.lastDestructiveTick||0)); } catch (e) {}
    if (!boss.destructiveActive && ticksSinceThreshold >= 0) {
      boss.destructiveActive = true;
      try { game && game.appendToDebug && game.appendToDebug('Boss destructive behavior activated at move ' + tick); } catch (e) {}
    }
    // If destructive is active, decide whether this particular move should trigger a destructive sweep.
    if (boss.destructiveActive) {
      // If configured to every-other-move, compute parity since threshold (0 => first destroy at threshold)
      const shouldDestroy = !opts.destructiveEveryOtherMove || (ticksSinceThreshold >= 0 && ((ticksSinceThreshold % 2) === 0));
      try { game && game.appendToDebug && game.appendToDebug('onMoveAdvance shouldDestroy=' + shouldDestroy + ' ticksSinceThreshold=' + ticksSinceThreshold); } catch (e) {}
      if (shouldDestroy && boss.lastDestructiveTick !== tick) {
        // destroy orthogonally adjacent tiles
        const toClear = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (Math.abs(dr) + Math.abs(dc) !== 1) continue;
          const rr = boss.r + dr, cc = boss.c + dc;
          if (rr < 0 || rr >= game.BOARD_ROWS || cc < 0 || cc >= game.BOARD_COLS) continue;
          toClear.push({ r: rr, c: cc });
        }
        // remove them from board and award shards for non-mine tiles
        let removedAny = false;
  for (const p of toClear) {
          const rem = game.getCellAt && game.getCellAt(p.r, p.c);
          if (rem) {
            removedAny = true;
            try {
              if (!(rem.templateId === '__MINE__' || rem.rarity === 'Mine')) {
                const shardMap = { 'Common': 5, 'Rare': 10, 'Epic': 40 };
                const shards = shardMap[rem.rarity] || 0;
                game.awardShards && game.awardShards(rem.type || 'Unknown', shards);
                try { game.totalShatters = (typeof game.totalShatters === 'number') ? game.totalShatters + 1 : 1; } catch (e) {}
              }
            } catch (e) {}
      game.removeCellAt && game.removeCellAt(p.r, p.c);
          }
        }
    // mark last tick so we don't run multiple times for same move
    boss.lastDestructiveTick = tick;
    game.renderBoard && game.renderBoard();
    return removedAny;
      }
    }
  } catch (e) {}
  return false;
}

// Dev controls
function setDevOptions(o) {
  // Update runtime options from dev UI without forcibly resetting boss HP.
  // The dev UI should only apply new configuration; it must not refill or pin the boss's hits.
  const prevReq = opts.requiredHits;
  try { game && game.appendToDebug && game.appendToDebug('setDevOptions called: ' + JSON.stringify(o) + ' prevOpts=' + JSON.stringify(opts) + ' bossHP=' + (boss?boss.hitsRemaining:'<none>')); } catch (e) {}
  try { console.debug && console.debug('setDevOptions', { o, prevOpts: opts, boss }); } catch (e) {}
  opts = { ...opts, ...(o || {}) };
  // If requiredHits was reduced below current HP, clamp down to avoid an inconsistent state.
  try {
    if (boss && typeof boss.hitsRemaining === 'number' && typeof opts.requiredHits === 'number' && boss.hitsRemaining > opts.requiredHits) {
      boss.hitsRemaining = opts.requiredHits;
    }
  } catch (e) {}
  // If a boss is active, immediately apply threshold/dev changes so they affect the current boss
  try {
    if (boss) {
      const tick = game && game.moveCount ? Number(game.moveCount) : 0;
      const threshold = Number(opts.destructiveMoveThreshold || 0);
      // Activate destructiveActive immediately if we've reached the threshold
      boss.destructiveActive = (tick - threshold) >= 0;
      try { game && game.appendToDebug && game.appendToDebug('setDevOptions: applied to active boss: destructiveActive=' + boss.destructiveActive + ' tick=' + tick + ' threshold=' + threshold); } catch (e) {}
      try { game && game.setBossOnBoard && game.setBossOnBoard(boss); } catch (e) {}
    }
  } catch (e) {}
  renderOverlay();
  try { game && game.renderBoard && game.renderBoard(); } catch (e) {}
}

function getStateForSave() { return { boss: boss ? { ...boss } : null, opts: { ...opts } }; }

function applyDamage(amount) {
  try {
    if (!boss) return false;
    const dmg = Number(amount) || 0;
    if (dmg <= 0) return false;
    boss.hitsRemaining = Math.max(0, (boss.hitsRemaining || 0) - dmg);
    renderOverlay();
    try { game && game.setBossOnBoard && game.setBossOnBoard(boss); } catch (e) {}
  try { game && game.renderBoard && game.renderBoard(); } catch (e) {}
    try { game && game.appendToDebug && game.appendToDebug('applyDamage: ' + dmg + ' -> boss.hp=' + boss.hitsRemaining); } catch (e) {}
    if (boss.hitsRemaining <= 0) {
      try { game && game.appendToDebug && game.appendToDebug('Boss defeated'); } catch (e) {}
      try { game.onBossDefeated && game.onBossDefeated(boss); } catch (e) {}
      boss = null; clearOverlay();
      try { game.setBossOnBoard && game.setBossOnBoard(null); } catch (e) {}
  try { game && game.renderBoard && game.renderBoard(); } catch (e) {}
    }
    return true;
  } catch (e) { return false; }
}

function getBoss() { return boss ? { ...boss } : null; }

export default { init, setState, spawnIfEligible, onShatterResolved, onMoveAdvance, renderOverlay, setDevOptions, getStateForSave, applyDamage, getBoss };
