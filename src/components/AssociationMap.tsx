import type { Brand, Attribute } from '../types'
import { currentScores, modelScores } from '../data/scores'
import { useState } from 'react'
import { calculateShareOfVoice } from '../utils/scoring'
import { brands as allBrands } from '../data/brands'

interface AssociationMapProps {
  brands: Brand[]
  attributes: Attribute[]
}

export function AssociationMap({ brands, attributes }: AssociationMapProps) {
  const [intendedOnly, setIntendedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [detailAttrId, setDetailAttrId] = useState<string | null>(null)

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

  const detailAttr = detailAttrId ? attributes.find(a => a.id === detailAttrId) : null
  const sovData = detailAttrId ? calculateShareOfVoice(detailAttrId, currentScores.scores) : {}

  return (
    <div className="p-6 relative">
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
                  <span
                    className="hover:underline cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setDetailAttrId(detailAttrId === attr.id ? null : attr.id) }}
                  >
                    {attr.name}
                  </span>
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

      {/* Attribute detail slide-out */}
      {detailAttr && (
        <div className="fixed top-0 right-0 h-full w-[320px] bg-card border-l border-border shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Who owns {detailAttr.name}?</h3>
            <button onClick={() => setDetailAttrId(null)} className="text-muted-foreground hover:text-foreground text-sm">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-[11px] text-muted-foreground">Share of voice breakdown</p>
            {Object.entries(sovData)
              .sort(([, a], [, b]) => b - a)
              .map(([brandId, share]) => {
                const brand = brands.find(b => b.id === brandId)
                const score = currentScores.scores[brandId]?.[detailAttr.id] ?? 0
                return (
                  <div key={brandId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brand?.color }} />
                        <span className="text-foreground font-medium">{brand?.name ?? brandId}</span>
                      </div>
                      <span className="text-muted-foreground">{share}% SoV · {score} score</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${share}%`, backgroundColor: brand?.color ?? 'var(--color-primary)' }}
                      />
                    </div>
                  </div>
                )
              })}
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground">
                {detailAttr.isIntended ? '✓ Intended positioning attribute' : 'Not marked as intended positioning'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{detailAttr.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
