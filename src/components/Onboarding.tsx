import { useState } from 'react'
import type { Brand, Prompt, Attribute } from '../types'

interface OnboardingProps {
  onComplete: (data: { ownBrand: Brand; competitors: Brand[]; prompts: Prompt[]; attributes: Attribute[]; runScan: boolean }) => void
}

const SWATCHES = ['#FF5C35', '#00A1E0', '#1A1A2E', '#E42527', '#1A3C5E', '#6C3EF4', '#10B981', '#F59E0B']

const TEMPLATE_PROBES: { label: string; text: string; type: 'association_probe' | 'competitor_anchored' }[] = [
  { label: 'Association probe', text: "describe {brand}'s strengths and what it's known for", type: 'association_probe' },
  { label: 'Competitor-anchored', text: 'compare {brand} to its main competitors — what sets it apart', type: 'competitor_anchored' },
]

const SUGGESTED_ATTRIBUTES = [
  'Ease of use', 'Innovation', 'Reliability', 'Value for money',
  'Enterprise ready', 'Customisation', 'Integration depth', 'Automation',
  'Customer support', 'Security', 'Speed', 'Design quality',
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)

  // Step 0 — Brand
  const [brandName, setBrandName] = useState('')
  const [brandColor, setBrandColor] = useState(SWATCHES[0])

  // Step 1 — Competitors
  const [competitors, setCompetitors] = useState<{ name: string; color: string }[]>([])
  const [compName, setCompName] = useState('')
  const [compColor, setCompColor] = useState(SWATCHES[1])

  // Step 2 — Attributes
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([])
  const [customAttr, setCustomAttr] = useState('')

  // Step 3 — Prompts
  const [addedPrompts, setAddedPrompts] = useState<{ text: string; type: 'association_probe' | 'competitor_anchored' }[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [customType, setCustomType] = useState<'association_probe' | 'competitor_anchored'>('association_probe')

  // Step 4 — Final
  const [selectedModel, setSelectedModel] = useState('All')

  const resolvedTemplates = TEMPLATE_PROBES.map(t => ({
    ...t,
    text: t.text.replace(/{brand}/g, brandName || 'your brand'),
  }))

  const handleAddComp = () => {
    if (!compName.trim() || competitors.length >= 4) return
    setCompetitors(prev => [...prev, { name: compName.trim(), color: compColor }])
    setCompName('')
    const usedColors = [...competitors.map(c => c.color), brandColor, compColor]
    const next = SWATCHES.find(s => !usedColors.includes(s)) ?? SWATCHES[2]
    setCompColor(next)
  }

  const toggleAttr = (name: string) => {
    setSelectedAttrs(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    )
  }

  const handleAddCustomAttr = () => {
    if (!customAttr.trim() || selectedAttrs.includes(customAttr.trim())) return
    setSelectedAttrs(prev => [...prev, customAttr.trim()])
    setCustomAttr('')
  }

  const handleToggleTemplate = (template: typeof resolvedTemplates[0]) => {
    setAddedPrompts(prev => {
      const exists = prev.some(p => p.text === template.text)
      if (exists) return prev.filter(p => p.text !== template.text)
      return [...prev, { text: template.text, type: template.type }]
    })
  }

  const handleAddCustom = () => {
    if (!customPrompt.trim()) return
    setAddedPrompts(prev => [...prev, { text: customPrompt.trim(), type: customType }])
    setCustomPrompt('')
  }

  const buildData = (runScan: boolean) => {
    const ownBrand: Brand = {
      id: brandName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: brandName.trim(),
      color: brandColor,
      isOwn: true,
    }
    const compBrands: Brand[] = competitors.map(c => ({
      id: c.name.toLowerCase().replace(/\s+/g, '-'),
      name: c.name,
      color: c.color,
      isOwn: false,
    }))
    const now = new Date().toISOString().slice(0, 10)
    const prompts: Prompt[] = addedPrompts.map((p, i) => ({
      id: `onb-${i}`,
      text: p.text,
      type: p.type,
      tags: [ownBrand.id],
      createdAt: now,
    }))
    const attributes: Attribute[] = selectedAttrs.map((name, i) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: '',
      active: true,
      order: i,
      isIntended: true,
    }))
    onComplete({ ownBrand, competitors: compBrands, prompts, attributes, runScan })
  }

  const stepLabels = ['Your brand', 'Your competitors', 'Your attributes', 'Your first prompts']

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-6">
        {/* Stepper */}
        {step < 4 && (
          <div className="flex flex-col gap-0 mb-8">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                      i < step
                        ? 'bg-primary border-primary text-primary-foreground'
                        : i === step
                          ? 'border-primary text-primary bg-background'
                          : 'border-border text-muted-foreground bg-background'
                    }`}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`w-0.5 h-6 ${i < step ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
                <span
                  className={`text-sm mt-1 ${
                    i === step ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Step 0 — Brand */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Brand name</label>
              <input
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Brand colour</label>
              <div className="flex gap-1.5">
                {SWATCHES.map(c => (
                  <button
                    key={c}
                    onClick={() => setBrandColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-colors ${
                      brandColor === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              disabled={!brandName.trim()}
              onClick={() => setStep(1)}
              className="w-full mt-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 1 — Competitors */}
        {step === 1 && (
          <div className="space-y-4">
            {competitors.length > 0 && (
              <div className="space-y-1.5">
                {competitors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-foreground flex-1">{c.name}</span>
                    <button
                      onClick={() => setCompetitors(prev => prev.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {competitors.length < 4 && (
              <div className="flex items-center gap-2">
                <input
                  value={compName}
                  onChange={e => setCompName(e.target.value)}
                  placeholder="Competitor name"
                  onKeyDown={e => e.key === 'Enter' && handleAddComp()}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => setCompColor(SWATCHES[(SWATCHES.indexOf(compColor) + 1) % SWATCHES.length])}
                  className="w-7 h-7 rounded-full border-2 border-border shrink-0"
                  style={{ backgroundColor: compColor }}
                />
                <button
                  onClick={handleAddComp}
                  disabled={!compName.trim()}
                  className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Next →
              </button>
              {competitors.length === 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Attributes */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              What attributes do you want <span className="font-medium text-foreground">{brandName}</span> to be known for? Pick the associations you'd like LLMs to surface about your brand.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_ATTRIBUTES.map(attr => {
                const active = selectedAttrs.includes(attr)
                return (
                  <button
                    key={attr}
                    onClick={() => toggleAttr(attr)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    {attr}
                    {active && <span className="ml-1">×</span>}
                  </button>
                )
              })}
            </div>

            {/* Custom attributes already added (not in suggestions) */}
            {selectedAttrs.filter(a => !SUGGESTED_ATTRIBUTES.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedAttrs.filter(a => !SUGGESTED_ATTRIBUTES.includes(a)).map(attr => (
                  <button
                    key={attr}
                    onClick={() => toggleAttr(attr)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground transition-colors"
                  >
                    {attr} <span className="ml-1">×</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={customAttr}
                onChange={e => setCustomAttr(e.target.value)}
                placeholder="Add your own attribute…"
                onKeyDown={e => e.key === 'Enter' && handleAddCustomAttr()}
                className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleAddCustomAttr}
                disabled={!customAttr.trim()}
                className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90 disabled:opacity-40"
              >
                Add
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                {selectedAttrs.length > 0 ? 'Next →' : 'Next →'}
              </button>
              {selectedAttrs.length === 0 && (
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Prompts */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              These are the questions we ask ChatGPT, Claude and Gemini about your brand — the answers become your association data.
            </p>

            <div className="space-y-1.5">
              {resolvedTemplates.map(t => {
                const active = addedPrompts.some(p => p.text === t.text)
                return (
                  <button
                    key={t.type}
                    onClick={() => handleToggleTemplate(t)}
                    className={`w-full text-left px-3 py-2.5 text-xs rounded-md border transition-colors ${
                      active
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-medium tracking-wide text-primary mr-1.5">
                      {t.label}
                    </span>
                    <span className="text-muted-foreground">{t.text}</span>
                  </button>
                )
              })}
            </div>

            <div className="space-y-1.5">
              <div className="flex gap-1">
                {(['association_probe', 'competitor_anchored'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setCustomType(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      customType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {t === 'association_probe' ? 'Probe' : 'Anchored'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Write your own prompt…"
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleAddCustom}
                  disabled={!customPrompt.trim()}
                  className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>

            {addedPrompts.filter(p => !resolvedTemplates.some(t => t.text === p.text)).length > 0 && (
              <div className="space-y-1">
                {addedPrompts
                  .filter(p => !resolvedTemplates.some(t => t.text === p.text))
                  .map(p => (
                    <div key={p.text} className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
                      <span className="text-[9px] uppercase font-medium tracking-wide text-primary">
                        {p.type === 'association_probe' ? 'probe' : 'anchored'}
                      </span>
                      <span className="text-xs text-foreground flex-1 truncate">{p.text}</span>
                      <button
                        onClick={() => setAddedPrompts(prev => prev.filter(x => x.text !== p.text))}
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <button
              disabled={addedPrompts.length < 2}
              onClick={() => setStep(4)}
              className="w-full px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {addedPrompts.length < 2
                ? `Add ${2 - addedPrompts.length} more prompt${addedPrompts.length === 1 ? '' : 's'}`
                : 'Next →'}
            </button>
          </div>
        )}

        {/* Final screen */}
        {step === 4 && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">You're ready.</h2>
              <p className="text-sm text-muted-foreground">
                Run your first scan to see how LLMs perceive{' '}
                <span className="font-medium text-foreground">{brandName}</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-2">Select model</label>
              <div className="flex justify-center gap-1.5">
                {['ChatGPT', 'Claude', 'Gemini', 'All'].map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedModel(m)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedModel === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => buildData(true)}
                className="w-full px-6 py-3 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#6C3EF4' }}
              >
                Run first scan ↗
              </button>
              <button
                onClick={() => buildData(false)}
                className="w-full px-6 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip — I'll scan later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
