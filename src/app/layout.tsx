import '@/assets/styles/app.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import SWRAppConfig from '@/components/swr/SWRAppConfig'
import { getTheme } from '@/server/actions/theme'
import { themeConfig } from '@/configs/theme.config'
import { portalName, portalShortName, portalTagline } from '@/configs/app.config'
import classNames from '@/utils/classNames'
import type { ProviderProps } from '@/@types/common'

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
    title: { default: portalName, template: `%s · ${portalShortName}` },
    description: `${portalName} — ${portalTagline} Client knowledge, reusable assets and BRDs in one place.`,
    icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#0b1222' },
        { media: '(prefers-color-scheme: light)', color: '#f5f7fb' },
    ],
}

export default async function RootLayout({ children }: ProviderProps) {
    const theme = await getTheme()
    const mode = theme.mode ?? themeConfig.mode
    return (
        <html
            lang="en"
            className={classNames(bodyFont.variable, mode === 'dark' && 'dark')}
            style={{ colorScheme: mode }}
            suppressHydrationWarning
        >
            <body>
                <ThemeProvider theme={theme}>
                    <SWRAppConfig>{children}</SWRAppConfig>
                </ThemeProvider>
            </body>
        </html>
    )
}
