import { LoginForm } from "@/components/LoginForm/LoginForm"
import { basePath, toAppPath } from "@/lib/base-path"
import { safeNextPath } from "@/lib/redirect"
import { getCurrentUser } from "@/lib/session"
import { Gift } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function Login({ searchParams }: PageProps<"/login">) {
    const { next } = await searchParams
    const destination = safeNextPath(next) ?? basePath
    if (await getCurrentUser()) {
        redirect(toAppPath(destination))
    }

    return <div className="flex flex-1 p-10">
        <Link href="/" className="fixed flex items-center gap-2 top-10 left-10 font-bold text-2xl max-sm:hidden">
            <Gift /> AllThingsGift
        </Link>
        <div className="flex flex-col justify-center items-center flex-1">
            <div className="flex flex-col items-center w-full max-w-120">
                <Link href="/" className="flex gap-2 items-center font-bold text-xl sm:hidden max-sm:mb-10">
                    <Gift /> AllThingsGift
                </Link>
                <LoginForm next={destination} />
            </div>
        </div>
    </div>
}
