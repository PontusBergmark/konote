import { useState, useCallback } from 'react'
import type { ViewId, Brand, Attribute, Prompt } from '../types'
import { attributes as initialAttributes } from '../data/attributes'

export function useAppState() {
  const [currentView, setCurrentView] = useState<ViewId>('overview')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [brands, setBrands] = useState<Brand[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes)
  const [promptsList, setPromptsList] = useState<Prompt[]>([])
  const [enabledModels, setEnabledModels] = useState<Record<string, boolean>>({
    ChatGPT: true,
    Claude: true,
  })
  const [onboardingDone, setOnboardingDone] = useState(false)

  const selectedBrand = brands.find(b => b.id === selectedBrandId) ?? brands[0]
  const showOnboarding = !onboardingDone && promptsList.length === 0

  const completeOnboarding = useCallback((data: { ownBrand: Brand; competitors: Brand[]; prompts: Prompt[]; attributes?: Attribute[]; runScan?: boolean; scanMode?: number }) => {
    setBrands([data.ownBrand, ...data.competitors])
    setSelectedBrandId(data.ownBrand.id)
    setPromptsList(data.prompts)
    if (data.attributes && data.attributes.length > 0) {
      setAttributes(data.attributes)
    }
    setOnboardingDone(true)
    return { runScan: data.runScan ?? false, scanMode: data.scanMode ?? 9 }
  }, [])

  const resetToOnboarding = useCallback(() => {
    setBrands([])
    setPromptsList([])
    setSelectedBrandId('')
    setOnboardingDone(false)
    setCurrentView('overview')
  }, [])

  const addBrand = useCallback((brand: Brand) => {
    setBrands(prev => [...prev, brand])
  }, [])

  const removeBrand = useCallback((id: string) => {
    setBrands(prev => prev.filter(b => b.id !== id))
  }, [])

  const addAttribute = useCallback((attr: Attribute) => {
    setAttributes(prev => [...prev, attr])
  }, [])

  const removeAttribute = useCallback((id: string) => {
    setAttributes(prev => prev.filter(a => a.id !== id))
  }, [])

  const updateAttribute = useCallback((id: string, updates: Partial<Attribute>) => {
    setAttributes(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }, [])

  const reorderAttributes = useCallback((fromIndex: number, toIndex: number) => {
    setAttributes(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next.map((a, i) => ({ ...a, order: i }))
    })
  }, [])

  const addPrompt = useCallback((prompt: Prompt) => {
    setPromptsList(prev => [...prev, prompt])
  }, [])

  const removePrompt = useCallback((id: string) => {
    setPromptsList(prev => prev.filter(p => p.id !== id))
  }, [])

  const toggleModel = useCallback((model: string) => {
    setEnabledModels(prev => ({ ...prev, [model]: !prev[model] }))
  }, [])

  return {
    currentView, setCurrentView,
    selectedBrandId, setSelectedBrandId, selectedBrand,
    searchQuery, setSearchQuery,
    brands, addBrand, removeBrand,
    attributes, addAttribute, removeAttribute, updateAttribute, reorderAttributes,
    promptsList, addPrompt, removePrompt,
    enabledModels, toggleModel,
    showOnboarding, completeOnboarding, resetToOnboarding,
  }
}
