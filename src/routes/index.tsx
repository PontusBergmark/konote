import { useState, useCallback } from 'react'
import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
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
import { useAppState } from '../hooks/useAppState'
import { useUsage } from '../hooks/useUsage'
import { useTheme } from '../hooks/useTheme'
import { useExport } from '../hooks/useExport'

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LLM Perception Tracker — Brand Association Analytics" },
      { name: "description", content: "Track whether your brand positioning shows up in what LLMs say about you. Based on Ulli Applebaum's brand association framework." },
    ],
  }),
});

function Index() {
  const app = useAppState()
  const { usage, plan } = useUsage()
  const { isDark, toggle: toggleTheme } = useTheme()
  const { exportView } = useExport()

  if (app.showOnboarding) {
    return <Onboarding onComplete={app.completeOnboarding} />
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
        searchQuery={app.searchQuery}
        onSearchChange={app.setSearchQuery}
        usage={usage}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          brands={app.brands}
          selectedBrand={app.selectedBrand}
          onBrandChange={app.setSelectedBrandId}
          onExport={handleExport}
        />
        <SummaryBar
          selectedBrand={app.selectedBrand}
          attributes={app.attributes}
          currentView={app.currentView}
        />
        <div className="flex-1 overflow-y-auto">
          {app.currentView === 'overview' && (
            <Overview
              brands={app.brands}
              attributes={app.attributes}
              onNavigate={app.setCurrentView}
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
              maxPrompts={plan.maxPrompts}
              currentTier={usage.currentTier}
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
              currentTier={usage.currentTier}
              onResetOnboarding={app.resetToOnboarding}
            />
          )}
        </div>
      </div>
    </div>
  )
}
