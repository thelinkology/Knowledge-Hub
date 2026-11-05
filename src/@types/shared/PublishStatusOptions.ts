export const PUBLISH_STATUSES = ['draft', 'published', 'archived'] as const
export type PublishStatus = (typeof PUBLISH_STATUSES)[number]

export const publishStatusLabel: Record<PublishStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
}

export const publishStatusTagClass: Record<PublishStatus, string> = {
    draft: 'bg-warning-subtle text-warning border-transparent',
    published: 'bg-success-subtle text-success border-transparent',
    archived: 'bg-gray-100 text-gray-500 border-transparent dark:bg-gray-700 dark:text-gray-300',
}

export const AUDIENCES = ['internal', 'customer'] as const
export type Audience = (typeof AUDIENCES)[number]

export const audienceLabel: Record<Audience, string> = {
    internal: 'Internal',
    customer: 'Customer-facing',
}

export const audienceTagClass: Record<Audience, string> = {
    internal: 'bg-gray-100 text-gray-700 border-transparent dark:bg-gray-700 dark:text-gray-200',
    customer: 'bg-info-subtle text-info border-transparent',
}
