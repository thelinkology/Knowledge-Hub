import type { Permission } from '@/@types/auth/Roles'
import type { NavigationIconKey } from '@/configs/icons.config'

export interface NavigationTree {
    key: string
    path: string
    title: string
    icon: NavigationIconKey
    type: 'title' | 'item'
    /** Shown when the user has ANY of these permissions (empty = everyone signed in) */
    authority: Permission[]
    subMenu: NavigationTree[]
}
