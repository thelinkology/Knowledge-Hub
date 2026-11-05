'use client'

import { type CommonProps } from '@/@types/common'
import { type ReactNode } from 'react'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import supportsPDFPreview from './support'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import classNames from '@/utils/classNames'

export interface PDFProps extends CommonProps {
    src: string
    fallback?: ReactNode
    onError?: (e: Error) => void
    onLoad?: () => void
}
export default function PDF(props: PDFProps) {
    const { src, fallback, className, onError, onLoad, ...rest } = props

    const objectRef = useRef<HTMLObjectElement | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const supportsPDF = useMemo(() => supportsPDFPreview(), [])

    useEffect(() => {
        if (!supportsPDF) {
            setIsLoading(false)
            setIsError(true)
            return
        }

        // Some browsers don't reliably fire load/error on <object>,
        // so use a timeout as a safety net to clear the loading state.
        const timeout = setTimeout(() => {
            setIsLoading(false)
        }, 5000)

        return () => clearTimeout(timeout)
    }, [supportsPDF, src])

    const handleLoad = useCallback(() => {
        setIsLoading(false)
        setIsError(false)
        onLoad?.()
    }, [onLoad])

    const handleError = useCallback(() => {
        setIsLoading(false)
        setIsError(true)
        onError?.(new Error('Failed to load PDF'))
    }, [onError])

    // Unsupported browser or load error → show fallback
    if (!supportsPDF || isError) {
        return (
            <div className={classNames('flex flex-col items-center justify-center gap-4', className)} {...rest}>
                {fallback ?? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <p className="heading-text font-semibold">PDF preview is not available</p>
                        <p className="text-sm text-gray-500">Your browser does not support inline PDF viewing.</p>
                        <a href={src} target="_blank" rel="noopener noreferrer">
                            <Button>Open PDF in new tab</Button>
                        </a>
                    </div>
                )}
            </div>
        )
    }
    return (
        <div className={classNames('relative w-full', className)} {...rest}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner size={40} />
                </div>
            )}
            <object
                ref={objectRef}
                data={src}
                type="application/pdf"
                className={isError || isLoading ? '' : 'w-[70vh] h-[70vh]'}
                onLoad={handleLoad}
                onError={handleError}
            >
                {/* Inner fallback for browsers that don't support the PDF tag / can be related to network errors (example: X-Frame-Options) */}
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <p className="heading-text font-semibold">Could not preview PDF</p>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                        <Button>Open PDF in new tab</Button>
                    </a>
                </div>
            </object>
        </div>
    )
}
