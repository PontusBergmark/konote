import type { Attribute, Brand, Prompt } from '../types'

export type ScanInput = {
  brands: Brand[]
  attributes: Attribute[]
  prompts: Prompt[]
  selectedBrandId: string
}

const RUNS_PER_PROMPT = 3

export async function performLiveScan(data: ScanInput) {
  const activeAttributes = data.attributes.filter((attribute) => attribute.active).slice(0, 12)
  const prompts = data.prompts.slice(0, 15)
  const scores: Record<string, Record<string, number>> = {}

  data.brands.forEach((brand) => {
    scores[brand.id] = {}
    activeAttributes.forEach((attribute) => {
      scores[brand.id][attribute.id] = 0
    })
  })

  if (prompts.length === 0 || activeAttributes.length === 0 || data.brands.length === 0) {
    return { scores, responses: 0 }
  }

  let averagedPromptCount = 0

  for (const [index, prompt] of prompts.entries()) {
    const scanPrompt = buildScanPrompt(data.brands, activeAttributes, [prompt])
    const promptScores = createEmptyScores(data.brands, activeAttributes)
    let promptRuns = 0

    for (let run = 1; run <= RUNS_PER_PROMPT; run += 1) {
      const label = `prompt ${index + 1}/${prompts.length}, run ${run}/${RUNS_PER_PROMPT}`
      const startedAt = Date.now()

      console.log(`[scan] Anthropic API call starting for ${label}: ${prompt.text}`)
      const response = await callClaude(scanPrompt)
      console.log(`[scan] Anthropic API call completed for ${label} in ${Date.now() - startedAt}ms`)

      const parsed = parseScoreJson(response)
      if (!parsed) continue

      promptRuns += 1
      data.brands.forEach((brand) => {
        activeAttributes.forEach((attribute) => {
          const value = parsed[brand.name]?.[attribute.name]
          if (typeof value === 'number') {
            promptScores[brand.id][attribute.id] += Math.max(0, Math.min(100, value))
          }
        })
      })
    }

    if (promptRuns === 0) continue

    averagedPromptCount += 1
    data.brands.forEach((brand) => {
      activeAttributes.forEach((attribute) => {
        scores[brand.id][attribute.id] += promptScores[brand.id][attribute.id] / promptRuns
      })
    })
  }

  if (averagedPromptCount === 0) {
    return { scores, responses: 0 }
  }

  data.brands.forEach((brand) => {
    activeAttributes.forEach((attribute) => {
      scores[brand.id][attribute.id] = Math.round(scores[brand.id][attribute.id] / averagedPromptCount)
    })
  })

  return { scores, responses: averagedPromptCount }
}

function createEmptyScores(brands: Brand[], attributes: Attribute[]) {
  const scores: Record<string, Record<string, number>> = {}
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