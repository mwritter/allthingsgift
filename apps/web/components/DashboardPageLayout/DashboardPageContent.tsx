import { cn } from "cn";
import { ReactNode } from "react";

type Props = { children: ReactNode, className?: string }

export function DashboardPageContent({ className, children }: Props) {
    return <div className={cn("flex flex-col w-full md:max-w-125 max-md:mx-auto md:mt-10", className)}>
        {children}
    </div>
}