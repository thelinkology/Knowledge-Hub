'use client'

import { useId, useRef, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tabs from '@/components/ui/Tabs'
import { FormItem } from '@/components/ui/Form'
import { toastError } from '@/components/ui/toast/toast'
import Loading from '@/components/shared/Loading'
import EmptyState from '@/components/shared/EmptyState'
import { ImageIcon, UploadIcon } from '@/configs/icons.config'
import { uploadImage, useSWRMediaLibrary } from '@/services/media'
import { IMAGE_ACCEPT } from '@/utils/fileTypes'
import { imageMarkdown } from '@/utils/media'
import { tryGetErrorMessage } from '@/utils/errors'
import classNames from '@/utils/classNames'

interface ImageDialogProps {
    isOpen: boolean
    onClose: () => void
    onInsert: (markdown: string) => void
}

type Source = 'upload' | 'library' | 'link'

/** Add an image: upload one (checked on the server), reuse one from the image library, or link to one */
export default function ImageDialog({ isOpen, onClose, onInsert }: ImageDialogProps) {
    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={620}>
            {isOpen && <ImageForm onClose={onClose} onInsert={onInsert} />}
        </Dialog>
    )
}

function ImageForm({ onClose, onInsert }: Omit<ImageDialogProps, 'isOpen'>) {
    const id = useId()
    const fileInput = useRef<HTMLInputElement>(null)
    const [source, setSource] = useState<Source>('upload')
    const [src, setSrc] = useState('')
    const [link, setLink] = useState('')
    const [alt, setAlt] = useState('')
    const [caption, setCaption] = useState('')
    const [uploading, setUploading] = useState(false)
    const library = useSWRMediaLibrary(source === 'library')

    const linkValid = /^https:\/\/\S+$/i.test(link.trim())
    const chosen = source === 'link' ? (linkValid ? link.trim() : '') : src

    const upload = async (file: File) => {
        setUploading(true)
        try {
            const media = await uploadImage(file)
            setSrc(media.url)
            if (!alt) setAlt(file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '))
            void library.mutate()
        } catch (error) {
            toastError(tryGetErrorMessage(error), error)
        } finally {
            setUploading(false)
        }
    }

    const insert = () => {
        onInsert(imageMarkdown(chosen, alt, caption))
        onClose()
    }

    return (
        <div>
            <h5 className="mb-4 flex items-center gap-2">
                <ImageIcon aria-hidden /> Add an image
            </h5>
            <Tabs value={source} onChange={(v) => setSource(v as Source)} variant="pill">
                <Tabs.TabList className="mb-4">
                    <Tabs.TabNav value="upload">Upload</Tabs.TabNav>
                    <Tabs.TabNav value="library">Image library</Tabs.TabNav>
                    <Tabs.TabNav value="link">Link</Tabs.TabNav>
                </Tabs.TabList>
                <Tabs.TabContent value="upload">
                    <div className="mb-4 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
                        <input
                            ref={fileInput}
                            id={`${id}-file`}
                            type="file"
                            accept={IMAGE_ACCEPT}
                            className="sr-only"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) void upload(file)
                                e.target.value = ''
                            }}
                        />
                        <Button icon={<UploadIcon />} loading={uploading} onClick={() => fileInput.current?.click()}>
                            {src ? 'Choose a different image' : 'Choose an image'}
                        </Button>
                        <p className="mt-2 text-xs text-gray-500">
                            PNG, JPEG, GIF or WebP, up to 5 MB. Only signed-in people can see it. Tip: you can also
                            paste or drop an image straight into the editor.
                        </p>
                    </div>
                </Tabs.TabContent>
                <Tabs.TabContent value="library">
                    {library.isLoading ? (
                        <Loading loading />
                    ) : !library.data?.length ? (
                        <EmptyState title="No images yet" description="Images you upload appear here." />
                    ) : (
                        <ul className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                            {library.data.map((media) => (
                                <li key={media.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSrc(media.url)}
                                        aria-pressed={src === media.url}
                                        className={classNames(
                                            'block aspect-square w-full overflow-hidden rounded-lg border-2',
                                            src === media.url ? 'border-primary' : 'border-transparent',
                                        )}
                                        title={media.fileName}
                                    >
                                        {}
                                        <img
                                            src={media.url}
                                            alt={media.fileName}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Tabs.TabContent>
                <Tabs.TabContent value="link">
                    <FormItem
                        label="Image address"
                        htmlFor={`${id}-link`}
                        invalid={!!link && !linkValid}
                        errorMessage="Use a full https:// link to an image"
                    >
                        <Input
                            id={`${id}-link`}
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://…/picture.png"
                            autoComplete="off"
                        />
                    </FormItem>
                    <p className="-mt-3 mb-4 text-xs text-gray-500">
                        The image loads from that website each time. Uploading is more reliable.
                    </p>
                </Tabs.TabContent>
            </Tabs>

            {chosen && (
                <div className="my-4 flex justify-center rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
                    {}
                    <img src={chosen} alt="" className="max-h-48 rounded-lg" />
                </div>
            )}

            <FormItem label="Describe the image" htmlFor={`${id}-alt`} asterisk>
                <Input
                    id={`${id}-alt`}
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder="e.g. Data flow from ERP to the Fabric lakehouse"
                    maxLength={200}
                />
            </FormItem>
            <p className="-mt-3 mb-4 text-xs text-gray-500">Read aloud to people who use a screen reader.</p>
            <FormItem label="Caption (optional)" htmlFor={`${id}-caption`}>
                <Input
                    id={`${id}-caption`}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Shown under the image"
                    maxLength={200}
                />
            </FormItem>

            <div className="mt-2 flex justify-end gap-2">
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="solid" disabled={!chosen || !alt.trim() || uploading} onClick={insert}>
                    Insert image
                </Button>
            </div>
        </div>
    )
}
