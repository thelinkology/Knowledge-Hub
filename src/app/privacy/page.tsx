import Link from 'next/link'
import type { Metadata } from 'next'
import Logo from '@/components/template/Logo'
import { homePath, portalName } from '@/configs/app.config'

export const metadata: Metadata = { title: 'Privacy & terms' }

/** Plain-language privacy notice. Review it against the company's own policies before launch. */
export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-12">
            <Link href={homePath}>
                <Logo />
            </Link>
            <article className="prose mt-8 max-w-none dark:prose-invert">
                <h1>Privacy &amp; terms</h1>
                <p>
                    {portalName} is an internal tool for the delivery team. It stores the knowledge, library assets,
                    discovery intakes and BRDs the team writes, and as little personal data as it can.
                </p>

                <h2>What we store about you</h2>
                <ul>
                    <li>Your name and work email, so you can sign in and so content shows who wrote it.</li>
                    <li>Your role (viewer, editor or administrator), set by an administrator.</li>
                    <li>A record of significant changes you make (publishing, roles, deletions) in the audit log.</li>
                </ul>

                <h2>Client information</h2>
                <p>
                    Client pages, intakes and BRDs may contain client business information. Only people with an account
                    can see it, editors and administrators can change it, and AI agents (such as a Copilot Studio agent)
                    only receive <strong>published</strong> knowledge through keys an administrator issues and can
                    revoke.
                </p>

                <h2 id="terms">Terms of use</h2>
                <p>
                    Use {portalName} for work. Don’t store passwords, keys or personal data about clients’ staff in
                    articles or intakes, and check generated BRDs before sending them to a customer.
                </p>

                <h2>Questions or deletion</h2>
                <p>Ask an administrator to correct or delete your account.</p>
            </article>
        </main>
    )
}
