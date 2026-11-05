/*
 * Homework uploads: only document and image types that can't run code, checked by their actual bytes
 * (not just the name or the browser's claim). No HTML, SVG, scripts, archives or executables.
 */

export interface AllowedFileType {
    contentType: string
    label: string
}

export const ALLOWED_FILE_TYPES: Record<string, AllowedFileType> = {
    pdf: { contentType: 'application/pdf', label: 'PDF' },
    png: { contentType: 'image/png', label: 'PNG image' },
    jpg: { contentType: 'image/jpeg', label: 'JPEG image' },
    jpeg: { contentType: 'image/jpeg', label: 'JPEG image' },
    gif: { contentType: 'image/gif', label: 'GIF image' },
    webp: { contentType: 'image/webp', label: 'WebP image' },
    txt: { contentType: 'text/plain', label: 'Text file' },
    docx: {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        label: 'Word document',
    },
    pptx: {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        label: 'PowerPoint',
    },
    xlsx: { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
    odt: { contentType: 'application/vnd.oasis.opendocument.text', label: 'OpenDocument text' },
}

/** For the file picker's `accept` attribute */
export const UPLOAD_ACCEPT = Object.keys(ALLOWED_FILE_TYPES)
    .map((ext) => `.${ext}`)
    .join(',')

export const UPLOAD_TYPES_DESCRIPTION = 'PDF, Word, PowerPoint, Excel, OpenDocument, text, PNG, JPEG, GIF or WebP'

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
    signature.every((b, i) => bytes[offset + i] === b)

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))

/** The family a file's bytes belong to, or null if unrecognised */
export function sniffFileFamily(bytes: Uint8Array): 'pdf' | 'png' | 'jpeg' | 'gif' | 'webp' | 'zip' | 'text' | null {
    if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf' // %PDF-
    if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
    if (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a') return 'gif'
    if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp'
    if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return 'zip' // Office Open XML / OpenDocument
    // Plain text: valid UTF-8, no NUL bytes, and nothing that looks like markup a browser might render
    if (bytes.length > 0 && !bytes.includes(0)) {
        try {
            const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(0, 4096))
            if (!/^\s*<(?:!doctype|html|svg|script|\?xml)/i.test(text)) return 'text'
        } catch {
            return null
        }
    }
    return null
}

const FAMILY_FOR_EXTENSION: Record<string, ReturnType<typeof sniffFileFamily>> = {
    pdf: 'pdf',
    png: 'png',
    jpg: 'jpeg',
    jpeg: 'jpeg',
    gif: 'gif',
    webp: 'webp',
    txt: 'text',
    docx: 'zip',
    pptx: 'zip',
    xlsx: 'zip',
    odt: 'zip',
}

export const fileExtension = (fileName: string) => fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ''

/** A safe name for storage paths and downloads: letters, numbers, dot, dash, underscore; max 100 chars */
export function safeFileName(fileName: string) {
    const ext = fileExtension(fileName)
    const base = fileName
        .replace(/\.[^.]*$/, '')
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '')
        .slice(0, 80)
    return `${base || 'file'}${ext ? `.${ext}` : ''}`
}

export type FileCheck = { ok: true; contentType: string; extension: string } | { ok: false; reason: string }

/** Allowed extension AND bytes that match it. The server uses the returned content type, not the browser's. */
export function checkUpload(fileName: string, bytes: Uint8Array, maxBytes: number): FileCheck {
    if (bytes.length === 0) return { ok: false, reason: 'That file is empty.' }
    if (bytes.length > maxBytes) {
        return { ok: false, reason: `That file is too big. The limit is ${Math.round(maxBytes / 1024 / 1024)} MB.` }
    }
    const extension = fileExtension(fileName)
    const allowed = ALLOWED_FILE_TYPES[extension]
    if (!allowed) return { ok: false, reason: `That type of file can’t be uploaded. Use ${UPLOAD_TYPES_DESCRIPTION}.` }
    if (sniffFileFamily(bytes) !== FAMILY_FOR_EXTENSION[extension]) {
        return {
            ok: false,
            reason: `That file doesn’t look like a real .${extension} file. Try saving it again and re-uploading.`,
        }
    }
    return { ok: true, contentType: allowed.contentType, extension }
}

// ── Lesson images ──

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
export const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(',')
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Lesson images: PNG, JPEG, GIF or WebP only (checked by their bytes), up to 5 MB */
export function checkImageUpload(fileName: string, bytes: Uint8Array): FileCheck {
    if (!IMAGE_EXTENSIONS.includes(fileExtension(fileName))) {
        return { ok: false, reason: 'Only PNG, JPEG, GIF or WebP images can be added to lessons.' }
    }
    return checkUpload(fileName, bytes, MAX_IMAGE_BYTES)
}
