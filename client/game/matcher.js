// Matcher utilities extracted from engine.js
export function hasStraightTriple(group) {
  if (!group || group.length < 3) return false;
  const byRow = {}; const byCol = {};
  for (const p of group) { byRow[p.r] = byRow[p.r] || new Set(); byRow[p.r].add(p.c); byCol[p.c] = byCol[p.c] || new Set(); byCol[p.c].add(p.r); }
  for (const rKey in byRow) {
    const cols = Array.from(byRow[rKey]).map(Number).sort((a,b)=>a-b); let run = 1;
    for (let i=1;i<cols.length;i++){ if (cols[i]===cols[i-1]+1){ run++; if (run>=3) return true; } else run=1; }
  }
  for (const cKey in byCol) {
    const rows = Array.from(byCol[cKey]).map(Number).sort((a,b)=>a-b); let run = 1;
    for (let i=1;i<rows.length;i++){ if (rows[i]===rows[i-1]+1){ run++; if (run>=3) return true; } else run=1; }
  }
  return false;
}

export function extractStraightRunPositions(group) {
  const outMap = new Map(); if (!group || group.length === 0) return [];
  const byRow = {}; const byCol = {};
  for (const p of group) { byRow[p.r] = byRow[p.r] || new Set(); byRow[p.r].add(p.c); byCol[p.c] = byCol[p.c] || new Set(); byCol[p.c].add(p.r); }
  for (const rKey in byRow) {
    const cols = Array.from(byRow[rKey]).map(Number).sort((a,b)=>a-b);
    if (!cols || cols.length === 0) continue;
    let run = [cols[0]];
    for (let i=1;i<=cols.length;i++){
      const cur = cols[i]; const prev = cols[i-1];
      if (cur === prev + 1) run.push(cur);
      else {
        if (run.length >= 3) for (const c of run) outMap.set(rKey + ',' + c, { r: Number(rKey), c });
        run = cur !== undefined ? [cur] : [];
      }
    }
  }
  for (const cKey in byCol) {
    const rows = Array.from(byCol[cKey]).map(Number).sort((a,b)=>a-b);
    if (!rows || rows.length === 0) continue;
    let run = [rows[0]];
    for (let i=1;i<=rows.length;i++){
      const cur = rows[i]; const prev = rows[i-1];
      if (cur === prev + 1) run.push(cur);
      else {
        if (run.length >= 3) for (const r of run) outMap.set(r + ',' + cKey, { r, c: Number(cKey) });
        run = cur !== undefined ? [cur] : [];
      }
    }
  }
  return Array.from(outMap.values());
}

export function floodFillGroup(board, sr, sc, includePredicate = null, BOARD_ROWS, BOARD_COLS) {
  const startCell = (board && board[sr] && board[sr][sc]) ? board[sr][sc] : null;
  if (!startCell) return [];
  const groupingIsType = startCell.rarity === 'Common';
  const seen = new Set(); const stack = [{ r: sr, c: sc }]; const out = [];
  while (stack.length) {
    const { r, c } = stack.pop();
    if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) continue;
    const key = r + ',' + c; if (seen.has(key)) continue; seen.add(key);
    const cell = (board && board[r] && board[r][c]) ? board[r][c] : null;
    if (!cell) continue; if (includePredicate && !includePredicate(cell)) continue;
    if (groupingIsType) { if (!(cell.rarity === 'Common' && cell.type === startCell.type)) continue; } else { if (cell.templateId !== startCell.templateId) continue; }
    out.push({ r, c }); stack.push({ r: r - 1, c }); stack.push({ r: r + 1, c }); stack.push({ r, c: c - 1 }); stack.push({ r, c: c + 1 });
  }
  return out;
}

export function findAllGroups(board, predicate, BOARD_ROWS, BOARD_COLS) {
  const seen = new Set(); const groups = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const key = r + ',' + c; if (seen.has(key)) continue;
      const cell = (board && board[r] && board[r][c]) ? board[r][c] : null;
      if (!cell) continue; if (!predicate(cell)) continue;
      const groupingIsType = cell.rarity === 'Common'; const stack = [{ r, c }]; const group = [];
      while (stack.length) {
        const p = stack.pop(); const k = p.r + ',' + p.c; if (seen.has(k)) continue; const cur = board[p.r] && board[p.r][p.c]; if (!cur) continue; if (!predicate(cur)) continue;
        const curCell = (board && board[p.r] && board[p.r][p.c]) ? board[p.r][p.c] : null;
        if (!curCell) continue;
        if (groupingIsType) { if (!(curCell.rarity === 'Common' && curCell.type === cell.type)) continue; } else { if (curCell.templateId !== cell.templateId) continue; }
        seen.add(k); group.push(p);
        // push orthogonal neighbors (use p.c, not p.p)
        stack.push({ r: p.r - 1, c: p.c }); stack.push({ r: p.r + 1, c: p.c }); stack.push({ r: p.r, c: p.c - 1 }); stack.push({ r: p.r, c: p.c + 1 });
      }
      if (group.length) groups.push(group);
    }
  }
  return groups;
}
