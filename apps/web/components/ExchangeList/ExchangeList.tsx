import type { Exchange } from "@allthingsgift/types"
import { ExchangeListItems } from "./ExchangeListItem"

type Props = {
    exchanges: Exchange[]
}

export function ExchangeList({ exchanges }: Props) {
    return <ul className="flex flex-col gap-4">
        {exchanges.map(e => <ExchangeListItems key={e.id} {...e} />)}
    </ul>
}
