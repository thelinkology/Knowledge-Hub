/**
 * Detects whether the current browser likely supports inline PDF rendering.
 * Most modern desktop browsers (Chrome, Edge, Firefox, Safari) have built-in
 * PDF viewers. Mobile browsers and some niche browsers may not.
 */
export default function supportsPDFPreview(): boolean {
    if (typeof window === 'undefined') {
        return false
    }
    if (typeof navigator === 'undefined') {
        return false
    }

    // Check if the browser has a PDF viewer plugin registered
    if (navigator.pdfViewerEnabled !== undefined) {
        return navigator.pdfViewerEnabled
    }

    // Fallback: check MIME type support
    const pdfMime = navigator.mimeTypes?.namedItem?.('application/pdf')
    if (pdfMime) return true

    // Heuristic: common desktop browsers with built-in PDF viewers
    const ua = navigator.userAgent
    const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua)
    const isEdge = /Edg\//.test(ua)
    const isFirefox = /Firefox\//.test(ua)
    const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua)

    // Mobile browsers generally don't support inline PDF
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua)
    if (isMobile) return false

    return isChrome || isEdge || isFirefox || isSafari
}
