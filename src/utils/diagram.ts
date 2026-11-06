import {
    DIAGRAM_LIMITS,
    type Diagram,
    type DiagramEdge,
    type DiagramNode,
    type DiagramSummary,
    type DiagramView,
} from '@/@types/library/Diagram'
import { unknownDiagramComponent, type DiagramComponent } from '@/@types/library/DiagramComponent'
import { slugify } from '@/utils/slugs'

/*
 * Architecture diagrams: pure helpers shared by the designer, the reader, the server and the agent API
 * (no React, no React Flow).
 */

/** The drag-and-drop payload type of a palette item (a component type's code) */
export const DIAGRAM_KIND_MIME = 'application/x-knowledge-hub-diagram-kind'

/** Grid the designer snaps to */
export const DIAGRAM_GRID = 20

/** Approximate size of a component on the canvas, for layout maths before it has been measured */
export const DIAGRAM_NODE_SIZE = { width: 220, height: 64 } as const

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** A new element id such as "n-k3x9q2ab" (random; works without a secure context) */
export function newDiagramId(prefix: 'v' | 'n' | 'e' | 'note'): string {
    const bytes = new Uint8Array(10)
    globalThis.crypto.getRandomValues(bytes)
    return `${prefix}-${Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('')}`
}

// ── Component types ──

/** Looks a node's type up by code; unknown codes (a deleted type) get the fallback look */
export function componentResolver(components: readonly DiagramComponent[]): (code: string) => DiagramComponent {
    const byCode = new Map(components.map((component) => [component.code, component]))
    return (code) => byCode.get(code) ?? unknownDiagramComponent(code)
}

/** Component types in palette order: position, then name */
export const sortComponents = (components: readonly DiagramComponent[]): DiagramComponent[] =>
    [...components].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))

// ── Reading ──

/** Components with a build step, in build order (ties keep their order in the view) */
export function buildSequence(view: DiagramView): DiagramNode[] {
    return view.nodes
        .map((node, index) => ({ node, index }))
        .filter(({ node }) => node.step !== null)
        .sort((a, b) => (a.node.step ?? 0) - (b.node.step ?? 0) || a.index - b.index)
        .map(({ node }) => node)
}

/**
 * The component types a view uses, in palette order (for the legend); nodes whose type is unknown add
 * one fallback entry at the end.
 */
export function kindsInView(view: DiagramView, components: readonly DiagramComponent[]): DiagramComponent[] {
    const used = new Set(view.nodes.map((node) => node.kind))
    const known = sortComponents(components).filter((component) => used.has(component.code))
    const unknown = [...used].find((code) => !known.some((component) => component.code === code))
    return unknown === undefined ? known : [...known, unknownDiagramComponent(unknown)]
}

/** "N views · M components" for library cards; null when there's no diagram */
export function summarizeDiagram(diagram: Diagram): DiagramSummary | null {
    if (!diagram.views.length) return null
    return {
        views: diagram.views.length,
        components: diagram.views.reduce((total, view) => total + view.nodes.length, 0),
    }
}

export const formatDiagramSummary = (summary: DiagramSummary) =>
    `${summary.views} ${summary.views === 1 ? 'view' : 'views'} · ${summary.components} ${
        summary.components === 1 ? 'component' : 'components'
    }`

// ── Editing (each returns a new view) ──

/** The next free build step (one after the highest) */
export function nextStep(view: DiagramView): number {
    const highest = Math.max(0, ...view.nodes.map((node) => node.step ?? 0))
    return Math.min(DIAGRAM_LIMITS.maxStep, highest + 1)
}

/** Renumbers the build steps 1, 2, 3… in their current order (closing gaps; equal steps stay equal) */
export function renumberSteps(view: DiagramView): DiagramView {
    const distinct = [...new Set(buildSequence(view).map((node) => node.step as number))]
    const mapping = new Map(distinct.map((step, i) => [step, i + 1]))
    return {
        ...view,
        nodes: view.nodes.map((node) =>
            node.step === null ? node : { ...node, step: mapping.get(node.step) ?? null },
        ),
    }
}

const snap = (value: number) => Math.round(value / DIAGRAM_GRID) * DIAGRAM_GRID

/** The preferred point (snapped), nudged down-right until it doesn't sit on top of another component */
export function freePosition(view: DiagramView, preferred: { x: number; y: number }): { x: number; y: number } {
    let { x, y } = { x: snap(preferred.x), y: snap(preferred.y) }
    for (let attempt = 0; attempt < 50; attempt++) {
        const taken = view.nodes.some((node) => Math.abs(node.x - x) < 40 && Math.abs(node.y - y) < 30)
        if (!taken) break
        x += DIAGRAM_GRID * 2
        y += DIAGRAM_GRID * 2
    }
    return { x, y }
}

/** Where a component goes when the canvas can't say (a grid, four per row) */
export function defaultPosition(view: DiagramView): { x: number; y: number } {
    const n = view.nodes.length
    return freePosition(view, { x: (n % 4) * 260, y: Math.floor(n / 4) * 140 })
}

/** A new component of a type (named after the type) at a position */
export function createNode(
    view: DiagramView,
    component: Pick<DiagramComponent, 'code' | 'name'>,
    position?: { x: number; y: number },
): DiagramNode {
    const { x, y } = position ? freePosition(view, position) : defaultPosition(view)
    const label = component.name.slice(0, DIAGRAM_LIMITS.nodeLabel)
    return { id: newDiagramId('n'), kind: component.code, label, subtitle: '', x, y, step: null, guidance: '' }
}

/** Connects two components (no self-connections, no duplicates of the same direction); null if refused */
export function connectNodes(
    view: DiagramView,
    source: string,
    target: string,
    label = '',
    id = newDiagramId('e'),
): DiagramView | null {
    if (source === target) return null
    if (!view.nodes.some((n) => n.id === source) || !view.nodes.some((n) => n.id === target)) return null
    if (view.edges.some((e) => e.source === source && e.target === target)) return null
    if (view.edges.length >= DIAGRAM_LIMITS.edges) return null
    const edge: DiagramEdge = { id, source, target, label }
    return { ...view, edges: [...view.edges, edge] }
}

/** Removes components (and their connections) and connections by id */
export function removeElements(view: DiagramView, nodeIds: Iterable<string>, edgeIds: Iterable<string> = []) {
    const nodes = new Set(nodeIds)
    const edges = new Set(edgeIds)
    return {
        ...view,
        nodes: view.nodes.filter((node) => !nodes.has(node.id)),
        edges: view.edges.filter((edge) => !edges.has(edge.id) && !nodes.has(edge.source) && !nodes.has(edge.target)),
    }
}

/** An empty view named "View N" (or the next free number) */
export function createView(existing: DiagramView[], name?: string): DiagramView {
    let n = existing.length + 1
    while (!name && existing.some((view) => view.name === `View ${n}`)) n++
    return { id: newDiagramId('v'), name: name ?? `View ${n}`, description: '', nodes: [], edges: [], notes: [] }
}

/** A copy of a view with fresh ids, named "… (copy)" */
export function duplicateView(view: DiagramView): DiagramView {
    const ids = new Map(view.nodes.map((node) => [node.id, newDiagramId('n')]))
    const suffix = ' (copy)'
    return {
        ...view,
        id: newDiagramId('v'),
        name: `${view.name.slice(0, DIAGRAM_LIMITS.viewName - suffix.length)}${suffix}`,
        nodes: view.nodes.map((node) => ({ ...node, id: ids.get(node.id) as string })),
        edges: view.edges.map((edge) => ({
            ...edge,
            id: newDiagramId('e'),
            source: ids.get(edge.source) ?? edge.source,
            target: ids.get(edge.target) ?? edge.target,
        })),
        notes: view.notes.map((note) => ({ ...note, id: newDiagramId('note') })),
    }
}

/** Moves an item one place left (-1) or right (+1) in a list */
export function moveItem<T>(items: T[], index: number, delta: -1 | 1): T[] {
    const to = index + delta
    if (index < 0 || index >= items.length || to < 0 || to >= items.length) return items
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item)
    return next
}

// ── Canvas geometry ──

export type DiagramSide = 'top' | 'right' | 'bottom' | 'left'

interface Box {
    x: number
    y: number
    width?: number
    height?: number
}

/**
 * Which sides a connection leaves and enters by, from where the two components sit: side by side →
 * right/left, stacked → bottom/top. Keeps connections tidy without storing handles.
 */
export function edgeSides(source: Box, target: Box): { sourceSide: DiagramSide; targetSide: DiagramSide } {
    const centre = (box: Box) => ({
        x: box.x + (box.width ?? DIAGRAM_NODE_SIZE.width) / 2,
        y: box.y + (box.height ?? DIAGRAM_NODE_SIZE.height) / 2,
    })
    const s = centre(source)
    const t = centre(target)
    const dx = t.x - s.x
    const dy = t.y - s.y
    // Components are wider than tall, so favour left/right unless clearly stacked
    if (Math.abs(dx) >= Math.abs(dy) * 1.5) {
        return dx >= 0 ? { sourceSide: 'right', targetSide: 'left' } : { sourceSide: 'left', targetSide: 'right' }
    }
    return dy >= 0 ? { sourceSide: 'bottom', targetSide: 'top' } : { sourceSide: 'top', targetSide: 'bottom' }
}

// ── Markdown brief (Download brief, agent API) ──

/** One line of plain text (labels never span lines in Markdown lists) */
const inline = (text: string) => text.replace(/\s+/g, ' ').trim()

const indent = (markdown: string, spaces: number) =>
    markdown
        .trim()
        .split('\n')
        .map((line) => (line.trim() ? `${' '.repeat(spaces)}${line}` : ''))
        .join('\n')

function viewToMarkdown(view: DiagramView, level: number, components: readonly DiagramComponent[]): string {
    const h = (n: number) => '#'.repeat(Math.min(6, n))
    const byId = new Map(view.nodes.map((node) => [node.id, node]))
    const known = sortComponents(components)
    const typeName = (node: DiagramNode) =>
        known.find((component) => component.code === node.kind)?.name ?? 'Other component'
    const parts: string[] = [`${h(level)} ${inline(view.name)}`]
    if (view.description.trim()) parts.push(view.description.trim())

    if (view.nodes.length) {
        const item = (node: DiagramNode) =>
            `- ${inline(node.label)}${node.subtitle.trim() ? ` — ${inline(node.subtitle)}` : ''}`
        const groups = known
            .map((component) => {
                const nodes = view.nodes.filter((node) => node.kind === component.code)
                return nodes.length ? `**${inline(component.name)}**\n\n${nodes.map(item).join('\n')}` : ''
            })
            .filter(Boolean)
        const others = view.nodes.filter((node) => !known.some((component) => component.code === node.kind))
        if (others.length) groups.push(`**Other components**\n\n${others.map(item).join('\n')}`)
        parts.push(`${h(level + 1)} Components\n\n${groups.join('\n\n')}`)
    } else {
        parts.push('_No components yet._')
    }

    if (view.edges.length) {
        const lines = view.edges.map((edge) => {
            const from = byId.get(edge.source)?.label ?? 'Unknown'
            const to = byId.get(edge.target)?.label ?? 'Unknown'
            return `- ${inline(from)} → ${inline(to)}${edge.label.trim() ? ` (${inline(edge.label)})` : ''}`
        })
        parts.push(`${h(level + 1)} Connections\n\n${lines.join('\n')}`)
    }

    const sequence = buildSequence(view)
    if (sequence.length) {
        const steps = sequence.map((node) => {
            const head = `${node.step}. **${inline(node.label)}** (${inline(typeName(node))})`
            return node.guidance.trim() ? `${head}\n\n${indent(node.guidance, 3)}` : head
        })
        parts.push(`${h(level + 1)} Build sequence\n\n${steps.join('\n\n')}`)
    }

    const notes = view.notes.filter((note) => note.text.trim())
    if (notes.length) {
        const callouts = notes.map(
            (note) =>
                `> [!${note.tone === 'warning' ? 'WARNING' : 'NOTE'}]\n${note.text
                    .trim()
                    .split('\n')
                    .map((line) => `> ${line}`)
                    .join('\n')}`,
        )
        parts.push(`${h(level + 1)} Notes\n\n${callouts.join('\n\n')}`)
    }
    return parts.join('\n\n')
}

/**
 * The diagram as a Markdown brief: per view its description, components grouped by type (in palette
 * order; nodes whose type was deleted under "Other components"), connections ("A → B (label)"), the build
 * sequence with guidance, and notes. '' when there are no views.
 */
export function diagramToMarkdown(diagram: Diagram, title: string, components: readonly DiagramComponent[]): string {
    if (!diagram.views.length) return ''
    const heading = inline(title)
    const body = diagram.views.map((view) => viewToMarkdown(view, heading ? 2 : 1, components)).join('\n\n')
    return `${heading ? `# ${heading}\n\n` : ''}${body}\n`
}

/** "gl-planning-architecture.md"; with a view and an extension: "gl-planning-main-view.png" */
export function diagramFileName(title: string, view?: { name: string; extension: 'png' | 'jpg' | 'pdf' }): string {
    const base = slugify(title) || 'diagram'
    if (!view) return `${base}-architecture.md`
    const viewSlug = slugify(view.name).slice(0, 50).replace(/-+$/, '')
    return `${base.slice(0, 60).replace(/-+$/, '')}${viewSlug ? `-${viewSlug}` : ''}.${view.extension}`
}

// ── Image / PDF export ──

/** Characters the PDF's built-in fonts can draw besides Latin-1 (Windows-1252's extras) */
const WIN_ANSI_EXTRAS = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')

const PDF_REPLACEMENTS: Record<string, string> = { '→': '->', '←': '<-', '⇒': '=>', '≥': '>=', '≤': '<=', '✓': 'v' }

/**
 * Text the PDF's standard fonts can draw (Windows-1252): arrows become "->", accents outside the set are
 * dropped ("ő" → "o"), anything else becomes "?". Tabs and line breaks are kept.
 */
export function pdfText(text: string): string {
    let out = ''
    for (const char of text) {
        const code = char.codePointAt(0) as number
        if (code === 9 || code === 10 || (code >= 32 && code < 127) || (code >= 160 && code <= 255)) out += char
        else if (WIN_ANSI_EXTRAS.has(char)) out += char
        else if (PDF_REPLACEMENTS[char]) out += PDF_REPLACEMENTS[char]
        else if (code === 13) continue
        else {
            const plain = char.normalize('NFKD').replace(/[̀-ͯ]/g, '')
            out += plain && [...plain].every((c) => (c.codePointAt(0) as number) < 256) ? plain : '?'
        }
    }
    return out
}

/**
 * Build guidance (Markdown) as plain text for the PDF: links become "text (url)", images their alt text,
 * emphasis, code marks and heading/quote markers go, list bullets become "•", callout markers are dropped.
 */
export function markdownToPlainText(markdown: string): string {
    return markdown
        .replace(/\r\n?/g, '\n')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_, text: string, url: string) =>
            text === url ? url : `${text} (${url})`,
        )
        .replace(/^\s*>\s?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/gim, '')
        .replace(/^(\s*)>\s?/gm, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^(\s*)[-*+]\s+/gm, '$1• ')
        .replace(/```[^\n]*\n?/g, '')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[^\w*])[*_]([^*_\n]+)[*_](?=[^\w*]|$)/g, '$1$2')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

/** The largest size with the same proportions that fits in the box (never enlarged) */
export function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
    if (width <= 0 || height <= 0) return { width: 0, height: 0 }
    const scale = Math.min(1, maxWidth / width, maxHeight / height)
    return { width: width * scale, height: height * scale }
}

/** Pixel size of an exported image: the diagram's bounds plus padding, capped so browsers can draw it */
export function exportImageSize(bounds: { width: number; height: number }, padding = 48, max = 6000) {
    const width = Math.ceil(bounds.width + padding * 2)
    const height = Math.ceil(bounds.height + padding * 2)
    const scale = Math.min(1, max / width, max / height)
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

// ── Starter template ──

type StarterNode = Omit<DiagramNode, 'id'> & { key: string }

const GL_PLANNING_NODES: StarterNode[] = [
    {
        key: 'erp',
        kind: 'source_system',
        label: 'Financials from ERP',
        subtitle: 'GL actuals, chart of accounts',
        x: 0,
        y: 180,
        step: 1,
        guidance:
            'Agree the extract with the client: GL balances by period, the chart of accounts and entities. ' +
            'Confirm the refresh frequency (usually daily) and who owns the source.',
    },
    {
        key: 'db',
        kind: 'database',
        label: 'Acterys SQL database',
        subtitle: 'Azure SQL',
        x: 300,
        y: 180,
        step: 1,
        guidance:
            'Create the staging tables, then load them with a Fabric pipeline (or Azure Data Factory when the ' +
            'client has no Fabric). Keep the staging layer separate from the planning model.',
    },
    {
        key: 'cube',
        kind: 'cube',
        label: 'Planning cube',
        subtitle: 'Budget and forecast (write-back)',
        x: 600,
        y: 180,
        step: 2,
        guidance:
            'Model the cube on the GL dimensions (account, entity, period, scenario). Enable write-back for the ' +
            'budget and forecast scenarios only; actuals stay read-only.',
    },
    {
        key: 'copy',
        kind: 'action',
        label: 'Copy cube',
        subtitle: 'Seeds the forecast from actuals',
        x: 460,
        y: 20,
        step: null,
        guidance: '',
    },
    {
        key: 'scenario',
        kind: 'dimension',
        label: 'Dim_Scenario',
        subtitle: 'Actual, Budget, Forecast',
        x: 740,
        y: 20,
        step: null,
        guidance: '',
    },
    {
        key: 'people',
        kind: 'person',
        label: 'Planner / Approver',
        subtitle: 'Finance team',
        x: 300,
        y: 360,
        step: null,
        guidance: '',
    },
    {
        key: 'workflow',
        kind: 'dimension',
        label: 'Dim_WorkflowApproval',
        subtitle: 'Approval status per entity',
        x: 600,
        y: 360,
        step: 3,
        guidance:
            'Add the workflow dimension and the approval states. Planners submit; approvers approve or reject. ' +
            'An approval triggers the materialization.',
    },
    {
        key: 'procedure',
        kind: 'procedure',
        label: 'Stored procedure: materialize',
        subtitle: 'Runs on approval',
        x: 900,
        y: 360,
        step: 3,
        guidance: 'Write the procedure that copies approved plan data into the reporting fact table.',
    },
    {
        key: 'fact',
        kind: 'fact',
        label: 'Materialized financials',
        subtitle: 'Actuals + approved plan',
        x: 900,
        y: 180,
        step: null,
        guidance: '',
    },
    {
        key: 'reports',
        kind: 'report',
        label: 'Power BI financial reports',
        subtitle: 'P&L, budget vs actual',
        x: 1200,
        y: 180,
        step: 4,
        guidance:
            'Build the semantic model on the materialized table and publish the P&L and budget vs actual reports.',
    },
]

const GL_PLANNING_EDGES: [string, string, string][] = [
    ['erp', 'db', 'Fabric pipeline'],
    ['db', 'cube', 'loads actuals'],
    ['copy', 'cube', ''],
    ['scenario', 'cube', ''],
    ['people', 'workflow', 'submit / approve'],
    ['workflow', 'procedure', 'triggers'],
    ['cube', 'procedure', 'reads'],
    ['procedure', 'fact', 'writes'],
    ['fact', 'reports', ''],
]

/**
 * A starter view to edit: the GL planning flow (ERP → Acterys SQL → planning cube → approval → materialize
 * → Power BI), with build steps 1–4 and a note on Fabric vs Azure Data Factory.
 */
export function glPlanningStarterView(): DiagramView {
    const ids = new Map(GL_PLANNING_NODES.map((node) => [node.key, newDiagramId('n')]))
    return {
        id: newDiagramId('v'),
        name: 'GL planning only',
        description:
            'Budget and forecast on the general ledger: actuals loaded from the ERP, planned in a write-back cube, ' +
            'approved, then materialized for reporting.',
        nodes: GL_PLANNING_NODES.map(({ key, ...node }) => ({ ...node, id: ids.get(key) as string })),
        edges: GL_PLANNING_EDGES.map(([source, target, label]) => ({
            id: newDiagramId('e'),
            source: ids.get(source) as string,
            target: ids.get(target) as string,
            label,
        })),
        notes: [
            {
                id: newDiagramId('note'),
                tone: 'warning',
                text: 'Fabric pipelines can load Azure SQL, but if the client has no Fabric, Azure Data Factory is the simpler fit.',
            },
        ],
    }
}
