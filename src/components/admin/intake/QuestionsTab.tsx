'use client'

import { Fragment, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { ProductTag } from '@/components/shared/KnowledgeTags'
import QuestionDialog from './QuestionDialog'
import navigationIcon, { AddIcon, DeleteIcon, EditIcon } from '@/configs/icons.config'
import { apiDeleteIntakeQuestion } from '@/services/intake'
import { useProductsStore } from '@/stores/AppStores'
import { useIntakeQuestionsStore, useIntakeRulesStore } from '@/stores/IntakeStores'
import { groupBySection } from '@/utils/intakeRules'
import { questionTypeLabel, type IntakeQuestion } from '@/@types/intake/IntakeQuestion'

const { THead, TBody, Tr, Th, Td } = Table

/** The discovery questionnaire: questions grouped by section, with create / edit / delete */
export default function QuestionsTab() {
    const questions = useIntakeQuestionsStore((s) => s.data)
    const loading = useIntakeQuestionsStore((s) => s.loading)
    const error = useIntakeQuestionsStore((s) => s.error)
    const refresh = useIntakeQuestionsStore((s) => s.refresh)
    const rules = useIntakeRulesStore((s) => s.data)
    const products = useProductsStore((s) => s.data)

    const [editing, setEditing] = useState<IntakeQuestion | 'new' | null>(null)
    const [deleting, setDeleting] = useState<IntakeQuestion | null>(null)
    const [busy, setBusy] = useState(false)

    const sorted = useMemo(
        () => [...(questions ?? [])].sort((a, b) => a.position - b.position || a.label.localeCompare(b.label)),
        [questions],
    )
    const sections = useMemo(() => groupBySection(sorted), [sorted])
    const rulesUsing = (key: string) => (rules ?? []).filter((r) => r.conditions.some((c) => c.questionKey === key))
    const deletingRules = deleting ? rulesUsing(deleting.key) : []

    const remove = async () => {
        if (!deleting) return
        setBusy(true)
        try {
            await apiDeleteIntakeQuestion(deleting.id)
            toastSuccess('Question deleted.')
            setDeleting(null)
            await refresh()
        } catch (e) {
            toastError('Couldn’t delete the question.', e)
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card
            bodyClass="p-0"
            header={{
                content: 'Questions',
                extra: (
                    <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setEditing('new')}>
                        Add question
                    </Button>
                ),
            }}
        >
            {error && !questions ? (
                <ErrorState message={error} onRetry={() => void refresh()} />
            ) : (
                <Loading loading={loading && !questions} message="Loading questions…">
                    {sorted.length === 0 ? (
                        <EmptyState
                            icon={navigationIcon.intake}
                            title="No questions yet"
                            description="Intakes ask these questions. Add the first one: what you always need to know in discovery."
                            action={
                                <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setEditing('new')}>
                                    Add question
                                </Button>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table hoverable>
                                <THead>
                                    <Tr>
                                        <Th>Question</Th>
                                        <Th>Type</Th>
                                        <Th>Product</Th>
                                        <Th>Required</Th>
                                        <Th>Status</Th>
                                        <Th>
                                            <span className="sr-only">Actions</span>
                                        </Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {sections.map((group) => (
                                        <Fragment key={group.section}>
                                            <Tr>
                                                <Th
                                                    colSpan={6}
                                                    scope="colgroup"
                                                    className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                                >
                                                    {group.section}
                                                </Th>
                                            </Tr>
                                            {group.questions.map((question) => {
                                                const usedBy = rulesUsing(question.key).length
                                                return (
                                                    <Tr
                                                        key={question.id}
                                                        className={question.active ? undefined : 'opacity-60'}
                                                    >
                                                        <Td className="min-w-64">
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {question.label}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                                <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">
                                                                    {question.key}
                                                                </code>
                                                                {usedBy > 0 && (
                                                                    <span>
                                                                        Used by {usedBy} rule{usedBy === 1 ? '' : 's'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Td>
                                                        <Td className="whitespace-nowrap">
                                                            {questionTypeLabel[question.type]}
                                                            {question.options.length > 0 && (
                                                                <span className="text-xs text-gray-500">
                                                                    {' '}
                                                                    · {question.options.length} options
                                                                </span>
                                                            )}
                                                        </Td>
                                                        <Td>
                                                            {question.productId ? (
                                                                <ProductTag
                                                                    productId={question.productId}
                                                                    products={products}
                                                                />
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    Every product
                                                                </span>
                                                            )}
                                                        </Td>
                                                        <Td>{question.required ? 'Required' : 'Optional'}</Td>
                                                        <Td>
                                                            <Tag
                                                                className={
                                                                    question.active
                                                                        ? 'border-transparent bg-success-subtle text-success'
                                                                        : 'border-transparent bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                                }
                                                            >
                                                                {question.active ? 'Active' : 'Inactive'}
                                                            </Tag>
                                                        </Td>
                                                        <Td className="whitespace-nowrap text-right">
                                                            <Tooltip title="Edit">
                                                                <Button
                                                                    size="xs"
                                                                    variant="plain"
                                                                    icon={<EditIcon />}
                                                                    aria-label={`Edit “${question.label}”`}
                                                                    onClick={() => setEditing(question)}
                                                                />
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <Button
                                                                    size="xs"
                                                                    variant="plain"
                                                                    icon={<DeleteIcon />}
                                                                    aria-label={`Delete “${question.label}”`}
                                                                    onClick={() => setDeleting(question)}
                                                                />
                                                            </Tooltip>
                                                        </Td>
                                                    </Tr>
                                                )
                                            })}
                                        </Fragment>
                                    ))}
                                </TBody>
                            </Table>
                        </div>
                    )}
                </Loading>
            )}

            {editing && (
                <QuestionDialog
                    question={editing === 'new' ? null : editing}
                    questions={sorted}
                    usedByRules={editing === 'new' ? 0 : rulesUsing(editing.key).length}
                    onClose={() => setEditing(null)}
                />
            )}
            <ConfirmDialog
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                type="danger"
                title="Delete this question?"
                confirmText="Delete question"
                onConfirm={() => void remove()}
                loading={busy}
                confirmButtonProps={{ disabled: deletingRules.length > 0 }}
            >
                {deletingRules.length > 0 ? (
                    <>
                        It can’t be deleted while rules use it ({deletingRules.map((r) => `“${r.title}”`).join(', ')}).
                        Change those rules first, or edit the question and make it inactive instead.
                    </>
                ) : (
                    <>
                        “{deleting?.label}” is removed from the questionnaire. Answers already given to it (key{' '}
                        <code>{deleting?.key}</code>) are kept in existing intakes but no longer shown. This can’t be
                        undone. (Making it inactive hides it instead.)
                    </>
                )}
            </ConfirmDialog>
        </Card>
    )
}
