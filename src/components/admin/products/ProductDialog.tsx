'use client'

import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import { ProductTag } from '@/components/shared/KnowledgeTags'
import MilestonesEditor from '@/components/shared/MilestonesEditor'
import ProductLogoField from './ProductLogoField'
import { apiCreateProduct, apiUpdateProduct } from '@/services/clients'
import { useAdminProductsStore } from '@/stores/SettingsStores'
import { getErrorCode } from '@/utils/errors'
import classNames from '@/utils/classNames'
import { ProductSchema, type Product, type ProductInput } from '@/@types/products/Product'
import {
    PRODUCT_THEMES,
    productThemeClass,
    productThemeLabel,
    type ProductTheme,
} from '@/@types/products/ProductThemeOptions'

const FORM_ID = 'product-form'

const THEME_OPTIONS = PRODUCT_THEMES.map((theme) => ({ value: theme, label: productThemeLabel[theme] }))

/** A dot in the theme's colour */
function ThemeSwatch({ theme, className }: { theme: ProductTheme; className?: string }) {
    return (
        <span
            aria-hidden
            className={classNames(
                'product-bar inline-block h-3 w-3 shrink-0 rounded-full',
                productThemeClass(theme),
                className,
            )}
        />
    )
}

/** How the product will look on knowledge, library items and clients, as the form changes */
function ProductPreview() {
    const [name, theme, code] = useWatch<ProductInput, ['name', 'theme', 'code']>({ name: ['name', 'theme', 'code'] })
    const preview: Product = {
        id: 'preview',
        code: code || 'code',
        name: name?.trim() || 'Product name',
        description: '',
        theme,
        logoUrl: '',
        milestoneTemplate: [],
        active: true,
        sortOrder: 0,
    }
    return (
        <div
            className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-600"
            aria-live="polite"
        >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Preview</span>
            <ProductTag productId="preview" products={[preview]} />
            <span className={classNames('product-accent text-sm font-semibold', productThemeClass(theme))}>
                {preview.name}
            </span>
        </div>
    )
}

const toFormValues = (product: Product | null): ProductInput => ({
    code: product?.code ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    theme: product?.theme ?? 'blue',
    logoUrl: product?.logoUrl ?? '',
    milestoneTemplate: product?.milestoneTemplate ?? [],
    active: product?.active ?? true,
    sortOrder: product?.sortOrder ?? 0,
})

interface ProductDialogProps {
    /** null = a new product */
    product: Product | null
    nextSortOrder: number
    onClose: () => void
}

/** Create or edit a product: its name, code, colour, whether it's offered, and the BRD milestone template */
export default function ProductDialog({ product, nextSortOrder, onClose }: ProductDialogProps) {
    const refresh = useAdminProductsStore((s) => s.refresh)
    const form = useForm<ProductInput>({
        resolver: zodResolver(ProductSchema),
        defaultValues: product ? toFormValues(product) : { ...toFormValues(null), sortOrder: nextSortOrder },
    })
    const {
        control,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = form

    const close = () => {
        if (isSubmitting) return
        if (isDirty && !window.confirm('Discard your changes to this product?')) return
        onClose()
    }

    const onValid = async (input: ProductInput) => {
        try {
            const saved = product ? await apiUpdateProduct(product.id, input) : await apiCreateProduct(input)
            toastSuccess(product ? `${saved.name} was saved.` : `${saved.name} was added.`)
            await refresh()
            onClose()
        } catch (error) {
            if (getErrorCode(error) === 'DUPLICATE') {
                setError('code', { message: 'Another product already uses this code. Choose a different one.' })
                return
            }
            toastError(product ? 'The product couldn’t be saved.' : 'The product couldn’t be added.', error)
        }
    }

    return (
        <Dialog
            isOpen
            onClose={close}
            onRequestClose={close}
            closable={!isSubmitting}
            width={860}
            contentClassName="pb-0"
            contentLabel={product ? `Edit ${product.name}` : 'Add a product'}
        >
            <h4 className="mb-1 pr-8">{product ? `Edit ${product.name}` : 'Add a product'}</h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Products label knowledge, library assets and clients. Their milestone template is added to a BRD when
                the product is in scope.
            </p>
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <div className="-mx-1 max-h-[65vh] overflow-y-auto px-1">
                        <div className="grid gap-x-4 md:grid-cols-2">
                            <FormItem
                                label="Name"
                                htmlFor="product-name"
                                asterisk
                                invalid={!!errors.name}
                                errorMessage={errors.name?.message}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="product-name"
                                            maxLength={60}
                                            autoFocus
                                            invalid={!!errors.name}
                                            placeholder="e.g. Microsoft Fabric"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                            <FormItem
                                label="Code"
                                htmlFor="product-code"
                                asterisk
                                invalid={!!errors.code}
                                errorMessage={errors.code?.message}
                            >
                                <Controller
                                    name="code"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="product-code"
                                            maxLength={40}
                                            className="font-mono"
                                            autoComplete="off"
                                            spellCheck={false}
                                            invalid={!!errors.code}
                                            placeholder="e.g. fabric"
                                            aria-describedby="product-code-help"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>
                        <p id="product-code-help" className="-mt-3 mb-4 text-xs text-gray-500">
                            Lower-case letters, digits and dashes. Copilot uses the code to filter searches (e.g.
                            product=fabric), so change it only when you must.
                        </p>

                        <FormItem
                            label="Description"
                            htmlFor="product-description"
                            invalid={!!errors.description}
                            errorMessage={errors.description?.message}
                        >
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Input id="product-description" textArea rows={2} maxLength={500} {...field} />
                                )}
                            />
                        </FormItem>

                        <div className="grid gap-x-4 md:grid-cols-3">
                            <FormItem label="Colour" htmlFor="product-theme">
                                <Controller
                                    name="theme"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            inputId="product-theme"
                                            options={THEME_OPTIONS}
                                            value={THEME_OPTIONS.find((o) => o.value === field.value)}
                                            onChange={(option) => option && field.onChange(option.value)}
                                            isSearchable={false}
                                            formatOptionLabel={(option) => (
                                                <span className="flex items-center gap-2">
                                                    <ThemeSwatch theme={option.value} />
                                                    {option.label}
                                                </span>
                                            )}
                                        />
                                    )}
                                />
                            </FormItem>
                            <FormItem
                                label="Sort order"
                                htmlFor="product-sort"
                                invalid={!!errors.sortOrder}
                                errorMessage={errors.sortOrder?.message}
                            >
                                <Controller
                                    name="sortOrder"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="product-sort"
                                            type="number"
                                            min={0}
                                            max={1000}
                                            step={1}
                                            inputMode="numeric"
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={Number.isFinite(field.value) ? field.value : ''}
                                            onChange={(e) => {
                                                const n = Number.parseInt(e.target.value, 10)
                                                field.onChange(Number.isFinite(n) ? n : 0)
                                            }}
                                        />
                                    )}
                                />
                            </FormItem>
                            <FormItem label="Offered" htmlFor="product-active">
                                <Controller
                                    name="active"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex h-12 items-center gap-3">
                                            <Switcher
                                                id="product-active"
                                                checked={field.value}
                                                onChange={(checked) => field.onChange(checked)}
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {field.value ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    )}
                                />
                            </FormItem>
                        </div>
                        <p className="-mt-3 mb-4 text-xs text-gray-500">
                            Inactive products are no longer offered in pickers; existing content keeps its label.
                        </p>

                        <ProductLogoField />

                        <ProductPreview />

                        <section className="mt-6" aria-labelledby="product-milestones-heading">
                            <h5 id="product-milestones-heading" className="mb-1">
                                Milestone template
                            </h5>
                            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                                Added to the delivery plan of every BRD that includes this product. Editors can still
                                change them per BRD.
                            </p>
                            <MilestonesEditor name="milestoneTemplate" max={20} />
                        </section>
                    </div>
                </Form>
            </FormProvider>
            <div className="-mx-6 mt-4 flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end dark:border-gray-700">
                <Button type="button" onClick={close} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button variant="solid" type="submit" form={FORM_ID} loading={isSubmitting}>
                    {product ? 'Save product' : 'Add product'}
                </Button>
            </div>
        </Dialog>
    )
}
