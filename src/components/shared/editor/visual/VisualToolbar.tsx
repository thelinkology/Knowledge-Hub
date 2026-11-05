'use client'

import { useState, type ReactNode } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Tooltip from '@/components/ui/Tooltip'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import {
    AddIcon,
    BoldIcon,
    BulletListIcon,
    CalloutIcon,
    CodeIcon,
    DeleteIcon,
    DividerIcon,
    ExpandIcon,
    ImageIcon,
    ItalicIcon,
    LinkInsertIcon,
    NumberedListIcon,
    QuoteIcon,
    TableIcon,
    VideoIcon,
} from '@/configs/icons.config'
import { CALLOUT_TYPES, calloutLabel } from '@/utils/media'
import classNames from '@/utils/classNames'

interface VisualToolbarProps {
    editor: Editor
    onImage: () => void
    onVideo: () => void
}

type TextStyle = 'paragraph' | 1 | 2 | 3

const textStyleLabel: Record<string, string> = {
    paragraph: 'Normal text',
    1: 'Title',
    2: 'Heading',
    3: 'Subheading',
}

function ToolButton({
    label,
    icon,
    onClick,
    active,
    disabled,
}: {
    label: string
    icon: ReactNode
    onClick: () => void
    active?: boolean
    disabled?: boolean
}) {
    return (
        <Tooltip title={label}>
            <Button
                type="button"
                size="xs"
                variant="plain"
                icon={icon}
                aria-label={label}
                aria-pressed={active}
                disabled={disabled}
                className={classNames(active && 'bg-primary-subtle text-primary')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={onClick}
            />
        </Tooltip>
    )
}

const Separator = () => <span aria-hidden className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

/** The visual editor's toolbar: everyday formatting, an Insert menu, and table tools inside tables */
export default function VisualToolbar({ editor, onImage, onVideo }: VisualToolbarProps) {
    const [linkOpen, setLinkOpen] = useState(false)
    const state = useEditorState({
        editor,
        selector: ({ editor: e }) => ({
            style: (e.isActive('heading', { level: 1 })
                ? 1
                : e.isActive('heading', { level: 2 })
                  ? 2
                  : e.isActive('heading', { level: 3 })
                    ? 3
                    : 'paragraph') as TextStyle,
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            link: e.isActive('link'),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            code: e.isActive('code'),
            table: e.isActive('table'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
        }),
    })
    const chain = () => editor.chain().focus()

    const setStyle = (style: TextStyle) =>
        style === 'paragraph' ? chain().setParagraph().run() : chain().setHeading({ level: style }).run()

    const insertCallout = (type: string) => {
        const { selection } = editor.state
        const block = selection.$from.parent
        // Selected text, or an empty line: turn it into the box
        if (
            (!selection.empty || (block.type.name === 'paragraph' && !block.textContent)) &&
            chain().wrapIn('callout', { type }).run()
        ) {
            return
        }
        // Otherwise add a new empty box below the current block, with the cursor inside it
        const after = selection.$from.depth > 0 ? selection.$from.after(1) : selection.from
        chain()
            .insertContentAt(after, { type: 'callout', attrs: { type }, content: [{ type: 'paragraph' }] })
            .setTextSelection(after + 2)
            .run()
    }

    return (
        <div
            role="toolbar"
            aria-label="Formatting"
            className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
        >
            <Dropdown
                placement="bottom-start"
                renderTitle={
                    <Button type="button" size="xs" variant="plain" icon={<ExpandIcon />} iconAlignment="end">
                        {textStyleLabel[state.style]}
                    </Button>
                }
            >
                {(['paragraph', 1, 2, 3] as TextStyle[]).map((style) => (
                    <Dropdown.Item key={style} eventKey={String(style)} onClick={() => setStyle(style)}>
                        <span
                            className={classNames(
                                style === 1 && 'text-lg font-bold',
                                style === 2 && 'text-base font-bold',
                                style === 3 && 'font-semibold',
                            )}
                        >
                            {textStyleLabel[style]}
                        </span>
                    </Dropdown.Item>
                ))}
            </Dropdown>
            <Separator />
            <ToolButton
                label="Bold (Ctrl+B)"
                icon={<BoldIcon />}
                active={state.bold}
                onClick={() => chain().toggleBold().run()}
            />
            <ToolButton
                label="Italic (Ctrl+I)"
                icon={<ItalicIcon />}
                active={state.italic}
                onClick={() => chain().toggleItalic().run()}
            />
            <ToolButton
                label={state.link ? 'Remove link' : 'Link'}
                icon={<LinkInsertIcon />}
                active={state.link}
                onClick={() => (state.link ? chain().unsetLink().run() : setLinkOpen(true))}
            />
            <Separator />
            <ToolButton
                label="Bulleted list"
                icon={<BulletListIcon />}
                active={state.bullet}
                onClick={() => chain().toggleBulletList().run()}
            />
            <ToolButton
                label="Numbered list"
                icon={<NumberedListIcon />}
                active={state.ordered}
                onClick={() => chain().toggleOrderedList().run()}
            />
            <ToolButton
                label="Quote"
                icon={<QuoteIcon />}
                active={state.quote}
                onClick={() => chain().toggleBlockquote().run()}
            />
            <ToolButton
                label="Code"
                icon={<CodeIcon />}
                active={state.code}
                onClick={() => chain().toggleCode().run()}
            />
            <Separator />
            <Dropdown
                placement="bottom-start"
                renderTitle={
                    <Button type="button" size="xs" variant="solid" icon={<AddIcon />}>
                        Insert
                    </Button>
                }
            >
                <Dropdown.Item eventKey="image" onClick={onImage}>
                    <ImageIcon className="mr-2 inline" aria-hidden /> Image
                </Dropdown.Item>
                <Dropdown.Item eventKey="video" onClick={onVideo}>
                    <VideoIcon className="mr-2 inline" aria-hidden /> Video (YouTube or Vimeo)
                </Dropdown.Item>
                {CALLOUT_TYPES.map((type) => (
                    <Dropdown.Item key={type} eventKey={type} onClick={() => insertCallout(type)}>
                        <CalloutIcon className="mr-2 inline" aria-hidden /> {calloutLabel[type]} box
                    </Dropdown.Item>
                ))}
                <Dropdown.Item
                    eventKey="table"
                    onClick={() => chain().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
                >
                    <TableIcon className="mr-2 inline" aria-hidden /> Table
                </Dropdown.Item>
                <Dropdown.Item eventKey="divider" onClick={() => chain().setHorizontalRule().run()}>
                    <DividerIcon className="mr-2 inline" aria-hidden /> Divider line
                </Dropdown.Item>
            </Dropdown>
            {state.table && (
                <>
                    <Separator />
                    <Dropdown
                        placement="bottom-start"
                        renderTitle={
                            <Button type="button" size="xs" variant="plain" icon={<TableIcon />}>
                                Table
                            </Button>
                        }
                    >
                        <Dropdown.Item eventKey="row-after" onClick={() => chain().addRowAfter().run()}>
                            Add a row below
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="col-after" onClick={() => chain().addColumnAfter().run()}>
                            Add a column to the right
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="row-del" onClick={() => chain().deleteRow().run()}>
                            Remove this row
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="col-del" onClick={() => chain().deleteColumn().run()}>
                            Remove this column
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="table-del" onClick={() => chain().deleteTable().run()}>
                            <DeleteIcon className="mr-2 inline" aria-hidden /> Remove the table
                        </Dropdown.Item>
                    </Dropdown>
                </>
            )}
            <span className="ml-auto flex">
                <ToolButton
                    label="Undo (Ctrl+Z)"
                    icon={<span aria-hidden>↶</span>}
                    disabled={!state.canUndo}
                    onClick={() => chain().undo().run()}
                />
                <ToolButton
                    label="Redo (Ctrl+Y)"
                    icon={<span aria-hidden>↷</span>}
                    disabled={!state.canRedo}
                    onClick={() => chain().redo().run()}
                />
            </span>
            <LinkDialog
                isOpen={linkOpen}
                onClose={() => setLinkOpen(false)}
                onSave={(href) => {
                    const empty = editor.state.selection.empty
                    if (empty)
                        chain()
                            .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
                            .run()
                    else chain().extendMarkRange('link').setLink({ href }).run()
                }}
            />
        </div>
    )
}

function LinkDialog({
    isOpen,
    onClose,
    onSave,
}: {
    isOpen: boolean
    onClose: () => void
    onSave: (href: string) => void
}) {
    const [href, setHref] = useState('')
    const valid = /^(https?:\/\/|mailto:)\S+$/i.test(href.trim())
    const close = () => {
        setHref('')
        onClose()
    }
    return (
        <Dialog isOpen={isOpen} onClose={close} onRequestClose={close} width={460}>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    if (!valid) return
                    onSave(href.trim())
                    close()
                }}
            >
                <h5 className="mb-4 flex items-center gap-2">
                    <LinkInsertIcon aria-hidden /> Add a link
                </h5>
                <FormItem
                    label="Web address"
                    htmlFor="lesson-link"
                    invalid={!!href && !valid}
                    errorMessage="Use a full address starting with https://"
                >
                    <Input
                        id="lesson-link"
                        value={href}
                        onChange={(e) => setHref(e.target.value)}
                        placeholder="https://…"
                        autoFocus
                        autoComplete="off"
                    />
                </FormItem>
                <p className="-mt-3 mb-4 text-xs text-gray-500">
                    Select some words first to turn them into the link. Links open in a new tab for students.
                </p>
                <div className="flex justify-end gap-2">
                    <Button type="button" onClick={close}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" disabled={!valid}>
                        Add link
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
