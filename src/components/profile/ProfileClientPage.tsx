'use client'

import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import UserAvatar from '@/components/shared/UserAvatar'
import { SaveIcon } from '@/configs/icons.config'
import { forgotPasswordPath, homePath } from '@/configs/app.config'
import { apiUpdateProfile } from '@/services/users'
import { roleLabel, roleTagClass } from '@/@types/auth/Roles'
import { UpdateProfileSchema, type MyProfile, type UpdateProfileInput } from '@/@types/users/UserAccount'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useSession from '@/utils/hooks/useSession'

/** Your name (shown on what you write), email and role */
export default function ProfileClientPage({ profile }: { profile: MyProfile }) {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'My profile' }])
    const { user } = useSession()
    const form = useForm<UpdateProfileInput>({
        resolver: zodResolver(UpdateProfileSchema),
        defaultValues: { displayName: profile.displayName },
    })
    const {
        control,
        formState: { errors, isSubmitting, isDirty },
    } = form

    const onValid = async (input: UpdateProfileInput) => {
        try {
            const saved = await apiUpdateProfile(input)
            form.reset({ displayName: saved.displayName })
            toastSuccess('Saved. Your new name shows after the next page load.')
        } catch (error) {
            toastError('Couldn’t save your profile.', error)
        }
    }

    return (
        <>
            <PageHeader title="My profile" />
            <Card className="max-w-2xl">
                <div className="mb-6 flex items-center gap-4">
                    <UserAvatar userId={user?.id ?? ''} name={profile.displayName} size={56} />
                    <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {profile.displayName}
                        </div>
                        <div className="text-sm text-gray-500">{profile.email}</div>
                        <Tag className={`mt-1.5 ${roleTagClass[profile.role]}`}>{roleLabel[profile.role]}</Tag>
                    </div>
                </div>
                <FormProvider {...form}>
                    <Form onSubmit={form.handleSubmit(onValid)} noValidate>
                        <FormItem
                            label="Your name"
                            htmlFor="profile-name"
                            invalid={!!errors.displayName}
                            errorMessage={errors.displayName?.message}
                        >
                            <Controller
                                name="displayName"
                                control={control}
                                render={({ field }) => <Input id="profile-name" maxLength={60} {...field} />}
                            />
                        </FormItem>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <a href={forgotPasswordPath} className="text-sm text-primary hover:underline">
                                Change my password
                            </a>
                            <Button
                                type="submit"
                                variant="solid"
                                icon={<SaveIcon />}
                                loading={isSubmitting}
                                disabled={!isDirty}
                            >
                                Save
                            </Button>
                        </div>
                    </Form>
                </FormProvider>
            </Card>
        </>
    )
}
