/**
 * Sign-up can be limited to company email domains with SIGNUP_EMAIL_DOMAINS, separated by commas,
 * semicolons or spaces (e.g. "contoso.com, contoso.co.uk" or "contoso.com; gmail.com"). Unset or empty
 * means anyone may sign up (as a viewer).
 */
export function parseDomains(setting: string | null | undefined): string[] {
    return (setting ?? '')
        .split(/[,;\s]+/)
        .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean)
}

export function isAllowedSignUpEmail(email: string, setting: string | null | undefined) {
    const domains = parseDomains(setting)
    if (!domains.length) return true
    const domain = email.trim().toLowerCase().split('@')[1] ?? ''
    return domains.includes(domain)
}
