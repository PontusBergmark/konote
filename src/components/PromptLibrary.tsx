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

export function PromptLibrary({ prompts, searchQuery, onAdd, onRemove }: PromptLibraryProps) {
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState<PromptType>('category')
  const [collapsed, setCollapsed] = useState<Record<PromptType, boolean>>({
    category: false,
    competitor_anchored: false,
    association_probe: false,
  })

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

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Prompts</h2>
        <span className="text-[11px] text-muted-foreground">{prompts.length} prompts</span>
      </div>

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
