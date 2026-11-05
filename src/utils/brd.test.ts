import { describe, expect, it } from 'vitest'
import { brdFileName, buildBrd, buildMilestones, composeBrdMarkdown, escapeMarkdown, milestonesMarkdown } from './brd'
import { docToMarkdown, markdownToDoc } from './lessonDoc'
import { BRD_BASE_MILESTONES } from '@/configs/brd.config'
import type { BrdInput } from '@/@types/brds/BrdInput'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { IntakeRule } from '@/@types/intake/IntakeRule'
import type { Milestone } from '@/@types/brds/Milestone'

const question = (overrides: Partial<IntakeQuestion>): IntakeQuestion => ({
    id: overrides.key ?? 'q',
    key: 'q',
    section: 'Business context',
    label: 'Question',
    help: '',
    type: 'text',
    options: [],
    required: false,
    productId: null,
    position: 0,
    active: true,
    ...overrides,
})

const rule = (overrides: Partial<IntakeRule>): IntakeRule => ({
    id: 'r',
    title: 'Rule',
    kind: 'gotcha',
    productId: null,
    match: 'all',
    conditions: [{ questionKey: 'on_premises', operator: 'equals', value: 'yes' }],
    guidance: 'Do the thing.',
    showToCustomer: false,
    articleIds: [],
    assetIds: [],
    active: true,
    position: 0,
    ...overrides,
})

const milestone = (title: string, overrides: Partial<Milestone> = {}): Milestone => ({
    title,
    deliverables: [],
    dependencies: [],
    owner: '',
    due: '',
    ...overrides,
})

const input = (overrides: Partial<BrdInput> = {}): BrdInput => ({
    client: { name: 'Contoso', industry: 'Retail', summary: 'A retailer with 40 stores.' },
    intake: {
        title: 'Planning discovery',
        answers: {
            business_goal: 'Replace spreadsheet budgeting with one planning model.',
            on_premises: 'yes',
            data_sources: ['erp', 'excel'],
        },
        notes: 'SECRET-NOTE: the CFO is sceptical about the budget.',
    },
    products: [
        {
            id: 'p1',
            name: 'Acterys',
            description: 'Planning on Power BI.',
            milestoneTemplate: [milestone('Acterys model design', { deliverables: ['Planning cube'] })],
        },
        {
            id: 'p2',
            name: 'Microsoft Fabric',
            description: '',
            milestoneTemplate: [milestone('Fabric foundation'), milestone('Semantic model & reports')],
        },
    ],
    questions: [
        question({ key: 'business_goal', label: 'What problem are we solving?', type: 'long_text', required: true }),
        question({ key: 'go_live', label: 'Target go-live date', position: 1 }),
        question({ key: 'stakeholders', label: 'Who signs off?', required: true, position: 2 }),
        question({ key: 'on_premises', section: 'Data', label: 'Is any data on-premises?', type: 'yes_no' }),
        question({
            key: 'data_sources',
            section: 'Data',
            label: 'Which source systems hold the data?',
            type: 'multi_choice',
            options: [
                { value: 'erp', label: 'ERP' },
                { value: 'excel', label: 'Excel files' },
            ],
        }),
    ],
    rules: [
        rule({
            id: 'g1',
            title: 'Gateway needed GOTCHA-TITLE',
            guidance: 'GOTCHA-GUIDANCE: plan for an **on-premises data gateway**.',
            articleIds: ['a-int'],
        }),
        rule({
            id: 'g2',
            title: 'Gotcha shown by mistake',
            guidance: 'SHOWN-GOTCHA-GUIDANCE',
            showToCustomer: true,
        }),
        rule({
            id: 'b1',
            kind: 'best_practice',
            title: 'Row-level security from day one',
            guidance: 'CUSTOMER-PRACTICE: design **RLS** with the model.',
            showToCustomer: true,
            articleIds: ['a-cust', 'a-int'],
            assetIds: ['s1', 'ra1'],
        }),
        rule({
            id: 'b2',
            kind: 'best_practice',
            title: 'Internal practice',
            guidance: 'INTERNAL-PRACTICE-GUIDANCE',
            showToCustomer: false,
        }),
    ],
    articles: [
        { id: 'a-int', title: 'INTERNAL-ARTICLE gateway setup', summary: 'How we install it.', audience: 'internal' },
        { id: 'a-cust', title: 'Security overview', summary: 'For customers.', audience: 'customer' },
    ],
    assets: [
        { id: 's1', title: 'Gateway install script', summary: '', kind: 'script', url: '' },
        {
            id: 'ra1',
            title: 'Fabric lakehouse architecture',
            summary: 'Medallion layers.',
            kind: 'reference_architecture',
            url: 'https://contoso.sharepoint.com/arch',
        },
        { id: 'd1', title: 'Planning demo', summary: '', kind: 'demo_asset', url: '' },
    ],
    generatedAt: new Date(2026, 10, 5, 12),
    appUrl: 'https://hub.example.com/',
    ...overrides,
})

describe('buildBrd — customer', () => {
    const brd = buildBrd(input(), 'customer')
    const doc = composeBrdMarkdown({ ...brd, audience: 'customer' })

    it('is titled for the client', () => {
        expect(brd.title).toBe('Business Requirements – Contoso')
    })

    it('never includes gotchas, internal rules, internal articles or notes', () => {
        for (const secret of [
            'GOTCHA-TITLE',
            'GOTCHA-GUIDANCE',
            'SHOWN-GOTCHA-GUIDANCE',
            'Gotcha shown by mistake',
            'Resolve:',
            'INTERNAL-PRACTICE-GUIDANCE',
            'Internal practice',
            'INTERNAL-ARTICLE',
            'a-int',
            'SECRET-NOTE',
            'Gateway install script',
        ]) {
            expect(doc).not.toContain(secret)
        }
        expect(brd.milestones.flatMap((m) => m.dependencies).join(' ')).not.toContain('Resolve:')
    })

    it('has the customer sections in order', () => {
        const headings = doc.split('\n').filter((l) => l.startsWith('## '))
        expect(headings).toEqual([
            '## Overview',
            '## Scope',
            '## Requirements',
            '## Reference architecture',
            '## Demo',
            '## Further reading',
            '## Recommendations',
            '## Assumptions & open questions',
            '## Milestones',
            '## Sign-off',
        ])
    })

    it('opens with the business goal and the client summary', () => {
        expect(doc).toContain('Replace spreadsheet budgeting with one planning model.')
        expect(doc).toContain('A retailer with 40 stores.')
    })

    it('lists answered requirements with option labels and skips unanswered ones', () => {
        expect(doc).toContain('- **Which source systems hold the data?** ERP, Excel files')
        expect(doc).toContain('- **Is any data on-premises?** Yes')
        expect(doc).not.toContain('Not answered')
    })

    it('puts unanswered questions under open questions (required flagged)', () => {
        const open = doc.slice(doc.indexOf('### Open questions'), doc.indexOf('## Milestones'))
        expect(open).toContain('- Who signs off? _(required)_')
        expect(open).toContain('- Target go-live date')
        expect(open).not.toContain('What problem are we solving')
    })

    it('links reference architectures and demo assets (external link when there is one)', () => {
        expect(doc).toContain(
            '[Fabric lakehouse architecture](https://contoso.sharepoint.com/arch) – Medallion layers.',
        )
        expect(doc).toContain('[Planning demo](https://hub.example.com/library/d1)')
    })

    it('includes customer-visible best practices with customer articles only', () => {
        expect(doc).toContain('### Row-level security from day one')
        expect(doc).toContain('CUSTOMER-PRACTICE')
        expect(doc).toContain(
            '**Related:** [Security overview](https://hub.example.com/knowledge/articles/a-cust), [Fabric lakehouse architecture](https://contoso.sharepoint.com/arch)',
        )
    })

    it('renders milestones as a table before the sign-off table', () => {
        expect(doc).toContain('| Milestone | Deliverables | Dependencies |')
        expect(doc).toContain('| Acterys model design | Planning cube |   |')
        expect(doc.indexOf('## Milestones')).toBeLessThan(doc.indexOf('## Sign-off'))
        expect(doc).toContain('| Client sponsor |   |   |   |')
    })
})

describe('buildBrd — internal', () => {
    const brd = buildBrd(input(), 'internal')
    const doc = composeBrdMarkdown({ ...brd, audience: 'internal' }, { includeTitle: true })

    it('is titled and marked as internal', () => {
        expect(brd.title).toBe('Internal delivery brief – Contoso')
        expect(doc.startsWith('# Internal delivery brief – Contoso\n')).toBe(true)
        expect(doc).toContain('> [!IMPORTANT]')
    })

    it('includes gotchas as warnings, every best practice, internal articles, scripts and notes', () => {
        expect(doc).toContain('> [!WARNING]\n> **Gateway needed GOTCHA-TITLE**')
        expect(doc).toContain('GOTCHA-GUIDANCE')
        expect(doc).toContain('SHOWN-GOTCHA-GUIDANCE')
        expect(doc).toContain('INTERNAL-PRACTICE-GUIDANCE')
        expect(doc).toContain('[INTERNAL-ARTICLE gateway setup](https://hub.example.com/knowledge/articles/a-int)')
        expect(doc).toContain('**Script:** [Gateway install script](https://hub.example.com/library/s1)')
        expect(doc).toContain(
            '[Fabric lakehouse architecture](https://hub.example.com/library/ra1) ([open](https://contoso.sharepoint.com/arch))',
        )
        expect(doc).toContain('SECRET-NOTE')
    })

    it('has the internal sections in order', () => {
        const headings = doc.split('\n').filter((l) => l.startsWith('## '))
        expect(headings).toEqual([
            '## Summary',
            '## Gotchas & risks',
            '## Best practices',
            '## Learning materials',
            '## Scripts, flows & components',
            '## Reference architecture & demo assets',
            '## Milestones, deliverables & dependencies',
            '## Requirements captured',
            '## Discovery notes',
        ])
    })

    it('captures every question, answered or not', () => {
        expect(doc).toContain('- **Target go-live date:** _Not answered_')
        expect(doc).toContain('- **What problem are we solving?** Replace spreadsheet budgeting')
    })

    it('lists each milestone with its deliverables and dependencies', () => {
        expect(doc).toContain('### 1. Discovery & design')
        expect(doc).toContain('- Resolve: Gateway needed GOTCHA-TITLE')
        expect(doc).toContain('### 2. Acterys model design')
    })
})

describe('buildMilestones', () => {
    it('inserts product templates after the design milestone, in product order', () => {
        const titles = buildMilestones(input(), 'customer').map((m) => m.title)
        const [design, ...rest] = BRD_BASE_MILESTONES.map((m) => m.title)
        expect(titles).toEqual([
            design,
            'Acterys model design',
            'Fabric foundation',
            'Semantic model & reports',
            ...rest,
        ])
    })

    it('adds a "Resolve:" dependency per gotcha to the first milestone, internally only', () => {
        const internal = buildMilestones(input(), 'internal')
        expect(internal[0].dependencies).toContain('Resolve: Gateway needed GOTCHA-TITLE')
        expect(internal[0].dependencies).toContain('Resolve: Gotcha shown by mistake')
        expect(internal[0].dependencies.some((d) => d.includes('Row-level'))).toBe(false)
        expect(buildMilestones(input(), 'customer')[0].dependencies.some((d) => d.startsWith('Resolve:'))).toBe(false)
    })

    it('does not change the configured base milestones', () => {
        const before = JSON.stringify(BRD_BASE_MILESTONES)
        buildMilestones(input(), 'internal')
        expect(JSON.stringify(BRD_BASE_MILESTONES)).toBe(before)
    })

    it('works with no products in scope', () => {
        expect(buildMilestones(input({ products: [] }), 'customer').map((m) => m.title)).toEqual(
            BRD_BASE_MILESTONES.map((m) => m.title),
        )
    })
})

describe('composeBrdMarkdown', () => {
    it('appends the milestones when the anchor heading was removed', () => {
        const doc = composeBrdMarkdown({ title: 'T', audience: 'customer', body: '## Intro\n\nHello', milestones: [] })
        expect(doc).toBe('## Intro\n\nHello\n\n## Milestones\n\nThe delivery plan will be agreed during design.\n')
    })

    it('shows owner and due columns only when planned', () => {
        const md = milestonesMarkdown([milestone('Build', { owner: 'Ana', due: 'Week 3' })], 'customer')
        expect(md).toContain('| Milestone | Deliverables | Dependencies | Owner | Due |')
        expect(md).toContain('| Build |   |   | Ana | Week 3 |')
    })
})

describe('Markdown compatibility (utils/lessonDoc)', () => {
    const roundTrip = (markdown: string) => docToMarkdown(markdownToDoc(markdown))

    it.each(['customer', 'internal'] as const)('the %s BRD round-trips through the editor unchanged', (audience) => {
        const brd = buildBrd(input(), audience)
        const doc = composeBrdMarkdown({ ...brd, audience }, { includeTitle: true })
        expect(roundTrip(doc)).toBe(doc)
        expect(roundTrip(brd.body)).toBe(brd.body)
    })

    it('escapes Markdown in client data', () => {
        const brd = buildBrd(
            input({ client: { name: 'A_B *Co* [x]', industry: '', summary: '# not a heading' } }),
            'customer',
        )
        expect(brd.body).toContain(escapeMarkdown('A_B *Co* [x]'))
        expect(brd.body).toContain('\\# not a heading')
        const doc = composeBrdMarkdown({ ...brd, audience: 'customer' })
        expect(roundTrip(doc)).toBe(doc)
        expect(doc).not.toMatch(/<[a-z]/i)
    })
})

describe('brdFileName', () => {
    it('makes a safe file name', () => {
        expect(brdFileName('Business Requirements – Contoso')).toBe('business-requirements-contoso.md')
        expect(brdFileName('–')).toBe('brd.md')
    })
})
