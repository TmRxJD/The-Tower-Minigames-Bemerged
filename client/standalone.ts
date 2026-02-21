import Phaser from 'phaser'
import './style.css'
import { applyBackground } from './assets/backgrounds'
import { type BemergedRuntimeState, Match3Scene } from './engine/Match3Scene'
import { loadBemergedLearningProfile, recordBemergedAttempt } from './engine/autoplayLearningStore'
import { loadBemergedRuntimeState, saveBemergedRuntimeState } from './engine/runtimeStateStore'
import {
  BEMERGED_AI_BRIDGE_SCHEMA_VERSION,
  type BemergedAiBridgeMode,
  getBemergedAiBridgeCommands,
  getBemergedAiBridgeGoals,
  validateBemergedAiBridgePayload,
} from './engine/aiBridgeContract'
import {
  applyBemergedParityTuningPatch,
  getBemergedParityTuningSnapshot,
} from './engine/parityTuning'
import { BASE_RATES } from './engine/moduleData'
import type { AutoplayGoal, AutoplayStatus, GameStats } from './engine/types'
import { BOARD_COLS, BOARD_ROWS, TILE_SIZE } from './engine/types'
import { BemergedHudController } from './ui/hudController'

const PREVIEW_BAR_HEIGHT = 72
function createAiGuardrails(mode: BemergedAiBridgeMode) {
  const isDev = mode === 'dev'
  return {
    mode,
    allowTestingMode: isDev,
    allowDevTools: isDev,
    allowParityPatches: isDev,
    allowForcedCheats: isDev,
  } as const
}

try {
  applyBackground('Golden')
} catch {
  void 0
}

type BemergedAiCommandMessage = {
  type: 'bemerged:ai:command'
  requestId: string
  payload?: {
    command?: 'start' | 'stop' | 'status' | 'snapshot' | 'step'
    delayMs?: number
    testingMode?: boolean
    goal?: AutoplayGoal | string
    mode?: BemergedAiBridgeMode | string
  }
}

type BemergedAiCommandResultMessage = {
  type: 'bemerged:ai:command-result'
  requestId: string
  ok: boolean
  payload?: Record<string, unknown>
  error?: string
  errorCode?: string
}

function reportContentHeightToParent(): void {
  if (typeof window === 'undefined' || !window.parent || window.parent === window) return

  const appRoot = document.getElementById('app')
  const shellRoot = document.getElementById('bemerged-shell')
  const appHeight = Number(appRoot?.scrollHeight || appRoot?.getBoundingClientRect().height || 0)
  const shellHeight = Number(shellRoot?.scrollHeight || shellRoot?.getBoundingClientRect().height || 0)
  const rootHeight = Math.max(appHeight, shellHeight)
  const bodyHeight = Number(document.body?.scrollHeight || 0)
  const height = Math.ceil(Math.max(rootHeight > 0 ? rootHeight : bodyHeight, 1))

  window.parent.postMessage({
    type: 'bemerged:content-height',
    payload: {
      height,
      updatedAt: Date.now(),
    },
  }, window.location.origin)
}

const hud = new BemergedHudController()
hud.setParitySettings(getBemergedParityTuningSnapshot())

const scene = new Match3Scene()
const persistedRuntimeState = await loadBemergedRuntimeState()
if (persistedRuntimeState) {
  scene.setInitialRuntimeState(persistedRuntimeState)
}
scene.setUiSettings(hud.getUiSettings())
let latestStats: GameStats = {
  score: 0,
  moves: 0,
  merges: 0,
  shatters: 0,
  elapsedSeconds: 0,
  shardsPerHour: 0,
  shardsByType: {
    Cannon: 0,
    Armor: 0,
    Generator: 0,
    Core: 0,
  },
}
let latestAutoplay: AutoplayStatus = {
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
let latestAiMode: BemergedAiBridgeMode = 'normal'
let latestRuntimeState: BemergedRuntimeState | null = persistedRuntimeState
let runtimeSaveTimer: number | null = null

function scheduleRuntimeSave(state: BemergedRuntimeState): void {
  latestRuntimeState = state
  if (runtimeSaveTimer !== null) {
    window.clearTimeout(runtimeSaveTimer)
  }
  runtimeSaveTimer = window.setTimeout(() => {
    runtimeSaveTimer = null
    if (!latestRuntimeState) return
    void saveBemergedRuntimeState(latestRuntimeState)
  }, 220)
}

function createBridgePayload() {
  const objective = scene.getObjectiveProgress()
  return {
    autoplay: latestAutoplay,
    stats: latestStats,
    objective,
    aiContract: {
      schemaVersion: BEMERGED_AI_BRIDGE_SCHEMA_VERSION,
      mode: latestAiMode,
      strictGuardrails: createAiGuardrails(latestAiMode),
      goals: getBemergedAiBridgeGoals(),
      commands: getBemergedAiBridgeCommands(),
      commandSchema: {
        type: 'bemerged:ai:command',
        payload: {
          command: 'start|stop|status|snapshot|step',
          delayMs: 'number(50..3000) optional',
          goal: getBemergedAiBridgeGoals(),
          mode: ['normal', 'dev'],
          testingMode: 'boolean; true only when mode=dev',
        },
      },
      primaryObjective: {
        description: 'Secure at least one Ancestral module per type (Cannon/Armor/Generator/Core), then push toward 5-star Ancestral coverage.',
        bonusScoring: ['higher-shards', 'lower-time-seconds'],
      },
      mergeRules: {
        summary: 'Merges require a base module plus valid fodder based on rarity/plus tier.',
        acceptableFodder: [
          'Rare and Rare+: need 2 matching-type fodders (3 total including base)',
          'Epic+: need 2 matching-type fodders (3 total including base)',
          'Epic/Legendary/Legendary+/Mythic/Mythic+/Ancestral: need 1 matching-type fodder (2 total including base)',
          'Common cannot be direct merge bases in module merge mode',
        ],
      },
      inventoryRules: {
        summary: 'Inventory stores unique modules by slot type and can swap to protect high-value modules.',
        strategy: [
          'Use inventory to protect valuable unique modules when mines/boss are threatening nearby tiles',
          'Prefer keeping stronger unique modules in slots; avoid downgrading slot quality unless survival pressure is high',
        ],
      },
      survivalRules: {
        summary: 'Avoid losing high-value modules to mine adjacency and boss destructive phases.',
        avoid: [
          'Tiles adjacent to mines',
          'Tiles adjacent to active destructive boss phases',
        ],
      },
      progression: {
        completionPercent: objective.completionPercent,
        completedTypeCount: objective.completedTypeCount,
        targetStars: objective.targetStars,
        highestStarsByType: objective.highestStarsByType,
      },
      learning: scene.getAutoplayLearningProfile(),
    },
    engine: scene.getEngineSnapshot(),
  }
}

async function hydrateAutoplayLearning(): Promise<void> {
  const profile = await loadBemergedLearningProfile()
  scene.setAutoplayLearningProfile(profile)
}

async function recordAutoplayAttempt(reason: string): Promise<void> {
  const movesExecuted = Number(latestAutoplay.movesExecuted || 0)
  if (movesExecuted <= 0) return

  const profile = await recordBemergedAttempt({
    goal: latestAutoplay.goal,
    elapsedSeconds: latestStats.elapsedSeconds,
    totalShards: latestStats.score,
    objective: scene.getObjectiveProgress(),
  })
  scene.setAutoplayLearningProfile(profile)
  hud.setStatus(`AI attempt saved (${reason}); learning updated.`)
}

scene.setCallbacks({
  onStats: stats => {
    latestStats = stats
    hud.setStats(stats)
    postStateToParent(stats)
    reportContentHeightToParent()
  },
  onStatus: status => {
    hud.setStatus(status)
  },
  onAutoplay: status => {
    latestAutoplay = status
    hud.setAutoplay(status)
  },
  onInventory: inventory => {
    hud.setInventory(inventory)
  },
  onSpecials: state => {
    hud.setSpecials(state)
    reportContentHeightToParent()
  },
  onRuntimeStateChanged: runtimeState => {
    scheduleRuntimeSave(runtimeState)
  },
})

const game = new Phaser.Game({
  type: Phaser.AUTO,
  transparent: true,
  scale: {
    parent: 'bemerged-game-host',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BOARD_COLS * TILE_SIZE,
    height: (BOARD_ROWS * TILE_SIZE) + PREVIEW_BAR_HEIGHT,
  },
  scene,
})

function postStateToParent(stats: GameStats): void {
  if (typeof window === 'undefined' || !window.parent || window.parent === window) return

  window.parent.postMessage({
    type: 'bemerged:state',
    payload: {
      totalShards: stats.score,
      moveCount: stats.moves,
      totalMerges: stats.merges,
      totalShatters: stats.shatters,
      elapsedSeconds: stats.elapsedSeconds,
      shardsPerHour: stats.shardsPerHour,
      mergesPerHour: stats.elapsedSeconds > 0 ? Math.round((stats.merges * 3600) / stats.elapsedSeconds) : 0,
      shattersPerHour: stats.elapsedSeconds > 0 ? Math.round((stats.shatters * 3600) / stats.elapsedSeconds) : 0,
      updatedAt: Date.now(),
    },
  }, window.location.origin)
}

hud.bindActions({
  onAiStart: delayMs => {
    latestAutoplay = scene.startAutoplay({ delayMs, testingMode: false })
  },
  onAiStop: () => {
    latestAutoplay = scene.stopAutoplay('AI stopped')
  },
  onRestart: () => {
    scene.restartBoard()
    latestAutoplay = scene.getAutoplayStatus()
  },
  onShuffle: () => {
    scene.shuffleBoard()
  },
  onHint: () => {
    scene.showHint()
  },
  onInventorySlotClick: type => {
    scene.onInventorySlotClick(type)
  },
  onShardTypeClick: type => {
    scene.onShardTypeClick(type)
  },
  onRules: () => {
    hud.setStatus('Rules: swap adjacent modules to create lines of 3+ matching modules.')
  },
  onSettingsToggle: () => {
    const visible = hud.toggleSettingsPanel()
    hud.setStatus(visible ? 'Settings opened' : 'Settings closed')
    reportContentHeightToParent()
  },
  onSettingsApply: patch => {
    const next = applyBemergedParityTuningPatch(patch.parityPatch)
    BASE_RATES.Common = next.dropRates.Common
    BASE_RATES.Rare = next.dropRates.Rare
    BASE_RATES.Epic = next.dropRates.Epic
    hud.setParitySettings(next)
    scene.setUiSettings(patch.uiSettings)
    hud.setUiSettings(patch.uiSettings)
    hud.setStatus('Settings applied')
    reportContentHeightToParent()
  },
})

const rootObserver = new ResizeObserver(() => {
  reportContentHeightToParent()
})

const appRoot = document.getElementById('app')
const shellRoot = document.getElementById('bemerged-shell')
if (appRoot) rootObserver.observe(appRoot)
if (shellRoot) rootObserver.observe(shellRoot)

window.addEventListener('resize', () => {
  reportContentHeightToParent()
})

reportContentHeightToParent()
void hydrateAutoplayLearning()

window.addEventListener('beforeunload', () => {
  if (!latestRuntimeState) return
  void saveBemergedRuntimeState(latestRuntimeState)
})

window.addEventListener('message', async event => {
  if (event.origin !== window.location.origin) return

  const data = event.data as BemergedAiCommandMessage | null
  if (!data || data.type !== 'bemerged:ai:command') return

  const respond = (result: BemergedAiCommandResultMessage) => {
    if (!event.source || !('postMessage' in event.source)) return
    ;(event.source as Window).postMessage(result, window.location.origin)
  }

  try {
    const parsed = validateBemergedAiBridgePayload(data.payload)
    if (parsed.ok === false) {
      respond({
        type: 'bemerged:ai:command-result',
        requestId: data.requestId,
        ok: false,
        errorCode: parsed.code,
        error: parsed.message,
      })
      return
    }

    if (parsed.command === 'start') {
      latestAiMode = parsed.mode
      latestAutoplay = scene.startAutoplay({
        delayMs: parsed.delayMs,
        testingMode: parsed.testingMode,
        goal: parsed.goal,
      })
    } else if (parsed.command === 'stop') {
      latestAiMode = parsed.mode
      await recordAutoplayAttempt('manual-stop')
      latestAutoplay = scene.stopAutoplay('AI stopped')
    } else if (parsed.command === 'step') {
      latestAiMode = parsed.mode
      await scene.runAutoplayStep({ goal: parsed.goal })
      latestAutoplay = scene.getAutoplayStatus()
    } else if (parsed.command === 'snapshot') {
      latestAiMode = parsed.mode
      latestAutoplay = scene.getAutoplayStatus()
    } else {
      latestAiMode = parsed.mode
      latestAutoplay = scene.getAutoplayStatus()
    }

    respond({
      type: 'bemerged:ai:command-result',
      requestId: data.requestId,
      ok: true,
      payload: createBridgePayload(),
    })
  } catch (error) {
    respond({
      type: 'bemerged:ai:command-result',
      requestId: data.requestId,
      ok: false,
      errorCode: 'invalid-request',
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

window.addEventListener('beforeunload', () => {
  rootObserver.disconnect()
  game.destroy(true)
})
