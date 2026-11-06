/** Only same-site paths may be used as a destination after signing in (no open redirects) */
export const isSafeReturnPath = (value: string | null | undefined): value is string =>
    !!value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') && value.length <= 500

export const safeReturnPath = (value: string | null | undefined, fallback: string) =>
    isSafeReturnPath(value) ? value : fallback
