'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { toastError } from '@/components/ui/toast/toast'
import { CheckIcon, CopyIcon } from '@/configs/icons.config'

interface CopyButtonProps {
    value: string
    /** What is copied, for screen readers ("the API key") */
    what: string
    className?: string
    variant?: 'solid' | 'plain' | 'default'
}

/** Copies `value` to the clipboard and says so for two seconds */
export default function CopyButton({ value, what, className, variant = 'default' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), 2000)
        return () => clearTimeout(timer)
    }, [copied])

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
        } catch (error) {
            toastError('Couldn’t copy to the clipboard. Select the text and copy it yourself instead.', error)
        }
    }

    return (
        <Button
            type="button"
            size="sm"
            variant={variant}
            className={className}
            icon={copied ? <CheckIcon /> : <CopyIcon />}
            onClick={() => void copy()}
            aria-label={copied ? `Copied ${what}` : `Copy ${what}`}
            disabled={!value}
        >
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
    )
}
