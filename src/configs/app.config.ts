/** App-wide names and every route path. Components never hard-code URLs — they use these. */

export const portalName = 'Knowledge Hub'
export const portalShortName = 'Knowledge Hub'
export const portalTagline = 'Find it. Reuse it. Deliver it.'

// ── Public ──
export const signInPath = '/login'
export const signUpPath = '/signup'
export const forgotPasswordPath = '/forgot-password'
export const resetPasswordPath = '/reset-password'
export const privacyPath = '/privacy'
export const privacyPolicyUrl = privacyPath
export const termsOfUseUrl = `${privacyPath}#terms`

// ── Auth API (full page loads / form posts) ──
export const signOutUrl = '/api/auth/sign-out'

// ── Portal ──
export const homePath = '/'
export const profilePath = '/profile'

// Knowledge (Microsoft Learn-style browse → collection → article)
export const knowledgePath = '/knowledge'
/** HeaderSearch opens the knowledge browser with ?q= */
export const searchPath = knowledgePath
export const getKnowledgeSearchPath = (q: string) => `${knowledgePath}?q=${encodeURIComponent(q)}`
export const getCollectionPath = (collectionId: string) => `${knowledgePath}/collections/${collectionId}`
export const getArticlePath = (articleId: string) => `${knowledgePath}/articles/${articleId}`
export const getArticleEditPath = (articleId: string) => `${knowledgePath}/articles/${articleId}/edit`

// Library (scripts, flows, reference architectures, demo assets)
export const libraryPath = '/library'
export const getAssetPath = (assetId: string) => `${libraryPath}/${assetId}`
export const getAssetEditPath = (assetId: string) => `${libraryPath}/${assetId}/edit`

// Clients
export const clientsPath = '/clients'
export type ClientTab = 'overview' | 'knowledge' | 'library' | 'intakes' | 'brds'
export const getClientPath = (clientId: string, tab?: ClientTab) =>
    tab && tab !== 'overview' ? `${clientsPath}/${clientId}?tab=${tab}` : `${clientsPath}/${clientId}`

// Requirements: discovery intakes → BRDs
export const intakesPath = '/intakes'
export const getIntakePath = (intakeId: string) => `${intakesPath}/${intakeId}`
export const brdsPath = '/brds'
export const getBrdPath = (brdId: string) => `${brdsPath}/${brdId}`
export const getBrdEditPath = (brdId: string) => `${brdsPath}/${brdId}/edit`

// ── Admin ──
export const adminUsersPath = '/admin/users'
export const adminProductsPath = '/admin/products'
export const adminIntakePath = '/admin/intake'
export const adminIntegrationsPath = '/admin/integrations'
export const adminAuditPath = '/admin/audit'
export const rolesPath = adminUsersPath

// ── Agent API (Copilot Studio) ──
export const agentApiBasePath = '/api/v1'
export const agentOpenApiPath = `${agentApiBasePath}/openapi.json`
