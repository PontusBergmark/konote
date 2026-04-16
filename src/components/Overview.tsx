import type { Brand, Attribute, ViewId } from '../types'
import { currentScores, previousScores } from '../data/scores'
import { coOccurrenceData } from '../data/cooccurrence'
import { calculateDelta, getDeltaDirection } from '../utils/scoring'

interface OverviewProps {
  brands: Brand[]
  selectedBrand: Brand
  attributes: Attribute[]
  onNavigate: (view: ViewId) => void
  onRunScan?: () => void
  isScanning?: boolean
  lastScannedAt?: Date | null
  hasScanned?: boolean
}

type ValidationStatus = 'strong' | 'moderate' | 'weak' | 'absent'

function getValidationStatus(score: number): ValidationStatus {
  if (score >= 65) return 'strong'
  if (score >= 40) return 'moderate'
  if (score >= 15) return 'weak'
  return 'absent'
}

function statusCopy(status: ValidationStatus, brand: string, attr: string): string {
  switch (status) {
    case 'strong': return `LLMs strongly associate ${brand} with ${attr.toLowerCase()}.`
    case 'moderate': return `LLMs moderately associate ${brand} with ${attr.toLowerCase()}.`
    case 'weak': return `LLMs weakly associate ${brand} with ${attr.toLowerCase()}.`
    case 'absent': return `LLMs are not associating ${brand} with ${attr.toLowerCase()}.`
  }
}

function statusLabel(status: ValidationStatus): string {
  return { strong: 'Strong', moderate: 'Moderate', weak: 'Weak', absent: 'Not associated' }[status]
}

function statusTone(status: ValidationStatus): string {
  switch (status) {
    case 'strong': return 'text-primary'
    case 'moderate': return 'text-foreground'
    case 'weak': return 'text-muted-foreground'
    case 'absent': return 'text-muted-foreground'
  }
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

type Freshness = 'fresh' | 'aging' | 'stale'
function getFreshness(date: Date): Freshness {
  const hours = (Date.now() - date.getTime()) / 3_600_000
  if (hours < 24) return 'fresh'
  if (hours < 24 * 7) return 'aging'
  return 'stale'
}
function freshnessTone(f: Freshness): { dot: string; text: string; label: string } {
  switch (f) {
    case 'fresh': return { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Fresh' }
    case 'aging': return { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Aging' }
    case 'stale': return { dot: 'bg-destructive', text: 'text-destructive', label: 'Stale' }
  }
}

// Heuristic: map co-occurrence entity type → likely surfacing prompt type
function promptTypeForEntity(type: string): { label: string; tone: string } {
  switch (type) {
    case 'Category': return { label: 'category', tone: 'text-foreground' }
    case 'Competitor': return { label: 'competitor', tone: 'text-foreground' }
    default: return { label: 'brand', tone: 'text-muted-foreground' }
  }
}

export function Overview({
  brands,
  selectedBrand,
  attributes,
  onNavigate,
  onRunScan,
  isScanning,
  lastScannedAt,
  hasScanned = true,
}: OverviewProps) {
  const activeAttrs = attributes.filter(a => a.active)
  const intendedAttrs = activeAttrs.filter(a => a.isIntended)
  const brandScores = currentScores.scores[selectedBrand.id] ?? {}
  const prevBrandScores = previousScores.scores[selectedBrand.id] ?? {}

  // ---- Empty state: no scan yet ----
  if (!hasScanned) {
    return (
      <div className="p-6 max-w-3xl">
        <p className="text-xs text-muted-foreground mb-1">{selectedBrand.name}</p>
        <h1 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
          See what concepts LLMs associate with your brand — and whether they match your positioning.
        </h1>
        <div className="bg-card border border-border rounded-lg p-8 mt-6 text-center">
          <p className="text-sm text-foreground mb-1">No scan data yet.</p>
          <p className="text-xs text-muted-foreground mb-5">
            Run a scan to see what LLMs are associating with {selectedBrand.name}.
          </p>
          {onRunScan && (
            <button
              onClick={onRunScan}
              disabled={isScanning}
              className="px-4 py-2 rounded-md text-xs font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#6C3EF4' }}
            >
              {isScanning ? 'Scanning…' : 'Run first scan ↗'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ---- Discovered associations: from co-occurrence (Concepts + Categories), excluding ones that match intended attribute names ----
  const intendedNames = new Set(intendedAttrs.map(a => a.name.toLowerCase()))
  const coData = coOccurrenceData[selectedBrand.id] ?? []
  const discovered = coData
    .filter(c => (c.type === 'Concept' || c.type === 'Category') && c.frequency >= 35)
    .filter(c => !intendedNames.has(c.entity.toLowerCase()))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5)

  // Top associations overall (intended + discovered, ranked) — leading "LLMs associate X with:"
  const topAssociations: Array<{ label: string; score: number; intended: boolean }> = [
    ...intendedAttrs.map(a => ({
      label: a.name,
      score: brandScores[a.id] ?? 0,
      intended: true,
    })),
    ...discovered.map(d => ({ label: d.entity, score: d.frequency, intended: false })),
  ]
    .filter(a => a.score >= 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // Per-intended attribute validation
  const intendedResults = intendedAttrs.map(a => {
    const current = brandScores[a.id] ?? 0
    const previous = prevBrandScores[a.id] ?? 0
    const delta = calculateDelta(current, previous)
    return { attr: a, current, previous, delta, status: getValidationStatus(current) }
  })

  const landingCount = intendedResults.filter(r => r.status === 'strong' || r.status === 'moderate').length
  const strongest = intendedResults.length > 0
    ? intendedResults.reduce((a, b) => (a.current >= b.current ? a : b))
    : null
  const biggestGap = intendedResults.length > 0
    ? intendedResults.reduce((a, b) => (a.current <= b.current ? a : b))
    : null

  const competitors = brands.filter(b => b.id !== selectedBrand.id)
  const showComparison = competitors.length > 0

  return (
    <div className="p-6 max-w-4xl">
      {/* Persistent framing */}
      <p className="text-xs text-muted-foreground mb-1">{selectedBrand.name}</p>
      <h1 className="text-base font-medium text-foreground mb-1 tracking-tight">
        See what concepts LLMs associate with your brand — and whether they match your positioning.
      </h1>
      <div className="flex items-center gap-2 mb-5 text-[11px] text-muted-foreground">
        {lastScannedAt && (() => {
          const f = getFreshness(lastScannedAt)
          const tone = freshnessTone(f)
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border bg-card">
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
              <span className={tone.text}>{tone.label}</span>
              <span className="text-muted-foreground">· scanned {relativeTime(lastScannedAt)}</span>
            </span>
          )
        })()}
        {onRunScan && (
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="font-medium hover:underline disabled:opacity-50"
            style={{ color: '#6C3EF4' }}
          >
            {isScanning ? 'Scanning…' : 'Re-run scan ↗'}
          </button>
        )}
      </div>

      {/* HERO: ranked associations */}
      <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
        {topAssociations.length === 0 ? (
          <div className="p-6">
            <p className="text-xs text-muted-foreground mb-2">LLMs associate {selectedBrand.name} with</p>
            <p className="text-sm text-muted-foreground">No meaningful associations surfaced yet. Try running a scan with more prompts.</p>
          </div>
        ) : (
          <>
            {/* #1 — dominant */}
            <div className="px-6 pt-6 pb-5 border-b border-border">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                LLMs associate {selectedBrand.name} most with
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className={`text-3xl font-semibold tracking-tight ${topAssociations[0].intended ? 'text-primary' : 'text-foreground'}`}>
                  {topAssociations[0].label}
                </h2>
                <span className="text-sm text-muted-foreground tabular-nums">{Math.round(topAssociations[0].score)}</span>
                {topAssociations[0].intended && (
                  <span className="text-[9px] uppercase tracking-wide text-primary border border-primary/40 px-1.5 py-0.5 rounded">
                    intended
                  </span>
                )}
              </div>
            </div>
            {/* Ranked rest */}
            <div className="divide-y divide-border">
              {topAssociations.slice(1).map((a, i) => {
                const pct = (a.score / topAssociations[0].score) * 100
                return (
                  <div key={`${a.label}-${i}`} className="flex items-center gap-4 px-6 py-2.5">
                    <span className="text-[10px] text-muted-foreground tabular-nums w-4">{i + 2}</span>
                    <span className={`text-sm w-40 truncate ${a.intended ? 'text-primary font-medium' : 'text-foreground'}`}>
                      {a.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: a.intended
                            ? selectedBrand.color
                            : `color-mix(in oklab, ${selectedBrand.color} 35%, transparent)`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                      {Math.round(a.score)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wide w-14 text-right text-primary">
                      {a.intended ? 'intended' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Headline cards — only what serves the core question */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Intended attributes landing</p>
          <p className="text-lg font-medium text-foreground mt-0.5">
            {landingCount} <span className="text-sm text-muted-foreground">of {intendedAttrs.length}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">Strongly or moderately associated</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Strongest association</p>
          <p className="text-lg font-medium text-foreground mt-0.5">{strongest?.attr.name ?? '—'}</p>
          <p className="text-[11px] text-muted-foreground">
            {strongest ? `${statusLabel(strongest.status)} · ${Math.round(strongest.current)}` : 'No data'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Biggest gap</p>
          <p className="text-lg font-medium text-foreground mt-0.5">{biggestGap?.attr.name ?? '—'}</p>
          <p className="text-[11px] text-muted-foreground">
            {biggestGap ? `${statusLabel(biggestGap.status)} · ${Math.round(biggestGap.current)}` : 'No data'}
          </p>
        </div>
      </div>

      {/* VALIDATE: intended attributes */}
      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-medium text-foreground">Are your intended associations landing?</h2>
          <button onClick={() => onNavigate('attributes')} className="text-[11px] text-primary hover:underline">
            Manage intended attributes →
          </button>
        </div>
        {intendedAttrs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-5 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              You haven't marked any attributes as intended yet. Mark the attributes you want {selectedBrand.name} to be known for.
            </p>
            <button
              onClick={() => onNavigate('attributes')}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Set intended attributes →
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {intendedResults.map(r => {
              const dir = getDeltaDirection(r.delta)
              return (
                <div key={r.attr.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground truncate">{r.attr.name}</span>
                      <span className="text-[9px] uppercase tracking-wide text-primary border border-primary/40 px-1.5 py-0.5 rounded">
                        intended
                      </span>
                    </div>
                    <p className={`text-[11px] ${statusTone(r.status)}`}>
                      {statusCopy(r.status, selectedBrand.name, r.attr.name)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${r.current}%`, backgroundColor: selectedBrand.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground w-8 text-right tabular-nums">
                      {Math.round(r.current)}
                    </span>
                    <span className={`text-[11px] w-10 text-right tabular-nums ${
                      dir === 'positive' ? 'text-primary' : dir === 'negative' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {dir === 'positive' ? '↑' : dir === 'negative' ? '↓' : '·'} {Math.abs(r.delta)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {intendedResults.some(r => r.status === 'weak' || r.status === 'absent') && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Gaps are signals, not failures. {' '}
            <button onClick={() => onNavigate('prompts')} className="text-primary hover:underline">
              Review your prompts →
            </button>
          </p>
        )}
      </section>

      {/* DISCOVER: also associated with */}
      {discovered.length > 0 && (
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium text-foreground">Also associated with</h2>
            <button onClick={() => onNavigate('co-occurrence')} className="text-[11px] text-primary hover:underline">
              See all co-occurrences →
            </button>
          </div>
          <div className="bg-card border border-dashed border-border rounded-lg p-4">
            <p className="text-[11px] text-muted-foreground mb-3">
              Concepts LLMs surfaced that you didn't claim. Signals worth a look — not failures.
            </p>
            <div className="flex flex-wrap gap-2">
              {discovered.map(d => (
                <span
                  key={d.entity}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border bg-background text-foreground"
                >
                  <span className="font-medium">{d.entity}</span>
                  <span className="text-[10px] text-muted-foreground">{d.type.toLowerCase()}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{d.frequency}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comparison — only when there are competitors */}
      {showComparison && (
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium text-foreground">How {selectedBrand.name} compares</h2>
            <button onClick={() => onNavigate('association-map')} className="text-[11px] text-primary hover:underline">
              View full map →
            </button>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-[11px] text-muted-foreground mb-3">
              Average score across {selectedBrand.name}'s intended attributes.
            </p>
            <div className="space-y-1.5">
              {brands.map(b => {
                const bScores = currentScores.scores[b.id] ?? {}
                const intendedIds = intendedAttrs.map(a => a.id)
                const avg = intendedIds.length > 0
                  ? intendedIds.reduce((acc, id) => acc + (bScores[id] ?? 0), 0) / intendedIds.length
                  : 0
                const isSelected = b.id === selectedBrand.id
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-md ${isSelected ? 'bg-primary/8' : ''}`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                    <span className={`text-xs w-32 truncate ${isSelected ? 'font-medium' : ''}`}>{b.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${avg}%`, backgroundColor: b.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground w-10 text-right tabular-nums">
                      {Math.round(avg)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Methodology note */}
      <p className="text-[11px] text-muted-foreground">
        How this is gathered: we run category prompts ("best CRM for SMEs"), brand prompts ("what is {selectedBrand.name} known for"),
        and competitor-anchored prompts ("alternatives to …") across ChatGPT, Claude and Gemini, then measure how often each concept
        appears in the responses.
      </p>
    </div>
  )
}
