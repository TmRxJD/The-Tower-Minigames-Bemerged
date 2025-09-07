export function makeInventoryUI(ctx) {
  const { getInventory, setInventorySlot, getSelected, setSelected, getBoard, setBoardCell, getPlacingFromInventory, setPlacingFromInventory, buildMiniShape, renderBoard, renderInventory: hostRenderInventory, cascadeResolve, appendToDebug, canBeFodder, requiredTotalForBaseCell, makeInventoryHelpers, getBossMarker, positionDebugPortal, ensureDebugConsole } = ctx;

  function renderInventory() {
    const invEl = document.getElementById('inventory');
    if (!invEl) return;
    try { ensureDebugConsole && ensureDebugConsole(); } catch (e) {}
    const debugWrap = document.getElementById('debug-console-wrap');
    if (debugWrap && debugWrap.parentNode === invEl) invEl.removeChild(debugWrap);
    invEl.innerHTML = '';
    const types = ['Cannon', 'Generator', 'Armor', 'Core'];
    const inventory = getInventory();
    const selected = getSelected();
    for (const t of types) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      slot.dataset.type = t;
      slot.style.border = (getPlacingFromInventory && getPlacingFromInventory() === t) ? '3px solid #fff' : '1px solid #444';
      slot.style.position = 'relative'; slot.style.overflow = 'visible';
      const content = inventory[t];
      if (content) {
        const mini = buildMiniShape(content, 84, { useVectorOnly: ctx.useVectorOnly, RARITY_COLOR: ctx.RARITY_COLOR, ASSETS: ctx.ASSETS, HARDCODED_COMMON_SELECTION: ctx.HARDCODED_COMMON_SELECTION, MINE_ASSET: ctx.MINE_ASSET, appendToDebug });
        mini.classList.add('inv-shape');
        slot.appendChild(mini);
      } else {
        const placeholder = document.createElement('div'); placeholder.className = 'inv-initials'; placeholder.textContent = t[0]; slot.appendChild(placeholder);
      }
      slot.addEventListener('click', () => onInventoryClick(t));
      const selIdx = selected.findIndex(s => s && s.inv === t);
      if (selIdx >= 0) {
        const badge = document.createElement('div'); badge.className = 'selection-badge inv-badge'; badge.textContent = String(selIdx + 1); slot.appendChild(badge);
        slot.classList.add(selIdx === 0 ? 'selected-base' : 'selected-fodder');
      }
      invEl.appendChild(slot);
    }
    try { positionDebugPortal && positionDebugPortal(); } catch (e) {}
  }

  function onInventoryClick(type) {
    try {
      if (getBossMarker && getBossMarker()) {
        appendToDebug && appendToDebug('Inventory action blocked: Boss present on board');
        alert('Cannot use inventory while a Boss is present on the board.');
        return;
      }
    } catch (e) {}
    if (typeof window !== 'undefined' && window.hintMove) { window.hintMove = null; try { renderBoard(); } catch (e) {} }

    if (getPlacingFromInventory && getPlacingFromInventory()) {
      if (getPlacingFromInventory() === type) setPlacingFromInventory(null); else setPlacingFromInventory(type);
      try { renderInventory(); } catch (e) {}
      return;
    }

    const selected = getSelected();
    const inventory = getInventory();
    if (selected.length === 0) {
      if (!inventory[type]) return;
      const newSel = selected.slice(); newSel.push({ inv: type, cell: inventory[type] }); setSelected(newSel);
      try { renderBoard(); renderInventory(); } catch (e) {}
      return;
    }

    const base = selected[0];
    if (base && base.inv === type) {
      if (typeof base._suppressClick !== 'undefined') { try { delete base._suppressClick; } catch (e) {} try { renderBoard(); } catch (e) {} return; }
      if (typeof window !== 'undefined' && window.mergeSelecting) { try { window.mergeSelecting = false; window.candidateHighlights && window.candidateHighlights.clear(); } catch(e){} }
      const idx = selected.findIndex(s => s && s.inv === type);
      if (idx >= 0) { const ns = selected.slice(); ns.splice(idx,1); setSelected(ns); }
      try { renderBoard(); renderInventory(); } catch (e) {}
      return;
    }

    if (typeof window !== 'undefined' && window.mergeSelecting) {
      if (!inventory[type]) return;
      const candidateCell = inventory[type];
      const baseCell = base.cell;
      if (canBeFodder && canBeFodder(baseCell, candidateCell)) {
        const required = requiredTotalForBaseCell(baseCell);
        const already = selected.findIndex(s => s && s.inv === type);
        const ns = selected.slice();
        if (already >= 0) ns.splice(already,1); else {
          if (ns.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
          ns.push({ inv: type, cell: candidateCell });
        }
        setSelected(ns);
        try { renderBoard(); renderInventory(); } catch (e) {}
        return;
      }
      return;
    }

    if (selected.length === 1 && base) {
      if (base.r !== undefined && base.c !== undefined && typeof base.r === 'number') {
        const invCell = inventory[type];
        const sCell = getBoard()[base.r] && getBoard()[base.r][base.c] ? getBoard()[base.r][base.c] : null;
        if (sCell && sCell.type === type) {
          if (!invCell) {
            setInventorySlot(type, sCell);
            setBoardCell(base.r, base.c, null);
          } else {
            const tmp = invCell;
            setInventorySlot(type, sCell);
            setBoardCell(base.r, base.c, tmp);
          }
          setSelected([]);
          try { renderBoard(); renderInventory(); cascadeResolve(); } catch (e) {}
          return;
        }
        if (invCell && canBeFodder && canBeFodder(base.cell, invCell)) {
          const already = selected.findIndex(s => s && s.inv === type);
          const ns = selected.slice();
          if (already >= 0) ns.splice(already,1); else {
            const required = requiredTotalForBaseCell(base.cell);
            if (ns.length >= required) { appendToDebug && appendToDebug('Cannot add more fodder: merge requires only ' + required + ' total selections'); return; }
            ns.push({ inv: type, cell: invCell });
          }
          setSelected(ns);
          try { renderBoard(); renderInventory(); } catch (e) {}
          return;
        }
      }
    }
  }

  return { renderInventory, onInventoryClick };
}