// Factory for merge preview UI logic extracted from main.js
export function makeMergePreview(ctx) {
  const { getBoard, getSelected, getInventory, buildMiniShape, predictMergeResult, requiredTotalForBaseCell, appendToDebug, evaluateMergeAttempt, isDisabledByMine, getMergeSelecting, clearCandidateHighlights, setMergeSelecting } = ctx;

  function updateMergePreview(alwaysShow = false) {
    const boardDiv = document.getElementById('game-board');
    if (!boardDiv) return;
    let preview = document.getElementById('merge-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'merge-preview';
      preview.style.position = 'absolute';
      preview.style.top = '-56px';
      preview.style.right = '0';
      preview.style.display = 'flex';
      preview.style.gap = '8px';
      preview.style.pointerEvents = 'auto';
      preview.style.zIndex = '30';
      preview.style.padding = '6px';
      boardDiv.appendChild(preview);
    }
    preview.innerHTML = '';

    let tileSize = 64;
    try {
      const sampleCell = boardDiv.querySelector('.module-cell');
      if (sampleCell) {
        const rect = sampleCell.getBoundingClientRect();
        if (rect && rect.width > 0) tileSize = Math.round(rect.width);
      }
    } catch (e) { }
    const slotSize = Math.max(40, Math.round(tileSize * 0.9));
    const miniSize = Math.max(28, Math.round(slotSize * 0.9));

    try {
      preview.style.top = '-' + (slotSize + 12) + 'px';
      preview.style.right = '0';
    } catch (e) { }

    const selected = getSelected();
    const inventory = getInventory();

    const normalizedSel = selected.map(s => {
      if (!s) return null;
      if (s.inv) return { cell: inventory[s.inv] || s.cell, inv: s.inv };
      if (typeof s.r === 'number' && typeof s.c === 'number') return { cell: (getBoard()[s.r] && getBoard()[s.r][s.c]) || s.cell, r: s.r, c: s.c };
      return s;
    });
    const baseCell = (normalizedSel[0] && normalizedSel[0].cell) || null;
    const fod1 = (normalizedSel[1] && normalizedSel[1].cell) || null;
    const fod2 = (normalizedSel[2] && normalizedSel[2].cell) || null;
    let predicted = null;
    try {
      const requiredForBase = baseCell ? requiredTotalForBaseCell(baseCell) : 0;
      const selCount = normalizedSel.filter(s => !!s).length;
      try { appendToDebug && appendToDebug('updateMergePreview: normalizedSel=' + JSON.stringify(normalizedSel.map(s => ({ templateId: s && s.cell && s.cell.templateId, rarity: s && s.cell && s.cell.rarity, plus: s && s.cell && s.cell.plus, inv: s && s.inv, r: s && s.r, c: s && s.c }))) + ' required=' + requiredForBase + ' selCount=' + selCount); } catch (e) {}
      if (baseCell && selCount === requiredForBase) {
        const rawPred = predictMergeResult(normalizedSel);
        if (rawPred) {
          predicted = {
            templateId: rawPred.templateId || (baseCell && baseCell.templateId),
            type: rawPred.type || (baseCell && baseCell.type),
            rarity: rawPred.rarity || (baseCell && baseCell.rarity),
            plus: rawPred.plus || false,
            shape: rawPred.shape || (baseCell && baseCell.shape),
            initials: rawPred.initials || (baseCell && baseCell.initials),
            unique: typeof rawPred.unique !== 'undefined' ? rawPred.unique : (baseCell && baseCell.unique),
            stars: typeof rawPred.stars !== 'undefined' ? rawPred.stars : (baseCell && baseCell.stars),
          };
        } else predicted = null;
        try { appendToDebug && appendToDebug('updateMergePreview: predicted(sanitized)=' + JSON.stringify(predicted)); } catch (e) {}
        try { console.debug && console.debug('updateMergePreview predicted', predicted); } catch (e) {}
      }
    } catch (e) { predicted = null; }

    const slots = [ { kind: 'base', cell: baseCell }, { kind: 'fod1', cell: fod1 }, { kind: 'fod2', cell: fod2 }, { kind: 'predicted', cell: predicted } ];

    for (let i = 0; i < slots.length; i++) {
      const info = slots[i];
      const slot = document.createElement('div');
      slot.className = 'merge-slot';
      slot.dataset.kind = info.kind;
      slot.style.position = 'relative';
      slot.style.width = slotSize + 'px';
      slot.style.height = slotSize + 'px';
      slot.style.background = '#0f0f0f';
      slot.style.border = '1px solid #333';
      slot.style.display = 'flex';
      slot.style.alignItems = 'center';
      slot.style.justifyContent = 'center';
      slot.style.boxSizing = 'border-box';
      slot.style.borderRadius = '6px';

      if (info.cell && info.cell.rarity && info.cell.rarity !== 'Common') {
        slot.appendChild(buildMiniShape(info.cell, miniSize));
        slot.dataset.rarity = info.cell.rarity;
      }

      preview.appendChild(slot);

      if (i === 3) {
        slot.classList.add('predicted-slot');
        const baseSel = selected[0];
        const baseCell = baseSel && baseSel.cell ? baseSel.cell : null;
        const required = requiredTotalForBaseCell(baseCell);
        const ready = selected.length === required;
        slot.style.pointerEvents = ready ? 'auto' : 'none';
        slot.style.cursor = ready ? 'pointer' : 'default';
        slot.style.opacity = '1';
        slot.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (!ready) return;
          if (getMergeSelecting && getMergeSelecting() && selected.length > 0) {
              try { if (clearCandidateHighlights) clearCandidateHighlights(); } catch(e){}
              try { if (setMergeSelecting) setMergeSelecting(false); } catch(e){}
              evaluateMergeAttempt();
            }
        });
      }

      if (i < slots.length - 1) {
        const sep = document.createElement('div');
        if (i === slots.length - 2) {
          sep.className = 'merge-equals';
          sep.textContent = '=';
          sep.style.pointerEvents = 'none';
          sep.style.cursor = 'default';
        } else {
          sep.className = 'merge-plus';
          sep.textContent = '+';
          sep.style.pointerEvents = 'none';
        }
        preview.appendChild(sep);
      }
    }

    if (selected.length === 0 && !alwaysShow) preview.style.display = 'none'; else preview.style.display = 'flex';
  }

  return { updateMergePreview };
}
