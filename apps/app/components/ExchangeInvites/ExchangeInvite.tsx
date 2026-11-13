"use client"

import { Button } from "@allthingsgift/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@allthingsgift/ui/components/card";
import { Calendar, Check, User2, Wallet, X } from "lucide-react";
import type { Exchange } from "@allthingsgift/types";
import { parseISO } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptExchangeInvite, declineExchangeInvite } from "@/lib/exchanges";

type Props = Exchange & {
    organizerEmail?: string,
    organizerDisplayName?: string
}

export function ExchangeInvite({ id: exchangeId, name, exchangeDate, budgetCents, description, members, organizerDisplayName, organizerEmail }: Props) {

    const membersText = members?.length > 1 ? 'members' : 'member'
    const orgainzer = organizerDisplayName || organizerEmail
    const queryClient = useQueryClient()

    const accept = useMutation({
        mutationKey: ["exchange", "invite", "accept", exchangeId],
        mutationFn: acceptExchangeInvite,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exchanges"] })
        },
    })

    const decline = useMutation({
        mutationKey: ["exchange", "invite", "decline", exchangeId],
        mutationFn: declineExchangeInvite,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exchanges"] })
        },
    })

    const pending = accept.isPending || decline.isPending
    const actionError = accept.error ?? decline.error

    const onAcceptInvite = () => {
        accept.mutate(exchangeId)
    }

    const onDeclineInvite = () => {
        decline.mutate(exchangeId)
    }

    return <Card>
        <CardHeader>
            <CardTitle>
                {name}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            {members?.length > 0 && <div className="flex items-center gap-2">
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
            {orgainzer && <p className="text-sm">Created by {orgainzer}</p>}
            <div className="flex flex-col items-end gap-2">
                {actionError && <p className="text-sm text-destructive">{actionError.message}</p>}
                <div className="flex gap-2">
                    <Button aria-label={`Accept invite to ${name}`} disabled={pending} onClick={onAcceptInvite}>
                        <Check size={12} />
                    </Button>
                    <Button aria-label={`Decline invite to ${name}`} variant="destructive" disabled={pending} onClick={onDeclineInvite}>
                        <X size={12} />
                    </Button>
                </div>
            </div>
        </CardFooter>
    </Card>
}
