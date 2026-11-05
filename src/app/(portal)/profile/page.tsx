import type { Metadata } from 'next'
import ProfileClientPage from '@/components/profile/ProfileClientPage'
import { requireUser } from '@/server/actions/auth'
import { getMyProfile } from '@/server/actions/users'

export const metadata: Metadata = { title: 'My profile' }

export default async function ProfilePage() {
    const user = await requireUser()
    return <ProfileClientPage profile={await getMyProfile(user)} />
}
