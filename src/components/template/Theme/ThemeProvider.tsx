'use client'

import { type ProviderProps } from '@/@types/common'
import { type PartialTheme, type Theme } from '@/@types/theme'

import { useState, useLayoutEffect } from 'react'
import ThemeContext from './ThemeContext'
import ConfigProvider, { defaultConfig } from '@/components/ui/ConfigProvider'
import applyTheme from '@/utils/applyThemeSchema'
import { setTheme as setThemeCookies } from '@/server/actions/theme'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'
//import useSystemTheme from '@/utils/hooks/useSystemTheme';
import { setThemeMode } from '@/utils/setThemeMode'
import { themeConfig } from '@/configs/theme.config'

export interface ThemeProviderProps extends ProviderProps {
    theme: PartialTheme
    locale?: string
}
export default function ThemeProvider({ children, theme, locale }: ThemeProviderProps) {
    //const systemTheme = useSystemTheme();
    const [themeState, setThemeState] = useState<Theme>({
        ...defaultConfig,
        ...themeConfig,
        ...theme,
    })

    // useEffect(() => {
    //     if (theme?.mode === undefined && systemTheme?.mode !== undefined) {
    //         const nextTheme: Theme = {...defaultConfig,...systemTheme,...theme,};
    //         setThemeState(nextTheme);
    //         setThemeMode(nextTheme.mode);
    //     }
    // }, [systemTheme?.mode,theme?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

    useLayoutEffect(() => {
        applyTheme(themeState.themeSchema || 'default', themeState.mode, presetThemeSchemaConfig)
    }, [themeState.themeSchema, themeState.mode])

    const handleSetTheme = async (payload: ((param: PartialTheme) => PartialTheme) | PartialTheme) => {
        const setTheme = async (theme: PartialTheme) => {
            const nextTheme: Theme = {
                ...defaultConfig,
                ...themeConfig,
                ...theme,
            }
            setThemeState(nextTheme)
            setThemeMode(nextTheme.mode)
            await setThemeCookies(JSON.stringify({ state: theme }))
        }

        if (typeof payload === 'function') {
            await setTheme(payload(themeState))
        } else {
            await setTheme(payload)
        }
    }

    return (
        <ThemeContext.Provider value={{ theme: themeState, setTheme: handleSetTheme }}>
            <ConfigProvider value={{ ...themeState, locale: locale || 'en' }}>{children}</ConfigProvider>
            {/* replaced by useLayoutEffect to prevent FOUC, kept for reference
            <script
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: `(${applyTheme.toString()})(${JSON.stringify([
                        themeState.themeSchema||'default',
                        themeState.mode,
                        presetThemeSchemaConfig,
                    ]).slice(1, -1)})`,
                }}
            />
            */}
        </ThemeContext.Provider>
    )
}
