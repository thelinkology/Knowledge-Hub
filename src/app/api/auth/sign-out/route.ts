import { NextResponse } from 'next/server'
import { apiHandler } from '@/server/routes/api'
import { signOut } from '@/server/actions/auth'

/** A form post from the user menu; ends the session and returns to the sign-in page */
export const POST = apiHandler(async (req) => {
    await signOut()
    return NextResponse.redirect(new URL('/login?signedOut=1', req.nextUrl.origin), { status: 303 })
})
