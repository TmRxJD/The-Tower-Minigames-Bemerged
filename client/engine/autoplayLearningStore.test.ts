import { describe, expect, it } from 'vitest'
import { buildLearningProfileFromAttempts } from './autoplayLearningStore'

describe('autoplayLearningStore learning profile', () => {
  it('increases type bias for module types that repeatedly miss 5-star objective', () => {
    const profile = buildLearningProfileFromAttempts([
      {
        elapsedSeconds: 120,
        totalShards: 500,
        objectiveCompletionPercent: 25,
        highestStarsByType: {
          Cannon: 5,
          Armor: 2,
          Generator: 1,
          Core: 0,
        },
      },
      {
        elapsedSeconds: 90,
        totalShards: 650,
        objectiveCompletionPercent: 38,
        highestStarsByType: {
          Cannon: 5,
          Armor: 3,
          Generator: 2,
          Core: 0,
        },
      },
      {
        elapsedSeconds: 80,
        totalShards: 700,
        objectiveCompletionPercent: 50,
        highestStarsByType: {
          Cannon: 5,
          Armor: 4,
          Generator: 3,
          Core: 0,
        },
      },
    ])

    expect(profile.attempts).toBe(3)
    expect(profile.bestShards).toBe(700)
    expect(profile.bestElapsedSeconds).toBe(80)
    expect(profile.typeBias.Core).toBeGreaterThan(profile.typeBias.Cannon)
  })
})
