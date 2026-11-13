"use client"

import { DashboardPageContent } from "@/components/DashboardPageLayout/DashboardPageContent";
import { DashboardPageHeader } from "@/components/DashboardPageLayout/DashboardPageHeader";
import { ExchangeForm } from "@/components/ExchangeForm/ExchangeForm";
import { createExchange } from "@/lib/exchanges";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function CreateExchangePage() {
    const router = useRouter()
    const queryClient = useQueryClient()

    const create = useMutation({
        mutationKey: ["exchanges"],
        mutationFn: createExchange,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exchanges"] })
            router.replace("/exchanges")
        }
    })

    return <>
        <DashboardPageHeader title="Create Exchange" description="Set up a new exchange and invite the people you want in it." />
        <DashboardPageContent>
            <ExchangeForm onSubmit={create.mutate} isLoading={create.isPending} />
        </DashboardPageContent>
    </>
}
