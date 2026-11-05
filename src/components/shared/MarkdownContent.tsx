import Link from 'next/link'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Element, ElementContent } from 'hast'
import VideoEmbed from './markdown/VideoEmbed'
import remarkCallouts from './markdown/remarkCallouts'
import { BestPracticeIcon, InfoIcon, WarningIcon } from '@/configs/icons.config'
import { CALLOUT_TYPES, calloutLabel, parseVideoUrl, type CalloutType } from '@/utils/media'
import { headingId } from '@/utils/articleValidation'
import classNames from '@/utils/classNames'

interface MarkdownContentProps {
    children: string
    className?: string
    /** Links to pages in this app (`/…`) open in the same tab (default: true) */
    internalLinks?: boolean
    /** Give h2/h3 headings ids, for the “In this article” outline */
    headingIds?: boolean
}

const REMARK_PLUGINS = [remarkGfm, remarkCallouts]

/** The paragraph's only element, ignoring whitespace (an image or link on a line of its own) */
function soleElement(node: Element | undefined): Element | null {
    const content = (node?.children ?? []).filter((c: ElementContent) => !(c.type === 'text' && !c.value.trim()))
    return content.length === 1 && content[0].type === 'element' ? content[0] : null
}

const textOf = (node: ElementContent): string =>
    node.type === 'text' ? node.value : node.type === 'element' ? node.children.map(textOf).join('') : ''

const CALLOUT_ICON: Record<CalloutType, React.ReactNode> = {
    note: <InfoIcon aria-hidden />,
    tip: <BestPracticeIcon aria-hidden />,
    important: <InfoIcon aria-hidden />,
    warning: <WarningIcon aria-hidden />,
}

/**
 * Knowledge content (articles, library assets, BRDs). Markdown (with tables, task lists and bare links)
 * only: raw HTML is not rendered, so content can't inject scripts. Links open in a new tab. Extras:
 *   ![Title](YouTube/Vimeo link) or a video link on its own line → a click-to-play video
 *   ![Alt](image "Caption")                                     → an image with a caption
 *   > [!TIP] / [!NOTE] / [!IMPORTANT] / [!WARNING]              → a callout box
 */
export default function MarkdownContent({
    children,
    className,
    internalLinks = true,
    headingIds,
}: MarkdownContentProps) {
    const seen = new Map<string, number>()
    const withId = (Tag: 'h2' | 'h3') =>
        function Heading({ children: content, node }: { children?: React.ReactNode; node?: Element }) {
            if (!headingIds || !node) return <Tag>{content}</Tag>
            const base = headingId(node.children.map(textOf).join(''))
            const n = seen.get(base) ?? 0
            seen.set(base, n + 1)
            return <Tag id={n ? `${base}-${n}` : base}>{content}</Tag>
        }
    const components: Components = {
        h2: withId('h2'),
        h3: withId('h3'),
        p: ({ node, children: content }) => {
            const only = soleElement(node)
            if (only?.tagName === 'img') {
                const src = String(only.properties.src ?? '')
                const video = parseVideoUrl(src)
                if (video) return <VideoEmbed video={video} title={String(only.properties.alt ?? '')} />
                if (only.properties.title) {
                    return (
                        <figure>
                            {content}
                            <figcaption>{String(only.properties.title)}</figcaption>
                        </figure>
                    )
                }
            }
            if (only?.tagName === 'a') {
                const href = String(only.properties.href ?? '')
                const video = parseVideoUrl(href)
                const label = textOf(only).trim()
                // A bare video link (or one whose text is the link) becomes the player
                if (video && (!label || label === href)) return <VideoEmbed video={video} title="" />
            }
            return <p>{content}</p>
        },
        img: ({ src, alt, title }) => {
            const url = typeof src === 'string' ? src : ''
            const video = parseVideoUrl(url)
            if (video) {
                // A video inside a sentence: link to it rather than break the paragraph
                return (
                    <a href={video.watchUrl} target="_blank" rel="noopener noreferrer">
                        ▶ {alt || 'Video'}
                    </a>
                )
            }
            if (!url) return null

            return <img src={url} alt={alt ?? ''} title={title} loading="lazy" decoding="async" />
        },
        blockquote: ({ node, children: content }) => {
            const type = String(node?.properties?.dataCallout ?? '') as CalloutType
            if (!CALLOUT_TYPES.includes(type)) return <blockquote>{content}</blockquote>
            return (
                <div className={`callout callout-${type}`} role="note">
                    <div className="callout-title">
                        {CALLOUT_ICON[type]} {calloutLabel[type]}
                    </div>
                    {content}
                </div>
            )
        },
        table: ({ children: content }) => (
            <div className="overflow-x-auto">
                <table>{content}</table>
            </div>
        ),
        a: ({ href, children: label }) => {
            if (internalLinks && href?.startsWith('/') && !href.startsWith('//')) {
                return <Link href={href}>{label}</Link>
            }
            return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                </a>
            )
        },
    }

    return (
        <div
            className={classNames(
                'lesson-content prose max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-img:rounded-xl',
                className,
            )}
        >
            <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={components}>
                {children}
            </ReactMarkdown>
        </div>
    )
}
