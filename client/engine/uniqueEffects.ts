import type { ModuleRarity, ModuleToken } from './types'

export type UniqueEffectId =
  | 'AD'
  | 'DP'
  | 'BA'
  | 'HB'
  | 'SR_CANNON'
  | 'AS'
  | 'ACP'
  | 'SD'
  | 'NMP'
  | 'WR'
  | 'SF'
  | 'OA'
  | 'BHD'
  | 'SH'
  | 'PH'
  | 'GC'
  | 'PF'
  | 'RB_GENERATOR'
  | 'OC'
  | 'DC'
  | 'HC'
  | 'MVN'
  | 'MH'
  | 'PC_CORE'

export type RarityScale = {
  Epic: number
  Legendary: number
  Mythic: number
  Ancestral: number
}

const EFFECT_BY_KEY: Readonly<Record<string, UniqueEffectId>> = {
  'Cannon:AD': 'AD',
  'Cannon:DP': 'DP',
  'Cannon:BA': 'BA',
  'Cannon:HB': 'HB',
  'Cannon:SR': 'SR_CANNON',
  'Cannon:AS': 'AS',
  'Armor:ACP': 'ACP',
  'Armor:SD': 'SD',
  'Armor:NMP': 'NMP',
  'Armor:WR': 'WR',
  'Armor:SF': 'SF',
  'Armor:OA': 'OA',
  'Generator:BHD': 'BHD',
  'Generator:SH': 'SH',
  'Generator:PH': 'PH',
  'Generator:GC': 'GC',
  'Generator:PF': 'PF',
  'Generator:RB': 'RB_GENERATOR',
  'Core:OC': 'OC',
  'Core:DC': 'DC',
  'Core:HC': 'HC',
  'Core:MVN': 'MVN',
  'Core:MH': 'MH',
  'Core:PC': 'PC_CORE',
}

const RARITY_ORDER: ModuleRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancestral']

export const bemergedUniqueEffectTuning = {
  boss: {
    pursueEveryMoves: 2,
    minValuableRarity: 'Epic' as ModuleRarity,
  },
  effects: {
    AD: { Epic: 1, Legendary: 2, Mythic: 3, Ancestral: 4 } as RarityScale,
    DP: { Epic: 1, Legendary: 2.5, Mythic: 5, Ancestral: 7.5 } as RarityScale,
    BA: { Epic: 5, Legendary: 10, Mythic: 15, Ancestral: 20 } as RarityScale,
    HB: { Epic: 1, Legendary: 2, Mythic: 3, Ancestral: 4 } as RarityScale,
    SR_CANNON: { Epic: 2.5, Legendary: 5, Mythic: 7.5, Ancestral: 10 } as RarityScale,
    AS: { Epic: 10, Legendary: 20, Mythic: 30, Ancestral: 40 } as RarityScale,
    ACP: { Epic: 1, Legendary: 1, Mythic: 1, Ancestral: 1 } as RarityScale,
    SD: { Epic: 5, Legendary: 10, Mythic: 15, Ancestral: 20 } as RarityScale,
    NMP: { Epic: 3, Legendary: 5, Mythic: 7, Ancestral: 9 } as RarityScale,
    WR: { Epic: 1, Legendary: 2, Mythic: 3, Ancestral: 4 } as RarityScale,
    SF: { Epic: 1, Legendary: 2, Mythic: 3, Ancestral: 4 } as RarityScale,
    OA: { Epic: 2, Legendary: 4, Mythic: 6, Ancestral: 8 } as RarityScale,
    BHD: { Epic: 2, Legendary: 4, Mythic: 6, Ancestral: 8 } as RarityScale,
    SH: { Epic: 2, Legendary: 4, Mythic: 6, Ancestral: 8 } as RarityScale,
    PH: { Epic: 1, Legendary: 1.5, Mythic: 2, Ancestral: 2.5 } as RarityScale,
    GC: { Epic: 3, Legendary: 5, Mythic: 7, Ancestral: 9 } as RarityScale,
    PF: { Epic: 1, Legendary: 2, Mythic: 3, Ancestral: 4 } as RarityScale,
    RB_GENERATOR: { Epic: 2, Legendary: 4, Mythic: 6, Ancestral: 8 } as RarityScale,
    OC: { Epic: 2, Legendary: 3, Mythic: 4, Ancestral: 5 } as RarityScale,
    DC: { Epic: 1, Legendary: 2, Mythic: 3, Ancestral: 4 } as RarityScale,
    HC: { Epic: 5, Legendary: 10, Mythic: 15, Ancestral: 20 } as RarityScale,
    MVN: { Epic: 25, Legendary: 20, Mythic: 15, Ancestral: 10 } as RarityScale,
    MH: { Epic: 4, Legendary: 3, Mythic: 2, Ancestral: 1 } as RarityScale,
    PC_CORE: { Epic: 2, Legendary: 3, Mythic: 4, Ancestral: 5 } as RarityScale,
  },
} as const

export function getUniqueEffectId(token: ModuleToken | null): UniqueEffectId | null {
  if (!token) return null
  const key = `${token.type}:${token.templateId}`
  return EFFECT_BY_KEY[key] || null
}

export function rarityAtLeast(rarity: ModuleRarity, floor: ModuleRarity): boolean {
  return RARITY_ORDER.indexOf(rarity) >= RARITY_ORDER.indexOf(floor)
}

export function getScaleValueForToken(token: ModuleToken | null, scale: RarityScale): number {
  if (!token) return 0
  if (token.rarity === 'Epic') return scale.Epic
  if (token.rarity === 'Legendary') return scale.Legendary
  if (token.rarity === 'Mythic') return scale.Mythic
  if (token.rarity === 'Ancestral') return scale.Ancestral
  return 0
}
