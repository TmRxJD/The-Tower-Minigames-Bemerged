import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createProxyMiddleware } from 'http-proxy-middleware'
import crypto from 'node:crypto'
import {
  type RuntimeAction as BemergedHeadlessAction,
  type RuntimeStepResult as BemergedHeadlessStepResult,
  BemergedRuntimeEnv,
} from './envRuntime'

const app = express()
const port = process.env.PORT || 3002

const MAX_ACTIVE_ENV_SESSIONS = 64
const DEFAULT_SCENARIO_ID = 'objective-default'
const ALLOWED_GOALS = new Set(['objective-progress'])

type SessionRecord = {
  id: string
  env: BemergedRuntimeEnv
  scenarioId: string
  seed: number
  goal: 'objective-progress'
  mode: 'normal' | 'dev'
  testingMode: boolean
  createdAtMs: number
  lastSeenAtMs: number
}

type ResetPayload = {
  scenarioId?: unknown
  seed?: unknown
  goal?: unknown
  maxTurns?: unknown
  stagnationTurnLimit?: unknown
  mode?: unknown
  testingMode?: unknown
}

type StepPayload = {
  sessionId?: unknown
  actionId?: unknown
}

const envSessions = new Map<string, SessionRecord>()
let defaultSessionId: string | null = null

app.use(express.json({ limit: '1mb' }))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, '..', 'client', 'dist')
const useDevProxy = process.env.BEMERGED_DEV_PROXY === '1'
const clientDevUrl = process.env.CLIENT_DEV_URL || 'http://localhost:5173'

function parseBoundedInteger(input: unknown, fallback: number, min: number, max: number): number {
  const value = Number(input)
  if (!Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Math.floor(value)))
}

function parseScenarioId(input: unknown): string {
  const scenarioId = String(input || '').trim().toLowerCase()
  return scenarioId || DEFAULT_SCENARIO_ID
}

function parseGoal(input: unknown): 'objective-progress' {
  const goal = String(input || '').trim().toLowerCase()
  if (goal && !ALLOWED_GOALS.has(goal)) {
    return 'objective-progress'
  }
  return 'objective-progress'
}

function parseMode(input: unknown): 'normal' | 'dev' {
  const mode = String(input || '').trim().toLowerCase()
  return mode === 'dev' ? 'dev' : 'normal'
}

function buildCapabilities(mode: 'normal' | 'dev') {
  const isDev = mode === 'dev'
  return {
    contractVersion: 'bemerged-headless-env-v1',
    manifestVersion: 'bemerged-capability-manifest-v1',
    mode,
    guardrails: {
      noDevTools: !isDev,
      testingModeLocked: !isDev,
      allowedGoals: ['objective-progress'],
      deniedGoals: ['max-score', 'boss-damage', 'max-shards'],
    },
    commandSchema: {
      reset: {
        required: [],
        optional: ['scenarioId', 'seed', 'goal', 'maxTurns', 'stagnationTurnLimit', 'mode', 'testingMode'],
      },
      step: {
        required: ['sessionId', 'actionId'],
        optional: [],
      },
      validActions: {
        required: ['sessionId'],
        optional: [],
      },
    },
    stateSchema: {
      board: ['rows', 'cols', 'modules[]'],
      boss: ['hp', 'maxHp', 'phase', 'timers'],
      player: ['movesLeft', 'score', 'shards', 'combo'],
      objective: ['completionPercent', 'completedTypeCount', 'highestStarsByType'],
      meta: ['seed', 'turn', 'scenarioId', 'doneReason'],
    },
    objective: {
      primary: 'Reach at least one 5★ copy for each module type (Cannon, Armor, Generator, Core).',
      bonus: ['Maximize shard quantity', 'Minimize elapsed turns'],
    },
    actions: {
      type: 'swap',
      source: 'get_valid_actions',
      legalActionPolicy: 'Engine authority only; agent must choose from get_valid_actions output.',
    },
    rewardModel: {
      components: ['objective', 'shards', 'time', 'risk'],
      antiLoopSignals: ['stagnationTurnLimit', 'no-progress penalties'],
      optimizationTarget: 'Maximize objective completion first, then shard gain and speed.',
    },
    learning: {
      source: 'attempt/replay history',
      profileSignals: ['type-bias', 'best objective completion', 'best shard gain', 'best turn efficiency'],
      deterministicReplay: true,
    },
    rulesManifest: {
      progression: 'Only legal moves from engine-generated valid action set are allowed.',
      guardrailPolicy: isDev
        ? 'Dev mode permits testing controls for scenario QA only.'
        : 'Normal mode blocks all dev/testing controls.',
      completionRule: 'Success objective is at least one 5★ copy for each module type.',
    },
  }
}

function toSessionPayload(session: SessionRecord, validActions: BemergedHeadlessAction[]) {
  return {
    sessionId: session.id,
    scenarioId: session.scenarioId,
    seed: session.seed,
    goal: session.goal,
    mode: session.mode,
    testingMode: session.testingMode,
    validActions,
    capabilities: buildCapabilities(session.mode),
  }
}

function touchSession(session: SessionRecord): void {
  session.lastSeenAtMs = Date.now()
}

function disposeSession(sessionId: string): void {
  const session = envSessions.get(sessionId)
  if (!session) return
  session.env.dispose()
  envSessions.delete(sessionId)
  if (defaultSessionId === sessionId) {
    defaultSessionId = envSessions.keys().next().value || null
  }
}

function enforceSessionLimit(): void {
  if (envSessions.size <= MAX_ACTIVE_ENV_SESSIONS) return

  const oldest = Array.from(envSessions.values())
    .sort((a, b) => a.lastSeenAtMs - b.lastSeenAtMs)[0]

  if (oldest) {
    disposeSession(oldest.id)
  }
}

function resolveSession(sessionIdInput: unknown): SessionRecord | null {
  const requested = String(sessionIdInput || '').trim()
  if (requested) {
    return envSessions.get(requested) || null
  }

  if (defaultSessionId) {
    return envSessions.get(defaultSessionId) || null
  }

  return null
}

app.get('/api/bemerged/env/capabilities', (_req, res) => {
  const mode = parseMode(_req.query.mode)
  res.status(200).json({
    ok: true,
    ...buildCapabilities(mode),
  })
})

app.post('/api/bemerged/env/reset', async (req, res) => {
  const payload = (req.body || {}) as ResetPayload
  const scenarioId = parseScenarioId(payload.scenarioId)

  const goal = parseGoal(payload.goal)
  const mode = parseMode(payload.mode)
  const requestedTestingMode = payload.testingMode === true
  const testingMode = mode === 'dev' && requestedTestingMode

  if (requestedTestingMode && !testingMode) {
    res.status(400).json({
      ok: false,
      error: 'guardrail-testing-mode-blocked',
      message: 'Testing mode is only available when mode=dev.',
    })
    return
  }

  const seed = parseBoundedInteger(payload.seed, 1337, 1, 2_147_483_647)
  const maxTurns = parseBoundedInteger(payload.maxTurns, 800, 50, 5000)
  const stagnationTurnLimit = parseBoundedInteger(payload.stagnationTurnLimit, 25, 5, 200)

  const env = new BemergedRuntimeEnv({
    seed,
    maxTurns,
    stagnationTurnLimit,
  })

  const reset = env.reset(seed)
  const sessionId = `bemerged-${crypto.randomUUID()}`
  const session: SessionRecord = {
    id: sessionId,
    env,
    scenarioId,
    seed,
    goal,
    mode,
    testingMode,
    createdAtMs: Date.now(),
    lastSeenAtMs: Date.now(),
  }

  envSessions.set(sessionId, session)
  defaultSessionId = sessionId
  enforceSessionLimit()

  res.status(200).json({
    ok: true,
    state: reset.state,
    info: {
      turn: reset.state.meta.turn,
      objective: reset.state.meta.objective,
    },
    ...toSessionPayload(session, reset.validActions),
  })
})

app.get('/api/bemerged/env/valid-actions', (req, res) => {
  const session = resolveSession(req.query.sessionId)
  if (!session) {
    res.status(404).json({ ok: false, error: 'session-not-found' })
    return
  }

  touchSession(session)
  const validActions = session.env.get_valid_actions()
  res.status(200).json({
    ok: true,
    ...toSessionPayload(session, validActions),
  })
})

app.post('/api/bemerged/env/step', (req, res) => {
  const payload = (req.body || {}) as StepPayload
  const session = resolveSession(payload.sessionId)
  if (!session) {
    res.status(404).json({ ok: false, error: 'session-not-found' })
    return
  }

  const actionId = Number(payload.actionId)
  if (!Number.isInteger(actionId)) {
    res.status(400).json({ ok: false, error: 'invalid-action-id' })
    return
  }

  touchSession(session)
  const step: BemergedHeadlessStepResult = session.env.step(actionId)
  const validActions = session.env.get_valid_actions()

  res.status(200).json({
    ok: true,
    nextState: step.nextState,
    reward: step.reward,
    rewardBreakdown: step.rewardBreakdown,
    done: step.done,
    info: step.info,
    ...toSessionPayload(session, validActions),
  })
})

app.post('/api/bemerged/env/dispose', (req, res) => {
  const payload = (req.body || {}) as { sessionId?: unknown }
  const sessionId = String(payload.sessionId || '').trim()
  if (!sessionId || !envSessions.has(sessionId)) {
    res.status(404).json({ ok: false, error: 'session-not-found' })
    return
  }

  disposeSession(sessionId)
  res.status(200).json({ ok: true })
})

if (useDevProxy) {
  app.use(
    '/',
    createProxyMiddleware({
      target: clientDevUrl,
      changeOrigin: true,
      ws: true,
    }),
  )
} else {
  app.use(express.static(distDir))

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(port, () => {
  if (useDevProxy) {
    console.log(`BeMerged dev proxy listening at http://localhost:${port} -> ${clientDevUrl}`)
  } else {
    console.log(`BeMerged server listening at http://localhost:${port}`)
  }
})
