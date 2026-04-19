import type { ViewId } from '../types'

interface SidebarProps {
  currentView: ViewId
  onViewChange: (view: ViewId) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  isDark: boolean
  onToggleTheme: () => void
}

const NAV_SECTIONS: Array<{ label: string; items: Array<{ id: ViewId; name: string }> }> = [
  {
    label: 'ANALYSE',
    items: [
      { id: 'overview', name: 'Overview' },
      { id: 'association-map', name: 'Association map' },
      { id: 'attribute-scores', name: 'Attribute scores' },
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

export function Sidebar({ currentView, onViewChange, searchQuery, onSearchChange, isDark, onToggleTheme }: SidebarProps) {
  return (
    <div className="w-[220px] min-w-[220px] h-screen bg-sidebar-bg border-r border-border flex flex-col">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-medium">L</span>
          </div>
          <span className="text-sm font-medium text-foreground">LLM Tracker</span>
        </div>
        <button
          onClick={onToggleTheme}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>

      <div className="px-3 pb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search prompts..."
          className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

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

    </div>
  )
}
