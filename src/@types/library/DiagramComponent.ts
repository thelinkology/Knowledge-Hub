import { z } from 'zod'

/*
 * Architecture diagram component types (table diagram_components): the designer's palette. Editors and
 * admins add, edit and delete them. A diagram node points at a type by its `code` (DiagramNode.kind);
 * the code is set when the type is created and never changes. A node whose type was deleted shows the
 * fallback look (unknownDiagramComponent) and keeps everything else.
 */

/** Colours a component type can take (CSS: .diagram-color-<key> in knowledge/_diagram.css) */
export const DIAGRAM_COLORS = [
    'slate',
    'blue',
    'violet',
    'teal',
    'orange',
    'green',
    'amber',
    'rose',
    'indigo',
    'cyan',
    'fuchsia',
    'lime',
] as const
export type DiagramColor = (typeof DIAGRAM_COLORS)[number]

export const diagramColorLabel: Record<DiagramColor, string> = {
    slate: 'Slate',
    blue: 'Blue',
    violet: 'Violet',
    teal: 'Teal',
    orange: 'Orange',
    green: 'Green',
    amber: 'Amber',
    rose: 'Rose',
    indigo: 'Indigo',
    cyan: 'Cyan',
    fuchsia: 'Fuchsia',
    lime: 'Lime',
}

export const isDiagramColor = (value: string): value is DiagramColor =>
    (DIAGRAM_COLORS as readonly string[]).includes(value)

/** Icons a component type can show when it has no image (configs/icons.config: diagramIcon) */
export const DIAGRAM_ICON_KEYS = [
    'source',
    'database',
    'cube',
    'dimension',
    'procedure',
    'fact',
    'report',
    'person',
    'action',
    'pipeline',
    'service',
    'file',
    'api',
    'app',
    'chart',
    'code',
    'folder',
    'table',
    'document',
    'users',
    'email',
    'security',
    'bot',
    'web',
    'package',
    'schedule',
    'alert',
] as const
export type DiagramIconKey = (typeof DIAGRAM_ICON_KEYS)[number]

export const diagramIconLabel: Record<DiagramIconKey, string> = {
    source: 'Server',
    database: 'Database',
    cube: 'Cube',
    dimension: 'Hierarchy',
    procedure: 'Lightning',
    fact: 'Table (load)',
    report: 'Report',
    person: 'Person',
    action: 'Click',
    pipeline: 'Transfer',
    service: 'Cloud',
    file: 'Spreadsheet',
    api: 'API',
    app: 'App',
    chart: 'Chart',
    code: 'Code',
    folder: 'Folder',
    table: 'Table',
    document: 'Document',
    users: 'Team',
    email: 'Email',
    security: 'Security',
    bot: 'Bot / agent',
    web: 'Web',
    package: 'Package',
    schedule: 'Schedule',
    alert: 'Alert',
}

export const isDiagramIconKey = (value: string): value is DiagramIconKey =>
    (DIAGRAM_ICON_KEYS as readonly string[]).includes(value)

/** A type's code: lower-case letters, digits, '_' and '-' (what nodes store in `kind`) */
export const DIAGRAM_COMPONENT_CODE = /^[a-z0-9][a-z0-9_-]{0,47}$/

export const DIAGRAM_COMPONENT_LIMITS = { name: 60, description: 300 } as const

export interface DiagramComponent {
    id: string
    code: string
    name: string
    description: string
    color: DiagramColor
    icon: DiagramIconKey
    /** '' (show the icon), an uploaded image (/api/media/<id>) or an https link */
    imageUrl: string
    position: number
}

const isImageUrl = (url: string) =>
    url === '' || /^https:\/\/\S+$/i.test(url) || /^\/api\/media\/[0-9a-f-]{36}$/.test(url)

/** Create or edit a component type (the server sets the code and, for new types, the position) */
export const DiagramComponentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Give the component a name')
        .max(DIAGRAM_COMPONENT_LIMITS.name, 'Keep the name under 60 characters'),
    description: z
        .string()
        .trim()
        .max(DIAGRAM_COMPONENT_LIMITS.description, 'Keep the description under 300 characters')
        .default(''),
    color: z.enum(DIAGRAM_COLORS),
    icon: z.enum(DIAGRAM_ICON_KEYS),
    imageUrl: z
        .string()
        .trim()
        .max(2000, 'That link is too long')
        .refine(isImageUrl, 'Upload an image, or paste a link that starts with https://')
        .default(''),
})
export type DiagramComponentInput = z.infer<typeof DiagramComponentSchema>

/** How a node looks when its type was deleted (or isn't loaded): grey, cloud icon, "Component" */
export const unknownDiagramComponent = (code: string): DiagramComponent => ({
    id: '',
    code,
    name: 'Component',
    description: 'This component’s type was deleted. Choose another type for it.',
    color: 'slate',
    icon: 'service',
    imageUrl: '',
    position: Number.MAX_SAFE_INTEGER,
})
