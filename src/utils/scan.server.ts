import type { Attribute, Brand, ModelScoreMatrix, Prompt, ScanModel, ScoreMatrix } from '../types'
import { supabaseAdmin } from '../integrations/supabase/client.server'

export type ScanExcerpt = {
  text: string
  model: ScanModel
  prompt: string
  highlight: string
}

// brandId -> attributeId -> excerpts
export type ScanExcerpts = Record<string, Record<string, ScanExcerpt[]>>

export type ScanInput = {
  brands: Brand[]
  attributes: Attribute[]
  prompts: Prompt[]
  selectedBrandId: string
}

const SCAN_MODELS: ScanModel[] = ['ChatGPT', 'Claude']

export async function performLiveScan(data: ScanInput) {
  const activeAttributes = data.attributes.filter((attribute) => attribute.active).slice(0, 12)
  const prompts = data.prompts.slice(0, 15)
  const scores = createEmptyScores(data.brands, activeAttributes)
  const modelScores = SCAN_MODELS.reduce<ModelScoreMatrix>((acc, model) => {
    acc[model] = createEmptyScores(data.brands, activeAttributes)
    return acc
  }, {})

  if (prompts.length === 0 || activeAttributes.length === 0 || data.brands.length === 0) {
    return { scores, modelScores, responses: 0 }
  }

  const completedPrompts: Record<ScanModel, number> = { ChatGPT: 0, Claude: 0 }

  for (const [index, prompt] of prompts.entries()) {
    const scanPrompt = buildScanPrompt(data.brands, activeAttributes, [prompt])
    for (const model of SCAN_MODELS) {
      const startedAt = Date.now()
      console.log(`[scan] ${model} API call starting for prompt ${index + 1}/${prompts.length}: ${prompt.text}`)
      const response = model === 'Claude' ? await callClaude(scanPrompt) : await callOpenAI(scanPrompt)
      console.log(`[scan] ${model} API call completed for prompt ${index + 1}/${prompts.length} in ${Date.now() - startedAt}ms`)
      const parsed = parseScoreJson(response)
      if (!parsed) continue
      completedPrompts[model] += 1
      data.brands.forEach((brand) => {
        activeAttributes.forEach((attribute) => {
          const value = parsed[brand.name]?.[attribute.name]
          if (typeof value === 'number') {
            modelScores[model]![brand.id][attribute.id] += Math.max(0, Math.min(100, value))
          }
        })
      })
    }
  }

  data.brands.forEach((brand) => {
    activeAttributes.forEach((attribute) => {
      let total = 0
      let modelsWithScore = 0
      SCAN_MODELS.forEach((model) => {
        const count = completedPrompts[model]
        if (count === 0) return
        const averaged = Math.round(modelScores[model]![brand.id][attribute.id] / count)
        modelScores[model]![brand.id][attribute.id] = averaged
        total += averaged
        modelsWithScore += 1
      })
      scores[brand.id][attribute.id] = modelsWithScore > 0 ? Math.round(total / modelsWithScore) : 0
    })
  })

  // Track scan results in database
  const selectedBrand = data.brands.find(b => b.id === data.selectedBrandId)
  const brandName = selectedBrand?.name ?? data.selectedBrandId
  for (const model of SCAN_MODELS) {
    if (completedPrompts[model] > 0) {
      try {
        await supabaseAdmin.from('scans').insert({
          brand: brandName,
          model,
          prompt_count: completedPrompts[model],
        })
      } catch (e) {
        console.error(`[scan] Failed to record scan for ${model}:`, e)
      }
    }
  }

  return { scores, modelScores, responses: Math.max(...Object.values(completedPrompts)) }
}

function createEmptyScores(brands: Brand[], attributes: Attribute[]): ScoreMatrix {
  const scores: ScoreMatrix = {}
  brands.forEach((brand) => {
    scores[brand.id] = {}
    attributes.forEach((attribute) => {
      scores[brand.id][attribute.id] = 0
    })
  })
  return scores
}

function buildScanPrompt(brands: Brand[], attributes: Attribute[], prompts: Prompt[]) {
  return `You are scoring brand associations in LLM answers. Use the research prompts below as the context being tested. Return ONLY valid JSON in this exact shape: {"scores":{"Brand name":{"Attribute name":0}}}. Scores are 0-100 for how strongly the model would associate that brand with that attribute across the prompts.\n\nBrands: ${brands.map((b) => b.name).join(', ')}\nAttributes: ${attributes.map((a) => a.name).join(', ')}\nPrompts:\n${prompts.map((p, i) => `${i + 1}. ${p.text}`).join('\n')}`
}

async function callClaude(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': apiKey },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1400,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Anthropic scan request failed', res.status, body)
    throw new Error(`Anthropic scan request failed with status ${res.status}`)
  }

  const json = await res.json() as { content?: Array<{ type?: string; text?: string }> }
  return json.content?.map((part) => part.text ?? '').join('\n') ?? ''
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1400,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('OpenAI scan request failed', res.status, body)
    throw new Error(`OpenAI scan request failed with status ${res.status}`)
  }

  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.map((choice) => choice.message?.content ?? '').join('\n') ?? ''
}

function parseScoreJson(raw: string): Record<string, Record<string, number>> | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0]) as { scores?: Record<string, Record<string, number>> }
    return parsed.scores ?? null
  } catch {
    return null
  }
}