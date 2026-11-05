/** "Fabric, gateway , RLS" → ['fabric', 'gateway', 'rls'] (lower-case, de-duplicated, no empties) */
export function parseTagsText(text: string): string[] {
    return [
        ...new Set(
            text
                .split(',')
                .map((t) => t.trim().toLowerCase().replace(/^#/, '').replace(/[<>]/g, '').slice(0, 40))
                .filter(Boolean),
        ),
    ]
}

export const tagsToText = (tags: string[]) => tags.join(', ')
