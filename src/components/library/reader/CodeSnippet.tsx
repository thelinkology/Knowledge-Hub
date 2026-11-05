'use client'

import { useEffect, useId, useState } from 'react'
import Button from '@/components/ui/Button'
import { toastError } from '@/components/ui/toast/toast'
import { CheckIcon, CopyIcon } from '@/configs/icons.config'
import { codeLanguageLabel } from '@/@types/library/Asset'

interface CodeSnippetProps {
    code: string
    language: string
}

/** An asset's code snippet: the language, a Copy button and the code (shown as text, never run) */
export default function CodeSnippet({ code, language }: CodeSnippetProps) {
    const labelId = useId()
    const [copied, setCopied] = useState(false)
    const languageLabel = (language && codeLanguageLabel[language]) || language || 'Code'

    useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), 2000)
        return () => clearTimeout(timer)
    }, [copied])

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
        } catch (error) {
            toastError('Couldn’t copy to the clipboard. Select the code and copy it yourself instead.', error)
        }
    }

    return (
        <section
            aria-labelledby={labelId}
            className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700"
        >
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                <span
                    id={labelId}
                    className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-300"
                >
                    {languageLabel}
                </span>
                <Button
                    size="xs"
                    variant="plain"
                    icon={copied ? <CheckIcon /> : <CopyIcon />}
                    onClick={() => void copy()}
                    aria-label={copied ? 'Copied' : `Copy the ${languageLabel} code`}
                >
                    <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
            </div>
            <pre className="max-h-[36rem] overflow-auto bg-gray-900 p-4 text-sm leading-relaxed text-gray-100 dark:bg-gray-950">
                <code className="font-mono whitespace-pre">{code}</code>
            </pre>
        </section>
    )
}
