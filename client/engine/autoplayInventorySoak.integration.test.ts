import { describe, expect, it } from 'vitest'
import { BemergedHeadlessEnv } from './headlessEnv'

describe('BeMerged autoplay inventory soak', () => {
  it('keeps inventory toggling below thrash thresholds over long episodes', () => {
    const episodeCount = 12
    const maxTurns = 220

    let totalTurns = 0
    let totalInventoryActions = 0
    let inventorySlotToggleEvents = 0
    let repeatedSameCellSlotEvents = 0
    let maxConsecutiveInventory = 0

    for (let episode = 0; episode < episodeCount; episode += 1) {
      const seed = 98000 + episode
      const env = new BemergedHeadlessEnv({
        scenarioId: 'objective-default',
        seed,
        maxTurns,
        goal: 'objective-progress',
      })

      env.reset(seed)

      let done = false
      let turn = 0
      let consecutiveInventory = 0
      let previousInventory: { slotType: string; row: number; col: number } | null = null

      while (!done && turn < maxTurns) {
        const validActions = env.get_valid_actions()
        if (validActions.length === 0) break

        const actionId = env.choose_autoplay_action('objective-progress')
        expect(actionId).not.toBeNull()

        const selected = validActions.find(action => action.actionId === actionId)
        expect(selected).toBeDefined()
        if (!selected) break

        totalTurns += 1

        if (selected.type === 'inventory') {
          totalInventoryActions += 1
          consecutiveInventory += 1
          maxConsecutiveInventory = Math.max(maxConsecutiveInventory, consecutiveInventory)

          if (previousInventory && previousInventory.slotType === selected.slotType) {
            inventorySlotToggleEvents += 1
            if (previousInventory.row === selected.cell.row && previousInventory.col === selected.cell.col) {
              repeatedSameCellSlotEvents += 1
            }
          }

          previousInventory = {
            slotType: selected.slotType,
            row: selected.cell.row,
            col: selected.cell.col,
          }
        } else {
          consecutiveInventory = 0
          previousInventory = null
        }

        const step = env.step(selected.actionId)
        expect(step.info.reason).not.toBe('invalid-action')
        done = step.done
        turn += 1
      }

      env.dispose()
    }

    const inventoryActionRatio = totalTurns > 0 ? (totalInventoryActions / totalTurns) : 0

    console.log('[bemerged-inventory-soak-report]', JSON.stringify({
      episodeCount,
      maxTurns,
      totalTurns,
      totalInventoryActions,
      inventoryActionRatio,
      inventorySlotToggleEvents,
      repeatedSameCellSlotEvents,
      maxConsecutiveInventory,
    }))

    expect(totalTurns).toBeGreaterThanOrEqual(episodeCount * 120)
    expect(inventoryActionRatio).toBeLessThanOrEqual(0.35)
    expect(inventorySlotToggleEvents).toBeLessThanOrEqual(Math.max(12, Math.floor(totalInventoryActions * 0.35)))
    expect(repeatedSameCellSlotEvents).toBeLessThanOrEqual(6)
    expect(maxConsecutiveInventory).toBeLessThanOrEqual(3)
  }, 120000)
})
