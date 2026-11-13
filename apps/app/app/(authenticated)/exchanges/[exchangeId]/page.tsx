"use client"

import { useCurrentUser } from "@/components/CurrentUser/CurrentUserProvider"
import { DashboardPageContent } from "@/components/DashboardPageLayout/DashboardPageContent"
import { DashboardPageHeader } from "@/components/DashboardPageLayout/DashboardPageHeader"
import { DeleteExchangeButton } from "@/components/DeleteExchangeButton/DeleteExchangeButton"
import { ExchangeInviteShare } from "@/components/ExchangeInvites/ExchangeInviteShare"
import { ExchangeInvitesTable } from "@/components/ExchangeInvites/ExchangeInvitesTable"
import { TabView, TabContent, Tabs } from "@/components/TabView/TabView"
import { Badge } from "@allthingsgift/ui/components/badge"
import { Button } from "@allthingsgift/ui/components/button"
import { Spinner } from "@allthingsgift/ui/components/spinner"
import { getExchangeById } from "@/lib/exchanges"
import { useQuery } from "@tanstack/react-query"
import { parseISO } from "date-fns"
import { ArrowLeft, Calendar, Edit, User2, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, type ReactNode } from "react"

// Share links to /dashboard/exchanges/[exchangeId]/join. The organizer approves or revokes.

export default function ExchangeDetailsPage({
    params,
}: {
    params: Promise<{ exchangeId: string }>
}) {
    const { exchangeId } = use(params)
    const router = useRouter()
    const { user } = useCurrentUser()

    const { data, error } = useQuery({
        queryKey: ["exchange", exchangeId],
        queryFn: () => getExchangeById(exchangeId),
        retry: false,
    })

    useEffect(() => {
        if (error && user) {
            router.replace("/exchanges")
        }
    }, [error, user, router])

    const isOrganizer = data?.organizerId === user?.id

    if (error) {
        return <p className="text-sm text-destructive">{error.message}</p>
    }

    if (!data) {
        return <Spinner className="self-center" />
    }

    const tabs = [{
        id: 'details',
        title: "Details",
    },
    {
        id: 'invites',
        title: 'Invites',
        hidden: !isOrganizer
    },
    {
        id: 'share',
        title: 'Share'
    }
    ]

    return <>
        <DashboardPageHeader title={data.name} description={data.description} />
        <div className="flex gap-2">
            <Button nativeButton={false} render={<Link href="/exchanges" />} variant="outline">
                <ArrowLeft size={12} />
                Back
            </Button>
            {isOrganizer && <>
                <Button nativeButton={false} render={<Link href={`/exchanges/${exchangeId}/edit`} />} variant="outline">
                    <Edit size={12} />
                    Edit
                </Button>
                <DeleteExchangeButton
                    exchangeId={exchangeId}
                    exchangeName={data.name}
                    onDeleted={() => router.replace("/exchanges")}
                />
            </>}
        </div>
        <DashboardPageContent>
            <TabView initialTab="details">
                <Tabs tabs={tabs} />
                <TabContent id="details">
                    <dl className="flex flex-col gap-4">
                        <DetailRow icon={<Calendar size={15} />} label="Exchange day">
                            {parseISO(data.exchangeDate).toDateString()}
                        </DetailRow>
                        <DetailRow icon={<Wallet size={15} />} label="Budget">
                            {data.budgetCents == null ? "No budget set" : `$${data.budgetCents / 100}`}
                        </DetailRow>
                        <DetailRow icon={<User2 size={15} />} label="Members">
                            <ul className="flex flex-col gap-2">
                                {data.members.map(member => <li key={member.userId} className="flex items-center justify-between gap-2">
                                    <span className="truncate">
                                        {member.displayName || member.email}
                                    </span>
                                    {member.isOrganizer && <Badge variant="secondary">Organizer</Badge>}
                                </li>)}
                            </ul>
                        </DetailRow>

                    </dl>
                </TabContent>
                {isOrganizer && <TabContent id="invites">
                    <ExchangeInvitesTable exchangeId={exchangeId} />
                </TabContent>}
                <TabContent id="share">
                    <ExchangeInviteShare exchangeId={exchangeId} />
                </TabContent>
            </TabView>
        </DashboardPageContent>
    </>
}

function DetailRow({ icon, label, children }: { icon: ReactNode, label: string, children: ReactNode }) {
    return <div className="flex flex-col gap-1">
        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
            {icon} {label}
        </dt>
        <dd className="text-sm">{children}</dd>
    </div>
}
