# BeMerged Client Architecture Contract

This file is the source of truth for how the game is structured. If a change violates these rules, refactor the change.

## 1) Layer ownership

- `engine/GameEngine.ts`
  - Pure game state transitions and rules.
  - No DOM access.
  - No Phaser access.
  - Input: typed commands (`applyMove`, `applyMergeSelectionIfReady`, etc).
  - Output: deterministic state.
  - Owns merge rule decisions and validation through:
    - `getMergeCandidates`
    - `getMergeSelectionState`
    - `applyMergeSelectionIfReady`
  - Owns merge interaction session state through:
    - `startMergeSession`
    - `toggleMergeSessionCell`
    - `confirmMergeSession`
    - `cancelMergeSession`
    - `getMergeSessionSnapshot`
  - Owns move validity rules:
    - only strict, engine-valid swaps are executable
    - no permissive fallback move generation

- `engine/catalog.ts`
  - Token factory and visual identity generation.
  - Every token gets deterministic visual fields:
    - `frameSrc`, `assetSrc`
    - `frameTextureKey`, `assetTextureKey`
  - Scene/UI must consume token visuals from token data only.

- `engine/Match3Scene.ts`
  - Phaser rendering + input orchestration.
  - Must not invent token visuals.
  - Must render board and merge preview from token texture keys only.
  - Must not duplicate merge rule validation logic from engine.
  - Must not store parallel merge session state outside engine.

- `ui/hudController.ts`
  - DOM HUD panel only.
  - No game-rule logic.
  - Receives state snapshots and renders them.

- `standalone.ts`
  - Composition root only.
  - Wires scene + HUD + bridge.

## 2) Deterministic rendering rules

- Token visual identity is created once in catalog and is immutable for that token instance.
- Scene rendering uses `token.frameTextureKey` and `token.assetTextureKey`.
- Preview/board/inventory/HUD display must use the same token source object; no alternate mapping tables.
- If a texture is not in Phaser cache, scene may lazy-load by token visual fields and then re-render (no scene-side key derivation fallback).

## 3) Change protocol

When changing gameplay behavior:
1. Update engine state transition first.
2. Update scene command flow second.
3. Update HUD display last.
4. Keep merge validation in engine methods only; scene should consume engine merge state.

When changing visuals:
1. Update module asset resolution in `moduleData.ts` / `catalog.ts`.
2. Verify token visual fields remain complete.
3. Do not add scene-side ad-hoc URL/key transforms.

## 4) Anti-patterns (not allowed)

- Rule logic in HUD/controller files.
- Scene deriving gameplay state by reading DOM.
- Multiple visual identity systems for the same token.
- Hidden fallback paths that bypass typed game flow.
- DOM-rendered merge preview that diverges from Phaser-rendered board state.

## 5) Validation checklist

- `pnpm --dir ./games/bemerged/client type-check`
- `pnpm --dir ./games/bemerged/client build`
- Embedded route run: `/games/bemerged`
- Manual merge verification:
  - Phaser preview token visual == resulting board token visual
  - no missing textures in console
