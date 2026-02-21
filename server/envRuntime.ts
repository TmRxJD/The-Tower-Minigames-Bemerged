import {
  BEMERGED_SIM_TOKENS,
  type BemergedSimBoard,
  type BemergedSimMove,
  type BemergedSimToken,
  findBemergedSimValidMoves,
  runBemergedSimMove,
} from '../../../src/services/tracker-ai/qa/bemergedSimulation'

export type RuntimeAction = {
  actionId: number
  type: 'swap'
  fromRow: number
  fromCol: number
  toRow: number
  toCol: number
}

export type RuntimeState = {
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
    goal: 'objective-progress'
    objective: {
      highestStarsByType: {
        Cannon: number
        Armor: number
        Generator: number
        Core: number
      }
      completedTypeCount: number
      totalTypeCount: 4
      completionPercent: number
      objectiveComplete: boolean
    }
  }
}

export type RuntimeStepResult = {
  nextState: RuntimeState
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

type RuntimeOptions = {
  seed?: number
  maxTurns?: number
  stagnationTurnLimit?: number
}

type ModuleType = 'Cannon' | 'Armor' | 'Generator' | 'Core'

const BOARD_ROWS = 8
const BOARD_COLS = 8
const STATE_COLS = 14
const MAX_TURNS_DEFAULT = 800
const STAGNATION_LIMIT_DEFAULT = 25
const TYPE_BY_TOKEN: Record<BemergedSimToken, ModuleType> = {
  C: 'Cannon',
  A: 'Armor',
  G: 'Generator',
  R: 'Core',
}

const TOKEN_TO_INT: Record<BemergedSimToken, number> = {
  C: 100,
  A: 200,
  G: 300,
  R: 400,
}

function seededInt(seed: number): number {
  let value = seed >>> 0
  value ^= value << 13
  value ^= value >>> 17
  value ^= value << 5
  return value >>> 0
}

function nextToken(seed: number, row: number, col: number): BemergedSimToken {
  const value = seededInt(seed + (row * 997) + (col * 37))
  return BEMERGED_SIM_TOKENS[value % BEMERGED_SIM_TOKENS.length]
}

function boardHash(board: BemergedSimBoard): string {
  return board.map(row => row.join('')).join('|')
}

function starFromShards(shards: number): number {
  if (shards <= 0) return 0
  if (shards >= 250) return 5
  return Math.max(1, Math.min(5, Math.floor(shards / 50) + 1))
}

export class BemergedRuntimeEnv {
  private seed: number
  private maxTurns: number
  private stagnationTurnLimit: number
  private board: BemergedSimBoard = []
  private turn = 0
  private noProgressTurns = 0
  private score = 0
  private merges = 0
  private shatters = 0
  private loopMap = new Map<string, number>()
  private shardsByType: Record<ModuleType, number> = {
    Cannon: 0,
    Armor: 0,
    Generator: 0,
    Core: 0,
  }

  constructor(options?: RuntimeOptions) {
    this.seed = Math.max(1, Math.floor(Number(options?.seed) || 1337))
    this.maxTurns = Math.max(50, Math.floor(Number(options?.maxTurns) || MAX_TURNS_DEFAULT))
    this.stagnationTurnLimit = Math.max(5, Math.floor(Number(options?.stagnationTurnLimit) || STAGNATION_LIMIT_DEFAULT))
    this.reset(this.seed)
  }

  reset(seed?: number): { state: RuntimeState; validActions: RuntimeAction[] } {
    if (Number.isFinite(Number(seed))) {
      this.seed = Math.max(1, Math.floor(Number(seed)))
    }

    this.turn = 0
    this.noProgressTurns = 0
    this.score = 0
    this.merges = 0
    this.shatters = 0
    this.loopMap.clear()
    this.shardsByType = {
      Cannon: 0,
      Armor: 0,
      Generator: 0,
      Core: 0,
    }

    this.board = []
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const boardRow: BemergedSimToken[] = []
      for (let col = 0; col < BOARD_COLS; col += 1) {
        boardRow.push(nextToken(this.seed, row, col))
      }
      this.board.push(boardRow)
    }

    this.trackLoop()

    return {
      state: this.toState(),
      validActions: this.get_valid_actions(),
    }
  }

  get_valid_actions(): RuntimeAction[] {
    const moves = findBemergedSimValidMoves(this.board)
    return moves.map((move, actionId) => ({
      actionId,
      type: 'swap',
      fromRow: move.fromRow,
      fromCol: move.fromCol,
      toRow: move.toRow,
      toCol: move.toCol,
    }))
  }

  step(actionId: number): RuntimeStepResult {
    const validActions = this.get_valid_actions()
    if (validActions.length === 0) {
      return {
        nextState: this.toState(),
        reward: -10,
        rewardBreakdown: {
          objective: 0,
          shards: 0,
          time: -2,
          risk: -4,
          antiLoop: -4,
          total: -10,
        },
        done: true,
        info: {
          reason: 'no-valid-actions',
          validActionCount: 0,
          loopCount: this.currentLoopCount(),
          turn: this.turn,
        },
      }
    }

    if (!Number.isInteger(actionId) || actionId < 0 || actionId >= validActions.length) {
      return {
        nextState: this.toState(),
        reward: -6,
        rewardBreakdown: {
          objective: 0,
          shards: 0,
          time: -1,
          risk: -5,
          antiLoop: 0,
          total: -6,
        },
        done: false,
        info: {
          reason: 'invalid-action',
          validActionCount: validActions.length,
          loopCount: this.currentLoopCount(),
          turn: this.turn,
        },
      }
    }

    const chosen = validActions[actionId]
    const sourceToken = this.board[chosen.fromRow]?.[chosen.fromCol]
    const before = this.objectiveProgress()

    const result = runBemergedSimMove(this.board, this.toMove(chosen))
    if (!result.valid) {
      return {
        nextState: this.toState(),
        reward: -3,
        rewardBreakdown: {
          objective: 0,
          shards: 0,
          time: -1,
          risk: -2,
          antiLoop: 0,
          total: -3,
        },
        done: false,
        info: {
          reason: 'invalid-action',
          validActionCount: validActions.length,
          loopCount: this.currentLoopCount(),
          turn: this.turn,
        },
      }
    }

    this.turn += 1
    this.board = result.board
    this.merges += 1
    this.shatters += Math.max(0, result.cascades - 1)
    this.score += (result.totalMatchesCleared * 10) + (result.cascades * 15)

    const shardType = sourceToken ? TYPE_BY_TOKEN[sourceToken] : null
    if (shardType) {
      this.shardsByType[shardType] += result.shardsAwarded
    }

    const after = this.objectiveProgress()
    const objectiveDelta = Math.max(0, after.completionPercent - before.completionPercent)
    const shardTotal = result.shardsAwarded
    const timePenalty = -Math.min(2.5, 0.02 * this.turn)

    this.trackLoop()
    const loopCount = this.currentLoopCount()
    const antiLoopPenalty = loopCount > 1 ? -Math.min(3, loopCount - 1) : 0

    if (objectiveDelta > 0 || shardTotal > 0) {
      this.noProgressTurns = 0
    } else {
      this.noProgressTurns += 1
    }

    const doneByObjective = after.objectiveComplete
    const doneByTurns = this.turn >= this.maxTurns
    const doneByStagnation = this.noProgressTurns >= this.stagnationTurnLimit

    const done = doneByObjective || doneByTurns || doneByStagnation
    const reason: RuntimeStepResult['info']['reason'] = doneByObjective
      ? 'objective-complete'
      : doneByTurns
        ? 'max-turns'
        : doneByStagnation
          ? 'stagnation'
          : 'continue'

    const rewardBreakdown = {
      objective: Number((objectiveDelta * 12).toFixed(3)),
      shards: Number((shardTotal * 0.04).toFixed(3)),
      time: Number(timePenalty.toFixed(3)),
      risk: doneByStagnation ? -4 : 0,
      antiLoop: Number(antiLoopPenalty.toFixed(3)),
      total: 0,
    }

    rewardBreakdown.total = Number((
      rewardBreakdown.objective
      + rewardBreakdown.shards
      + rewardBreakdown.time
      + rewardBreakdown.risk
      + rewardBreakdown.antiLoop
    ).toFixed(3))

    return {
      nextState: this.toState(),
      reward: rewardBreakdown.total,
      rewardBreakdown,
      done,
      info: {
        reason,
        validActionCount: this.get_valid_actions().length,
        loopCount,
        turn: this.turn,
      },
    }
  }

  dispose(): void {
    this.loopMap.clear()
  }

  private trackLoop(): void {
    const hash = boardHash(this.board)
    this.loopMap.set(hash, (this.loopMap.get(hash) || 0) + 1)
  }

  private currentLoopCount(): number {
    const hash = boardHash(this.board)
    return this.loopMap.get(hash) || 0
  }

  private toMove(action: RuntimeAction): BemergedSimMove {
    return {
      fromRow: action.fromRow,
      fromCol: action.fromCol,
      toRow: action.toRow,
      toCol: action.toCol,
    }
  }

  private objectiveProgress() {
    const highestStarsByType = {
      Cannon: starFromShards(this.shardsByType.Cannon),
      Armor: starFromShards(this.shardsByType.Armor),
      Generator: starFromShards(this.shardsByType.Generator),
      Core: starFromShards(this.shardsByType.Core),
    }

    const completedTypeCount =
      Number(highestStarsByType.Cannon >= 5)
      + Number(highestStarsByType.Armor >= 5)
      + Number(highestStarsByType.Generator >= 5)
      + Number(highestStarsByType.Core >= 5)

    const completionPercent = Number(((completedTypeCount / 4) * 100).toFixed(2))

    return {
      highestStarsByType,
      completedTypeCount,
      totalTypeCount: 4 as const,
      completionPercent,
      objectiveComplete: completedTypeCount >= 4,
    }
  }

  private toState(): RuntimeState {
    const encodedBoard: number[][] = []

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const outRow: number[] = []
      for (let col = 0; col < STATE_COLS; col += 1) {
        if (col < BOARD_COLS) {
          const token = this.board[row][col]
          outRow.push(TOKEN_TO_INT[token] || 0)
          continue
        }

        if (col === 8) outRow.push(this.turn)
        else if (col === 9) outRow.push(this.shardsByType.Cannon)
        else if (col === 10) outRow.push(this.shardsByType.Armor)
        else if (col === 11) outRow.push(this.shardsByType.Generator)
        else if (col === 12) outRow.push(this.shardsByType.Core)
        else outRow.push(this.maxTurns - this.turn)
      }
      encodedBoard.push(outRow)
    }

    return {
      board: encodedBoard,
      boss: null,
      player: {
        moves: this.turn,
        score: this.score,
        merges: this.merges,
        shatters: this.shatters,
        shardsByType: {
          Cannon: this.shardsByType.Cannon,
          Armor: this.shardsByType.Armor,
          Generator: this.shardsByType.Generator,
          Core: this.shardsByType.Core,
        },
      },
      meta: {
        seed: this.seed,
        turn: this.turn,
        goal: 'objective-progress',
        objective: this.objectiveProgress(),
      },
    }
  }
}
