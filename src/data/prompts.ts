import type { Prompt } from '../types'

export const prompts: Prompt[] = [
  { id: 'p1', text: "describe HubSpot's strengths as a CRM platform", type: 'association_probe', cepStatus: 'unvalidated', tags: ['hubspot'], createdAt: '2024-11-01' },
  { id: 'p2', text: 'what is Salesforce known for in enterprise sales', type: 'association_probe', cepStatus: 'unvalidated', tags: ['salesforce'], createdAt: '2024-11-01' },
  { id: 'p3', text: 'how would you describe Attio to someone unfamiliar with CRMs', type: 'association_probe', cepStatus: 'unvalidated', tags: ['attio'], createdAt: '2024-11-02' },
  { id: 'p4', text: 'what makes Zoho different from other CRM providers', type: 'association_probe', cepStatus: 'unvalidated', tags: ['zoho'], createdAt: '2024-11-02' },
  { id: 'p5', text: 'what kind of company uses Pipedrive', type: 'association_probe', cepStatus: 'unvalidated', tags: ['pipedrive'], createdAt: '2024-11-03' },
  { id: 'p6', text: 'compare HubSpot and Salesforce for a mid-market B2B company', type: 'competitor_anchored', cepStatus: 'unvalidated', tags: ['hubspot', 'salesforce'], createdAt: '2024-11-04' },
  { id: 'p7', text: 'HubSpot alternatives for a fast-growing startup', type: 'competitor_anchored', cepStatus: 'unvalidated', tags: ['hubspot'], createdAt: '2024-11-04' },
  { id: 'p8', text: 'is Attio as capable as HubSpot for sales teams', type: 'competitor_anchored', cepStatus: 'unvalidated', tags: ['attio', 'hubspot'], createdAt: '2024-11-05' },
  { id: 'p9', text: 'Zoho vs Pipedrive — which is better for small sales teams', type: 'competitor_anchored', cepStatus: 'unvalidated', tags: ['zoho', 'pipedrive'], createdAt: '2024-11-05' },
  { id: 'p10', text: 'best CRM for a growing B2B startup', type: 'entry_point', cepStatus: 'confirmed_cep', tags: ['cep'], createdAt: '2024-11-06' },
  { id: 'p11', text: 'easiest CRM to get a sales team to actually use', type: 'entry_point', cepStatus: 'confirmed_cep', tags: ['cep'], createdAt: '2024-11-06' },
  { id: 'p12', text: 'CRM with best marketing automation', type: 'entry_point', cepStatus: 'unvalidated', tags: ['cep'], createdAt: '2024-11-07' },
  { id: 'p13', text: 'most affordable CRM for small business', type: 'entry_point', cepStatus: 'unvalidated', tags: ['cep'], createdAt: '2024-11-07' },
  { id: 'p14', text: 'enterprise CRM with strong compliance', type: 'entry_point', cepStatus: 'unvalidated', tags: ['cep'], createdAt: '2024-11-08' },
]
