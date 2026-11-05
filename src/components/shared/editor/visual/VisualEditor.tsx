'use client'

import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Loading from '@/components/shared/Loading'
import { toastError } from '@/components/ui/toast/toast'
import VisualToolbar from './VisualToolbar'
import { lessonExtensions } from './extensions'
import { uploadImage } from '@/services/media'
import { docToMarkdown, markdownToDoc, type DocNode } from '@/utils/lessonDoc'
import { tryGetErrorMessage } from '@/utils/errors'
import classNames from '@/utils/classNames'

interface VisualEditorProps {
    /** The content as Markdown (what's saved) */
    value: string
    onChange: (markdown: string) => void
    onBlur?: () => void
    onImage: () => void
    onVideo: () => void
    /** Inserted content from the image/video dialogs (one-shot) */
    pendingInsert: DocNode | null
    onInserted: () => void
    onUploading: (delta: number) => void
    tall?: boolean
    /** Shown while empty */
    placeholder: string
    editorId: string
    ariaLabel: string
}

/**
 * The editor authors see by default: what they type is what readers see. Content is still
 * saved as Markdown (utils/lessonDoc converts both ways), so the reader view, previews and the
 * Markdown mode all agree.
 */
export default function VisualEditor({
    value,
    onChange,
    onBlur,
    onImage,
    onVideo,
    pendingInsert,
    onInserted,
    onUploading,
    tall,
    placeholder,
    editorId,
    ariaLabel,
}: VisualEditorProps) {
    // The Markdown we last produced, so outside changes (Markdown mode, reset) can be told apart
    const lastEmitted = useRef(value)

    const uploadImages = async (files: File[], at?: number) => {
        for (const file of files) {
            onUploading(1)
            try {
                const media = await uploadImage(file)
                const image = { type: 'image', attrs: { src: media.url, alt: '', title: null } }
                if (at !== undefined) editor?.chain().focus().insertContentAt(at, image).run()
                else editor?.chain().focus().insertContent(image).run()
            } catch (error) {
                toastError(`${file.name}: ${tryGetErrorMessage(error)}`, error)
            } finally {
                onUploading(-1)
            }
        }
    }

    const imagesIn = (list: FileList | null | undefined) =>
        Array.from(list ?? []).filter((f) => f.type.startsWith('image/'))

    const editor = useEditor({
        extensions: lessonExtensions(placeholder),
        content: markdownToDoc(value),
        immediatelyRender: false,
        editorProps: {
            attributes: {
                id: editorId,
                'aria-label': ariaLabel,
                class: classNames(
                    'lesson-content lesson-editor prose max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary',
                    tall ? 'min-h-[70vh]' : 'min-h-80',
                ),
            },
            handlePaste: (_view, event) => {
                const images = imagesIn(event.clipboardData?.files)
                if (!images.length) return false
                void uploadImages(images)
                return true
            },
            handleDrop: (view, event) => {
                const images = imagesIn((event as DragEvent).dataTransfer?.files)
                if (!images.length) return false
                event.preventDefault()
                const at = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
                void uploadImages(images, at)
                return true
            },
        },
        onUpdate: ({ editor: e }) => {
            const markdown = docToMarkdown(e.getJSON() as DocNode)
            lastEmitted.current = markdown
            onChange(markdown)
        },
        onBlur: () => onBlur?.(),
    })

    // Content changed outside the editor (e.g. edited in Markdown mode): load it
    useEffect(() => {
        if (!editor || value === lastEmitted.current) return
        lastEmitted.current = value
        editor.commands.setContent(markdownToDoc(value) as never, { emitUpdate: false })
    }, [editor, value])

    // An image or video chosen in a dialog
    useEffect(() => {
        if (!editor || !pendingInsert) return
        editor
            .chain()
            .focus()
            .insertContent(pendingInsert as never)
            .run()
        onInserted()
    }, [editor, pendingInsert, onInserted])

    if (!editor) return <Loading loading className="min-h-40" />

    return (
        <div>
            <VisualToolbar editor={editor} onImage={onImage} onVideo={onVideo} />
            <div className="rounded-b-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
