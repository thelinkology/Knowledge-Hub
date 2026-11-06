import { describe, expect, it } from 'vitest'
import {
    buildSequence,
    connectNodes,
    createNode,
    createView,
    diagramFileName,
    diagramToMarkdown,
    duplicateView,
    componentResolver,
    edgeSides,
    exportImageSize,
    fitWithin,
    formatDiagramSummary,
    freePosition,
    glPlanningStarterView,
    kindsInView,
    markdownToPlainText,
    moveItem,
    newDiagramId,
    nextStep,
    pdfText,
    removeElements,
    renumberSteps,
    summarizeDiagram,
} from './diagram'
import { DiagramSchema, parseDiagram, type DiagramNode, type DiagramView } from '@/@types/library/Diagram'
import {
    DiagramComponentSchema,
    type DiagramColor,
    type DiagramComponent,
    type DiagramIconKey,
} from '@/@types/library/DiagramComponent'

/** The built-in types as seeded by 20261106000300_diagram_components.sql (a subset is enough here) */
const type = (code: string, name: string, position: number, color: DiagramColor, icon: DiagramIconKey) =>
    ({ id: `id-${code}`, code, name, description: '', color, icon, imageUrl: '', position }) as DiagramComponent

const COMPONENTS: DiagramComponent[] = [
    type('report', 'Reporting output', 7, 'amber', 'report'),
    type('source_system', 'Source system', 1, 'slate', 'source'),
    type('database', 'SQL database', 2, 'blue', 'database'),
    type('cube', 'Cube (write-back)', 3, 'violet', 'cube'),
    type('dimension', 'Dimension', 4, 'teal', 'dimension'),
    type('procedure', 'Stored procedure / trigger', 5, 'orange', 'procedure'),
    type('fact', 'Materialized fact', 6, 'green', 'fact'),
    type('person', 'Person / role', 8, 'rose', 'person'),
    type('action', 'Product action', 9, 'indigo', 'action'),
]

const node = (id: string, extra: Partial<DiagramNode> = {}): DiagramNode => ({
    id,
    kind: 'database',
    label: id.toUpperCase(),
    subtitle: '',
    x: 0,
    y: 0,
    step: null,
    guidance: '',
    ...extra,
})

const view = (extra: Partial<DiagramView> = {}): DiagramView => ({
    id: 'v1',
    name: 'Main',
    description: '',
    nodes: [],
    edges: [],
    notes: [],
    ...extra,
})

describe('DiagramSchema / parseDiagram', () => {
    it('reads the column default ({}) and garbage as an empty diagram', () => {
        expect(parseDiagram({})).toEqual({ views: [] })
        expect(parseDiagram(null)).toEqual({ views: [] })
        expect(parseDiagram({ views: 'nope' })).toEqual({ views: [] })
    })

    it('fills defaults and clamps coordinates', () => {
        const parsed = parseDiagram({
            views: [{ id: 'v1', name: 'Main', nodes: [{ id: 'a', kind: 'cube', label: 'Cube', x: 1e9, y: -1e9 }] }],
        })
        expect(parsed.views[0].nodes[0]).toEqual({
            id: 'a',
            kind: 'cube',
            label: 'Cube',
            subtitle: '',
            x: 100000,
            y: -100000,
            step: null,
            guidance: '',
        })
        expect(parsed.views[0].edges).toEqual([])
    })

    it('refuses connections to missing components and duplicate ids', () => {
        const dangling = view({ nodes: [node('a')], edges: [{ id: 'e1', source: 'a', target: 'zz', label: '' }] })
        expect(DiagramSchema.safeParse({ views: [dangling] }).success).toBe(false)
        const duplicate = view({ nodes: [node('a'), node('a')] })
        expect(DiagramSchema.safeParse({ views: [duplicate] }).success).toBe(false)
        expect(DiagramSchema.safeParse({ views: [view(), view()] }).success).toBe(false)
    })

    it('refuses non-finite positions, bad steps and unknown kinds', () => {
        const parse = (extra: Record<string, unknown>) =>
            DiagramSchema.safeParse({ views: [view({ nodes: [{ ...node('a'), ...extra } as DiagramNode] })] }).success
        expect(parse({ x: Number.NaN })).toBe(false)
        expect(parse({ x: Number.POSITIVE_INFINITY })).toBe(false)
        expect(parse({ step: 0 })).toBe(false)
        expect(parse({ step: 1.5 })).toBe(false)
        expect(parse({ step: 100 })).toBe(false)
        expect(parse({ kind: 'Not a code!' })).toBe(false)
        expect(parse({ kind: '' })).toBe(false)
        // Any well-formed code is accepted: types are data (a custom or deleted type)
        expect(parse({ kind: 'azure_function_k3x9q2' })).toBe(true)
        expect(parse({ label: '  ' })).toBe(false)
        expect(parse({ step: 99 })).toBe(true)
    })

    it('caps views at 12', () => {
        const views = Array.from({ length: 13 }, (_, i) => view({ id: `v${i}` }))
        expect(DiagramSchema.safeParse({ views }).success).toBe(false)
    })

    it('accepts the starter template', () => {
        expect(DiagramSchema.safeParse({ views: [glPlanningStarterView()] }).success).toBe(true)
    })
})

describe('ids', () => {
    it('are prefixed, schema-safe and different each time', () => {
        const a = newDiagramId('n')
        expect(a).toMatch(/^n-[a-z0-9]{10}$/)
        expect(newDiagramId('n')).not.toBe(a)
    })
})

describe('build sequence', () => {
    const v = view({
        nodes: [
            node('c', { step: 3 }),
            node('a', { step: 1 }),
            node('x'),
            node('b1', { step: 2 }),
            node('b2', { step: 2 }),
        ],
    })

    it('lists components with a step in order, ties in view order', () => {
        expect(buildSequence(v).map((n) => n.id)).toEqual(['a', 'b1', 'b2', 'c'])
    })

    it('renumbers steps without gaps, keeping equal steps equal', () => {
        const gappy = view({
            nodes: [node('a', { step: 4 }), node('b', { step: 9 }), node('c', { step: 9 }), node('d')],
        })
        expect(renumberSteps(gappy).nodes.map((n) => n.step)).toEqual([1, 2, 2, null])
    })

    it('suggests the next step', () => {
        expect(nextStep(v)).toBe(4)
        expect(nextStep(view())).toBe(1)
    })
})

describe('editing', () => {
    it('connects components once, never to themselves or to strangers', () => {
        const v = view({ nodes: [node('a'), node('b')] })
        const connected = connectNodes(v, 'a', 'b', 'loads')
        expect(connected?.edges).toHaveLength(1)
        expect(connected?.edges[0]).toMatchObject({ source: 'a', target: 'b', label: 'loads' })
        expect(connectNodes(connected as DiagramView, 'a', 'b')).toBeNull()
        expect(connectNodes(v, 'a', 'a')).toBeNull()
        expect(connectNodes(v, 'a', 'zz')).toBeNull()
        expect(connectNodes(connected as DiagramView, 'b', 'a')?.edges).toHaveLength(2)
    })

    it('removes components with their connections', () => {
        const v = view({
            nodes: [node('a'), node('b'), node('c')],
            edges: [
                { id: 'e1', source: 'a', target: 'b', label: '' },
                { id: 'e2', source: 'b', target: 'c', label: '' },
                { id: 'e3', source: 'a', target: 'c', label: '' },
            ],
        })
        const next = removeElements(v, ['b'], ['e3'])
        expect(next.nodes.map((n) => n.id)).toEqual(['a', 'c'])
        expect(next.edges).toEqual([])
    })

    it('duplicates a view with fresh ids and remapped connections', () => {
        const v = glPlanningStarterView()
        const copy = duplicateView(v)
        expect(copy.name).toBe('GL planning only (copy)')
        expect(copy.id).not.toBe(v.id)
        const originalIds = new Set(v.nodes.map((n) => n.id))
        expect(copy.nodes.some((n) => originalIds.has(n.id))).toBe(false)
        const copyIds = new Set(copy.nodes.map((n) => n.id))
        expect(copy.edges.every((e) => copyIds.has(e.source) && copyIds.has(e.target))).toBe(true)
        expect(DiagramSchema.safeParse({ views: [v, copy] }).success).toBe(true)
    })

    it('names new views after the next free number', () => {
        expect(createView([]).name).toBe('View 1')
        expect(createView([view({ name: 'View 2' })]).name).toBe('View 3')
        expect(createView([], 'Advanced FP&A planning').name).toBe('Advanced FP&A planning')
    })

    it('places new components on the grid without stacking them', () => {
        const v = view({ nodes: [node('a', { x: 100, y: 100 })] })
        expect(freePosition(view(), { x: 107, y: 93 })).toEqual({ x: 100, y: 100 })
        expect(freePosition(v, { x: 100, y: 100 })).toEqual({ x: 140, y: 140 })
        const created = createNode(v, { code: 'cube', name: 'Cube (write-back)' }, { x: 400, y: 0 })
        expect(created).toMatchObject({ kind: 'cube', label: 'Cube (write-back)', x: 400, y: 0, step: null })
    })

    it('moves items left and right within bounds', () => {
        expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
        expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b'])
        expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
    })
})

describe('edgeSides', () => {
    it('goes right/left for side-by-side components and bottom/top for stacked ones', () => {
        expect(edgeSides({ x: 0, y: 0 }, { x: 300, y: 20 })).toEqual({ sourceSide: 'right', targetSide: 'left' })
        expect(edgeSides({ x: 300, y: 0 }, { x: 0, y: 0 })).toEqual({ sourceSide: 'left', targetSide: 'right' })
        expect(edgeSides({ x: 0, y: 0 }, { x: 40, y: 200 })).toEqual({ sourceSide: 'bottom', targetSide: 'top' })
        expect(edgeSides({ x: 0, y: 200 }, { x: 0, y: 0 })).toEqual({ sourceSide: 'top', targetSide: 'bottom' })
    })
})

describe('summaries and Markdown', () => {
    it('summarizes views and components', () => {
        expect(summarizeDiagram({ views: [] })).toBeNull()
        const summary = summarizeDiagram({ views: [view({ nodes: [node('a'), node('b')] }), view({ id: 'v2' })] })
        expect(summary).toEqual({ views: 2, components: 2 })
        expect(formatDiagramSummary({ views: 1, components: 1 })).toBe('1 view · 1 component')
        expect(formatDiagramSummary({ views: 2, components: 14 })).toBe('2 views · 14 components')
    })

    it('lists the types a view uses in palette order, deleted types once at the end', () => {
        const v = view({
            nodes: [
                node('a', { kind: 'report' }),
                node('b', { kind: 'source_system' }),
                node('c', { kind: 'gone' }),
                node('d', { kind: 'also_gone' }),
            ],
        })
        const legend = kindsInView(v, COMPONENTS)
        expect(legend.map((c) => c.code)).toEqual(['source_system', 'report', 'gone'])
        expect(legend[2]).toMatchObject({ id: '', name: 'Component', color: 'slate' })
    })

    it('resolves types by code, with a fallback look for deleted ones', () => {
        const resolve = componentResolver(COMPONENTS)
        expect(resolve('cube').name).toBe('Cube (write-back)')
        expect(resolve('deleted')).toMatchObject({ id: '', code: 'deleted', name: 'Component', icon: 'service' })
    })

    it('is empty without views', () => {
        expect(diagramToMarkdown({ views: [] }, 'Anything', COMPONENTS)).toBe('')
    })

    it('groups components whose type was deleted under "Other components"', () => {
        const markdown = diagramToMarkdown(
            { views: [view({ nodes: [node('a', { kind: 'cube' }), node('b', { kind: 'gone', step: 1 })] })] },
            'T',
            COMPONENTS,
        )
        expect(markdown).toContain('**Cube (write-back)**\n\n- A')
        expect(markdown).toContain('**Other components**\n\n- B')
        expect(markdown).toContain('1. **B** (Other component)')
    })

    it('writes a brief per view: components by type, connections, build sequence and notes', () => {
        const markdown = diagramToMarkdown({ views: [glPlanningStarterView()] }, 'GL planning', COMPONENTS)
        expect(markdown.startsWith('# GL planning\n\n## GL planning only\n\nBudget and forecast')).toBe(true)
        expect(markdown).toContain('### Components')
        expect(markdown).toContain('**Source system**\n\n- Financials from ERP — GL actuals, chart of accounts')
        expect(markdown).toContain('- Financials from ERP → Acterys SQL database (Fabric pipeline)')
        expect(markdown).toContain('- Copy cube → Planning cube\n')
        expect(markdown).toContain(
            '### Build sequence\n\n1. **Financials from ERP** (Source system)\n\n   Agree the extract',
        )
        expect(markdown).toContain('4. **Power BI financial reports** (Reporting output)')
        expect(markdown).toContain('> [!WARNING]\n> Fabric pipelines can load Azure SQL')
        // Build order: the step-1 components come before step 2
        expect(markdown.indexOf('1. **Acterys SQL database**')).toBeLessThan(markdown.indexOf('2. **Planning cube**'))
    })

    it('keeps labels on one line', () => {
        const markdown = diagramToMarkdown(
            { views: [view({ name: 'A\nB', nodes: [node('a', { label: 'x\ny' })] })] },
            '',
            COMPONENTS,
        )
        expect(markdown.startsWith('# A B\n')).toBe(true)
        expect(markdown).toContain('- x y')
    })

    it('names the download after the title', () => {
        expect(diagramFileName('GL Planning (Acterys)')).toBe('gl-planning-acterys-architecture.md')
        expect(diagramFileName('')).toBe('diagram-architecture.md')
        expect(diagramFileName('GL Planning', { name: 'Advanced FP&A', extension: 'png' })).toBe(
            'gl-planning-advanced-fp-a.png',
        )
        expect(diagramFileName('', { name: '', extension: 'pdf' })).toBe('diagram.pdf')
    })
})

describe('export helpers', () => {
    it('keeps what the PDF fonts can draw and replaces the rest', () => {
        expect(pdfText('Plan “A” — 5 € … café')).toBe('Plan “A” — 5 € … café')
        expect(pdfText('ERP → SQL ≥ 2 ✓')).toBe('ERP -> SQL >= 2 v')
        // ó is in the font; ź loses its accent; Ł has no plain form
        expect(pdfText('Łódź 日本\r\nnext')).toBe('?ódz ??\nnext')
    })

    it('fits images in a box without enlarging them', () => {
        expect(fitWithin(1000, 500, 500, 500)).toEqual({ width: 500, height: 250 })
        expect(fitWithin(100, 50, 500, 500)).toEqual({ width: 100, height: 50 })
        expect(fitWithin(0, 50, 500, 500)).toEqual({ width: 0, height: 0 })
    })

    it('sizes the exported image to the diagram plus padding, capped', () => {
        expect(exportImageSize({ width: 1000, height: 400 })).toEqual({ width: 1096, height: 496 })
        const huge = exportImageSize({ width: 20000, height: 1000 }, 48, 6000)
        expect(huge.width).toBe(6000)
        expect(huge.height).toBeLessThan(400)
    })

    it('turns build guidance into plain text', () => {
        const text = markdownToPlainText(
            '## Steps\n\n- Load **actuals** with [the pipeline](https://example.com/p)\n- Run `sp_load`\n\n> [!WARNING]\n> _Check_ the totals\n\n![diagram](/x.png)',
        )
        expect(text).toBe(
            'Steps\n\n• Load actuals with the pipeline (https://example.com/p)\n• Run sp_load\n\nCheck the totals\n\ndiagram',
        )
    })
})

describe('DiagramComponentSchema', () => {
    const valid = { name: 'Azure Function', description: '', color: 'blue', icon: 'service', imageUrl: '' }

    it('accepts uploaded images and https links only', () => {
        expect(DiagramComponentSchema.safeParse(valid).success).toBe(true)
        const image = (imageUrl: string) => DiagramComponentSchema.safeParse({ ...valid, imageUrl }).success
        expect(image('/api/media/0b8f0d4e-8e2a-4d55-9c1f-3a4f1b2c3d4e')).toBe(true)
        expect(image('https://cdn.example.com/logo.png')).toBe(true)
        expect(image('http://cdn.example.com/logo.png')).toBe(false)
        expect(image('javascript:alert(1)')).toBe(false)
        expect(image('/api/media/../../etc')).toBe(false)
    })

    it('refuses unknown colours and icons, and empty names', () => {
        expect(DiagramComponentSchema.safeParse({ ...valid, color: 'red' }).success).toBe(false)
        expect(DiagramComponentSchema.safeParse({ ...valid, icon: 'rocket' }).success).toBe(false)
        expect(DiagramComponentSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
    })
})
