import type { ReactNode } from "react"
import { Header } from "./Header"

type PageProps = {
    userName: string
    active: "tasks" | "users"
    children: ReactNode
}

// Layout das telas logadas: o cabeçalho e a área de conteúdo
export function Page({ userName, active, children }: PageProps) {
    return (
        <>
            <Header userName={userName} active={active} />

            <main className="container flex-grow-1 py-5">
                {children}
            </main>
        </>
    )
}
