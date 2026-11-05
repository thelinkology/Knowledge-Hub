/**
 * Detects whether the current browser likely supports HTML5 video playback.
 */
export default function supportsVideoPreview(): boolean {
    if (typeof window === 'undefined') {
        return false
    }
    if (typeof document === 'undefined') {
        return false
    }
    const video = document.createElement('video')
    return !!video.canPlayType
}
