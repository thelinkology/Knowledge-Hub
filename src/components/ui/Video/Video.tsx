import { type CommonProps } from '@/@types/common'
import { type ReactNode } from 'react'
import { useState, useCallback, useRef } from 'react'
import supportsVideoPreview from './support'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import classNames from '@/utils/classNames'

export interface VideoProps extends CommonProps {
    src: string
    fallback?: ReactNode
    onError?: (e: Error) => void
    onLoad?: () => void
}
export default function Video(props: VideoProps) {
    const { src, fallback, className, onError, onLoad, ...rest } = props

    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const supportsVideo = supportsVideoPreview()

    const handleLoadedData = useCallback(() => {
        setIsLoading(false)
        setIsError(false)
        onLoad?.()
    }, [onLoad])

    const handleError = useCallback(() => {
        setIsLoading(false)
        setIsError(true)
        onError?.(new Error('Failed to load video'))
    }, [onError])

    // Unsupported browser or load error → show fallback
    if (!supportsVideo || isError) {
        return (
            <div className={classNames('flex flex-col items-center justify-center gap-4', className)} {...rest}>
                {fallback ?? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <p className="heading-text font-semibold">Video preview is not available</p>
                        <p className="text-sm text-gray-500">Your browser does not support video playback.</p>
                        <a href={src} target="_blank" rel="noopener noreferrer">
                            <Button>Open video in new tab</Button>
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
            <video
                ref={videoRef}
                src={src}
                controls
                className="w-full max-h-[inherit] object-contain"
                onLoadedData={handleLoadedData}
                onError={handleError}
            >
                {/* Inner fallback for browsers that don't support the video tag / can be related to network errors (example: X-Frame-Options) */}
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <p className="heading-text font-semibold">Could not preview Video</p>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                        <Button>Open video in new tab</Button>
                    </a>
                </div>
            </video>
        </div>
    )
}
