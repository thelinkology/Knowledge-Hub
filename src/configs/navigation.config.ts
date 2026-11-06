import {
    adminAuditPath,
    adminIntakePath,
    adminIntegrationsPath,
    adminProductsPath,
    adminUsersPath,
    brdsPath,
    clientsPath,
    homePath,
    intakesPath,
    knowledgePath,
    libraryPath,
} from './app.config'
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant'
import type { NavigationTree } from '@/@types/navigation'
import type { Permission } from '@/@types/auth/Roles'
import type { NavigationIconKey } from './icons.config'

const item = (
    key: string,
    path: string,
    title: string,
    icon: NavigationIconKey,
    authority: Permission[] = [],
): NavigationTree => ({
    key,
    path,
    title,
    icon,
    type: NAV_ITEM_TYPE_ITEM,
    authority,
    subMenu: [],
})

const section = (
    key: string,
    title: string,
    subMenu: NavigationTree[],
    authority: Permission[] = [],
): NavigationTree => ({
    key,
    path: '',
    title,
    icon: 'dashboard',
    type: NAV_ITEM_TYPE_TITLE,
    authority,
    subMenu,
})

/** Side navigation. `useNavigation` hides items the user lacks permission for, and empty sections. */
const navigationConfig: NavigationTree[] = [
    section('workspace', 'Workspace', [
        item('home', homePath, 'Home', 'dashboard'),
        item('knowledge', knowledgePath, 'Knowledge', 'knowledge', ['knowledge.read']),
        item('library', libraryPath, 'Library', 'library', ['library.read']),
        item('clients', clientsPath, 'Clients', 'clients', ['clients.read']),
    ]),
    section('requirements', 'Requirements', [
        item('intakes', intakesPath, 'Discovery intakes', 'intake', ['requirements.manage']),
        item('brds', brdsPath, 'BRDs', 'brd', ['requirements.manage']),
    ]),
    section('admin', 'Administration', [
        item('users', adminUsersPath, 'Users & roles', 'users', ['users.manage']),
        item('products', adminProductsPath, 'Products', 'products', ['settings.manage']),
        item('admin-intake', adminIntakePath, 'Intake & rules', 'rules', ['settings.manage']),
        item('integrations', adminIntegrationsPath, 'Copilot integration', 'integrations', ['settings.manage']),
        item('audit', adminAuditPath, 'Audit log', 'audit', ['audit.view']),
    ]),
]

export default navigationConfig
