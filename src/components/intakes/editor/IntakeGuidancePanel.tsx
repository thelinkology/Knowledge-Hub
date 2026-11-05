'use client'

import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import MarkdownContent from '@/components/shared/MarkdownContent'
import { ProductTag } from '@/components/shared/KnowledgeTags'
import navigationIcon, {
    BestPracticeIcon,
    ExternalLinkIcon,
    GotchaIcon,
    SuccessIcon,
    WarningIcon,
} from '@/configs/icons.config'
import { getArticlePath, getAssetPath } from '@/configs/app.config'
import classNames from '@/utils/classNames'
import { ruleKindLabel, ruleKindTagClass, type IntakeRule, type RuleKind } from '@/@types/intake/IntakeRule'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { RuleLinkTitles } from '@/@types/intake/IntakeEditorExtras'
import type { Product } from '@/@types/products/Product'

interface IntakeGuidancePanelProps {
    /** The rules that currently apply (evaluateRules) */
    matched: IntakeRule[]
    links: RuleLinkTitles
    products: Product[]
    /** Required visible questions without an answer */
    missing: IntakeQuestion[]
    onFocusQuestion: (key: string) => void
    className?: string
}

const KIND_GROUPS: { kind: RuleKind; title: string; icon: React.ReactNode; iconClass: string }[] = [
    { kind: 'gotcha', title: 'Gotchas', icon: <GotchaIcon aria-hidden />, iconClass: 'text-warning' },
    {
        kind: 'best_practice',
        title: 'Best practices',
        icon: <BestPracticeIcon aria-hidden />,
        iconClass: 'text-success',
    },
]

function RuleCard({ rule, links, products }: { rule: IntakeRule; links: RuleLinkTitles; products: Product[] }) {
    const articles = links.articles.filter((a) => rule.articleIds.includes(a.id))
    const assets = links.assets.filter((a) => rule.assetIds.includes(a.id))
    return (
        <li className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Tag className={ruleKindTagClass[rule.kind]}>{ruleKindLabel[rule.kind]}</Tag>
                <ProductTag productId={rule.productId} products={products} />
                <span className="text-xs text-gray-500">
                    {rule.showToCustomer ? 'In the customer BRD' : 'Internal only'}
                </span>
            </div>
            <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{rule.title}</h4>
            <MarkdownContent className="text-sm">{rule.guidance}</MarkdownContent>
            {(articles.length > 0 || assets.length > 0) && (
                <ul className="mt-2 space-y-1 text-sm" aria-label={`Related to ${rule.title}`}>
                    {articles.map((article) => (
                        <li key={article.id}>
                            <a
                                href={getArticlePath(article.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-primary hover:underline"
                            >
                                <span aria-hidden>{navigationIcon.article}</span>
                                {article.title}
                                <ExternalLinkIcon aria-hidden className="text-xs" />
                                <span className="sr-only">(article, opens in a new tab)</span>
                            </a>
                        </li>
                    ))}
                    {assets.map((asset) => (
                        <li key={asset.id}>
                            <a
                                href={getAssetPath(asset.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-primary hover:underline"
                            >
                                <span aria-hidden>{navigationIcon.library}</span>
                                {asset.title}
                                <ExternalLinkIcon aria-hidden className="text-xs" />
                                <span className="sr-only">(library asset, opens in a new tab)</span>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    )
}

/** The live side panel: gotchas and best practices for the current answers, and what's still missing */
export default function IntakeGuidancePanel({
    matched,
    links,
    products,
    missing,
    onFocusQuestion,
    className,
}: IntakeGuidancePanelProps) {
    return (
        <aside className={classNames('space-y-6', className)} aria-label="Guidance for this intake">
            <Card
                header={{
                    content: (
                        <span className="flex items-center gap-2">
                            Gotchas & best practices
                            <span
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                aria-live="polite"
                            >
                                {matched.length}
                                <span className="sr-only"> apply</span>
                            </span>
                        </span>
                    ),
                }}
            >
                {matched.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nothing flagged yet. As you answer, the IF/ELSE rules add gotchas (internal) and best practices
                        here, and they’re carried into the BRDs.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {KIND_GROUPS.map((group) => {
                            const rules = matched.filter((r) => r.kind === group.kind)
                            if (!rules.length) return null
                            return (
                                <section key={group.kind} aria-labelledby={`guidance-${group.kind}`}>
                                    <h3
                                        id={`guidance-${group.kind}`}
                                        className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                                    >
                                        <span className={classNames('text-lg', group.iconClass)}>{group.icon}</span>
                                        {group.title} ({rules.length})
                                    </h3>
                                    <ul className="space-y-3">
                                        {rules.map((rule) => (
                                            <RuleCard key={rule.id} rule={rule} links={links} products={products} />
                                        ))}
                                    </ul>
                                </section>
                            )
                        })}
                    </div>
                )}
            </Card>

            <Card header={{ content: 'Missing required answers' }}>
                {missing.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-success">
                        <SuccessIcon aria-hidden className="text-lg" />
                        All required questions are answered.
                    </p>
                ) : (
                    <>
                        <p className="mb-2 flex items-center gap-2 text-sm text-warning">
                            <WarningIcon aria-hidden className="text-lg" />
                            {missing.length} required question{missing.length === 1 ? '' : 's'} still need an answer.
                        </p>
                        <ul className="space-y-1">
                            {missing.map((question) => (
                                <li key={question.id}>
                                    <button
                                        type="button"
                                        onClick={() => onFocusQuestion(question.key)}
                                        className="text-left text-sm text-primary hover:underline focus-visible:underline"
                                    >
                                        {question.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Card>
        </aside>
    )
}
