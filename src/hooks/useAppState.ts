import { useState, useCallback } from 'react'
import type { ViewId, Brand, Attribute, Prompt } from '../types'
import { brands as initialBrands } from '../data/brands'
import { attributes as initialAttributes } from '../data/attributes'
import { prompts as initialPrompts } from '../data/prompts'

export function useAppState() {
  const [currentView, setCurrentView] = useState<ViewId>('overview')
  const [selectedBrandId, setSelectedBrandId] = useState('hubspot')
  const [searchQuery, setSearchQuery] = useState('')
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes)
  const [promptsList, setPromptsList] = useState<Prompt[]>(initialPrompts)
  const [enabledModels, setEnabledModels] = useState<Record<string, boolean>>({
    ChatGPT: true,
    Claude: true,
    Gemini: true,
  })

  const selectedBrand = brands.find(b => b.id === selectedBrandId) ?? brands[0]

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
  }
}
