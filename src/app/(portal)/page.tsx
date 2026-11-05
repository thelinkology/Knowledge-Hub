import type { Metadata } from 'next'
import HomeSWRProvider from '@/components/home/HomeSWRProvider'
import HomeClientPage from '@/components/home/HomeClientPage'
import { getHomeOverview } from '@/server/actions/reports'
import { requirePagePermission } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Home' }

export default async function HomePage() {
    const user = await requirePagePermission('knowledge.read')
    const overview = await getHomeOverview(user)
    return (
        <HomeSWRProvider overview={overview}>
            <HomeClientPage />
        </HomeSWRProvider>
    )
}
