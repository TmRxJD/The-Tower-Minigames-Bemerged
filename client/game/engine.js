// Pure game engine utilities extracted from main.js
// These functions are intentionally pure/minimal and operate on provided board and params.
export { hasStraightTriple, extractStraightRunPositions, floodFillGroup, findAllGroups } from './matcher.js';
export function predictMergeResult(sel) {
  if (!sel || sel.length === 0) return null;
  const base = sel[0].cell;
  if (!base) return null;
  if (sel.length === 3 && base.rarity === 'Rare' && base.plus && sel.slice(1).every(s => s && s.cell && s.cell.rarity === 'Rare' && s.cell.plus && s.cell.type === base.type)) {
    return { ...base, rarity: 'Epic', plus: false };
  }
  if (sel.length === 3 && sel.every(s => s.cell.rarity === 'Rare' && !s.cell.plus) && sel.every(s => s.cell.templateId === sel[0].cell.templateId)) {
    return { ...base, rarity: 'Rare', plus: true };
  }
  if (sel.length === 2) {
    const allEpicNonPlus = sel.every(s => s && s.cell && s.cell.rarity === 'Epic' && !s.cell.plus);
    const sameTemplate = sel.every(s => s && s.cell && s.cell.templateId === sel[0].cell.templateId);
    if (allEpicNonPlus && sameTemplate) return { ...base, rarity: 'Epic', plus: true };
  }
  return { ...base };
}

export function sameTemplate(a, b) { return a.cell.templateId === b.cell.templateId; }

export function canBeFodder(baseCell, candidateCell, isDisabledByMine) {
  if (!baseCell || !candidateCell) return false;
  try { if (isDisabledByMine && isDisabledByMine(candidateCell)) return false; if (isDisabledByMine && isDisabledByMine(baseCell)) return false; } catch (e) {}
  if (candidateCell.rarity === 'Common' || baseCell.rarity === 'Common') return false;
  if (candidateCell.type !== baseCell.type) return false;
  if (baseCell.rarity === 'Rare' && !baseCell.plus) return candidateCell.rarity === 'Rare' && !candidateCell.plus && candidateCell.templateId === baseCell.templateId;
  if (baseCell.rarity === 'Rare' && baseCell.plus) return !!candidateCell.plus && candidateCell.type === baseCell.type && candidateCell.rarity === 'Rare';
  if (baseCell.rarity === 'Epic' && !baseCell.plus) return candidateCell.rarity === 'Epic' && !candidateCell.plus && candidateCell.templateId === baseCell.templateId;
  if (baseCell.rarity === 'Epic' && baseCell.plus) return candidateCell.rarity === 'Epic' && candidateCell.plus === true && candidateCell.type === baseCell.type;
  if (baseCell.rarity === 'Legendary' && !baseCell.plus) return candidateCell.rarity === 'Epic' && candidateCell.plus === true && candidateCell.templateId === baseCell.templateId;
  if (baseCell.rarity === 'Legendary' && baseCell.plus) return candidateCell.rarity === 'Legendary' && candidateCell.plus === true && candidateCell.type === baseCell.type;
  if (baseCell.rarity === 'Mythic' && !baseCell.plus) return candidateCell.rarity === 'Legendary' && candidateCell.plus === true;
  if (baseCell.rarity === 'Mythic' && baseCell.plus) return candidateCell.rarity === 'Epic' && candidateCell.plus === true;
  if (baseCell.rarity === 'Ancestral') return candidateCell.rarity === 'Epic' && candidateCell.plus === true;
  return false;
}

export function requiredTotalForBaseCell(baseCell) {
  if (!baseCell) return Infinity;
  const r = baseCell.rarity; const plus = !!baseCell.plus; const key = r + (plus ? '+' : '');
  switch (key) {
    case 'Rare': return 3;
    case 'Rare+': return 3;
    case 'Epic': return 2;
    case 'Epic+': return 3;
    case 'Legendary': return 2;
    case 'Legendary+': return 2;
    case 'Mythic': return 2;
    case 'Mythic+': return 3;
    case 'Ancestral': return 3;
    default: return Infinity;
  }
}

// Matcher implementations moved to ./matcher.js and re-exported above.
