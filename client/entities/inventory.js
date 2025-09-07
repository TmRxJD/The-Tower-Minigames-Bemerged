// Inventory helpers: centralize simple inventory operations used by main.js
export function makeInventoryHelpers(ctx = {}) {
  const getBoard = ctx.getBoard || (() => []);
  const getInventory = ctx.getInventory || (() => ({}));
  const setCellAt = ctx.setCellAt || ((r,c,v)=>{ const b = getBoard(); if (!b[r]) b[r]=[]; b[r][c]=v; });
  const setInventorySlot = ctx.setInventorySlot || ((t,v)=>{ const inv = getInventory(); inv[t]=v; });
  const renderBoard = ctx.renderBoard || (()=>{});
  const renderInventory = ctx.renderInventory || (()=>{});
  const cascadeResolve = ctx.cascadeResolve || (()=>{});
  const appendToDebug = ctx.appendToDebug || (()=>{});
  const getBossMarker = ctx.getBossMarker || (() => (typeof window !== 'undefined' ? window.__BOSS_MARKER : null));

  function canUseInventory() {
    try {
      const bm = getBossMarker();
      if (bm) return false;
    } catch (e) {}
    return true;
  }

  // Attempt to pick up a board cell into its typed inventory slot.
  // Returns true if pickup happened.
  function pickUpToInventory(r, c) {
    const board = getBoard();
    if (!board || !board[r] || !board[r][c]) return false;
    if (!canUseInventory()) {
      appendToDebug && appendToDebug && appendToDebug('Inventory action blocked: Boss present on board');
      try { if (typeof window !== 'undefined') alert && alert('Cannot pick up or swap tiles while a Boss is present on the board.'); } catch (e) {}
      return false;
    }
    const cell = board[r][c];
    const slotType = cell && cell.type;
    if (!slotType) return false;
    const inv = getInventory();
    if (!inv[slotType]) {
      setInventorySlot(slotType, cell);
      setCellAt(r, c, null);
      try { renderBoard(); renderInventory(); } catch (e) {}
      try { cascadeResolve(); } catch (e) {}
      return true;
    }
    return false;
  }

  // Swap a board cell at r,c with the inventory slot for `type`.
  // If the inventory slot is empty, this becomes a pickup.
  function swapWithInventory(r, c, type) {
    const board = getBoard();
    if (!board || !board[r]) return false;
    if (!canUseInventory()) {
      appendToDebug && appendToDebug && appendToDebug('Inventory action blocked: Boss present on board');
      try { if (typeof window !== 'undefined') alert && alert('Cannot pick up or swap tiles while a Boss is present on the board.'); } catch (e) {}
      return false;
    }
    const inv = getInventory();
    const cell = board[r][c];
    // If inventory slot empty -> move selected tile into inventory
    if (!inv[type]) {
      setInventorySlot(type, cell);
      setCellAt(r, c, null);
    } else {
      const tmp = inv[type];
      setInventorySlot(type, cell);
      setCellAt(r, c, tmp);
    }
    try { renderBoard(); renderInventory(); } catch (e) {}
    try { cascadeResolve(); } catch (e) {}
    return true;
  }

  // Place the inventory slot `type` into board position r,c if empty.
  // Returns true if placement happened.
  function placeFromInventoryAt(type, r, c) {
    if (!canUseInventory()) {
      appendToDebug && appendToDebug && appendToDebug('Placing from inventory blocked: Boss present on board');
      try { if (typeof window !== 'undefined') alert && alert('Cannot place inventory tiles while a Boss is present on the board.'); } catch (e) {}
      return false;
    }
    const board = getBoard();
    if (!board) return false;
    if (board[r] && board[r][c]) return false; // only place into empty
    const inv = getInventory();
    const mod = inv[type];
    if (!mod) return false;
    setCellAt(r, c, mod);
    setInventorySlot(type, null);
    try { renderBoard(); renderInventory(); } catch (e) {}
    try { cascadeResolve(); } catch (e) {}
    return true;
  }

  // Light-weight predicate for whether the inventory slot can be placed at r,c
  function canPlace(type, r, c) {
    try {
      if (!canUseInventory()) return false;
      const board = getBoard();
      if (!board) return false;
      if (board[r] && board[r][c]) return false;
      const inv = getInventory();
      return !!inv[type];
    } catch (e) { return false; }
  }

  return { pickUpToInventory, swapWithInventory, placeFromInventoryAt, canPlace, canUseInventory };
}
