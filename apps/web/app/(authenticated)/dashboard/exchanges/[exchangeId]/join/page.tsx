"use client"

import { DashboardPageContent } from "@/components/DashboardPageLayout/DashboardPageContent"
import { JoinExchangeRequest } from "./JoinExchangeRequest"
import { useCurrentUser } from "@/components/CurrentUser/CurrentUserProvider"
import { DashboardPageHeader } from "@/components/DashboardPageLayout/DashboardPageHeader"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { fromApiDate, getExchangeJoinPreview } from "@/lib/exchanges"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ExchangeRequestJoinPage({
    params,
}: {
    params: Promise<{ exchangeId: string }>
}) {
    const { exchangeId } = use(params)
    const router = useRouter()
    const { user } = useCurrentUser()
    const { data: preview, error, isLoading } = useQuery({
        queryKey: ["exchange", exchangeId, "join"],
        queryFn: () => getExchangeJoinPreview(exchangeId),
        retry: false,
    })
    const exchangeDate = preview ? fromApiDate(preview.exchangeDate) : null
    const organizer = preview?.organizerName || preview?.organizerEmail

    useEffect(() => {
        if (error) {
            router.replace("/dashboard/exchanges")
        }
    }, [error, router])

    return (
        <>
            <DashboardPageHeader
                title={"Exchanges"}
                description="Looks like you have and exchange link!"
            />
            {(isLoading || error) && <Spinner className="self-center" />}
            <div className="flex gap-2">
                <Button nativeButton={false} render={<Link href="/dashboard/exchanges" />} variant="outline">
                    <ArrowLeft size={12} />
                    Back
                </Button>
            </div>
            {preview && user && (
                <DashboardPageContent className="gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <p>{preview.name}</p>
                            </CardTitle>
                            <CardDescription>{preview.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {exchangeDate && <div className="flex items-center gap-2">
                                <Calendar size={15} /> {exchangeDate.toDateString()}
                            </div>}

                        </CardContent>
                        {organizer && <CardFooter className="flex justify-between">
                            Created by {organizer}
                        </CardFooter>}
                    </Card>
                    <JoinExchangeRequest exchangeId={exchangeId} />
                </DashboardPageContent>
            )}
        </>
    )
}
