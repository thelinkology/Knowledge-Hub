'use client'

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ClipboardEvent,
    type DragEvent,
    type KeyboardEvent,
} from 'react'
import { useController, useFormContext, type FieldValues, type Path } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Segment from '@/components/ui/Segment'
import { FormItem } from '@/components/ui/Form'
import { toastError } from '@/components/ui/toast/toast'
import MarkdownContent from '@/components/shared/MarkdownContent'
import MarkdownToolbar, { type EditFn } from './markdown/MarkdownToolbar'
import ImageDialog from './markdown/ImageDialog'
import VideoDialog from './markdown/VideoDialog'
import VisualEditor from './visual/VisualEditor'
import { ExitFullScreenIcon, FullScreenIcon } from '@/configs/icons.config'
import { uploadImage } from '@/services/media'
import { insertBlock, insertInline, wrapSelection, type TextEdit } from '@/utils/markdownEditing'
import { imageMarkdown, readingStats } from '@/utils/media'
import { markdownToDoc, type DocNode } from '@/utils/lessonDoc'
import { tryGetErrorMessage } from '@/utils/errors'
import classNames from '@/utils/classNames'

interface MarkdownBodyEditorProps<T extends FieldValues> {
    /** The form field holding the Markdown */
    name: Path<T>
    label: string
    hint?: string
    placeholder?: string
    /** Starting mode; the visual editor by default */
    initialMode?: Mode
    /** Element id of the editing surface (for labels and checklists that jump to it) */
    id?: string
}

/** visual: what you see is what readers get (default) · write: Markdown, for those who prefer it */
type Mode = 'visual' | 'write' | 'split' | 'preview'

const IMAGE_PLACEHOLDER = 'Describe this image'

/**
 * The content editor used for articles, library assets, BRDs and client notes. By default a visual
 * editor (like a word processor) — authors never see Markdown — with images (upload, the image library or
 * a link; paste or drop works too), YouTube/Vimeo videos, tip boxes and tables. "Markdown" mode edits the
 * same content as text, with side-by-side and preview. Either way it is saved as Markdown and rendered
 * exactly as readers (and Copilot Studio) get it.
 */
export default function MarkdownBodyEditor<T extends FieldValues>({
    name,
    label,
    hint,
    placeholder = 'Start writing… Use Insert to add images, videos, tip boxes and tables.',
    initialMode = 'visual',
    id: fixedId,
}: MarkdownBodyEditorProps<T>) {
    const generatedId = useId()
    const editorId = fixedId ?? `${generatedId}-body`
    const helpId = `${editorId}-help`
    const { control } = useFormContext<T>()
    const { field, fieldState } = useController({ control, name })
    const textarea = useRef<HTMLTextAreaElement | null>(null)
    const [mode, setMode] = useState<Mode>(initialMode)
    // Image/video chosen in a dialog while in visual mode
    const [pendingInsert, setPendingInsert] = useState<DocNode | null>(null)
    const clearPending = useCallback(() => setPendingInsert(null), [])
    const [fullScreen, setFullScreen] = useState(false)
    const [dialog, setDialog] = useState<'image' | 'video' | null>(null)
    const [uploading, setUploading] = useState(0)
    const body: string = field.value ?? ''
    const stats = useMemo(() => readingStats(body), [body])

    // Full screen: the page behind doesn't scroll, and Escape leaves (unless a dialog is open)
    useEffect(() => {
        if (!fullScreen) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape' && !dialog) setFullScreen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = previous
            window.removeEventListener('keydown', onKey)
        }
    }, [fullScreen, dialog])

    const toggleFullScreen = () => {
        // Markdown mode goes side by side in full screen; the visual editor is already what readers see
        if (mode === 'write' && !fullScreen) setMode('split')
        if (mode === 'split' && fullScreen) setMode('write')
        setFullScreen(!fullScreen)
    }

    /** Applies an edit to the current text and selection, then restores focus and the new selection */
    const apply = useCallback(
        (edit: EditFn) => {
            const el = textarea.current
            const value = el?.value ?? body
            const start = el?.selectionStart ?? value.length
            const end = el?.selectionEnd ?? value.length
            const next: TextEdit = edit({ value, start, end })
            field.onChange(next.value)
            requestAnimationFrame(() => {
                if (!textarea.current) return
                textarea.current.focus()
                textarea.current.setSelectionRange(next.selectionStart, next.selectionEnd)
            })
        },
        [body, field],
    )

    /** Dialog results: as editor blocks in visual mode, as Markdown text otherwise */
    const insertFromDialog = (markdown: string) => {
        if (mode === 'visual') setPendingInsert(markdownToDoc(markdown).content?.[0] ?? null)
        else apply((s) => insertBlock(s, markdown))
    }

    const insertLink = () =>
        apply(({ value, start, end }) => {
            const text = value.slice(start, end) || 'link text'
            const edit = insertInline({ value, start, end }, `[${text}](https://)`)
            // Select the address so it can be typed straight away
            const urlStart = start + text.length + 3
            return { ...edit, selectionStart: urlStart, selectionEnd: urlStart + 'https://'.length }
        })

    const uploadImages = async (files: File[]) => {
        const images = files.filter((f) => f.type.startsWith('image/'))
        if (!images.length) return false
        setUploading((n) => n + images.length)
        for (const file of images) {
            try {
                const media = await uploadImage(file)
                apply((s) => insertBlock(s, imageMarkdown(media.url, IMAGE_PLACEHOLDER), IMAGE_PLACEHOLDER))
            } catch (error) {
                toastError(`${file.name}: ${tryGetErrorMessage(error)}`, error)
            } finally {
                setUploading((n) => n - 1)
            }
        }
        return true
    }

    const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(e.clipboardData.files)
        if (files.some((f) => f.type.startsWith('image/'))) {
            e.preventDefault()
            void uploadImages(files)
        }
    }

    const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
        const files = Array.from(e.dataTransfer.files)
        if (files.some((f) => f.type.startsWith('image/'))) {
            e.preventDefault()
            void uploadImages(files)
        }
    }

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return
        const key = e.key.toLowerCase()
        if (key === 'b') apply((s) => wrapSelection(s, '**', '**', 'bold text'))
        else if (key === 'i') apply((s) => wrapSelection(s, '_', '_', 'italic text'))
        else if (key === 'k') insertLink()
        else return
        e.preventDefault()
    }

    const editor = (
        <div>
            <MarkdownToolbar
                apply={apply}
                onImage={() => setDialog('image')}
                onVideo={() => setDialog('video')}
                onLink={insertLink}
            />
            <Input
                id={editorId}
                textArea
                rows={fullScreen ? 28 : 18}
                className="rounded-t-none font-mono text-sm"
                placeholder={
                    '## A heading\n\nWrite here. Use the toolbar for formatting, images and videos —\nor paste an image straight in.'
                }
                name={field.name}
                value={body}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={(el: HTMLTextAreaElement | null) => {
                    textarea.current = el
                    field.ref(el)
                }}
                onPaste={onPaste}
                onDrop={onDrop}
                onKeyDown={onKeyDown}
                aria-describedby={helpId}
            />
        </div>
    )

    const preview = (
        <div className="min-h-40 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            {body.trim() ? (
                <MarkdownContent>{body}</MarkdownContent>
            ) : (
                <p className="text-sm text-gray-500">Nothing written yet.</p>
            )}
        </div>
    )

    const visual = (
        <VisualEditor
            value={body}
            onChange={field.onChange}
            onBlur={field.onBlur}
            onImage={() => setDialog('image')}
            onVideo={() => setDialog('video')}
            pendingInsert={pendingInsert}
            onInserted={clearPending}
            onUploading={(delta) => setUploading((n) => n + delta)}
            tall={fullScreen}
            placeholder={placeholder}
            editorId={editorId}
            ariaLabel={label}
        />
    )

    const modes = (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Segment value={mode} onChange={(value) => setMode(value as Mode)} size="xs">
                <Segment.Item value="visual">Editor</Segment.Item>
                <Segment.Item value="write">Markdown</Segment.Item>
                {fullScreen && mode !== 'visual' && <Segment.Item value="split">Side by side</Segment.Item>}
                <Segment.Item value="preview">Preview</Segment.Item>
            </Segment>
            <Button
                type="button"
                size="xs"
                icon={fullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
                onClick={toggleFullScreen}
            >
                {fullScreen ? 'Exit full screen' : 'Full screen'}
            </Button>
        </div>
    )

    return (
        <FormItem
            label={label}
            htmlFor={editorId}
            invalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            extra={hint ? <span className="ml-2 text-xs font-normal text-gray-500">{hint}</span> : undefined}
        >
            <div
                className={classNames(
                    fullScreen &&
                        'fixed inset-0 z-[35] flex flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-gray-900',
                )}
                role={fullScreen ? 'region' : undefined}
                aria-label={fullScreen ? `${label} (full screen)` : undefined}
            >
                {fullScreen && <h4 className="mb-3">{label}</h4>}
                {modes}
                {mode === 'visual' ? (
                    visual
                ) : mode === 'preview' ? (
                    preview
                ) : mode === 'split' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {editor}
                        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">{preview}</div>
                    </div>
                ) : (
                    editor
                )}
                <p
                    id={helpId}
                    className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-500"
                    role="status"
                    aria-live="polite"
                >
                    <span>
                        {uploading > 0
                            ? `Uploading ${uploading === 1 ? 'an image' : `${uploading} images`}…`
                            : mode === 'visual'
                              ? 'Paste or drop images to upload them · Ctrl+B bold · Ctrl+I italic'
                              : 'Markdown mode, for those who like it · Ctrl+B bold · Ctrl+I italic · Ctrl+K link'}
                    </span>
                    {stats.words > 0 && (
                        <span>
                            {stats.words} words · about {stats.minutes} min read
                        </span>
                    )}
                </p>
            </div>
            <ImageDialog isOpen={dialog === 'image'} onClose={() => setDialog(null)} onInsert={insertFromDialog} />
            <VideoDialog isOpen={dialog === 'video'} onClose={() => setDialog(null)} onInsert={insertFromDialog} />
        </FormItem>
    )
}
