import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, toAppError, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { toJson } from '@/server/data/supabase/json'
import { recordAudit } from '@/server/actions/audit'
import { getProducts, knownProductIds } from '@/server/actions/products'
import {
    INTAKE_SELECT,
    INTAKE_SUMMARY_SELECT,
    mapIntake,
    mapIntakeSummary,
    mapQuestion,
    mapRule,
    type IntakeRow,
    type IntakeSummaryRow,
} from './mappers'
import { conditionIssues, isValuelessOperator, normaliseAnswers } from '@/utils/intakeRuleEditing'
import { ConflictError, DataError, NotFoundError } from '@/@types/errors'
import { isChoiceType, type IntakeQuestion, type IntakeQuestionInput } from '@/@types/intake/IntakeQuestion'
import type { IntakeRule, IntakeRuleInput } from '@/@types/intake/IntakeRule'
import type { Intake, IntakesQuery, IntakeSummary, NewIntakeInput, SaveIntakeInput } from '@/@types/intake/Intake'
import type { IntakeEditorDetails, RuleLinkTitles } from '@/@types/intake/IntakeEditorExtras'
import type { SessionUser } from '@/@types/auth/SessionUser'

/*
 * Discovery intakes: admin-configured questions, IF/ELSE rules (gotchas and best practices) and the
 * intakes themselves. The routes check `settings.manage` (questions, rules) and `requirements.manage`
 * (intakes); the checks here make sure everything an intake or rule refers to exists. The rule engine
 * (utils/intakeRules.ts) is shared with the intake form, so the live panel and the BRDs always agree.
 */

const SETTINGS = 'settings'

const intakeNotFound = () => new NotFoundError('That intake doesn’t exist.', 'INTAKE_NOT_FOUND')
const questionNotFound = () => new NotFoundError('That question doesn’t exist.', 'QUESTION_NOT_FOUND')
const ruleNotFound = () => new NotFoundError('That rule doesn’t exist.', 'RULE_NOT_FOUND')
const duplicateKey = () =>
    new ConflictError('Another question already uses that key. Choose a different key.', 'DUPLICATE_KEY')

/** Throws a 400 when a form refers to a product that doesn't exist */
async function assertProductExists(productId: string | null) {
    if (productId && !(await knownProductIds([productId])).length) {
        throw new DataError('That product doesn’t exist.', 'PRODUCT_NOT_FOUND')
    }
}

// ── Questions (admin settings) ────────────────────────────────────────────────────────────────────

/** Every question (inactive ones too), in form order */
export async function getIntakeQuestions(): Promise<IntakeQuestion[]> {
    return unwrap(
        await supabaseAdmin().from('intake_questions').select('*').order('position').order('label').limit(1000),
        'load the intake questions',
    ).map(mapQuestion)
}

async function findQuestion(questionId: string) {
    const row = unwrapMaybe(
        await supabaseAdmin().from('intake_questions').select('*').eq('id', questionId).maybeSingle(),
        'find the question',
    )
    return row ? mapQuestion(row) : null
}

const questionRow = (input: IntakeQuestionInput) => ({
    key: input.key,
    section: input.section,
    label: input.label,
    help: input.help,
    type: input.type,
    // Only choice questions keep options (a question changed to text drops them)
    options: toJson(isChoiceType(input.type) ? input.options : []),
    required: input.required,
    product_id: input.productId,
    position: input.position,
    active: input.active,
})

/** Titles of the rules whose conditions ask about this question key */
async function rulesUsingKey(key: string) {
    return (await getIntakeRules()).filter((rule) => rule.conditions.some((c) => c.questionKey === key))
}

const ruleTitles = (rules: IntakeRule[]) =>
    rules
        .slice(0, 3)
        .map((r) => `“${r.title}”`)
        .join(', ') + (rules.length > 3 ? ` and ${rules.length - 3} more` : '')

export async function createIntakeQuestion(admin: SessionUser, input: IntakeQuestionInput): Promise<IntakeQuestion> {
    await assertProductExists(input.productId)
    const result = await supabaseAdmin().from('intake_questions').insert(questionRow(input)).select('*').single()
    if (result.error?.code === '23505') throw duplicateKey()
    const question = mapQuestion(unwrap(result, 'create the question'))
    await recordAudit(admin.id, 'settings.intake_question', SETTINGS, question.id, {
        change: 'created',
        key: question.key,
        label: question.label,
    })
    return question
}

/**
 * Saves a question. The key can only change while nothing refers to it: rules' conditions and stored
 * answers are keyed by it, so renaming it would silently disconnect them.
 */
export async function updateIntakeQuestion(
    admin: SessionUser,
    questionId: string,
    input: IntakeQuestionInput,
): Promise<IntakeQuestion> {
    const existing = await findQuestion(questionId)
    if (!existing) throw questionNotFound()
    await assertProductExists(input.productId)
    if (input.key !== existing.key) {
        const rules = await rulesUsingKey(existing.key)
        if (rules.length) {
            throw new ConflictError(
                `The key can’t change while rules use it (${ruleTitles(rules)}). Update those rules first, or keep the key.`,
                'KEY_IN_USE',
            )
        }
        const answered = await supabaseAdmin()
            .from('intakes')
            .select('id', { count: 'exact', head: true })
            .not(`answers->${existing.key}` as 'answers', 'is', null)
        if (answered.error) throw toAppError(answered.error, 'check the key')
        if (answered.count) {
            throw new ConflictError(
                `The key can’t change: ${answered.count} intake(s) have answers stored under “${existing.key}”. Keep the key and change the wording instead.`,
                'KEY_IN_USE',
            )
        }
    }
    const result = await supabaseAdmin()
        .from('intake_questions')
        .update(questionRow(input))
        .eq('id', questionId)
        .select('*')
        .maybeSingle()
    if (result.error?.code === '23505') throw duplicateKey()
    const row = unwrapMaybe(result, 'save the question')
    if (!row) throw questionNotFound()
    const question = mapQuestion(row)
    await recordAudit(admin.id, 'settings.intake_question', SETTINGS, questionId, {
        change: 'updated',
        key: question.key,
        label: question.label,
        ...(existing.key !== question.key ? { previousKey: existing.key } : {}),
    })
    return question
}

/**
 * Deletes a question. Answers already given to it stay in the intakes (no longer shown). Refused while
 * rules use it — their conditions would otherwise never (or always) match.
 */
export async function deleteIntakeQuestion(admin: SessionUser, questionId: string) {
    const existing = await findQuestion(questionId)
    if (!existing) throw questionNotFound()
    const rules = await rulesUsingKey(existing.key)
    if (rules.length) {
        throw new ConflictError(
            `Rules use this question (${ruleTitles(rules)}). Change or delete those rules first, or make the question inactive instead.`,
            'QUESTION_IN_USE',
        )
    }
    check(await supabaseAdmin().from('intake_questions').delete().eq('id', questionId), 'delete the question')
    await recordAudit(admin.id, 'settings.intake_question', SETTINGS, questionId, {
        change: 'deleted',
        key: existing.key,
        label: existing.label,
    })
}

// ── IF/ELSE rules (admin settings) ────────────────────────────────────────────────────────────────

/** Every rule (or only active ones), in evaluation order */
export async function getIntakeRules({ activeOnly = false }: { activeOnly?: boolean } = {}): Promise<IntakeRule[]> {
    let query = supabaseAdmin().from('intake_rules').select('*').order('position').order('title').limit(1000)
    if (activeOnly) query = query.eq('active', true)
    return unwrap(await query, 'load the rules').map(mapRule)
}

async function findRule(ruleId: string) {
    const row = unwrapMaybe(
        await supabaseAdmin().from('intake_rules').select('*').eq('id', ruleId).maybeSingle(),
        'find the rule',
    )
    return row ? mapRule(row) : null
}

/** The ids that exist (unknown ids are dropped, so a stale picker can't link to nothing) */
async function knownIds(table: 'articles' | 'library_assets', ids: string[]): Promise<string[]> {
    const unique = [...new Set(ids)]
    if (!unique.length) return []
    const rows = unwrap(await supabaseAdmin().from(table).select('id').in('id', unique), 'check the linked items')
    const known = new Set(rows.map((r) => r.id))
    return unique.filter((id) => known.has(id))
}

/** Checks the rule's product, conditions (existing questions, valid values) and links → a row */
async function ruleRow(input: IntakeRuleInput) {
    await assertProductExists(input.productId)
    const issues = conditionIssues(input.conditions, await getIntakeQuestions())
    if (issues.length) throw new DataError(issues[0], 'INVALID_CONDITION')
    const [articleIds, assetIds] = await Promise.all([
        knownIds('articles', input.articleIds),
        knownIds('library_assets', input.assetIds),
    ])
    return {
        title: input.title,
        kind: input.kind,
        product_id: input.productId,
        match: input.match,
        conditions: toJson(
            input.conditions.map((c) => ({
                questionKey: c.questionKey,
                operator: c.operator,
                value: isValuelessOperator(c.operator) ? '' : c.value,
            })),
        ),
        guidance: input.guidance,
        // Gotchas stay internal; only best practices can appear in the customer BRD
        show_to_customer: input.kind === 'best_practice' && input.showToCustomer,
        article_ids: articleIds,
        asset_ids: assetIds,
        active: input.active,
        position: input.position,
    }
}

export async function createIntakeRule(admin: SessionUser, input: IntakeRuleInput): Promise<IntakeRule> {
    const rule = mapRule(
        unwrap(
            await supabaseAdmin()
                .from('intake_rules')
                .insert(await ruleRow(input))
                .select('*')
                .single(),
            'create the rule',
        ),
    )
    await recordAudit(admin.id, 'settings.intake_rule', SETTINGS, rule.id, {
        change: 'created',
        title: rule.title,
        kind: rule.kind,
    })
    return rule
}

export async function updateIntakeRule(admin: SessionUser, ruleId: string, input: IntakeRuleInput) {
    if (!(await findRule(ruleId))) throw ruleNotFound()
    const row = unwrapMaybe(
        await supabaseAdmin()
            .from('intake_rules')
            .update(await ruleRow(input))
            .eq('id', ruleId)
            .select('*')
            .maybeSingle(),
        'save the rule',
    )
    if (!row) throw ruleNotFound()
    const rule = mapRule(row)
    await recordAudit(admin.id, 'settings.intake_rule', SETTINGS, ruleId, {
        change: 'updated',
        title: rule.title,
        kind: rule.kind,
        active: rule.active,
    })
    return rule
}

export async function deleteIntakeRule(admin: SessionUser, ruleId: string) {
    const existing = await findRule(ruleId)
    if (!existing) throw ruleNotFound()
    check(await supabaseAdmin().from('intake_rules').delete().eq('id', ruleId), 'delete the rule')
    await recordAudit(admin.id, 'settings.intake_rule', SETTINGS, ruleId, {
        change: 'deleted',
        title: existing.title,
        kind: existing.kind,
    })
}

/** Titles of the articles and library assets the rules link to (missing items are left out) */
export async function getRuleLinkTitles(rules: Pick<IntakeRule, 'articleIds' | 'assetIds'>[]): Promise<RuleLinkTitles> {
    const articleIds = [...new Set(rules.flatMap((r) => r.articleIds))]
    const assetIds = [...new Set(rules.flatMap((r) => r.assetIds))]
    const db = supabaseAdmin()
    const [articles, assets] = await Promise.all([
        articleIds.length
            ? db.from('articles').select('id, title').in('id', articleIds).order('title')
            : { data: [], error: null },
        assetIds.length
            ? db.from('library_assets').select('id, title').in('id', assetIds).order('title')
            : { data: [], error: null },
    ])
    return {
        articles: unwrap(articles, 'load the linked articles'),
        assets: unwrap(assets, 'load the linked assets'),
    }
}

// ── Intakes ───────────────────────────────────────────────────────────────────────────────────────

export async function getIntakes(query: IntakesQuery = {}): Promise<IntakeSummary[]> {
    let q = supabaseAdmin()
        .from('intakes')
        .select(INTAKE_SUMMARY_SELECT)
        .order('updated_at', { ascending: false })
        .limit(500)
    if (query.clientId) q = q.eq('client_id', query.clientId)
    if (query.status) q = q.eq('status', query.status)
    return unwrap(await q, 'load intakes').map((row) => mapIntakeSummary(row as unknown as IntakeSummaryRow))
}

async function loadIntake(intakeId: string): Promise<Intake | null> {
    const row = unwrapMaybe(
        await supabaseAdmin().from('intakes').select(INTAKE_SELECT).eq('id', intakeId).maybeSingle(),
        'load the intake',
    )
    return row ? mapIntake(row as unknown as IntakeRow) : null
}

/** Everything the intake form needs: the intake, every question, the active rules, products and link titles */
export async function getIntakeEditor(intakeId: string): Promise<IntakeEditorDetails> {
    const intake = await loadIntake(intakeId)
    if (!intake) throw intakeNotFound()
    const [questions, rules, products] = await Promise.all([
        getIntakeQuestions(),
        getIntakeRules({ activeOnly: true }),
        getProducts(),
    ])
    return { intake, questions, rules, products, links: await getRuleLinkTitles(rules) }
}

/** A new draft intake for a client. Without products, the client's products are in scope. */
export async function createIntake(user: SessionUser, input: NewIntakeInput): Promise<Intake> {
    const client = unwrapMaybe(
        await supabaseAdmin().from('clients').select('id, product_ids').eq('id', input.clientId).maybeSingle(),
        'find the client',
    )
    if (!client) throw new DataError('That client doesn’t exist.', 'CLIENT_NOT_FOUND')
    const productIds = await knownProductIds(input.productIds.length ? input.productIds : client.product_ids)
    const inserted = unwrap(
        await supabaseAdmin()
            .from('intakes')
            .insert({
                client_id: client.id,
                title: input.title,
                product_ids: productIds,
                created_by: user.id,
                updated_by: user.id,
            })
            .select('id')
            .single(),
        'create the intake',
    )
    return (await loadIntake(inserted.id)) as Intake
}

/**
 * Saves the form. Answers are kept only for existing questions (hidden ones too — changing the products
 * back shows them again) and stored in the shape their question expects.
 */
export async function saveIntake(user: SessionUser, intakeId: string, input: SaveIntakeInput) {
    if (!(await loadIntake(intakeId))) throw intakeNotFound()
    const answers = normaliseAnswers(await getIntakeQuestions(), input.answers)
    check(
        await supabaseAdmin()
            .from('intakes')
            .update({
                title: input.title,
                status: input.status,
                product_ids: await knownProductIds(input.productIds),
                answers: toJson(answers),
                notes: input.notes,
                updated_by: user.id,
            })
            .eq('id', intakeId),
        'save the intake',
    )
    return getIntakeEditor(intakeId)
}

/** Deletes the intake. BRDs generated from it are kept (no longer linked to it). */
export async function deleteIntake(user: SessionUser, intakeId: string) {
    const intake = await loadIntake(intakeId)
    if (!intake) throw intakeNotFound()
    check(await supabaseAdmin().from('intakes').delete().eq('id', intakeId), 'delete the intake')
    await recordAudit(user.id, 'intake.deleted', 'intake', intakeId, {
        title: intake.title,
        clientId: intake.clientId,
        clientName: intake.clientName,
    })
}
