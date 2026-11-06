/** Query parameter carrying where to go after signing in */
export const RETURN_TO_URL_KEY = 'returnTo'

/** Pages reachable without signing in (the proxy lets these through) */
export const PUBLIC_PATHS = ['/login', '/welcome', '/forgot-password', '/reset-password', '/privacy', '/auth']

/** Usernames: 3–32 lower-case letters, digits, dots, dashes or underscores, starting with a letter or digit */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/

/**
 * Accounts made with a username only get the placeholder address <username>@NO_EMAIL_DOMAIN, because
 * Supabase Auth signs in by email. `.invalid` is reserved (RFC 2606), so no mail is ever delivered there.
 */
export const NO_EMAIL_DOMAIN = 'no-email.invalid'
