'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import DiagramKindIcon from '../../diagram/DiagramKindIcon'
import { AddIcon, DeleteIcon, EditIcon, MoveLeftIcon, UploadIcon, diagramIcon } from '@/configs/icons.config'
import { apiCreateDiagramComponent, apiDeleteDiagramComponent, apiUpdateDiagramComponent } from '@/services/library'
import { uploadImage } from '@/services/media'
import { useDiagramComponentsStore } from '@/stores/LibraryStores'
import useDiagramComponents from '@/utils/hooks/useDiagramComponents'
import { IMAGE_ACCEPT } from '@/utils/fileTypes'
import { tryGetErrorMessage } from '@/utils/errors'
import classNames from '@/utils/classNames'
import {
    DIAGRAM_COLORS,
    DIAGRAM_COMPONENT_LIMITS,
    DIAGRAM_ICON_KEYS,
    DiagramComponentSchema,
    diagramColorLabel,
    diagramIconLabel,
    type DiagramComponent,
    type DiagramComponentInput,
} from '@/@types/library/DiagramComponent'

const FORM_ID = 'diagram-component-form'

interface DiagramComponentsDialogProps {
    isOpen: boolean
    onClose: () => void
}

/**
 * Manages the architecture designer's component types (shared by every diagram): add your own with a
 * name, colour and an icon or image; edit or delete any of them, built-in ones included. Nodes of a
 * deleted type stay on their diagrams with a plain grey look.
 */
export default function DiagramComponentsDialog({ isOpen, onClose }: DiagramComponentsDialogProps) {
    // null: the list; 'new' or a component: the form
    const [editing, setEditing] = useState<DiagramComponent | 'new' | null>(null)
    const [dirty, setDirty] = useState(false)

    const close = () => {
        if (editing && dirty && !window.confirm('Discard your changes to this component?')) return
        setEditing(null)
        setDirty(false)
        onClose()
    }

    const back = () => {
        if (dirty && !window.confirm('Discard your changes to this component?')) return
        setEditing(null)
        setDirty(false)
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={close}
            onRequestClose={close}
            width={760}
            contentClassName="pb-0"
            contentLabel="Diagram components"
        >
            {editing ? (
                <ComponentForm
                    key={editing === 'new' ? 'new' : editing.id}
                    component={editing === 'new' ? null : editing}
                    onDirtyChange={setDirty}
                    onDone={() => {
                        setEditing(null)
                        setDirty(false)
                    }}
                    onBack={back}
                />
            ) : (
                <ComponentList onNew={() => setEditing('new')} onEdit={setEditing} onClose={close} />
            )}
        </Dialog>
    )
}

// ── The list ──

interface ComponentListProps {
    onNew: () => void
    onEdit: (component: DiagramComponent) => void
    onClose: () => void
}

function ComponentList({ onNew, onEdit, onClose }: ComponentListProps) {
    const { components } = useDiagramComponents()
    const refresh = useDiagramComponentsStore((s) => s.refresh)
    const [deleting, setDeleting] = useState<DiagramComponent | null>(null)
    const [busy, setBusy] = useState(false)

    const remove = async () => {
        if (!deleting) return
        setBusy(true)
        try {
            await apiDeleteDiagramComponent(deleting.id)
            await refresh()
            toastSuccess(`${deleting.name} was deleted.`)
            setDeleting(null)
        } catch (error) {
            toastError('The component type couldn’t be deleted.', error)
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 pr-8">
                <div className="min-w-0">
                    <h4 className="mb-1">Diagram components</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        The component types in the palette, shared by every architecture diagram.
                    </p>
                </div>
                <Button size="sm" variant="solid" icon={<AddIcon />} onClick={onNew}>
                    New component
                </Button>
            </div>
            <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
                {components.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        No component types yet. Add the first one with New component.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {components.map((component) => (
                            <li key={component.id} className="flex items-center gap-3 py-2.5">
                                <DiagramKindIcon component={component} className="h-9 w-9 text-xl" />
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                        {component.name}
                                    </div>
                                    {component.description && (
                                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                            {component.description}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<EditIcon />}
                                    onClick={() => onEdit(component)}
                                    aria-label={`Edit ${component.name}`}
                                    title="Edit"
                                />
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<DeleteIcon />}
                                    onClick={() => setDeleting(component)}
                                    aria-label={`Delete ${component.name}`}
                                    title="Delete"
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="-mx-6 mt-4 flex justify-end border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <Button size="sm" onClick={onClose}>
                    Done
                </Button>
            </div>

            <ConfirmDialog
                isOpen={!!deleting}
                onClose={() => !busy && setDeleting(null)}
                type="danger"
                title={`Delete the component type “${deleting?.name ?? ''}”?`}
                confirmText="Delete type"
                onConfirm={() => void remove()}
                loading={busy}
            >
                It leaves the palette for everyone. Components of this type already on diagrams stay, with their names,
                connections and guidance, but show a plain grey look until someone chooses another type for them. This
                can’t be undone.
            </ConfirmDialog>
        </>
    )
}

// ── The form ──

const toFormValues = (component: DiagramComponent | null): DiagramComponentInput => ({
    name: component?.name ?? '',
    description: component?.description ?? '',
    color: component?.color ?? 'blue',
    icon: component?.icon ?? 'service',
    imageUrl: component?.imageUrl ?? '',
})

interface ComponentFormProps {
    /** null = a new type */
    component: DiagramComponent | null
    onDirtyChange: (dirty: boolean) => void
    onDone: () => void
    onBack: () => void
}

function ComponentForm({ component, onDirtyChange, onDone, onBack }: ComponentFormProps) {
    const id = useId()
    const refresh = useDiagramComponentsStore((s) => s.refresh)
    const form = useForm<DiagramComponentInput>({
        resolver: zodResolver(DiagramComponentSchema),
        defaultValues: toFormValues(component),
    })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form

    const onValid = async (input: DiagramComponentInput) => {
        try {
            const saved = component
                ? await apiUpdateDiagramComponent(component.id, input)
                : await apiCreateDiagramComponent(input)
            await refresh()
            toastSuccess(component ? `${saved.name} was saved.` : `${saved.name} was added to the palette.`)
            onDone()
        } catch (error) {
            toastError(
                component ? 'The component type couldn’t be saved.' : 'The component type couldn’t be added.',
                error,
            )
        }
    }

    return (
        <FormProvider {...form}>
            <DirtyWatcher onDirtyChange={onDirtyChange} />
            <div className="mb-4 flex items-center gap-2 pr-8">
                <Button
                    size="xs"
                    variant="plain"
                    icon={<MoveLeftIcon />}
                    onClick={onBack}
                    aria-label="Back to the components"
                    title="Back to the components"
                />
                <h4>{component ? `Edit ${component.name}` : 'New component'}</h4>
            </div>
            <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
                    <div className="grid gap-x-6 md:grid-cols-[minmax(0,1fr)_260px]">
                        <div>
                            <FormItem
                                label="Name"
                                htmlFor={`${id}-name`}
                                asterisk
                                invalid={!!errors.name}
                                errorMessage={errors.name?.message}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id={`${id}-name`}
                                            maxLength={DIAGRAM_COMPONENT_LIMITS.name}
                                            placeholder="e.g. Azure Function"
                                            autoComplete="off"
                                            invalid={!!errors.name}
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                            <FormItem
                                label="Description"
                                htmlFor={`${id}-description`}
                                invalid={!!errors.description}
                                errorMessage={errors.description?.message}
                            >
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id={`${id}-description`}
                                            textArea
                                            rows={2}
                                            maxLength={DIAGRAM_COMPONENT_LIMITS.description}
                                            placeholder="When to use it (shown in the palette and the legend)"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                            <ColorField />
                            <LookField />
                        </div>
                        <ComponentPreview />
                    </div>
                </div>
                <div className="-mx-6 mt-4 flex justify-end gap-2 border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                    <Button size="sm" type="button" onClick={onBack} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button size="sm" variant="solid" type="submit" loading={isSubmitting}>
                        {component ? 'Save' : 'Add component'}
                    </Button>
                </div>
            </Form>
        </FormProvider>
    )
}

/** Tells the dialog whether closing would lose changes */
function DirtyWatcher({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
    const {
        formState: { isDirty },
    } = useFormContext<DiagramComponentInput>()
    useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
    return null
}

function ColorField() {
    const id = useId()
    const { control } = useFormContext<DiagramComponentInput>()
    return (
        <Controller
            name="color"
            control={control}
            render={({ field }) => (
                <fieldset className="mb-6">
                    <legend className="form-label mb-2">Colour</legend>
                    <div className="flex flex-wrap gap-2">
                        {DIAGRAM_COLORS.map((color) => {
                            const checked = field.value === color
                            return (
                                <label
                                    key={color}
                                    className={classNames(
                                        'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
                                        `diagram-color-${color}`,
                                        checked ? 'border-gray-900 dark:border-gray-100' : 'border-transparent',
                                    )}
                                    title={diagramColorLabel[color]}
                                >
                                    <input
                                        type="radio"
                                        name={`${id}-color`}
                                        value={color}
                                        checked={checked}
                                        onChange={() => field.onChange(color)}
                                        className="sr-only"
                                        aria-label={diagramColorLabel[color]}
                                    />
                                    <span className="diagram-swatch h-5 w-5 rounded-full" aria-hidden />
                                </label>
                            )
                        })}
                    </div>
                </fieldset>
            )}
        />
    )
}

/** An icon from the set, or an image (uploaded, checked by the server, or an https link) */
function LookField() {
    const id = useId()
    const fileInput = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const {
        control,
        setValue,
        formState: { errors },
    } = useFormContext<DiagramComponentInput>()
    const imageUrl = useWatch<DiagramComponentInput, 'imageUrl'>({ name: 'imageUrl' })
    const [mode, setMode] = useState<'icon' | 'image'>(imageUrl ? 'image' : 'icon')

    const upload = async (file: File) => {
        setUploading(true)
        try {
            const media = await uploadImage(file)
            setValue('imageUrl', media.url, { shouldDirty: true, shouldValidate: true })
        } catch (error) {
            toastError(tryGetErrorMessage(error), error)
        } finally {
            setUploading(false)
        }
    }

    const chooseMode = (next: string) => {
        const value = next === 'image' ? 'image' : 'icon'
        setMode(value)
        // Back to the icon: the image goes (an image always wins over the icon)
        if (value === 'icon' && imageUrl) setValue('imageUrl', '', { shouldDirty: true, shouldValidate: true })
    }

    return (
        <div className="mb-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="form-label mb-0" id={`${id}-label`}>
                    Look
                </span>
                <Segment size="xs" value={mode} onChange={(value) => chooseMode(String(value))}>
                    <Segment.Item value="icon">Icon</Segment.Item>
                    <Segment.Item value="image">Image</Segment.Item>
                </Segment>
            </div>
            {mode === 'icon' ? (
                <Controller
                    name="icon"
                    control={control}
                    render={({ field }) => (
                        <div
                            className="grid grid-cols-6 gap-1.5 sm:grid-cols-9"
                            role="radiogroup"
                            aria-labelledby={`${id}-label`}
                        >
                            {DIAGRAM_ICON_KEYS.map((key) => {
                                const Icon = diagramIcon[key]
                                const checked = field.value === key
                                return (
                                    <label
                                        key={key}
                                        title={diagramIconLabel[key]}
                                        className={classNames(
                                            'flex h-9 cursor-pointer items-center justify-center rounded-lg border text-lg transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
                                            checked
                                                ? 'border-primary bg-primary-subtle text-primary'
                                                : 'border-gray-200 text-gray-600 hover:border-primary dark:border-gray-700 dark:text-gray-300',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name={`${id}-icon`}
                                            value={key}
                                            checked={checked}
                                            onChange={() => field.onChange(key)}
                                            className="sr-only"
                                            aria-label={diagramIconLabel[key]}
                                        />
                                        <Icon aria-hidden />
                                    </label>
                                )
                            })}
                        </div>
                    )}
                />
            ) : (
                <FormItem
                    label="Image"
                    htmlFor={`${id}-link`}
                    invalid={!!errors.imageUrl}
                    errorMessage={errors.imageUrl?.message}
                    className="mb-0"
                >
                    <div className="flex flex-wrap gap-2">
                        <input
                            ref={fileInput}
                            type="file"
                            accept={IMAGE_ACCEPT}
                            className="sr-only"
                            aria-label="Upload an image"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) void upload(file)
                                e.target.value = ''
                            }}
                        />
                        <Button
                            type="button"
                            size="sm"
                            icon={<UploadIcon />}
                            loading={uploading}
                            onClick={() => fileInput.current?.click()}
                        >
                            {imageUrl ? 'Replace image' : 'Upload image'}
                        </Button>
                        {imageUrl && (
                            <Button
                                type="button"
                                size="sm"
                                variant="plain"
                                icon={<DeleteIcon />}
                                onClick={() => setValue('imageUrl', '', { shouldDirty: true, shouldValidate: true })}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    <Controller
                        name="imageUrl"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id={`${id}-link`}
                                size="sm"
                                className="mt-2"
                                placeholder="…or paste an https:// link to the image"
                                autoComplete="off"
                                invalid={!!errors.imageUrl}
                                {...field}
                            />
                        )}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPEG, GIF or WebP up to 5 MB; a square logo or icon with a transparent background looks
                        best. Uploaded images also appear in downloaded PNG, JPG and PDF files; images linked from other
                        sites may be left out of downloads.
                    </p>
                </FormItem>
            )}
        </div>
    )
}

/** The component as it will look on the canvas */
function ComponentPreview() {
    const [name, color, icon, imageUrl] = useWatch<DiagramComponentInput, ['name', 'color', 'icon', 'imageUrl']>({
        name: ['name', 'color', 'icon', 'imageUrl'],
    })
    const validImage = DiagramComponentSchema.shape.imageUrl.safeParse(imageUrl ?? '').success ? imageUrl : ''
    return (
        <div className="mb-6" aria-live="polite">
            <div className="form-label mb-2">Preview</div>
            <div className="diagram-canvas flex items-center justify-center px-3 py-6">
                <div className={classNames('diagram-node', `diagram-color-${color}`)}>
                    <DiagramKindIcon component={{ color, icon, imageUrl: validImage ?? '' }} />
                    <div className="min-w-0 flex-1">
                        <div className="diagram-node-label">{name?.trim() || 'Component name'}</div>
                        <div className="diagram-node-subtitle">Subtitle</div>
                    </div>
                </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                A new component takes this name; rename each one on the canvas.
            </p>
        </div>
    )
}
