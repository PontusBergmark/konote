import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import type { Brand, Attribute } from '../types'
import { AssociationPill } from './AssociationPill'
import { ScanProgressBar } from './ScanProgressBar'
import { runPositioningProbe } from '../utils/probe.functions'
import type { ProbeResult, ProbeTerm } from '../utils/probe.server'

interface PositioningProbeProps {
  brands: Brand[]
  attributes: Attribute[]
  onAddAttribute: (name: string) => void
}

export function PositioningProbe({ brands, attributes, onAddAttribute }: PositioningProbeProps) {
  const [primaryBrandId, setPrimaryBrandId] = useState(brands[0]?.id ?? '')
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>(
    brands.filter(b => b.id !== (brands[0]?.id ?? '')).map(b => b.id)
  )
  const [selectedModel, setSelectedModel] = useState<'ChatGPT' | 'Claude' | 'All'>('All')
  const [isProbing, setIsProbing] = useState(false)
  const [result, setResult] = useState<ProbeResult | null>(null)

  const runProbeFn = useServerFn(runPositioningProbe)

  const primaryBrand = brands.find(b => b.id === primaryBrandId) ?? brands[0]
  const availableCompetitors = brands.filter(b => b.id !== primaryBrandId)

  const handleRunProbe = async () => {
    if (isProbing || !primaryBrand) return
    const competitorBrands = brands.filter(b => selectedCompetitors.includes(b.id))
    if (competitorBrands.length === 0) {
      toast.error('Select at least one competitor')
      return
    }
    setIsProbing(true)
    setResult(null)
    try {
      const data = await runProbeFn({
        data: {
          primaryBrand,
          competitors: competitorBrands,
          model: selectedModel,
        },
      })
      setResult(data)
      toast.success(`Probe complete — ${data.responses} responses across ${competitorBrands.length} competitor pair${competitorBrands.length === 1 ? '' : 's'}`)
    } catch (e) {
      console.error(e)
      toast.error('Probe failed. Check API keys and try again.')
    } finally {
      setIsProbing(false)
    }
  }

  const toggleCompetitor = (id: string) => {
    setSelectedCompetitors(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const getStrengthBadge = (strength: 'strong' | 'moderate' | 'weak') => {
    if (strength === 'strong') return undefined
    if (strength === 'moderate') return 4
    return 2
  }

  const competitorNames = selectedCompetitors
    .map(id => brands.find(b => b.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  const probeDurationMs = Math.max(8000, selectedCompetitors.length * (selectedModel === 'All' ? 18000 : 9000))

  return (
    <div className="p-6 max-w-6xl">
      <h2 className="text-sm font-medium text-foreground mb-1">Positioning probe</h2>
      <p className="text-xs text-muted-foreground mb-4 max-w-2xl leading-relaxed">
        See how LLMs actually position your brand against competitors — what they describe as uniquely yours, what they hand to rivals, and where you blend into the category.
      </p>

      <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Primary brand</label>
            <select
              value={primaryBrandId}
              onChange={e => setPrimaryBrandId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground"
            >
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Competitors (up to 5)</label>
            <div className="flex flex-wrap gap-1">
              {availableCompetitors.map(b => (
                <button
                  key={b.id}
                  onClick={() => toggleCompetitor(b.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    selectedCompetitors.includes(b.id)
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.name}
                  {selectedCompetitors.includes(b.id) && <span className="ml-0.5">×</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Model</label>
            <div className="flex gap-1">
              {(['ChatGPT', 'Claude', 'All'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    selectedModel === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          We'll ask {selectedModel === 'All' ? 'ChatGPT and Claude' : selectedModel} differentiation prompts comparing{' '}
          <span className="font-medium text-foreground">{primaryBrand?.name ?? 'your brand'}</span>{' '}
          against{' '}
          <span className="font-medium text-foreground">{competitorNames || 'selected competitors'}</span>{' '}
          — fresh API calls, not reused scan data.
        </p>

        <button
          onClick={handleRunProbe}
          disabled={isProbing}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium disabled:opacity-50"
        >
          {isProbing ? 'Probing…' : 'Run probe ↗'}
        </button>
      </div>

      <ScanProgressBar isScanning={isProbing} durationMs={probeDurationMs} />

      {!isProbing && !result && (
        <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted-foreground">Run a probe to see what makes {primaryBrand?.name ?? 'your brand'} distinct.</p>
        </div>
      )}

      {result && primaryBrand && (
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div
                className="px-4 py-2.5 text-[11px] font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--color-primary) 10%, transparent)`,
                  color: 'var(--color-primary)',
                }}
              >
                Unique to {primaryBrand.name}
              </div>
              <div className="p-5 flex flex-wrap gap-2.5">
                {result.uniqueToPrimary.length === 0 && (
                  <span className="text-[10px] text-muted-foreground italic">No distinct terms surfaced</span>
                )}
                {result.uniqueToPrimary.map((t: ProbeTerm) => {
                  const id = t.term.toLowerCase().replace(/\s+/g, '-')
                  const isAdded = attributes.some(a => a.id === id && a.isIntended)
                  return (
                    <AssociationPill
                      key={t.term}
                      term={t.term}
                      strength={t.strength}
                      color="var(--color-primary)"
                      bgColor="var(--cep-confirmed-bg)"
                      onAdd={() => onAddAttribute(t.term)}
                      frequencyBadge={getStrengthBadge(t.strength)}
                      added={isAdded}
                    />
                  )
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 text-[11px] font-medium bg-secondary text-secondary-foreground">
                Shared
              </div>
              <div className="p-5 flex flex-wrap gap-2.5">
                {result.shared.length === 0 && (
                  <span className="text-[10px] text-muted-foreground italic">—</span>
                )}
                {result.shared.map(t => (
                  <AssociationPill
                    key={t.term}
                    term={t.term}
                    strength={t.strength}
                    frequencyBadge={getStrengthBadge(t.strength)}
                  />
                ))}
              </div>
            </div>
          </div>

          {selectedCompetitors.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Competitor view</span>
                {selectedCompetitors.map(compId => {
                  const comp = brands.find(b => b.id === compId)
                  if (!comp) return null
                  const active = activeCompetitorId === compId
                  return (
                    <button
                      key={compId}
                      onClick={() => setActiveCompetitorId(compId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                        active ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: comp.color }} />
                      {comp.name}
                    </button>
                  )
                })}
              </div>
              {(() => {
                const activeId = activeCompetitorId && selectedCompetitors.includes(activeCompetitorId)
                  ? activeCompetitorId
                  : selectedCompetitors[0]
                const comp = brands.find(b => b.id === activeId)
                if (!comp) return null
                const terms = result.uniqueToCompetitors[comp.id] ?? []
                return (
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div
                      className="px-4 py-2.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${comp.color} 10%, transparent)`,
                        color: comp.color,
                      }}
                    >
                      Unique to {comp.name}
                    </div>
                    <div className="p-5 flex flex-wrap gap-2.5">
                      {terms.length === 0 && (
                        <span className="text-[10px] text-muted-foreground italic">—</span>
                      )}
                      {terms.map(t => (
                        <AssociationPill
                          key={t.term}
                          term={t.term}
                          strength={t.strength}
                          frequencyBadge={getStrengthBadge(t.strength)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="mt-4 bg-card border border-border rounded-lg p-4">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{primaryBrand.name}</span>'s LLM-encoded differentiation centres on{' '}
              <span className="font-medium">
                {result.uniqueToPrimary.filter(t => t.strength !== 'weak').slice(0, 3).map(t => t.term).join(', ') || '—'}
              </span>.{' '}
              Shared space — {result.shared.filter(t => t.strength !== 'weak').slice(0, 3).map(t => t.term).join(', ') || 'none surfaced'} — represents category parity, not differentiation.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
