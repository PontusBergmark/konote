import type { PeriodScore } from '../types'

export const currentScores: PeriodScore = {
  period: 'current',
  scores: {
    hubspot: { 'ease-of-use': 85, 'integration-depth': 78, customisation: 62, 'enterprise-ready': 70, automation: 80, 'value-for-money': 60 },
    salesforce: { 'ease-of-use': 48, 'integration-depth': 92, customisation: 88, 'enterprise-ready': 95, automation: 82, 'value-for-money': 35 },
    attio: { 'ease-of-use': 78, 'integration-depth': 65, customisation: 80, 'enterprise-ready': 52, automation: 58, 'value-for-money': 70 },
    zoho: { 'ease-of-use': 70, 'integration-depth': 72, customisation: 74, 'enterprise-ready': 60, automation: 68, 'value-for-money': 88 },
    pipedrive: { 'ease-of-use': 80, 'integration-depth': 60, customisation: 55, 'enterprise-ready': 45, automation: 62, 'value-for-money': 72 },
  },
}

export const previousScores: PeriodScore = {
  period: 'previous',
  scores: {
    hubspot: { 'ease-of-use': 81, 'integration-depth': 74, customisation: 60, 'enterprise-ready': 68, automation: 76, 'value-for-money': 61 },
    salesforce: { 'ease-of-use': 46, 'integration-depth': 90, customisation: 85, 'enterprise-ready': 94, automation: 80, 'value-for-money': 36 },
    attio: { 'ease-of-use': 72, 'integration-depth': 60, customisation: 76, 'enterprise-ready': 50, automation: 54, 'value-for-money': 68 },
    zoho: { 'ease-of-use': 68, 'integration-depth': 70, customisation: 71, 'enterprise-ready': 58, automation: 65, 'value-for-money': 85 },
    pipedrive: { 'ease-of-use': 78, 'integration-depth': 58, customisation: 54, 'enterprise-ready': 44, automation: 60, 'value-for-money': 70 },
  },
}

// Per-model scores for consistency dots (ChatGPT, Claude)
export const modelScores: Record<string, Record<string, Record<string, number>>> = {
  hubspot: {
    'ease-of-use': { chatgpt: 88, claude: 82 },
    'integration-depth': { chatgpt: 80, claude: 75 },
    customisation: { chatgpt: 65, claude: 58 },
    'enterprise-ready': { chatgpt: 72, claude: 68 },
    automation: { chatgpt: 82, claude: 78 },
    'value-for-money': { chatgpt: 62, claude: 55 },
  },
  salesforce: {
    'ease-of-use': { chatgpt: 52, claude: 45 },
    'integration-depth': { chatgpt: 94, claude: 90 },
    customisation: { chatgpt: 90, claude: 85 },
    'enterprise-ready': { chatgpt: 96, claude: 93 },
    automation: { chatgpt: 84, claude: 80 },
    'value-for-money': { chatgpt: 38, claude: 32 },
  },
  attio: {
    'ease-of-use': { chatgpt: 80, claude: 76 },
    'integration-depth': { chatgpt: 68, claude: 62 },
    customisation: { chatgpt: 82, claude: 78 },
    'enterprise-ready': { chatgpt: 55, claude: 48 },
    automation: { chatgpt: 60, claude: 55 },
    'value-for-money': { chatgpt: 72, claude: 68 },
  },
  zoho: {
    'ease-of-use': { chatgpt: 72, claude: 68 },
    'integration-depth': { chatgpt: 74, claude: 70 },
    customisation: { chatgpt: 76, claude: 72 },
    'enterprise-ready': { chatgpt: 62, claude: 58 },
    automation: { chatgpt: 70, claude: 66 },
    'value-for-money': { chatgpt: 90, claude: 86 },
  },
  pipedrive: {
    'ease-of-use': { chatgpt: 82, claude: 78 },
    'integration-depth': { chatgpt: 62, claude: 58 },
    customisation: { chatgpt: 58, claude: 52 },
    'enterprise-ready': { chatgpt: 48, claude: 42 },
    automation: { chatgpt: 64, claude: 60 },
    'value-for-money': { chatgpt: 74, claude: 70 },
  },
}
