'use client'

import { Controller, useFormContext, useWatch } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { ARTICLE_FIELD_IDS } from './articleForm'
import { ARTICLE_KINDS, articleKindDescription, articleKindLabel } from '@/@types/knowledge/ArticleKindOptions'
import { AUDIENCES, audienceLabel } from '@/@types/shared/PublishStatusOptions'
import type { ArticleFormData } from '@/@types/knowledge/forms/ArticleFormData'
import type { ArticleEditorData } from '@/@types/knowledge/ArticleEditor'

const KIND_OPTIONS = ARTICLE_KINDS.map((kind) => ({ value: kind, label: articleKindLabel[kind] }))
const AUDIENCE_OPTIONS = AUDIENCES.map((audience) => ({ value: audience, label: audienceLabel[audience] }))

interface ArticleDetailsFieldsProps {
    data: ArticleEditorData
}

/** Title and summary (the main column) */
export function ArticleTitleFields() {
    const {
        control,
        formState: { errors },
    } = useFormContext<ArticleFormData>()
    return (
        <>
            <FormItem
                label="Title"
                htmlFor={ARTICLE_FIELD_IDS.title}
                asterisk
                invalid={!!errors.title}
                errorMessage={errors.title?.message}
            >
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <Input id={ARTICLE_FIELD_IDS.title} maxLength={200} invalid={!!errors.title} {...field} />
                    )}
                />
            </FormItem>
            <FormItem
                label="Summary"
                htmlFor={ARTICLE_FIELD_IDS.summary}
                invalid={!!errors.summary}
                errorMessage={errors.summary?.message}
                extra={
                    <span className="ml-2 text-xs font-normal text-gray-500">
                        One or two sentences. Search results and Copilot show it first.
                    </span>
                }
            >
                <Controller
                    name="summary"
                    control={control}
                    render={({ field }) => (
                        <Input id={ARTICLE_FIELD_IDS.summary} textArea rows={2} maxLength={500} {...field} />
                    )}
                />
            </FormItem>
        </>
    )
}

/** Type, audience, where it lives (collection, client, product) and tags (the side column) */
export default function ArticleDetailsFields({ data }: ArticleDetailsFieldsProps) {
    const {
        control,
        formState: { errors },
    } = useFormContext<ArticleFormData>()
    const kind = useWatch({ control, name: 'kind' })

    const collectionOptions = [
        { value: '', label: 'Not in a collection' },
        ...data.collections.map((c) => ({ value: c.id, label: c.title })),
    ]
    const clientOptions = [
        { value: '', label: 'Shared (all clients)' },
        ...data.clients.map((c) => ({ value: c.id, label: c.name })),
    ]
    const productOptions = [
        { value: '', label: 'No specific product' },
        ...data.products.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name })),
    ]

    return (
        <>
            <FormItem label="Type" htmlFor="article-kind">
                <Controller
                    name="kind"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="article-kind"
                            options={KIND_OPTIONS}
                            value={KIND_OPTIONS.find((o) => o.value === field.value)}
                            onChange={(option) => option && field.onChange(option.value)}
                            isSearchable={false}
                        />
                    )}
                />
            </FormItem>
            <p className="-mt-3 mb-4 text-xs text-gray-500">{articleKindDescription[kind]}</p>
            <FormItem label="Audience" htmlFor="article-audience">
                <Controller
                    name="audience"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="article-audience"
                            options={AUDIENCE_OPTIONS}
                            value={AUDIENCE_OPTIONS.find((o) => o.value === field.value)}
                            onChange={(option) => option && field.onChange(option.value)}
                            isSearchable={false}
                        />
                    )}
                />
            </FormItem>
            <p className="-mt-3 mb-4 text-xs text-gray-500">
                Customer-facing articles can be linked from customer BRDs.
            </p>
            <FormItem label="Collection" htmlFor="article-collection">
                <Controller
                    name="collectionId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="article-collection"
                            options={collectionOptions}
                            value={collectionOptions.find((o) => o.value === field.value) ?? collectionOptions[0]}
                            onChange={(option) => field.onChange(option?.value ?? '')}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Client" htmlFor="article-client">
                <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="article-client"
                            options={clientOptions}
                            value={clientOptions.find((o) => o.value === field.value) ?? clientOptions[0]}
                            onChange={(option) => field.onChange(option?.value ?? '')}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Product" htmlFor="article-product">
                <Controller
                    name="productId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="article-product"
                            options={productOptions}
                            value={productOptions.find((o) => o.value === field.value) ?? productOptions[0]}
                            onChange={(option) => field.onChange(option?.value ?? '')}
                            isSearchable={false}
                        />
                    )}
                />
            </FormItem>
            <FormItem
                label="Tags"
                htmlFor="article-tags"
                invalid={!!errors.tagsText}
                errorMessage={errors.tagsText?.message}
            >
                <Controller
                    name="tagsText"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="article-tags"
                            placeholder="e.g. gateway, rls, refresh"
                            autoComplete="off"
                            {...field}
                        />
                    )}
                />
            </FormItem>
            <p className="-mt-3 text-xs text-gray-500">Separate tags with commas.</p>
        </>
    )
}
