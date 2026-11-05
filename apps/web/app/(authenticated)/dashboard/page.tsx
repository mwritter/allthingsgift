import { DashboardPageContent } from "@/components/DashboardPageLayout/DashboardPageContent"
import { DashboardPageHeader } from "@/components/DashboardPageLayout/DashboardPageHeader"
import { requireUser } from "@/lib/session"

export default async function Dashboard() {
    await requireUser()

    return (
        <>
            <DashboardPageHeader title="My Dashboard" />
            <DashboardPageContent className="md:max-w-full">
                <p>Welcome to your Dashboard</p>
            </DashboardPageContent>
        </>
    )
}