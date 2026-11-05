'use client'

import { createContext } from 'react'
import type { SessionUser } from '@/@types/auth/SessionUser'

/** The signed-in user, provided by the portal layout (null outside it). */
const SessionContext = createContext<SessionUser | null>(null)

export default SessionContext
