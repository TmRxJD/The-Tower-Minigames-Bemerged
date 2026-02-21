import type { AutoplayGoal } from './types'

export type BemergedAiBridgeCommand = 'start' | 'stop' | 'status' | 'snapshot' | 'step'
export type BemergedAiBridgeMode = 'normal' | 'dev'

export type BemergedAiBridgeErrorCode =
  | 'unknown-command'
  | 'unsupported-goal'
  | 'guardrail-testing-mode-blocked'
  | 'dev-mode-required'
  | 'invalid-request'

const COMMANDS: ReadonlyArray<BemergedAiBridgeCommand> = ['start', 'stop', 'status', 'snapshot', 'step']

const GOALS: ReadonlyArray<AutoplayGoal> = [
  'balanced',
  'objective-progress',
  'max-shards',
  'max-merges',
  'farm-cannon',
  'farm-armor',
  'farm-generator',
  'farm-core',
  'boss-damage',
]

export const BEMERGED_AI_BRIDGE_SCHEMA_VERSION = 'bemerged-ai-bridge-v1'

export type BemergedAiBridgePayload = {
  command?: unknown
  delayMs?: unknown
  testingMode?: unknown
  goal?: unknown
  mode?: unknown
}

export type BemergedAiBridgeValidation =
  | {
    ok: true
    command: BemergedAiBridgeCommand
    goal: AutoplayGoal
    delayMs: number | undefined
    testingMode: boolean
    mode: BemergedAiBridgeMode
  }
  | {
    ok: false
    code: BemergedAiBridgeErrorCode
    message: string
  }

function isCommand(value: string): value is BemergedAiBridgeCommand {
  return COMMANDS.includes(value as BemergedAiBridgeCommand)
}

function isGoal(value: string): value is AutoplayGoal {
  return GOALS.includes(value as AutoplayGoal)
}

function parseMode(value: unknown): BemergedAiBridgeMode {
  const mode = String(value ?? 'normal').trim().toLowerCase()
  return mode === 'dev' ? 'dev' : 'normal'
}

export function getBemergedAiBridgeGoals(): ReadonlyArray<AutoplayGoal> {
  return GOALS
}

export function getBemergedAiBridgeCommands(): ReadonlyArray<BemergedAiBridgeCommand> {
  return COMMANDS
}

export function validateBemergedAiBridgePayload(payload: BemergedAiBridgePayload | null | undefined): BemergedAiBridgeValidation {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: true,
      command: 'status',
      goal: 'objective-progress',
      delayMs: undefined,
      testingMode: false,
      mode: 'normal',
    }
  }

  const mode = parseMode(payload.mode)
  const requestedTestingMode = payload.testingMode === true

  if (requestedTestingMode && mode !== 'dev') {
    return {
      ok: false,
      code: 'guardrail-testing-mode-blocked',
      message: 'Guardrail violation: testing mode is only available in dev mode.',
    }
  }

  const rawCommand = String(payload.command ?? 'status').trim().toLowerCase()
  if (!isCommand(rawCommand)) {
    return {
      ok: false,
      code: 'unknown-command',
      message: `Unknown BeMerged AI command: ${rawCommand}`,
    }
  }

  const hasGoal = payload.goal !== undefined && payload.goal !== null && String(payload.goal).trim().length > 0
  const rawGoal = hasGoal ? String(payload.goal).trim().toLowerCase() : 'objective-progress'
  if (!isGoal(rawGoal)) {
    return {
      ok: false,
      code: 'unsupported-goal',
      message: `Unsupported BeMerged AI goal: ${rawGoal}`,
    }
  }

  const parsedDelay = Number(payload.delayMs)
  const delayMs = Number.isFinite(parsedDelay)
    ? Math.max(50, Math.min(3000, Math.floor(parsedDelay)))
    : undefined

  return {
    ok: true,
    command: rawCommand,
    goal: rawGoal,
    delayMs,
    testingMode: requestedTestingMode,
    mode,
  }
}
