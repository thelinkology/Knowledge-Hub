'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { ArticleKindTag, ProductTag, PublishStatusTag } from '@/components/shared/KnowledgeTags'
import navigationIcon, { AddIcon } from '@/configs/icons.config'
import { getArticleEditPath, getArticlePath, knowledgePath } from '@/configs/app.config'
import { apiCreateArticle, useSWRArticles } from '@/services/knowledge'
import { useProductsStore } from '@/stores/AppStores'
import { NewArticleSchema } from '@/@types/knowledge/Article'
import useSession from '@/utils/hooks/useSession'
import { tryGetErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/dates'
import type { ClientOption } from '@/@types/clients/Client'

const FORM_ID = 'new-client-article-form'
const TitleSchema = NewArticleSchema.pick({ title: true })
type TitleInput = { title: string }

interface ClientKnowledgeTabProps {
    client: ClientOption
}

/** The articles written for one client (shared knowledge lives in the Knowledge section) */
export default function ClientKnowledgeTab({ client }: ClientKnowledgeTabProps) {
    const { can } = useSession()
    const canManage = can('knowledge.manage')
    const articles = useSWRArticles({ clientId: client.id })
    const products = useProductsStore((s) => s.data)
    const [creating, setCreating] = useState(false)
    const list = articles.data ?? []

    const newButton = canManage && (
        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setCreating(true)}>
            New article for this client
        </Button>
    )

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Articles written for {client.name}. Knowledge for every client is in{' '}
                    <Link href={knowledgePath} className="text-primary hover:underline">
                        Knowledge
                    </Link>
                    .
                </p>
                {list.length > 0 && newButton}
            </div>
            {articles.error && !articles.data ? (
                <ErrorState message={tryGetErrorMessage(articles.error)} onRetry={() => void articles.mutate()} />
            ) : (
                <Loading loading={articles.isLoading && !articles.data} message="Loading articles…">
                    {list.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={navigationIcon.article}
                                title="No articles for this client yet"
                                description={
                                    canManage
                                        ? `Write up ${client.name}’s environments, decisions and how-tos so anyone on the account can find them.`
                                        : `Editors write ${client.name}’s environments, decisions and how-tos here.`
                                }
                                action={newButton || undefined}
                            />
                        </Card>
                    ) : (
                        <Card bodyClass="p-0">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {list.map((article) => (
                                    <li key={article.id} className="p-4">
                                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                            <ArticleKindTag kind={article.kind} />
                                            <ProductTag productId={article.productId} products={products} />
                                            {article.status !== 'published' && (
                                                <PublishStatusTag status={article.status} />
                                            )}
                                        </div>
                                        <Link
                                            href={getArticlePath(article.id)}
                                            className="font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                                        >
                                            {article.title}
                                        </Link>
                                        {article.summary && (
                                            <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                                {article.summary}
                                            </p>
                                        )}
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {article.collectionTitle && `In ${article.collectionTitle} · `}
                                            Updated {formatDate(article.updatedAt)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </Loading>
            )}
            {creating && <NewClientArticleDialog client={client} onClose={() => setCreating(false)} />}
        </>
    )
}

/** Asks for a title, creates a draft article for the client, then opens the editor */
function NewClientArticleDialog({ client, onClose }: { client: ClientOption; onClose: () => void }) {
    const router = useRouter()
    const form = useForm<TitleInput>({ resolver: zodResolver(TitleSchema), defaultValues: { title: '' } })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form

    const onValid = async ({ title }: TitleInput) => {
        try {
            const article = await apiCreateArticle({
                title: title.trim(),
                kind: 'concept',
                clientId: client.id,
                collectionId: null,
                productId: null,
            })
            toastSuccess('Draft created. Write it, then publish it.', { duration: 4000 })
            router.push(getArticleEditPath(article.id))
        } catch (error) {
            toastError('The article couldn’t be created.', error)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title={`New article for ${client.name}`}
            confirmText="Create and edit"
            confirmForm={FORM_ID}
            loading={isSubmitting}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Title"
                        htmlFor="client-article-title"
                        asterisk
                        invalid={!!errors.title}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input id="client-article-title" autoFocus maxLength={200} {...field} />
                            )}
                        />
                    </FormItem>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        It starts as a draft only editors can see. You can change its type, collection and product in
                        the editor.
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
