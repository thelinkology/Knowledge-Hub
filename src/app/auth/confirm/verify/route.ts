import { NextResponse, type NextRequest } from 'next/server'
import { verifyEmailLink } from '@/server/actions/auth'
import { RETURN_TO_COOKIE } from '@/constants/auth.constant'
import { isSafeReturnPath, safeReturnPath } from '@/utils/returnTo'

const field = (form: FormData, name: string) => {
    const value = form.get(name)
    return typeof value === 'string' && value ? value : null
}

/** 303 so the browser follows with a GET */
const redirectTo = (req: NextRequest, path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin), 303)

/**
 * Verifies an email link once the person presses the button on /auth/confirm (never on a plain GET, so
 * mail scanners that open links can't use them up). Verifying signs the person in; then they go to `next`
 * from the link, or a sensible default.
 */
export async function POST(req: NextRequest) {
    // Only our own confirm page may post here (stops another site signing someone into a different account)
    const site = req.headers.get('sec-fetch-site')
    if (site && site !== 'same-origin') return redirectTo(req, '/login?error=link')

    const form = await req.formData().catch(() => null)
    const type = form ? field(form, 'type') : null
    const ok =
        !!form && (await verifyEmailLink({ code: field(form, 'code'), tokenHash: field(form, 'token_hash'), type }))
    if (!ok) return redirectTo(req, type === 'recovery' ? '/forgot-password?error=link' : '/login?error=link')

    const fallback = type === 'recovery' || type === 'invite' ? '/reset-password' : '/?welcome=1'
    let next = safeReturnPath(form ? field(form, 'next') : null, fallback)
    // A sign-in link asked for on the way to a page (e.g. an article an agent linked to) goes back there
    const remembered = req.cookies.get(RETURN_TO_COOKIE)?.value
    if ((type === 'email' || type === 'magiclink') && next === '/' && isSafeReturnPath(remembered)) next = remembered
    const response = redirectTo(req, next)
    response.cookies.delete({ name: RETURN_TO_COOKIE, path: '/auth' })
    return response
}
