import 'server-only'
import { supabaseAdmin } from './admin'
import { ServiceUnavailableError } from '@/@types/errors'

/**
 * Images used in articles, library assets and BRDs live in the private 'knowledge-media' bucket
 * (migration 20261105000100). The server decides every path and checks access; browsers upload and
 * view only through short-lived signed URLs.
 */
export const KNOWLEDGE_MEDIA_BUCKET = 'knowledge-media'
/** Images are viewed for as long as an article is open, so their links last an hour */
const MEDIA_URL_SECONDS = 60 * 60

/**
 * A one-time URL the browser uploads the file to directly (large files never pass through our
 * functions, which have a small body limit on Vercel). The path is chosen by the server.
 */
export async function createMediaUploadUrl(path: string) {
    const { data, error } = await supabaseAdmin().storage.from(KNOWLEDGE_MEDIA_BUCKET).createSignedUploadUrl(path)
    if (error || !data) {
        console.error('[storage] media upload url', error)
        throw new ServiceUnavailableError('Uploads aren’t available right now. Please try again.', 'UPLOAD_FAILED')
    }
    return data.signedUrl
}

/** The uploaded bytes (to check the file really is what its name says), or null if it isn't there */
export async function downloadMedia(path: string): Promise<Uint8Array | null> {
    const { data, error } = await supabaseAdmin().storage.from(KNOWLEDGE_MEDIA_BUCKET).download(path)
    if (error || !data) return null
    return new Uint8Array(await data.arrayBuffer())
}

export async function removeMedia(paths: string[]) {
    if (!paths.length) return
    const { error } = await supabaseAdmin().storage.from(KNOWLEDGE_MEDIA_BUCKET).remove(paths)
    if (error) console.error('[storage] remove media', error)
}

export async function getMediaSignedUrl(path: string) {
    const { data, error } = await supabaseAdmin()
        .storage.from(KNOWLEDGE_MEDIA_BUCKET)
        .createSignedUrl(path, MEDIA_URL_SECONDS)
    if (error || !data) {
        console.error('[storage] media url', error)
        throw new ServiceUnavailableError('The image couldn’t be loaded right now.', 'MEDIA_FAILED')
    }
    return data.signedUrl
}
