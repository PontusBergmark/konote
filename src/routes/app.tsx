import { useState } from 'react'
import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from '../components/Sidebar'
import { TopBar, SCAN_MODES, type ScanMode } from '../components/TopBar'
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

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({
    meta: [
      { title: "Konote — App" },
      { name: "description", content: "Track how LLMs position your brand. Validate which associations land and which gaps to close." },
    ],
  }),
});

function AppPage() {
  const app = useAppState()
  const { isDark, toggle: toggleTheme } = useTheme()
  const { exportView } = useExport()
  const [isScanning, setIsScanning] = useState(false)
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null)
  const [scanMode, setScanMode] = useState<ScanMode>('quick')
  const [activeScanDuration, setActiveScanDuration] = useState<number>(SCAN_MODES.quick.durationMs)

  const handleRunScan = (mode?: ScanMode) => {
    const resolved: ScanMode = mode && SCAN_MODES[mode] ? mode : scanMode
    const cfg = SCAN_MODES[resolved]
    setActiveScanDuration(cfg.durationMs)
    setIsScanning(true)
    const prompt = `Run a ${cfg.label.toLowerCase()} (${cfg.prompts} prompts) for ${app.selectedBrand?.name ?? 'brand'} across all tracked prompts and attributes. Return structured results for each attribute showing explicit mention frequency.`
    console.log('[mock scan] sendPrompt:', prompt)
    setTimeout(() => {
      setIsScanning(false)
      setLastScannedAt(new Date())
    }, cfg.durationMs)
  }

  if (app.showOnboarding) {
    return (
      <Onboarding
        onComplete={(data) => {
          const shouldScan = app.completeOnboarding(data)
          if (shouldScan) {
            setTimeout(handleRunScan, 100)
          }
        }}
      />
    )
  }

  const handleAddAttributeFromProbe = (name: string) => {
    app.addAttribute({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: '',
      active: app.attributes.filter(a => a.active).length < 12,
      order: app.attributes.length,
      isIntended: true,
    })
    app.setCurrentView('attributes')
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
        />
        <ScanProgressBar isScanning={isScanning} durationMs={activeScanDuration} />
        <SummaryBar
          selectedBrand={app.selectedBrand}
          attributes={app.attributes}
          currentView={app.currentView}
        />
        <div className="flex-1 overflow-y-auto">
          {app.currentView === 'overview' && (
            <Overview
              brands={app.brands}
              selectedBrand={app.selectedBrand}
              attributes={app.attributes}
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
            <AssociationMap brands={app.brands} attributes={app.attributes} />
          )}
          {app.currentView === 'attribute-scores' && (
            <AttributeScores brands={app.brands} attributes={app.attributes} />
          )}
          {app.currentView === 'co-occurrence' && (
            <CoOccurrence
              brands={app.brands}
              selectedBrandId={app.selectedBrandId}
              onBrandChange={app.setSelectedBrandId}
            />
          )}
          {app.currentView === 'positioning-probe' && (
            <PositioningProbe
              brands={app.brands}
              onAddAttribute={handleAddAttributeFromProbe}
            />
          )}
          {app.currentView === 'prompts' && (
            <PromptLibrary
              prompts={app.promptsList}
              searchQuery={app.searchQuery}
              onAdd={app.addPrompt}
              onRemove={app.removePrompt}
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
