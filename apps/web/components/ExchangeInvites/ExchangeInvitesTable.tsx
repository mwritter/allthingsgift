import { ExchangeInviteStatus, ExchangeInviteStatusAccepted, ExchangeInviteStatusDeclined, ExchangeInviteStatusPending, ExchangeInviteStatusRevoked } from "@giftexchanger/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { useQuery } from "@tanstack/react-query"
import { getExchangeInvites } from "@/lib/exchanges"
import { Spinner } from "../ui/spinner"
import { Button } from "../ui/button"

export function ExchangeInvitesTable({ exchangeId }: { exchangeId: string }) {

    // Only the organizer is allowed to read invites, so don't ask otherwise.
    const { data, isLoading, error } = useQuery({
        queryKey: ["exchange", exchangeId, "invites"],
        queryFn: () => getExchangeInvites(exchangeId),
    })

    if (isLoading) return <Spinner className="flex w-full" />

    if (error) return <p className="text-sm text-destructive">{error.message}</p>

    if (data?.invites.length === 0) return <p className="text-sm text-muted-foreground">Nobody invited yet</p>

    return <div className="flex flex-col w-full">
        <Button className="w-full whitespace-nowrap md:w-min">Invite Member</Button>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data?.invites.map(invite => <TableRow key={invite.email}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                        <InviteStatusBadge status={invite.status} />
                    </TableCell>
                </TableRow>)}
            </TableBody>
        </Table>
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
                ? "secondary"
                : "outline"

    return <Badge variant={variant}>{inviteStatusLabel[status]}</Badge>
}