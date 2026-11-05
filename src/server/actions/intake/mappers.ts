import 'server-only'
import { asArray, asObject } from '@/server/data/supabase/json'
import { AnswerSchema, type Answers, type Intake, type IntakeSummary } from '@/@types/intake/Intake'
import { QuestionOptionSchema, type IntakeQuestion, type QuestionOption } from '@/@types/intake/IntakeQuestion'
import { RuleConditionSchema, type IntakeRule, type RuleCondition } from '@/@types/intake/IntakeRule'
import type { Database, Tables } from '@/@types/supabase/database.types'

type Enums = Database['public']['Enums']

/*
 * Rows → app types. Stored jsonb (options, conditions, answers) is re-validated on the way out, so a
 * hand-edited row can't break the intake form or BRD generation: invalid entries are dropped.
 */

const parseList = <T>(value: unknown, parse: (item: unknown) => { success: true; data: T } | { success: false }) =>
    asArray(value).flatMap((item) => {
        const parsed = parse(item)
        return parsed.success ? [parsed.data] : []
    })

export const parseOptions = (value: unknown): QuestionOption[] =>
    parseList(value, (item) => QuestionOptionSchema.safeParse(item))

export const parseConditions = (value: unknown): RuleCondition[] =>
    parseList(value, (item) => RuleConditionSchema.safeParse(item))

export const parseAnswers = (value: unknown): Answers =>
    Object.fromEntries(
        Object.entries(asObject(value)).flatMap(([key, answer]) => {
            const parsed = AnswerSchema.safeParse(answer)
            return parsed.success ? [[key, parsed.data]] : []
        }),
    )

export const mapQuestion = (row: Tables<'intake_questions'>): IntakeQuestion => ({
    id: row.id,
    key: row.key,
    section: row.section,
    label: row.label,
    help: row.help,
    type: row.type,
    options: parseOptions(row.options),
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
    conditions: parseConditions(row.conditions),
    guidance: row.guidance,
    showToCustomer: row.show_to_customer,
    articleIds: row.article_ids,
    assetIds: row.asset_ids,
    active: row.active,
    position: row.position,
})

export const INTAKE_SUMMARY_SELECT =
    'id, title, status, client_id, product_ids, updated_at, client:clients(name), brds(count)'

export const INTAKE_SELECT = `${INTAKE_SUMMARY_SELECT}, answers, notes, created_at, creator:profiles!intakes_created_by_fkey(display_name)`

export interface IntakeSummaryRow {
    id: string
    title: string
    status: Enums['intake_status']
    client_id: string
    product_ids: string[]
    updated_at: string
    client: { name: string } | null
    brds: { count: number }[]
}

export interface IntakeRow extends IntakeSummaryRow {
    answers: unknown
    notes: string
    created_at: string
    creator: { display_name: string } | null
}

export const mapIntakeSummary = (row: IntakeSummaryRow): IntakeSummary => ({
    id: row.id,
    title: row.title,
    status: row.status,
    clientId: row.client_id,
    clientName: row.client?.name ?? '',
    productIds: row.product_ids,
    brdCount: row.brds?.[0]?.count ?? 0,
    updatedAt: new Date(row.updated_at),
})

export const mapIntake = (row: IntakeRow): Intake => ({
    ...mapIntakeSummary(row),
    answers: parseAnswers(row.answers),
    notes: row.notes,
    createdByName: row.creator?.display_name ?? null,
    createdAt: new Date(row.created_at),
})
