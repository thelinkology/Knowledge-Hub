'use client'

import { useRouter } from 'next/navigation'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { NewArticleFormSchema, toNewArticleInput, type NewArticleFormData } from './knowledgeForms'
import { apiCreateArticle, useSWRCollections } from '@/services/knowledge'
import { useSWRClients } from '@/services/clients'
import { useProductsStore } from '@/stores/AppStores'
import { getArticleEditPath } from '@/configs/app.config'
import { ARTICLE_KINDS, articleKindDescription, articleKindLabel } from '@/@types/knowledge/ArticleKindOptions'
import type { KnowledgeCollection } from '@/@types/knowledge/KnowledgeCollection'

const FORM_ID = 'new-article-form'
const KIND_OPTIONS = ARTICLE_KINDS.map((kind) => ({ value: kind, label: articleKindLabel[kind] }))

interface NewArticleDialogProps {
    onClose: () => void
    /** Preselects this collection (and its client and product) */
    collection?: KnowledgeCollection | null
    /** Creates a sub-article under this article (of `collection`); the collection is then fixed */
    parent?: { id: string; title: string } | null
}

/** Starts a draft article (title, type and where it lives); the editor opens next */
export default function NewArticleDialog({ onClose, collection, parent }: NewArticleDialogProps) {
    const router = useRouter()
    const collections = useSWRCollections({})
    const clients = useSWRClients()
    const products = useProductsStore((s) => s.data)

    const form = useForm<NewArticleFormData>({
        resolver: zodResolver(NewArticleFormSchema),
        defaultValues: {
            title: '',
            kind: 'concept',
            collectionId: collection?.id ?? '',
            clientId: collection?.clientId ?? '',
            productId: collection?.productId ?? '',
        },
    })
    const {
        control,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = form
    const kind = useWatch({ control, name: 'kind' })

    const collectionList = collections.data ?? (collection ? [collection] : [])
    const collectionOptions = [
        { value: '', label: 'Not in a collection' },
        ...collectionList.map((c) => ({ value: c.id, label: c.title })),
    ]
    const clientOptions = [
        { value: '', label: 'Shared (all clients)' },
        ...(clients.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]
    const productOptions = [
        { value: '', label: 'No specific product' },
        ...(products ?? []).filter((p) => p.active).map((p) => ({ value: p.id, label: p.name })),
    ]

    /** A collection's client and product fill empty pickers (an article usually shares them) */
    const onCollectionPicked = (collectionId: string) => {
        const picked = collectionList.find((c) => c.id === collectionId)
        if (!picked) return
        if (!getValues('clientId') && picked.clientId) setValue('clientId', picked.clientId)
        if (!getValues('productId') && picked.productId) setValue('productId', picked.productId)
    }

    const onValid = async (values: NewArticleFormData) => {
        try {
            const article = await apiCreateArticle(toNewArticleInput(values, parent?.id ?? null))
            toastSuccess('Draft created. Write the content, then publish it.', { duration: 4000 })
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
            title={parent ? 'New sub-article' : 'New article'}
            confirmText="Create and edit"
            confirmForm={FORM_ID}
            loading={isSubmitting}
            width={600}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Title"
                        htmlFor="new-article-title"
                        asterisk
                        invalid={!!errors.title}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="new-article-title"
                                    maxLength={200}
                                    autoFocus
                                    autoComplete="off"
                                    invalid={!!errors.title}
                                    placeholder="e.g. Configure the on-premises data gateway"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Type" htmlFor="new-article-kind">
                        <Controller
                            name="kind"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="new-article-kind"
                                    options={KIND_OPTIONS}
                                    value={KIND_OPTIONS.find((o) => o.value === field.value)}
                                    onChange={(option) => option && field.onChange(option.value)}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <p className="-mt-3 mb-4 text-xs text-gray-500">{articleKindDescription[kind]}</p>
                    <FormItem label="Collection" htmlFor="new-article-collection">
                        <Controller
                            name="collectionId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="new-article-collection"
                                    options={collectionOptions}
                                    isLoading={collections.isLoading}
                                    isDisabled={!!parent}
                                    value={
                                        collectionOptions.find((o) => o.value === field.value) ?? collectionOptions[0]
                                    }
                                    onChange={(option) => {
                                        field.onChange(option?.value ?? '')
                                        onCollectionPicked(option?.value ?? '')
                                    }}
                                />
                            )}
                        />
                    </FormItem>
                    {parent && (
                        <p className="-mt-3 mb-4 text-xs text-gray-500">
                            It’s added at the end of the sub-articles of “{parent.title}”, in the same collection.
                        </p>
                    )}
                    <div className="grid gap-x-4 sm:grid-cols-2">
                        <FormItem label="Client" htmlFor="new-article-client">
                            <Controller
                                name="clientId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId="new-article-client"
                                        options={clientOptions}
                                        isLoading={clients.isLoading}
                                        value={clientOptions.find((o) => o.value === field.value) ?? clientOptions[0]}
                                        onChange={(option) => field.onChange(option?.value ?? '')}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Product" htmlFor="new-article-product">
                            <Controller
                                name="productId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId="new-article-product"
                                        options={productOptions}
                                        value={productOptions.find((o) => o.value === field.value) ?? productOptions[0]}
                                        onChange={(option) => field.onChange(option?.value ?? '')}
                                        isSearchable={false}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                    <p className="text-xs text-gray-500">
                        It starts as a draft that only editors can see. You can change all of this later in the editor.
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
