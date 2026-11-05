'use client'

import { useId, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import VideoEmbed from '@/components/shared/markdown/VideoEmbed'
import { VideoIcon } from '@/configs/icons.config'
import { parseVideoUrl, videoMarkdown } from '@/utils/media'

interface VideoDialogProps {
    isOpen: boolean
    onClose: () => void
    onInsert: (markdown: string) => void
}

/** Add a YouTube or Vimeo video by its link (videos aren't uploaded) */
export default function VideoDialog({ isOpen, onClose, onInsert }: VideoDialogProps) {
    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={620}>
            {isOpen && <VideoForm onClose={onClose} onInsert={onInsert} />}
        </Dialog>
    )
}

function VideoForm({ onClose, onInsert }: Omit<VideoDialogProps, 'isOpen'>) {
    const id = useId()
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const video = parseVideoUrl(url)

    return (
        <div>
            <h5 className="mb-4 flex items-center gap-2">
                <VideoIcon aria-hidden /> Add a video
            </h5>
            <FormItem
                label="YouTube or Vimeo link"
                htmlFor={`${id}-url`}
                invalid={!!url.trim() && !video}
                errorMessage="That isn’t a YouTube or Vimeo video link. Copy it from the video’s Share button."
            >
                <Input
                    id={`${id}-url`}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    autoComplete="off"
                    autoFocus
                />
            </FormItem>
            <p className="-mt-3 mb-4 text-xs text-gray-500">
                A link with a start time (…?t=90) starts the video there.
            </p>
            <FormItem label="Title" htmlFor={`${id}-title`}>
                <Input
                    id={`${id}-title`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Acterys write-back walkthrough (6 min)"
                    maxLength={150}
                />
            </FormItem>
            {video && (
                <div className="mb-4">
                    <p className="mb-1 text-xs font-semibold text-gray-500">What readers will see</p>
                    <VideoEmbed key={video.embedUrl} video={video} title={title} />
                </div>
            )}
            <p className="mb-4 text-xs text-gray-500">
                Nothing loads from YouTube or Vimeo until someone presses play, and YouTube videos use its
                privacy-enhanced player.
            </p>
            <div className="flex justify-end gap-2">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="solid"
                    disabled={!video}
                    onClick={() => {
                        onInsert(videoMarkdown(url, title))
                        onClose()
                    }}
                >
                    Insert video
                </Button>
            </div>
        </div>
    )
}
