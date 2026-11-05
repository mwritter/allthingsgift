"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type TabViewContextType = {
    currentTab: string,
    onTabSelect: (tabId: string) => void
}

export type Tab = {
    id: string,
    title: string
}

const TabViewContext = createContext<TabViewContextType>({} as TabViewContextType)

export function TabViewProvider({ initalTab, children }: { initalTab: string, children: ReactNode }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [currentTab, setCurrentTab] = useState<string>(() => {
        return searchParams.get('tab') || initalTab
    })

    const onTabSelect = (tabId: string) => {
        setCurrentTab(tabId)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', tabId)
        router.push(`${pathname}?${params.toString()}`)
    }

    return <TabViewContext value={{
        currentTab,
        onTabSelect,
    }}>{children}</TabViewContext>
}

export const useTabViewContext = () => useContext(TabViewContext)