import { importedMergeChart, TYPE_TOKENS } from '../assets'
import { applyBackground, BACKGROUNDS, formatBackgroundDisplay } from '../assets/backgrounds'
import type { BemergedParityTuning, BemergedParityTuningPatch } from '../engine/parityTuning'
import type { AutoplayStatus, GameStats, ModuleToken, ModuleType } from '../engine/types'

export type BemergedOrientation = 'landscape' | 'portrait'

export type BemergedUiSettings = {
  orientation: BemergedOrientation
  autoShatterRares: boolean
  disableHints: boolean
  background: string
  enableDevControls: boolean
}

export type BemergedSettingsApplyPayload = {
  parityPatch: BemergedParityTuningPatch
  dropRatesPatch?: {
    commonPercent?: number
    rarePercent?: number
    epicPercent?: number
  }
  uiSettings: BemergedUiSettings
}

type HudActions = {
  onAiStart: (delayMs: number) => void
  onAiStop: () => void
  onRestart: () => void
  onShuffle: () => void
  onHint: () => void
  onInventorySlotClick: (type: ModuleType) => void
  onShardTypeClick: (type: ModuleType) => void
  onRules: () => void
  onSettingsToggle: () => void
  onSettingsApply: (payload: BemergedSettingsApplyPayload) => void
}

const UI_SETTINGS_STORAGE_KEY = 'bemerged_ui_settings_v2'

const DEFAULT_UI_SETTINGS: BemergedUiSettings = {
  orientation: 'landscape',
  autoShatterRares: false,
  disableHints: false,
  background: 'Golden',
  enableDevControls: false,
}

const shardTypeOrder: ModuleType[] = ['Cannon', 'Generator', 'Armor', 'Core']

export class BemergedHudController {
  private readonly scoreEl = document.getElementById('hud-score')
  private readonly moveEl = document.getElementById('hud-moves')
  private readonly mergesEl = document.getElementById('hud-merges')
  private readonly shattersEl = document.getElementById('hud-shatters')
  private readonly timerEl = document.getElementById('hud-timer')
  private readonly minesEl = document.getElementById('hud-mines')
  private readonly bossHpEl = document.getElementById('hud-boss-hp')
  private readonly bossWaveEl = document.getElementById('hud-boss-wave')
  private readonly bossPhaseEl = document.getElementById('hud-boss-phase')
  private readonly statusEl = document.getElementById('hud-status')
  private readonly delayInput = document.getElementById('ai-delay') as HTMLInputElement | null
  private readonly aiStatusEl = document.getElementById('hud-ai-status')
  private readonly aiToggleBtn = document.getElementById('btn-ai-toggle') as HTMLButtonElement | null
  private readonly shardRow = document.getElementById('hud-shards-row')
  private readonly inventoryRoot = document.getElementById('inventory-grid')
  private readonly settingsPanelEl = document.getElementById('settings-panel')
  private readonly settingsButtonEl = document.getElementById('btn-settings')
  private readonly bestShardsEl = document.getElementById('hud-best-shards')
  private readonly chartSlotEl = document.getElementById('bemerged-chart-slot')
  private readonly chartToggleBtn = document.getElementById('btn-toggle-chart') as HTMLButtonElement | null
  private readonly shellEl = document.getElementById('bemerged-shell')
  private readonly orientationEl = document.getElementById('set-orientation') as HTMLSelectElement | null
  private readonly autoShatterRaresEl = document.getElementById('set-auto-shatter-rares') as HTMLInputElement | null
  private readonly disableHintsEl = document.getElementById('set-disable-hints') as HTMLInputElement | null
  private readonly backgroundEl = document.getElementById('set-background') as HTMLSelectElement | null
  private readonly enableDevControlsEl = document.getElementById('set-enable-dev-controls') as HTMLInputElement | null
  private readonly devControlsGroupEl = document.getElementById('dev-controls-group')
  private actions: HudActions | null = null
  private aiActive = false

  private bestShards = 0

  private readonly mineSpawnEl = document.getElementById('set-mine-spawn') as HTMLInputElement | null
  private readonly rateCommonEl = document.getElementById('set-rate-common') as HTMLInputElement | null
  private readonly rateRareEl = document.getElementById('set-rate-rare') as HTMLInputElement | null
  private readonly rateEpicEl = document.getElementById('set-rate-epic') as HTMLInputElement | null
  private readonly mineCooldownEl = document.getElementById('set-mine-cooldown') as HTMLInputElement | null
  private readonly mineMovesEl = document.getElementById('set-mine-moves') as HTMLInputElement | null
  private readonly mineRadiusEl = document.getElementById('set-mine-radius') as HTMLInputElement | null
  private readonly bossSpawnEl = document.getElementById('set-boss-spawn') as HTMLInputElement | null
  private readonly bossHpElInput = document.getElementById('set-boss-hp') as HTMLInputElement | null
  private readonly bossStepEl = document.getElementById('set-boss-step') as HTMLInputElement | null
  private readonly bossThresholdEl = document.getElementById('set-boss-threshold') as HTMLInputElement | null
  private readonly bossMoveThresholdEl = document.getElementById('set-boss-move-threshold') as HTMLInputElement | null
  private readonly bossPhaseDurationEl = document.getElementById('set-boss-phase-duration') as HTMLInputElement | null
  private readonly commonDmgEl = document.getElementById('set-common-dmg') as HTMLInputElement | null
  private readonly rareDmgEl = document.getElementById('set-rare-dmg') as HTMLInputElement | null
  private readonly epicDmgEl = document.getElementById('set-epic-dmg') as HTMLInputElement | null
  private readonly legendaryDmgEl = document.getElementById('set-legendary-dmg') as HTMLInputElement | null
  private readonly mythicDmgEl = document.getElementById('set-mythic-dmg') as HTMLInputElement | null
  private readonly ancestralDmgEl = document.getElementById('set-ancestral-dmg') as HTMLInputElement | null
  private readonly shardsPerClearEl = document.getElementById('set-shards-per-clear') as HTMLInputElement | null
  private uiSettings: BemergedUiSettings = { ...DEFAULT_UI_SETTINGS }

  constructor() {
    const chartImage = document.getElementById('merge-chart-image') as HTMLImageElement | null
    if (chartImage) {
      chartImage.src = String(importedMergeChart)
    }
    const savedBest = Number(window.localStorage.getItem('bemerged_best_shards_v1') || '0')
    if (Number.isFinite(savedBest) && savedBest > 0) {
      this.bestShards = Math.floor(savedBest)
    }
    if (this.bestShardsEl) {
      this.bestShardsEl.textContent = String(this.bestShards)
    }

    this.uiSettings = this.loadUiSettingsFromStorage()
    this.populateBackgroundOptions()
    this.applyUiSettingsToDom(this.uiSettings)
  }

  bindActions(actions: HudActions): void {
    this.actions = actions
    const applyUiSettingsImmediately = () => {
      actions.onSettingsApply({
        parityPatch: {},
        uiSettings: this.readUiSettingsFromInputs(),
      })
    }

    this.aiToggleBtn?.addEventListener('click', () => {
      if (this.aiActive) {
        actions.onAiStop()
      } else {
        actions.onAiStart(this.getDelayMs())
      }
    })
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      actions.onRestart()
    })
    document.getElementById('btn-shuffle')?.addEventListener('click', () => {
      actions.onShuffle()
    })
    document.getElementById('btn-hint')?.addEventListener('click', () => {
      actions.onHint()
    })
    document.getElementById('btn-rules')?.addEventListener('click', () => {
      actions.onRules()
    })
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      actions.onSettingsToggle()
    })
    document.addEventListener('pointerdown', event => {
      if (!this.settingsPanelEl || this.settingsPanelEl.classList.contains('hidden')) return

      const targetNode = event.target as Node | null
      if (!targetNode) return
      if (this.settingsPanelEl.contains(targetNode)) return
      if (this.settingsButtonEl?.contains(targetNode)) return

      this.settingsPanelEl.classList.add('hidden')
    })
    this.chartToggleBtn?.addEventListener('click', () => {
      const hidden = this.chartSlotEl?.classList.toggle('hidden') || false
      if (this.chartToggleBtn) {
        this.chartToggleBtn.textContent = hidden ? 'Show Chart' : 'Hide Chart'
      }
    })
    this.enableDevControlsEl?.addEventListener('change', () => {
      const settings = this.readUiSettingsFromInputs()
      this.applyUiSettingsToDom(settings)
      applyUiSettingsImmediately()
    })
    this.orientationEl?.addEventListener('change', () => {
      applyUiSettingsImmediately()
    })
    this.autoShatterRaresEl?.addEventListener('change', () => {
      applyUiSettingsImmediately()
    })
    this.disableHintsEl?.addEventListener('change', () => {
      applyUiSettingsImmediately()
    })
    this.backgroundEl?.addEventListener('change', () => {
      applyUiSettingsImmediately()
    })
    document.getElementById('btn-settings-apply')?.addEventListener('click', () => {
      actions.onSettingsApply({
        parityPatch: this.getSettingsPatch(),
        uiSettings: this.readUiSettingsFromInputs(),
      })
    })
  }

  setUiSettings(settings: BemergedUiSettings): void {
    this.uiSettings = this.normalizeUiSettings(settings)
    this.applyUiSettingsToDom(this.uiSettings)
    this.persistUiSettings()
  }

  getUiSettings(): BemergedUiSettings {
    return { ...this.uiSettings }
  }

  setParitySettings(settings: BemergedParityTuning): void {
    this.setInput(this.rateCommonEl, Math.round((settings.dropRates.Common || 0) * 1000) / 10)
    this.setInput(this.rateRareEl, Math.round((settings.dropRates.Rare || 0) * 1000) / 10)
    this.setInput(this.rateEpicEl, Math.round((settings.dropRates.Epic || 0) * 1000) / 10)
    this.setInput(this.mineSpawnEl, settings.mine.spawnPercentPerDrop)
    this.setInput(this.mineCooldownEl, settings.mine.spawnCooldownMoves)
    this.setInput(this.mineMovesEl, settings.mine.baseMoves)
    this.setInput(this.mineRadiusEl, settings.mine.blastRadius)
    this.setInput(this.bossSpawnEl, settings.boss.spawnEveryMoves)
    this.setInput(this.bossHpElInput, settings.boss.baseRequiredHits)
    this.setInput(this.bossStepEl, settings.boss.requiredHitsStepPerSpawn)
    this.setInput(this.bossThresholdEl, settings.boss.destructionThreshold)
    this.setInput(this.bossMoveThresholdEl, settings.boss.moveThreshold)
    this.setInput(this.bossPhaseDurationEl, settings.boss.phaseDuration)
    this.setInput(this.commonDmgEl, settings.damage.bossHitByRarity.Common)
    this.setInput(this.rareDmgEl, settings.damage.bossHitByRarity.Rare)
    this.setInput(this.epicDmgEl, settings.damage.bossHitByRarity.Epic)
    this.setInput(this.legendaryDmgEl, settings.damage.bossHitByRarity.Legendary)
    this.setInput(this.mythicDmgEl, settings.damage.bossHitByRarity.Mythic)
    this.setInput(this.ancestralDmgEl, settings.damage.bossHitByRarity.Ancestral)
    this.setInput(this.shardsPerClearEl, settings.shardsPerClear)
  }

  toggleSettingsPanel(): boolean {
    if (!this.settingsPanelEl) return false
    this.settingsPanelEl.classList.toggle('hidden')
    return !this.settingsPanelEl.classList.contains('hidden')
  }

  setStats(stats: GameStats): void {
    if (this.scoreEl) this.scoreEl.textContent = String(stats.score)
    if (this.moveEl) this.moveEl.textContent = String(stats.moves)
    if (this.mergesEl) this.mergesEl.textContent = String(stats.merges)
    if (this.shattersEl) this.shattersEl.textContent = String(stats.shatters)
    if (this.timerEl) this.timerEl.textContent = this.formatElapsed(stats.elapsedSeconds)

    if (stats.score > this.bestShards) {
      this.bestShards = stats.score
      window.localStorage.setItem('bemerged_best_shards_v1', String(this.bestShards))
    }
    if (this.bestShardsEl) {
      this.bestShardsEl.textContent = String(this.bestShards)
    }

    if (this.shardRow) {
      this.shardRow.innerHTML = ''
      for (const type of shardTypeOrder) {
        const value = stats.shardsByType[type] || 0
        const level = Math.max(0, Math.floor(Number(stats.shardBoostLevels?.[type]) || 0))
        const nextCost = Math.max(1, Math.floor(Number(stats.shardBoostNextCost?.[type]) || 10000))
        const canAfford = !!stats.canAffordShardBoost?.[type]
        const item = document.createElement('div')
        item.className = 'shard-item'
        item.classList.toggle('shard-item-can-buy', canAfford)
        item.title = `${type} Epic level ${level}. Next level cost: ${nextCost.toLocaleString()} ${type} shards`
        item.addEventListener('click', () => {
          this.actions?.onShardTypeClick(type)
        })

        const icon = document.createElement('img')
        icon.src = String(TYPE_TOKENS[type])
        icon.alt = type

        const valueEl = document.createElement('span')
        valueEl.textContent = `${value} · L${level}`

        item.appendChild(icon)
        item.appendChild(valueEl)
        this.shardRow.appendChild(item)
      }
    }
  }

  setStatus(status: string): void {
    if (this.statusEl) this.statusEl.textContent = status
  }

  setAutoplay(status: AutoplayStatus): void {
    this.aiActive = !!status.active
    if (!this.aiStatusEl) return
    this.aiStatusEl.textContent = status.active
      ? `Running (${status.delayMs}ms)`
      : 'Idle'
    if (this.aiToggleBtn) {
      this.aiToggleBtn.textContent = status.active ? 'Stop AI' : 'AI Play'
    }
  }

  setSpecials(state: { mineCount: number; bossHp: number; bossWave: number; bossPhase: number }): void {
    if (this.minesEl) this.minesEl.textContent = String(state.mineCount)
    if (this.bossHpEl) this.bossHpEl.textContent = String(state.bossHp)
    if (this.bossWaveEl) {
      this.bossWaveEl.textContent = state.bossWave > 0 ? `(Wave ${state.bossWave})` : ''
    }
    if (this.bossPhaseEl) {
      this.bossPhaseEl.textContent = state.bossPhase > 0 ? `(P${state.bossPhase})` : ''
    }
  }

  setInventory(inventory: Record<ModuleType, ModuleToken | null>): void {
    if (!this.inventoryRoot) return
    this.inventoryRoot.innerHTML = ''

    for (const type of shardTypeOrder) {
      const slot = document.createElement('div')
      slot.className = 'inventory-slot'
      slot.addEventListener('click', () => {
        this.actions?.onInventorySlotClick(type)
      })

      const token = inventory[type]
      if (token) {
        const frame = document.createElement('img')
        frame.className = 'inv-frame'
        frame.src = token.frameSrc
        frame.alt = `${type} frame`

        const icon = document.createElement('img')
        icon.className = 'inv-icon'
        icon.src = token.assetSrc
        icon.alt = `${type} icon`

        slot.appendChild(frame)
        slot.appendChild(icon)
      } else {
        const placeholder = document.createElement('img')
        placeholder.className = 'inv-placeholder'
        placeholder.src = String(TYPE_TOKENS[type])
        placeholder.alt = type
        slot.appendChild(placeholder)
      }

      const label = document.createElement('span')
      label.className = 'inventory-label'
      label.textContent = type
      slot.appendChild(label)

      this.inventoryRoot.appendChild(slot)
    }
  }

  getDelayMs(): number {
    if (!this.delayInput) return 250
    const parsed = Number(this.delayInput.value)
    if (!Number.isFinite(parsed)) return 250
    return Math.max(50, Math.min(3000, Math.floor(parsed)))
  }

  private getSettingsPatch(): BemergedParityTuningPatch {
    return {
      shardsPerClear: this.getInput(this.shardsPerClearEl),
      dropRates: {
        Common: this.toRateFraction(this.getInput(this.rateCommonEl)),
        Rare: this.toRateFraction(this.getInput(this.rateRareEl)),
        Epic: this.toRateFraction(this.getInput(this.rateEpicEl)),
      },
      mine: {
        spawnPercentPerDrop: this.getInput(this.mineSpawnEl),
        spawnCooldownMoves: this.getInput(this.mineCooldownEl),
        baseMoves: this.getInput(this.mineMovesEl),
        blastRadius: this.getInput(this.mineRadiusEl),
      },
      boss: {
        spawnEveryMoves: this.getInput(this.bossSpawnEl),
        baseRequiredHits: this.getInput(this.bossHpElInput),
        requiredHitsStepPerSpawn: this.getInput(this.bossStepEl),
        destructionThreshold: this.getInput(this.bossThresholdEl),
        moveThreshold: this.getInput(this.bossMoveThresholdEl),
        phaseDuration: this.getInput(this.bossPhaseDurationEl),
      },
      damage: {
        bossHitByRarity: {
          Common: this.getInput(this.commonDmgEl),
          Rare: this.getInput(this.rareDmgEl),
          Epic: this.getInput(this.epicDmgEl),
          Legendary: this.getInput(this.legendaryDmgEl),
          Mythic: this.getInput(this.mythicDmgEl),
          Ancestral: this.getInput(this.ancestralDmgEl),
        },
      },
    }
  }

  private toRateFraction(value: number | undefined): number | undefined {
    if (!Number.isFinite(value)) return undefined
    return Math.max(0, Number(value) / 100)
  }

  private readUiSettingsFromInputs(): BemergedUiSettings {
    const orientationRaw = String(this.orientationEl?.value || this.uiSettings.orientation || 'landscape').toLowerCase()
    const orientation: BemergedOrientation = orientationRaw === 'portrait' ? 'portrait' : 'landscape'

    const backgroundRaw = String(this.backgroundEl?.value || this.uiSettings.background || DEFAULT_UI_SETTINGS.background).trim()
    const background = Object.prototype.hasOwnProperty.call(BACKGROUNDS, backgroundRaw)
      ? backgroundRaw
      : DEFAULT_UI_SETTINGS.background

    return {
      orientation,
      autoShatterRares: !!this.autoShatterRaresEl?.checked,
      disableHints: !!this.disableHintsEl?.checked,
      background,
      enableDevControls: !!this.enableDevControlsEl?.checked,
    }
  }

  private normalizeUiSettings(raw: Partial<BemergedUiSettings> | null | undefined): BemergedUiSettings {
    const orientationRaw = String(raw?.orientation || DEFAULT_UI_SETTINGS.orientation).toLowerCase()
    const orientation: BemergedOrientation = orientationRaw === 'portrait' ? 'portrait' : 'landscape'

    const backgroundRaw = String(raw?.background || DEFAULT_UI_SETTINGS.background)
    const background = Object.prototype.hasOwnProperty.call(BACKGROUNDS, backgroundRaw)
      ? backgroundRaw
      : DEFAULT_UI_SETTINGS.background

    return {
      orientation,
      autoShatterRares: !!raw?.autoShatterRares,
      disableHints: !!raw?.disableHints,
      background,
      enableDevControls: !!raw?.enableDevControls,
    }
  }

  private applyUiSettingsToDom(settings: BemergedUiSettings): void {
    this.uiSettings = this.normalizeUiSettings(settings)

    if (this.shellEl) {
      this.shellEl.classList.toggle('orientation-portrait', this.uiSettings.orientation === 'portrait')
    }

    this.orientationEl && (this.orientationEl.value = this.uiSettings.orientation)
    this.autoShatterRaresEl && (this.autoShatterRaresEl.checked = this.uiSettings.autoShatterRares)
    this.disableHintsEl && (this.disableHintsEl.checked = this.uiSettings.disableHints)
    this.backgroundEl && (this.backgroundEl.value = this.uiSettings.background)
    this.enableDevControlsEl && (this.enableDevControlsEl.checked = this.uiSettings.enableDevControls)

    this.devControlsGroupEl?.classList.toggle('hidden', !this.uiSettings.enableDevControls)

    try {
      applyBackground(this.uiSettings.background)
    } catch {
      void 0
    }
  }

  private populateBackgroundOptions(): void {
    if (!this.backgroundEl) return
    this.backgroundEl.innerHTML = ''
    for (const key of Object.keys(BACKGROUNDS)) {
      const option = document.createElement('option')
      option.value = key
      option.textContent = formatBackgroundDisplay(key)
      this.backgroundEl.appendChild(option)
    }
  }

  private loadUiSettingsFromStorage(): BemergedUiSettings {
    try {
      const raw = window.localStorage.getItem(UI_SETTINGS_STORAGE_KEY)
      if (!raw) return { ...DEFAULT_UI_SETTINGS }
      const parsed = JSON.parse(raw) as Partial<BemergedUiSettings>
      return this.normalizeUiSettings(parsed)
    } catch {
      return { ...DEFAULT_UI_SETTINGS }
    }
  }

  private persistUiSettings(): void {
    try {
      window.localStorage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(this.uiSettings))
    } catch {
      void 0
    }
  }

  private setInput(input: HTMLInputElement | null, value: number): void {
    if (!input) return
    input.value = String(value)
  }

  private getInput(input: HTMLInputElement | null): number | undefined {
    if (!input) return undefined
    const parsed = Number(input.value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  private formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
}
