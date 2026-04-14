import { useState } from 'react'
import type { Prompt, PromptType, CEPStatus } from '../types'

interface PromptLibraryProps {
  prompts: Prompt[]
  searchQuery: string
  onAdd: (prompt: Prompt) => void
  onRemove: (id: string) => void
}

const TYPE_LABELS: Record<PromptType, { label: string; color: string; bg: string }> = {
  association_probe: { label: 'Probe', color: 'var(--badge-concept-text)', bg: 'var(--badge-concept-bg)' },
  competitor_anchored: { label: 'Anchored', color: 'var(--badge-competitor-text)', bg: 'var(--badge-competitor-bg)' },
  entry_point: { label: 'Entry', color: 'var(--badge-category-text)', bg: 'var(--badge-category-bg)' },
}

export function PromptLibrary({ prompts, searchQuery, onAdd, onRemove }: PromptLibraryProps) {
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState<PromptType>('association_probe')
  const [collapsed, setCollapsed] = useState<Record<PromptType, boolean>>({
    association_probe: false,
    competitor_anchored: false,
    entry_point: false,
  })

  const filtered = prompts.filter(p =>
    !searchQuery || p.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped: Record<PromptType, Prompt[]> = {
    association_probe: filtered.filter(p => p.type === 'association_probe'),
    competitor_anchored: filtered.filter(p => p.type === 'competitor_anchored'),
    entry_point: filtered.filter(p => p.type === 'entry_point'),
  }

  const handleAdd = () => {
    if (!newText.trim()) return
    onAdd({
      id: `p-${Date.now()}`,
      text: newText.trim(),
      type: newType,
      cepStatus: 'unvalidated',
      tags: [],
      createdAt: new Date().toISOString().split('T')[0],
    })
    setNewText('')
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-sm font-medium text-foreground mb-4">Prompts</h2>

      {/* Sections */}
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
                    {p.type === 'entry_point' && (
                      p.cepStatus === 'confirmed_cep' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary text-primary-foreground">CEP</span>
                      ) : p.cepStatus === 'rejected' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-destructive text-destructive-foreground">✕</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      )
                    )}
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

      {/* Add form */}
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
