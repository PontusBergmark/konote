export type PromptType = 'association_probe' | 'competitor_anchored'
export type CoOccurrenceType = 'Competitor' | 'Category' | 'Concept' | 'Sub-brand' | 'Partner'
export type Framing = 'Owned' | 'Compared' | 'Affiliated' | 'Emerging'
export type TermStrength = 'strong' | 'moderate' | 'weak'
export type ViewId = 'overview' | 'association-map' | 'attribute-scores' | 'co-occurrence' | 'positioning-probe' | 'prompts' | 'attributes' | 'settings'

export interface Brand {
  id: string
  name: string
  color: string
  isOwn: boolean
}

export interface Attribute {
  id: string
  name: string
  description: string
  active: boolean
  order: number
  isIntended: boolean
}

export interface Prompt {
  id: string
  text: string
  type: PromptType
  tags: string[]
  createdAt: string
}

export interface PeriodScore {
  period: 'current' | 'previous'
  scores: Record<string, Record<string, number>>
}

export interface CoOccurrenceEntry {
  entity: string
  type: CoOccurrenceType
  frequency: number
  framing: Framing
  delta: number
}

export interface PositioningProbeResult {
  id: string
  primaryBrand: string
  competitors: string[]
  uniqueToPrimary: Array<{ term: string; strength: TermStrength }>
  uniqueToCompetitors: Record<string, Array<{ term: string; strength: TermStrength }>>
  shared: Array<{ term: string; strength: TermStrength }>
  runDate: string
  model: string
}

export interface PlanTier {
  name: string
  price: number | null
  maxBrands: number
  maxPrompts: number
  models: string[]
  runsPerPrompt: number
  scansPerMonth: number
  positioningProbesPerMonth: number | 'unlimited'
}

export interface UsageState {
  scansUsed: number
  probesUsed: number
  currentTier: 'free' | 'starter' | 'pro'
}
