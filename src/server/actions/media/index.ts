import 'server-only'
import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { toAppError, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { createMediaUploadUrl, downloadMedia, getMediaSignedUrl, removeMedia } from '@/server/data/supabase/storage'
import {
    ALLOWED_FILE_TYPES,
    checkImageUpload,
    fileExtension,
    IMAGE_EXTENSIONS,
    MAX_IMAGE_BYTES,
    safeFileName,
} from '@/utils/fileTypes'
import { getMediaUrl } from '@/utils/media'
import { DataError, NotFoundError } from '@/@types/errors'
import type { Tables } from '@/@types/supabase/database.types'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { ConfirmMediaUploadInput, KnowledgeMedia, PrepareMediaUploadInput } from '@/@types/media/KnowledgeMedia'

/*
 * Images for articles, library assets and BRDs: uploaded straight to private storage through a one-time
 * URL (Vercel's body limit), then checked by their bytes before they're kept. Viewing goes through
 * /api/media/[id], which requires a signed-in user and redirects to a short-lived signed URL.
 * Callers have already checked `knowledge.manage` or `requirements.manage` (the routes do).
 */

const mapMedia = (row: Tables<'knowledge_media'>): KnowledgeMedia => ({
    id: row.id,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    url: getMediaUrl(row.id),
    createdAt: new Date(row.created_at),
})

/** Each uploader writes to their own folder, so a confirm can only claim one's own upload */
const folder = (userId: string) => `${userId}/`

export async function getMediaLibrary(): Promise<KnowledgeMedia[]> {
    return unwrap(
        await supabaseAdmin().from('knowledge_media').select('*').order('created_at', { ascending: false }).limit(200),
        'load images',
    ).map(mapMedia)
}

/** Step 1: checks the name and size, returns a one-time upload URL for a path the server chooses */
export async function prepareMediaUpload(user: SessionUser, input: PrepareMediaUploadInput) {
    const extension = fileExtension(input.fileName)
    if (!IMAGE_EXTENSIONS.includes(extension)) {
        throw new DataError('Only PNG, JPEG, GIF or WebP images can be added.', 'INVALID_FILE')
    }
    if (input.sizeBytes > MAX_IMAGE_BYTES)
        throw new DataError('That image is too big. The limit is 5 MB.', 'FILE_TOO_BIG')
    const path = `${folder(user.id)}${randomUUID()}.${extension}`
    return {
        path,
        uploadUrl: await createMediaUploadUrl(path),
        contentType: ALLOWED_FILE_TYPES[extension].contentType,
    }
}

/** Step 2: reads the stored bytes back, keeps the image only if it really is one */
export async function confirmMediaUpload(user: SessionUser, input: ConfirmMediaUploadInput): Promise<KnowledgeMedia> {
    if (!input.path.startsWith(folder(user.id)) || input.path.includes('..')) {
        throw new DataError('That upload isn’t yours.', 'INVALID_FILE')
    }
    const bytes = await downloadMedia(input.path)
    if (!bytes) throw new DataError('The upload didn’t arrive. Please try again.', 'UPLOAD_MISSING')
    const fileName = safeFileName(input.fileName)
    const checked = checkImageUpload(fileName, bytes)
    if (!checked.ok) {
        await removeMedia([input.path])
        throw new DataError(checked.reason, 'INVALID_FILE')
    }
    const inserted = await supabaseAdmin()
        .from('knowledge_media')
        .insert({
            storage_path: input.path,
            file_name: fileName,
            content_type: checked.contentType,
            size_bytes: bytes.length,
            uploaded_by: user.id,
        })
        .select('*')
        .single()
    if (inserted.error) {
        if (inserted.error.code !== '23505') await removeMedia([input.path])
        throw toAppError(inserted.error, 'save the image')
    }
    return mapMedia(inserted.data)
}

/** A short-lived link to the image (any signed-in user; the route checks the session) */
export async function getMediaViewUrl(mediaId: string) {
    const media = unwrapMaybe(
        await supabaseAdmin().from('knowledge_media').select('storage_path').eq('id', mediaId).maybeSingle(),
        'find the image',
    )
    if (!media) throw new NotFoundError('That image doesn’t exist.', 'MEDIA_NOT_FOUND')
    return getMediaSignedUrl(media.storage_path)
}
