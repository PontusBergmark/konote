import type { TermStrength } from '../types'

interface AssociationPillProps {
  term: string
  strength: TermStrength
  color?: string
  bgColor?: string
  onAdd?: () => void
  frequencyBadge?: number
  added?: boolean
}

export function AssociationPill({ term, strength, color, bgColor, onAdd, frequencyBadge, added }: AssociationPillProps) {
  const opacity = strength === 'strong' ? 1 : strength === 'moderate' ? 0.8 : 0.5

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        backgroundColor: bgColor ?? 'var(--color-secondary)',
        color: color ?? 'var(--color-secondary-foreground)',
        opacity,
      }}
    >
      {term}
      {(strength === 'moderate' || strength === 'weak') && frequencyBadge !== undefined && (
        <span className="text-[9px] opacity-70">{frequencyBadge}</span>
      )}
      {added ? (
        <span className="ml-0.5 text-[9px] uppercase tracking-wide opacity-80" title="Tracked as intended">✓ intended</span>
      ) : onAdd ? (
        <button onClick={onAdd} className="ml-0.5 hover:opacity-70 text-[10px]" title="Track as intended">+</button>
      ) : null}
    </span>
  )
}
