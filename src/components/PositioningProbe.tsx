import { useState } from 'react'
import type { Brand } from '../types'
import { positioningProbeResults } from '../data/positioning'
import { AssociationPill } from './AssociationPill'
import { brands as allBrands } from '../data/brands'

interface PositioningProbeProps {
  brands: Brand[]
  onAddAttribute: (name: string) => void
}

export function PositioningProbe({ brands, onAddAttribute }: PositioningProbeProps) {
  const [primaryBrandId, setPrimaryBrandId] = useState('hubspot')
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>(['salesforce', 'attio', 'zoho', 'pipedrive'])
  const [selectedModel, setSelectedModel] = useState('All')
  const [showResults, setShowResults] = useState(true)

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
              {['ChatGPT', 'Claude', 'Gemini', 'All'].map(m => (
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

        {/* Probe template */}
        <div className="text-[11px] font-mono text-muted-foreground bg-secondary p-2.5 rounded leading-relaxed">
          For each of the following brands — {primaryBrand.name} vs {selectedCompetitors.map(id => brands.find(b => b.id === id)?.name).filter(Boolean).join(', ')} — identify: (1) associations unique to {primaryBrand.name} that do not apply to the others, (2) associations unique to each competitor, (3) associations shared across all. Base your answer only on how these brands are commonly described and perceived. Return structured JSON with keys: uniqueToPrimary (array), uniqueToCompetitors (object keyed by brand), shared (array). For each term include a strength field: strong, moderate, or weak based on how consistently and prominently this association appears.
        </div>

        <button
          onClick={() => setShowResults(true)}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium"
        >
          Run probe ↗
        </button>
      </div>

      {/* Results */}
      {showResults && result && (
        <div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${2 + selectedCompetitors.length}, 1fr)` }}>
            {/* Unique to primary */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 text-[11px] font-medium text-primary-foreground" style={{ backgroundColor: 'var(--color-primary)' }}>
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
                  <div className="px-3 py-2 text-[11px] font-medium" style={{ backgroundColor: comp.color, color: 'white' }}>
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
