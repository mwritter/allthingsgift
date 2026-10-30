import { createContext, ReactNode, useContext, useState } from "react";

type TabViewContextType = {
    currentTab: string,
    onTabSelect: (tabId: string) => void
    registerTab: (tab: Tab) => void
}

export type Tab = {
    id: string,
    title: string
}

const TabViewContext = createContext<TabViewContextType>({} as TabViewContextType)


export function TabViewProvider({ initalTab, children }: { initalTab: string, children: ReactNode }) {
    const [currentTab, setCurrentTab] = useState<string>(initalTab)
    const [tabs, setTabs] = useState<Tab[]>([])

    const onTabSelect = (tabId: string) => {
        setCurrentTab(tabId)
    }

    const registerTab = (tab: Tab) => {
        setTabs(cur => {
            if (!cur.find(t => t.id === tab.id)) {
                return [...cur, tab]
            }
            return cur
        })
    }

    return <TabViewContext value={{
        currentTab,
        onTabSelect,
        registerTab
    }}>{children}</TabViewContext>
}

export const useTabViewContext = () => useContext(TabViewContext)