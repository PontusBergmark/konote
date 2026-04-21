import type { Brand, Attribute, ModelScoreMatrix, ScanModel } from '../types'
import { currentScores } from '../data/scores'
import { calculateShareOfVoice, isBelowNoiseFloor, displayScore } from '../utils/scoring'
import { ScanEmptyState } from './ScanEmptyState'

interface AttributeScoresProps {
  brands: Brand[]
  attributes: Attribute[]
  scores?: Record<string, Record<string, number>>
  modelScores?: ModelScoreMatrix
  hasScanned?: boolean
  onRunScan?: () => void
  isScanning?: boolean
}

const SCAN_MODELS: ScanModel[] = ['ChatGPT', 'Claude']

export function AttributeScores({ brands, attributes, scores = currentScores.scores, modelScores = {}, hasScanned, onRunScan, isScanning }: AttributeScoresProps) {
  const activeAttrs = attributes.filter(a => a.active)
  const hasModelScores = SCAN_MODELS.some(model => Boolean(modelScores[model]))

  const allZero = !hasScanned && activeAttrs.every(attr => brands.every(b => (scores[b.id]?.[attr.id] ?? 0) === 0))
  if (allZero) {
    return <ScanEmptyState onRunScan={onRunScan} isScanning={isScanning} />
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-sm font-medium text-foreground mb-4">Attribute scores</h2>
      <div className="space-y-6">
        {activeAttrs.map(attr => {
          const sov = calculateShareOfVoice(attr.id, scores)
          const ranked = brands
            .map(b => ({ brand: b, score: scores[b.id]?.[attr.id] ?? 0, share: sov[b.id] ?? 0 }))
            .sort((a, b) => b.score - a.score)

          return (
            <div key={attr.id} className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs font-medium text-foreground mb-2">Who owns {attr.name}?</p>
              {/* Stacked horizontal bar */}
              <div className="flex rounded-md overflow-hidden h-6 mb-3">
                {ranked.map(r => (
                  <div
                    key={r.brand.id}
                    className="flex items-center justify-center text-[9px] font-medium transition-all"
                    style={{
                      width: `${r.share}%`,
                      backgroundColor: r.brand.color,
                      color: 'white',
                      minWidth: r.share > 5 ? undefined : '0px',
                    }}
                  >
                    {r.share > 8 ? `${Math.round(r.share)}%` : ''}
                  </div>
                ))}
              </div>
              {/* Ranked list */}
              <div className="space-y-1">
                {ranked.map((r, i) => (
                  <div key={r.brand.id} className="flex items-center gap-2 text-[11px]">
                    <span className="text-muted-foreground w-4">{i + 1}.</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.brand.color }} />
                    <span className="text-foreground w-20">{r.brand.name}</span>
                    <div className="flex-1 bg-secondary rounded-full h-1.5">
                      <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: r.brand.color }} />
                    </div>
                    <span className="text-muted-foreground w-8 text-right">{isBelowNoiseFloor(r.score) ? <span className="italic text-[9px]">—</span> : r.score}</span>
                    <span className="text-muted-foreground w-12 text-right">{Math.round(r.share)}% SoV</span>
                  </div>
                ))}
              </div>
              {hasModelScores && (
                <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                  {SCAN_MODELS.map(model => {
                    const modelRanked = brands
                      .map(b => ({ brand: b, score: modelScores[model]?.[b.id]?.[attr.id] ?? 0 }))
                      .sort((a, b) => b.score - a.score)

                    return (
                      <div key={model}>
                        <p className="mb-1.5 text-[10px] font-medium uppercase text-muted-foreground">{model}</p>
                        <div className="space-y-1">
                          {modelRanked.map(r => (
                            <div key={r.brand.id} className="flex items-center gap-2 text-[11px]">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.brand.color }} />
                              <span className="w-20 text-foreground">{r.brand.name}</span>
                              <div className="h-1.5 flex-1 rounded-full bg-secondary">
                                <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: r.brand.color }} />
                              </div>
                              <span className="w-8 text-right text-muted-foreground">{isBelowNoiseFloor(r.score) ? <span className="italic text-[9px]">—</span> : r.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
