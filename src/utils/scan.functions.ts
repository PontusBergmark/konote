import { createServerFn } from '@tanstack/react-start'
import { performLiveScan, type ScanInput } from './scan.server'

export const runLiveScan = createServerFn({ method: 'POST' })
  .inputValidator((data: ScanInput) => data)
  .handler(async ({ data }) => performLiveScan(data))