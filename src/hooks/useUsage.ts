import { useState, useCallback } from 'react'
import { CURRENT_TIER, PLANS } from '../config/plan'
import type { UsageState } from '../types'

export function useUsage() {
  const [usage, setUsage] = useState<UsageState>({
    scansUsed: 3,
    probesUsed: 2,
    currentTier: CURRENT_TIER,
  })

  const plan = PLANS[usage.currentTier]

  const canScan = usage.scansUsed < plan.scansPerMonth
  const canProbe = plan.positioningProbesPerMonth === 'unlimited' || usage.probesUsed < plan.positioningProbesPerMonth

  const recordScan = useCallback(() => {
    setUsage(prev => ({ ...prev, scansUsed: prev.scansUsed + 1 }))
  }, [])

  const recordProbe = useCallback(() => {
    setUsage(prev => ({ ...prev, probesUsed: prev.probesUsed + 1 }))
  }, [])

  return { usage, plan, canScan, canProbe, recordScan, recordProbe }
}
