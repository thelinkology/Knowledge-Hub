import { brdAudienceLabel } from '@/@types/brds/Brd'
import { assetKindLabel, type AssetKind } from '@/@types/library/Asset'
import {
    BRD_ASSUMPTIONS,
    BRD_BASE_MILESTONES,
    BRD_BUILD_ASSET_KINDS,
    BRD_DESIGN_ASSET_KINDS,
    BRD_GOAL_QUESTION_KEY,
    BRD_SIGN_OFF_ROLES,
} from '@/configs/brd.config'
import { getArticlePath, getAssetPath } from '@/configs/app.config'
import { formatAnswer, groupBySection, isAnswered } from '@/utils/intakeRules'
import { formatDate } from '@/utils/dates'
import type { BrdArticleLink, BrdAssetLink, BrdInput } from '@/@types/brds/BrdInput'
import type { Milestone } from '@/@types/brds/Milestone'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { IntakeRule } from '@/@types/intake/IntakeRule'
import type { Audience } from '@/@types/shared/PublishStatusOptions'

/*
 * Writes the two BRDs from a discovery intake. Pure and shared: the server generates with it and the
 * pages compose the full document (body + milestones) with it, so preview, print and download agree.
 *
 *   customer  → "Business Requirements – <client>": only what the customer may read. Never gotchas,
 *               rules not marked "show to customer", internal articles or discovery notes.
 *   internal  → "Internal delivery brief – <client>": everything, with links to learning materials,
 *               scripts, flows, components and demo assets, and the plan per milestone.
 *
 * The body holds the prose; the milestones are stored as data (edited with MilestonesEditor) and
 * composeBrdMarkdown() renders them into the document, so the plan in the text is never stale.
 * The Markdown sticks to what utils/lessonDoc.ts round-trips (headings, lists, tables, links, callouts).
 */

export interface BuiltBrd {
    title: string
    body: string
    milestones: Milestone[]
}

const MAX_MILESTONES = 40
const MAX_LINES = 30

// ── Markdown helpers (the same escaping as lessonDoc's serializer, so documents round-trip) ──────────

/** Escapes characters Markdown would treat as formatting */
export const escapeMarkdown = (value: string) => value.replace(/([\\`*_[\]<>~|])/g, '\\$1')

/** Escapes a block marker at the start of a paragraph line ("# ", "- ", "1. ", ">") */
const escapeLineStart = (line: string) =>
    line.replace(
        /^(\s*)(#{1,6}\s|[-+*]\s|\d+[.)]\s|>|=+\s*$|-{3,}\s*$)/,
        (_, space: string, marker: string) => `${space}${marker.replace(/^([#\-+*>=]|\d+)/, '\\$1')}`,
    )

/** User text on one line (lists, table cells) */
const inlineText = (value: string) => escapeMarkdown(value.replace(/\s+/g, ' ').trim())

/** User text as paragraphs (blank lines separate paragraphs; single line breaks become spaces) */
const paragraphs = (value: string) =>
    value
        .split(/\n\s*\n/)
        .map((p) => escapeLineStart(inlineText(p)))
        .filter(Boolean)
        .join('\n\n')

/** Authored Markdown (rule guidance, notes): kept as written, without trailing whitespace */
const authored = (value: string) =>
    value
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
        .trim()

/** A link; spaces and parentheses in the address are percent-encoded so the link can't break */
const link = (title: string, href: string) =>
    `[${inlineText(title)}](${href.replace(/[\s()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)})`
const withSummary = (text: string, summary: string) => (summary.trim() ? `${text} – ${inlineText(summary)}` : text)
const bullets = (items: string[]) => items.map((item) => `- ${item}`).join('\n')
const italic = (text: string) => `_${text}_`
const callout = (type: 'WARNING' | 'IMPORTANT' | 'NOTE' | 'TIP', content: string) =>
    `[!${type}]\n${content}`
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n')

const table = (rows: string[][]) => {
    const width = Math.max(...rows.map((r) => r.length))
    const line = (cells: string[]) =>
        `| ${Array.from({ length: width }, (_, i) => cells[i]?.trim() || ' ').join(' | ')} |`
    return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join('\n')
}

const section = (heading: string, ...blocks: (string | false | null | undefined)[]) =>
    [`## ${heading}`, ...blocks.filter((b): b is string => !!b && !!b.trim())].join('\n\n')

const appLink = (appUrl: string, path: string) => `${appUrl.replace(/\/+$/, '')}${path}`
const articleHref = (input: BrdInput, article: BrdArticleLink) => appLink(input.appUrl, getArticlePath(article.id))
const assetHref = (input: BrdInput, asset: BrdAssetLink) => appLink(input.appUrl, getAssetPath(asset.id))

// ── Content selection (what each audience may see) ──────────────────────────────────────────────────

/** Rules the customer may read: best practices marked "show to customer". Gotchas never. */
export const customerRules = (rules: IntakeRule[]) => rules.filter((r) => r.kind !== 'gotcha' && r.showToCustomer)

/** Articles the customer may read */
export const customerArticles = (articles: BrdArticleLink[]) => articles.filter((a) => a.audience === 'customer')

const assetsOfKind = (assets: BrdAssetLink[], kinds: AssetKind[]) => assets.filter((a) => kinds.includes(a.kind))

const answerOf = (input: BrdInput, question: IntakeQuestion) =>
    formatAnswer(question, input.intake.answers[question.key])

const goalQuestion = (input: BrdInput) => input.questions.find((q) => q.key === BRD_GOAL_QUESTION_KEY)

/** Visible questions without an answer (required ones first) */
export const openQuestions = (input: BrdInput) =>
    input.questions
        .filter((q) => !isAnswered(input.intake.answers[q.key]))
        .sort((a, b) => Number(b.required) - Number(a.required))

// ── Milestones ────────────────────────────────────────────────────────────────────────────────────

const cleanLines = (lines: string[]) =>
    [...new Set(lines.map((l) => l.replace(/\s+/g, ' ').trim().slice(0, 300)).filter(Boolean))].slice(0, MAX_LINES)

const copyMilestone = (m: Milestone): Milestone => ({
    title: m.title.trim().slice(0, 150),
    deliverables: cleanLines(m.deliverables),
    dependencies: cleanLines(m.dependencies),
    owner: m.owner.trim().slice(0, 80),
    due: m.due.trim().slice(0, 40),
})

/**
 * The delivery plan: the base milestones with each in-scope product's template inserted after the
 * first (design) milestone. The internal plan also makes every matched gotcha a dependency of the first
 * milestone ("Resolve: <rule>"); the customer plan never names gotchas.
 */
export function buildMilestones(input: BrdInput, audience: Audience): Milestone[] {
    const [first, ...rest] = BRD_BASE_MILESTONES.map(copyMilestone)
    const fromProducts = input.products.flatMap((p) => p.milestoneTemplate.map(copyMilestone))
    if (audience === 'internal') {
        const gotchas = input.rules.filter((r) => r.kind === 'gotcha').map((r) => `Resolve: ${r.title}`)
        first.dependencies = cleanLines([...first.dependencies, ...gotchas])
    }
    return [first, ...fromProducts, ...rest].filter((m) => m.title.length >= 2).slice(0, MAX_MILESTONES)
}

const milestoneMeta = (m: Milestone) =>
    [m.owner && `**Owner:** ${inlineText(m.owner)}`, m.due && `**Due:** ${inlineText(m.due)}`]
        .filter(Boolean)
        .join(' · ')

/** The milestones section of a BRD: a table for the customer, a heading per milestone internally */
export function milestonesMarkdown(milestones: Milestone[], audience: Audience): string {
    if (audience === 'customer') {
        if (!milestones.length) return section('Milestones', 'The delivery plan will be agreed during design.')
        const planned = milestones.some((m) => m.owner || m.due)
        const header = ['Milestone', 'Deliverables', 'Dependencies', ...(planned ? ['Owner', 'Due'] : [])]
        const rows = milestones.map((m) => [
            inlineText(m.title),
            m.deliverables.map(inlineText).join('; '),
            m.dependencies.map(inlineText).join('; '),
            ...(planned ? [inlineText(m.owner), inlineText(m.due)] : []),
        ])
        return section('Milestones', table([header, ...rows]))
    }
    if (!milestones.length) return section('Milestones, deliverables & dependencies', 'No milestones planned yet.')
    const parts = milestones.map((m, i) =>
        [
            `### ${i + 1}. ${inlineText(m.title)}`,
            milestoneMeta(m),
            '**Deliverables**',
            m.deliverables.length ? bullets(m.deliverables.map(inlineText)) : italic('None listed.'),
            '**Dependencies**',
            m.dependencies.length ? bullets(m.dependencies.map(inlineText)) : italic('None listed.'),
        ]
            .filter(Boolean)
            .join('\n\n'),
    )
    return section('Milestones, deliverables & dependencies', ...parts)
}

/** Where the milestones go in each document: before this heading (or at the end) */
const MILESTONES_BEFORE: Record<Audience, string[]> = {
    customer: ['Sign-off'],
    internal: ['Requirements captured', 'Discovery notes'],
}

/**
 * The whole document: the body with the milestones section in its place, optionally under the title.
 * Used by the BRD page, print, "Download Markdown" and "Copy Markdown".
 */
export function composeBrdMarkdown(
    brd: { title: string; audience: Audience; body: string; milestones: Milestone[] },
    { includeTitle = false }: { includeTitle?: boolean } = {},
): string {
    const body = brd.body.replace(/\r\n?/g, '\n').trim()
    const plan = milestonesMarkdown(brd.milestones, brd.audience)
    const lines = body ? body.split('\n') : []
    const anchors = MILESTONES_BEFORE[brd.audience].map((h) => `## ${h}`.toLowerCase())
    const at = lines.findIndex((line) => anchors.includes(line.trim().toLowerCase()))
    const document =
        at < 0
            ? [body, plan].filter(Boolean).join('\n\n')
            : [lines.slice(0, at).join('\n').trim(), plan, lines.slice(at).join('\n').trim()]
                  .filter(Boolean)
                  .join('\n\n')
    return `${includeTitle ? `# ${inlineText(brd.title)}\n\n` : ''}${document}\n`
}

/** A file name for the download: "business-requirements-contoso.md" */
export const brdFileName = (title: string) =>
    `${
        title
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'brd'
    }.md`

// ── The two documents ───────────────────────────────────────────────────────────────────────────────

const requirementsList = (input: BrdInput, questions: IntakeQuestion[], includeUnanswered: boolean) =>
    groupBySection(questions)
        .map(({ section: name, questions: list }) => {
            const items = list.flatMap((q) => {
                const answer = answerOf(input, q)
                if (!answer && !includeUnanswered) return []
                // "**Question?** answer" / "**Go-live date:** answer"
                const label = /[?:.!]$/.test(q.label.trim()) ? q.label : `${q.label.trim()}:`
                return [`**${inlineText(label)}** ${answer ? inlineText(answer) : italic('Not answered')}`]
            })
            return items.length ? `### ${inlineText(name)}\n\n${bullets(items)}` : ''
        })
        .filter(Boolean)
        .join('\n\n')

const assetList = (input: BrdInput, assets: BrdAssetLink[], audience: Audience, showKind = false) =>
    bullets(
        assets.map((asset) => {
            const kind = showKind ? `**${assetKindLabel[asset.kind]}:** ` : ''
            // The customer can't open the hub: link where the asset lives when there is a link
            const main =
                audience === 'customer' && asset.url
                    ? link(asset.title, asset.url)
                    : link(asset.title, assetHref(input, asset))
            const external = audience === 'internal' && asset.url ? ` (${link('open', asset.url)})` : ''
            return withSummary(`${kind}${main}${external}`, asset.summary)
        }),
    )

const articleList = (input: BrdInput, articles: BrdArticleLink[]) =>
    bullets(articles.map((a) => withSummary(link(a.title, articleHref(input, a)), a.summary)))

/** "Related: [Article](…), [Asset](…)" for a rule, limited to what this audience may see */
function ruleLinks(input: BrdInput, rule: IntakeRule, audience: Audience) {
    const articles = input.articles.filter(
        (a) => rule.articleIds.includes(a.id) && (audience === 'internal' || a.audience === 'customer'),
    )
    // The customer only gets reference architectures and demo assets (scripts, flows … are delivery tools)
    const assets = input.assets.filter(
        (a) => rule.assetIds.includes(a.id) && (audience === 'internal' || BRD_DESIGN_ASSET_KINDS.includes(a.kind)),
    )
    const links = [
        ...articles.map((a) => link(a.title, articleHref(input, a))),
        ...assets.map((a) =>
            audience === 'customer' && a.url ? link(a.title, a.url) : link(a.title, assetHref(input, a)),
        ),
    ]
    return links.length ? `**Related:** ${links.join(', ')}` : ''
}

const metaLine = (input: BrdInput, extra: string[] = []) =>
    [
        `**Client:** ${inlineText(input.client.name)}`,
        input.client.industry.trim() && `**Industry:** ${inlineText(input.client.industry)}`,
        ...extra,
        `**Prepared:** ${formatDate(input.generatedAt)}`,
    ]
        .filter(Boolean)
        .join(' · ')

function customerBody(input: BrdInput): string {
    const goal = goalQuestion(input)
    const goalText = goal ? answerOf(input, goal) : ''
    const designAssets = (kind: AssetKind) => assetsOfKind(input.assets, [kind])
    const architecture = designAssets('reference_architecture')
    const demos = designAssets('demo_asset')
    const reading = customerArticles(input.articles)
    const recommendations = customerRules(input.rules)
    const open = openQuestions(input)
    const requirements = requirementsList(
        input,
        input.questions.filter((q) => q.key !== BRD_GOAL_QUESTION_KEY),
        false,
    )

    return [
        metaLine(input),
        section(
            'Overview',
            goalText
                ? paragraphs(goalText)
                : italic('The business goal hasn’t been captured yet – see open questions.'),
            input.client.summary.trim() && paragraphs(input.client.summary),
        ),
        section(
            'Scope',
            input.products.length
                ? `This engagement covers:\n\n${bullets(input.products.map((p) => withSummary(`**${inlineText(p.name)}**`, p.description)))}`
                : 'The products in scope haven’t been chosen yet.',
        ),
        section('Requirements', requirements || 'No requirements have been captured yet.'),
        section(
            'Reference architecture',
            architecture.length
                ? `The solution follows these reference architectures and flows:\n\n${assetList(input, architecture, 'customer')}`
                : 'The reference architecture is agreed during Discovery & design.',
        ),
        section(
            'Demo',
            demos.length
                ? `See the solution in action:\n\n${assetList(input, demos, 'customer')}`
                : 'A demonstration can be arranged on request.',
        ),
        reading.length > 0 && section('Further reading', articleList(input, reading)),
        section(
            'Recommendations',
            recommendations.length
                ? recommendations
                      .map((rule) =>
                          [`### ${inlineText(rule.title)}`, authored(rule.guidance), ruleLinks(input, rule, 'customer')]
                              .filter(Boolean)
                              .join('\n\n'),
                      )
                      .join('\n\n')
                : 'No specific recommendations at this stage.',
        ),
        section(
            'Assumptions & open questions',
            `### Assumptions\n\n${bullets(BRD_ASSUMPTIONS.map(inlineText))}`,
            `### Open questions\n\n${
                open.length
                    ? bullets(open.map((q) => `${inlineText(q.label)}${q.required ? ` ${italic('(required)')}` : ''}`))
                    : 'All discovery questions have been answered.'
            }`,
        ),
        section(
            'Sign-off',
            'By signing, both parties agree that this document describes the requirements and scope of the engagement.',
            table([['Role', 'Name', 'Signature', 'Date'], ...BRD_SIGN_OFF_ROLES.map((role) => [inlineText(role)])]),
        ),
    ]
        .filter((block): block is string => !!block)
        .join('\n\n')
}

function internalBody(input: BrdInput): string {
    const goal = goalQuestion(input)
    const goalText = goal ? answerOf(input, goal) : ''
    const gotchas = input.rules.filter((r) => r.kind === 'gotcha')
    const practices = input.rules.filter((r) => r.kind === 'best_practice')
    const buildAssets = assetsOfKind(input.assets, BRD_BUILD_ASSET_KINDS)
    const designAssets = assetsOfKind(input.assets, BRD_DESIGN_ASSET_KINDS)
    const open = openQuestions(input)
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

    return [
        metaLine(input, [`**Intake:** ${inlineText(input.intake.title)}`]),
        callout(
            'IMPORTANT',
            `${brdAudienceLabel.internal} – do not send to the customer. The customer-facing BRD is generated separately.`,
        ),
        section(
            'Summary',
            goalText ? paragraphs(goalText) : italic('The business goal hasn’t been captured yet.'),
            input.client.summary.trim() && paragraphs(input.client.summary),
            bullets([
                `**Products in scope:** ${input.products.length ? input.products.map((p) => inlineText(p.name)).join(', ') : 'none chosen yet'}`,
                `**Matched guidance:** ${plural(gotchas.length, 'gotcha', 'gotchas')}, ${plural(practices.length, 'best practice', 'best practices')}`,
                `**Open questions:** ${open.length}${open.some((q) => q.required) ? ` (${open.filter((q) => q.required).length} required)` : ''}`,
            ]),
        ),
        section(
            'Gotchas & risks',
            gotchas.length
                ? gotchas
                      .map((rule) =>
                          callout(
                              'WARNING',
                              [
                                  `**${inlineText(rule.title)}**`,
                                  authored(rule.guidance),
                                  ruleLinks(input, rule, 'internal'),
                              ]
                                  .filter(Boolean)
                                  .join('\n\n'),
                          ),
                      )
                      .join('\n\n')
                : 'No gotchas matched this intake.',
        ),
        section(
            'Best practices',
            practices.length
                ? practices
                      .map((rule) =>
                          [
                              `### ${inlineText(rule.title)}`,
                              rule.showToCustomer && italic('Also shown in the customer BRD.'),
                              authored(rule.guidance),
                              ruleLinks(input, rule, 'internal'),
                          ]
                              .filter(Boolean)
                              .join('\n\n'),
                      )
                      .join('\n\n')
                : 'No best practices matched this intake.',
        ),
        section(
            'Learning materials',
            input.articles.length ? articleList(input, input.articles) : 'No published articles are linked yet.',
        ),
        section(
            'Scripts, flows & components',
            buildAssets.length
                ? assetList(input, buildAssets, 'internal', true)
                : 'No published scripts, flows, components or templates match this scope yet.',
        ),
        section(
            'Reference architecture & demo assets',
            designAssets.length
                ? assetList(input, designAssets, 'internal', true)
                : 'No published reference architectures or demo assets match this scope yet.',
        ),
        section('Requirements captured', requirementsList(input, input.questions, true) || 'No questions in scope.'),
        section(
            'Discovery notes',
            authored(input.intake.notes) || italic('No notes were recorded in the intake.'),
            open.length > 0 &&
                `**Still to ask:**\n\n${bullets(open.map((q) => `${inlineText(q.label)}${q.required ? ` ${italic('(required)')}` : ''}`))}`,
        ),
    ]
        .filter((block): block is string => !!block)
        .join('\n\n')
}

/** One BRD for one audience: { title, body (Markdown, without the milestones section), milestones } */
export function buildBrd(input: BrdInput, audience: Audience): BuiltBrd {
    const client = input.client.name.replace(/\s+/g, ' ').trim()
    if (audience === 'customer') {
        return {
            title: `Business Requirements – ${client}`.slice(0, 200),
            body: `${customerBody(input)}\n`,
            milestones: buildMilestones(input, 'customer'),
        }
    }
    return {
        title: `Internal delivery brief – ${client}`.slice(0, 200),
        body: `${internalBody(input)}\n`,
        milestones: buildMilestones(input, 'internal'),
    }
}
