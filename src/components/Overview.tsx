import { useState } from 'react'
import type { Brand, Attribute, ViewId } from '../types'
import type { ScanExcerpts } from '../utils/scan.server'
import { currentScores } from '../data/scores'
import { coOccurrenceData } from '../data/cooccurrence'
import { ShareSnapshot } from './ShareSnapshot'

interface OverviewProps {
  brands: Brand[]
  selectedBrand: Brand
  attributes: Attribute[]
  scores?: Record<string, Record<string, number>>
  excerpts?: ScanExcerpts
  onNavigate: (view: ViewId) => void
  onRunScan?: () => void
  isScanning?: boolean
  lastScannedAt?: Date | null
  hasScanned?: boolean
  onPromoteToIntended?: (name: string) => void
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

function renderExcerpt(text: string, highlight: string) {
  if (!highlight) return text
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'i'))
  return parts.map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase()
      ? <strong key={i} className="font-semibold text-foreground">{part}</strong>
      : <span key={i}>{part}</span>
  )
}
export function Overview({
  brands,
  selectedBrand,
  attributes,
  scores = currentScores.scores,
  excerpts,
  onNavigate,
  onRunScan,
  isScanning,
  lastScannedAt,
  hasScanned = true,
  onPromoteToIntended,
}: OverviewProps) {
  const activeAttrs = attributes.filter(a => a.active)
  const [showSnapshot, setShowSnapshot] = useState(false)
  const intendedAttrs = activeAttrs.filter(a => a.isIntended)
  const brandScores = scores[selectedBrand.id] ?? {}
  const brandExcerpts = excerpts?.[selectedBrand.id] ?? {}

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
    return { attr: a, current, status: getValidationStatus(current) }
  })

  const landingCount = intendedResults.filter(r => r.status === 'strong' || r.status === 'moderate').length
  const biggestGap = [...intendedResults].sort((a, b) => a.current - b.current)[0] ?? null

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
        <button
          onClick={() => setShowSnapshot(true)}
          className="ml-auto px-2.5 py-1 text-[11px] font-medium border border-border rounded-md text-foreground hover:bg-accent transition-colors"
        >
          Share snapshot ↗
        </button>
      </div>

      {showSnapshot && (
        <ShareSnapshot
          brand={selectedBrand}
          scannedAt={lastScannedAt ?? null}
          topAssociations={[
            ...intendedAttrs.map(a => ({ label: a.name, score: brandScores[a.id] ?? 0, intended: true })),
            ...discovered.map(d => ({ label: d.entity, score: d.frequency, intended: false })),
          ].sort((a, b) => b.score - a.score).slice(0, 5)}
          intendedLanding={{ landing: landingCount, total: intendedAttrs.length }}
          biggestGap={biggestGap ? { name: biggestGap.attr.name, score: biggestGap.current } : null}
          onClose={() => setShowSnapshot(false)}
        />
      )}

      {/* HERO: ranked associations */}
      <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
        {topAssociations.length === 0 ? (
          <div className="p-6">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
              LLMs associate {selectedBrand.name} with
            </p>
            <p className="text-sm text-foreground mb-1">Not enough signal yet.</p>
            <p className="text-xs text-muted-foreground mb-3">
              No concept passed the threshold. This usually means too few prompts, or prompts that don't surface {selectedBrand.name} naturally.
            </p>
            <button
              onClick={() => onNavigate('prompts')}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Add more prompts →
            </button>
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
                const alreadyTracked = attributes.some(
                  attr => attr.name.toLowerCase() === a.label.toLowerCase() && attr.isIntended
                )
                return (
                  <div key={`${a.label}-${i}`} className="flex items-center gap-4 px-6 py-2.5">
                    <span className="text-[10px] text-muted-foreground tabular-nums w-4">{i + 2}</span>
                    <span className={`text-sm w-40 truncate ${a.intended ? 'text-primary font-medium' : 'text-foreground'}`}>
                      {a.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: selectedBrand.color, opacity: a.intended ? 1 : 0.35 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                      {Math.round(a.score)}
                    </span>
                    <div className="w-20 flex justify-end">
                      {a.intended ? (
                        <span className="text-[9px] uppercase tracking-wide text-primary">intended</span>
                      ) : alreadyTracked ? (
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">tracked</span>
                      ) : onPromoteToIntended ? (
                        <button
                          onClick={() => onPromoteToIntended(a.label)}
                          title={`Track "${a.label}" as intended`}
                          className="text-[10px] font-medium text-primary border border-primary/40 rounded-full px-2 py-0.5 hover:bg-primary/10 transition-colors"
                        >
                          + track
                        </button>
                      ) : null}
                    </div>
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Concepts surfaced</p>
          <p className="text-lg font-medium text-foreground mt-0.5">
            {topAssociations.length + Math.max(0, discovered.length - topAssociations.filter(a => !a.intended).length)}
            <span className="text-sm text-muted-foreground"> this scan</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{discovered.length} not in your intended set</p>
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
        ) : (() => {
          // Coverage rule: only show excerpts if every intended attr with score > 20 has one.
          // Additional relevance guard: excerpt must mention primary brand AND the highlight keyword.
          const brandLower = selectedBrand.name.toLowerCase()
          const isRelevant = (ex: { text: string; highlight: string } | undefined) => {
            if (!ex) return false
            const t = ex.text.toLowerCase()
            return t.includes(brandLower) && (!ex.highlight || t.includes(ex.highlight.toLowerCase()))
          }
          const requiring = intendedResults.filter(r => r.current > 20)
          const allCovered = requiring.length > 0 && requiring.every(r => isRelevant(brandExcerpts[r.attr.id]?.[0]))
          return (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {intendedResults.map(r => {
              const attrExcerpts = brandExcerpts[r.attr.id] ?? []
              const candidate = attrExcerpts[0]
              const example = allCovered && r.current > 20 && isRelevant(candidate) ? candidate : null
              return (
                <div key={r.attr.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
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
                      {r.current <= 0 ? (
                        <button
                          onClick={() => onNavigate('prompts')}
                          className="w-24 h-1.5 rounded-full border border-dashed border-border flex items-center justify-center text-[9px] uppercase tracking-wide text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          title="Not yet associated — review your prompts"
                        >
                          no signal
                        </button>
                      ) : (
                        <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${r.current}%`, backgroundColor: selectedBrand.color }}
                          />
                        </div>
                      )}
                      <span className="text-xs font-medium text-foreground w-8 text-right tabular-nums">
                        {Math.round(r.current)}
                      </span>
                    </div>
                  </div>
                  {example && (
                    <div className="mt-2.5 pl-3 border-l-2 border-primary/30">
                      <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">
                        Example response · {example.model}
                      </p>
                      <p className="text-[11px] text-foreground/85 leading-relaxed italic">
                        "{renderExcerpt(example.text, example.highlight)}"
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        Prompt: {example.prompt}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          )
        })()}
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
              Concepts LLMs surfaced that you didn't claim. Track any of these as intended to validate them on every scan.
            </p>
            <div className="flex flex-wrap gap-2">
              {discovered.map(d => {
                const pt = promptTypeForEntity(d.type)
                const alreadyTracked = attributes.some(a => a.name.toLowerCase() === d.entity.toLowerCase() && a.isIntended)
                return (
                  <span
                    key={d.entity}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-xs border border-border bg-background text-foreground"
                  >
                    <span className="font-medium">{d.entity}</span>
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1 py-px">
                      {pt.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{d.frequency}</span>
                    {onPromoteToIntended && (
                      alreadyTracked ? (
                        <span className="text-[9px] uppercase tracking-wide text-primary px-1.5 py-0.5 rounded ml-0.5">
                          tracked
                        </span>
                      ) : (
                        <button
                          onClick={() => onPromoteToIntended(d.entity)}
                          title={`Track "${d.entity}" as intended`}
                          className="ml-0.5 text-[10px] font-medium text-primary border border-primary/40 rounded-full px-1.5 py-0.5 hover:bg-primary/10 transition-colors"
                        >
                          + track
                        </button>
                      )
                    )}
                  </span>
                )
              })}
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
                const bScores = scores[b.id] ?? {}
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
        How this is gathered: we run category prompts, brand prompts, and competitor-anchored prompts across ChatGPT and Claude,
        then measure how often each concept appears in the responses.
      </p>
    </div>
  )
}
