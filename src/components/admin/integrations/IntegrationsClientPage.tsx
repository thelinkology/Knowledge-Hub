'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/shared/PageHeader'
import ApiKeysTable from './ApiKeysTable'
import CopilotSetupGuide from './CopilotSetupGuide'
import CreateApiKeyDialog from './CreateApiKeyDialog'
import RevokeApiKeyDialog from './RevokeApiKeyDialog'
import { AddIcon } from '@/configs/icons.config'
import { homePath } from '@/configs/app.config'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import type { ApiKey } from '@/@types/integrations/ApiKey'

/** Administrators: API keys for Copilot Studio agents, and how to connect one */
export default function IntegrationsClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Copilot integration' }])
    const [creating, setCreating] = useState(false)
    const [revoking, setRevoking] = useState<ApiKey | null>(null)

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Copilot integration"
                description="Let a Microsoft Copilot Studio agent answer questions from your published knowledge. Agents read through a read-only API with their own key; every key creation and revocation is audited."
                actions={
                    <Button variant="solid" size="sm" icon={<AddIcon />} onClick={() => setCreating(true)}>
                        Create key
                    </Button>
                }
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Card bodyClass="p-0" className="self-start" header={{ content: <h5 className="m-0">API keys</h5> }}>
                    <ApiKeysTable onCreate={() => setCreating(true)} onRevoke={setRevoking} />
                </Card>
                <CopilotSetupGuide onCreateKey={() => setCreating(true)} />
            </div>

            {creating && <CreateApiKeyDialog onClose={() => setCreating(false)} />}
            <RevokeApiKeyDialog apiKey={revoking} onClose={() => setRevoking(null)} />
        </>
    )
}
