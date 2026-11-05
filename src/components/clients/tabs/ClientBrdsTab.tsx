'use client'

import Card from '@/components/ui/Card'
import LinkButton from '@/components/ui/LinkButton'
import BrdList from '@/components/brds/BrdList'
import { ForwardIcon } from '@/configs/icons.config'
import { getClientPath } from '@/configs/app.config'
import useSession from '@/utils/hooks/useSession'

interface ClientBrdsTabProps {
    clientId: string
}

/** The client page's "BRDs" tab: this client's customer BRDs and internal delivery briefs */
export default function ClientBrdsTab({ clientId }: ClientBrdsTabProps) {
    const { can } = useSession()

    if (!can('requirements.manage')) {
        return (
            <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    BRDs are available to editors. Ask an administrator if you need access.
                </p>
            </Card>
        )
    }

    const startIntake = (
        <LinkButton size="sm" href={getClientPath(clientId, 'intakes')} icon={<ForwardIcon />} iconAlignment="end">
            Go to intakes
        </LinkButton>
    )

    return (
        <Card
            bodyClass="p-0"
            header={{
                content: (
                    <div>
                        <span>BRDs</span>
                        <p className="mt-0.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                            Generated from this client’s discovery intakes: a customer-facing BRD and an internal
                            delivery brief per intake.
                        </p>
                    </div>
                ),
                extra: startIntake,
            }}
        >
            <BrdList
                clientId={clientId}
                emptyDescription="Start a discovery intake for this client, answer the questions, then generate the BRDs from it."
                emptyAction={startIntake}
            />
        </Card>
    )
}
