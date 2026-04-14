import { useCallback } from 'react'
import type { Brand, Attribute, Prompt } from '../types'
import { currentScores } from '../data/scores'
import { brands as allBrands } from '../data/brands'
import { attributes as allAttributes } from '../data/attributes'

type ExportableView = 'overview' | 'association-map' | 'attribute-scores' | 'co-occurrence'

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
}

export function useExport() {
  const download = useCallback((filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportView = useCallback((view: string, brands: Brand[], attributes: Attribute[]) => {
    const activeAttrs = attributes.filter(a => a.active)

    if (view === 'association-map' || view === 'attribute-scores') {
      const headers = ['Brand', ...activeAttrs.map(a => a.name)]
      const rows = brands.map(b => [
        b.name,
        ...activeAttrs.map(a => String(currentScores.scores[b.id]?.[a.id] ?? 0)),
      ])
      download(`${view}.csv`, toCsv(headers, rows))
    } else if (view === 'overview') {
      const headers = ['Brand', 'Positioning Presence %']
      const rows = brands.map(b => {
        const intendedIds = activeAttrs.filter(a => a.isIntended).map(a => a.id)
        const bs = currentScores.scores[b.id] ?? {}
        const sum = intendedIds.reduce((acc, id) => acc + (bs[id] ?? 0), 0)
        const pres = intendedIds.length > 0 ? Math.round((sum / (intendedIds.length * 100)) * 1000) / 10 : 0
        return [b.name, String(pres)]
      })
      download('overview.csv', toCsv(headers, rows))
    } else {
      // fallback: export scores
      const headers = ['Brand', ...activeAttrs.map(a => a.name)]
      const rows = brands.map(b => [
        b.name,
        ...activeAttrs.map(a => String(currentScores.scores[b.id]?.[a.id] ?? 0)),
      ])
      download('export.csv', toCsv(headers, rows))
    }
  }, [download])

  return { exportView }
}
