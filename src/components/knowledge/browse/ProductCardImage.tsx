'use client'

import { useState, type SyntheticEvent } from 'react'
import classNames from '@/utils/classNames'

/**
 * True when the image's four corners are opaque near-white: an illustration on a white background. Reading
 * pixels only works for same-origin images (uploads, /product-cards/…); for others it stays false.
 */
function hasWhiteBackground(img: HTMLImageElement) {
    try {
        const canvas = document.createElement('canvas')
        canvas.width = 24
        canvas.height = 24
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return false
        ctx.drawImage(img, 0, 0, 24, 24)
        return [
            [0, 0],
            [23, 0],
            [0, 23],
            [23, 23],
        ].every(([x, y]) => {
            const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data
            return a > 245 && r > 240 && g > 240 && b > 240
        })
    } catch {
        return false
    }
}

/**
 * A product card's image. In dark mode, an image with a white background sits on a rounded soft-violet
 * panel and its white is blended away (multiply), so it reads as a deliberate preview in the theme's
 * colours rather than a white box; transparent images float on the card as they are.
 */
export default function ProductCardImage({ src }: { src: string }) {
    const [whiteBackground, setWhiteBackground] = useState(false)

    const onLoad = (event: SyntheticEvent<HTMLImageElement>) =>
        setWhiteBackground(hasWhiteBackground(event.currentTarget))

    return (
        <span
            className={classNames(
                'flex h-full w-full items-center justify-center overflow-hidden rounded-xl',
                whiteBackground &&
                    'dark:bg-gradient-to-br dark:from-[#f1edff] dark:via-[#e6dfff] dark:to-[#d6caff] dark:ring-1 dark:ring-white/10 dark:brightness-95',
            )}
        >
            <img
                src={src}
                alt=""
                onLoad={onLoad}
                className={classNames(
                    'max-h-28 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none',
                    // The white melts into the violet panel; the illustration keeps its colours
                    whiteBackground && 'dark:mix-blend-multiply',
                )}
                loading="lazy"
                decoding="async"
            />
        </span>
    )
}
