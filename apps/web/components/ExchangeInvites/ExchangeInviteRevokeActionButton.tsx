import { X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { useState } from "react";
import { revokeExchangeInvite } from "@/lib/exchanges";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
    exchangeId: string
    email: string
}

export function ExchangeInviteRevokeActionButton({ email, exchangeId }: Props) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const revokeInvite = useMutation({
        mutationFn: () => revokeExchangeInvite(exchangeId, email),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exchange", exchangeId] })
            setOpen(false)
        }
    })

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
                render={<Button variant="destructive" aria-label={`Revoke`}>
                    <X size={12} />
                </Button>}
            />
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Revoke Invite?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will revokes the members invite.  You can resend the invite.
                        <span className="block pt-1">{email}</span>
                    </AlertDialogDescription>
                    {revokeInvite.isError && (
                        <p className="text-sm text-destructive">{revokeInvite.error.message}</p>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        disabled={revokeInvite.isPending}
                        onClick={() => revokeInvite.mutate()}
                    >{revokeInvite.isPending ? "Revoking..." : "Revoke"}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}