import { describe, expect, it } from 'vitest'
import { docToMarkdown, markdownToDoc } from './lessonDoc'

const roundTrip = (markdown: string) => docToMarkdown(markdownToDoc(markdown))

const LESSON = `## Gateway setup

Plants make food from **light**, _water_ and ~~sugar~~ \`CO2\`. See [the guide](https://example.com/guide).\\
A new line in the same paragraph.

> [!TIP]
> Draw the leaf first, then label it.

![How photosynthesis works](https://www.youtube.com/watch?v=sQK3Yr4Sc_k)

![A green leaf](/api/media/abc "Figure 1")

| Input | Output |
| --- | --- |
| Light, water | Glucose |

- Light
- Water
  - Rain
  - Rivers

3. Third
4. Fourth

> A quote.

---

\`\`\`python
print("hi")
\`\`\`

Run it with [the CLI](https://example.com/cli) first.
`

describe('content documents', () => {
    it('round-trips every feature the editor offers, unchanged', () => {
        expect(roundTrip(LESSON)).toBe(LESSON)
    })

    it('is stable: a second round trip changes nothing', () => {
        const once = roundTrip('# Big title\n\n* star list\n\nText with *star italics*\n')
        expect(roundTrip(once)).toBe(once)
        expect(once).toBe('# Big title\n\n- star list\n\nText with _star italics_\n')
    })

    it('reads the rich parts as rich nodes', () => {
        const doc = markdownToDoc(LESSON)
        const types = doc.content!.map((n) => n.type)
        expect(types).toEqual([
            'heading',
            'paragraph',
            'callout',
            'video',
            'image',
            'table',
            'bulletList',
            'orderedList',
            'blockquote',
            'horizontalRule',
            'codeBlock',
            'paragraph',
        ])
        expect(doc.content![2].attrs).toEqual({ type: 'tip' })
        expect(doc.content![4].attrs).toEqual({ src: '/api/media/abc', alt: 'A green leaf', title: 'Figure 1' })
        expect(doc.content![11].content![1]).toMatchObject({ type: 'text', marks: [{ type: 'link' }] })
    })

    it('a bare video link on its own line becomes a video', () => {
        expect(markdownToDoc('https://youtu.be/dQw4w9WgXcQ').content![0]).toMatchObject({ type: 'video' })
        expect(markdownToDoc('https://youtube.com/').content![0].type).toBe('paragraph')
    })

    it('escapes what a teacher types so it never turns into formatting by accident', () => {
        const doc = {
            type: 'doc',
            content: [
                { type: 'paragraph', content: [{ type: 'text', text: '# not a heading, 2 * 3 = 6, [x], <b>, a_b' }] },
                { type: 'paragraph', content: [{ type: 'text', text: '- not a list' }] },
            ],
        }
        const markdown = docToMarkdown(doc)
        const back = markdownToDoc(markdown)
        expect(back.content!.map((n) => n.type)).toEqual(['paragraph', 'paragraph'])
        expect(back.content![0].content![0].text).toBe('# not a heading, 2 * 3 = 6, [x], <b>, a_b')
        expect(back.content![1].content![0].text).toBe('- not a list')
    })

    it('keeps bold spacing valid and code containing backticks', () => {
        const doc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Say ' },
                        { type: 'text', text: 'hello ', marks: [{ type: 'bold' }] },
                        { type: 'text', text: 'a`b', marks: [{ type: 'code' }] },
                    ],
                },
            ],
        }
        expect(docToMarkdown(doc)).toBe('Say **hello** ``a`b``\n')
    })

    it('keeps raw HTML visible as text (it is never rendered) and handles empty lessons', () => {
        expect(roundTrip('<script>alert(1)</script>\n')).toContain('alert(1)')
        expect(markdownToDoc('')).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
        expect(docToMarkdown(markdownToDoc(''))).toBe('')
    })
})
