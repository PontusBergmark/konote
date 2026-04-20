import { useState } from 'react'
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from '@tanstack/react-start'
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
import { currentScores } from '../data/scores'
import type { Attribute, Brand, Prompt } from '../types'

type ScanInput = {
  brands: Brand[]
  attributes: Attribute[]
  prompts: Prompt[]
  selectedBrandId: string
}

const runLiveScan = createServerFn({ method: 'POST' })
  .inputValidator((data: ScanInput) => data)
  .handler(async ({ data }) => {
    const activeAttributes = data.attributes.filter((attribute) => attribute.active).slice(0, 12)
    const prompts = data.prompts.slice(0, 15)
    const scores: Record<string, Record<string, number>> = {}

    data.brands.forEach((brand) => {
      scores[brand.id] = {}
      activeAttributes.forEach((attribute) => {
        scores[brand.id][attribute.id] = 0
      })
    })

    if (prompts.length === 0 || activeAttributes.length === 0 || data.brands.length === 0) {
      return { scores, responses: 0 }
    }

    const scanPrompt = buildScanPrompt(data.brands, activeAttributes, prompts)
    const responses = await Promise.all([callClaude(scanPrompt), callGpt4o(scanPrompt)])

    responses.forEach((response) => {
      const parsed = parseScoreJson(response)
      data.brands.forEach((brand) => {
        activeAttributes.forEach((attribute) => {
          const value = parsed?.[brand.name]?.[attribute.name]
          if (typeof value === 'number') {
            scores[brand.id][attribute.id] += Math.max(0, Math.min(100, value))
          }
        })
      })
    })

    data.brands.forEach((brand) => {
      activeAttributes.forEach((attribute) => {
        scores[brand.id][attribute.id] = Math.round(scores[brand.id][attribute.id] / responses.length)
      })
    })

    return { scores, responses: responses.length }
  })

function buildScanPrompt(brands: Brand[], attributes: Attribute[], prompts: Prompt[]) {
  return `You are scoring brand associations in LLM answers. Use the research prompts below as the context being tested. Return ONLY valid JSON in this exact shape: {"scores":{"Brand name":{"Attribute name":0}}}. Scores are 0-100 for how strongly the model would associate that brand with that attribute across the prompts.\n\nBrands: ${brands.map((b) => b.name).join(', ')}\nAttributes: ${attributes.map((a) => a.name).join(', ')}\nPrompts:\n${prompts.map((p, i) => `${i + 1}. ${p.text}`).join('\n')}`
}

async function callClaude(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return ''
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': apiKey },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-latest', max_tokens: 1400, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) return ''
  const json = await res.json() as { content?: Array<{ text?: string }> }
  return json.content?.map((part) => part.text ?? '').join('\n') ?? ''
}

async function callGpt4o(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return ''
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) return ''
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.[0]?.message?.content ?? ''
}

function parseScoreJson(raw: string): Record<string, Record<string, number>> | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0]) as { scores?: Record<string, Record<string, number>> }
    return parsed.scores ?? null
  } catch {
    return null
  }
}

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
  const runLiveScanFn = useServerFn(runLiveScan)
  const { isDark, toggle: toggleTheme } = useTheme()
  const { exportView } = useExport()
  const [isScanning, setIsScanning] = useState(false)
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null)
  const [scanScores, setScanScores] = useState(currentScores.scores)
  const [scanMode, setScanMode] = useState<ScanMode>('quick')
  const [activeScanDuration, setActiveScanDuration] = useState<number>(SCAN_MODES.quick.durationMs)

  const handleRunScan = async (mode?: ScanMode) => {
    const resolved: ScanMode = mode && SCAN_MODES[mode] ? mode : scanMode
    const cfg = SCAN_MODES[resolved]
    setActiveScanDuration(cfg.durationMs)
    setIsScanning(true)
    try {
      const result = await runLiveScanFn({
        data: {
          brands: app.brands,
          attributes: app.attributes,
          prompts: app.promptsList.slice(0, cfg.prompts),
          selectedBrandId: app.selectedBrandId,
        },
      })
      setScanScores(result.scores)
      setIsScanning(false)
      setLastScannedAt(new Date())
    } catch (error) {
      console.error('Live scan failed', error)
      setIsScanning(false)
    }
  }

  if (app.showOnboarding) {
    return (
      <Onboarding
        onComplete={(data) => {
          const { runScan, scanMode: chosenMode } = app.completeOnboarding(data)
          setScanMode(chosenMode)
          if (runScan) {
            setTimeout(() => handleRunScan(chosenMode), 100)
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
        />
        <ScanProgressBar isScanning={isScanning} durationMs={activeScanDuration} />
        <SummaryBar
          selectedBrand={app.selectedBrand}
          attributes={app.attributes}
          currentView={app.currentView}
          scores={scanScores}
        />
        <div className="flex-1 overflow-y-auto">
          {app.currentView === 'overview' && (
            <Overview
              brands={app.brands}
              selectedBrand={app.selectedBrand}
              attributes={app.attributes}
              scores={scanScores}
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
            <AssociationMap brands={app.brands} attributes={app.attributes} scores={scanScores} />
          )}
          {app.currentView === 'attribute-scores' && (
            <AttributeScores brands={app.brands} attributes={app.attributes} scores={scanScores} />
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
