import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { PUBLIC_PATHS, RETURN_TO_URL_KEY } from '@/constants/auth.constant'

/*
 * Runs before every page/API request:
 *  1. Refreshes the Supabase session cookie (access tokens are short-lived).
 *  2. Optimistically sends signed-out visitors of portal pages to /login. This is a convenience only —
 *     the portal layout and every API route verify the user again on the server.
 */
export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request })

    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
        process.env.SUPABASE_PUBLISHABLE_KEY ??
        process.env.SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return response // Not configured yet: the pages explain what to set

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                response = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
            },
        },
    })

    // Must run before any redirect so refreshed cookies are written
    const { data } = await supabase.auth.getClaims()
    const signedIn = !!data?.claims?.sub

    const { pathname, search } = request.nextUrl
    const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    const isApi = pathname.startsWith('/api/')

    if (!signedIn && !isPublic && !isApi) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.search = pathname === '/' ? '' : `?${RETURN_TO_URL_KEY}=${encodeURIComponent(pathname + search)}`
        return NextResponse.redirect(loginUrl)
    }
    if (signedIn && (pathname === '/login' || pathname === '/signup')) {
        const target = request.nextUrl.clone()
        target.pathname = '/'
        target.search = ''
        return NextResponse.redirect(target)
    }

    return response
}

export const config = {
    // Everything except static files and images
    matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
