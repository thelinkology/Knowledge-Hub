import type { NavigationIconKey } from '@/configs/icons.config'

/** Article types, in the spirit of Microsoft Learn's content types */
export const ARTICLE_KINDS = ['concept', 'how_to', 'tutorial', 'reference', 'troubleshooting', 'best_practice'] as const
export type ArticleKind = (typeof ARTICLE_KINDS)[number]

export const articleKindLabel: Record<ArticleKind, string> = {
    concept: 'Concept',
    how_to: 'How-to guide',
    tutorial: 'Tutorial',
    reference: 'Reference',
    troubleshooting: 'Troubleshooting',
    best_practice: 'Best practice',
}

export const articleKindDescription: Record<ArticleKind, string> = {
    concept: 'Explains what something is and why it matters.',
    how_to: 'Steps to complete one task.',
    tutorial: 'A guided, end-to-end walkthrough.',
    reference: 'Facts to look up: settings, fields, limits.',
    troubleshooting: 'Symptoms, causes and fixes.',
    best_practice: 'What we recommend, and why.',
}

export const articleKindIcon: Record<ArticleKind, NavigationIconKey> = {
    concept: 'concept',
    how_to: 'howTo',
    tutorial: 'tutorial',
    reference: 'reference',
    troubleshooting: 'troubleshooting',
    best_practice: 'bestPractice',
}
