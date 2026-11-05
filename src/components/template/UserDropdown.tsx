'use client'

import Link from 'next/link'
import Dropdown from '@/components/ui/Dropdown'
import Tag from '@/components/ui/Tag'
import UserAvatar from '@/components/shared/UserAvatar'
import navigationIcon, { RolesIcon, SignOutIcon } from '@/configs/icons.config'
import { adminIntegrationsPath, profilePath, rolesPath, signOutUrl } from '@/configs/app.config'
import { roleLabel, roleTagClass } from '@/@types/auth/Roles'
import useSession from '@/utils/hooks/useSession'

/** The signed-in user in the header: who they are, their role, profile and sign out. */
export default function UserDropdown() {
    const { user, can } = useSession()
    if (!user) return null

    return (
        <Dropdown
            placement="bottom-end"
            renderTitle={
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={`Signed in as ${user.name}`}
                >
                    <UserAvatar userId={user.id} name={user.name} size={34} />
                    <span className="hidden text-left leading-tight md:block">
                        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {user.name}
                        </span>
                        <span className="block text-xs text-gray-500">{roleLabel[user.role]}</span>
                    </span>
                </button>
            }
        >
            <Dropdown.Item variant="header">
                <div className="flex items-center gap-3 px-2 py-2">
                    <UserAvatar userId={user.id} name={user.name} size={40} />
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                        <div className="truncate text-xs text-gray-500">{user.email}</div>
                        <Tag className={`mt-1.5 ${roleTagClass[user.role]}`}>{roleLabel[user.role]}</Tag>
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item eventKey="profile" className="px-0">
                <Link href={profilePath} className="flex h-full w-full items-center gap-2 px-2">
                    <span className="text-lg">{navigationIcon.users}</span> My profile
                </Link>
            </Dropdown.Item>
            {can('users.manage') && (
                <Dropdown.Item eventKey="roles" className="px-0">
                    <Link href={rolesPath} className="flex h-full w-full items-center gap-2 px-2">
                        <RolesIcon className="text-lg" /> Users &amp; roles
                    </Link>
                </Dropdown.Item>
            )}
            {can('settings.manage') && (
                <Dropdown.Item eventKey="integrations" className="px-0">
                    <Link href={adminIntegrationsPath} className="flex h-full w-full items-center gap-2 px-2">
                        <span className="text-lg">{navigationIcon.integrations}</span> Copilot integration
                    </Link>
                </Dropdown.Item>
            )}
            <Dropdown.Item eventKey="sign-out" className="px-0">
                {/* A form post: the route ends the session and redirects to sign-in */}
                <form action={signOutUrl} method="post" className="h-full w-full">
                    <button type="submit" className="flex h-full w-full items-center gap-2 px-2 text-left">
                        <SignOutIcon className="text-lg" /> Sign out
                    </button>
                </form>
            </Dropdown.Item>
        </Dropdown>
    )
}
