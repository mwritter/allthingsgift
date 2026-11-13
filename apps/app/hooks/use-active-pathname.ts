import { usePathname } from "next/navigation"

const DASHBOARD_ROOT = "/"

type Props = {
    href: string
}

// Nav links stay active on their nested routes (/exchanges/{id}),
// except the dashboard root, which would otherwise match every page.
export const useActivePathname = ({ href }: Props) => {
    const pathname = usePathname()
    const isActive = href === DASHBOARD_ROOT
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`)

    return { isActive }
}
