/**
 * Sign-up can be limited to company email domains with SIGNUP_EMAIL_DOMAINS (comma-separated, e.g.
 * "contoso.com, contoso.co.uk"). Unset or empty means anyone may sign up (as a viewer).
 */
export function parseDomains(setting: string | null | undefined): string[] {
    return (setting ?? '')
        .split(',')
        .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean)
}

export function isAllowedSignUpEmail(email: string, setting: string | null | undefined) {
    const domains = parseDomains(setting)
    if (!domains.length) return true
    const domain = email.trim().toLowerCase().split('@')[1] ?? ''
    return domains.includes(domain)
}
