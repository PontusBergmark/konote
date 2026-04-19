import { useState } from 'react'
import type { Brand } from '../types'

export type ScanMode = 'quick' | 'full'

export const SCAN_MODES: Record<ScanMode, { label: string; prompts: number; seconds: number; durationMs: number }> = {
  quick: { label: 'Quick scan', prompts: 9, seconds: 15, durationMs: 15000 },
  full: { label: 'Full scan', prompts: 15, seconds: 25, durationMs: 25000 },
}

interface TopBarProps {
  brands: Brand[]
  selectedBrand: Brand
  onBrandChange: (id: string) => void
  onExport: () => void
  onRunScan: (mode: ScanMode) => void
  isScanning?: boolean
  scanMode: ScanMode
  onScanModeChange: (mode: ScanMode) => void
}

export function TopBar({ brands, selectedBrand, onBrandChange, onExport, onRunScan, isScanning, scanMode, onScanModeChange }: TopBarProps) {
  const [open, setOpen] = useState(false)
  const [scanMenuOpen, setScanMenuOpen] = useState(false)
  const mode = SCAN_MODES[scanMode]

  return (
    <div className="h-11 min-h-[44px] border-b flex items-center justify-between px-4" style={{ borderBottomWidth: '0.5px' }}>
      <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-1.5">
          {['All tags', 'All models'].map(f => (
            <span key={f} className="px-2 py-0.5 text-[11px] rounded-full bg-secondary text-secondary-foreground">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex">
          <button
            onClick={() => onRunScan(scanMode)}
            disabled={isScanning}
            className="px-3 py-1 text-xs font-medium rounded-l-md text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: '#6C3EF4' }}
          >
            {isScanning ? 'Scanning…' : `Run ${mode.label.toLowerCase()} ↗`}
          </button>
          <button
            onClick={() => setScanMenuOpen(o => !o)}
            disabled={isScanning}
            aria-label="Choose scan mode"
            className="px-1.5 py-1 rounded-r-md text-white hover:opacity-90 disabled:opacity-50 transition-opacity border-l border-white/20"
            style={{ backgroundColor: '#6C3EF4' }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {scanMenuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50 min-w-[260px] py-1">
              {(Object.keys(SCAN_MODES) as ScanMode[]).map(m => {
                const sm = SCAN_MODES[m]
                const selected = m === scanMode
                return (
                  <button
                    key={m}
                    onClick={() => { onScanModeChange(m); setScanMenuOpen(false) }}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-accent ${selected ? 'bg-accent' : ''}`}
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${selected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{sm.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {sm.prompts} prompts · ~{sm.seconds} sec
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <button
          onClick={onExport}
          className="px-3 py-1 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Export
        </button>
      </div>
    </div>
  )
}
