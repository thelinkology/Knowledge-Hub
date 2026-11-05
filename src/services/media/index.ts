import useSWR, { type SWRConfiguration } from 'swr'
import api, { ApiError } from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import type { KnowledgeMedia } from '@/@types/media/KnowledgeMedia'

export const mediaUrl = '/media'

const ensureMedia = (m: KnowledgeMedia): KnowledgeMedia => ({ ...m, createdAt: tryParseDate(m.createdAt) as Date })

export const apiGetMediaLibrary = async () =>
    (await api.fetchJson<KnowledgeMedia[]>({ method: 'get', url: mediaUrl })).map(ensureMedia)

/** The shared image library (pass false to skip loading) */
export const useSWRMediaLibrary = (enabled: boolean, config?: SWRConfiguration<KnowledgeMedia[]>) =>
    useSWR(enabled ? mediaUrl : null, apiGetMediaLibrary, config)

/**
 * Uploads an image: the server checks the name and size and hands out a one-time URL, the file goes
 * straight to storage, then the server checks the stored bytes and keeps it. The only other place the
 * browser sends data is the signed URL the server just issued.
 */
export async function uploadImage(file: File): Promise<KnowledgeMedia> {
    const prepared = await api.fetchJson<{ path: string; uploadUrl: string; contentType: string }>({
        method: 'post',
        url: `${mediaUrl}/prepare`,
        data: { fileName: file.name, sizeBytes: file.size },
    })
    const response = await fetch(prepared.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': prepared.contentType, 'x-upsert': 'false' },
        body: file,
    })
    if (!response.ok) {
        throw new ApiError(
            'The image didn’t upload. Check your connection and try again.',
            response.status,
            'UPLOAD_FAILED',
            null,
        )
    }
    return ensureMedia(
        await api.fetchJson<KnowledgeMedia>({
            method: 'post',
            url: mediaUrl,
            data: { path: prepared.path, fileName: file.name },
        }),
    )
}
