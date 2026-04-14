import type { Brand, Attribute } from '../types'
import { currentScores, modelScores } from '../data/scores'
import { useState } from 'react'

interface AssociationMapProps {
  brands: Brand[]
  attributes: Attribute[]
}

export function AssociationMap({ brands, attributes }: AssociationMapProps) {
  const [intendedOnly, setIntendedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const visibleAttrs = intendedOnly ? attributes.filter(a => a.isIntended && a.active) : attributes.filter(a => a.active)

  const sortedBrands = [...brands].sort((a, b) => {
    if (!sortBy) return 0
    const sa = currentScores.scores[a.id]?.[sortBy] ?? 0
    const sb = currentScores.scores[b.id]?.[sortBy] ?? 0
    return sortDir === 'desc' ? sb - sa : sa - sb
  })

  const handleSort = (attrId: string) => {
    if (sortBy === attrId) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(attrId)
      setSortDir('desc')
    }
  }

  const maxScore = 100

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Association map</h2>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={intendedOnly}
            onChange={e => setIntendedOnly(e.target.checked)}
            className="accent-primary w-3 h-3"
          />
          Intended positioning only
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium w-28">Brand</th>
              {visibleAttrs.map(attr => (
                <th
                  key={attr.id}
                  className="text-left py-2 px-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground min-w-[120px]"
                  onClick={() => handleSort(attr.id)}
                >
                  {attr.name}
                  {sortBy === attr.id && <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBrands.map(brand => (
              <tr key={brand.id} className="border-t border-border">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.color }} />
                    <span className="text-foreground font-medium">{brand.name}</span>
                  </div>
                </td>
                {visibleAttrs.map(attr => {
                  const score = currentScores.scores[brand.id]?.[attr.id] ?? 0
                  const pct = score / maxScore
                  // Interpolate between heatmap-low and heatmap-high
                  const bg = `color-mix(in oklch, var(--heatmap-high) ${Math.round(pct * 100)}%, var(--heatmap-low))`
                  const models = modelScores[brand.id]?.[attr.id] ?? {}

                  return (
                    <td key={attr.id} className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-5 rounded-sm flex-1 max-w-[80px] relative" style={{ backgroundColor: bg }}>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium" style={{ color: pct > 0.5 ? 'white' : 'var(--color-foreground)' }}>
                              {score}
                            </div>
                          </div>
                        </div>
                        {/* Consistency dots */}
                        <div className="flex gap-1" title={`ChatGPT ${(models.chatgpt ?? 0) > 50 ? '✓' : '✗'} · Claude ${(models.claude ?? 0) > 50 ? '✓' : '✗'} · Gemini ${(models.gemini ?? 0) > 50 ? '✓' : '✗'}`}>
                          {['chatgpt', 'claude', 'gemini'].map(m => (
                            <span
                              key={m}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: (models[m] ?? 0) > 50 ? 'var(--color-foreground)' : 'var(--color-border)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
