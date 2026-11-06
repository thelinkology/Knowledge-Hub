export const ROLES = ['viewer', 'editor', 'admin'] as const
export type Role = (typeof ROLES)[number]

/**
 * What each role may do. API routes check these with `apiAuthHandler(permission, …)`; the UI hides
 * actions with `useSession().can(permission)` — the server check is the one that counts.
 */
export const PERMISSIONS = [
    'knowledge.read', // read published knowledge (viewers: shared knowledge and their own clients' only)
    'library.read', // the library (scripts, components, reference architectures)
    'clients.read', // the client pages, and every client's knowledge
    'knowledge.manage', // write and publish articles, collections and library assets
    'clients.manage', // create and edit clients
    'requirements.manage', // discovery intakes and BRDs
    'settings.manage', // products, intake questions, IF/ELSE rules, agent API keys
    'users.manage', // invite people and change roles
    'audit.view',
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const rolePermissions: Record<Role, readonly Permission[]> = {
    viewer: ['knowledge.read'],
    editor: [
        'knowledge.read',
        'library.read',
        'clients.read',
        'knowledge.manage',
        'clients.manage',
        'requirements.manage',
    ],
    admin: [
        'knowledge.read',
        'library.read',
        'clients.read',
        'knowledge.manage',
        'clients.manage',
        'requirements.manage',
        'settings.manage',
        'users.manage',
        'audit.view',
    ],
}

export const roleLabel: Record<Role, string> = {
    viewer: 'Viewer',
    editor: 'Editor',
    admin: 'Administrator',
}

export const roleTagClass: Record<Role, string> = {
    viewer: 'bg-gray-100 text-gray-700 border-transparent dark:bg-gray-700 dark:text-gray-200',
    editor: 'bg-primary-subtle text-primary border-transparent',
    admin: 'bg-success-subtle text-success border-transparent',
}

export const hasPermission = (role: Role, permission: Permission) => rolePermissions[role].includes(permission)
