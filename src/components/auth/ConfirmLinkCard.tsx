'use client'

import { useState } from 'react'
import Link from 'next/link'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { SignInIcon } from '@/configs/icons.config'
import { signInPath } from '@/configs/app.config'
import { authMessages } from '@/configs/authMessages.config'

const m = authMessages.confirmLink

const copyFor = (type: string | null) => {
    switch (type) {
        case 'invite':
            return m.invite
        case 'recovery':
            return m.recovery
        case 'signup':
            return m.signup
        case 'email_change':
            return m.emailChange
        default:
            return m.signIn
    }
}

export interface ConfirmLinkParams {
    tokenHash: string | null
    type: string | null
    code: string | null
    next: string | null
}

/**
 * The page an email link opens. Verifying happens only when the person presses the button (a plain form
 * POST to /auth/confirm/verify, which also works without JavaScript): mail scanners open links but don't
 * press buttons, so they can no longer use up the one-time link.
 */
export default function ConfirmLinkCard({ tokenHash, type, code, next }: ConfirmLinkParams) {
    // One press only: a second POST would find the link already used and land on the error page
    const [submitting, setSubmitting] = useState(false)
    const copy = copyFor(type)

    if (!(tokenHash && type) && !code) {
        return (
            <>
                <h1 className="mb-4 text-2xl">{copy.title}</h1>
                <Alert showIcon type="warning" className="mb-5">
                    {m.missing}
                </Alert>
                <Link href={signInPath} className="block text-center text-sm font-semibold text-primary hover:underline">
                    {authMessages.checkEmail.backToSignIn}
                </Link>
            </>
        )
    }

    return (
        <form method="post" action="/auth/confirm/verify" onSubmit={() => setSubmitting(true)}>
            {tokenHash && <input type="hidden" name="token_hash" value={tokenHash} />}
            {type && <input type="hidden" name="type" value={type} />}
            {code && <input type="hidden" name="code" value={code} />}
            {next && <input type="hidden" name="next" value={next} />}
            <h1 className="mb-1 text-2xl">{copy.title}</h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">{copy.body}</p>
            <Button block variant="solid" type="submit" loading={submitting} icon={<SignInIcon />} autoFocus>
                {copy.submit}
            </Button>
            <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">{m.why}</p>
        </form>
    )
}
