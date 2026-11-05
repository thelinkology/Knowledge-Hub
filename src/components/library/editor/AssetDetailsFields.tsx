'use client'

import { Controller, useFormContext } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { ASSET_FIELD_IDS } from './assetForm'
import { ASSET_KINDS, CODE_LANGUAGES, assetKindLabel, codeLanguageLabel } from '@/@types/library/Asset'
import type { AssetFormData } from '@/@types/library/forms/AssetFormData'
import type { AssetEditorData } from '@/@types/library/AssetEditor'

const KIND_OPTIONS = ASSET_KINDS.map((kind) => ({ value: kind, label: assetKindLabel[kind] }))
const LANGUAGE_OPTIONS = CODE_LANGUAGES.map((language) => ({ value: language, label: codeLanguageLabel[language] }))

const hint = (text: string) => <span className="ml-2 text-xs font-normal text-gray-500">{text}</span>

/** Title, summary and link (the main column) */
export function AssetTitleFields() {
    const {
        control,
        formState: { errors },
    } = useFormContext<AssetFormData>()
    return (
        <>
            <FormItem
                label="Title"
                htmlFor={ASSET_FIELD_IDS.title}
                asterisk
                invalid={!!errors.title}
                errorMessage={errors.title?.message}
            >
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <Input id={ASSET_FIELD_IDS.title} maxLength={200} invalid={!!errors.title} {...field} />
                    )}
                />
            </FormItem>
            <FormItem
                label="Summary"
                htmlFor={ASSET_FIELD_IDS.summary}
                invalid={!!errors.summary}
                errorMessage={errors.summary?.message}
                extra={hint('What it does and when to reach for it. Search results and Copilot show it first.')}
            >
                <Controller
                    name="summary"
                    control={control}
                    render={({ field }) => (
                        <Input id={ASSET_FIELD_IDS.summary} textArea rows={2} maxLength={500} {...field} />
                    )}
                />
            </FormItem>
            <FormItem
                label="Link"
                htmlFor="asset-url"
                invalid={!!errors.url}
                errorMessage={errors.url?.message}
                extra={hint('Where it lives: repository, SharePoint, demo tenant…')}
            >
                <Controller
                    name="url"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="asset-url"
                            type="url"
                            inputMode="url"
                            placeholder="https://"
                            autoComplete="off"
                            maxLength={2000}
                            invalid={!!errors.url}
                            {...field}
                        />
                    )}
                />
            </FormItem>
        </>
    )
}

/** The optional code snippet: language and a monospace text area */
export function AssetCodeFields() {
    const {
        control,
        formState: { errors },
    } = useFormContext<AssetFormData>()
    return (
        <>
            <FormItem label="Language" htmlFor="asset-code-language" className="max-w-xs">
                <Controller
                    name="codeLanguage"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="asset-code-language"
                            options={LANGUAGE_OPTIONS}
                            value={LANGUAGE_OPTIONS.find((o) => o.value === field.value) ?? LANGUAGE_OPTIONS[0]}
                            onChange={(option) => field.onChange(option?.value ?? '')}
                            isSearchable={false}
                        />
                    )}
                />
            </FormItem>
            <FormItem
                label="Code"
                htmlFor="asset-code"
                invalid={!!errors.code}
                errorMessage={errors.code?.message}
                extra={hint('Shown with a Copy button. It’s never run.')}
                className="mb-0"
            >
                <Controller
                    name="code"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="asset-code"
                            textArea
                            rows={14}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                            placeholder="Paste the script, DAX, Python, JSON flow definition…"
                            className="font-mono text-sm leading-relaxed whitespace-pre"
                            {...field}
                        />
                    )}
                />
            </FormItem>
        </>
    )
}

/** Type, where it applies (client, product) and tags (the side column) */
export default function AssetDetailsFields({ data }: { data: AssetEditorData }) {
    const {
        control,
        formState: { errors },
    } = useFormContext<AssetFormData>()

    const clientOptions = [
        { value: '', label: 'Shared (all clients)' },
        ...data.clients.map((c) => ({ value: c.id, label: c.name })),
    ]
    const productOptions = [
        { value: '', label: 'No specific product' },
        ...data.products
            .filter((p) => p.active || p.id === data.asset.productId)
            .map((p) => ({ value: p.id, label: p.name })),
    ]

    return (
        <>
            <FormItem label="Type" htmlFor="asset-kind">
                <Controller
                    name="kind"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="asset-kind"
                            options={KIND_OPTIONS}
                            value={KIND_OPTIONS.find((o) => o.value === field.value)}
                            onChange={(option) => option && field.onChange(option.value)}
                            isSearchable={false}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Product" htmlFor="asset-product">
                <Controller
                    name="productId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="asset-product"
                            options={productOptions}
                            value={productOptions.find((o) => o.value === field.value) ?? productOptions[0]}
                            onChange={(option) => field.onChange(option?.value ?? '')}
                            isSearchable={false}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Client" htmlFor="asset-client">
                <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            inputId="asset-client"
                            options={clientOptions}
                            value={clientOptions.find((o) => o.value === field.value) ?? clientOptions[0]}
                            onChange={(option) => field.onChange(option?.value ?? '')}
                        />
                    )}
                />
            </FormItem>
            <p className="-mt-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
                Shared assets are reusable for every client; a client’s own assets show on their page.
            </p>
            <FormItem
                label="Tags"
                htmlFor="asset-tags"
                invalid={!!errors.tagsText}
                errorMessage={errors.tagsText?.message}
            >
                <Controller
                    name="tagsText"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="asset-tags"
                            placeholder="e.g. lakehouse, refresh, dax"
                            autoComplete="off"
                            {...field}
                        />
                    )}
                />
            </FormItem>
            <p className="-mt-3 text-xs text-gray-500 dark:text-gray-400">Separate tags with commas.</p>
        </>
    )
}
