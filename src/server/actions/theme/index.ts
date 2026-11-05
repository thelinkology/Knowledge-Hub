'use server'

import { cookies } from 'next/headers'
import { THEME_COOKIE } from '@/constants/theme.constant'
import { tryParseJson } from '@/utils/parse'
import type { PartialTheme } from '@/@types/theme'

const ONE_YEAR = 60 * 60 * 24 * 365

/** The user's saved theme preferences (mode, collapsed nav) from the theme cookie. */
export async function getTheme(): Promise<PartialTheme> {
    const cookieStore = await cookies()
    const saved = tryParseJson<{ state?: PartialTheme }>(cookieStore.get(THEME_COOKIE)?.value, {})
    const { mode, layout } = saved.state ?? {}
    return {
        ...(mode === 'light' || mode === 'dark' ? { mode } : {}),
        ...(layout ? { layout: { type: 'collapsibleSide', sideNavCollapse: !!layout.sideNavCollapse } } : {}),
    }
}

export async function setTheme(theme: string) {
    const cookieStore = await cookies()
    cookieStore.set(THEME_COOKIE, theme.slice(0, 2000), { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' })
}
