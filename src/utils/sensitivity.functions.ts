import { createServerFn } from '@tanstack/react-start'
import { performSensitivityTest, type SensitivityInput } from './sensitivity.server'

export const runSensitivityTest = createServerFn({ method: 'POST' })
  .inputValidator((data: SensitivityInput) => data)
  .handler(async ({ data }) => performSensitivityTest(data))
