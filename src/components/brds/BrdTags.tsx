import Tag from '@/components/ui/Tag'
import { brdAudienceLabel, brdStatusLabel, brdStatusTagClass, type BrdStatus } from '@/@types/brds/Brd'
import { audienceTagClass, type Audience } from '@/@types/shared/PublishStatusOptions'
import classNames from '@/utils/classNames'

/* Small labelled tags for BRDs (status and which document it is) */

export function BrdStatusTag({ status, className }: { status: BrdStatus; className?: string }) {
    return <Tag className={classNames(brdStatusTagClass[status], className)}>{brdStatusLabel[status]}</Tag>
}

export function BrdAudienceTag({ audience, className }: { audience: Audience; className?: string }) {
    return <Tag className={classNames(audienceTagClass[audience], className)}>{brdAudienceLabel[audience]}</Tag>
}
