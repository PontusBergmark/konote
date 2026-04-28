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
      className="inline-flex items-center gap-1 pl-2 pr-2 py-0.5 rounded-full text-[11px] font-medium relative"
      style={{
        backgroundColor: bgColor ?? 'var(--color-secondary)',
        color: color ?? 'var(--color-secondary-foreground)',
        opacity,
        boxShadow: added ? `inset 2px 0 0 0 ${color ?? 'currentColor'}` : undefined,
        paddingLeft: added ? '0.625rem' : undefined,
      }}
      title={added ? 'Tracked as intended' : undefined}
    >
      {term}
      {(strength === 'moderate' || strength === 'weak') && frequencyBadge !== undefined && (
        <span className="text-[9px] opacity-0 group-hover:opacity-70 transition-opacity">{frequencyBadge}</span>
      )}
      {!added && onAdd && (
        <button onClick={onAdd} className="ml-0.5 hover:opacity-70 text-[10px]" title="Track as intended">+</button>
      )}
    </span>
  )
}
