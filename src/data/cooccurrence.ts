import type { CoOccurrenceEntry } from '../types'

export const coOccurrenceData: Record<string, CoOccurrenceEntry[]> = {
  hubspot: [
    { entity: 'Salesforce', type: 'Competitor', frequency: 79, framing: 'Compared', delta: -0.3 },
    { entity: 'Marketing Hub', type: 'Sub-brand', frequency: 65, framing: 'Affiliated', delta: 0.2 },
    { entity: 'Inbound marketing', type: 'Concept', frequency: 71, framing: 'Owned', delta: 0.4 },
    { entity: 'SMB', type: 'Category', frequency: 60, framing: 'Owned', delta: 0.1 },
    { entity: 'Zoho', type: 'Competitor', frequency: 38, framing: 'Compared', delta: 0 },
    { entity: 'Free CRM', type: 'Concept', frequency: 44, framing: 'Owned', delta: 0.3 },
  ],
  salesforce: [
    { entity: 'HubSpot', type: 'Competitor', frequency: 75, framing: 'Compared', delta: 0.2 },
    { entity: 'Microsoft Dynamics', type: 'Competitor', frequency: 58, framing: 'Compared', delta: -0.1 },
    { entity: 'Tableau', type: 'Sub-brand', frequency: 52, framing: 'Affiliated', delta: 0.3 },
    { entity: 'Einstein AI', type: 'Sub-brand', frequency: 48, framing: 'Affiliated', delta: 0.5 },
    { entity: 'AppExchange', type: 'Sub-brand', frequency: 62, framing: 'Owned', delta: 0.1 },
    { entity: 'Enterprise sales', type: 'Concept', frequency: 85, framing: 'Owned', delta: 0.2 },
    { entity: 'Complex implementation', type: 'Concept', frequency: 55, framing: 'Compared', delta: -0.2 },
  ],
  attio: [
    { entity: 'HubSpot', type: 'Competitor', frequency: 68, framing: 'Compared', delta: 0.4 },
    { entity: 'Notion', type: 'Competitor', frequency: 42, framing: 'Compared', delta: 0.3 },
    { entity: 'Modern CRM', type: 'Concept', frequency: 55, framing: 'Owned', delta: 0.6 },
    { entity: 'Relationship intelligence', type: 'Concept', frequency: 48, framing: 'Owned', delta: 0.5 },
    { entity: 'Startup', type: 'Category', frequency: 62, framing: 'Owned', delta: 0.2 },
    { entity: 'Flexible data model', type: 'Concept', frequency: 45, framing: 'Owned', delta: 0.4 },
    { entity: 'API-first', type: 'Concept', frequency: 38, framing: 'Owned', delta: 0.3 },
  ],
  zoho: [
    { entity: 'HubSpot', type: 'Competitor', frequency: 62, framing: 'Compared', delta: 0.1 },
    { entity: 'Google Workspace', type: 'Partner', frequency: 48, framing: 'Affiliated', delta: 0.2 },
    { entity: 'Value', type: 'Concept', frequency: 72, framing: 'Owned', delta: 0.3 },
    { entity: 'Small business', type: 'Category', frequency: 65, framing: 'Owned', delta: 0.1 },
    { entity: 'Suite', type: 'Concept', frequency: 58, framing: 'Owned', delta: 0.2 },
    { entity: 'Zoho One', type: 'Sub-brand', frequency: 52, framing: 'Affiliated', delta: 0.4 },
    { entity: 'Automation', type: 'Concept', frequency: 45, framing: 'Owned', delta: 0.1 },
  ],
  pipedrive: [
    { entity: 'HubSpot', type: 'Competitor', frequency: 70, framing: 'Compared', delta: 0.2 },
    { entity: 'Sales pipeline', type: 'Concept', frequency: 78, framing: 'Owned', delta: 0.3 },
    { entity: 'Visual CRM', type: 'Concept', frequency: 55, framing: 'Owned', delta: 0.2 },
    { entity: 'SMB', type: 'Category', frequency: 62, framing: 'Owned', delta: 0.1 },
    { entity: 'Deals', type: 'Concept', frequency: 68, framing: 'Owned', delta: 0.4 },
    { entity: 'Salesforce', type: 'Competitor', frequency: 45, framing: 'Compared', delta: -0.1 },
    { entity: 'Simplicity', type: 'Concept', frequency: 60, framing: 'Owned', delta: 0.3 },
  ],
}
