import { describe, expect, it } from 'vitest'
import { imageMarkdown, parseVideoUrl, readingStats, videoMarkdown } from './media'

describe('video links', () => {
    it('recognises YouTube watch, share, shorts and embed links', () => {
        const id = 'dQw4w9WgXcQ'
        for (const url of [
            `https://www.youtube.com/watch?v=${id}`,
            `https://youtu.be/${id}`,
            `https://m.youtube.com/watch?v=${id}&feature=share`,
            `https://www.youtube.com/shorts/${id}`,
            `https://www.youtube-nocookie.com/embed/${id}`,
        ]) {
            expect(parseVideoUrl(url)).toMatchObject({ provider: 'youtube', id })
        }
    })

    it('embeds through youtube-nocookie and keeps the start time', () => {
        const video = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=1m30s')!
        expect(video.start).toBe(90)
        expect(video.embedUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/)
        expect(video.embedUrl).toContain('start=90')
    })

    it('recognises Vimeo, with do-not-track', () => {
        expect(parseVideoUrl('https://vimeo.com/76979871')).toMatchObject({ provider: 'vimeo', id: '76979871' })
        expect(parseVideoUrl('https://player.vimeo.com/video/76979871')?.embedUrl).toContain('dnt=1')
    })

    it('rejects everything else (other sites, bad ids, other schemes)', () => {
        expect(parseVideoUrl('https://youtube.com/')).toBeNull()
        expect(parseVideoUrl('https://www.youtube.com/watch?v=short')).toBeNull()
        expect(parseVideoUrl('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull()
        expect(parseVideoUrl('javascript:alert(1)')).toBeNull()
        expect(parseVideoUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull()
        expect(parseVideoUrl('not a url')).toBeNull()
    })
})

describe('lesson Markdown helpers', () => {
    it('writes image and video Markdown safely', () => {
        expect(imageMarkdown('/api/media/x', 'A [cell]', 'Fig. 1 "cell"')).toBe(
            '![A cell](/api/media/x "Fig. 1 “cell“")',
        )
        expect(videoMarkdown(' https://youtu.be/dQw4w9WgXcQ ', '')).toBe('![Video](https://youtu.be/dQw4w9WgXcQ)')
    })

    it('estimates reading time from words, not markup', () => {
        expect(readingStats('')).toEqual({ words: 0, minutes: 0 })
        expect(readingStats('## Title\n\n![img](https://x/y.png) A **bold** [link](https://x)')).toEqual({
            words: 4,
            minutes: 1,
        })
    })
})
