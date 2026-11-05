'use client'

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { DeleteIcon, StartIcon } from '@/configs/icons.config'
import { CALLOUT_TYPES, calloutLabel, parseVideoUrl, videoProviderLabel, type CalloutType } from '@/utils/media'
import classNames from '@/utils/classNames'

/*
 * How the rich blocks look while editing. Each shows what readers will see, with small controls (type,
 * caption, remove) that sit outside the editable text.
 */

const blockControls = 'not-prose mb-2 flex flex-wrap items-center gap-2 text-xs'

export function CalloutView({ node, updateAttributes, deleteNode }: NodeViewProps) {
    const type = (CALLOUT_TYPES as readonly string[]).includes(node.attrs.type)
        ? (node.attrs.type as CalloutType)
        : 'note'
    return (
        <NodeViewWrapper className={`callout callout-${type}`}>
            <div className={blockControls} contentEditable={false}>
                <label className="sr-only" htmlFor={`callout-${node.attrs.type}`}>
                    Box type
                </label>
                <select
                    className="callout-title cursor-pointer rounded border-none bg-transparent p-0 pr-5 focus:ring-2"
                    value={type}
                    onChange={(e) => updateAttributes({ type: e.target.value })}
                    aria-label="Box type"
                >
                    {CALLOUT_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {calloutLabel[t]}
                        </option>
                    ))}
                </select>
                <Button
                    type="button"
                    size="xs"
                    variant="plain"
                    icon={<DeleteIcon />}
                    className="ml-auto"
                    onClick={deleteNode}
                    aria-label="Remove this box"
                />
            </div>
            <NodeViewContent />
        </NodeViewWrapper>
    )
}

export function VideoView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
    const video = parseVideoUrl(String(node.attrs.src))
    return (
        <NodeViewWrapper
            className={classNames('not-prose my-6 rounded-xl', selected && 'ring-2 ring-primary')}
            data-drag-handle
        >
            <div className="video-facade flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl px-6 text-center text-white">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl ring-1 ring-white/30">
                    <StartIcon aria-hidden />
                </span>
                <span className="font-semibold">{node.attrs.title || 'Video'}</span>
                <span className="text-xs text-white/70">
                    {video ? `${videoProviderLabel[video.provider]} video` : 'This link isn’t a YouTube or Vimeo video'}
                </span>
            </div>
            <div className="mt-2 flex items-center gap-2" contentEditable={false}>
                <Input
                    size="sm"
                    className="flex-1"
                    value={node.attrs.title}
                    onChange={(e) => updateAttributes({ title: e.target.value })}
                    placeholder="Video title"
                    aria-label="Video title"
                    maxLength={150}
                />
                <Button type="button" size="xs" icon={<DeleteIcon />} onClick={deleteNode} aria-label="Remove video" />
            </div>
        </NodeViewWrapper>
    )
}

export function ImageView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
    return (
        <NodeViewWrapper className={classNames('my-6 rounded-xl', selected && 'ring-2 ring-primary')} data-drag-handle>
            <figure className="m-0">
                {}
                <img src={node.attrs.src} alt={node.attrs.alt ?? ''} className="mx-auto my-0 rounded-xl" />
            </figure>
            <div className="not-prose mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" contentEditable={false}>
                <Input
                    size="sm"
                    invalid={!node.attrs.alt}
                    value={node.attrs.alt ?? ''}
                    onChange={(e) => updateAttributes({ alt: e.target.value })}
                    placeholder="Describe the image (for screen readers)"
                    aria-label="Image description"
                    maxLength={200}
                />
                <Input
                    size="sm"
                    value={node.attrs.title ?? ''}
                    onChange={(e) => updateAttributes({ title: e.target.value || null })}
                    placeholder="Caption (optional)"
                    aria-label="Image caption"
                    maxLength={200}
                />
                <Button type="button" size="xs" icon={<DeleteIcon />} onClick={deleteNode} aria-label="Remove image" />
            </div>
        </NodeViewWrapper>
    )
}
