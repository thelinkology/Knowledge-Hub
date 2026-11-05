'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toastSuccess } from '@/components/ui/toast/toast'
import { authMessages } from '@/configs/authMessages.config'
import useSession from '@/utils/hooks/useSession'

/**
 * One-time messages after arriving from an email link (`?welcome=1` after confirming, `?passwordUpdated=1`
 * after a reset). Shows a toast, then removes the flag so a refresh doesn't repeat it.
 */
export default function ArrivalNotice() {
    const params = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()
    const { user } = useSession()
    const welcome = params.get('welcome')
    const passwordUpdated = params.get('passwordUpdated')

    useEffect(() => {
        if (!welcome && !passwordUpdated) return
        if (passwordUpdated) toastSuccess(authMessages.notices.passwordUpdated)
        else if (welcome) {
            toastSuccess(
                `Welcome, ${user?.name ?? 'there'}! You can read everything published. Ask an administrator if you need to write or edit.`,
            )
        }
        const next = new URLSearchParams(params)
        next.delete('welcome')
        next.delete('passwordUpdated')
        router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false })
    }, [welcome, passwordUpdated, params, pathname, router, user])

    return null
}
