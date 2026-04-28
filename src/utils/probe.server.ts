import type { Brand, ScanModel } from '../types'

export type ProbeInput = {
  primaryBrand: Brand
  competitors: Brand[]
  model: 'ChatGPT' | 'Claude' | 'All'
}

export type ProbeTerm = { term: string; strength: 'strong' | 'moderate' | 'weak' }

export type ProbeResult = {
  uniqueToPrimary: ProbeTerm[]
  uniqueToCompetitors: Record<string, ProbeTerm[]>
  shared: ProbeTerm[]
  responses: number
}

const PROBE_TEMPLATES = [
  (b: string, c: string) => `What makes ${b} different from ${c}?`,
  (b: string, c: string) => `What does ${b} do that ${c} doesn't?`,
  (b: string, c: string) => `How would you describe ${b} vs ${c} to someone evaluating both?`,
]

export async function performPositioningProbe(input: ProbeInput): Promise<ProbeResult> {
  const { primaryBrand, competitors } = input
  const models: ScanModel[] = input.model === 'All' ? ['ChatGPT', 'Claude'] : [input.model as ScanModel]

  if (competitors.length === 0) {
    return { uniqueToPrimary: [], uniqueToCompetitors: {}, shared: [], responses: 0 }
  }

  const primaryTermCounts = new Map<string, number>()
  const competitorTermCounts: Record<string, Map<string, number>> = {}
  competitors.forEach(c => { competitorTermCounts[c.id] = new Map() })

  let responses = 0

  for (const comp of competitors) {
    for (const tpl of PROBE_TEMPLATES) {
      const prompt = tpl(primaryBrand.name, comp.name)
      for (const model of models) {
        const startedAt = Date.now()
        console.log(`[probe] ${model} prompt: ${prompt}`)
        try {
          const raw = model === 'Claude' ? await callClaude(prompt) : await callOpenAI(prompt)
          console.log(`[probe] ${model} done in ${Date.now() - startedAt}ms`)
          responses += 1
          const extracted = await extractTerms(raw, primaryBrand.name, comp.name, model)
          if (!extracted) continue
          extracted.primary.forEach(t => primaryTermCounts.set(t, (primaryTermCounts.get(t) ?? 0) + 1))
          extracted.competitor.forEach(t => {
            const m = competitorTermCounts[comp.id]
            m.set(t, (m.get(t) ?? 0) + 1)
          })
        } catch (e) {
          console.error('[probe] call failed', e)
        }
      }
    }
  }

  const allCompetitorTerms = new Set<string>()
  Object.values(competitorTermCounts).forEach(m => m.forEach((_, k) => allCompetitorTerms.add(k)))

  const uniqueToPrimary: ProbeTerm[] = []
  const shared: ProbeTerm[] = []

  primaryTermCounts.forEach((count, term) => {
    const inCompetitor = allCompetitorTerms.has(term)
    const strength = strengthFromCount(count)
    if (inCompetitor) shared.push({ term, strength })
    else uniqueToPrimary.push({ term, strength })
  })

  const uniqueToCompetitors: Record<string, ProbeTerm[]> = {}
  competitors.forEach(comp => {
    const list: ProbeTerm[] = []
    competitorTermCounts[comp.id].forEach((count, term) => {
      if (primaryTermCounts.has(term)) return
      list.push({ term, strength: strengthFromCount(count) })
    })
    uniqueToCompetitors[comp.id] = sortAndTrim(list)
  })

  return {
    uniqueToPrimary: sortAndTrim(uniqueToPrimary),
    uniqueToCompetitors,
    shared: sortAndTrim(shared),
    responses,
  }
}

function strengthFromCount(count: number): 'strong' | 'moderate' | 'weak' {
  if (count >= 3) return 'strong'
  if (count === 2) return 'moderate'
  return 'weak'
}

function sortAndTrim(list: ProbeTerm[]): ProbeTerm[] {
  const order = { strong: 0, moderate: 1, weak: 2 }
  return list.sort((a, b) => order[a.strength] - order[b.strength]).slice(0, 12)
}

async function extractTerms(
  raw: string,
  primaryName: string,
  competitorName: string,
  model: ScanModel,
): Promise<{ primary: string[]; competitor: string[] } | null> {
  const extractionPrompt = `From the following text comparing "${primaryName}" and "${competitorName}", extract short distinguishing terms or phrases (2-4 words max each, lowercase) that describe each brand. Return ONLY valid JSON in this exact shape: {"primary":["term1","term2"],"competitor":["term1","term2"]}. Do not include generic shared terms.\n\nTEXT:\n${raw}`
  try {
    const resp = model === 'Claude' ? await callClaude(extractionPrompt) : await callOpenAI(extractionPrompt)
    const match = resp.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0]) as { primary?: string[]; competitor?: string[] }
    return {
      primary: (parsed.primary ?? []).map(normalize).filter(Boolean),
      competitor: (parsed.competitor ?? []).map(normalize).filter(Boolean),
    }
  } catch {
    return null
  }
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[.,;:!?]+$/g, '').slice(0, 60)
}

async function callClaude(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': apiKey },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic probe failed: ${res.status}`)
  const json = await res.json() as { content?: Array<{ text?: string }> }
  return json.content?.map(p => p.text ?? '').join('\n') ?? ''
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI probe failed: ${res.status}`)
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.map(c => c.message?.content ?? '').join('\n') ?? ''
}
