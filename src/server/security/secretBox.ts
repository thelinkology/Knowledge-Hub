import 'server-only'
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { getSupabaseSecretKey } from '@/server/data/supabase/config'

/*
 * Encrypts small secrets the app must be able to show again (agent API keys) before they're stored.
 * AES-256-GCM with a key the database never sees: API_KEY_ENCRYPTION_KEY when set (recommended: a long
 * random string), otherwise derived from the Supabase secret key. Changing that key makes stored secrets
 * unreadable (they can't be shown again; the keys themselves keep working, since requests are checked
 * against their SHA-256).
 */

const VERSION = 'v1'
const INFO = 'knowledge-hub/stored-secrets/v1'

function encryptionKey(): Buffer | null {
    const material = process.env.API_KEY_ENCRYPTION_KEY || getSupabaseSecretKey()
    if (!material) return null
    return Buffer.from(hkdfSync('sha256', material, 'knowledge-hub', INFO, 32))
}

/** "v1.<iv>.<tag>.<ciphertext>" (base64url), or null when no encryption key is configured */
export function sealSecret(plain: string): string | null {
    const key = encryptionKey()
    if (!key) return null
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    return [VERSION, iv, cipher.getAuthTag(), ciphertext]
        .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
        .join('.')
}

/** The secret, or null when it can't be read (malformed, tampered with, or the encryption key changed) */
export function openSecret(sealed: string): string | null {
    const key = encryptionKey()
    const [version, iv, tag, ciphertext] = sealed.split('.')
    if (!key || version !== VERSION || !iv || !tag || !ciphertext) return null
    try {
        const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
        decipher.setAuthTag(Buffer.from(tag, 'base64url'))
        return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
    } catch {
        return null
    }
}
