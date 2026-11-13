"use client"

import { useCurrentUser } from "@/components/CurrentUser/CurrentUserProvider";
import { DeleteExchangeButton } from "@/components/DeleteExchangeButton/DeleteExchangeButton";
import { Button } from "@allthingsgift/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@allthingsgift/ui/components/card";
import { Calendar, Edit, User2, Wallet } from "lucide-react";
import type { Exchange } from "@allthingsgift/types";
import { parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ExchangeListItems({ id, name, exchangeDate, budgetCents, description, members, organizerId }: Exchange) {
    const router = useRouter()
    const { user } = useCurrentUser()
    const isOrganizer = organizerId === user?.id

    const organizer = members.find(member => member.isOrganizer)
    const membersText = members.length > 1 ? 'members' : 'member'

    const navigateToExchangeDetails = () => {
        router.push(`/exchanges/${id}`)
    }

    return <li>
        <Card className="bg-white hover:bg-secondary/50 transition-all duration-500 cursor-pointer" onClick={navigateToExchangeDetails}>
            <CardHeader>
                <CardTitle>
                    <p>{name}</p>
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {members.length > 0 && <div className="flex items-center gap-2">
                    <User2 size={15} /> <span className="truncate">{members.length} {membersText} </span>
                </div>}
                <div className="flex items-center gap-2">
                    <Calendar size={15} /> {parseISO(exchangeDate).toDateString()}
                </div>
                {budgetCents != null && <div className="flex items-center gap-2">
                    <Wallet size={15} /> ${budgetCents / 100} budget
                </div>}
            </CardContent>
            <CardFooter className="flex justify-between">
                <p className="text-sm">Created by {isOrganizer ? "you" : organizer?.displayName || organizer?.email}</p>
                {isOrganizer && <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                    <Button className="cursor-default" nativeButton={false} render={<Link href={`/exchanges/${id}/edit`} />} variant="outline">
                        <Edit size={12} />
                    </Button>
                    <DeleteExchangeButton exchangeId={id} exchangeName={name} />
                </div>}
            </CardFooter>
        </Card>
    </li>
}
