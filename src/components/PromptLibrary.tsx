import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import type { Attribute, Brand, Prompt, PromptType } from '../types'
import { runSensitivityTest } from '../utils/sensitivity.functions'
import type { SensitivityResult } from '../utils/sensitivity.server'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface PromptLibraryProps {
  prompts: Prompt[]
  searchQuery: string
  onAdd: (prompt: Prompt) => void
  onRemove: (id: string) => void
  brands: Brand[]
  selectedBrand?: Brand
  attributes: Attribute[]
}

const TYPE_LABELS: Record<PromptType, { label: string; color: string; bg: string }> = {
  category: { label: 'Category', color: 'var(--badge-category-text, var(--badge-concept-text))', bg: 'var(--badge-category-bg, var(--badge-concept-bg))' },
  competitor_anchored: { label: 'Anchored', color: 'var(--badge-competitor-text)', bg: 'var(--badge-competitor-bg)' },
  association_probe: { label: 'Brand', color: 'var(--badge-concept-text)', bg: 'var(--badge-concept-bg)' },
}

export function PromptLibrary({ prompts, searchQuery, onAdd, onRemove, brands, selectedBrand, attributes }: PromptLibraryProps) {
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState<PromptType>('category')
  const [collapsed, setCollapsed] = useState<Record<PromptType, boolean>>({
    category: false,
    competitor_anchored: false,
    association_probe: false,
  })
  const sensitivityFn = useServerFn(runSensitivityTest)
  const intendedAttributes = attributes.filter(a => a.isIntended)
  const defaultBrandId = selectedBrand?.id ?? brands[0]?.id ?? ''
  const defaultAttrId = intendedAttributes[0]?.id ?? attributes[0]?.id ?? ''
  const [sensBrandId, setSensBrandId] = useState<string>(defaultBrandId)
  const [sensAttrId, setSensAttrId] = useState<string>(defaultAttrId)
  const [sensRunning, setSensRunning] = useState(false)
  const [sensResult, setSensResult] = useState<SensitivityResult | null>(null)

  const activeBrandId = sensBrandId || defaultBrandId
  const activeAttrId = sensAttrId || defaultAttrId

  const handleRunSensitivity = async () => {
    const brand = brands.find(b => b.id === activeBrandId)
    const attribute = attributes.find(a => a.id === activeAttrId)
    if (!brand || !attribute) {
      toast.error('Pick a brand and an attribute first')
      return
    }
    setSensRunning(true)
    setSensResult(null)
    try {
      const result = await sensitivityFn({ data: { brandName: brand.name, attributeName: attribute.name } })
      setSensResult(result)
      toast.success('Sensitivity test complete')
    } catch (e) {
      console.error('Sensitivity test failed', e)
      toast.error('Sensitivity test failed — check API keys and try again')
    } finally {
      setSensRunning(false)
    }
  }

  const filtered = prompts.filter(p =>
    !searchQuery || p.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped: Record<PromptType, Prompt[]> = {
    category: filtered.filter(p => p.type === 'category'),
    competitor_anchored: filtered.filter(p => p.type === 'competitor_anchored'),
    association_probe: filtered.filter(p => p.type === 'association_probe'),
  }

  const handleAdd = () => {
    if (!newText.trim()) return
    onAdd({
      id: `p-${Date.now()}`,
      text: newText.trim(),
      type: newType,
      tags: [],
      createdAt: new Date().toISOString().split('T')[0],
    })
    setNewText('')
  }

  const deltaSign = sensResult ? (sensResult.delta > 0 ? '+' : sensResult.delta < 0 ? '−' : '') : ''
  const deltaAbs = sensResult ? Math.abs(sensResult.delta) : 0

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Prompts</h2>
        <span className="text-[11px] text-muted-foreground">{prompts.length} prompts</span>
      </div>

      <TooltipProvider delayDuration={150}>
        <section className="mb-6 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xs font-semibold text-foreground">Prompt sensitivity test</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground border border-border rounded-full w-4 h-4 inline-flex items-center justify-center cursor-help">?</span>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-[11px] leading-relaxed">
                A high delta suggests this association may be influenced by how the question is asked. Consider whether it reflects genuine brand perception.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Compare a neutral prompt with a framed prompt across Claude and GPT-4o to see whether an association is intrinsic or prompt-induced.
          </p>

          <div className="flex flex-wrap items-end gap-2 mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Brand</span>
              <select
                value={activeBrandId}
                onChange={e => setSensBrandId(e.target.value)}
                className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground"
              >
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Attribute</span>
              <select
                value={activeAttrId}
                onChange={e => setSensAttrId(e.target.value)}
                className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground"
              >
                {attributes.map(a => <option key={a.id} value={a.id}>{a.name}{a.isIntended ? ' ★' : ''}</option>)}
              </select>
            </label>
            <button
              onClick={handleRunSensitivity}
              disabled={sensRunning || !activeBrandId || !activeAttrId}
              className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {sensRunning ? 'Running…' : 'Run test'}
            </button>
          </div>

          {sensResult && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md border border-border p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Neutral prompt</div>
                <div className="font-mono text-[11px] text-muted-foreground mb-2 truncate" title={sensResult.neutralPrompt}>{sensResult.neutralPrompt}</div>
                <div className="text-2xl font-semibold text-foreground tabular-nums">{sensResult.neutralScore}</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Framed prompt</div>
                <div className="font-mono text-[11px] text-muted-foreground mb-2 truncate" title={sensResult.framedPrompt}>{sensResult.framedPrompt}</div>
                <div className="text-2xl font-semibold text-foreground tabular-nums">{sensResult.framedScore}</div>
              </div>
              <div className={`rounded-md border p-3 ${sensResult.isPromptSensitive ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Delta</div>
                <div className="text-2xl font-semibold text-foreground tabular-nums mb-1">{deltaSign}{deltaAbs}</div>
                <div className={`text-[11px] ${sensResult.isPromptSensitive ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {sensResult.isPromptSensitive ? 'Likely prompt-sensitive' : 'Stable across phrasings'}
                </div>
              </div>
              <div className="sm:col-span-3 text-[11px] text-muted-foreground">
                Per model — {sensResult.perModel.map(m => `${m.model}: ${m.neutral} → ${m.framed}`).join(' · ')}
              </div>
            </div>
          )}
        </section>
      </TooltipProvider>

      {(Object.keys(grouped) as PromptType[]).map(type => {
        const items = grouped[type]
        const meta = TYPE_LABELS[type]
        const isCollapsed = collapsed[type]

        return (
          <div key={type} className="mb-4">
            <button
              onClick={() => setCollapsed(prev => ({ ...prev, [type]: !prev[type] }))}
              className="flex items-center gap-2 mb-2"
            >
              <span className="text-[10px] text-muted-foreground">{isCollapsed ? '▸' : '▾'}</span>
              <span className="text-xs font-medium text-foreground">{meta.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium" style={{ backgroundColor: meta.bg, color: meta.color }}>
                {items.length}
              </span>
            </button>
            {!isCollapsed && (
              <div className="space-y-1 ml-4">
                {items.map(p => (
                  <div key={p.id} className="flex items-center gap-2 group">
                    <span className="font-mono text-xs text-foreground flex-1 truncate">{p.text}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ backgroundColor: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <button
                      onClick={() => onRemove(p.id)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="mt-6 bg-card border border-border rounded-lg p-4 space-y-3">
        <textarea
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Enter a new prompt..."
          className="w-full px-2.5 py-1.5 text-xs font-mono bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none h-16"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
        />
        <div className="flex items-center gap-2">
          {(Object.keys(TYPE_LABELS) as PromptType[]).map(t => (
            <button
              key={t}
              onClick={() => setNewType(t)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                newType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {TYPE_LABELS[t].label}
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground ml-2">Press Enter to add</span>
        </div>
        <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90">
          Add prompt
        </button>
      </div>
    </div>
  )
}
