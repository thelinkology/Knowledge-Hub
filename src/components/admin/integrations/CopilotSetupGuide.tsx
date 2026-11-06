'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CopyField from './CopyField'
import { AddIcon, AgentIcon, DownloadIcon, ExternalLinkIcon, InfoIcon, TerminalIcon } from '@/configs/icons.config'
import { agentApiBasePath, agentOpenApiPath } from '@/configs/app.config'
import { API_KEY_HEADER } from '@/utils/apiKeys'

const noSubscribe = () => () => {}

/** This site's origin in the browser ('' while rendering on the server) */
const useOrigin = () =>
    useSyncExternalStore(
        noSubscribe,
        () => window.location.origin,
        () => '',
    )

const AGENT_INSTRUCTIONS = `You help the delivery team using Knowledge Hub, our knowledge base for Acterys, BPP, Microsoft Fabric, Power BI and Power Platform projects.

- For any question about how to do something, a known issue, a best practice, an architecture or a reusable script, call SearchKnowledge FIRST with a few focused keywords.
- If the user names a client, call ListClients to find its slug and pass it as "client". If the question is clearly about one product, pass its code as "product" (acterys, bpp, fabric, power-bi, power-platform).
- Then call GetArticle (results of type "article") or GetAsset (type "asset") for the one to three most relevant results, and base your answer on their full content, not only the snippet.
- Always cite the "url" of every article or asset you used, as a link with its title.
- Show code from assets in a code block, with its language.
- If nothing relevant is found, say that Knowledge Hub has no published guidance on this yet. Do not guess steps or invent an answer.
- Articles with audience "internal" are for the team; don't present them as customer-ready text.`

const EXAMPLE_QUESTIONS = [
    'How do we set up incremental refresh in Microsoft Fabric?',
    'Is there a sample script for Acterys write-back?',
    'What are the gotchas when connecting Power BI to an on-premises gateway?',
]

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
    return (
        <li className="relative flex gap-4">
            <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-bold text-primary"
            >
                {number}
            </span>
            <div className="min-w-0 flex-1 pb-6">
                <h6 className="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">{title}</h6>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">{children}</div>
            </div>
        </li>
    )
}

/** Step-by-step: connect a Copilot Studio agent to the read-only agent API */
export default function CopilotSetupGuide({ onCreateKey }: { onCreateKey: () => void }) {
    const origin = useOrigin()
    const openApiUrl = origin ? `${origin}${agentOpenApiPath}` : ''
    const curl = `curl -H "${API_KEY_HEADER}: <your key>" \\\n  "${origin}${agentApiBasePath}/knowledge/search?q=incremental%20refresh&product=fabric"`

    return (
        <Card
            header={{
                content: (
                    <div className="flex items-center gap-2">
                        <span className="text-xl text-primary" aria-hidden>
                            <AgentIcon />
                        </span>
                        <h5 className="m-0">Connect Copilot Studio</h5>
                    </div>
                ),
            }}
        >
            <div className="mb-6 flex gap-3 rounded-xl bg-info-subtle p-3 text-sm text-info">
                <InfoIcon className="mt-0.5 shrink-0 text-lg" aria-hidden />
                <p>
                    Agents only get <strong>published</strong> articles and library assets, read-only. A key reads
                    shared knowledge plus the knowledge of the clients you assign to it, nothing else. Links in its
                    answers open Knowledge Hub, which asks people to sign in first. Each key may make up to 300 requests
                    a minute.
                </p>
            </div>

            <ol aria-label="Steps to connect Copilot Studio">
                <Step number={1} title="Create an API key">
                    <p>Create one key per agent above, and copy it — it is shown only once.</p>
                    <Button size="sm" icon={<AddIcon />} onClick={onCreateKey}>
                        Create key
                    </Button>
                </Step>

                <Step number={2} title="Add Knowledge Hub as a tool">
                    <p>
                        In Copilot Studio, open your agent → <strong>Tools</strong> → <strong>Add a tool</strong> →{' '}
                        <strong>New tool</strong> → <strong>REST API</strong>, and upload the OpenAPI description below.
                        (Or create a Power Platform custom connector with <strong>Import an OpenAPI from URL</strong>{' '}
                        and paste the link.)
                    </p>
                    <CopyField value={openApiUrl} what="the OpenAPI link" />
                    {openApiUrl && (
                        <div className="flex flex-wrap gap-2">
                            <a
                                href={openApiUrl}
                                download="knowledge-hub-openapi.json"
                                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                            >
                                <DownloadIcon aria-hidden /> Download the file
                            </a>
                            <a
                                href={openApiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                            >
                                <ExternalLinkIcon aria-hidden /> Open it
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        </div>
                    )}
                </Step>

                <Step number={3} title="Set up authentication">
                    <p>
                        Choose <strong>API key</strong> authentication: parameter label <em>API key</em>, parameter name{' '}
                        <code className="font-mono text-gray-900 dark:text-gray-100">{API_KEY_HEADER}</code>, location{' '}
                        <strong>Header</strong>. When Copilot Studio asks for the connection, paste your key.
                    </p>
                    <p>
                        Keep all four tools: <strong>SearchKnowledge</strong>, <strong>GetArticle</strong>,{' '}
                        <strong>GetAsset</strong> and <strong>ListClients</strong>.
                    </p>
                </Step>

                <Step number={4} title="Tell the agent how to use it">
                    <p>Paste these into the agent’s Instructions (adjust them to your team’s tone):</p>
                    <CopyField value={AGENT_INSTRUCTIONS} what="the agent instructions" multiline />
                </Step>

                <Step number={5} title="Test it">
                    <p>In the Test pane, ask a question you know Knowledge Hub answers, for example:</p>
                    <ul className="list-disc space-y-1 pl-5">
                        {EXAMPLE_QUESTIONS.map((question) => (
                            <li key={question}>“{question}”</li>
                        ))}
                    </ul>
                    <p>
                        The agent should call SearchKnowledge, then GetArticle, and answer with a link to the article.
                        If it says it found nothing, check that the article is published and that the key can read that
                        client. The key’s <em>Last used</em> time above updates when calls arrive.
                    </p>
                </Step>
            </ol>

            <section aria-labelledby="curl-heading" className="border-t border-gray-200 pt-5 dark:border-gray-700">
                <h6
                    id="curl-heading"
                    className="mb-2 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"
                >
                    <TerminalIcon aria-hidden /> Try it from a terminal
                </h6>
                <CopyField value={curl} what="the curl command" multiline />
                <p className="mt-2 text-xs text-gray-500">
                    Send the key in the <code className="font-mono">{API_KEY_HEADER}</code> header (or{' '}
                    <code className="font-mono">Authorization: Bearer</code>) — never in the URL.
                </p>
            </section>
        </Card>
    )
}
