interface UpgradeNudgeProps {
  feature: string
  requiredTier: 'starter' | 'pro'
}

export function UpgradeNudge({ feature, requiredTier }: UpgradeNudgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary border border-border text-[11px]">
      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary text-primary-foreground uppercase">
        {requiredTier}
      </span>
      <span className="text-muted-foreground">{feature}</span>
      <button className="text-primary hover:underline ml-auto font-medium">Upgrade ↗</button>
    </div>
  )
}
