'use client'

import SessionContext from './SessionContext'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { ProviderProps } from '@/@types/common'

interface SessionProviderProps extends ProviderProps {
    /** Read from the session cookie on the server, so the first paint already knows the user */
    user: SessionUser
}

export default function SessionProvider({ user, children }: SessionProviderProps) {
    return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}
