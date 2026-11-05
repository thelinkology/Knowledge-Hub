'use client'

import { useCallback, useContext } from 'react'
import SessionContext from '@/components/auth/SessionContext'
import type { Permission } from '@/@types/auth/Roles'

/**
 * The signed-in user and a permission check for showing/hiding UI. This is presentation only —
 * every API route checks permissions again on the server.
 */
export default function useSession() {
    const user = useContext(SessionContext)
    const can = useCallback((permission: Permission) => !!user?.permissions.includes(permission), [user])
    return { user, can }
}
