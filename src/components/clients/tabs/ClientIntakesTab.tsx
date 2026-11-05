'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import IntakeList from '@/components/intakes/IntakeList'
import NewIntakeDialog from '@/components/intakes/NewIntakeDialog'
import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { AddIcon } from '@/configs/icons.config'
import useSession from '@/utils/hooks/useSession'

interface ClientIntakesTabProps {
    clientId: string
}

/** The client page's "Intakes" tab: this client's discovery intakes and "New intake for this client" */
export default function ClientIntakesTab({ clientId }: ClientIntakesTabProps) {
    const { can } = useSession()
    const [creating, setCreating] = useState(false)
    const canManage = can('requirements.manage')

    if (!canManage) {
        return (
            <Card>
                <p className="text-sm text-gray-500">
                    Discovery intakes are available to editors. Ask an administrator if you need access.
                </p>
            </Card>
        )
    }

    return (
        <ProductsSWRProvider>
            <Card
                bodyClass="p-0"
                header={{
                    content: 'Discovery intakes',
                    extra: (
                        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setCreating(true)}>
                            New intake for this client
                        </Button>
                    ),
                }}
            >
                <IntakeList clientId={clientId} onCreate={() => setCreating(true)} />
            </Card>
            {creating && <NewIntakeDialog clientId={clientId} onClose={() => setCreating(false)} />}
        </ProductsSWRProvider>
    )
}
