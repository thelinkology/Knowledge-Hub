'use client'

import { useId } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import { AddIcon, DeleteIcon, InfoIcon, WarningIcon } from '@/configs/icons.config'
import { newDiagramId } from '@/utils/diagram'
import { DIAGRAM_LIMITS, type DiagramNote, type DiagramView } from '@/@types/library/Diagram'
import classNames from '@/utils/classNames'
import type { ViewUpdate } from '../../diagram/DiagramCanvas'

interface DiagramNotesEditorProps {
    view: DiagramView
    onViewChange: (update: ViewUpdate) => void
}

/** The view's notes under the canvas: banners that are edited in place (info or warning) */
export default function DiagramNotesEditor({ view, onViewChange }: DiagramNotesEditorProps) {
    const id = useId()

    const patch = (noteId: string, changes: Partial<DiagramNote>) =>
        onViewChange((current) => ({
            ...current,
            notes: current.notes.map((note) => (note.id === noteId ? { ...note, ...changes } : note)),
        }))

    const add = () =>
        onViewChange((current) =>
            current.notes.length >= DIAGRAM_LIMITS.notes
                ? current
                : { ...current, notes: [...current.notes, { id: newDiagramId('note'), tone: 'info', text: '' }] },
        )

    const remove = (noteId: string) =>
        onViewChange((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== noteId) }))

    return (
        <section aria-labelledby={`${id}-title`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 id={`${id}-title`} className="text-sm font-semibold">
                    Notes
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                        Caveats and alternatives shown under the diagram
                    </span>
                </h3>
                <Button size="xs" icon={<AddIcon />} onClick={add} disabled={view.notes.length >= DIAGRAM_LIMITS.notes}>
                    Add note
                </Button>
            </div>
            {view.notes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    No notes. Add one for a caveat such as “If the client has no Fabric, use Azure Data Factory”.
                </p>
            ) : (
                <ul className="space-y-2">
                    {view.notes.map((note, index) => (
                        <li key={note.id} className={classNames('diagram-note', `diagram-note-${note.tone}`)}>
                            {note.tone === 'warning' ? (
                                <WarningIcon className="diagram-note-icon" aria-hidden />
                            ) : (
                                <InfoIcon className="diagram-note-icon" aria-hidden />
                            )}
                            <div className="min-w-0 flex-1 space-y-2">
                                <label htmlFor={`${id}-${note.id}`} className="sr-only">
                                    Note {index + 1}
                                </label>
                                <Input
                                    id={`${id}-${note.id}`}
                                    textArea
                                    rows={2}
                                    size="sm"
                                    maxLength={DIAGRAM_LIMITS.note}
                                    value={note.text}
                                    placeholder="e.g. Fabric pipelines can load Azure SQL, but if the client has no Fabric, Azure Data Factory is the simpler fit."
                                    onChange={(e) => patch(note.id, { text: e.target.value })}
                                    className="bg-white text-sm dark:bg-gray-800"
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <Segment
                                        size="xs"
                                        value={note.tone}
                                        onChange={(value) =>
                                            patch(note.id, { tone: value === 'warning' ? 'warning' : 'info' })
                                        }
                                        aria-label={`Note ${index + 1} tone`}
                                    >
                                        <Segment.Item value="info">Info</Segment.Item>
                                        <Segment.Item value="warning">Warning</Segment.Item>
                                    </Segment>
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<DeleteIcon />}
                                        onClick={() => remove(note.id)}
                                        aria-label={`Remove note ${index + 1}`}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
