'use client'

import { Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
import MobileNav from '@/components/template/MobileNav'
import SideNavToggle from '@/components/template/SideNavToggle'
import HeaderSearch from '@/components/template/HeaderSearch'
import PageContainer from '@/components/template/PageContainer'
import UserDropdown from '@/components/template/UserDropdown'
import ThemeToggle from '@/components/template/ThemeToggle'
import ArrivalNotice from '@/components/auth/ArrivalNotice'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import useBreadcrumbs from '@/utils/hooks/useBreadcrumbs'
import type { ProviderProps } from '@/@types/common'

/** The app shell: collapsible side navigation, header, breadcrumbs and page container. */
export default function PostLoginLayout({ children }: ProviderProps) {
    const breadcrumbs = useBreadcrumbs((state) => state.items)

    return (
        // Every framer-motion animation follows the user's reduced-motion preference
        <MotionConfig reducedMotion="user">
            <Suspense fallback={null}>
                <ArrivalNotice />
            </Suspense>
            <a
                href="#main"
                className="sr-only-focusable fixed left-2 top-2 z-50 rounded-lg bg-primary px-3 py-2 text-neutral"
            >
                Skip to content
            </a>
            <div className="app-layout-collapsible-side flex flex-auto flex-col">
                <div className="flex min-w-0 flex-auto">
                    <SideNav />
                    <div className="relative flex min-h-screen w-full min-w-0 flex-auto flex-col bg-white dark:bg-gray-900">
                        <Header
                            headerStart={
                                <>
                                    <MobileNav />
                                    <SideNavToggle />
                                    <HeaderSearch />
                                </>
                            }
                            headerEnd={
                                <>
                                    <ThemeToggle />
                                    <UserDropdown />
                                </>
                            }
                        />
                        <div id="main" className="flex h-full flex-auto flex-col" tabIndex={-1}>
                            <PageContainer>
                                {breadcrumbs.length > 0 && (
                                    <div className="mb-4">
                                        <Breadcrumbs items={breadcrumbs} />
                                    </div>
                                )}
                                {children}
                            </PageContainer>
                        </div>
                    </div>
                </div>
            </div>
        </MotionConfig>
    )
}
