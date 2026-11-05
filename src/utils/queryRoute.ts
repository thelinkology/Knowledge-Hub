import navigationConfig from '@/configs/navigation.config'
import { homePath } from '@/configs/app.config'

const items = navigationConfig.flatMap((nav) => (nav.subMenu.length ? nav.subMenu : [nav])).filter((nav) => nav.path)

/** The navigation item a pathname belongs to (longest matching path prefix), for the active menu state. */
export default function queryRoute(pathname: string): { key: string } {
    const match = items
        .filter((nav) => (nav.path === homePath ? pathname === homePath : pathname.startsWith(nav.path)))
        .sort((a, b) => b.path.length - a.path.length)[0]
    return { key: match?.key ?? '' }
}
