import type { ModuleRarity } from './types'

export type BemergedParityTuning = {
  shardsPerClear: number
  dropRates: {
    Common: number
    Rare: number
    Epic: number
  }
  mine: {
    baseMoves: number
    blastRadius: number
    spawnPercentPerDrop: number
    spawnCooldownMoves: number
  }
  boss: {
    spawnEveryMoves: number
    baseRequiredHits: number
    requiredHitsStepPerSpawn: number
    destructionThreshold: number
    moveThreshold: number
    phaseDuration: number
  }
  damage: {
    bossHitByRarity: Record<ModuleRarity, number>
  }
}

export const bemergedParityTuning: BemergedParityTuning = {
  shardsPerClear: 5,
  dropRates: {
    Common: 0.685,
    Rare: 0.29,
    Epic: 0.025,
  },
  mine: {
    baseMoves: 10,
    blastRadius: 2,
    spawnPercentPerDrop: 1,
    spawnCooldownMoves: 10,
  },
  boss: {
    spawnEveryMoves: 100,
    baseRequiredHits: 100,
    requiredHitsStepPerSpawn: 10,
    destructionThreshold: 20,
    moveThreshold: 4,
    phaseDuration: 10,
  },
  damage: {
    bossHitByRarity: {
      Common: 1,
      Rare: 2,
      Epic: 9,
      Legendary: 54,
      Mythic: 0,
      Ancestral: 0,
    },
  },
}

export function getBossDamageForRarity(rarity: ModuleRarity): number {
  return bemergedParityTuning.damage.bossHitByRarity[rarity] ?? 0
}

export type BemergedParityTuningPatch = {
  shardsPerClear?: number
  dropRates?: {
    Common?: number
    Rare?: number
    Epic?: number
  }
  mine?: {
    baseMoves?: number
    blastRadius?: number
    spawnPercentPerDrop?: number
    spawnCooldownMoves?: number
  }
  boss?: {
    spawnEveryMoves?: number
    baseRequiredHits?: number
    requiredHitsStepPerSpawn?: number
    destructionThreshold?: number
    moveThreshold?: number
    phaseDuration?: number
  }
  damage?: {
    bossHitByRarity?: Partial<Record<ModuleRarity, number>>
  }
}

function clampInt(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  const asInt = Math.floor(parsed)
  return Math.max(min, Math.min(max, asInt))
}

function copyTuning(): BemergedParityTuning {
  return {
    shardsPerClear: bemergedParityTuning.shardsPerClear,
    dropRates: {
      ...bemergedParityTuning.dropRates,
    },
    mine: {
      ...bemergedParityTuning.mine,
    },
    boss: {
      ...bemergedParityTuning.boss,
    },
    damage: {
      bossHitByRarity: {
        ...bemergedParityTuning.damage.bossHitByRarity,
      },
    },
  }
}

export function getBemergedParityTuningSnapshot(): BemergedParityTuning {
  return copyTuning()
}

export function applyBemergedParityTuningPatch(patch: BemergedParityTuningPatch): BemergedParityTuning {
  const nextShardsPerClear = clampInt(patch.shardsPerClear, 1, 200)
  if (nextShardsPerClear != null) {
    bemergedParityTuning.shardsPerClear = nextShardsPerClear
  }

  if (patch.dropRates) {
    const nextCommon = Number(patch.dropRates.Common)
    const nextRare = Number(patch.dropRates.Rare)
    const nextEpic = Number(patch.dropRates.Epic)

    if (Number.isFinite(nextCommon) && nextCommon >= 0) {
      bemergedParityTuning.dropRates.Common = nextCommon
    }
    if (Number.isFinite(nextRare) && nextRare >= 0) {
      bemergedParityTuning.dropRates.Rare = nextRare
    }
    if (Number.isFinite(nextEpic) && nextEpic >= 0) {
      bemergedParityTuning.dropRates.Epic = nextEpic
    }
  }

  if (patch.mine) {
    const nextBaseMoves = clampInt(patch.mine.baseMoves, 1, 100)
    if (nextBaseMoves != null) {
      bemergedParityTuning.mine.baseMoves = nextBaseMoves
    }

    const nextBlastRadius = clampInt(patch.mine.blastRadius, 1, 4)
    if (nextBlastRadius != null) {
      bemergedParityTuning.mine.blastRadius = nextBlastRadius
    }

    const nextSpawnPercentPerDrop = clampInt(patch.mine.spawnPercentPerDrop, 0, 50)
    if (nextSpawnPercentPerDrop != null) {
      bemergedParityTuning.mine.spawnPercentPerDrop = nextSpawnPercentPerDrop
    }

    const nextSpawnCooldownMoves = clampInt(patch.mine.spawnCooldownMoves, 0, 500)
    if (nextSpawnCooldownMoves != null) {
      bemergedParityTuning.mine.spawnCooldownMoves = nextSpawnCooldownMoves
    }
  }

  if (patch.boss) {
    const nextSpawnEveryMoves = clampInt(patch.boss.spawnEveryMoves, 1, 1000)
    if (nextSpawnEveryMoves != null) {
      bemergedParityTuning.boss.spawnEveryMoves = nextSpawnEveryMoves
    }

    const nextBaseRequiredHits = clampInt(patch.boss.baseRequiredHits, 1, 5000)
    if (nextBaseRequiredHits != null) {
      bemergedParityTuning.boss.baseRequiredHits = nextBaseRequiredHits
    }

    const nextRequiredHitsStep = clampInt(patch.boss.requiredHitsStepPerSpawn, 0, 500)
    if (nextRequiredHitsStep != null) {
      bemergedParityTuning.boss.requiredHitsStepPerSpawn = nextRequiredHitsStep
    }

    const nextDestructionThreshold = clampInt(patch.boss.destructionThreshold, 0, 1000)
    if (nextDestructionThreshold != null) {
      bemergedParityTuning.boss.destructionThreshold = nextDestructionThreshold
    }

    const nextMoveThreshold = clampInt(patch.boss.moveThreshold, 1, 100)
    if (nextMoveThreshold != null) {
      bemergedParityTuning.boss.moveThreshold = nextMoveThreshold
    }

    const nextPhaseDuration = clampInt(patch.boss.phaseDuration, 1, 200)
    if (nextPhaseDuration != null) {
      bemergedParityTuning.boss.phaseDuration = nextPhaseDuration
    }
  }

  if (patch.damage?.bossHitByRarity) {
    for (const rarity of ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancestral'] as const) {
      const nextDamage = clampInt(patch.damage.bossHitByRarity[rarity], 0, 500)
      if (nextDamage != null) {
        bemergedParityTuning.damage.bossHitByRarity[rarity] = nextDamage
      }
    }
  }

  return copyTuning()
}
