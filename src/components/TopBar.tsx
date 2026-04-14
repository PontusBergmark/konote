import { useState } from 'react'
import type { Brand } from '../types'

interface TopBarProps {
  brands: Brand[]
  selectedBrand: Brand
  onBrandChange: (id: string) => void
}

export function TopBar({ brands, selectedBrand, onBrandChange }: TopBarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="h-11 min-h-[44px] border-b flex items-center justify-between px-4" style={{ borderBottomWidth: '0.5px' }}>
      <div className="flex items-center gap-3">
        {/* Brand selector */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md hover:bg-accent text-sm"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedBrand.color }} />
            <span className="font-medium text-foreground">{selectedBrand.name}</span>
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50 min-w-[180px] py-1">
              {brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => { onBrandChange(b.id); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left ${b.id === selectedBrand.id ? 'bg-accent' : ''}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="text-foreground">{b.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5">
          {['Last 30 days', 'All tags', 'All models'].map(f => (
            <span key={f} className="px-2 py-0.5 text-[11px] rounded-full bg-secondary text-secondary-foreground">
              {f}
            </span>
          ))}
        </div>
      </div>

      <button className="px-3 py-1 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
        Export
      </button>
    </div>
  )
}
