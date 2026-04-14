import type { Brand, Attribute } from '../types'
import { currentScores, previousScores } from '../data/scores'
import { calculatePositioningPresence, calculateDelta, getStrongestAttribute, getDeltaDirection } from '../utils/scoring'
import { coOccurrenceData } from '../data/cooccurrence'
import type { ViewId } from '../types'

interface OverviewProps {
  brands: Brand[]
  attributes: Attribute[]
  onNavigate: (view: ViewId) => void
  onRunScan?: () => void
  isScanning?: boolean
}

export function Overview({ brands, attributes, onNavigate }: OverviewProps) {
  const intendedIds = attributes.filter(a => a.isIntended && a.active).map(a => a.id)
  const strongest = getStrongestAttribute(currentScores.scores)
  const strongestAttrName = strongest ? attributes.find(a => a.id === strongest.attributeId)?.name ?? strongest.attributeId : '—'
  const strongestBrand = strongest ? brands.find(b => b.id === strongest.brandId)?.name ?? '' : ''
  const activeAttributeCount = attributes.filter(a => a.active).length

  const brandPresences = brands.map(b => {
    const current = calculatePositioningPresence(b.id, intendedIds, currentScores.scores)
    const prev = calculatePositioningPresence(b.id, intendedIds, previousScores.scores)
    return { brand: b, current, previous: prev, delta: calculateDelta(current, prev) }
  })
  const topBrand = brandPresences.reduce((a, b) => a.delta > b.delta ? a : b)

  const hubspotCooc = coOccurrenceData['hubspot'] ?? []
  const topCooc = hubspotCooc.reduce((a, b) => a.frequency > b.frequency ? a : b, hubspotCooc[0])

  return (
    <div className="p-6 max-w-5xl">
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Tracked brands', value: brands.length.toString() },
          { label: 'Attributes tracked', value: activeAttributeCount.toString() },
          { label: 'Top brand', value: `${topBrand.brand.name}`, sub: `+${topBrand.delta}%` },
          { label: 'Strongest attribute', value: strongestAttrName, sub: `${strongestBrand} · ${strongest?.score}` },
        ].map(card => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{card.label}</p>
            <p className="text-lg font-medium text-foreground mt-0.5">{card.value}</p>
            {card.sub && <p className="text-[11px] text-muted-foreground">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Positioning presence by brand</h3>
          <button onClick={() => onNavigate('association-map')} className="text-[11px] text-primary hover:underline">
            View full map →
          </button>
        </div>
        <div className="space-y-2.5">
          {brandPresences.map(bp => {
            const dir = getDeltaDirection(bp.delta)
            const topAttr = (() => {
              let best = { id: '', score: 0 }
              for (const attrId of intendedIds) {
                const s = currentScores.scores[bp.brand.id]?.[attrId] ?? 0
                if (s > best.score) best = { id: attrId, score: s }
              }
              return attributes.find(a => a.id === best.id)?.name ?? '—'
            })()

            return (
              <div key={bp.brand.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-24">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bp.brand.color }} />
                  <span className="text-xs text-foreground">{bp.brand.name}</span>
                </div>
                <svg width="48" height="16" className="flex-shrink-0">
                  <line
                    x1="4" y1={16 - bp.previous * 0.14}
                    x2="44" y2={16 - bp.current * 0.14}
                    stroke={bp.brand.color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="44" cy={16 - bp.current * 0.14} r="2" fill={bp.brand.color} />
                </svg>
                <span className="text-sm font-medium text-foreground w-12">{bp.current}%</span>
                <span className={`text-[11px] w-12 ${dir === 'positive' ? 'text-primary' : dir === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {dir === 'positive' ? '↑' : dir === 'negative' ? '↓' : '·'} {Math.abs(bp.delta)}
                </span>
                <span className="text-[11px] text-muted-foreground">Top: {topAttr}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InsightCard
          title="Attribute scores"
          body={`Salesforce owns Enterprise ready at 95. HubSpot leads Ease of use at 85.`}
          onNavigate={() => onNavigate('attribute-scores')}
        />
        <InsightCard
          title="Co-occurrence"
          body={`HubSpot most co-occurs with ${topCooc?.entity ?? 'Salesforce'} (freq ${topCooc?.frequency ?? 79}).`}
          onNavigate={() => onNavigate('co-occurrence')}
        />
      </div>
    </div>
  )
}

function InsightCard({ title, body, onNavigate }: { title: string; body: string; onNavigate: () => void }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs font-medium text-foreground mb-1">{title}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{body}</p>
      <button onClick={onNavigate} className="text-[11px] text-primary hover:underline">View details →</button>
    </div>
  )
}
