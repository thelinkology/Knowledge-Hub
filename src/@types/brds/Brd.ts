import { z } from 'zod'
import { AUDIENCES, type Audience } from '@/@types/shared/PublishStatusOptions'
import { MilestoneSchema, type Milestone } from './Milestone'

export const BRD_STATUSES = ['draft', 'final'] as const
export type BrdStatus = (typeof BRD_STATUSES)[number]

export const brdStatusLabel: Record<BrdStatus, string> = { draft: 'Draft', final: 'Final' }

export const brdStatusTagClass: Record<BrdStatus, string> = {
    draft: 'bg-warning-subtle text-warning border-transparent',
    final: 'bg-success-subtle text-success border-transparent',
}

export const brdAudienceLabel: Record<Audience, string> = {
    customer: 'Customer BRD',
    internal: 'Internal delivery brief',
}

export interface BrdSummary {
    id: string
    title: string
    audience: Audience
    status: BrdStatus
    clientId: string
    clientName: string
    intakeId: string | null
    intakeTitle: string | null
    updatedAt: Date
}

export interface Brd extends BrdSummary {
    body: string
    milestones: Milestone[]
    createdByName: string | null
    updatedByName: string | null
    createdAt: Date
}

/** POST /api/intakes/[intakeId]/brds — builds both BRDs from the intake (replaces earlier drafts if asked) */
export const GenerateBrdsSchema = z.object({
    audiences: z.array(z.enum(AUDIENCES)).min(1).default(['customer', 'internal']),
})
export type GenerateBrdsInput = z.infer<typeof GenerateBrdsSchema>

/** PUT /api/brds/[brdId] */
export const SaveBrdSchema = z.object({
    title: z.string().trim().min(2, 'Give the BRD a title').max(200),
    status: z.enum(BRD_STATUSES),
    body: z.string().max(200000).default(''),
    milestones: z.array(MilestoneSchema).max(40).default([]),
})
export type SaveBrdInput = z.infer<typeof SaveBrdSchema>

export const BrdsQuerySchema = z.object({
    clientId: z.string().uuid().optional(),
    intakeId: z.string().uuid().optional(),
    audience: z.enum(AUDIENCES).optional(),
})
export type BrdsQuery = z.infer<typeof BrdsQuerySchema>
