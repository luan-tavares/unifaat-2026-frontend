/**
 * Encerra a sessão: o cookie auth_token é HttpOnly, então o JavaScript do
 * navegador não consegue apagá-lo. Quem apaga é o servidor.
 *
 * Rota: GET /logout
 */
export default function LogoutController(request, response) {
    response.clearCookie("auth_token", {
        httpOnly: true,
        sameSite: "lax"
    });

    return response.redirect("/login");
}
