import type { Attribute } from '../types'

export const attributes: Attribute[] = [
  { id: 'ease-of-use', name: 'Ease of use', description: 'words like easy, simple, intuitive, user-friendly, accessible, no-code', active: true, order: 0, isIntended: true },
  { id: 'integration-depth', name: 'Integration depth', description: 'words like integrations, connects, API, ecosystem, native, plug-in', active: true, order: 1, isIntended: true },
  { id: 'customisation', name: 'Customisation', description: 'words like flexible, custom, configurable, tailored, adaptable', active: true, order: 2, isIntended: true },
  { id: 'enterprise-ready', name: 'Enterprise ready', description: 'words like enterprise, scalable, security, compliance, large teams', active: true, order: 3, isIntended: true },
  { id: 'automation', name: 'Automation', description: 'words like automate, workflow, triggers, sequences, hands-free', active: true, order: 4, isIntended: true },
  { id: 'value-for-money', name: 'Value for money', description: 'words like affordable, pricing, cost, ROI, free tier, budget', active: true, order: 5, isIntended: true },
]
