---
applyTo: '**/*.js,**/*.ts,**/*.jsx,**/*.tsx,**/*.json,**/*.md,**/*.css,**/*.scss,**/*.html,**/*.vue,'
---
Plan summary

Show final file tree with purpose for each file/folder.
Give short API/contract guidance so breaking things up stays safe.
Give migration notes (Vue + TS + Discord runtime detection) and recommended extraction order.
Ask whether to start extracting the engine first.

Final proposed file/folder structure (client/)
main.js

Thin orchestrator only: imports modules, owns runtime state (board, inventory, selected), wires DOM events, calls engine/ui functions.

assets/
index.js — central re-exports for images and ASSETS map (eager imports kept here)
backgrounds.js — BACKGROUNDS map + background helpers
modules_index.js — mapping of type image tokens (can_type, arm_type, etc.)
-----
game/ (pure game logic, testable)
engine.js — predictMergeResult, evaluateMergeAttempt (logic-only), requiredTotalForBaseCell
rules.js — MERGE_SEQUENCE, RARITY_RANK, BASE_RATES, rule helpers
matcher.js — floodFillGroup, findAllGroups, hasStraightTriple, extractStraightRunPositions
cascade.js — collapseColumns, refillBoard, cascadeResolve pipeline (may call matcher/engine)
spawn.js — rollRarity, makeDrop, spawnOfRarity, templates export (MODULE_TEMPLATES, RARE_TEMPLATES, COMMON_TEMPLATES)
stateHelpers.js — pure helpers to manipulate state slice (optional; keeps engine pure)

entities/ (game entities & special tiles)
moduleFactory.js — createModuleInstance, stableHash, normalizeId
mines.js — createMineInstance, mine countdown logic, pendingExplosions (will own mine rules)
boss.js — boss spawn, hit/damage logic, boss-specific checks (small API used by UI/engine)
inventory.js — inventory helpers (transfer, canPlace, pickUp)

ui/
renderBoard.js — renderBoard (DOM only, uses shapes, mini shapes)
shapes.js — buildShape, buildMiniShape, renderVectorMini (pure DOM builders)
mergePreview.js — updateMergePreview, preview slot interactions
controls.js — ensureControls, settings menu, hint button wiring
inventoryUI.js — renderInventory, onInventoryClick wiring
scoreTimer.js — ensureGameTimerPlaced, start/stop/reset timer, updateScoreUI
debugConsole.js — ensureDebugConsole, appendToDebug, debug portal positioning

features/ (feature-level modules that tie game logic to UI)
bossFeature.js — thin glue: calls boss.js and exposes the small functions main calls (init/notify/hit)
minesFeature.js — glue for mines: countdown tick, UI notifications
rarityRewards.js — awardShards wrapper and window exports (keeps window exports collected)

integrations/
discord.js — runtime detection + dynamic import: exports initDiscordIfEmbedded(), getChannelInfo(), noop stubs when not embedded
telemetry.js — analytics hooks (optional)

effects/ (Epic module unique effects — one file per Epic module)
index.js — effect registry: registerEffect(moduleId, { onEquip, onUnequip, onMerge, onTick })
AD.js, BA.js, DP.js, HB.js, A-CP.js, NMP.js, WR.js, SD.js, SH.js, GC.js, PH.js, BHD.js, OC.js, HC.js, DC.js, MVN.js
Each file exports a small interface: { id: 'AD', onEquip(state, ctx), onUnequip(state, ctx), onApplyEffect(args) }
effectsDevHelpers.js — test harness for effects

utils/
storage.js — saveGameState, loadGameState, localStorage guards
random.js — rand, uid
dom.js — tiny DOM helpers (createEl, setStyle) to reduce duplication
clamp.js / math.js — small utilities

types/ (when migrating to TypeScript)
index.d.ts or types.ts — ModuleInstance, Board, Selection, EffectSignature

tests/
engine.spec.js — unit tests for engine.predictMergeResult, matcher functions
matcher.spec.js
cascade.spec.js
Why this layout works for your goals

Main remains the single runner & state owner: easier to inspect and debug.
Pure logic (game/*) is separated for unit tests and safe refactors.
UI code (ui/*) only touches DOM; it accepts state from main — makes moving to Vue easier (each ui file maps to 1 Vue component later).
Effects are files per-epic: adding a new unique module effect is as simple as dropping a file and registering it.
Features (boss/mines) are thin bridges: they own feature-specific glue without hiding logic — you can import the logic directly if you prefer (they’re optional wrappers).
integrations/ isolates dynamic imports (Discord) so bundling and runtime detection are clean.
API/contract recommendations (small, concrete)

Pure functions in game/* should not touch DOM or window. Signatures:
predictMergeResult(selection, board, templates) => { templateId, rarity, plus, stars }
findAllGroups(board, predicate) => Array<Array<{r,c}>>
cascadeResolve(board, options) => { board: newBoard, events: [...] } (returns a diff/events list main applies to UI)
UI functions should be idempotent and accept state to render:
renderBoard(rootEl, board, selected, meta) => void
renderInventory(rootEl, inventory, selected) => void
Effect files should implement:
export function onEquip(state, ctx) — mutate inventory or player state
export function onUnequip(state, ctx)
optional onMerge(mergeContext)
Extraction / migration order (recommended)

Extract game/engine.js + tests (pure logic). Validate with unit tests.
Extract game/matcher.js and cascade.js (cascade pipeline). Smoke test with main calling them.
Extract game/spawn.js + templates (spawn behavior).
Extract assets/index.js (image imports) and update resolveAssetsForModule to use this.
Extract entities/moduleFactory.js, entities/mines.js, and boss.js.
Extract ui/shapes.js + ui/renderBoard.js and then ui/inventoryUI.js, keeping DOM wiring in main until UI is stable.
Move boss/mines glue into features/ and confirm behavior.
Add effects/ files for each Epic module; wire registry and ensure onEquip/onUnequip hooks run when inventory changes.
Create integrations/discord.js (dynamic import).
Gradually port UI files to Vue components and switch to TypeScript types in types/ last.