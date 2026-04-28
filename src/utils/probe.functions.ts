import { createServerFn } from '@tanstack/react-start'
import { performPositioningProbe, type ProbeInput } from './probe.server'

export const runPositioningProbe = createServerFn({ method: 'POST' })
  .inputValidator((data: ProbeInput) => data)
  .handler(async ({ data }) => performPositioningProbe(data))
