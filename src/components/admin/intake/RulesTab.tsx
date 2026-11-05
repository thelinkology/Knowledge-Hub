'use client'

import { useId, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Segment from '@/components/ui/Segment'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { ProductTag } from '@/components/shared/KnowledgeTags'
import RuleDialog from './RuleDialog'
import navigationIcon, { AddIcon, BestPracticeIcon, DeleteIcon, EditIcon, GotchaIcon } from '@/configs/icons.config'
import { apiDeleteIntakeRule, apiUpdateIntakeRule } from '@/services/intake'
import { useProductsStore } from '@/stores/AppStores'
import { useIntakeQuestionsStore, useIntakeRulesStore } from '@/stores/IntakeStores'
import { describeConditions } from '@/utils/intakeRuleEditing'
import classNames from '@/utils/classNames'
import {
    RULE_KINDS,
    ruleKindLabel,
    ruleKindTagClass,
    type IntakeRule,
    type IntakeRuleInput,
    type RuleKind,
} from '@/@types/intake/IntakeRule'

const KIND_FILTERS: { value: RuleKind | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    ...RULE_KINDS.map((kind) => ({ value: kind, label: kind === 'gotcha' ? 'Gotchas' : 'Best practices' })),
]

/** The stored rule as a save request (for quick changes like the active toggle) */
export const ruleToInput = (rule: IntakeRule): IntakeRuleInput => ({
    title: rule.title,
    kind: rule.kind,
    productId: rule.productId,
    match: rule.match,
    conditions: rule.conditions,
    guidance: rule.guidance,
    showToCustomer: rule.showToCustomer,
    articleIds: rule.articleIds,
    assetIds: rule.assetIds,
    active: rule.active,
    position: rule.position,
})

/** IF/ELSE rules: when an intake's answers meet the conditions, the guidance shows and goes into the BRDs */
export default function RulesTab() {
    const uid = useId()
    const rules = useIntakeRulesStore((s) => s.data)
    const loading = useIntakeRulesStore((s) => s.loading)
    const error = useIntakeRulesStore((s) => s.error)
    const refresh = useIntakeRulesStore((s) => s.refresh)
    const questions = useIntakeQuestionsStore((s) => s.data)
    const products = useProductsStore((s) => s.data)

    const [kind, setKind] = useState<RuleKind | null>(null)
    const [editing, setEditing] = useState<IntakeRule | 'new' | null>(null)
    const [deleting, setDeleting] = useState<IntakeRule | null>(null)
    const [busy, setBusy] = useState(false)
    const [toggling, setToggling] = useState<string | null>(null)

    const sorted = useMemo(
        () => [...(rules ?? [])].sort((a, b) => a.position - b.position || a.title.localeCompare(b.title)),
        [rules],
    )
    const shown = kind ? sorted.filter((r) => r.kind === kind) : sorted

    const toggleActive = async (rule: IntakeRule, active: boolean) => {
        setToggling(rule.id)
        try {
            await apiUpdateIntakeRule(rule.id, { ...ruleToInput(rule), active })
            toastSuccess(active ? `“${rule.title}” is on.` : `“${rule.title}” is off.`, { duration: 3000 })
            await refresh()
        } catch (e) {
            toastError('Couldn’t change the rule.', e)
        } finally {
            setToggling(null)
        }
    }

    const remove = async () => {
        if (!deleting) return
        setBusy(true)
        try {
            await apiDeleteIntakeRule(deleting.id)
            toastSuccess('Rule deleted.')
            setDeleting(null)
            await refresh()
        } catch (e) {
            toastError('Couldn’t delete the rule.', e)
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card
            bodyClass="p-0"
            header={{
                content: 'IF/ELSE rules',
                extra: (
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<AddIcon />}
                        onClick={() => setEditing('new')}
                        disabled={!questions?.length}
                    >
                        Add rule
                    </Button>
                ),
            }}
        >
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gotchas stay internal. Best practices can also appear in the customer BRD.
                </p>
                <Segment
                    size="sm"
                    value={kind ?? 'all'}
                    onChange={(value) => {
                        if (typeof value !== 'string' || !value) return
                        setKind(value === 'all' ? null : (value as RuleKind))
                    }}
                    aria-label="Filter by kind"
                    className="self-start md:self-auto"
                >
                    {KIND_FILTERS.map((filter) => (
                        <Segment.Item key={filter.value} value={filter.value} type="button">
                            {filter.label}
                        </Segment.Item>
                    ))}
                </Segment>
            </div>

            {error && !rules ? (
                <ErrorState message={error} onRetry={() => void refresh()} />
            ) : (
                <Loading loading={loading && !rules} message="Loading rules…">
                    {shown.length === 0 ? (
                        <EmptyState
                            icon={navigationIcon.rules}
                            title={kind ? `No ${kind === 'gotcha' ? 'gotchas' : 'best practices'} yet` : 'No rules yet'}
                            description={
                                questions?.length
                                    ? 'A rule says: IF the answers look like this, THEN flag this gotcha or best practice. Add one for a lesson your team learned the hard way.'
                                    : 'Rules ask about questions. Add questions first, then come back to add rules.'
                            }
                            action={
                                questions?.length ? (
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<AddIcon />}
                                        onClick={() => setEditing('new')}
                                    >
                                        Add rule
                                    </Button>
                                ) : undefined
                            }
                        />
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {shown.map((rule) => {
                                const switchId = `${uid}-active-${rule.id}`
                                const links = rule.articleIds.length + rule.assetIds.length
                                return (
                                    <li
                                        key={rule.id}
                                        className={classNames(
                                            'flex flex-col gap-3 p-4 md:flex-row md:items-start',
                                            !rule.active && 'opacity-70',
                                        )}
                                    >
                                        <span
                                            className={classNames(
                                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl',
                                                rule.kind === 'gotcha'
                                                    ? 'bg-warning-subtle text-warning'
                                                    : 'bg-success-subtle text-success',
                                            )}
                                            aria-hidden
                                        >
                                            {rule.kind === 'gotcha' ? <GotchaIcon /> : <BestPracticeIcon />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {rule.title}
                                                </span>
                                                <Tag className={ruleKindTagClass[rule.kind]}>
                                                    {ruleKindLabel[rule.kind]}
                                                </Tag>
                                                <ProductTag productId={rule.productId} products={products} />
                                                <span className="text-xs text-gray-500">
                                                    {rule.showToCustomer ? 'Customer BRD' : 'Internal only'}
                                                    {links > 0 && ` · ${links} link${links === 1 ? '' : 's'}`}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {describeConditions(rule, questions ?? [])}{' '}
                                                <span className="font-semibold">THEN</span> show this{' '}
                                                {rule.kind === 'gotcha' ? 'gotcha' : 'best practice'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Switcher
                                                id={switchId}
                                                checked={rule.active}
                                                isLoading={toggling === rule.id}
                                                onChange={(checked) => void toggleActive(rule, checked)}
                                            />
                                            <label
                                                htmlFor={switchId}
                                                className="text-sm text-gray-600 dark:text-gray-300"
                                            >
                                                <span className="sr-only">{rule.title}: </span>
                                                {rule.active ? 'On' : 'Off'}
                                            </label>
                                            <Tooltip title="Edit">
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    icon={<EditIcon />}
                                                    aria-label={`Edit “${rule.title}”`}
                                                    onClick={() => setEditing(rule)}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    icon={<DeleteIcon />}
                                                    aria-label={`Delete “${rule.title}”`}
                                                    onClick={() => setDeleting(rule)}
                                                />
                                            </Tooltip>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </Loading>
            )}

            {editing && questions && (
                <RuleDialog
                    rule={editing === 'new' ? null : editing}
                    rules={sorted}
                    questions={questions}
                    onClose={() => setEditing(null)}
                />
            )}
            <ConfirmDialog
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                type="danger"
                title="Delete this rule?"
                confirmText="Delete rule"
                onConfirm={() => void remove()}
                loading={busy}
            >
                “{deleting?.title}” stops appearing on intakes and in newly generated BRDs. BRDs already generated keep
                their text. This can’t be undone. (Turning it off keeps it for later instead.)
            </ConfirmDialog>
        </Card>
    )
}
