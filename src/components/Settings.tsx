import { useState } from 'react'
import type { Brand } from '../types'

interface SettingsProps {
  brands: Brand[]
  onAddBrand: (brand: Brand) => void
  onRemoveBrand: (id: string) => void
  enabledModels: Record<string, boolean>
  onToggleModel: (model: string) => void
}

const SWATCHES = ['#FF5C35', '#00A1E0', '#1A1A2E', '#E42527', '#1A3C5E', '#6C3EF4', '#10B981', '#F59E0B']

export function Settings({ brands, onAddBrand, onRemoveBrand, enabledModels, onToggleModel }: SettingsProps) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(SWATCHES[0])

  const handleAdd = () => {
    if (!newName.trim()) return
    onAddBrand({
      id: newName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newName.trim(),
      color: newColor,
      isOwn: false,
    })
    setNewName('')
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-sm font-medium text-foreground mb-4">Settings</h2>

      {/* Brands */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Brands</h3>
        <div className="space-y-1.5 mb-3">
          {brands.map(b => (
            <div key={b.id} className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="text-xs text-foreground flex-1">{b.name}</span>
              <button onClick={() => onRemoveBrand(b.id)} className="text-muted-foreground hover:text-destructive text-xs">×</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Brand name"
            className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-1">
            {SWATCHES.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 ${newColor === c ? 'border-foreground' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Add
          </button>
        </div>
      </div>

      {/* Models */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Models</h3>
        <div className="space-y-1.5">
          {['ChatGPT', 'Claude', 'Gemini'].map(model => (
            <div key={model} className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-2">
              <span className="text-xs text-foreground">{model}</span>
              <button
                onClick={() => onToggleModel(model)}
                className={`w-8 h-4 rounded-full relative transition-colors ${
                  enabledModels[model] ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-background transition-transform ${
                    enabledModels[model] ? 'left-4' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
