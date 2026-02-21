import { GameEngine } from './GameEngine'
import { createModuleCatalog } from './catalog'
import { SeededRng } from './rng'
import { applyBemergedParityTuningPatch, getBemergedParityTuningSnapshot } from './parityTuning'
import { type AutoplayGoal, BOARD_COLS, BOARD_ROWS, type Cell, type ModuleType, type Move, type ObjectiveProgress } from './types'
import { type BemergedScenario, getBemergedScenarioById } from './scenarios'

export type BemergedHeadlessAction = {
  actionId: number
} & (
  {
    type: 'swap'
    fromRow: number
    fromCol: number
    toRow: number
    toCol: number
  }
  | {
    type: 'merge'
    selection: Cell[]
  }
  | {
    type: 'inventory'
    cell: Cell
    slotType: ModuleType
  }
)

export type BemergedHeadlessState = {
  board: number[][]
  boss: {
    hp: number
    phase: number
    waveCount: number
  } | null
  player: {
    moves: number
    score: number
    merges: number
    shatters: number
    shardsByType: {
      Cannon: number
      Armor: number
      Generator: number
      Core: number
    }
  }
  meta: {
    seed: number
    turn: number
    goal: AutoplayGoal
    objective: ObjectiveProgress
  }
}

export type BemergedHeadlessStepResult = {
  nextState: BemergedHeadlessState
  reward: number
  rewardBreakdown: {
    objective: number
    shards: number
    time: number
    risk: number
    antiLoop: number
    total: number
  }
  done: boolean
  info: {
    reason: 'objective-complete' | 'max-turns' | 'no-valid-actions' | 'stagnation' | 'invalid-action' | 'continue'
    validActionCount: number
    loopCount: number
    turn: number
  }
}

export type BemergedHeadlessResetResult = {
  state: BemergedHeadlessState
  validActions: BemergedHeadlessAction[]
}

type BemergedHeadlessOptions = {
  seed?: number
  goal?: AutoplayGoal
  maxTurns?: number
  scenarioId?: string
  stagnationTurnLimit?: number
}

const DEFAULT_MAX_TURNS = 800
const DEFAULT_STAGNATION_LIMIT = 25

function encodeTokenToInt(token: unknown): number {
  if (!token || typeof token !== 'object') return 0
  const row = token as Record<string, unknown>
  const type = String(row.type || '')
  const rarity = String(row.rarity || '')
  const plus = Boolean(row.plus)
  const stars = Number(row.stars || 0)

  const typeId = type === 'Cannon'
    ? 1
    : type === 'Armor'
      ? 2
      : type === 'Generator'
        ? 3
        : type === 'Core'
          ? 4
          : 0

  const rarityId = rarity === 'Common'
    ? 1
    : rarity === 'Rare'
      ? 2
      : rarity === 'Epic'
        ? 3
        : rarity === 'Legendary'
          ? 4
          : rarity === 'Mythic'
            ? 5
            : rarity === 'Ancestral'
              ? 6
              : 0

  return (typeId * 100) + (rarityId * 10) + (plus ? 1 : 0) + Math.max(0, Math.min(9, Math.floor(stars)))
}

function buildBoardState(engine: GameEngine): number[][] {
  const board = engine.getBoard()
  const out: number[][] = []

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    const encodedRow: number[] = []
    for (let col = 0; col < BOARD_COLS; col += 1) {
      encodedRow.push(encodeTokenToInt(board[row]?.[col] || null))
    }
    out.push(encodedRow)
  }

  return out
}

function boardHash(board: number[][]): string {
  return board.map(row => row.join(',')).join('|')
}

function toState(engine: GameEngine, input: { seed: number; turn: number; goal: AutoplayGoal }): BemergedHeadlessState {
  const objective = engine.getObjectiveProgress()
  const stats = engine.getStats(Math.max(1, input.turn))
  const boss = engine.getBoss()

  return {
    board: buildBoardState(engine),
    boss: boss
      ? {
        hp: boss.hitsRemaining,
        phase: boss.currentPhase,
        waveCount: boss.waveCount,
      }
      : null,
    player: {
      moves: stats.moves,
      score: stats.score,
      merges: stats.merges,
      shatters: stats.shatters,
      shardsByType: {
        Cannon: stats.shardsByType.Cannon,
        Armor: stats.shardsByType.Armor,
        Generator: stats.shardsByType.Generator,
        Core: stats.shardsByType.Core,
      },
    },
    meta: {
      seed: input.seed,
      turn: input.turn,
      goal: input.goal,
      objective,
    },
  }
}

export class BemergedHeadlessEnv {
  private seed: number
  private goal: AutoplayGoal
  private maxTurns: number
  private readonly stagnationTurnLimit: number
  private readonly scenario: BemergedScenario | null
  private engine: GameEngine
  private turn = 0
  private noProgressTurns = 0
  private lastSwapMove: Move | null = null
  private lastAutoplayActionType: BemergedHeadlessAction['type'] | null = null
  private readonly seenStateCounts = new Map<string, number>()
  private readonly initialParitySnapshot = getBemergedParityTuningSnapshot()

  constructor(options?: BemergedHeadlessOptions) {
    this.scenario = options?.scenarioId ? getBemergedScenarioById(options.scenarioId) : null
    this.seed = Number.isFinite(Number(options?.seed))
      ? Math.floor(Number(options?.seed))
      : this.scenario?.seed ?? 1337
    this.goal = options?.goal || this.scenario?.goal || 'objective-progress'
    this.maxTurns = Number.isFinite(Number(options?.maxTurns))
      ? Math.max(1, Math.floor(Number(options?.maxTurns)))
      : this.scenario?.maxTurns ?? DEFAULT_MAX_TURNS
    this.stagnationTurnLimit = Number.isFinite(Number(options?.stagnationTurnLimit))
      ? Math.max(5, Math.floor(Number(options?.stagnationTurnLimit)))
      : DEFAULT_STAGNATION_LIMIT

    if (this.scenario?.parityPatch) {
      applyBemergedParityTuningPatch(this.scenario.parityPatch)
    }

    this.engine = this.createEngine(this.seed)
    this.trackState()
  }

  dispose(): void {
    applyBemergedParityTuningPatch(this.initialParitySnapshot)
  }

  reset(seed?: number): BemergedHeadlessResetResult {
    this.turn = 0
    this.noProgressTurns = 0
    this.lastSwapMove = null
    this.lastAutoplayActionType = null
    this.seenStateCounts.clear()

    if (Number.isFinite(Number(seed))) {
      this.seed = Math.floor(Number(seed))
    }

    this.engine = this.createEngine(this.seed)
    this.trackState()

    const state = toState(this.engine, {
      seed: this.seed,
      turn: this.turn,
      goal: this.goal,
    })

    return {
      state,
      validActions: this.get_valid_actions(),
    }
  }

  get_valid_actions(): BemergedHeadlessAction[] {
    const validMoves = this.engine.findValidMoves()
    const actions: BemergedHeadlessAction[] = []
    const inventoryAction = this.engine.chooseAutoplayInventoryAction(this.goal)
    if (inventoryAction) {
      actions.push({
        actionId: actions.length,
        type: 'inventory',
        cell: { row: inventoryAction.cell.row, col: inventoryAction.cell.col },
        slotType: inventoryAction.slotType,
      })
    }

    const mergeSelection = this.engine.chooseAutoplayMergeSelection(this.goal)
    if (mergeSelection && mergeSelection.length > 1) {
      actions.push({
        actionId: actions.length,
        type: 'merge',
        selection: mergeSelection.map(cell => ({ row: cell.row, col: cell.col })),
      })
    }

    const swapOffset = actions.length
    const swapActions = validMoves.map((move, index) => ({
      actionId: swapOffset + index,
      type: 'swap' as const,
      fromRow: move.from.row,
      fromCol: move.from.col,
      toRow: move.to.row,
      toCol: move.to.col,
    }))

    actions.push(...swapActions)
    return actions
  }

  choose_autoplay_action(goal?: AutoplayGoal): number | null {
    const normalizedGoal = goal || this.goal
    const mergeSelection = this.engine.chooseAutoplayMergeSelection(normalizedGoal)
    if (mergeSelection && mergeSelection.length > 1) {
      const mergeCandidate = this.get_valid_actions().find(action => action.type === 'merge')
      if (mergeCandidate) return mergeCandidate.actionId
    }

    const clearMove = this.engine.chooseAutoplayClearMove(normalizedGoal)
    if (clearMove) {
      const clearCandidate = this.get_valid_actions().find(action =>
        action.type === 'swap'
        && action.fromRow === clearMove.from.row
        && action.fromCol === clearMove.from.col
        && action.toRow === clearMove.to.row
        && action.toCol === clearMove.to.col,
      )
      if (clearCandidate) return clearCandidate.actionId
    }

    if (this.lastAutoplayActionType !== 'inventory') {
      const inventoryAction = this.engine.chooseAutoplayInventoryAction(normalizedGoal)
      if (inventoryAction) {
        const inventoryCandidate = this.get_valid_actions().find(action =>
          action.type === 'inventory'
          && action.cell.row === inventoryAction.cell.row
          && action.cell.col === inventoryAction.cell.col
          && action.slotType === inventoryAction.slotType,
        )
        if (inventoryCandidate) return inventoryCandidate.actionId
      }
    }

    const validActions = this.get_valid_actions()
    const mergeAction = validActions.find(action => action.type === 'merge')
    if (mergeAction) return mergeAction.actionId

    const selectedMove = this.engine.chooseAutoplayMove(normalizedGoal)
    if (!selectedMove) return null

    const match = validActions.find(action =>
      action.type === 'swap'
      &&
      action.fromRow === selectedMove.from.row
      && action.fromCol === selectedMove.from.col
      && action.toRow === selectedMove.to.row
      && action.toCol === selectedMove.to.col,
    )

    return typeof match?.actionId === 'number' ? match.actionId : null
  }

  step(action: number | BemergedHeadlessAction): BemergedHeadlessStepResult {
    const validActions = this.get_valid_actions()
    if (validActions.length === 0) {
      this.engine.shuffle()
      const state = toState(this.engine, {
        seed: this.seed,
        turn: this.turn,
        goal: this.goal,
      })
      const loopCount = this.trackState()
      const antiLoop = loopCount > 1 ? -Math.min(10, loopCount - 1) : 0
      return {
        nextState: state,
        reward: -3 + antiLoop,
        rewardBreakdown: {
          objective: 0,
          shards: 0,
          time: 0,
          risk: -3,
          antiLoop,
          total: -3 + antiLoop,
        },
        done: false,
        info: {
          reason: 'continue',
          validActionCount: this.engine.findValidMoves().length,
          loopCount,
          turn: this.turn,
        },
      }
    }

    const actionId = typeof action === 'number' ? action : Number(action.actionId)
    if (!Number.isInteger(actionId) || actionId < 0 || actionId >= validActions.length) {
      this.turn += 1
      this.noProgressTurns += 1
      const stallPenalty = Math.min(12, this.noProgressTurns)
      const timePenalty = -1 - stallPenalty
      const state = toState(this.engine, {
        seed: this.seed,
        turn: this.turn,
        goal: this.goal,
      })
      const loopCount = this.currentLoopCount(state.board)
      return {
        nextState: state,
        reward: -5 + timePenalty,
        rewardBreakdown: {
          objective: 0,
          shards: 0,
          time: timePenalty,
          risk: -5,
          antiLoop: 0,
          total: -5 + timePenalty,
        },
        done: false,
        info: {
          reason: 'invalid-action',
          validActionCount: validActions.length,
          loopCount,
          turn: this.turn,
        },
      }
    }

    const selected = validActions[actionId]
    this.lastAutoplayActionType = selected.type

    const beforeState = toState(this.engine, {
      seed: this.seed,
      turn: this.turn,
      goal: this.goal,
    })

    this.turn += 1
    let merged = false
    let pingPongPenalty = 0
    if (selected.type === 'inventory') {
      this.engine.applyInventoryActionToSlot(selected.cell, selected.slotType)
      merged = false
      this.lastSwapMove = null
    } else if (selected.type === 'merge') {
      const mergeResult = this.engine.applyMergeSelectionIfReady(selected.selection)
      merged = mergeResult.valid && mergeResult.merged
      this.lastSwapMove = null
    } else {
      const move: Move = {
        from: { row: selected.fromRow, col: selected.fromCol },
        to: { row: selected.toRow, col: selected.toCol },
      }
      if (this.lastSwapMove) {
        const isReverseOfLast = this.lastSwapMove.from.row === move.to.row
          && this.lastSwapMove.from.col === move.to.col
          && this.lastSwapMove.to.row === move.from.row
          && this.lastSwapMove.to.col === move.from.col
        if (isReverseOfLast) {
          pingPongPenalty = -8
        }
      }
      const result = this.engine.applyMove(move)
      merged = result.valid && result.merged
      this.lastSwapMove = move
    }

    let nextState = toState(this.engine, {
      seed: this.seed,
      turn: this.turn,
      goal: this.goal,
    })

    const hazardLossScore = this.engine.consumeAndResetHazardLossScore()
    const hazardLossPenalty = hazardLossScore > 0 ? -(hazardLossScore * 22) : 0

    const objective = (nextState.meta.objective.completionPercent - beforeState.meta.objective.completionPercent) * 10
    const shards = nextState.player.score - beforeState.player.score
    const stallPenalty = Math.min(12, Math.max(0, this.noProgressTurns - 1))
    const time = -1 - stallPenalty
    const risk = (merged ? 2 : -2) + hazardLossPenalty

    const progressDelta = objective + shards
    if (progressDelta <= 0) {
      this.noProgressTurns += 1
    } else {
      this.noProgressTurns = 0
    }

    let loopCount = this.trackState()
    let antiLoop = (loopCount > 1 ? -Math.min(10, loopCount - 1) : 0) + pingPongPenalty

    const rewardBreakdown = {
      objective,
      shards,
      time,
      risk,
      antiLoop,
      total: objective + shards + time + risk + antiLoop,
    }

    const objectiveComplete = nextState.meta.objective.objectiveComplete
    const maxTurnsReached = this.turn >= this.maxTurns
    const stagnationReached = this.noProgressTurns >= this.stagnationTurnLimit
    const noValidActionsAfter = this.engine.findValidMoves().length === 0

    if (!objectiveComplete && !maxTurnsReached && !stagnationReached && noValidActionsAfter) {
      this.engine.shuffle()
      nextState = toState(this.engine, {
        seed: this.seed,
        turn: this.turn,
        goal: this.goal,
      })
      loopCount = this.trackState()
      antiLoop = loopCount > 1 ? -Math.min(10, loopCount - 1) : 0
      rewardBreakdown.risk -= 3
      rewardBreakdown.antiLoop = antiLoop
      rewardBreakdown.total = rewardBreakdown.objective + rewardBreakdown.shards + rewardBreakdown.time + rewardBreakdown.risk + rewardBreakdown.antiLoop
    }

    const done = objectiveComplete || maxTurnsReached || stagnationReached
    const reason: BemergedHeadlessStepResult['info']['reason'] = objectiveComplete
      ? 'objective-complete'
      : maxTurnsReached
        ? 'max-turns'
        : stagnationReached
          ? 'stagnation'
          : 'continue'

    return {
      nextState,
      reward: rewardBreakdown.total,
      rewardBreakdown,
      done,
      info: {
        reason,
        validActionCount: this.engine.findValidMoves().length,
        loopCount,
        turn: this.turn,
      },
    }
  }

  private createEngine(seed: number): GameEngine {
    const rng = new SeededRng(seed)
    const catalog = createModuleCatalog(rng)
    return new GameEngine({
      seed,
      catalog,
    })
  }

  private currentLoopCount(board: number[][]): number {
    return this.seenStateCounts.get(boardHash(board)) || 0
  }

  private trackState(): number {
    const state = toState(this.engine, {
      seed: this.seed,
      turn: this.turn,
      goal: this.goal,
    })
    const hash = boardHash(state.board)
    const nextCount = (this.seenStateCounts.get(hash) || 0) + 1
    this.seenStateCounts.set(hash, nextCount)
    return nextCount
  }
}
