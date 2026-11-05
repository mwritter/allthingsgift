import { ExchangeInviteStatus, ExchangeInviteStatusAccepted, ExchangeInviteStatusDeclined, ExchangeInviteStatusPending, ExchangeInviteStatusRevoked } from "@giftexchanger/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addExchangeInvite, getExchangeInvites } from "@/lib/exchanges"
import { Spinner } from "../ui/spinner"
import { ExchangeInvitesMemberDialog } from "./ExchangeInvitesMemberDialog"
import { RefreshCcw } from "lucide-react"
import { Button } from "../ui/button"
import { ExchangeInviteRevokeActionButton } from "./ExchangeInviteRevokeActionButton"

export function ExchangeInvitesTable({ exchangeId }: { exchangeId: string }) {
    const queryClient = useQueryClient()

    // Only the organizer is allowed to read invites, so don't ask otherwise.
    const { data, isLoading, error } = useQuery({
        queryKey: ["exchange", exchangeId, "invites"],
        queryFn: () => getExchangeInvites(exchangeId),
    })

    const reinstateInvite = useMutation({
        mutationFn: (email: string) => addExchangeInvite(exchangeId, email),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exchange", exchangeId] })
        }
    })

    if (isLoading) return <Spinner className="flex w-full" />

    if (error) return <p className="text-sm text-destructive">{error.message}</p>

    return <div className="flex flex-col w-full gap-4">
        {data && data?.invites.length > 0 ? <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data?.invites.map(({ email, status }) => {
                    const canRevokeStatus = [ExchangeInviteStatusPending, ExchangeInviteStatusAccepted].includes(status)
                    const canResendEmail = [ExchangeInviteStatusDeclined, ExchangeInviteStatusRevoked].includes(status)
                    return (
                        <TableRow key={email}>
                            <TableCell>{email}</TableCell>
                            <TableCell>
                                <InviteStatusBadge status={status} />
                            </TableCell>
                            <TableCell className="flex justify-center">
                                {canRevokeStatus && <ExchangeInviteRevokeActionButton email={email} exchangeId={exchangeId} />}
                                {canResendEmail && <Button title="resend invite" onClick={() => { reinstateInvite.mutate(email) }} variant="outline"><RefreshCcw className="size-3" /></Button>}
                            </TableCell>
                        </TableRow>)
                }
                )}
            </TableBody>
        </Table> : <p className="text-sm text-muted-foreground h-30 border rounded-md flex justify-center items-center">Nobody invited yet</p>}
        <ExchangeInvitesMemberDialog exchangeId={exchangeId} />
    </div>
}

const inviteStatusLabel: Record<ExchangeInviteStatus, string> = {
    [ExchangeInviteStatusPending]: "Pending",
    [ExchangeInviteStatusAccepted]: "Accepted",
    [ExchangeInviteStatusDeclined]: "Declined",
    [ExchangeInviteStatusRevoked]: "Revoked",
}

function InviteStatusBadge({ status }: { status: ExchangeInviteStatus }) {
    const variant = status === ExchangeInviteStatusDeclined
        ? "destructive"
        : status === ExchangeInviteStatusAccepted
            ? "default"
            : status === ExchangeInviteStatusRevoked
                ? "destructive"
                : "outline"

    return <Badge variant={variant}>{inviteStatusLabel[status]}</Badge>
}