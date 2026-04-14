/**
 * Scoring functions — pure, no side effects.
 * All formulas from Applebaum brand association framework.
 */

/**
 * Attribute score: % of runs where attribute explicitly mentioned.
 * In seed data we use pre-calculated scores directly.
 */
export function calculateAttributeScore(
  _brand: string,
  _attribute: string,
  scores: Record<string, Record<string, number>>
): number {
  return scores[_brand]?.[_attribute] ?? 0
}

/**
 * Positioning presence: average of intended attribute scores, 0–100.
 */
export function calculatePositioningPresence(
  brandId: string,
  intendedAttributeIds: string[],
  scores: Record<string, Record<string, number>>
): number {
  const brandScores = scores[brandId]
  if (!brandScores || intendedAttributeIds.length === 0) return 0
  const sum = intendedAttributeIds.reduce((acc, attrId) => acc + (brandScores[attrId] ?? 0), 0)
  return Math.round((sum / (intendedAttributeIds.length * 100)) * 100 * 10) / 10
}

/**
 * Share of voice: brand's score / sum of all brands for that attribute, as %.
 */
export function calculateShareOfVoice(
  attributeId: string,
  allBrandScores: Record<string, Record<string, number>>
): Record<string, number> {
  const total = Object.values(allBrandScores).reduce(
    (acc, bs) => acc + (bs[attributeId] ?? 0),
    0
  )
  if (total === 0) return {}
  const result: Record<string, number> = {}
  for (const [brandId, bs] of Object.entries(allBrandScores)) {
    result[brandId] = Math.round(((bs[attributeId] ?? 0) / total) * 100 * 10) / 10
  }
  return result
}

/**
 * Delta between current and previous period score.
 */
export function calculateDelta(current: number, previous: number): number {
  return Math.round((current - previous) * 10) / 10
}

/**
 * Co-occurrence frequency (pre-calculated in seed data).
 */
export function calculateCoOccurrenceFrequency(frequency: number): number {
  return frequency
}

/**
 * Get delta direction for display.
 */
export function getDeltaDirection(delta: number): 'positive' | 'negative' | 'stable' {
  if (Math.abs(delta) <= 1) return 'stable'
  return delta > 0 ? 'positive' : 'negative'
}

/**
 * Find the top brand for an attribute (highest score).
 */
export function getTopBrandForAttribute(
  attributeId: string,
  scores: Record<string, Record<string, number>>
): { brandId: string; score: number } | null {
  let top: { brandId: string; score: number } | null = null
  for (const [brandId, bs] of Object.entries(scores)) {
    const score = bs[attributeId] ?? 0
    if (!top || score > top.score) {
      top = { brandId, score }
    }
  }
  return top
}

/**
 * Find the strongest attribute across all brands.
 */
export function getStrongestAttribute(
  scores: Record<string, Record<string, number>>
): { attributeId: string; brandId: string; score: number } | null {
  let best: { attributeId: string; brandId: string; score: number } | null = null
  for (const [brandId, bs] of Object.entries(scores)) {
    for (const [attrId, score] of Object.entries(bs)) {
      if (!best || score > best.score) {
        best = { attributeId: attrId, brandId, score }
      }
    }
  }
  return best
}
