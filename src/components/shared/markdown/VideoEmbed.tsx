'use client'

import { useState } from 'react'
import { StartIcon } from '@/configs/icons.config'
import { videoProviderLabel, type VideoLink } from '@/utils/media'

/**
 * A YouTube/Vimeo video in a lesson. Until the student presses play nothing loads from the provider
 * (no cookies, no tracking requests); then the privacy-friendly player loads in a sandboxed frame.
 */
export default function VideoEmbed({ video, title }: { video: VideoLink; title: string }) {
    const [playing, setPlaying] = useState(false)
    const provider = videoProviderLabel[video.provider]
    const label = title || `${provider} video`

    return (
        <figure className="not-prose my-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900">
                {playing ? (
                    <iframe
                        src={video.embedUrl}
                        title={label}
                        className="absolute inset-0 h-full w-full"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        className="video-facade group absolute inset-0 flex w-full flex-col items-center justify-center gap-3 text-white"
                    >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl ring-1 ring-white/30 transition group-hover:bg-white/25 group-focus-visible:ring-4">
                            <StartIcon aria-hidden />
                        </span>
                        <span className="px-6 text-center font-semibold">{label}</span>
                        <span className="text-xs text-white/70">Play video · loads from {provider}</span>
                    </button>
                )}
            </div>
            <figcaption className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                <span>{title}</span>
                <a href={video.watchUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    Watch on {provider}
                </a>
            </figcaption>
        </figure>
    )
}
