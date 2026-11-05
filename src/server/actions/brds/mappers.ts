import 'server-only'
import { asArray, asObject } from '@/server/data/supabase/json'
import { parseMilestones } from '@/server/actions/products'
import { QuestionOptionSchema, type IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import { RuleConditionSchema, type IntakeRule } from '@/@types/intake/IntakeRule'
import { AnswerSchema, type Answers } from '@/@types/intake/Intake'
import type { Brd, BrdSummary } from '@/@types/brds/Brd'
import type { Database, Tables } from '@/@types/supabase/database.types'

type Enums = Database['public']['Enums']

export const BRD_SUMMARY_SELECT =
    'id, title, audience, status, client_id, intake_id, updated_at, client:clients(name), intake:intakes(title)'

export const BRD_SELECT = `${BRD_SUMMARY_SELECT}, body, milestones, created_at, creator:profiles!brds_created_by_fkey(display_name), updater:profiles!brds_updated_by_fkey(display_name)`

export interface BrdSummaryRow {
    id: string
    title: string
    audience: Enums['audience']
    status: Enums['brd_status']
    client_id: string
    intake_id: string | null
    updated_at: string
    client: { name: string } | null
    intake: { title: string } | null
}

export interface BrdRow extends BrdSummaryRow {
    body: string
    milestones: unknown
    created_at: string
    creator: { display_name: string } | null
    updater: { display_name: string } | null
}

export const mapBrdSummary = (row: BrdSummaryRow): BrdSummary => ({
    id: row.id,
    title: row.title,
    audience: row.audience,
    status: row.status,
    clientId: row.client_id,
    clientName: row.client?.name ?? '',
    intakeId: row.intake_id,
    intakeTitle: row.intake?.title ?? null,
    updatedAt: new Date(row.updated_at),
})

export const mapBrd = (row: BrdRow): Brd => ({
    ...mapBrdSummary(row),
    body: row.body,
    milestones: parseMilestones(row.milestones),
    createdByName: row.creator?.display_name ?? null,
    updatedByName: row.updater?.display_name ?? null,
    createdAt: new Date(row.created_at),
})

// ── Intake configuration (re-validated on the way out, so a hand-edited row can't break a BRD) ────────

export const mapQuestion = (row: Tables<'intake_questions'>): IntakeQuestion => ({
    id: row.id,
    key: row.key,
    section: row.section,
    label: row.label,
    help: row.help,
    type: row.type,
    options: asArray(row.options).flatMap((o) => {
        const parsed = QuestionOptionSchema.safeParse(o)
        return parsed.success ? [parsed.data] : []
    }),
    required: row.required,
    productId: row.product_id,
    position: row.position,
    active: row.active,
})

export const mapRule = (row: Tables<'intake_rules'>): IntakeRule => ({
    id: row.id,
    title: row.title,
    kind: row.kind,
    productId: row.product_id,
    match: row.match === 'any' ? 'any' : 'all',
    conditions: asArray(row.conditions).flatMap((c) => {
        const parsed = RuleConditionSchema.safeParse(c)
        return parsed.success ? [parsed.data] : []
    }),
    guidance: row.guidance,
    showToCustomer: row.show_to_customer,
    articleIds: row.article_ids,
    assetIds: row.asset_ids,
    active: row.active,
    position: row.position,
})

export const parseAnswers = (value: unknown): Answers =>
    Object.fromEntries(
        Object.entries(asObject(value)).flatMap(([key, answer]) => {
            const parsed = AnswerSchema.safeParse(answer)
            return parsed.success ? [[key, parsed.data]] : []
        }),
    )
