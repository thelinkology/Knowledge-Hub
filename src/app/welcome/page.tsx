import type { Metadata } from 'next'
import WelcomePage from '@/components/welcome/WelcomePage'
import { portalName, portalTagline } from '@/configs/app.config'

export const metadata: Metadata = { title: { absolute: `${portalName} · ${portalTagline}` } }

/**
 * The public home page. Signed-out visitors of "/" see it (the proxy rewrites "/" to here, so the
 * address stays "/"); signed-in people are sent to the app.
 */
export default function Welcome() {
    return <WelcomePage />
}
