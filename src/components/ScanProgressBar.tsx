import { useEffect, useState } from 'react'

interface ScanProgressBarProps {
  isScanning: boolean
  /** Approx total scan duration in ms */
  durationMs?: number
  totalCalls?: number
}

const STAGES = [
  'Starting scan…',
  'Calling ChatGPT and Claude…',
  'Separating model results…',
  'Scoring associations…',
  'Finalising results…',
]

export function ScanProgressBar({ isScanning, durationMs = 90000, totalCalls = 0 }: ScanProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isScanning) {
      if (progress > 0) {
        // Snap to 100, then fade out
        setProgress(100)
        setDone(true)
        const t = setTimeout(() => {
          setProgress(0)
          setDone(false)
        }, 600)
        return () => clearTimeout(t)
      }
      return
    }

    setDone(false)
    setProgress(4)
    const start = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - start
      // Move steadily toward ~96% over the expected duration; final jump happens when isScanning flips off.
      const target = Math.min(96, (elapsed / durationMs) * 96)
      setProgress(p => (target > p ? target : p))
    }, 80)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning])

  if (progress === 0) return null

  const stageIdx = Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length))
  const estimatedCall = Math.min(totalCalls, Math.max(1, Math.ceil((progress / 96) * totalCalls)))
  const label = done ? 'Scan complete' : STAGES[stageIdx]

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Scan progress"
      className="border-b border-border bg-card/40"
    >
      <div className="flex items-center justify-between px-4 py-1.5 text-[11px]">
        <span className={done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
          {label} {totalCalls > 0 && !done ? `API call ${estimatedCall}/${totalCalls}` : ''} — this may take a couple of minutes.
        </span>
        <span className="tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <div className="h-0.5 w-full bg-secondary overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ease-out ${
            done ? 'bg-emerald-500' : 'bg-primary'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
