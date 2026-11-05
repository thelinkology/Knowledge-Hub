import Link from 'next/link'
import Logo from '@/components/template/Logo'
import { portalName, portalTagline, privacyPath } from '@/configs/app.config'
import type { ReactNode } from 'react'

/** Frame for sign-in and sign-up: brand, a short pitch, and the form in a system panel. */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--primary-subtle), transparent 60%)' }}
            />
            <div className="w-full max-w-md">
                <div className="mb-6 flex flex-col items-center text-center">
                    <Logo size={44} />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{portalTagline}</p>
                </div>
                <div className="system-panel p-6 sm:p-8">{children}</div>
                <p className="mt-6 text-center text-xs text-gray-500">
                    {portalName} keeps only your display name and sign-in email.{' '}
                    <Link href={privacyPath} className="underline hover:text-primary">
                        Privacy
                    </Link>
                </p>
            </div>
        </main>
    )
}
