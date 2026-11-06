import { describe, expect, it } from 'vitest'
import { isAllowedSignUpEmail, parseDomains } from './emailDomains'

describe('SIGNUP_EMAIL_DOMAINS', () => {
    it('accepts commas, semicolons and spaces between domains', () => {
        for (const setting of [
            'fpautomation.co, gmail.com',
            'fpautomation.co; gmail.com',
            'fpautomation.co gmail.com',
        ]) {
            expect(parseDomains(setting)).toEqual(['fpautomation.co', 'gmail.com'])
        }
        expect(parseDomains(' @FPAutomation.co ;; ')).toEqual(['fpautomation.co'])
    })

    it('lets anyone sign up when unset, and only the listed domains otherwise', () => {
        expect(isAllowedSignUpEmail('someone@example.com', '')).toBe(true)
        expect(isAllowedSignUpEmail('someone@example.com', undefined)).toBe(true)
        expect(isAllowedSignUpEmail('TheLinkology@Gmail.com', 'fpautomation.co; gmail.com')).toBe(true)
        expect(isAllowedSignUpEmail('someone@example.com', 'fpautomation.co; gmail.com')).toBe(false)
        expect(isAllowedSignUpEmail('someone@mail.gmail.com', 'gmail.com')).toBe(false)
    })
})
