import { useState } from 'react'
import type { Attribute } from '../types'

interface AttributesManagerProps {
  attributes: Attribute[]
  onAdd: (attr: Attribute) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Attribute>) => void
  onReorder: (from: number, to: number) => void
}

const MAX_ACTIVE = 12

export function AttributesManager({ attributes, onAdd, onRemove, onUpdate, onReorder }: AttributesManagerProps) {
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIntended, setNewIntended] = useState(true)

  const activeCount = attributes.filter(a => a.active).length

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd({
      id: newName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newName.trim(),
      description: newDesc.trim(),
      active: activeCount < MAX_ACTIVE,
      order: attributes.length,
      isIntended: newIntended,
    })
    setNewName('')
    setNewDesc('')
    setNewIntended(true)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-sm font-medium text-foreground mb-4">Attributes</h2>

      <div className="space-y-1.5 mb-6">
        {attributes.map((attr, i) => (
          <div key={attr.id} className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => i > 0 && onReorder(i, i - 1)}
                className="text-[10px] text-muted-foreground hover:text-foreground leading-none"
                disabled={i === 0}
              >▲</button>
              <button
                onClick={() => i < attributes.length - 1 && onReorder(i, i + 1)}
                className="text-[10px] text-muted-foreground hover:text-foreground leading-none"
                disabled={i === attributes.length - 1}
              >▼</button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{attr.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{attr.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Intended toggle */}
              <div className="flex items-center gap-1" title="Intended positioning">
                <span
                  className="w-2 h-2 rounded-full cursor-pointer"
                  style={{ backgroundColor: attr.isIntended ? 'var(--color-primary)' : 'var(--color-border)' }}
                  onClick={() => onUpdate(attr.id, { isIntended: !attr.isIntended })}
                />
                <span className="text-[9px] text-muted-foreground">Intended</span>
              </div>
              {/* Active toggle */}
              <button
                onClick={() => {
                  if (!attr.active && activeCount >= MAX_ACTIVE) return
                  onUpdate(attr.id, { active: !attr.active })
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  attr.active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
                title={!attr.active && activeCount >= MAX_ACTIVE ? `Max ${MAX_ACTIVE} active attributes` : undefined}
              >
                {attr.active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => onRemove(attr.id)} className="text-muted-foreground hover:text-destructive text-xs">×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Attribute name"
          className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="Seed words / description"
          className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={newIntended}
            onChange={e => setNewIntended(e.target.checked)}
            className="accent-primary w-3 h-3"
          />
          Mark as intended positioning
        </label>
        <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90">
          Add attribute
        </button>
      </div>
    </div>
  )
}
