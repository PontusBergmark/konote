import type { Attribute, Brand, ModelScoreMatrix, Prompt, ScanModel, ScoreMatrix } from '../types'
import { supabaseAdmin } from '../integrations/supabase/client.server'

export type ScanExcerpt = {
  text: string
  model: ScanModel
  prompt: string
  highlight: string
  score: number
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
  const excerpts: ScanExcerpts = {}
  data.brands.forEach((b) => { excerpts[b.id] = {} })

  if (prompts.length === 0 || activeAttributes.length === 0 || data.brands.length === 0) {
    return { scores, modelScores, excerpts, responses: 0 }
  }

  const completedPrompts: Record<ScanModel, number> = { ChatGPT: 0, Claude: 0 }

  for (const [index, prompt] of prompts.entries()) {
    const scanPrompt = buildScanPrompt(data.brands, activeAttributes, [prompt])
    const descriptivePrompt = buildDescriptivePrompt(data.brands, prompt)
    for (const model of SCAN_MODELS) {
      const startedAt = Date.now()
      console.log(`[scan] ${model} API call starting for prompt ${index + 1}/${prompts.length}: ${prompt.text}`)
      const [scoreResp, descResp] = await Promise.all([
        model === 'Claude' ? callClaude(scanPrompt) : callOpenAI(scanPrompt),
        model === 'Claude' ? callClaude(descriptivePrompt) : callOpenAI(descriptivePrompt),
      ])
      console.log(`[scan] ${model} API call completed for prompt ${index + 1}/${prompts.length} in ${Date.now() - startedAt}ms`)
      const parsed = parseScoreJson(scoreResp)
      if (parsed) {
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
      if (descResp) {
        collectExcerpts(excerpts, descResp, model, prompt.text, data.brands, activeAttributes)
      }
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

  return { scores, modelScores, excerpts, responses: Math.max(...Object.values(completedPrompts)) }
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
function buildDescriptivePrompt(brands: Brand[], prompt: Prompt) {
  const brandNames = brands.map(b => b.name).join(', ')
  return `Answer the following research prompt naturally and thoroughly, as you would for a user evaluating these brands: ${brandNames}.

For each brand you mention, describe its strengths, characteristics, and what it is known for in 2-4 sentences. Use natural prose (no bullet lists, no JSON). Mention each brand by name explicitly.

Prompt: ${prompt.text}`
}

function scoreSentence(sentence: string, brandName: string, keyword: string): number {
  let score = 0
  const lower = sentence.toLowerCase()
  const brandLower = brandName.toLowerCase()
  const kwLower = keyword.toLowerCase()
  const brandIdx = lower.indexOf(brandLower)
  const kwIdx = lower.indexOf(kwLower)
  if (brandIdx === -1 || kwIdx === -1) return -Infinity

  // Brand as subject: at start, or followed by descriptive verb
  const subjectRe = new RegExp(`\\b${escapeRegex(brandName)}\\b\\s+(is|are|has|have|offers|provides|delivers|excels|focuses|specializes|stands|leads|features|brings|combines|emphasizes|prioritizes|enables|supports|allows|comes|remains|continues|was|were|gives|makes|known|recognized|considered|regarded|built|designed|trusted)\\b`, 'i')
  if (subjectRe.test(sentence)) score += 10
  // Brand near start
  if (brandIdx <= 5) score += 5
  else if (brandIdx <= 30) score += 2

  // "known for", "is known for its X"
  if (/\bknown for\b|\brenowned for\b|\brecognized for\b|\bfamous for\b|\bnoted for\b/i.test(sentence)) score += 4

  // Penalize conditional / hypothetical / comparative-aside phrasing
  if (/^(if|when|whether|should|suppose)\b/i.test(sentence)) score -= 6
  if (/\b(if you|might|could|may|depending|consider|suppose)\b/i.test(sentence)) score -= 3
  if (/\?$/.test(sentence)) score -= 4

  // Keyword close to brand mention
  const dist = Math.abs(brandIdx - kwIdx)
  if (dist < 40) score += 3
  else if (dist < 100) score += 1

  // Prefer concise sentences
  if (sentence.length < 180) score += 1
  if (sentence.length > 280) score -= 1

  // Multiple other brand names mentioned suggests comparative aside (mild penalty handled by caller)
  return score
}

function collectExcerpts(
  store: ScanExcerpts,
  rawText: string,
  model: ScanModel,
  promptText: string,
  brands: Brand[],
  attributes: Attribute[],
) {
  const sentences = rawText
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
    .map(s => s.trim())
    .filter(s => s.length >= 20 && s.length <= 400)

  for (const brand of brands) {
    const brandRe = new RegExp(`\\b${escapeRegex(brand.name)}\\b`, 'i')
    for (const attribute of attributes) {
      const keywords = attributeKeywords(attribute)
      let best: { sentence: string; keyword: string; score: number } | null = null
      for (const sentence of sentences) {
        if (!brandRe.test(sentence)) continue
        // Penalize sentences that mention many other brands (likely comparative)
        const otherBrandHits = brands.filter(b => b.id !== brand.id && new RegExp(`\\b${escapeRegex(b.name)}\\b`, 'i').test(sentence)).length
        for (const kw of keywords) {
          if (!new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(sentence)) continue
          let s = scoreSentence(sentence, brand.name, kw)
          s -= otherBrandHits * 2
          if (!best || s > best.score) best = { sentence, keyword: kw, score: s }
        }
      }
      if (!best) continue
      const existing = store[brand.id][attribute.id]?.[0]
      if (!existing || best.score > existing.score) {
        store[brand.id][attribute.id] = [{
          text: best.sentence,
          model,
          prompt: promptText,
          highlight: best.keyword,
          score: best.score,
        }]
      }
    }
  }
}

function attributeKeywords(attribute: Attribute): string[] {
  const out = new Set<string>()
  const name = attribute.name.trim()
  if (name) out.add(name)
  // Split multi-word names into tokens >= 4 chars
  name.split(/[\s\-_/]+/).forEach(tok => {
    const t = tok.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (t.length >= 4) out.add(t)
  })
  return Array.from(out)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
