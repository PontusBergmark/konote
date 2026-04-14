import type { ViewId } from '../types'
import type { UsageState } from '../types'
import { PLANS } from '../config/plan'

interface SidebarProps {
  currentView: ViewId
  onViewChange: (view: ViewId) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  usage: UsageState
}

const NAV_SECTIONS: Array<{ label: string; items: Array<{ id: ViewId; name: string }> }> = [
  {
    label: 'ANALYSE',
    items: [
      { id: 'overview', name: 'Overview' },
      { id: 'association-map', name: 'Association map' },
      { id: 'attribute-scores', name: 'Attribute scores' },
      { id: 'entry-points', name: 'Entry points' },
      { id: 'co-occurrence', name: 'Co-occurrence' },
    ],
  },
  {
    label: 'DISCOVER',
    items: [{ id: 'positioning-probe', name: 'Positioning probe' }],
  },
  {
    label: 'MANAGE',
    items: [
      { id: 'prompts', name: 'Prompts' },
      { id: 'attributes', name: 'Attributes' },
      { id: 'settings', name: 'Settings' },
    ],
  },
]

export function Sidebar({ currentView, onViewChange, searchQuery, onSearchChange, usage }: SidebarProps) {
  const plan = PLANS[usage.currentTier]

  return (
    <div className="w-[220px] min-w-[220px] h-screen bg-sidebar-bg border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-medium">L</span>
        </div>
        <span className="text-sm font-medium text-foreground">LLM Tracker</span>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search prompts..."
          className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-1">
        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="mb-4">
            <div className="px-3 py-1 text-[10px] font-medium tracking-wider text-muted-foreground">
              {section.label}
            </div>
            {section.items.map(item => {
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full text-left px-3 py-1.5 text-[13px] rounded-sm transition-colors ${
                    isActive
                      ? 'text-primary border-l-2 border-primary font-medium'
                      : 'text-sidebar-foreground hover:text-foreground hover:bg-accent border-l-2 border-transparent'
                  }`}
                >
                  {item.name}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Usage counter */}
      <div className="px-3 py-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {usage.scansUsed}/{plan.scansPerMonth} scans used this month
        </p>
        <p className="text-[11px] text-muted-foreground">
          {plan.name} plan ·{' '}
          <button className="text-primary hover:underline">Upgrade ↗</button>
        </p>
      </div>
    </div>
  )
}
