import type { Brand, Attribute, Prompt, ViewId } from '../types'
import { currentScores } from '../data/scores'
import { calculatePositioningPresence, getStrongestAttribute } from '../utils/scoring'
import { brands } from '../data/brands'

interface SummaryBarProps {
  selectedBrand: Brand
  attributes: Attribute[]
  prompts: Prompt[]
  currentView: ViewId
}

const VIEW_INSIGHTS: Record<ViewId, (brand: Brand) => string> = {
  overview: (b) => `${b.name}'s LLM perception at a glance — how well does positioning translate to model memory?`,
  'association-map': (b) => `Heat map of ${b.name}'s attribute scores across all tracked competitors`,
  'attribute-scores': () => `Share of voice breakdown — who owns each attribute in LLM memory?`,
  'entry-points': () => `Category entry points — the prompts where your brand should appear first`,
  'co-occurrence': (b) => `What entities appear alongside ${b.name} in LLM responses?`,
  'positioning-probe': () => `Head-to-head differentiation — what makes each brand unique in LLM memory?`,
  prompts: () => `Manage your prompt library — association probes, competitor-anchored, and entry points`,
  attributes: () => `Define the brand associations you intend to own and track`,
  settings: () => `Configure tracked brands and model preferences`,
}

export function SummaryBar({ selectedBrand, attributes, prompts, currentView }: SummaryBarProps) {
  const intendedIds = attributes.filter(a => a.isIntended && a.active).map(a => a.id)
  const presence = calculatePositioningPresence(selectedBrand.id, intendedIds, currentScores.scores)
  const strongest = getStrongestAttribute(currentScores.scores)
  const confirmedCEPs = prompts.filter(p => p.cepStatus === 'confirmed_cep').length
  const totalCEPs = prompts.filter(p => p.type === 'entry_point').length

  const strongestName = strongest
    ? attributes.find(a => a.id === strongest.attributeId)?.name ?? strongest.attributeId
    : '—'
  
  const topBrandName = strongest
    ? brands.find(b => b.id === strongest.brandId)?.name ?? strongest.brandId
    : '—'

  const insight = VIEW_INSIGHTS[currentView]?.(selectedBrand) ?? ''

  return (
    <div className="h-9 min-h-[36px] border-b flex items-center justify-between px-4 bg-surface-elevated" style={{ borderBottomWidth: '0.5px' }}>
      <p className="text-[11px] text-muted-foreground truncate max-w-[50%]">{insight}</p>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground whitespace-nowrap">
        <span>
          Positioning presence: <span className="font-medium text-foreground">{presence}%</span>
        </span>
        <span>
          Top attribute: <span className="font-medium text-foreground">{strongestName}</span> ({topBrandName})
        </span>
        <span>
          Confirmed CEPs: <span className="font-medium text-foreground">{confirmedCEPs}/{totalCEPs}</span>
        </span>
      </div>
    </div>
  )
}
