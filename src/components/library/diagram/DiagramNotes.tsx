import { InfoIcon, WarningIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { DiagramNote } from '@/@types/library/Diagram'

interface DiagramNotesProps {
    notes: DiagramNote[]
    className?: string
}

/** A view's notes as coloured banners under the canvas (warnings in amber, the rest in blue) */
export default function DiagramNotes({ notes, className }: DiagramNotesProps) {
    const visible = notes.filter((note) => note.text.trim())
    if (!visible.length) return null
    return (
        <ul className={classNames('space-y-2', className)} aria-label="Notes">
            {visible.map((note) => (
                <li key={note.id} className={classNames('diagram-note', `diagram-note-${note.tone}`)}>
                    {note.tone === 'warning' ? (
                        <WarningIcon className="diagram-note-icon" aria-label="Warning" role="img" />
                    ) : (
                        <InfoIcon className="diagram-note-icon" aria-label="Note" role="img" />
                    )}
                    <span className="min-w-0 whitespace-pre-line">{note.text}</span>
                </li>
            ))}
        </ul>
    )
}
