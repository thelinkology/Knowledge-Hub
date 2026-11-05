/*
 * Text edits for the lesson editor's toolbar. Each takes the text and the selection and returns the new
 * text and selection, so the editor stays a plain textarea (keyboard, screen readers and undo all work).
 */

export interface TextEdit {
    value: string
    selectionStart: number
    selectionEnd: number
}

interface Selection {
    value: string
    start: number
    end: number
}

/** **bold**, _italic_, `code`, [text](url): wraps the selection (or a placeholder, which ends up selected) */
export function wrapSelection(
    { value, start, end }: Selection,
    before: string,
    after: string,
    placeholder: string,
): TextEdit {
    const selected = value.slice(start, end) || placeholder
    // Toggle off when the selection is already wrapped
    if (
        value.slice(start - before.length, start) === before &&
        value.slice(end, end + after.length) === after &&
        end > start
    ) {
        const next = value.slice(0, start - before.length) + selected + value.slice(end + after.length)
        return { value: next, selectionStart: start - before.length, selectionEnd: end - before.length }
    }
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    return { value: next, selectionStart: start + before.length, selectionEnd: start + before.length + selected.length }
}

/** Headings, lists and quotes: prefixes every selected line (numbered lists count up) */
export function prefixLines({ value, start, end }: Selection, prefix: string | ((index: number) => string)): TextEdit {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const nextBreak = value.indexOf('\n', end)
    const lineEnd = end > start && value[end - 1] === '\n' ? end - 1 : nextBreak === -1 ? value.length : nextBreak
    const lines = value.slice(lineStart, lineEnd).split('\n')
    const make = (i: number) => (typeof prefix === 'function' ? prefix(i) : prefix)
    // Strip any heading/list/quote prefix first, so switching between them doesn't stack
    const replaced = lines.map((line, i) => make(i) + line.replace(/^(#{1,6} |[-*+] |\d+\. |> )/, '')).join('\n')
    const next = value.slice(0, lineStart) + replaced + value.slice(lineEnd)
    return { value: next, selectionStart: lineStart, selectionEnd: lineStart + replaced.length }
}

/** A block (image, video, table, callout, marker) on its own lines at the cursor; `select` is selected inside it */
export function insertBlock({ value, start, end }: Selection, block: string, select?: string): TextEdit {
    const before = value.slice(0, start)
    const after = value.slice(end)
    const lead = !before ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
    const trail = !after ? '\n' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
    const next = before + lead + block + trail + after
    const blockStart = before.length + lead.length
    const offset = select ? block.indexOf(select) : -1
    return offset >= 0
        ? { value: next, selectionStart: blockStart + offset, selectionEnd: blockStart + offset + select!.length }
        : { value: next, selectionStart: blockStart + block.length, selectionEnd: blockStart + block.length }
}

/** Plain text at the cursor (an inline marker), replacing the selection */
export function insertInline({ value, start, end }: Selection, text: string): TextEdit {
    const next = value.slice(0, start) + text + value.slice(end)
    return { value: next, selectionStart: start + text.length, selectionEnd: start + text.length }
}

export const TABLE_TEMPLATE = '| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |'
