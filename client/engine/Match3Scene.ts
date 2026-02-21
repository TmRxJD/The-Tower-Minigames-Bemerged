import Phaser from 'phaser'
import {
  type AutoplayGoal,
  type AutoplayLearningProfile,
  type AutoplayRewardBreakdown,
  type AutoplayStatus,
  BOARD_COLS,
  BOARD_ROWS,
  type Cell,
  type GameStats,
  type ModuleToken,
  type ModuleType,
  type Move,
  TILE_GAP,
  TILE_SIZE,
} from './types'
import { createModuleCatalog } from './catalog'
import { SeededRng } from './rng'
import { GameEngine, type GameEngineRuntimeState } from './GameEngine'
import { BOSS_IMG, MINE_ASSET } from '../assets'

export type BemergedRuntimeState = {
  version: 1
  elapsedSeconds: number
  restartCount: number
  engine: GameEngineRuntimeState
}

type SpecialSnapshot = {
  mines: ReturnType<GameEngine['getMines']>
  boss: ReturnType<GameEngine['getBoss']>
}

type SceneCallbacks = {
  onStats?: (stats: GameStats) => void
  onStatus?: (status: string) => void
  onAutoplay?: (status: AutoplayStatus) => void
  onInventory?: (inventory: Record<ModuleType, ModuleToken | null>) => void
  onSpecials?: (state: { mineCount: number; bossHp: number; bossWave: number; bossPhase: number }) => void
  onRuntimeStateChanged?: (state: BemergedRuntimeState) => void
}

type SceneUiSettings = {
  autoShatterRares?: boolean
  disableHints?: boolean
}

const TILE_DRAW_SIZE = TILE_SIZE - TILE_GAP
const TILE_RADIUS = 8
const PREVIEW_BAR_HEIGHT = 72
const PREVIEW_SLOT_SIZE = 40
const PREVIEW_ICON_SIZE = 22
const PREVIEW_GAP = 14
const PREVIEW_TEXT_GAP = 18
const AUTOPLAY_ACTION_DELAY_MIN_MS = 50
const AUTOPLAY_ACTION_DELAY_MAX_MS = 3000

function parseSeed(): number {
  try {
    const params = new URLSearchParams(window.location.search)
    const value = Number(params.get('seed'))
    if (Number.isFinite(value)) return Math.floor(value)
  } catch {
    return 1337
  }
  return 1337
}

export class Match3Scene extends Phaser.Scene {
  private readonly seed = parseSeed()
  private readonly rng = new SeededRng(this.seed)
  private readonly catalog = createModuleCatalog(this.rng)
  private readonly engine = new GameEngine({
    seed: this.seed,
    catalog: this.catalog,
  })

  private selected: Cell | null = null
  private mineShatterMode: { mine: Cell; modules: Cell[] } | null = null
  private bossShatterSelection: Cell[] = []
  private hintMove: Move | null = null
  private hintCycleIndex = -1
  private hintPulsePhase: 0 | 1 = 0
  private hintPulseTimer: Phaser.Time.TimerEvent | null = null
  private hintAutoClearTimer: Phaser.Time.TimerEvent | null = null
  private idleHintTimer: Phaser.Time.TimerEvent | null = null
  private lastMoveActivityAtMs = Date.now()
  private nextIdleHintAtMs = Date.now() + 10000
  private autoHintVisible = false
  private hintsDisabled = false
  private layer!: Phaser.GameObjects.Layer
  private callbacks: SceneCallbacks = {}
  private startMs = Date.now()
  private restartCount = 0
  private resolving = false
  private initialRuntimeState: BemergedRuntimeState | null = null

  private aiTimer: Phaser.Time.TimerEvent | null = null
  private lastAutoplayActionType: 'swap' | 'merge' | 'inventory' | null = null
  private aiStatus: AutoplayStatus = {
    active: false,
    delayMs: 250,
    goal: 'objective-progress',
    testingMode: false,
    movesExecuted: 0,
    mergesExecuted: 0,
    validMoveCount: 0,
    lastDecision: null,
    lastReward: null,
    elapsedSeconds: 0,
    lastError: null,
  }
  private longPressTimer: Phaser.Time.TimerEvent | null = null
  private pointerDownCell: Cell | null = null
  private longPressTriggered = false
  private pendingTextureLoads = new Set<string>()
  private failedTextureLoads = new Set<string>()

  constructor() {
    super('bemerged-match3')
  }

  setCallbacks(callbacks: SceneCallbacks): void {
    this.callbacks = callbacks
  }

  setUiSettings(settings: SceneUiSettings): void {
    this.engine.setAutoShatterRares(!!settings.autoShatterRares)
    this.hintsDisabled = !!settings.disableHints
    if (this.hintsDisabled) {
      this.setHintMove(null, { source: 'system' })
      this.renderBoard()
    }
  }

  setInitialRuntimeState(state: BemergedRuntimeState | null): void {
    this.initialRuntimeState = state
  }

  preload(): void {
    for (const entry of this.catalog.allAssetEntries) {
      const key = entry.key
      if (!this.textures.exists(key)) {
        this.load.image(key, entry.url)
      }
    }

    if (!this.textures.exists('boss-overlay')) {
      this.load.image('boss-overlay', String(BOSS_IMG))
    }
    if (!this.textures.exists('mine-overlay')) {
      this.load.image('mine-overlay', String(MINE_ASSET))
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')
    this.layer = this.add.layer()

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer)
    })
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      void this.handlePointerUp(pointer)
    })
    this.input.on('gameout', () => {
      this.clearLongPressTracking()
    })

    this.input.mouse?.disableContextMenu()

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, file => {
      const key = String((file as { key?: string })?.key || '')
      if (!key) return
      this.pendingTextureLoads.delete(key)
      this.failedTextureLoads.add(key)
    })

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.emitStats()
      },
    })

    if (this.initialRuntimeState) {
      const restored = this.engine.importRuntimeState(this.initialRuntimeState.engine)
      if (restored) {
        const elapsedSeconds = Math.max(1, Math.floor(Number(this.initialRuntimeState.elapsedSeconds) || 1))
        this.startMs = Date.now() - (elapsedSeconds * 1000)
        this.restartCount = Math.max(0, Math.floor(Number(this.initialRuntimeState.restartCount) || 0))
      }
      this.initialRuntimeState = null
    }

    this.renderBoard()
    this.emitInventory()
    this.emitStatus('Ready')
    this.emitStats()
    this.emitAutoplayStatus()
    this.startIdleHintWatcher()
    this.emitRuntimeStateChanged()
  }

  restartBoard(): void {
    this.restartCount += 1
    this.startMs = Date.now()
    this.engine.restart(this.seed + this.restartCount)
    this.selected = null
    this.engine.cancelMergeSession()
    this.mineShatterMode = null
    this.bossShatterSelection = []
    this.setHintMove(null)
    this.hintCycleIndex = -1
    this.renderBoard()
    this.emitInventory()
    this.emitStats()
    this.emitStatus('Restarted')
    this.emitRuntimeStateChanged()
  }

  shuffleBoard(): void {
    this.engine.shuffle()
    this.selected = null
    this.engine.cancelMergeSession()
    this.mineShatterMode = null
    this.bossShatterSelection = []
    this.setHintMove(null)
    this.hintCycleIndex = -1
    this.renderBoard()
    this.emitStats()
    this.emitStatus('Shuffled')
    this.emitRuntimeStateChanged()
  }

  showHint(): Move | null {
    this.recordInteractionActivity()
    if (this.hintsDisabled) {
      this.setHintMove(null, { source: 'system' })
      this.renderBoard()
      this.emitStatus('Hints disabled in settings')
      return null
    }

    const hintMoves = this.engine.findHintMoves()
    if (hintMoves.length === 0) {
      this.setHintMove(null)
      this.hintCycleIndex = -1
      this.renderBoard()
      this.emitStatus('No valid moves')
      return null
    }

    const currentKey = this.hintMove
      ? `${this.hintMove.from.row}:${this.hintMove.from.col}:${this.hintMove.to.row}:${this.hintMove.to.col}`
      : null
    const currentIndex = currentKey
      ? hintMoves.findIndex(move => `${move.from.row}:${move.from.col}:${move.to.row}:${move.to.col}` === currentKey)
      : -1
    const baseIndex = currentIndex >= 0 ? currentIndex : this.hintCycleIndex
    const nextIndex = (baseIndex + 1 + hintMoves.length) % hintMoves.length
    const hint = hintMoves[nextIndex]
    this.hintCycleIndex = nextIndex
    this.setHintMove(hint, { pulseToggles: 6, source: 'manual' })
    this.renderBoard()
    this.emitStatus(hint ? 'Hint highlighted' : 'No valid moves')
    return hint
  }

  startAutoplay(options?: { delayMs?: number; testingMode?: boolean; goal?: AutoplayGoal | string }): AutoplayStatus {
    const delayMs = Number.isFinite(Number(options?.delayMs))
      ? Math.max(50, Math.min(3000, Math.floor(Number(options?.delayMs))))
      : this.aiStatus.delayMs
    const testingMode = false
    const goal = options?.goal == null
      ? 'objective-progress'
      : this.engine.normalizeAutoplayGoal(options?.goal)

    this.stopAutoplay('stopped')
    this.lastAutoplayActionType = null

    this.aiStatus = {
      ...this.aiStatus,
      active: true,
      delayMs,
      goal,
      testingMode,
      validMoveCount: this.engine.findValidMoves().length,
      lastDecision: 'start',
      elapsedSeconds: this.getElapsedSeconds(),
      lastError: null,
    }

    this.aiTimer = this.time.addEvent({
      delay: delayMs,
      loop: true,
      callback: () => {
        void this.tickAutoplay()
      },
    })

    this.emitStatus(`AI running (${delayMs}ms, goal: ${goal})`)
    this.emitAutoplayStatus()
    return this.getAutoplayStatus()
  }

  stopAutoplay(status = 'AI stopped'): AutoplayStatus {
    if (this.aiTimer) {
      this.aiTimer.remove(false)
      this.aiTimer = null
    }

    this.aiStatus = {
      ...this.aiStatus,
      active: false,
      validMoveCount: this.engine.findValidMoves().length,
      lastDecision: 'stop',
      elapsedSeconds: this.getElapsedSeconds(),
    }

    this.emitStatus(status)
    this.emitAutoplayStatus()
    return this.getAutoplayStatus()
  }

  getAutoplayStatus(): AutoplayStatus {
    return { ...this.aiStatus }
  }

  getEngineSnapshot(): Record<string, unknown> {
    const board = this.engine.getBoard()
    const mines = this.engine.getMines()
    const boss = this.engine.getBoss()
    const validMoves = this.engine.findValidMoves()
    const elapsedSeconds = this.getElapsedSeconds()
    const stats = this.engine.getStats(elapsedSeconds)
    const objective = this.engine.getObjectiveProgress()

    return {
      seed: this.seed,
      elapsedSeconds,
      stats,
      inventory: this.engine.getInventory(),
      mines,
      boss,
      validMoveCount: validMoves.length,
      hintMove: this.engine.findHint() || null,
      validActions: validMoves.map((move, index) => ({
        id: index,
        type: 'swap',
        from: move.from,
        to: move.to,
      })),
      objective,
      autoplayCapabilities: {
        goals: this.engine.getAutoplayGoals(),
        actions: {
          primary: ['swap'],
          availableCommands: ['start', 'stop', 'status', 'snapshot', 'step'],
        },
        strictGuardrails: {
          allowTestingMode: false,
          allowDevControls: false,
          allowCommandedParityPatch: false,
        },
      },
      board: board.map((row, rowIndex) => row.map((cell, colIndex) => {
        if (!cell) return null
        return {
          row: rowIndex,
          col: colIndex,
          templateId: cell.templateId,
          type: cell.type,
          rarity: cell.rarity,
          plus: !!cell.plus,
          matchKey: cell.matchKey,
        }
      })),
      autoplay: this.getAutoplayStatus(),
    }
  }

  getObjectiveProgress() {
    return this.engine.getObjectiveProgress()
  }

  getAutoplayGoals(): ReadonlyArray<AutoplayGoal> {
    return this.engine.getAutoplayGoals()
  }

  setAutoplayLearningProfile(profile?: Partial<AutoplayLearningProfile> | null): void {
    this.engine.setAutoplayLearningProfile(profile)
  }

  getAutoplayLearningProfile(): AutoplayLearningProfile {
    return this.engine.getAutoplayLearningProfile()
  }

  async runAutoplayStep(options?: { goal?: AutoplayGoal | string }): Promise<{ moved: boolean; merged: boolean; shuffled: boolean; reason: string }> {
    if (this.resolving) {
      return { moved: false, merged: false, shuffled: false, reason: 'resolving' }
    }

    const goal = this.engine.normalizeAutoplayGoal(options?.goal || this.aiStatus.goal)
    const beforeElapsedSeconds = this.getElapsedSeconds()
    const beforeStats = this.engine.getStats(beforeElapsedSeconds)
    const beforeObjective = this.engine.getObjectiveProgress()
    const actionDelayMs = this.getAutoplayActionDelayMs()
    const mergeSelection = this.engine.chooseAutoplayMergeSelection(goal)
    if (mergeSelection && mergeSelection.length > 1) {
      const mergedFromSelection = await this.executeAutoplayMergeSelection(mergeSelection, actionDelayMs)
      if (mergedFromSelection) {
        const afterElapsedSeconds = this.getElapsedSeconds()
        const afterStats = this.engine.getStats(afterElapsedSeconds)
        const afterObjective = this.engine.getObjectiveProgress()
        this.aiStatus = {
          ...this.aiStatus,
          goal,
          movesExecuted: this.aiStatus.movesExecuted + 1,
          mergesExecuted: this.aiStatus.mergesExecuted + 1,
          validMoveCount: this.engine.findValidMoves().length,
          lastDecision: `step-merge-selection:${goal}`,
          lastReward: this.buildRewardBreakdown({
            beforeStats,
            afterStats,
            beforeObjective,
            afterObjective,
            beforeElapsedSeconds,
            afterElapsedSeconds,
            merged: true,
            shuffled: false,
          }),
          elapsedSeconds: this.getElapsedSeconds(),
        }
        this.emitAutoplayStatus()
        this.lastAutoplayActionType = 'merge'
        return { moved: true, merged: true, shuffled: false, reason: 'merge-selection' }
      }
    }

    const clearMove = this.engine.chooseAutoplayClearMove(goal)
    if (clearMove) {
      const merged = await this.tryResolveMove(clearMove, {
        previewSelection: true,
        selectionDelayMs: actionDelayMs,
      })
      const afterElapsedSeconds = this.getElapsedSeconds()
      const afterStats = this.engine.getStats(afterElapsedSeconds)
      const afterObjective = this.engine.getObjectiveProgress()
      this.aiStatus = {
        ...this.aiStatus,
        goal,
        movesExecuted: this.aiStatus.movesExecuted + 1,
        mergesExecuted: this.aiStatus.mergesExecuted + (merged ? 1 : 0),
        validMoveCount: this.engine.findValidMoves().length,
        lastDecision: merged ? `step-clearmove-merged:${goal}` : `step-clearmove-cleared:${goal}`,
        lastReward: this.buildRewardBreakdown({
          beforeStats,
          afterStats,
          beforeObjective,
          afterObjective,
          beforeElapsedSeconds,
          afterElapsedSeconds,
          merged,
          shuffled: false,
        }),
        elapsedSeconds: this.getElapsedSeconds(),
      }
      this.emitAutoplayStatus()
      this.lastAutoplayActionType = 'swap'
      return { moved: true, merged, shuffled: false, reason: merged ? 'merged-clear' : 'cleared' }
    }

    if (this.lastAutoplayActionType !== 'inventory') {
      const inventoryAction = this.engine.chooseAutoplayInventoryAction(goal)
      if (inventoryAction) {
        const changed = await this.executeAutoplayInventoryAction(inventoryAction.cell, inventoryAction.slotType, actionDelayMs)
        if (changed) {
          this.emitStatus('AI secured module in inventory')

          const afterElapsedSeconds = this.getElapsedSeconds()
          const afterStats = this.engine.getStats(afterElapsedSeconds)
          const afterObjective = this.engine.getObjectiveProgress()
          this.aiStatus = {
            ...this.aiStatus,
            goal,
            movesExecuted: this.aiStatus.movesExecuted + 1,
            mergesExecuted: this.aiStatus.mergesExecuted,
            validMoveCount: this.engine.findValidMoves().length,
            lastDecision: `step-inventory:${goal}`,
            lastReward: this.buildRewardBreakdown({
              beforeStats,
              afterStats,
              beforeObjective,
              afterObjective,
              beforeElapsedSeconds,
              afterElapsedSeconds,
              merged: false,
              shuffled: false,
            }),
            elapsedSeconds: this.getElapsedSeconds(),
          }
          this.emitStats()
          this.emitInventory()
          this.emitAutoplayStatus()
          this.lastAutoplayActionType = 'inventory'
          return { moved: true, merged: false, shuffled: false, reason: 'inventory' }
        }
      }
    }

    const move = this.engine.chooseAutoplayMove(goal)
    if (!move) {
      this.shuffleBoard()
      const afterElapsedSeconds = this.getElapsedSeconds()
      const afterStats = this.engine.getStats(afterElapsedSeconds)
      const afterObjective = this.engine.getObjectiveProgress()
      this.aiStatus = {
        ...this.aiStatus,
        goal,
        validMoveCount: this.engine.findValidMoves().length,
        lastDecision: `shuffle-no-hint:${goal}`,
        lastReward: this.buildRewardBreakdown({
          beforeStats,
          afterStats,
          beforeObjective,
          afterObjective,
          beforeElapsedSeconds,
          afterElapsedSeconds,
          merged: false,
          shuffled: true,
        }),
        elapsedSeconds: this.getElapsedSeconds(),
      }
      this.emitAutoplayStatus()
      return { moved: false, merged: false, shuffled: true, reason: 'no-hint' }
    }

    const merged = await this.tryResolveMove(move, {
      previewSelection: true,
      selectionDelayMs: actionDelayMs,
    })
    const afterElapsedSeconds = this.getElapsedSeconds()
    const afterStats = this.engine.getStats(afterElapsedSeconds)
    const afterObjective = this.engine.getObjectiveProgress()
    this.aiStatus = {
      ...this.aiStatus,
      goal,
      movesExecuted: this.aiStatus.movesExecuted + 1,
      mergesExecuted: this.aiStatus.mergesExecuted + (merged ? 1 : 0),
      validMoveCount: this.engine.findValidMoves().length,
      lastDecision: merged ? `step-merged:${goal}` : `step-swapped:${goal}`,
      lastReward: this.buildRewardBreakdown({
        beforeStats,
        afterStats,
        beforeObjective,
        afterObjective,
        beforeElapsedSeconds,
        afterElapsedSeconds,
        merged,
        shuffled: false,
      }),
      elapsedSeconds: this.getElapsedSeconds(),
    }
    this.emitAutoplayStatus()
    this.lastAutoplayActionType = 'swap'
    return { moved: true, merged, shuffled: false, reason: merged ? 'merged' : 'swapped' }
  }

  private buildRewardBreakdown(input: {
    beforeStats: GameStats
    afterStats: GameStats
    beforeObjective: ReturnType<GameEngine['getObjectiveProgress']>
    afterObjective: ReturnType<GameEngine['getObjectiveProgress']>
    beforeElapsedSeconds: number
    afterElapsedSeconds: number
    merged: boolean
    shuffled: boolean
  }): AutoplayRewardBreakdown {
    const objective = (input.afterObjective.completionPercent - input.beforeObjective.completionPercent) * 10
    const shards = input.afterStats.score - input.beforeStats.score
    const elapsedDelta = Math.max(0, input.afterElapsedSeconds - input.beforeElapsedSeconds)
    const time = -elapsedDelta
    const risk = input.shuffled
      ? -8
      : input.merged
        ? 1
        : -1

    return {
      objective,
      shards,
      time,
      risk,
      total: objective + shards + time + risk,
    }
  }

  private async tickAutoplay(): Promise<void> {
    if (!this.aiStatus.active || this.resolving) return
    await this.runAutoplayStep()
  }

  private getAutoplayActionDelayMs(): number {
    return Math.max(
      AUTOPLAY_ACTION_DELAY_MIN_MS,
      Math.min(AUTOPLAY_ACTION_DELAY_MAX_MS, Math.floor(Number(this.aiStatus.delayMs) || 250)),
    )
  }

  private async executeAutoplayMergeSelection(selection: Cell[], actionDelayMs: number): Promise<boolean> {
    if (!Array.isArray(selection) || selection.length < 2) return false

    this.resolving = true
    try {
      const [base, ...fodders] = selection
      const start = this.engine.startMergeSession(base)
      if (!start.started) {
        this.clearSelectionState()
        this.renderBoard()
        return false
      }

      this.emitStatus('AI selecting merge modules')
      this.renderBoard()
      await this.wait(actionDelayMs)

      for (const fodder of fodders) {
        const toggleResult = this.engine.toggleMergeSessionCell(fodder)
        if (toggleResult.cancelled) {
          this.clearSelectionState()
          this.renderBoard()
          return false
        }

        this.renderBoard()
        await this.wait(actionDelayMs)
      }

      const beforeBoard = this.engine.getBoard().map(row => row.slice())
      const beforeSpecials = this.captureSpecialSnapshot()
      const mergeResult = this.engine.confirmMergeSession()
      this.clearSelectionState()
      if (!mergeResult.valid || !mergeResult.merged) {
        this.renderBoard()
        return false
      }

      await this.renderMergedCascade(beforeBoard, beforeSpecials)
      this.recordMoveActivity()
      this.emitStats()
      return true
    } finally {
      this.resolving = false
    }
  }

  private async executeAutoplayInventoryAction(cell: Cell, slotType: ModuleType, actionDelayMs: number): Promise<boolean> {
    if (this.resolving) return false

    this.selected = { row: cell.row, col: cell.col }
    this.renderBoard()
    await this.wait(actionDelayMs)

    const changed = this.engine.applyInventoryActionToSlot(cell, slotType)
    this.clearSelectionState()
    this.renderBoard()
    if (!changed) {
      return false
    }

    this.recordMoveActivity()
    this.emitStats()
    this.emitInventory()
    await this.wait(Math.max(40, Math.floor(actionDelayMs * 0.6)))
    return true
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.resolving) return
    this.clearLongPressTracking()
    this.recordInteractionActivity()

    const cell = this.pointerToCell(pointer)
    this.pointerDownCell = cell
    if (!cell) return
    if (pointer.rightButtonDown()) return

    this.longPressTimer = this.time.delayedCall(360, () => {
      if (!this.pointerDownCell) return
      if (this.pointerDownCell.row !== cell.row || this.pointerDownCell.col !== cell.col) return
      if (this.engine.isCellBlocked(cell.row, cell.col)) return

      const token = this.engine.getBoard()[cell.row][cell.col]
      if (!token || token.rarity === 'Common') return

      this.enterMergeMode(cell)
      this.longPressTriggered = true
    })
  }

  private async handlePointerUp(pointer: Phaser.Input.Pointer): Promise<void> {
    const triggered = this.longPressTriggered
    this.clearLongPressTracking()
    if (triggered) return

    const releasedCell = this.pointerToCell(pointer)
    if (!releasedCell && this.engine.hasMergeSession()) {
      const mergedFromPreview = await this.tryMergeFromPreview(pointer)
      if (mergedFromPreview) return
      this.clearSelectionState()
      this.emitStatus('Merge mode cancelled')
      this.renderBoard()
      return
    }

    await this.handlePointer(pointer)
  }

  private clearLongPressTracking(): void {
    if (this.longPressTimer) {
      this.longPressTimer.remove(false)
      this.longPressTimer = null
    }
    this.pointerDownCell = null
    this.longPressTriggered = false
  }

  private async handlePointer(pointer: Phaser.Input.Pointer): Promise<void> {
    if (this.resolving) return

    this.setHintMove(null)
    const cell = this.pointerToCell(pointer)
    if (!cell) return

    if (pointer.rightButtonDown()) {
      this.enterMergeMode(cell)
      return
    }

    const boss = this.engine.getBoss()
    const mineAtCell = this.engine.getMines().find(mine => mine.row === cell.row && mine.col === cell.col)

    if (this.mineShatterMode) {
      const mine = this.mineShatterMode.mine
      if (cell.row === mine.row && cell.col === mine.col) {
        const result = this.engine.applyMineShatterSelection(mine, this.mineShatterMode.modules)
        this.mineShatterMode = null
        this.clearSelectionState()
        if (!result.valid) {
          this.emitStatus('Mine shatter failed')
          this.renderBoard()
          return
        }
        this.emitStatus('Mine shattered')
        this.recordMoveActivity()
        this.renderBoard()
        this.emitStats()
        return
      }

      if (this.engine.isCellBlocked(cell.row, cell.col)) {
        this.emitStatus('Cannot use blocked tile for mine shatter')
        return
      }

      const already = this.mineShatterMode.modules.findIndex(item => item.row === cell.row && item.col === cell.col)
      if (already >= 0) {
        this.mineShatterMode.modules.splice(already, 1)
      } else {
        const limit = this.mineShatterMode.modules.length >= 4
        if (!limit) this.mineShatterMode.modules.push(cell)
      }
      this.renderBoard()
      return
    }

    if (this.bossShatterSelection.length > 0) {
      if (boss && cell.row === boss.row && cell.col === boss.col) {
        const result = this.engine.applyBossShatterSelection(this.bossShatterSelection)
        this.bossShatterSelection = []
        this.clearSelectionState()
        if (!result.valid) {
          this.emitStatus('Boss damage failed')
          this.renderBoard()
          return
        }
        this.emitStatus(`Boss damaged (${result.damage})`)
        this.recordMoveActivity()
        this.renderBoard()
        this.emitStats()
        return
      }

      if (this.engine.isCellBlocked(cell.row, cell.col)) {
        this.emitStatus('Cannot use blocked tile for boss damage')
        return
      }

      const index = this.bossShatterSelection.findIndex(item => item.row === cell.row && item.col === cell.col)
      if (index >= 0) {
        this.bossShatterSelection.splice(index, 1)
      } else {
        this.bossShatterSelection.push(cell)
      }
      this.renderBoard()
      return
    }

    if (this.engine.isCellBlocked(cell.row, cell.col)) {
      if (mineAtCell) {
        this.mineShatterMode = { mine: { row: cell.row, col: cell.col }, modules: [] }
        this.clearSelectionState()
        this.emitStatus('Mine selected: pick modules then click mine again')
        this.renderBoard()
        return
      }
      if (boss && boss.row === cell.row && boss.col === cell.col) {
        this.bossShatterSelection = []
        this.clearSelectionState()
        this.emitStatus('Boss selected: pick modules then click boss again')
        this.renderBoard()
        return
      }
      this.emitStatus('Tile is blocked by mine or boss')
      return
    }

    const mergeSession = this.engine.getMergeSessionSnapshot()
    if (mergeSession.active) {
      const base = mergeSession.base
      if (!base) {
        this.clearSelectionState()
        this.renderBoard()
        return
      }

      if (base.row === cell.row && base.col === cell.col) {
        const mergeState = mergeSession.state
        if (!mergeState.valid || !mergeState.readyToMerge) {
          this.clearSelectionState()
          this.emitStatus('Merge mode cancelled')
          this.renderBoard()
          return
        }

        this.resolving = true
        try {
          const beforeBoard = this.engine.getBoard().map(row => row.slice())
          const beforeSpecials = this.captureSpecialSnapshot()
          const result = this.engine.confirmMergeSession()
          this.clearSelectionState()
          if (!result.valid) {
            this.emitStatus('Merge failed')
            this.renderBoard()
            return
          }
          await this.renderMergedCascade(beforeBoard, beforeSpecials)
          this.recordMoveActivity()
          this.emitStats()
          this.emitStatus('Merged')
        } finally {
          this.resolving = false
        }
        return
      }

      const toggleResult = this.engine.toggleMergeSessionCell(cell)
      if (toggleResult.cancelled) {
        this.clearSelectionState()
        this.emitStatus('Merge mode cancelled')
      } else if (toggleResult.changed) {
        this.emitMergeModeStatus()
      }

      this.renderBoard()
      return
    }

    if (!this.selected) {
      this.selected = cell
      this.renderBoard()
      return
    }

    if (this.selected.row === cell.row && this.selected.col === cell.col) {
      this.selected = null
      this.renderBoard()
      return
    }

    const base = this.selected
    const move: Move = {
      from: base,
      to: cell,
    }
    this.selected = null
    this.clearSelectionState()

    await this.tryResolveMove(move)
  }

  onInventorySlotClick(slotType: ModuleType): void {
    if (this.resolving) return
    this.recordInteractionActivity()
    if (!this.selected) {
      this.emitStatus('Select a module, then choose inventory slot')
      return
    }

    const changed = this.engine.applyInventoryActionToSlot(this.selected, slotType)
    if (!changed) {
      this.emitStatus('Only matching unique modules can use inventory')
      return
    }

    this.clearSelectionState()
    this.recordMoveActivity()
    this.renderBoard()
    this.emitInventory()
    this.emitStatus('Inventory updated')
  }

  onShardTypeClick(type: ModuleType): void {
    if (this.resolving) return
    this.recordInteractionActivity()

    const result = this.engine.purchaseShardBoostLevel(type)
    if (!result.purchased) {
      this.emitStatus(`Need ${result.cost.toLocaleString()} ${type} shards for next Epic level`)
      return
    }

    this.emitStats()
    this.emitRuntimeStateChanged()
    this.emitStatus(`${type} Epic spawn boost upgraded to Lv.${result.level} (-${result.cost.toLocaleString()} shards)`)
  }

  private async tryResolveMove(
    move: Move,
    options?: {
      previewSelection?: boolean
      selectionDelayMs?: number
    },
  ): Promise<boolean> {
    if (options?.previewSelection) {
      this.selected = { row: move.from.row, col: move.from.col }
      this.renderBoard()
      await this.wait(Math.max(40, Math.floor(Number(options.selectionDelayMs) || 0)))
      this.selected = null
      this.renderBoard()
      await this.wait(Math.max(30, Math.floor((Number(options.selectionDelayMs) || 0) * 0.5)))
    }

    this.resolving = true
    const beforeBoard = this.engine.getBoard().map(row => row.slice())
    const beforeSpecials = this.captureSpecialSnapshot()
    const result = this.engine.applyMove(move)
    if (!result.valid) {
      this.resolving = false
      this.emitStatus('Invalid swap')
      return false
    }

    try {
      this.recordMoveActivity()
      if (result.merged) {
        await this.renderMergedCascade(beforeBoard, beforeSpecials)
      } else {
        this.renderBoard()
        await this.wait(40)
      }
      this.emitStatus(result.merged ? 'Merged' : 'Swapped')
      this.emitStats()
      this.emitRuntimeStateChanged()
      return result.merged
    } finally {
      this.resolving = false
    }
  }

  private pointerToCell(pointer: Phaser.Input.Pointer): Cell | null {
    const boardY = pointer.y - PREVIEW_BAR_HEIGHT
    const col = Math.floor(pointer.x / TILE_SIZE)
    const row = Math.floor(boardY / TILE_SIZE)
    if (row < 0 || col < 0 || row >= BOARD_ROWS || col >= BOARD_COLS) return null
    return { row, col }
  }

  private renderBoard(
    highlightCells: Cell[] = [],
    options?: {
      animateCascade?: boolean
      previousTokenPositions?: Map<ModuleToken, Cell>
      previousSpecialSnapshot?: SpecialSnapshot
    },
  ): void {
    const board = this.engine.getBoard()
    const animateCascade = !!options?.animateCascade
    const previousTokenPositions = options?.previousTokenPositions
    const previousSpecialSnapshot = options?.previousSpecialSnapshot
    const cascadeTargets: Array<{
      node: Phaser.GameObjects.Image | Phaser.GameObjects.Text
      startY: number
      finalY: number
      delay: number
    }> = []
    const mines = this.engine.getMines()
    const boss = this.engine.getBoss()
    const mineByKey = new Map<string, (typeof mines)[number]>()
    for (const mine of mines) {
      mineByKey.set(`${mine.row},${mine.col}`, mine)
    }
    const mineStartRowByKey = this.buildMineStartRowByKey(mines, previousSpecialSnapshot?.mines || [])
    const flash = new Set(highlightCells.map(cell => `${cell.row},${cell.col}`))
    if (this.hintMove) {
      if (this.hintPulseTimer) {
        const hintedCell = this.hintPulsePhase === 0 ? this.hintMove.from : this.hintMove.to
        flash.add(`${hintedCell.row},${hintedCell.col}`)
      } else {
        flash.add(`${this.hintMove.from.row},${this.hintMove.from.col}`)
        flash.add(`${this.hintMove.to.row},${this.hintMove.to.col}`)
      }
    }

    const mergeSession = this.engine.getMergeSessionSnapshot()
    const mergeSelectionKeys = new Set(mergeSession.selection.map(item => `${item.row},${item.col}`))
    const mergeCandidateKeys = new Set(mergeSession.candidateKeys)
    const mergeBaseKey = mergeSession.base ? `${mergeSession.base.row},${mergeSession.base.col}` : null

    this.layer.removeAll(true)

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const token = board[row][col]
        const key = `${row},${col}`
        const mine = mineByKey.get(key)
        const isBossCell = !!(boss && boss.row === row && boss.col === col)
        if (!token && !mine && !isBossCell) continue

        const x = (col * TILE_SIZE) + (TILE_SIZE / 2)
        const y = PREVIEW_BAR_HEIGHT + (row * TILE_SIZE) + (TILE_SIZE / 2)
        const blocked = this.engine.isCellBlocked(row, col)

        const tileBackground = this.add.rectangle(x, y, TILE_DRAW_SIZE, TILE_DRAW_SIZE, 0x0a0f18, 0.48)
        tileBackground.setStrokeStyle(2, blocked ? 0x7c2d12 : 0x2b384f, 0.78)
        tileBackground.setOrigin(0.5, 0.5)

        if (tileBackground instanceof Phaser.GameObjects.Rectangle) {
          tileBackground.setDisplaySize(TILE_DRAW_SIZE, TILE_DRAW_SIZE)
        }

        const showTokenArt = !!token && !mine && !isBossCell
        const frameTexture = showTokenArt ? token!.frameTextureKey : ''
        const iconTexture = showTokenArt ? token!.assetTextureKey : ''

        const frameReady = showTokenArt ? this.ensureTextureReady(token!.frameSrc, token!.frameTextureKey) : false
        const iconReady = showTokenArt ? this.ensureTextureReady(token!.assetSrc, token!.assetTextureKey) : false

        const frame = frameReady ? this.add.image(x, y, frameTexture) : null
        frame?.setDisplaySize(TILE_DRAW_SIZE - 6, TILE_DRAW_SIZE - 6)

        const icon = iconReady ? this.add.image(x, y, iconTexture) : null
        icon?.setDisplaySize(TILE_DRAW_SIZE - 18, TILE_DRAW_SIZE - 18)

        const previousPosition = animateCascade && previousTokenPositions && token ? previousTokenPositions.get(token) : undefined
        const previousRow = previousPosition?.row

        if (animateCascade && frame) {
          const finalY = frame.y
          const startY = previousRow !== undefined
            ? PREVIEW_BAR_HEIGHT + (previousRow * TILE_SIZE) + (TILE_SIZE / 2)
            : finalY - (TILE_SIZE * 1.2)
          const rowDistance = previousRow !== undefined ? Math.max(0, row - previousRow) : row + 1
          const shouldAnimate = startY !== finalY
          if (shouldAnimate) {
            frame.setY(startY)
            frame.setAlpha(0.7)
            cascadeTargets.push({ node: frame, startY, finalY, delay: rowDistance * 12 })
          }
        }
        if (animateCascade && icon) {
          const finalY = icon.y
          const startY = previousRow !== undefined
            ? PREVIEW_BAR_HEIGHT + (previousRow * TILE_SIZE) + (TILE_SIZE / 2)
            : finalY - (TILE_SIZE * 1.2)
          const rowDistance = previousRow !== undefined ? Math.max(0, row - previousRow) : row + 1
          const shouldAnimate = startY !== finalY
          if (shouldAnimate) {
            icon.setY(startY)
            icon.setAlpha(0.7)
            cascadeTargets.push({ node: icon, startY, finalY, delay: rowDistance * 12 })
          }
        }

        const borderColor = this.selected && this.selected.row === row && this.selected.col === col
          ? 0xf8fafc
          : mergeSelectionKeys.has(key)
            ? 0x38bdf8
            : mergeSession.active && mergeCandidateKeys.has(key)
              ? 0xf8fafc
              : this.mineShatterMode?.mine.row === row && this.mineShatterMode?.mine.col === col
                ? 0xf97316
                : this.mineShatterMode?.modules.some(item => item.row === row && item.col === col)
                  ? 0xf59e0b
                  : this.bossShatterSelection.some(item => item.row === row && item.col === col)
                    ? 0xfb7185
                    : flash.has(key)
                      ? 0xfacc15
                      : blocked
                        ? 0xf97316
                        : 0x000000

        const isMergeBase = !!(mergeSession.active && mergeBaseKey === key)
        const isMergeSelected = mergeSelectionKeys.has(key)
        const isMergeCandidate = !!(mergeSession.active && mergeCandidateKeys.has(key))
        const dimForMergeMode = mergeSession.active && !isMergeBase && !isMergeSelected && !isMergeCandidate
        const mergeDimAlpha = dimForMergeMode ? 0.28 : 1

        tileBackground.setAlpha(dimForMergeMode ? 0.22 : 0.48)

        const borderAlpha = borderColor === 0x000000 ? 0.35 : 1
        const overlay = this.add.graphics()
        overlay.lineStyle(borderColor === 0x000000 ? 1 : 3, borderColor, borderAlpha)
        overlay.strokeRoundedRect(
          x - (TILE_DRAW_SIZE / 2),
          y - (TILE_DRAW_SIZE / 2),
          TILE_DRAW_SIZE,
          TILE_DRAW_SIZE,
          TILE_RADIUS,
        )

        this.layer.add(tileBackground)
        if (frame) this.layer.add(frame)
        if (icon) this.layer.add(icon)

        if (mine) {
          const mineIcon = this.add.image(x, y, 'mine-overlay')
          mineIcon.setDisplaySize(TILE_DRAW_SIZE - 14, TILE_DRAW_SIZE - 14)

          if (animateCascade) {
            const startRow = mineStartRowByKey.get(key)
            if (startRow !== undefined && startRow !== row) {
              const finalY = mineIcon.y
              const startY = PREVIEW_BAR_HEIGHT + (startRow * TILE_SIZE) + (TILE_SIZE / 2)
              const rowDistance = Math.max(0, row - startRow)
              mineIcon.setY(startY)
              mineIcon.setAlpha(0.7)
              cascadeTargets.push({ node: mineIcon, startY, finalY, delay: rowDistance * 12 })
            }
          }

          this.layer.add(mineIcon)

          const mineText = this.add.text(x + (TILE_DRAW_SIZE / 2) - 8, y - (TILE_DRAW_SIZE / 2) + 6, String(mine.movesRemaining), {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#8b1c1c',
          })
          mineText.setPadding(2, 1, 2, 1)
          mineText.setOrigin(1, 0)

          if (animateCascade) {
            const startRow = mineStartRowByKey.get(key)
            if (startRow !== undefined && startRow !== row) {
              const finalY = mineText.y
              const startY = (PREVIEW_BAR_HEIGHT + (startRow * TILE_SIZE) + (TILE_SIZE / 2)) - (TILE_DRAW_SIZE / 2) + 6
              const rowDistance = Math.max(0, row - startRow)
              mineText.setY(startY)
              mineText.setAlpha(0.7)
              cascadeTargets.push({ node: mineText, startY, finalY, delay: rowDistance * 12 })
            }
          }

          frame?.setAlpha(mergeDimAlpha)
          this.layer.add(mineText)
        }

        icon?.setAlpha(mergeDimAlpha)
        if (isBossCell && boss) {
          const bossIcon = this.add.image(x, y, 'boss-overlay')
          bossIcon.setDisplaySize(TILE_DRAW_SIZE - 8, TILE_DRAW_SIZE - 8)

          if (animateCascade && previousSpecialSnapshot?.boss && previousSpecialSnapshot.boss.col === boss.col) {
            const previousBossRow = previousSpecialSnapshot.boss.row
            if (previousBossRow !== boss.row) {
              const finalY = bossIcon.y
              const startY = PREVIEW_BAR_HEIGHT + (previousBossRow * TILE_SIZE) + (TILE_SIZE / 2)
              const rowDistance = Math.max(0, boss.row - previousBossRow)
              bossIcon.setY(startY)
              bossIcon.setAlpha(0.7)
              cascadeTargets.push({ node: bossIcon, startY, finalY, delay: rowDistance * 12 })
            }
          }

          this.layer.add(bossIcon)

          const hpText = this.add.text(x, y - (TILE_DRAW_SIZE / 2) + 6, String(boss.hitsRemaining), {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#801212',
          })
          hpText.setPadding(3, 1, 3, 1)
          hpText.setOrigin(0.5, 0)

          if (animateCascade && previousSpecialSnapshot?.boss && previousSpecialSnapshot.boss.col === boss.col) {
            const previousBossRow = previousSpecialSnapshot.boss.row
            if (previousBossRow !== boss.row) {
              const finalY = hpText.y
              const startY = (PREVIEW_BAR_HEIGHT + (previousBossRow * TILE_SIZE) + (TILE_SIZE / 2)) - (TILE_DRAW_SIZE / 2) + 6
              const rowDistance = Math.max(0, boss.row - previousBossRow)
              hpText.setY(startY)
              hpText.setAlpha(0.7)
              cascadeTargets.push({ node: hpText, startY, finalY, delay: rowDistance * 12 })
            }
          }

          this.layer.add(hpText)
        }

        this.layer.add(overlay)
      }
    }

    this.renderMergePreviewOverlay(board, mergeSession)

    if (animateCascade) {
      this.playCascadeAnimation(cascadeTargets)
    }

  }

  private playCascadeAnimation(targets: Array<{
    node: Phaser.GameObjects.Image | Phaser.GameObjects.Text
    startY: number
    finalY: number
    delay: number
  }>): void {
    for (const target of targets) {
      const distance = Math.abs(target.finalY - target.startY)
      this.tweens.add({
        targets: target.node,
        y: target.finalY,
        alpha: 1,
        duration: Math.min(240, Math.max(120, distance * 1.5)),
        delay: target.delay,
        ease: 'Quad.Out',
      })
    }
  }

  private buildMineStartRowByKey(
    currentMines: ReturnType<GameEngine['getMines']>,
    previousMines: ReturnType<GameEngine['getMines']>,
  ): Map<string, number> {
    const out = new Map<string, number>()
    if (currentMines.length === 0 || previousMines.length === 0) return out

    const previousByCol = new Map<number, number[]>()
    for (const mine of previousMines) {
      const rows = previousByCol.get(mine.col) || []
      rows.push(mine.row)
      previousByCol.set(mine.col, rows)
    }

    for (const rows of previousByCol.values()) {
      rows.sort((left, right) => left - right)
    }

    const currentSorted = [...currentMines].sort((left, right) => {
      if (left.col !== right.col) return left.col - right.col
      return left.row - right.row
    })

    for (const mine of currentSorted) {
      const rows = previousByCol.get(mine.col)
      if (!rows || rows.length === 0) continue

      let matchedIndex = -1
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (rows[index] <= mine.row) {
          matchedIndex = index
          break
        }
      }
      if (matchedIndex < 0) {
        matchedIndex = 0
      }

      const startRow = rows[matchedIndex]
      rows.splice(matchedIndex, 1)
      out.set(`${mine.row},${mine.col}`, startRow)
    }

    return out
  }

  private captureSpecialSnapshot(): SpecialSnapshot {
    return {
      mines: this.engine.getMines(),
      boss: this.engine.getBoss(),
    }
  }

  private buildTokenPositionIndex(board: (ModuleToken | null)[][]): Map<ModuleToken, Cell> {
    const positions = new Map<ModuleToken, Cell>()
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const token = board[row]?.[col]
        if (!token) continue
        positions.set(token, { row, col })
      }
    }
    return positions
  }

  private renderMergePreviewOverlay(
    board: (ModuleToken | null)[][],
    mergeSession: ReturnType<GameEngine['getMergeSessionSnapshot']>,
  ): void {
    const selectedTokens: Array<ModuleToken | null> = [null, null, null]
    let predictedToken: ModuleToken | null = null

    if (mergeSession.active && mergeSession.selection.length > 0) {
      for (let index = 0; index < 3; index += 1) {
        const cell = mergeSession.selection[index]
        if (!cell) continue
        selectedTokens[index] = board[cell.row]?.[cell.col] || null
      }

      if (mergeSession.state.readyToMerge) predictedToken = mergeSession.state.previewToken
    }

    const slotTokens: Array<ModuleToken | null> = [
      selectedTokens[0],
      selectedTokens[1],
      selectedTokens[2],
      predictedToken,
    ]

    const layout = this.getPreviewLayout()
    const panel = this.add.rectangle(
      layout.panelCenterX,
      layout.panelCenterY,
      layout.panelWidth,
      layout.panelHeight,
      0x0b111d,
      0.9,
    )
    panel.setStrokeStyle(1, 0x334155, 0.9)
    panel.setOrigin(0.5, 0.5)
    this.layer.add(panel)

    for (let index = 0; index < 4; index += 1) {
      const slotX = layout.slotCenters[index]
      const slotY = layout.slotCenterY
      const token = slotTokens[index]
      const isResultSlot = index === 3

      const ready = isResultSlot && mergeSession.active
        && mergeSession.selection.length > 0
        && predictedToken !== null

      const slotBg = this.add.rectangle(slotX, slotY, PREVIEW_SLOT_SIZE, PREVIEW_SLOT_SIZE, 0x05080f, 0.88)
      slotBg.setStrokeStyle(2, ready ? 0x6f99ff : 0x2c3a52, 1)
      slotBg.setOrigin(0.5, 0.5)
      this.layer.add(slotBg)

      if (token) {
        const frameReady = this.ensureTextureReady(token.frameSrc, token.frameTextureKey)
        const iconReady = this.ensureTextureReady(token.assetSrc, token.assetTextureKey)

        if (frameReady) {
          const frame = this.add.image(slotX, slotY, token.frameTextureKey)
          frame.setDisplaySize(PREVIEW_SLOT_SIZE - 4, PREVIEW_SLOT_SIZE - 4)
          this.layer.add(frame)
        }

        if (iconReady) {
          const icon = this.add.image(slotX, slotY, token.assetTextureKey)
          icon.setDisplaySize(PREVIEW_ICON_SIZE, PREVIEW_ICON_SIZE)
          this.layer.add(icon)
        }
      }

      if (index < 3) {
        const operator = this.add.text(
          slotX + (PREVIEW_SLOT_SIZE / 2) + PREVIEW_TEXT_GAP,
          slotY,
          index === 2 ? '=' : '+',
          {
            fontSize: '18px',
            color: '#d0d8e9',
          },
        )
        operator.setOrigin(0.5, 0.5)
        this.layer.add(operator)
      }
    }
  }

  private async tryMergeFromPreview(pointer: Phaser.Input.Pointer): Promise<boolean> {
    if (this.resolving || !this.engine.hasMergeSession()) return false

    const layout = this.getPreviewLayout()
    const withinResultSlot = pointer.x >= layout.resultSlot.left
      && pointer.x <= layout.resultSlot.right
      && pointer.y >= layout.resultSlot.top
      && pointer.y <= layout.resultSlot.bottom

    if (!withinResultSlot) return false

    const mergeState = this.engine.getMergeSessionSnapshot().state
    if (!mergeState.valid || !mergeState.readyToMerge) return false

    this.resolving = true
    try {
      const beforeBoard = this.engine.getBoard().map(row => row.slice())
      const beforeSpecials = this.captureSpecialSnapshot()
      const result = this.engine.confirmMergeSession()
      this.clearSelectionState()
      if (!result.valid) {
        this.emitStatus('Merge failed')
        this.renderBoard()
        return true
      }

      await this.renderMergedCascade(beforeBoard, beforeSpecials)
      this.recordMoveActivity()
      this.emitStatus('Merged')
      this.emitStats()
      return true
    } finally {
      this.resolving = false
    }
  }

  private async renderMergedCascade(
    beforeBoard: (ModuleToken | null)[][],
    beforeSpecials: SpecialSnapshot,
  ): Promise<void> {
    const previousTokenPositions = this.buildTokenPositionIndex(beforeBoard)
    this.renderBoard([], {
      animateCascade: true,
      previousTokenPositions,
      previousSpecialSnapshot: beforeSpecials,
    })
    await this.wait(170)
  }

  private getPreviewLayout(): {
    panelCenterX: number
    panelCenterY: number
    panelWidth: number
    panelHeight: number
    slotCenters: number[]
    slotCenterY: number
    resultSlot: { left: number; right: number; top: number; bottom: number }
  } {
    const boardWidth = BOARD_COLS * TILE_SIZE
    const contentWidth = (PREVIEW_SLOT_SIZE * 4) + (PREVIEW_GAP * 3) + (PREVIEW_TEXT_GAP * 3)
    const panelPadding = 10
    const panelWidth = contentWidth + (panelPadding * 2)
    const panelHeight = 56
    const panelCenterX = boardWidth - (panelWidth / 2) - 8
    const panelCenterY = PREVIEW_BAR_HEIGHT / 2
    const slotCenterY = panelCenterY
    const slotCenters: number[] = []

    let cursor = panelCenterX - (contentWidth / 2) + (PREVIEW_SLOT_SIZE / 2)
    for (let index = 0; index < 4; index += 1) {
      slotCenters.push(cursor)
      cursor += PREVIEW_SLOT_SIZE
      if (index < 3) cursor += PREVIEW_TEXT_GAP + PREVIEW_GAP
    }

    const resultX = slotCenters[3]
    const half = PREVIEW_SLOT_SIZE / 2

    return {
      panelCenterX,
      panelCenterY,
      panelWidth,
      panelHeight,
      slotCenters,
      slotCenterY,
      resultSlot: {
        left: resultX - half,
        right: resultX + half,
        top: slotCenterY - half,
        bottom: slotCenterY + half,
      },
    }
  }

  private emitStats(): void {
    const elapsedSeconds = this.getElapsedSeconds()
    this.callbacks.onStats?.(this.engine.getStats(elapsedSeconds))
    const boss = this.engine.getBoss()
    this.callbacks.onSpecials?.({
      mineCount: this.engine.getMines().length,
      bossHp: boss ? boss.hitsRemaining : 0,
      bossWave: boss ? boss.waveCount : 0,
      bossPhase: boss ? boss.currentPhase : 0,
    })
    this.emitInventory()
  }

  private getElapsedSeconds(): number {
    return Math.max(1, Math.floor((Date.now() - this.startMs) / 1000))
  }

  private emitStatus(status: string): void {
    this.callbacks.onStatus?.(status)
  }

  private emitAutoplayStatus(): void {
    this.callbacks.onAutoplay?.(this.getAutoplayStatus())
  }

  private emitInventory(): void {
    this.callbacks.onInventory?.(this.engine.getInventory())
  }

  private buildRuntimeState(): BemergedRuntimeState {
    return {
      version: 1,
      elapsedSeconds: this.getElapsedSeconds(),
      restartCount: this.restartCount,
      engine: this.engine.exportRuntimeState(),
    }
  }

  private emitRuntimeStateChanged(): void {
    this.callbacks.onRuntimeStateChanged?.(this.buildRuntimeState())
  }

  private clearSelectionState(): void {
    this.selected = null
    this.engine.cancelMergeSession()
  }

  private setHintMove(
    move: Move | null,
    options?: { pulseToggles?: number; autoClearMs?: number; source?: 'manual' | 'auto' | 'system' },
  ): void {
    this.hintMove = move

    if (this.hintAutoClearTimer) {
      this.hintAutoClearTimer.remove(false)
      this.hintAutoClearTimer = null
    }

    if (!move) {
      this.hintPulsePhase = 0
      if (this.hintPulseTimer) {
        this.hintPulseTimer.remove(false)
        this.hintPulseTimer = null
      }
      this.autoHintVisible = false
      return
    }

    if (this.hintPulseTimer) {
      this.hintPulseTimer.remove(false)
      this.hintPulseTimer = null
    }

    const pulseToggles = Math.max(0, Math.floor(Number(options?.pulseToggles || 0)))
    if (pulseToggles > 0) {
      let togglesRemaining = pulseToggles
      this.hintPulseTimer = this.time.addEvent({
        delay: 320,
        loop: true,
        callback: () => {
          if (!this.hintMove || !this.hintPulseTimer) return
          this.hintPulsePhase = this.hintPulsePhase === 0 ? 1 : 0
          togglesRemaining -= 1
          this.renderBoard()
          if (togglesRemaining <= 0) {
            this.hintPulseTimer?.remove(false)
            this.hintPulseTimer = null
            this.renderBoard()
          }
        },
      })
    } else {
      this.hintPulsePhase = 0
    }

    const autoClearMs = Math.max(0, Math.floor(Number(options?.autoClearMs || 0)))
    if (autoClearMs > 0) {
      this.hintAutoClearTimer = this.time.delayedCall(autoClearMs, () => {
        this.setHintMove(null, { source: 'system' })
        this.renderBoard()
      })
    }

    this.autoHintVisible = options?.source === 'auto'
  }

  private startIdleHintWatcher(): void {
    this.lastMoveActivityAtMs = Date.now()
    this.nextIdleHintAtMs = this.lastMoveActivityAtMs + 10000
    if (this.idleHintTimer) {
      this.idleHintTimer.remove(false)
      this.idleHintTimer = null
    }

    this.idleHintTimer = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        if (this.hintsDisabled) return
        if (this.aiStatus.active) return
        if (this.resolving) return
        if (this.engine.hasMergeSession()) return

        const now = Date.now()
        if (this.autoHintVisible) return
        if (now < this.nextIdleHintAtMs) return

        const hintMoves = this.engine.findHintMoves()
        if (hintMoves.length === 0) return

        const currentKey = this.hintMove
          ? `${this.hintMove.from.row}:${this.hintMove.from.col}:${this.hintMove.to.row}:${this.hintMove.to.col}`
          : null
        const currentIndex = currentKey
          ? hintMoves.findIndex(move => `${move.from.row}:${move.from.col}:${move.to.row}:${move.to.col}` === currentKey)
          : -1
        const baseIndex = currentIndex >= 0 ? currentIndex : this.hintCycleIndex
        const nextIndex = (baseIndex + 1 + hintMoves.length) % hintMoves.length
        const hint = hintMoves[nextIndex]
        this.hintCycleIndex = nextIndex
        this.setHintMove(hint, { pulseToggles: 8, autoClearMs: 3000, source: 'auto' })
        this.renderBoard()
        this.emitStatus('Hint highlighted')
        this.nextIdleHintAtMs += 10000
        if (this.nextIdleHintAtMs < now) {
          this.nextIdleHintAtMs = now + 10000
        }
      },
    })
  }

  private recordMoveActivity(): void {
    this.recordInteractionActivity()
    this.emitRuntimeStateChanged()
  }

  private recordInteractionActivity(): void {
    this.lastMoveActivityAtMs = Date.now()
    this.nextIdleHintAtMs = this.lastMoveActivityAtMs + 10000
    if (this.autoHintVisible) {
      this.setHintMove(null, { source: 'system' })
      this.renderBoard()
    }
  }

  private enterMergeMode(cell: Cell): void {
    this.selected = null
    const result = this.engine.startMergeSession(cell)
    if (!result.started) {
      if (result.reason === 'blocked-tile') {
        this.emitStatus('Tile is blocked by mine or boss')
      } else if (result.reason === 'base-cannot-merge') {
        this.emitStatus('Common modules cannot be merged')
      }
      return
    }

    this.emitMergeModeStatus()
    this.renderBoard()
  }

  private emitMergeModeStatus(): void {
    const mergeState = this.engine.getMergeSessionSnapshot().state
    const required = mergeState.requiredTotal
    const selectedCount = mergeState.selectedCount
    this.emitStatus(`Merge mode ${selectedCount}/${Number.isFinite(required) ? required : '?'}: select highlighted modules, tap base when ready, tap outside to cancel`)
  }

  private async wait(delayMs: number): Promise<void> {
    await new Promise<void>(resolve => {
      this.time.delayedCall(delayMs, () => resolve())
    })
  }

  private ensureTextureReady(url: string, key: string): boolean {
    const resolvedKey = String(key).trim()
    if (!resolvedKey) return false
    if (this.textures.exists(resolvedKey)) return true
    if (this.failedTextureLoads.has(resolvedKey)) return false

    if (!this.pendingTextureLoads.has(resolvedKey)) {
      this.pendingTextureLoads.add(resolvedKey)
      this.load.image(resolvedKey, url)

      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.pendingTextureLoads.delete(resolvedKey)
        this.renderBoard()
      })

      if (!this.load.isLoading()) {
        this.load.start()
      }
    }

    return false
  }
}
