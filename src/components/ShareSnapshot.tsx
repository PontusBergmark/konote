import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { Brand } from '../types'

export interface SnapshotAssociation {
  label: string
  score: number
  intended: boolean
}

interface ShareSnapshotProps {
  brand: Brand
  scannedAt: Date | null
  topAssociations: SnapshotAssociation[]
  intendedLanding: { landing: number; total: number }
  biggestGap: { name: string; score: number } | null
  onClose: () => void
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ShareSnapshot({
  brand,
  scannedAt,
  topAssociations,
  intendedLanding,
  biggestGap,
  onClose,
}: ShareSnapshotProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: 'transparent',
      })
      const link = document.createElement('a')
      link.download = `konote-${brand.name.toLowerCase().replace(/\s+/g, '-')}-snapshot.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Snapshot download failed', err)
    } finally {
      setDownloading(false)
    }
  }

  const top = topAssociations[0]
  const max = top?.score ?? 100

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Close (esc)
        </button>
      </div>

      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[560px] my-8"
      >
        {/* Snapshot card */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-card"
        >
          {/* Header */}
          <div
            className="px-8 pt-8 pb-6"
            style={{ background: `linear-gradient(180deg, ${brand.color}1A 0%, transparent 100%)` }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: brand.color }}
                />
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  {brand.name}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {scannedAt ? formatDate(scannedAt) : '—'}
              </span>
            </div>

            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
              LLMs associate {brand.name} most with
            </p>
            {top ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1
                  className="text-4xl font-semibold tracking-tight leading-none"
                  style={{ color: brand.color }}
                >
                  {top.label}
                </h1>
                <span className="text-base text-muted-foreground tabular-nums">
                  {Math.round(top.score)}
                </span>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-muted-foreground">
                No signal yet
              </h1>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-card px-6 py-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Intended landing
              </p>
              <p className="text-base font-medium text-foreground tabular-nums">
                {intendedLanding.landing}{' '}
                <span className="text-sm text-muted-foreground">
                  of {intendedLanding.total}
                </span>
              </p>
            </div>
            <div className="bg-card px-6 py-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Biggest gap
              </p>
              <p className="text-base font-medium text-foreground truncate">
                {biggestGap?.name ?? '—'}
                {biggestGap && (
                  <span className="text-sm text-muted-foreground tabular-nums ml-1.5">
                    {Math.round(biggestGap.score)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Top associations */}
          <div className="bg-card px-8 py-6">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-4">
              Top associations
            </p>
            <div className="space-y-3">
              {topAssociations.length === 0 && (
                <p className="text-xs text-muted-foreground">Not enough signal yet.</p>
              )}
              {topAssociations.map((a, i) => {
                const pct = max > 0 ? (a.score / max) * 100 : 0
                return (
                  <div key={`${a.label}-${i}`} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground tabular-nums w-3">
                      {i + 1}
                    </span>
                    <span
                      className={`text-xs w-32 truncate ${a.intended ? 'font-medium text-foreground' : 'text-foreground'}`}
                    >
                      {a.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: brand.color,
                          opacity: a.intended ? 1 : 0.4,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-right">
                      {Math.round(a.score)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-card px-8 py-4 border-t border-border flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                <span className="text-xs font-semibold tracking-tight text-foreground">
                  Konote
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground tracking-wide ml-3">
                Powered by ChatGPT · Claude
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground tracking-wide">
              konote.app
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 text-xs font-medium rounded-md bg-white text-black hover:bg-white/90 disabled:opacity-60 transition-colors"
          >
            {downloading ? 'Generating…' : 'Download as image ↓'}
          </button>
        </div>
      </div>
    </div>
  )
}
