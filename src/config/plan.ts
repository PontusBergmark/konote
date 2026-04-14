import type { PlanTier } from '../types'

export const PLANS: Record<string, PlanTier> = {
  free: {
    name: 'Free',
    price: null,
    maxBrands: 3,
    maxPrompts: 5,
    models: ['ChatGPT'],
    runsPerPrompt: 1,
    scansPerMonth: 5,
    positioningProbesPerMonth: 5,
  },
  starter: {
    name: 'Starter',
    price: 19,
    maxBrands: 5,
    maxPrompts: 15,
    models: ['ChatGPT', 'Claude', 'Gemini'],
    runsPerPrompt: 3,
    scansPerMonth: 15,
    positioningProbesPerMonth: 15,
  },
  pro: {
    name: 'Pro',
    price: 49,
    maxBrands: 10,
    maxPrompts: 30,
    models: ['ChatGPT', 'Claude', 'Gemini'],
    runsPerPrompt: 5,
    scansPerMonth: 30,
    positioningProbesPerMonth: 'unlimited',
  },
}

export const CURRENT_TIER: 'free' | 'starter' | 'pro' = 'free'
