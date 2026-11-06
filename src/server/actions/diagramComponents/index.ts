import 'server-only'
import { cache } from 'react'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, toAppError, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { newDiagramId } from '@/utils/diagram'
import { slugify } from '@/utils/slugs'
import { NotFoundError } from '@/@types/errors'
import {
    isDiagramColor,
    isDiagramIconKey,
    type DiagramComponent,
    type DiagramComponentInput,
} from '@/@types/library/DiagramComponent'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { Tables } from '@/@types/supabase/database.types'

/*
 * Architecture diagram component types (the designer's palette). Everyone signed in reads them (the reader
 * needs their colours and icons); editors and admins add, change and delete them (routes check
 * `knowledge.manage`). Deleting a type never touches diagrams: their nodes keep the code and show the
 * fallback look (unknownDiagramComponent) until someone picks another type.
 */

const notFound = () => new NotFoundError('That component type doesn’t exist (it may have been deleted).', 'NOT_FOUND')

export const mapDiagramComponent = (row: Tables<'diagram_components'>): DiagramComponent => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    color: isDiagramColor(row.color) ? row.color : 'slate',
    icon: isDiagramIconKey(row.icon) ? row.icon : 'service',
    imageUrl: row.image_url,
    position: row.position,
})

/** Every component type in palette order. Cached per request. */
export const getDiagramComponents = cache(async (): Promise<DiagramComponent[]> =>
    unwrap(
        await supabaseAdmin().from('diagram_components').select('*').order('position').order('name'),
        'load the diagram components',
    ).map(mapDiagramComponent),
)

const toRow = (input: DiagramComponentInput) => ({
    name: input.name,
    description: input.description,
    color: input.color,
    icon: input.icon,
    image_url: input.imageUrl,
})

/** "Azure Function" → "azure_function" (what nodes store); a random suffix when that's taken */
const codeFor = (name: string, attempt: number) => {
    const base = slugify(name).replace(/-/g, '_').slice(0, 36).replace(/_+$/, '') || 'component'
    return attempt === 0 ? base : `${base}_${newDiagramId('n').slice(2, 8)}`
}

export async function createDiagramComponent(
    user: SessionUser,
    input: DiagramComponentInput,
): Promise<DiagramComponent> {
    const last = unwrapMaybe(
        await supabaseAdmin()
            .from('diagram_components')
            .select('position')
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle(),
        'add the component type',
    )
    for (let attempt = 0; attempt < 4; attempt++) {
        const result = await supabaseAdmin()
            .from('diagram_components')
            .insert({
                ...toRow(input),
                code: codeFor(input.name, attempt),
                position: (last?.position ?? 0) + 1,
                created_by: user.id,
                updated_by: user.id,
            })
            .select('*')
            .single()
        if (result.error?.code === '23505') continue // the code is taken: try again with a suffix
        const component = mapDiagramComponent(unwrap(result, 'add the component type'))
        await recordAudit(user.id, 'diagram_component.created', 'diagram_component', component.id, {
            name: component.name,
            code: component.code,
        })
        return component
    }
    throw toAppError(new Error('No free code'), 'add the component type')
}

export async function updateDiagramComponent(
    user: SessionUser,
    componentId: string,
    input: DiagramComponentInput,
): Promise<DiagramComponent> {
    const result = await supabaseAdmin()
        .from('diagram_components')
        .update({ ...toRow(input), updated_by: user.id })
        .eq('id', componentId)
        .select('*')
        .maybeSingle()
    const row = unwrapMaybe(result, 'save the component type')
    if (!row) throw notFound()
    await recordAudit(user.id, 'diagram_component.updated', 'diagram_component', componentId, { name: row.name })
    return mapDiagramComponent(row)
}

/** Diagrams that use the type keep their nodes (shown with the fallback look) */
export async function deleteDiagramComponent(user: SessionUser, componentId: string): Promise<void> {
    const row = unwrapMaybe(
        await supabaseAdmin().from('diagram_components').select('name, code').eq('id', componentId).maybeSingle(),
        'delete the component type',
    )
    if (!row) throw notFound()
    check(await supabaseAdmin().from('diagram_components').delete().eq('id', componentId), 'delete the component type')
    await recordAudit(user.id, 'diagram_component.deleted', 'diagram_component', componentId, {
        name: row.name,
        code: row.code,
    })
}
