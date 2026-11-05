/**
 * Detects whether the current browser supports HTML5 audio playback.
 */
export default function supportsAudioPreview(): boolean {
    if (typeof window === 'undefined') {
        return false
    }
    if (typeof document === 'undefined') {
        return false
    }
    const audio = document.createElement('audio')
    return !!audio.canPlayType
}
