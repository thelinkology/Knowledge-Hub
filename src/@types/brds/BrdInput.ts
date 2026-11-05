import type { Answers } from '@/@types/intake/Intake'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { IntakeRule } from '@/@types/intake/IntakeRule'
import type { AssetKind } from '@/@types/library/Asset'
import type { Product } from '@/@types/products/Product'
import type { Audience } from '@/@types/shared/PublishStatusOptions'

/** A knowledge article a BRD links to */
export interface BrdArticleLink {
    id: string
    title: string
    summary: string
    audience: Audience
}

/** A library asset a BRD links to (url = where it lives outside the hub, may be '') */
export interface BrdAssetLink {
    id: string
    title: string
    summary: string
    kind: AssetKind
    url: string
}

/**
 * Everything utils/brd.ts needs to write a BRD. The server assembles it (published content only) and the
 * generator decides what each audience may see.
 */
export interface BrdInput {
    client: { name: string; industry: string; summary: string }
    intake: { title: string; answers: Answers; notes: string }
    /** Products in scope, in their configured order */
    products: Pick<Product, 'id' | 'name' | 'description' | 'milestoneTemplate'>[]
    /** The visible questions (utils/intakeRules visibleQuestions), in order */
    questions: IntakeQuestion[]
    /** The matched rules (utils/intakeRules evaluateRules), in order */
    rules: IntakeRule[]
    articles: BrdArticleLink[]
    assets: BrdAssetLink[]
    generatedAt: Date
    /** Base for links to the hub, e.g. https://hub.example.com (no trailing slash needed) */
    appUrl: string
}
