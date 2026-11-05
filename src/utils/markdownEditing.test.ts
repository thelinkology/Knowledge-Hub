import { describe, expect, it } from 'vitest'
import { insertBlock, insertInline, prefixLines, wrapSelection } from './markdownEditing'

describe('lesson editor text edits', () => {
    it('wraps the selection, or inserts a selected placeholder', () => {
        expect(wrapSelection({ value: 'a big cat', start: 2, end: 5 }, '**', '**', 'bold')).toEqual({
            value: 'a **big** cat',
            selectionStart: 4,
            selectionEnd: 7,
        })
        expect(wrapSelection({ value: 'x', start: 1, end: 1 }, '_', '_', 'italic')).toEqual({
            value: 'x_italic_',
            selectionStart: 2,
            selectionEnd: 8,
        })
    })

    it('unwraps when pressed again', () => {
        expect(wrapSelection({ value: 'a **big** cat', start: 4, end: 7 }, '**', '**', 'bold').value).toBe('a big cat')
    })

    it('prefixes every selected line and replaces an existing prefix', () => {
        const value = 'one\ntwo\nthree'
        expect(prefixLines({ value, start: 0, end: 7 }, '- ').value).toBe('- one\n- two\nthree')
        expect(prefixLines({ value: '- one\n- two', start: 0, end: 11 }, (i) => `${i + 1}. `).value).toBe(
            '1. one\n2. two',
        )
        expect(prefixLines({ value: '# Title', start: 3, end: 3 }, '## ').value).toBe('## Title')
    })

    it('puts blocks on their own lines and selects the part to edit', () => {
        const edit = insertBlock({ value: 'Intro', start: 5, end: 5 }, '> [!TIP]\n> Your tip', 'Your tip')
        expect(edit.value).toBe('Intro\n\n> [!TIP]\n> Your tip\n')
        expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe('Your tip')
        expect(insertBlock({ value: '', start: 0, end: 0 }, '---').value).toBe('---\n')
    })

    it('inserts inline text at the cursor', () => {
        expect(insertInline({ value: 'ab', start: 1, end: 1 }, '[✦](secret:KEY)').value).toBe('a[✦](secret:KEY)b')
    })
})
