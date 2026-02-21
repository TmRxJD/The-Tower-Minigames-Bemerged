import { ASSETS } from '../assets'
import type { ModuleType } from './types'

type TemplateLike = {
  id: string
  type: ModuleType
}

export const COMMON_TEMPLATES: TemplateLike[] = [
  { id: 'EC_C', type: 'Cannon' },
  { id: 'MC_C', type: 'Cannon' },
  { id: 'EB', type: 'Armor' },
  { id: 'MB', type: 'Armor' },
  { id: 'MC_G', type: 'Generator' },
  { id: 'EC_G', type: 'Generator' },
  { id: 'EC_CO', type: 'Core' },
  { id: 'MC_CO', type: 'Core' },
]

export const RARE_TEMPLATES: TemplateLike[] = [
  { id: 'OB', type: 'Cannon' },
  { id: 'RB', type: 'Cannon' },
  { id: 'BB', type: 'Cannon' },
  { id: 'SB', type: 'Cannon' },
  { id: 'NI', type: 'Armor' },
  { id: 'PC', type: 'Armor' },
  { id: 'SR', type: 'Armor' },
  { id: 'DN', type: 'Armor' },
  { id: 'SL', type: 'Generator' },
  { id: 'OS', type: 'Generator' },
  { id: 'AR', type: 'Generator' },
  { id: 'SDS', type: 'Generator' },
  { id: 'GL', type: 'Core' },
  { id: 'MS', type: 'Core' },
  { id: 'EM', type: 'Core' },
  { id: 'CS', type: 'Core' },
]

export const EPIC_TEMPLATES: TemplateLike[] = [
  { id: 'AD', type: 'Cannon' },
  { id: 'AS', type: 'Cannon' },
  { id: 'BA', type: 'Cannon' },
  { id: 'DP', type: 'Cannon' },
  { id: 'HB', type: 'Cannon' },
  { id: 'SR', type: 'Cannon' },
  { id: 'ACP', type: 'Armor' },
  { id: 'NMP', type: 'Armor' },
  { id: 'OA', type: 'Armor' },
  { id: 'SD', type: 'Armor' },
  { id: 'SF', type: 'Armor' },
  { id: 'WR', type: 'Armor' },
  { id: 'BHD', type: 'Generator' },
  { id: 'GC', type: 'Generator' },
  { id: 'PF', type: 'Generator' },
  { id: 'PH', type: 'Generator' },
  { id: 'RB', type: 'Generator' },
  { id: 'SH', type: 'Generator' },
  { id: 'DC', type: 'Core' },
  { id: 'HC', type: 'Core' },
  { id: 'MH', type: 'Core' },
  { id: 'MVN', type: 'Core' },
  { id: 'OC', type: 'Core' },
  { id: 'PC', type: 'Core' },
]

export const BASE_RATES = {
  Common: 0.685,
  Rare: 0.29,
  Epic: 0.025,
}

function findAssetByKey(assetKey: string): string | null {
  for (const dir of Object.keys(ASSETS)) {
    const map = ASSETS[dir] || {}
    if (map[assetKey]) {
      return map[assetKey]
    }
  }
  return null
}

export function resolveAssetsForModule(moduleLike: Record<string, unknown>): void {
  const moduleType = String(moduleLike.type || 'Core').toLowerCase()
  const map = ASSETS[`modules_${moduleType}`] || {}

  const rarity = String(moduleLike.rarity || 'Common').toLowerCase()
  const plus = !!moduleLike.plus
  const templateId = String(moduleLike.templateId || '').trim().toLowerCase()
  const templateStem = templateId.includes('_') ? templateId.split('_')[0] : templateId

  let frameKey = `mf_${rarity}${plus ? '_plus' : ''}`
  if (!map[frameKey]) {
    frameKey = map.mf_common ? 'mf_common' : (map.mf_empty ? 'mf_empty' : '')
  }

  let assetKey = ''
  if (templateId) {
    const candidates = Array.from(new Set([templateId, templateStem].filter(Boolean)))
    for (const candidate of candidates) {
      const rarityTemplateKey = `${rarity}_${candidate}`
      if (map[rarityTemplateKey]) {
        assetKey = rarityTemplateKey
        break
      }
      if (map[`rare_${candidate}`]) {
        assetKey = `rare_${candidate}`
        break
      }
      if (map[`common_${candidate}`]) {
        assetKey = `common_${candidate}`
        break
      }
      const match = Object.keys(map).find(key => key.toLowerCase().endsWith(`_${candidate}`))
      if (match) {
        assetKey = match
        break
      }
    }
  }

  if (!assetKey && rarity === 'common') {
    const commonKey = Object.keys(map).find(key => key.startsWith('common_'))
    if (commonKey) {
      assetKey = commonKey
    }
  }

  if (!assetKey) {
    const anyCommon = findAssetByKey('common_mc') || findAssetByKey('common_ec')
    if (anyCommon) {
      moduleLike._assetSrc = anyCommon
      moduleLike._frameSrc = frameKey ? (map[frameKey] || findAssetByKey(frameKey) || '') : ''
      return
    }
  }

  const frameSrc = frameKey ? (map[frameKey] || findAssetByKey(frameKey) || '') : ''
  const assetSrc = assetKey ? (map[assetKey] || findAssetByKey(assetKey) || '') : ''

  moduleLike._frameSrc = frameSrc
  moduleLike._assetSrc = assetSrc

  if (!frameSrc || !assetSrc) {
    throw new Error(`Unable to resolve assets for ${String(moduleLike.templateId || 'unknown')} (${String(moduleLike.rarity || 'unknown')})`)
  }
}
