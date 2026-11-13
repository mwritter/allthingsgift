"use client"

import { DashboardPageContent } from "@/components/DashboardPageLayout/DashboardPageContent";
import { DashboardPageHeader } from "@/components/DashboardPageLayout/DashboardPageHeader";
import { ExchangeInvite } from "@/components/ExchangeInvites/ExchangeInvite";
import { ExchangeList } from "@/components/ExchangeList/ExchangeList";
import { Button } from "@allthingsgift/ui/components/button";
import { Spinner } from "@allthingsgift/ui/components/spinner";
import { getExchanges, getUserExchangeInvites } from "@/lib/exchanges";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ExchangesPage() {

    const { data: invitesData } = useQuery({
        queryKey: ['exchanges', 'invites'],
        queryFn: getUserExchangeInvites
    })

    const { data, error } = useQuery({
        queryKey: ['exchanges'],
        queryFn: getExchanges
    })

    return <>
        <DashboardPageHeader title="Exchanges" description="This is a list of exchanges your current a part of!">
            <Button render={<Link href="/exchanges/create" />} nativeButton={false}>
                <Plus />
                Create
            </Button>
        </DashboardPageHeader>
        <DashboardPageContent className="gap-5">
            {invitesData && invitesData.invites && (
                <ul className="flex flex-col gap-5">
                    {invitesData.invites.map(i => <ExchangeInvite key={i.id} {...i} />)}
                </ul>)
            }
            {error
                ? <p className="text-sm text-destructive">{error.message}</p>
                : !data
                    ? <Spinner className="self-center" />
                    : data.exchanges?.length > 0
                        ? <ExchangeList exchanges={data.exchanges} />
                        : <EmptyExchangeList />}
        </DashboardPageContent>
    </>
}

function EmptyExchangeList() {
    return <div className="w-full text-center justify-center">
        <p className="text-sm">No exchanges to list yet</p>
    </div>
}
