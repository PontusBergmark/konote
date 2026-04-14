import type { Brand, Attribute } from '../types'
import { currentScores, previousScores } from '../data/scores'
import { calculatePositioningPresence, calculateDelta, getDeltaDirection } from '../utils/scoring'
import type { ViewId } from '../types'

interface OverviewProps {
  brands: Brand[]
  selectedBrand: Brand
  attributes: Attribute[]
  onNavigate: (view: ViewId) => void
  onRunScan?: () => void
  isScanning?: boolean
}

export function Overview({ brands, selectedBrand, attributes, onNavigate, onRunScan, isScanning }: OverviewProps) {
  const activeAttrs = attributes.filter(a => a.active)
  const intendedIds = activeAttrs.filter(a => a.isIntended).map(a => a.id)

  // Selected brand data
  const brandScores = currentScores.scores[selectedBrand.id] ?? {}
  const prevBrandScores = previousScores.scores[selectedBrand.id] ?? {}
  const presence = calculatePositioningPresence(selectedBrand.id, intendedIds, currentScores.scores)
  const prevPresence = calculatePositioningPresence(selectedBrand.id, intendedIds, previousScores.scores)
  const presenceDelta = calculateDelta(presence, prevPresence)
  const presenceDir = getDeltaDirection(presenceDelta)

  // Per-attribute scores for selected brand
  const attrScores = activeAttrs.map(a => ({
    attr: a,
    current: brandScores[a.id] ?? 0,
    previous: prevBrandScores[a.id] ?? 0,
    delta: (brandScores[a.id] ?? 0) - (prevBrandScores[a.id] ?? 0),
  }))

  const strongest = attrScores.reduce((a, b) => a.current > b.current ? a : b, attrScores[0])
  const weakest = attrScores.reduce((a, b) => a.current < b.current ? a : b, attrScores[0])
  const biggestGain = attrScores.reduce((a, b) => a.delta > b.delta ? a : b, attrScores[0])
  const biggestGap = (() => {
    let worst = { attr: activeAttrs[0], gap: 0 }
    for (const a of activeAttrs) {
      const myScore = brandScores[a.id] ?? 0
      const bestCompetitor = Math.max(
        ...brands.filter(b => b.id !== selectedBrand.id).map(b => currentScores.scores[b.id]?.[a.id] ?? 0)
      )
      const gap = bestCompetitor - myScore
      if (gap > worst.gap) worst = { attr: a, gap }
    }
    return worst
  })()

  // All brand presences for comparison table
  const brandPresences = brands.map(b => {
    const current = calculatePositioningPresence(b.id, intendedIds, currentScores.scores)
    const prev = calculatePositioningPresence(b.id, intendedIds, previousScores.scores)
    return { brand: b, current, previous: prev, delta: calculateDelta(current, prev) }
  })

  return (
    <div className="p-6 max-w-5xl">
      {/* Hero: selected brand positioning presence */}
      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedBrand.color }} />
          <h2 className="text-sm font-medium text-foreground">{selectedBrand.name}</h2>
          {onRunScan && (
            <button
              onClick={onRunScan}
              disabled={isScanning}
              className="ml-auto text-[11px] font-medium hover:underline disabled:opacity-50"
              style={{ color: '#6C3EF4' }}
            >
              {isScanning ? 'Scanning…' : 'Run scan →'}
            </button>
          )}
        </div>

        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-semibold text-foreground tracking-tight">{presence}%</span>
          <span className={`text-sm font-medium mb-1 ${
            presenceDir === 'positive' ? 'text-primary' : presenceDir === 'negative' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {presenceDir === 'positive' ? '↑' : presenceDir === 'negative' ? '↓' : '·'} {Math.abs(presenceDelta)}
          </span>
          <span className="text-xs text-muted-foreground mb-1.5">positioning presence</span>
        </div>

        {/* Attribute score bars */}
        {attrScores.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
            {attrScores.slice(0, 6).map(as => (
              <div key={as.attr.id} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-28 truncate">{as.attr.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${as.current}%`, backgroundColor: selectedBrand.color }}
                  />
                </div>
                <span className="text-[11px] font-medium text-foreground w-7 text-right">{as.current}</span>
              </div>
            ))}
          </div>
        )}

        {/* Insight line */}
        {strongest && weakest && (
          <p className="text-[11px] text-muted-foreground">
            Strongest: <span className="font-medium text-foreground">{strongest.attr.name}</span> ({strongest.current})
            {' · '}Weakest: <span className="font-medium text-foreground">{weakest.attr.name}</span> ({weakest.current})
            {' · '}
            <span className={presenceDir === 'positive' ? 'text-primary' : presenceDir === 'negative' ? 'text-destructive' : ''}>
              {presenceDir === 'positive' ? '+' : ''}{presenceDelta} vs last period
            </span>
          </p>
        )}
      </div>

      {/* Brand-specific metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Positioning presence</p>
          <p className="text-lg font-medium text-foreground mt-0.5">{presence}%</p>
          <p className={`text-[11px] ${presenceDir === 'positive' ? 'text-primary' : presenceDir === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {presenceDir === 'positive' ? '↑' : presenceDir === 'negative' ? '↓' : '·'} {Math.abs(presenceDelta)} vs prev
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Top attribute</p>
          <p className="text-lg font-medium text-foreground mt-0.5">{strongest?.attr.name ?? '—'}</p>
          <p className="text-[11px] text-muted-foreground">Score: {strongest?.current ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Biggest gain</p>
          <p className="text-lg font-medium text-foreground mt-0.5">{biggestGain?.attr.name ?? '—'}</p>
          <p className="text-[11px] text-primary">+{Math.max(biggestGain?.delta ?? 0, 0)} this period</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Biggest gap</p>
          <p className="text-lg font-medium text-foreground mt-0.5">{biggestGap?.attr.name ?? '—'}</p>
          <p className="text-[11px] text-destructive">-{biggestGap?.gap ?? 0} behind leader</p>
        </div>
      </div>

      {/* Competitive comparison table */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">How {selectedBrand.name} compares</h3>
          <button onClick={() => onNavigate('association-map')} className="text-[11px] text-primary hover:underline">
            View full map →
          </button>
        </div>
        <div className="space-y-2">
          {brandPresences.map(bp => {
            const dir = getDeltaDirection(bp.delta)
            const isSelected = bp.brand.id === selectedBrand.id
            const topAttr = (() => {
              let best = { id: '', score: 0 }
              for (const attrId of intendedIds) {
                const s = currentScores.scores[bp.brand.id]?.[attrId] ?? 0
                if (s > best.score) best = { id: attrId, score: s }
              }
              return attributes.find(a => a.id === best.id)?.name ?? '—'
            })()

            return (
              <div
                key={bp.brand.id}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-md ${isSelected ? 'bg-primary/8' : ''}`}
              >
                <div className="flex items-center gap-2 w-24">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bp.brand.color }} />
                  <span className={`text-xs ${isSelected ? 'font-medium text-foreground' : 'text-foreground'}`}>{bp.brand.name}</span>
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

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-3">
        <InsightCard
          title="Attribute scores"
          body={`${selectedBrand.name} leads in ${strongest?.attr.name ?? '—'} at ${strongest?.current ?? 0}. Weakest area: ${weakest?.attr.name ?? '—'} at ${weakest?.current ?? 0}.`}
          onNavigate={() => onNavigate('attribute-scores')}
        />
        <InsightCard
          title="Co-occurrence"
          body={`See which entities LLMs most frequently mention alongside ${selectedBrand.name}.`}
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
