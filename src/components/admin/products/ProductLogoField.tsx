'use client'

import { useId, useRef, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { toastError } from '@/components/ui/toast/toast'
import ProductLogo from '@/components/shared/ProductLogo'
import { DeleteIcon, UploadIcon } from '@/configs/icons.config'
import { uploadImage } from '@/services/media'
import { IMAGE_ACCEPT } from '@/utils/fileTypes'
import { tryGetErrorMessage } from '@/utils/errors'
import type { ProductInput } from '@/@types/products/Product'

/**
 * The product's logo for "Browse by product" cards: upload an image (checked on the server, stored in the
 * private image library) or paste an https link. Empty shows a monogram tile in the product colour.
 * Use the logo files the vendor publishes for partners, and follow their brand guidelines.
 */
export default function ProductLogoField() {
    const id = useId()
    const fileInput = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const {
        control,
        setValue,
        formState: { errors },
    } = useFormContext<ProductInput>()
    const [name, theme, logoUrl] = useWatch<ProductInput, ['name', 'theme', 'logoUrl']>({
        name: ['name', 'theme', 'logoUrl'],
    })

    const upload = async (file: File) => {
        setUploading(true)
        try {
            const media = await uploadImage(file)
            setValue('logoUrl', media.url, { shouldDirty: true, shouldValidate: true })
        } catch (error) {
            toastError(tryGetErrorMessage(error), error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <FormItem label="Logo" htmlFor={`${id}-link`} invalid={!!errors.logoUrl} errorMessage={errors.logoUrl?.message}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                    <ProductLogo
                        product={{ name: name?.trim() || 'Product', theme, logoUrl: logoUrl ?? '' }}
                        size={40}
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        <input
                            ref={fileInput}
                            type="file"
                            accept={IMAGE_ACCEPT}
                            className="sr-only"
                            aria-label="Upload a logo image"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) void upload(file)
                                e.target.value = ''
                            }}
                        />
                        <Button
                            type="button"
                            size="sm"
                            icon={<UploadIcon />}
                            loading={uploading}
                            onClick={() => fileInput.current?.click()}
                        >
                            {logoUrl ? 'Replace logo' : 'Upload logo'}
                        </Button>
                        {logoUrl && (
                            <Button
                                type="button"
                                size="sm"
                                variant="plain"
                                icon={<DeleteIcon />}
                                onClick={() => setValue('logoUrl', '', { shouldDirty: true, shouldValidate: true })}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    <Controller
                        name="logoUrl"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id={`${id}-link`}
                                size="sm"
                                placeholder="…or paste an https:// link to the logo"
                                autoComplete="off"
                                invalid={!!errors.logoUrl}
                                {...field}
                            />
                        )}
                    />
                </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
                PNG, JPEG, GIF or WebP up to 5 MB; a transparent background looks best. Without a logo the card shows
                the product’s initials in its colour.
            </p>
        </FormItem>
    )
}
