import { type CommonProps } from '@/@types/common'
import { type ReactNode } from 'react'
import { useState, useCallback, useRef } from 'react'
import supportsAudioPreview from './support'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import classNames from '@/utils/classNames'

export interface AudioProps extends CommonProps {
    src: string
    fallback?: ReactNode
    onError?: (e: Error) => void
    onLoad?: () => void
}
export default function Audio(props: AudioProps) {
    const { src, fallback, className, onError, onLoad, ...rest } = props

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const supportsAudio = supportsAudioPreview()

    const handleLoadedData = useCallback(() => {
        setIsLoading(false)
        setIsError(false)
        onLoad?.()
    }, [onLoad])

    const handleError = useCallback(() => {
        setIsLoading(false)
        setIsError(true)
        onError?.(new Error('Failed to load audio'))
    }, [onError])

    // Unsupported browser or load error → show fallback
    if (!supportsAudio || isError) {
        return (
            <div className={classNames('flex flex-col items-center justify-center gap-4', className)} {...rest}>
                {fallback ?? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <p className="heading-text font-semibold">Audio preview is not available</p>
                        <p className="text-sm text-gray-500">Your browser does not support audio playback.</p>
                        <a href={src} target="_blank" rel="noopener noreferrer">
                            <Button>Open audio in new tab</Button>
                        </a>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={classNames('relative w-full', className)} {...rest}>
            {isLoading && (
                <div className="flex items-center justify-center p-4">
                    <Spinner size={30} />
                </div>
            )}
            <audio
                ref={audioRef}
                src={src}
                controls
                className="w-full max-h-[inherit] object-contain"
                onLoadedData={handleLoadedData}
                onError={handleError}
            >
                {/* Inner fallback for browsers that don't support the audio tag / can be related to network errors (example: X-Frame-Options) */}
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <p className="heading-text font-semibold">Could not preview Audio</p>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                        <Button>Open audio in new tab</Button>
                    </a>
                </div>
            </audio>
        </div>
    )
}
