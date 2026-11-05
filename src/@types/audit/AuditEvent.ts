import { z } from 'zod'
import type { Role } from '@/@types/auth/Roles'

export interface AuditEvent {
    id: string
    action: string
    entityType: string
    entityId: string | null
    details: Record<string, unknown>
    actorName: string | null
    actorRole: Role | null
    createdAt: Date
}

export const AuditQuerySchema = z.object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    entityType: z.string().max(40).optional(),
})
export type AuditQuery = z.infer<typeof AuditQuerySchema>

/** Human wording for audit actions */
export const auditActionLabel: Record<string, string> = {
    'user.role_changed': 'Changed a role',
    'user.invited': 'Invited someone',
    'user.deleted': 'Deleted an account',
    'client.created': 'Created a client',
    'client.deleted': 'Deleted a client',
    'collection.created': 'Created a collection',
    'collection.deleted': 'Deleted a collection',
    'article.published': 'Published an article',
    'article.draft': 'Unpublished an article',
    'article.archived': 'Archived an article',
    'article.deleted': 'Deleted an article',
    'article.restored': 'Restored an article version',
    'asset.published': 'Published a library asset',
    'asset.deleted': 'Deleted a library asset',
    'product.created': 'Created a product',
    'product.updated': 'Updated a product',
    'intake.deleted': 'Deleted an intake',
    'brd.generated': 'Generated BRDs',
    'brd.finalized': 'Finalised a BRD',
    'brd.deleted': 'Deleted a BRD',
    'settings.intake_question': 'Changed an intake question',
    'settings.intake_rule': 'Changed an intake rule',
    'api_key.created': 'Created an agent API key',
    'api_key.revoked': 'Revoked an agent API key',
}
