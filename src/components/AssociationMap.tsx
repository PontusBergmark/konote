import type { Brand, Attribute, ModelScoreMatrix } from '../types'
import { currentScores, modelScores as seedModelScores } from '../data/scores'
import { useState } from 'react'
import { calculateShareOfVoice } from '../utils/scoring'
import { brands as allBrands } from '../data/brands'
import { ScanEmptyState } from './ScanEmptyState'
import { AlertTriangle } from 'lucide-react'

interface AssociationMapProps {
  brands: Brand[]
  attributes: Attribute[]
  scores?: Record<string, Record<string, number>>
  modelScores?: ModelScoreMatrix
  hasScanned?: boolean
  onRunScan?: () => void
  isScanning?: boolean
}

export function AssociationMap({ brands, attributes, scores = currentScores.scores, modelScores = {}, hasScanned, onRunScan, isScanning }: AssociationMapProps) {
  const [intendedOnly, setIntendedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [detailAttrId, setDetailAttrId] = useState<string | null>(null)

  const visibleAttrs = intendedOnly ? attributes.filter(a => a.isIntended && a.active) : attributes.filter(a => a.active)
  const allZero = !hasScanned && visibleAttrs.every(attr => brands.every(b => (scores[b.id]?.[attr.id] ?? 0) === 0))
  if (allZero) {
    return <ScanEmptyState onRunScan={onRunScan} isScanning={isScanning} />
  }


  const sortedBrands = [...brands].sort((a, b) => {
    if (!sortBy) return 0
    const sa = scores[a.id]?.[sortBy] ?? 0
    const sb = scores[b.id]?.[sortBy] ?? 0
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
  const sovData = detailAttrId ? calculateShareOfVoice(detailAttrId, scores) : {}

  // ---- Auto-generated summary: highest and lowest non-zero cells in the visible grid ----
  type Cell = { brand: Brand; attr: Attribute; score: number }
  const cells: Cell[] = []
  for (const brand of brands) {
    for (const attr of visibleAttrs) {
      const score = scores[brand.id]?.[attr.id] ?? 0
      cells.push({ brand, attr, score })
    }
  }

  let summary: string | null = null
  if (cells.length > 0 && brands.length > 1) {
    const highest = cells.reduce((a, b) => (b.score > a.score ? b : a))
    // Find the attribute where the leader brand is most clearly behind the best on that attribute
    const leader = highest.brand
    let biggestGap: { attr: Attribute; leaderScore: number; winner: Brand; winnerScore: number } | null = null
    for (const attr of visibleAttrs) {
      const leaderScore = scores[leader.id]?.[attr.id] ?? 0
      const ranked = brands
        .map(b => ({ brand: b, score: scores[b.id]?.[attr.id] ?? 0 }))
        .sort((a, b) => b.score - a.score)
      const winner = ranked[0]
      if (winner.brand.id === leader.id) continue
      const gap = winner.score - leaderScore
      if (!biggestGap || gap > biggestGap.winnerScore - biggestGap.leaderScore) {
        biggestGap = { attr, leaderScore, winner: winner.brand, winnerScore: winner.score }
      }
    }
    if (highest.score > 0) {
      if (biggestGap && biggestGap.winnerScore - biggestGap.leaderScore >= 10) {
        summary = `${leader.name} leads on ${highest.attr.name.toLowerCase()} but loses ${biggestGap.attr.name.toLowerCase()} to ${biggestGap.winner.name}.`
      } else {
        summary = `${leader.name} leads the grid, anchored by ${highest.attr.name.toLowerCase()}.`
      }
    }
  }

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
                  const score = scores[brand.id]?.[attr.id] ?? 0
                  const pct = Math.max(0, Math.min(1, score / maxScore))
                  // Proportional alpha on a saturated teal — near-zero scores render almost white
                  const alphaPct = Math.round(pct * 100)
                  const bg = `color-mix(in oklch, var(--heatmap-base) ${alphaPct}%, transparent)`
                  const chatgptScore = modelScores.ChatGPT?.[brand.id]?.[attr.id] ?? seedModelScores[brand.id]?.[attr.id]?.chatgpt ?? 0
                  const claudeScore = modelScores.Claude?.[brand.id]?.[attr.id] ?? seedModelScores[brand.id]?.[attr.id]?.claude ?? 0

                  const divergence = Math.abs(chatgptScore - claudeScore)
                  const lowConsensus = divergence >= 20

                  return (
                    <td key={attr.id} className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-5 rounded-sm flex-1 max-w-[80px] relative" style={{ backgroundColor: bg }}>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium" style={{ color: pct > 0.6 ? 'white' : 'var(--color-foreground)' }}>
                              {score}
                            </div>
                          </div>
                          {lowConsensus && (
                            <span title={`Low consensus — ChatGPT ${chatgptScore} vs Claude ${claudeScore} (Δ${divergence})`}>
                              <AlertTriangle size={12} className="text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1" title={`ChatGPT ${chatgptScore} · Claude ${claudeScore}`}>
                          {[
                            ['ChatGPT', chatgptScore],
                            ['Claude', claudeScore],
                          ].map(([m, modelScore]) => (
                            <span
                              key={m}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: Number(modelScore) > 50 ? 'var(--color-foreground)' : 'var(--color-border)',
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

      {summary && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Key finding · </span>
          {summary}
        </p>
      )}

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
                const score = scores[brandId]?.[detailAttr.id] ?? 0
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
