import type { PositioningProbeResult } from '../types'

export const positioningProbeResults: PositioningProbeResult[] = [
  {
    id: 'probe-1',
    primaryBrand: 'hubspot',
    competitors: ['salesforce', 'attio', 'zoho', 'pipedrive'],
    uniqueToPrimary: [
      { term: 'inbound marketing', strength: 'strong' },
      { term: 'all-in-one platform', strength: 'strong' },
      { term: 'ease of onboarding', strength: 'strong' },
      { term: 'free tier', strength: 'strong' },
      { term: 'SMB-friendly', strength: 'strong' },
      { term: 'content marketing', strength: 'moderate' },
      { term: 'marketing automation leader', strength: 'moderate' },
      { term: 'enterprise limitations', strength: 'weak' },
    ],
    uniqueToCompetitors: {
      salesforce: [
        { term: 'enterprise scale', strength: 'strong' },
        { term: 'AppExchange ecosystem', strength: 'strong' },
        { term: 'customisation depth', strength: 'strong' },
        { term: 'market leader', strength: 'strong' },
        { term: 'implementation complexity', strength: 'moderate' },
        { term: 'consulting ecosystem', strength: 'moderate' },
        { term: 'expensive', strength: 'weak' },
      ],
      attio: [
        { term: 'modern UI', strength: 'strong' },
        { term: 'relationship intelligence', strength: 'strong' },
        { term: 'flexible data model', strength: 'strong' },
        { term: 'startup-focused', strength: 'moderate' },
        { term: 'API-first', strength: 'moderate' },
        { term: 'newer entrant', strength: 'weak' },
      ],
      zoho: [
        { term: 'value for money', strength: 'strong' },
        { term: 'suite breadth', strength: 'strong' },
        { term: 'small business', strength: 'strong' },
        { term: 'Google Workspace integration', strength: 'moderate' },
        { term: 'less prestigious', strength: 'weak' },
      ],
      pipedrive: [
        { term: 'visual pipeline', strength: 'strong' },
        { term: 'sales-first design', strength: 'strong' },
        { term: 'simplicity', strength: 'strong' },
        { term: 'SMB focus', strength: 'moderate' },
        { term: 'limited marketing features', strength: 'weak' },
      ],
    },
    shared: [
      { term: 'CRM', strength: 'strong' },
      { term: 'contact management', strength: 'strong' },
      { term: 'sales tracking', strength: 'strong' },
      { term: 'integrations', strength: 'moderate' },
      { term: 'reporting', strength: 'moderate' },
      { term: 'mobile app', strength: 'moderate' },
    ],
    runDate: '2024-11-10',
    model: 'All',
  },
]
