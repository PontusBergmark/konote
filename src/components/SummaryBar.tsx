import type { Brand, Attribute, ViewId } from '../types'
import { currentScores } from '../data/scores'
import { calculatePositioningPresence, getStrongestAttribute } from '../utils/scoring'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface SummaryBarProps {
  selectedBrand: Brand
  attributes: Attribute[]
  currentView: ViewId
  scores?: Record<string, Record<string, number>>
}

const VIEW_INSIGHTS: Record<ViewId, (brand: Brand) => string> = {
  overview: (b) => `${b.name}'s LLM perception at a glance — how well does positioning translate to model memory?`,
  'association-map': (b) => `Heat map of ${b.name}'s attribute scores across all tracked competitors`,
  'attribute-scores': () => `Share of voice breakdown — who owns each attribute in LLM memory?`,
  'co-occurrence': (b) => `What entities appear alongside ${b.name} in LLM responses?`,
  'positioning-probe': () => `Head-to-head differentiation — what makes each brand unique in LLM memory?`,
  prompts: () => `Manage your prompt library — association probes and competitor-anchored prompts`,
  attributes: () => `Define the brand associations you intend to own and track`,
  settings: () => `Configure tracked brands and model preferences`,
}

export function SummaryBar({ selectedBrand, attributes, currentView, scores = currentScores.scores }: SummaryBarProps) {
  const intendedIds = attributes.filter(a => a.isIntended && a.active).map(a => a.id)
  const presence = calculatePositioningPresence(selectedBrand.id, intendedIds, scores)
  const strongest = getStrongestAttribute(scores)

  const strongestName = strongest
    ? attributes.find(a => a.id === strongest.attributeId)?.name ?? strongest.attributeId
    : '—'

  const insight = VIEW_INSIGHTS[currentView]?.(selectedBrand) ?? ''

  return (
    <div className="h-9 min-h-[36px] border-b flex items-center justify-between px-4 bg-surface-elevated" style={{ borderBottomWidth: '0.5px' }}>
      <p className="text-[11px] text-muted-foreground truncate max-w-[50%]">{insight}</p>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground whitespace-nowrap">
        <span className="inline-flex items-center gap-1">
          Positioning signal:
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="Positioning signal explanation"
                >
                  ℹ
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64 leading-relaxed">
                Average association strength across your intended attributes. Based on how consistently LLMs associate your brand with each attribute across this scan.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="font-medium text-foreground">{presence}%</span>
        </span>
        <span>
          Top attribute: <span className="font-medium text-foreground">{strongestName}</span>
        </span>
      </div>
    </div>
  )
}
