import Link from 'next/link'
import type { ReactNode } from 'react'
import Logo from '@/components/template/Logo'
import HeroPreview from './HeroPreview'
import navigationIcon, { AgentIcon, DiagramIcon, ForwardIcon, SignInIcon } from '@/configs/icons.config'
import { portalName, portalTagline, privacyPath, signInPath } from '@/configs/app.config'
import { productThemeClass } from '@/@types/products/ProductThemeOptions'
import classNames from '@/utils/classNames'

const PRODUCTS = [
    { name: 'Acterys', theme: 'violet' },
    { name: 'BPP', theme: 'amber' },
    { name: 'Microsoft Fabric', theme: 'teal' },
    { name: 'Power BI', theme: 'blue' },
    { name: 'Power Platform', theme: 'green' },
]

const FEATURES: { icon: ReactNode; title: string; body: string; points: string[] }[] = [
    {
        icon: navigationIcon.knowledge,
        title: 'Knowledge, Learn-style',
        body: 'Articles in collections with sub-topics, a table of contents and “In this article”, written in a visual or Markdown editor.',
        points: ['Concepts, how-tos, tutorials, troubleshooting', 'Versions, drafts and publishing'],
    },
    {
        icon: <DiagramIcon />,
        title: 'A library you can reuse',
        body: 'Sample scripts, components, templates and demo assets, plus reference architectures you draw by drag and drop.',
        points: ['DAX, SQL, PySpark, flows', 'Diagrams to PNG, JPG or PDF'],
    },
    {
        icon: navigationIcon.intake,
        title: 'From discovery to BRD',
        body: 'A guided intake flags gotchas and best practices as you go, then writes the customer BRD and the internal delivery brief.',
        points: ['IF/ELSE rules per product', 'Milestones, deliverables, dependencies'],
    },
    {
        icon: <AgentIcon />,
        title: 'Ready for Copilot',
        body: 'Published knowledge is available to a Copilot Studio agent through a secure API, scoped per client.',
        points: ['API keys per agent or client', 'Answers cite the article'],
    },
]

const STEPS = [
    {
        title: 'Discover',
        body: 'Run the workshop with the intake open. The rules raise the questions you’d otherwise forget.',
    },
    { title: 'Design', body: 'Start from a reference architecture and the scripts and components that already work.' },
    {
        title: 'Deliver',
        body: 'Share the customer BRD, plan from the internal brief, and write back what you learned.',
    },
]

function SignInButton({ className }: { className?: string }) {
    return (
        <Link
            href={signInPath}
            className={classNames(
                'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-neutral shadow-lg shadow-primary/20 transition hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none',
                className,
            )}
        >
            <SignInIcon aria-hidden className="text-lg" /> Sign in
        </Link>
    )
}

/**
 * What signed-out visitors see at "/": what Knowledge Hub is and a way to sign in. Access is by invitation
 * only (administrators create accounts), so there is no sign-up.
 */
export default function WelcomePage() {
    return (
        <div className="min-h-screen overflow-x-hidden bg-white text-gray-700 dark:bg-gray-950 dark:text-gray-300">
            {/* Backdrop: soft colour and a dot grid */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[46rem] overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-sky-200/30 to-violet-200/30 blur-3xl dark:from-primary/20 dark:via-sky-500/10 dark:to-violet-500/10" />
                <div className="welcome-dots absolute inset-0" />
            </div>

            <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
                <Logo size={36} />
                <Link
                    href={signInPath}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                    Sign in
                </Link>
            </header>

            <main id="main" className="relative z-10">
                {/* Hero */}
                <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-24 sm:px-6 sm:pb-36 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
                    <div className="animate-rise-in">
                        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {portalTagline}
                        </p>
                        <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                            Everything the team knows, ready for the{' '}
                            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                next client
                            </span>
                            .
                        </h1>
                        <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                            {portalName} brings our knowledge articles, reusable scripts, reference architectures and
                            discovery-to-BRD workflow into one place, for every planning and data platform we deliver.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <SignInButton />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Access is by invitation.
                                <br className="hidden sm:block" /> No account? Ask your administrator.
                            </p>
                        </div>
                        <ul className="mt-10 flex flex-wrap gap-2" aria-label="Products covered">
                            {PRODUCTS.map((product) => (
                                <li
                                    key={product.name}
                                    className={classNames(
                                        'product-tag rounded-lg px-2.5 py-1 text-xs font-semibold',
                                        productThemeClass(product.theme),
                                    )}
                                >
                                    {product.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:pl-4">
                        <HeroPreview />
                    </div>
                </section>

                {/* Features */}
                <section
                    aria-labelledby="features-heading"
                    className="border-t border-gray-100 bg-gray-50/70 py-20 dark:border-gray-800 dark:bg-gray-900/50"
                >
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <h2
                            id="features-heading"
                            className="max-w-2xl text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
                        >
                            One place from the first workshop to go-live
                        </h2>
                        <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400">
                            Stop rebuilding what someone already solved. Find it, reuse it, and hand clients a
                            consistent BRD every time.
                        </p>
                        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {FEATURES.map((feature) => (
                                <li
                                    key={feature.title}
                                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <span
                                        aria-hidden
                                        className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-subtle text-2xl text-primary"
                                    >
                                        {feature.icon}
                                    </span>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                        {feature.body}
                                    </p>
                                    <ul className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        {feature.points.map((point) => (
                                            <li key={point} className="flex gap-2">
                                                <span aria-hidden className="text-primary">
                                                    ✓
                                                </span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* How it works */}
                <section aria-labelledby="steps-heading" className="py-20">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <h2
                            id="steps-heading"
                            className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
                        >
                            How the team uses it
                        </h2>
                        <ol className="mt-10 grid gap-6 md:grid-cols-3">
                            {STEPS.map((step, index) => (
                                <li key={step.title} className="relative">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary tabular-nums">
                                            {index + 1}
                                        </span>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {step.title}
                                        </h3>
                                        {index < STEPS.length - 1 && (
                                            <span
                                                aria-hidden
                                                className="ml-2 hidden h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent md:block"
                                            />
                                        )}
                                    </div>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 md:pr-6 dark:text-gray-400">
                                        {step.body}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Call to action */}
                <section className="px-4 pb-20 sm:px-6">
                    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-deep px-6 py-12 text-center sm:px-12">
                        <div aria-hidden className="welcome-dots-light absolute inset-0 opacity-40" />
                        <div className="relative">
                            <h2 className="text-2xl font-bold text-white sm:text-3xl">Already on the team?</h2>
                            <p className="mx-auto mt-3 max-w-xl text-white/80">
                                Sign in with your work email. New here? Your administrator adds you and you’ll get an
                                email with a link to get started.
                            </p>
                            <Link
                                href={signInPath}
                                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-primary shadow-lg transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
                            >
                                Sign in to {portalName} <ForwardIcon aria-hidden />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 border-t border-gray-100 py-8 dark:border-gray-800">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-gray-500 sm:flex-row sm:px-6">
                    <Logo size={24} />
                    <div className="flex items-center gap-4">
                        <span>{portalTagline}</span>
                        <Link href={privacyPath} className="hover:text-primary hover:underline">
                            Privacy
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
