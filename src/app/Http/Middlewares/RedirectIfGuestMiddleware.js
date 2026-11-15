import jwt from "jsonwebtoken";

/**
 * Middleware de página (View), o espelho do RedirectIfAuthenticatedMiddleware.
 *
 * Página que exige sessão: sem cookie auth_token válido, o usuário é mandado
 * para o login ANTES de o HTML ser montado. Com token válido, guarda o id
 * do usuário em request.user e segue para o controller.
 */
export default function RedirectIfGuestMiddleware(request, response, next) {
    const token = request.cookies.auth_token;

    if (!token) {
        return response.redirect("/login");
    }

    try {
        request.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return response.redirect("/login");
    }

    return next();
}
