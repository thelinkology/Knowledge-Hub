/*
 * Videos and images in lesson Markdown. Videos are links to YouTube or Vimeo — never uploads — embedded
 * through the providers' privacy-friendly players (youtube-nocookie, Vimeo with dnt) only after the
 * student presses play, so nothing loads from them until then.
 */

export type VideoProvider = 'youtube' | 'vimeo'

export interface VideoLink {
    provider: VideoProvider
    id: string
    /** Start offset in seconds (YouTube ?t= / &start=) */
    start: number
    /** The player URL to put in the iframe (autoplays, as it only loads after a click) */
    embedUrl: string
    /** Where "Watch on YouTube/Vimeo" goes */
    watchUrl: string
}

export const videoProviderLabel: Record<VideoProvider, string> = { youtube: 'YouTube', vimeo: 'Vimeo' }

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d{6,12}$/

/** "1h2m3s", "90s", "90" → seconds */
function parseStart(value: string | null): number {
    if (!value) return 0
    if (/^\d+$/.test(value)) return Number(value)
    const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
    if (!match) return 0
    return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

/** A YouTube or Vimeo link (watch, share, shorts, embed) → its video, or null for anything else */
export function parseVideoUrl(raw: string | null | undefined): VideoLink | null {
    if (!raw) return null
    let url: URL
    try {
        url = new URL(raw.trim())
    } catch {
        return null
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    const host = url.hostname.replace(/^(www\.|m\.)/, '')
    const segments = url.pathname.split('/').filter(Boolean)

    let youtubeId: string | null = null
    if (host === 'youtu.be') youtubeId = segments[0] ?? null
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
        if (segments[0] === 'watch') youtubeId = url.searchParams.get('v')
        else if (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) youtubeId = segments[1] ?? null
    }
    if (youtubeId && YOUTUBE_ID.test(youtubeId)) {
        const start = parseStart(url.searchParams.get('t') ?? url.searchParams.get('start'))
        const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1' })
        if (start) params.set('start', String(start))
        return {
            provider: 'youtube',
            id: youtubeId,
            start,
            embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`,
            watchUrl: `https://www.youtube.com/watch?v=${youtubeId}${start ? `&t=${start}s` : ''}`,
        }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const id = host === 'player.vimeo.com' ? segments[1] : segments.find((s) => VIMEO_ID.test(s))
        if (id && VIMEO_ID.test(id)) {
            return {
                provider: 'vimeo',
                id,
                start: 0,
                embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`,
                watchUrl: `https://vimeo.com/${id}`,
            }
        }
    }
    return null
}

/** Markdown for a video: image syntax, which MarkdownContent turns into a player */
export const videoMarkdown = (url: string, title: string) => `![${escapeAlt(title || 'Video')}](${url.trim()})`

/** Markdown for an image, with an optional caption (the title) */
export const imageMarkdown = (src: string, alt: string, caption = '') =>
    `![${escapeAlt(alt)}](${src.trim()}${caption.trim() ? ` "${caption.trim().replace(/"/g, '“')}"` : ''})`

const escapeAlt = (text: string) => text.replace(/[[\]]/g, '').trim()

/** Images uploaded to a course are served (after an access check) from here */
export const getMediaUrl = (mediaId: string) => `/api/media/${mediaId}`

/** Rough reading time for lesson Markdown (200 words a minute; videos not counted) */
export function readingStats(markdown: string) {
    const text = markdown
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#>*_`|~-]/g, ' ')
    const words = text.split(/\s+/).filter(Boolean).length
    return { words, minutes: words ? Math.max(1, Math.round(words / 200)) : 0 }
}

/** Lesson callouts: a quote starting with [!TIP], [!NOTE], [!WARNING] or [!IMPORTANT] */
export const CALLOUT_TYPES = ['note', 'tip', 'important', 'warning'] as const
export type CalloutType = (typeof CALLOUT_TYPES)[number]
export const calloutLabel: Record<CalloutType, string> = {
    note: 'Note',
    tip: 'Tip',
    important: 'Important',
    warning: 'Warning',
}
export const CALLOUT_MARKER = /^\[!(note|tip|important|warning)\][ \t]*\n?/i
