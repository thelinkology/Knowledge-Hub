import 'server-only'
import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { asObject } from '@/server/data/supabase/json'
import { TooManyRequestsError } from '@/@types/errors'

/*
 * Rate limits shared by every server instance (public.hit_rate_limit, a fixed window per key). Keys are
 * hashed so no raw IP address or email is stored. If the limiter itself is unavailable, requests are let
 * through (and logged) rather than locking everyone out.
 */

export interface Limit {
    /** Requests allowed per window */
    max: number
    windowSeconds: number
}

export const LIMITS = {
    signInPerIp: { max: 20, windowSeconds: 300 },
    signInPerEmail: { max: 8, windowSeconds: 300 },
    signUpPerIp: { max: 6, windowSeconds: 3600 },
    emailPerIp: { max: 6, windowSeconds: 900 },
    emailPerAddress: { max: 3, windowSeconds: 900 },
    resetPerIp: { max: 10, windowSeconds: 900 },
    clientErrorsPerIp: { max: 20, windowSeconds: 60 },
    searchPerUser: { max: 120, windowSeconds: 60 },
    invitePerUser: { max: 20, windowSeconds: 3600 },
    /** Administrators emailing sign-in links */
    signInLinkPerUser: { max: 30, windowSeconds: 3600 },
    /** Copilot Studio and other agents, per API key */
    agentPerKey: { max: 300, windowSeconds: 60 },
    generateBrdsPerUser: { max: 30, windowSeconds: 3600 },
} satisfies Record<string, Limit>

const hash = (value: string) => createHash('sha256').update(value).digest('base64url').slice(0, 22)

/** The caller's IP (Vercel sets x-forwarded-for), hashed */
export function ipKey(req: NextRequest) {
    const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    return hash(forwarded || req.headers.get('x-real-ip') || 'unknown')
}

export const emailKey = (email: string) => hash(email.trim().toLowerCase())

/** Counts one request; throws 429 (with retryAfter seconds) when over the limit */
export async function enforceRateLimit(scope: keyof typeof LIMITS, subject: string) {
    const limit = LIMITS[scope]
    const result = await supabaseAdmin().rpc('hit_rate_limit', {
        p_key: `${scope}:${subject}`,
        p_window_seconds: limit.windowSeconds,
        p_max: limit.max,
    })
    if (result.error) {
        console.error('[rate-limit] unavailable, allowing request', scope, result.error.message)
        return { remaining: null }
    }
    const o = asObject(result.data)
    if (o.allowed === false) {
        const retryAfter = Number(o.retryAfter ?? limit.windowSeconds)
        const minutes = Math.max(1, Math.ceil(retryAfter / 60))
        throw new TooManyRequestsError(
            `Too many tries in a short time. Please wait about ${minutes} minute${minutes === 1 ? '' : 's'} and try again.`,
            'RATE_LIMITED',
            { retryAfter },
        )
    }
    return { remaining: Number(o.remaining ?? 0) }
}

/** How many requests are left in the current window, without counting one */
export async function peekRemaining(scope: keyof typeof LIMITS, subject: string) {
    const limit = LIMITS[scope]
    const windowStart = new Date(Math.floor(Date.now() / 1000 / limit.windowSeconds) * limit.windowSeconds * 1000)
    const { data } = await supabaseAdmin()
        .from('rate_limit_hits')
        .select('hits')
        .eq('key', `${scope}:${subject}`)
        .eq('window_start', windowStart.toISOString())
        .maybeSingle()
    return Math.max(0, limit.max - (data?.hits ?? 0))
}
