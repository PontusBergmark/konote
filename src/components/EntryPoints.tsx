import type { Prompt } from '../types'
import { useState } from 'react'

interface EntryPointsProps {
  prompts: Prompt[]
}

export function EntryPoints({ prompts }: EntryPointsProps) {
  const [expandedCep, setExpandedCep] = useState<string | null>(null)
  const entryPoints = prompts.filter(p => p.type === 'entry_point')
  const confirmed = entryPoints.filter(p => p.cepStatus === 'confirmed_cep')
  const sorted = [...entryPoints].sort((a, b) => {
    if (a.cepStatus === 'confirmed_cep' && b.cepStatus !== 'confirmed_cep') return -1
    if (b.cepStatus === 'confirmed_cep' && a.cepStatus !== 'confirmed_cep') return 1
    return 0
  })

  // Mock win rates
  const winRates: Record<string, { brand: string; rate: number; delta: number }> = {
    p10: { brand: 'HubSpot', rate: 73, delta: 2.1 },
    p11: { brand: 'HubSpot', rate: 68, delta: 1.5 },
    p12: { brand: 'HubSpot', rate: 55, delta: -0.8 },
    p13: { brand: 'Zoho', rate: 62, delta: 0.4 },
    p14: { brand: 'Salesforce', rate: 78, delta: 1.2 },
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">Entry points</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {confirmed.length} confirmed CEPs out of {entryPoints.length} tracked entry points
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Prompt</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Winner</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Win rate</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const wr = winRates[p.id]
              const isConfirmed = p.cepStatus === 'confirmed_cep'
              return (
                <tr
                  key={p.id}
                  className={`border-b border-border ${isConfirmed ? 'bg-cep-confirmed-bg' : ''}`}
                >
                  <td className="py-2 px-3">
                    {isConfirmed ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary text-primary-foreground">CEP</span>
                    ) : p.cepStatus === 'rejected' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive text-destructive-foreground">✕</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono text-foreground">{p.text}</td>
                  <td className="py-2 px-3">
                    {wr && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                        {wr.brand}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-foreground">{wr?.rate}%</td>
                  <td className="py-2 px-3">
                    {wr && (
                      <span className={wr.delta > 0 ? 'text-primary' : wr.delta < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                        {wr.delta > 0 ? '↑' : wr.delta < 0 ? '↓' : '·'} {Math.abs(wr.delta)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Discover CEPs panel */}
      <div className="mt-4 bg-card border border-border rounded-lg p-4">
        <button
          onClick={() => setExpandedCep(expandedCep ? null : 'discover')}
          className="text-[11px] text-primary hover:underline font-medium"
        >
          Discover CEPs ↗
        </button>
        {expandedCep === 'discover' && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="Category (e.g. 'CRM for startups')"
              className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground font-mono bg-secondary p-2 rounded">
              "What is the best [category] for [use case]?"
            </p>
            <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Send prompt ↗
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
