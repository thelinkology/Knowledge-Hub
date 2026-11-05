import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { unwrap } from '@/server/data/supabase/errors'
import type { Json } from '@/@types/supabase/database.types'
import type { AuditEvent, AuditQuery } from '@/@types/audit/AuditEvent'
import type { Collection } from '@/@types/common'
import { AUDIT_PAGE_SIZE } from '@/constants/app.constant'

/**
 * Records who did what. Used for changes that matter for fairness and trust: roles, grades,
 * progression rules, manual XP, publishing. (XP awards themselves are audited by the XP ledger.)
 */
export async function recordAudit(
    actorId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    details: Record<string, unknown> = {},
) {
    const { error } = await supabaseAdmin()
        .from('audit_events')
        .insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, details: details as Json })
    // Auditing must not break the action it describes, but a failure is worth knowing about
    if (error) console.error('[audit] Failed to record', action, error)
}

export async function getAuditEvents({ page = 1, entityType }: AuditQuery): Promise<Collection<AuditEvent>> {
    let query = supabaseAdmin()
        .from('audit_events')
        .select('id, action, entity_type, entity_id, details, created_at, actor:profiles(display_name, role)', {
            count: 'exact',
        })
        .order('created_at', { ascending: false })
        .range((page - 1) * AUDIT_PAGE_SIZE, page * AUDIT_PAGE_SIZE - 1)
    if (entityType) query = query.eq('entity_type', entityType)
    const result = await query
    const rows = unwrap(result, 'load the audit log')
    return {
        total: result.count ?? 0,
        records: rows.map((row) => ({
            id: row.id,
            action: row.action,
            entityType: row.entity_type,
            entityId: row.entity_id,
            details: (row.details ?? {}) as Record<string, unknown>,
            actorName: row.actor?.display_name ?? null,
            actorRole: row.actor?.role ?? null,
            createdAt: new Date(row.created_at),
        })),
    }
}
