import { useState } from 'react'
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Sidebar } from '../components/Sidebar'
import { TopBar, SCAN_MODES, MODELS_PER_PROMPT, getScanConfig, type ModelFilter, type ScanMode } from '../components/TopBar'
import { SummaryBar } from '../components/SummaryBar'
import { Overview } from '../components/Overview'
import { AssociationMap } from '../components/AssociationMap'
import { AttributeScores } from '../components/AttributeScores'
import { CoOccurrence } from '../components/CoOccurrence'
import { PositioningProbe } from '../components/PositioningProbe'
import { PromptLibrary } from '../components/PromptLibrary'
import { AttributesManager } from '../components/AttributesManager'
import { Settings } from '../components/Settings'
import { Onboarding } from '../components/Onboarding'
import { ScanProgressBar } from '../components/ScanProgressBar'
import { useAppState } from '../hooks/useAppState'

import { useTheme } from '../hooks/useTheme'
import { useExport } from '../hooks/useExport'
import { currentScores, modelScores as seedModelScores } from '../data/scores'
import { runLiveScan } from '../utils/scan.functions'
import type { Attribute, Brand, ModelScoreMatrix, ScanModel, ScoreMatrix } from '../types'

export const Route = createFileRoute("/app")({
  component: AppPage,
  validateSearch: (search: Record<string, unknown>) => ({
    brand: typeof search.brand === 'string' ? search.brand : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Konote — App" },
      { name: "description", content: "Track how LLMs position your brand. Validate which associations land and which gaps to close." },
    ],
  }),
});

function AppPage() {
  const { brand: initialBrandName } = Route.useSearch()
  const app = useAppState()
  const runLiveScanFn = useServerFn(runLiveScan)
  const { isDark, toggle: toggleTheme } = useTheme()
  const { exportView } = useExport()
  const [isScanning, setIsScanning] = useState(false)
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null)
  const [scanScores, setScanScores] = useState(currentScores.scores)
  const [scanModelScores, setScanModelScores] = useState<ModelScoreMatrix>({})
  const [scanExcerpts, setScanExcerpts] = useState<import('../utils/scan.server').ScanExcerpts>({})
  const [scanMode, setScanMode] = useState<ScanMode>(SCAN_MODES.quick.prompts)
  const [selectedModel, setSelectedModel] = useState<ModelFilter>('All')
  const [activeScanDuration, setActiveScanDuration] = useState<number>(SCAN_MODES.quick.durationMs)
  const filteredScores = getScoresForModel(selectedModel, scanScores, scanModelScores, app.brands, app.attributes)
  const filteredModelScores = selectedModel === 'All'
    ? scanModelScores
    : ({ [selectedModel]: filteredScores } as ModelScoreMatrix)

  const handleRunScan = async (
    mode?: ScanMode,
    scanData?: {
      brands: typeof app.brands
      attributes: typeof app.attributes
      promptsList: typeof app.promptsList
      selectedBrandId: string
    }
  ) => {
    const resolved: ScanMode = mode && SCAN_MODES[mode] ? mode : scanMode
    const cfg = SCAN_MODES[resolved]
    const source = scanData ?? app
    setActiveScanDuration(cfg.durationMs)
    setIsScanning(true)
    try {
      const result = await runLiveScanFn({
        data: {
          brands: source.brands,
          attributes: source.attributes,
          prompts: source.promptsList.slice(0, cfg.prompts),
          selectedBrandId: source.selectedBrandId,
        },
      })
      setScanScores(result.scores)
      setScanModelScores(result.modelScores ?? {})
      setScanExcerpts(result.excerpts ?? {})
      setIsScanning(false)
      setLastScannedAt(new Date())
      const promptCount = SCAN_MODES[resolved].prompts
      toast.success(`Scan complete — ${promptCount} prompts across 2 models`)
    } catch (error) {
      console.error('Live scan failed', error)
      setIsScanning(false)
      toast.error('Scan failed — check your API keys and try again')
    }
  }

  if (app.showOnboarding) {
    return (
      <Onboarding
        initialBrandName={initialBrandName}
        onComplete={(data) => {
          const { runScan, scanMode: chosenMode } = app.completeOnboarding(data)
          setScanMode(chosenMode)
          if (runScan) {
            void handleRunScan(chosenMode, {
              brands: [data.ownBrand, ...data.competitors],
              attributes: data.attributes,
              promptsList: data.prompts,
              selectedBrandId: data.ownBrand.id,
            })
          }
        }}
      />
    )
  }

  const handleAddAttributeFromProbe = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    if (app.attributes.some(a => a.id === id)) {
      app.updateAttribute(id, { isIntended: true, active: true })
      return
    }
    app.addAttribute({
      id,
      name,
      description: '',
      active: app.attributes.filter(a => a.active).length < 12,
      order: app.attributes.length,
      isIntended: true,
    })
  }

  const handleExport = () => {
    exportView(app.currentView, app.brands, app.attributes)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentView={app.currentView}
        onViewChange={app.setCurrentView}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          brands={app.brands}
          selectedBrand={app.selectedBrand}
          onBrandChange={app.setSelectedBrandId}
          onExport={handleExport}
          onRunScan={handleRunScan}
          isScanning={isScanning}
          scanMode={scanMode}
          onScanModeChange={setScanMode}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        <ScanProgressBar
          isScanning={isScanning}
          durationMs={activeScanDuration}
          totalCalls={SCAN_MODES[scanMode].prompts * MODELS_PER_PROMPT}
        />
        <SummaryBar
          selectedBrand={app.selectedBrand}
          attributes={app.attributes}
          currentView={app.currentView}
          scores={filteredScores}
        />
        <div className="flex-1 overflow-y-auto">
          {app.currentView === 'overview' && (
            <Overview
              brands={app.brands}
              selectedBrand={app.selectedBrand}
              attributes={app.attributes}
              scores={filteredScores}
              excerpts={scanExcerpts}
              onNavigate={app.setCurrentView}
              onRunScan={handleRunScan}
              isScanning={isScanning}
              lastScannedAt={lastScannedAt}
              hasScanned={lastScannedAt !== null}
              onPromoteToIntended={(name) => {
                const id = name.toLowerCase().replace(/\s+/g, '-')
                if (app.attributes.some(a => a.id === id)) {
                  app.updateAttribute(id, { isIntended: true, active: true })
                } else {
                  app.addAttribute({
                    id,
                    name,
                    description: '',
                    active: true,
                    order: app.attributes.length,
                    isIntended: true,
                  })
                }
              }}
            />
          )}
          {app.currentView === 'association-map' && (
              <AssociationMap brands={app.brands} attributes={app.attributes} scores={filteredScores} modelScores={filteredModelScores} hasScanned={lastScannedAt !== null} onRunScan={() => handleRunScan()} isScanning={isScanning} />
          )}
          {app.currentView === 'attribute-scores' && (
            <AttributeScores brands={app.brands} attributes={app.attributes} scores={filteredScores} modelScores={filteredModelScores} hasScanned={lastScannedAt !== null} onRunScan={() => handleRunScan()} isScanning={isScanning} />
          )}
          {app.currentView === 'co-occurrence' && (
            <CoOccurrence
              brands={app.brands}
              attributes={app.attributes}
              scores={filteredScores}
              selectedBrandId={app.selectedBrandId}
              onBrandChange={app.setSelectedBrandId}
              hasScanned={lastScannedAt !== null}
              onRunScan={() => handleRunScan()}
              isScanning={isScanning}
            />
          )}
          {app.currentView === 'positioning-probe' && (
            <PositioningProbe
              brands={app.brands}
              attributes={app.attributes}
              onAddAttribute={handleAddAttributeFromProbe}
            />
          )}
          {app.currentView === 'prompts' && (
            <PromptLibrary
              prompts={app.promptsList}
              searchQuery={app.searchQuery}
              onAdd={app.addPrompt}
              onRemove={app.removePrompt}
              brands={app.brands}
              selectedBrand={app.selectedBrand}
              attributes={app.attributes}
            />
          )}
          {app.currentView === 'attributes' && (
            <AttributesManager
              attributes={app.attributes}
              onAdd={app.addAttribute}
              onRemove={app.removeAttribute}
              onUpdate={app.updateAttribute}
              onReorder={app.reorderAttributes}
            />
          )}
          {app.currentView === 'settings' && (
            <Settings
              brands={app.brands}
              onAddBrand={app.addBrand}
              onRemoveBrand={app.removeBrand}
              enabledModels={app.enabledModels}
              onToggleModel={app.toggleModel}
              onResetOnboarding={app.resetToOnboarding}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function getScoresForModel(
  selectedModel: ModelFilter,
  scores: ScoreMatrix,
  modelScores: ModelScoreMatrix,
  brands: Brand[],
  attributes: Attribute[]
): ScoreMatrix {
  if (selectedModel === 'All') return scores
  return modelScores[selectedModel] ?? createSeedModelScoreMatrix(selectedModel, brands, attributes, scores)
}

function createSeedModelScoreMatrix(model: ScanModel, brands: Brand[], attributes: Attribute[], fallback: ScoreMatrix): ScoreMatrix {
  const key = model === 'ChatGPT' ? 'chatgpt' : 'claude'
  return brands.reduce<ScoreMatrix>((acc, brand) => {
    acc[brand.id] = {}
    attributes.forEach(attribute => {
      acc[brand.id][attribute.id] = seedModelScores[brand.id]?.[attribute.id]?.[key] ?? fallback[brand.id]?.[attribute.id] ?? 0
    })
    return acc
  }, {})
}
