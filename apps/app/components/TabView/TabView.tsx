import { Activity, ReactNode } from "react"
import { Tab, TabViewProvider, useTabViewContext } from "./context"
import { cn } from "cn"

type Props = {
    initialTab: string,
    children: ReactNode
}

export function TabView({ initialTab, children }: Props) {
    return <TabViewProvider initalTab={initialTab}>
        {children}
    </TabViewProvider>
}

export function Tabs({ tabs }: { tabs: Tab[] }) {

    const { currentTab, onTabSelect } = useTabViewContext()

    const handleTabClick = (id: string) => onTabSelect(id)

    if (tabs.length === 0) return null

    return <div className="flex border rounded-md overflow-hidden w-full mb-5">
        {tabs.filter(t => !t.hidden).map(tab => <button className={cn("flex-1 text-sm p-1 not-last:border-r", {
            "bg-primary text-white": currentTab === tab.id
        })} onClick={() => handleTabClick(tab.id)} key={tab.id}>{tab.title}</button>)}
    </div>
}

export function TabContent({ id, children }: { id: string, children: ReactNode }) {

    const { currentTab } = useTabViewContext()

    return (
        <Activity mode={currentTab === id ? 'visible' : 'hidden'}>
            <div className="w-full">
                {children}
            </div>
        </Activity>
    )
}