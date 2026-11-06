import type { Milestone } from '@/@types/brds/Milestone'
import type { AssetKind } from '@/@types/library/Asset'

/*
 * BRD generation settings (utils/brd.ts, server/actions/brds). Wording here is the starting template;
 * every generated BRD is a draft the team edits before it's final.
 */

/** Every delivery follows these; each in-scope product's milestone template goes after the first (design) one */
export const BRD_BASE_MILESTONES: Milestone[] = [
    {
        title: 'Discovery & design',
        deliverables: ['Confirmed requirements and scope', 'Solution design and reference architecture'],
        dependencies: ['Stakeholder availability for workshops', 'Access to source systems and sample data'],
        owner: '',
        due: '',
    },
    {
        title: 'Build',
        deliverables: ['Configured solution in the development environment'],
        dependencies: ['Design signed off'],
        owner: '',
        due: '',
    },
    {
        title: 'Test & UAT',
        deliverables: ['Test plan and results', 'User acceptance sign-off'],
        dependencies: ['Test users and test data from the client'],
        owner: '',
        due: '',
    },
    {
        title: 'Deploy & handover',
        deliverables: ['Production deployment', 'Handover documentation and training'],
        dependencies: ['Production environment and licences in place', 'UAT signed off'],
        owner: '',
        due: '',
    },
]

/** The question whose answer opens the customer BRD's overview */
export const BRD_GOAL_QUESTION_KEY = 'business_goal'

/** Standard assumptions listed in the customer BRD */
export const BRD_ASSUMPTIONS = [
    'The client provides timely access to people, systems and data needed for each milestone.',
    'Licences and environments listed as dependencies are in place before the milestone that needs them.',
    'Changes to scope after design sign-off are handled through change control.',
]

/** Rows of the customer BRD's sign-off table */
export const BRD_SIGN_OFF_ROLES = ['Client sponsor', 'Client project lead', 'Delivery lead']

/** Library assets that feed BRDs, and how many of each kind a BRD links at most */
export const BRD_DESIGN_ASSET_KINDS: AssetKind[] = ['reference_architecture', 'demo_asset']
export const BRD_BUILD_ASSET_KINDS: AssetKind[] = ['script', 'component', 'template']
export const BRD_ASSETS_PER_KIND = 8
export const BRD_ARTICLE_LIMIT = 20
