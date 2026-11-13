"use client"

import { Button } from "@allthingsgift/ui/components/button"
import { Field, FieldError } from "@allthingsgift/ui/components/field"
import { userRequestExchangeInvite } from "@/lib/exchanges"
import { useMutation } from "@tanstack/react-query"

type Props = {
    exchangeId: string
}
// TODO: maybe make this auto request
export function JoinExchangeRequest({ exchangeId }: Props) {
    const requestInvite = useMutation({
        mutationFn: () => userRequestExchangeInvite(exchangeId),
        mutationKey: ["exchanges", "request", exchangeId],
    })

    return (
        <div className="flex flex-col gap-4 w-full md:max-w-125">
            {requestInvite.isSuccess ? (
                <p className="text-center">Your request to join has been sent!</p>
            ) : (
                <>
                    <p className="text-center">Request to join this exchange!</p>
                    <Field>
                        <Button type="button" className="justify-self-start self-start sm:max-w-100 mx-auto" disabled={requestInvite.isPending} onClick={() => requestInvite.mutate()}>
                            {requestInvite.isPending ? "Sending…" : "Request to join"}
                        </Button>
                        {requestInvite.isError && (
                            <FieldError>{requestInvite.error.message}</FieldError>
                        )}
                    </Field>
                </>
            )}
        </div>
    )
}
