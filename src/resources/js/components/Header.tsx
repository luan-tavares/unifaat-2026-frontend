type HeaderProps = {
    userName: string
    active: "tasks" | "users"
}

export function Header({ userName, active }: HeaderProps) {
    const tasksClass = active === "tasks" ? "nav-link active fw-bold" : "nav-link"
    const usersClass = active === "users" ? "nav-link active fw-bold" : "nav-link"

    return (
        <header className="bg-primary text-white d-flex flex-wrap justify-content-between align-items-center gap-3 py-3 px-4 shadow-sm">
            <h1 className="h4 m-0">Tasks</h1>

            <nav className="nav">
                <a className={`${tasksClass} text-white`} href="/tasks">Minhas tasks</a>
                <a className={`${usersClass} text-white`} href="/usuarios">Usuários</a>
            </nav>

            <div className="d-flex align-items-center gap-3">
                <span className="small">{userName}</span>
                <a className="btn btn-light btn-sm" href="/logout">Sair</a>
            </div>
        </header>
    )
}
