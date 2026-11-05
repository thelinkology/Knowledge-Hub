import { NextResponse, type NextRequest } from 'next/server'
import { verifyEmailLink } from '@/server/actions/auth'

/** Only same-site paths may be used as the destination (no open redirects) */
const safeNext = (value: string | null, fallback: string) =>
    value && value.startsWith('/') && !value.startsWith('//') ? value : fallback

/**
 * Where every auth email lands (sign-up confirmation, password reset, email change). Verifies the
 * link, which signs the person in, then sends them on: `next` from the link, or a sensible default.
 */
export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams
    const type = params.get('type')
    const ok = await verifyEmailLink({ code: params.get('code'), tokenHash: params.get('token_hash'), type })
    if (!ok) {
        const to = type === 'recovery' ? '/forgot-password?error=link' : '/login?error=link'
        return NextResponse.redirect(new URL(to, req.nextUrl.origin))
    }
    const fallback = type === 'recovery' ? '/reset-password' : '/?welcome=1'
    return NextResponse.redirect(new URL(safeNext(params.get('next'), fallback), req.nextUrl.origin))
}
