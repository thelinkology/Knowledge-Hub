'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { EmailIcon } from '@/configs/icons.config'
import { signInPath } from '@/configs/app.config'
import { authMessages } from '@/configs/authMessages.config'
import { apiResendConfirmation } from '@/services/misc'
import { tryGetErrorMessage } from '@/utils/errors'

const RESEND_WAIT_SECONDS = 60
const m = authMessages.checkEmail

/** After sign-up: where the email went, what to do if it doesn't arrive, and a resend button (rate-limited). */
export default function CheckEmailPanel({ email }: { email: string }) {
    const [wait, setWait] = useState(RESEND_WAIT_SECONDS)
    const [sending, setSending] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

    useEffect(() => {
        if (wait <= 0) return
        const timer = setTimeout(() => setWait((w) => w - 1), 1000)
        return () => clearTimeout(timer)
    }, [wait])

    const resend = async () => {
        setSending(true)
        setMessage(null)
        try {
            await apiResendConfirmation({ email })
            setMessage({ type: 'success', text: m.resent })
            setWait(RESEND_WAIT_SECONDS)
        } catch (error) {
            setMessage({ type: 'danger', text: tryGetErrorMessage(error) })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle text-3xl text-primary">
                <EmailIcon aria-hidden />
            </span>
            <h1 className="mb-2 text-2xl">{m.title}</h1>
            <p className="text-gray-600 dark:text-gray-300">{m.body(email)}</p>
            <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-sm text-gray-500 dark:text-gray-400">
                {m.tips.map((tip) => (
                    <li key={tip} className="flex gap-2">
                        <span aria-hidden>•</span>
                        {tip}
                    </li>
                ))}
            </ul>
            {message && (
                <Alert showIcon type={message.type} className="mt-5 text-left">
                    {message.text}
                </Alert>
            )}
            <div className="mt-6 flex flex-col gap-2">
                <Button block onClick={resend} loading={sending} disabled={wait > 0}>
                    {wait > 0 ? `${m.resend} (${wait}s)` : m.resend}
                </Button>
                <Link href={signInPath} className="block">
                    <Button block variant="plain">
                        {m.backToSignIn}
                    </Button>
                </Link>
            </div>
        </div>
    )
}
