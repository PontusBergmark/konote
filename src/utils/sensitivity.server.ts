import type { ScanModel } from '../types'

export type SensitivityInput = {
  brandName: string
  attributeName: string
}

export type SensitivityResult = {
  brandName: string
  attributeName: string
  neutralPrompt: string
  framedPrompt: string
  neutralScore: number
  framedScore: number
  delta: number
  isPromptSensitive: boolean
  perModel: Array<{ model: ScanModel; neutral: number; framed: number }>
}

const MODELS: ScanModel[] = ['ChatGPT', 'Claude']
const SENSITIVITY_THRESHOLD = 20

export async function performSensitivityTest(input: SensitivityInput): Promise<SensitivityResult> {
  const { brandName, attributeName } = input
  const neutralPrompt = `What is ${brandName} known for?`
  const framedPrompt = `Is ${brandName} known for ${attributeName}?`

  const perModel: Array<{ model: ScanModel; neutral: number; framed: number }> = []

  for (const model of MODELS) {
    const [neutralResp, framedResp] = await Promise.all([
      callModel(model, neutralPrompt),
      callModel(model, framedPrompt),
    ])
    const [neutral, framed] = await Promise.all([
      scoreResponse(model, brandName, attributeName, neutralPrompt, neutralResp),
      scoreResponse(model, brandName, attributeName, framedPrompt, framedResp),
    ])
    perModel.push({ model, neutral, framed })
  }

  const avg = (key: 'neutral' | 'framed') =>
    Math.round(perModel.reduce((sum, m) => sum + m[key], 0) / perModel.length)

  const neutralScore = avg('neutral')
  const framedScore = avg('framed')
  const delta = framedScore - neutralScore

  return {
    brandName,
    attributeName,
    neutralPrompt,
    framedPrompt,
    neutralScore,
    framedScore,
    delta,
    isPromptSensitive: Math.abs(delta) >= SENSITIVITY_THRESHOLD,
    perModel,
  }
}

async function callModel(model: ScanModel, prompt: string): Promise<string> {
  return model === 'Claude' ? callClaude(prompt) : callOpenAI(prompt)
}

async function scoreResponse(
  model: ScanModel,
  brandName: string,
  attributeName: string,
  prompt: string,
  response: string,
): Promise<number> {
  const scoringPrompt = `You are scoring how strongly an LLM response associates a brand with an attribute. Read the prompt and the response, then output ONLY valid JSON in the form {"score": N} where N is an integer 0-100 representing how strongly the response associates "${brandName}" with "${attributeName}". 0 = no association at all, 100 = the response strongly and explicitly identifies "${attributeName}" as a defining trait of "${brandName}".

Prompt: ${prompt}

Response: ${response}`
  const raw = await callModel(model, scoringPrompt)
  const match = raw.match(/\{[\s\S]*?\}/)
  if (!match) return 0
  try {
    const parsed = JSON.parse(match[0]) as { score?: number }
    const n = typeof parsed.score === 'number' ? parsed.score : 0
    return Math.max(0, Math.min(100, Math.round(n)))
  } catch {
    return 0
  }
}

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': apiKey },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Anthropic sensitivity call failed', res.status, body)
    throw new Error(`Anthropic request failed with status ${res.status}`)
  }
  const json = await res.json() as { content?: Array<{ text?: string }> }
  return json.content?.map(p => p.text ?? '').join('\n') ?? ''
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 800,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('OpenAI sensitivity call failed', res.status, body)
    throw new Error(`OpenAI request failed with status ${res.status}`)
  }
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.map(c => c.message?.content ?? '').join('\n') ?? ''
}
