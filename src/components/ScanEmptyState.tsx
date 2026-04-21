interface ScanEmptyStateProps {
  onRunScan?: () => void
  isScanning?: boolean
}

export function ScanEmptyState({ onRunScan, isScanning }: ScanEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
          <path d="M10 2v6m0 0l2.5-2.5M10 8L7.5 5.5M3 13h14M5 17h10a2 2 0 002-2v-2H3v2a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">No scan data yet</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-[260px]">
        Run your first scan to see how LLMs position your brand across attributes and competitors.
      </p>
      {onRunScan && (
        <button
          onClick={onRunScan}
          disabled={isScanning}
          className="px-4 py-2 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isScanning ? 'Scanning…' : 'Run your first scan'}
        </button>
      )}
    </div>
  )
}
