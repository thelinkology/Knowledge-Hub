'use client'

import { SWRConfig } from 'swr'
import { SWR_DEFAULTS } from '@/configs/swr.config'
import type { ProviderProps } from '@/@types/common'

/** App-wide SWR defaults. Fetchers come from the service layer (src/services/*). */
export default function SWRAppConfig({ children }: ProviderProps) {
    return <SWRConfig value={SWR_DEFAULTS}>{children}</SWRConfig>
}
