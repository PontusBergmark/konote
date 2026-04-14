import type { Brand } from '../types'
import { coOccurrenceData } from '../data/cooccurrence'
import { useState } from 'react'
import type { CoOccurrenceType } from '../types'

interface CoOccurrenceProps {
  brands: Brand[]
  selectedBrandId: string
  onBrandChange: (id: string) => void
}

const TYPE_STYLES: Record<CoOccurrenceType, { bg: string; text: string }> = {
  Competitor: { bg: 'var(--badge-competitor-bg)', text: 'var(--badge-competitor-text)' },
  Category: { bg: 'var(--badge-category-bg)', text: 'var(--badge-category-text)' },
  Concept: { bg: 'var(--badge-concept-bg)', text: 'var(--badge-concept-text)' },
  'Sub-brand': { bg: 'var(--badge-subbrand-bg)', text: 'var(--badge-subbrand-text)' },
  Partner: { bg: 'var(--badge-partner-bg)', text: 'var(--badge-partner-text)' },
}

export function CoOccurrence({ brands, selectedBrandId, onBrandChange }: CoOccurrenceProps) {
  const entries = coOccurrenceData[selectedBrandId] ?? []

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-sm font-medium text-foreground mb-4">Co-occurrence</h2>

      {/* Brand pill tabs */}
      <div className="flex gap-1.5 mb-4">
        {brands.map(b => (
          <button
            key={b.id}
            onClick={() => onBrandChange(b.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              selectedBrandId === b.id
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
            {b.name}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Entity</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Frequency</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Framing</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {entries.sort((a, b) => b.frequency - a.frequency).map(entry => {
              const style = TYPE_STYLES[entry.type]
              const delta = entry.delta
              const dir = Math.abs(delta) <= 0.1 ? 'stable' : delta > 0 ? 'positive' : 'negative'

              return (
                <tr key={entry.entity} className="border-b border-border">
                  <td className="py-2 px-3 text-foreground font-medium">{entry.entity}</td>
                  <td className="py-2 px-3">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-1.5">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${entry.frequency}%`, opacity: 0.6 }}
                        />
                      </div>
                      <span className="text-foreground">{entry.frequency}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{entry.framing}</td>
                  <td className="py-2 px-3">
                    <span className={
                      dir === 'positive' ? 'text-primary' : dir === 'negative' ? 'text-destructive' : 'text-muted-foreground'
                    }>
                      {dir === 'positive' ? '↑' : dir === 'negative' ? '↓' : '·'} {Math.abs(delta)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
