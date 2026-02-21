export const BOARD_ROWS = 8
export const BOARD_COLS = 14
export const TILE_SIZE = 64
export const TILE_GAP = 6

export type ModuleType = 'Cannon' | 'Armor' | 'Generator' | 'Core'
export type ModuleRarity =
  | 'Common'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythic'
  | 'Ancestral'

export type Cell = {
  row: number
  col: number
}

export type Move = {
  from: Cell
  to: Cell
}

export type AutoplayGoal =
  | 'balanced'
  | 'objective-progress'
  | 'max-shards'
  | 'max-merges'
  | 'farm-cannon'
  | 'farm-armor'
  | 'farm-generator'
  | 'farm-core'
  | 'boss-damage'

export type ObjectiveTarget = {
  targetStars: number
  perType: Record<ModuleType, number>
}

export type ObjectiveProgress = {
  targetStars: number
  highestStarsByType: Record<ModuleType, number>
  completedTypeCount: number
  objectiveComplete: boolean
  completionPercent: number
}

export type AutoplayLearningProfile = {
  attempts: number
  typeBias: Record<ModuleType, number>
  bestObjectiveCompletionPercent: number
  bestShards: number
  bestElapsedSeconds: number
}

export type AutoplayRewardBreakdown = {
  objective: number
  shards: number
  time: number
  risk: number
  total: number
}

export type ModuleToken = {
  instanceId: string
  templateId: string
  type: ModuleType
  rarity: ModuleRarity
  plus: boolean
  stars?: number
  frameSrc: string
  assetSrc: string
  frameTextureKey: string
  assetTextureKey: string
  matchKey: string
}

export type MineState = {
  row: number
  col: number
  movesRemaining: number
  blastRadius: number
}

export type BossState = {
  row: number
  col: number
  hitsRemaining: number
  maxHits?: number
  comboCount?: number
  waveCount: number
  destructiveActive: boolean
  currentPhase: 1 | 2 | 3 | 4
  phaseMoveCount: number
  totalDestructiveMoves: number
  lastDestructiveTick: number
}

export type GameStats = {
  score: number
  moves: number
  merges: number
  shatters: number
  elapsedSeconds: number
  shardsPerHour: number
  shardsByType: Record<ModuleType, number>
  shardBoostLevels?: Record<ModuleType, number>
  shardBoostNextCost?: Record<ModuleType, number>
  canAffordShardBoost?: Record<ModuleType, boolean>
}

export type AutoplayStatus = {
  active: boolean
  delayMs: number
  goal: AutoplayGoal
  testingMode: boolean
  movesExecuted: number
  mergesExecuted: number
  validMoveCount: number
  lastDecision: string | null
  lastReward: AutoplayRewardBreakdown | null
  elapsedSeconds: number
  lastError: string | null
}
