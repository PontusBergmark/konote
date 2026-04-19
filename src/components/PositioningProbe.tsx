import { useState } from 'react'
import type { Brand } from '../types'
import { positioningProbeResults } from '../data/positioning'
import { AssociationPill } from './AssociationPill'
import { ScanProgressBar } from './ScanProgressBar'

interface PositioningProbeProps {
  brands: Brand[]
  onAddAttribute: (name: string) => void
}

const PROBE_DURATION_MS = 8000

export function PositioningProbe({ brands, onAddAttribute }: PositioningProbeProps) {
  const [primaryBrandId, setPrimaryBrandId] = useState(brands[0]?.id ?? '')
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>(
    brands.filter(b => b.id !== (brands[0]?.id ?? '')).map(b => b.id)
  )
  const [selectedModel, setSelectedModel] = useState('All')
  const [showResults, setShowResults] = useState(true)
  const [isProbing, setIsProbing] = useState(false)

  const handleRunProbe = () => {
    if (isProbing) return
    setShowResults(false)
    setIsProbing(true)
    setTimeout(() => {
      setIsProbing(false)
      setShowResults(true)
    }, PROBE_DURATION_MS)
  }

  const primaryBrand = brands.find(b => b.id === primaryBrandId) ?? brands[0]
  const availableCompetitors = brands.filter(b => b.id !== primaryBrandId)

  const result = positioningProbeResults[0]

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

  return (
    <div className="p-6 max-w-6xl">
      <h2 className="text-sm font-medium text-foreground mb-4">Positioning probe</h2>

      {/* Configuration */}
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
              {['ChatGPT', 'Claude', 'All'].map(m => (
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

        {/* Explanatory text — replaces the old prompt template block */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          We'll ask ChatGPT and Claude what makes{' '}
          <span className="font-medium text-foreground">{primaryBrand?.name ?? 'your brand'}</span>{' '}
          distinct from{' '}
          <span className="font-medium text-foreground">{competitorNames || 'selected competitors'}</span>{' '}
          — based only on how these brands are described and perceived.
        </p>

        <button
          onClick={handleRunProbe}
          disabled={isProbing}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium disabled:opacity-50"
        >
          {isProbing ? 'Probing…' : 'Run probe ↗'}
        </button>
      </div>

      <ScanProgressBar isScanning={isProbing} durationMs={PROBE_DURATION_MS} />

      {/* Results */}
      {showResults && result && (
        <div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${2 + selectedCompetitors.length}, 1fr)` }}>
            {/* Unique to primary */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div
                className="px-3 py-2 text-[11px] font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--color-primary) 10%, transparent)`,
                  color: 'var(--color-primary)',
                }}
              >
                Unique to {primaryBrand.name}
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {result.uniqueToPrimary.map(t => (
                  <AssociationPill
                    key={t.term}
                    term={t.term}
                    strength={t.strength}
                    color="var(--color-primary)"
                    bgColor="var(--cep-confirmed-bg)"
                    onAdd={() => onAddAttribute(t.term)}
                    frequencyBadge={getStrengthBadge(t.strength)}
                  />
                ))}
              </div>
            </div>

            {/* Competitor columns */}
            {selectedCompetitors.map(compId => {
              const comp = brands.find(b => b.id === compId)
              if (!comp) return null
              const terms = result.uniqueToCompetitors[compId] ?? []
              return (
                <div key={compId} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div
                    className="px-3 py-2 text-[11px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${comp.color} 10%, transparent)`,
                      color: comp.color,
                    }}
                  >
                    Unique to {comp.name}
                  </div>
                  <div className="p-3 flex flex-wrap gap-1.5">
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
            })}

            {/* Shared */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 text-[11px] font-medium bg-secondary text-secondary-foreground">
                Shared
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
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

          {/* Auto-generated insight */}
          <div className="mt-4 bg-card border border-border rounded-lg p-4">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{primaryBrand.name}</span>'s LLM-encoded differentiation centres on{' '}
              <span className="font-medium">{result.uniqueToPrimary.filter(t => t.strength === 'strong').slice(0, 3).map(t => t.term).join(', ')}</span>.{' '}
              {selectedCompetitors.slice(0, 2).map(compId => {
                const comp = brands.find(b => b.id === compId)
                const terms = result.uniqueToCompetitors[compId]?.filter(t => t.strength === 'strong').slice(0, 3).map(t => t.term).join(', ')
                return comp && terms ? `${comp.name}'s unique territory is ${terms}. ` : ''
              }).join('')}
              Shared space — {result.shared.filter(t => t.strength === 'strong').map(t => t.term).join(', ')} — represents category parity, not differentiation.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
