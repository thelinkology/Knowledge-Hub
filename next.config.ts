import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

/** The Supabase project origin: the browser uploads files straight to it through signed URLs */
const supabaseOrigin = (() => {
    try {
        return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : ''
    } catch {
        return ''
    }
})()

/**
 * Content-Security-Policy. Scripts and styles only from this site (Next.js needs inline bootstrapping);
 * the only things loaded from elsewhere are teachers' linked lesson images (https), YouTube/Vimeo
 * players after a student presses play, and uploads to our own Supabase storage.
 */
const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin}${isDev ? ' ws: wss:' : ''}`.trim(),
    'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
]

const nextConfig: NextConfig = {
    poweredByHeader: false,
    experimental: {
        // Pages opened in the last 30 s come back instantly from the browser's router cache (each page's
        // data still refreshes in the background through SWR). The default for dynamic pages is 0 s.
        staleTimes: { dynamic: 30 },
    },
    async headers() {
        return [{ source: '/:path*', headers: securityHeaders }]
    },
}

export default nextConfig
