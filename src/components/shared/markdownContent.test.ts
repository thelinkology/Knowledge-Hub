import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MarkdownContent from './MarkdownContent'

const render = (markdown: string, props: Record<string, unknown> = {}) =>
    renderToStaticMarkup(createElement(MarkdownContent, props as { children: string }, markdown))

describe('Markdown rendering', () => {
    it('turns a video link on its own line into a click-to-play player (nothing loads until play)', () => {
        for (const markdown of [
            '![Cells](https://youtu.be/dQw4w9WgXcQ)',
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]) {
            const html = render(markdown)
            expect(html).toContain('Play video')
            expect(html).not.toContain('<iframe')
            expect(html).not.toContain('<p><figure')
        }
    })

    it('keeps a video inside a sentence as a link, and other links as links', () => {
        expect(render('Watch ![this](https://youtu.be/dQw4w9WgXcQ) first')).toContain(
            'href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"',
        )
        expect(render('https://youtube.com/')).toContain('<a href="https://youtube.com/"')
    })

    it('captions images and renders tables and callouts', () => {
        expect(render('![A cell](/api/media/abc "Figure 1")')).toMatch(
            /<figure><img[^>]+src="\/api\/media\/abc"[^>]*><figcaption>Figure 1<\/figcaption><\/figure>/,
        )
        expect(render('| a | b |\n|---|---|\n| 1 | 2 |')).toContain('<table>')
        const tip = render('> [!TIP]\n> Draw a diagram first.')
        expect(tip).toContain('callout-tip')
        expect(tip).toContain('Draw a diagram first.')
        expect(tip).not.toContain('[!TIP]')
    })

    it('never renders raw HTML or script links', () => {
        const html = render('<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n<img src=x onerror=alert(1)>')
        expect(html).not.toContain('<script')
        expect(html).not.toContain('javascript:')
        expect(html).not.toMatch(/<img[^>]*onerror/)
    })

    it('gives headings ids for the outline when asked (unique per document)', () => {
        const html = render('## Set up the gateway\n\n## Set up the gateway', { headingIds: true })
        expect(html).toContain('<h2 id="set-up-the-gateway">')
        expect(html).toContain('<h2 id="set-up-the-gateway-1">')
        expect(render('## Plain')).toContain('<h2>Plain</h2>')
    })

    it('opens links to this app in the same tab and external links in a new one', () => {
        expect(render('[An article](/knowledge/articles/abc)')).not.toContain('target="_blank"')
        expect(render('[Docs](https://learn.microsoft.com)')).toContain('target="_blank"')
    })
})
