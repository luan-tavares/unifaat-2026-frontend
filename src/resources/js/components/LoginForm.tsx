import { useState } from "react"
import type { FormEvent } from "react"
import { loginApi } from "../api/loginApi"
import { getErrorMessage } from "../utils/getErrorMessage"

export function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Enviar o formulário: o servidor valida a senha e grava o JWT no cookie HttpOnly
    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await loginApi(email, password)

            // Sessão criada: a próxima página (View) já passa pelo middleware com o cookie
            window.location.href = "/tasks"
            return
        } catch (error) {
            setError(getErrorMessage(error, "Erro ao fazer login"))
        }

        setIsLoading(false)
    }

    return (
        <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
            <h2 className="text-center mb-4">Login</h2>

            <label className="form-label">Email</label>
            <input
                type="email"
                className="form-control"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
            />

            <label className="form-label">Senha</label>
            <input
                type="password"
                className="form-control"
                placeholder="sua senha"
                required
                value={password}
                onChange={event => setPassword(event.target.value)}
            />

            <button type="submit" className="btn btn-primary btn-lg mt-3" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
            </button>

            {error !== "" && <div className="alert alert-danger">{error}</div>}
        </form>
    )
}
