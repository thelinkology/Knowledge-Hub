'use client'

import { createContext, useContext } from 'react'
import { SIZES } from '../utils/constants'
import type { TypeAttributes } from '../@types/common'
import type { Mode } from '@/@types/theme'

export type Config = {
    mode: Mode
    locale: string
    direction: TypeAttributes.Direction
    controlSize: TypeAttributes.ControlSize
    ui?: {
        card?: {
            cardBordered?: boolean
        }
        button?: {
            disableClickFeedback?: boolean
        }
    }
}

export const defaultConfig: Config = {
    mode: 'light',
    locale: 'en',
    direction: 'ltr',
    controlSize: SIZES.MD,
} as const

export const ConfigContext = createContext<Config>(defaultConfig)

const ConfigProvider = ConfigContext.Provider

export const ConfigConsumer = ConfigContext.Consumer

export function useConfig() {
    return useContext(ConfigContext)
}

export default ConfigProvider
