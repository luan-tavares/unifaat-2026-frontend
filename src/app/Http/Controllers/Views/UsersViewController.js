import UserModel from "../../../Models/UserModel.js";

const LIMIT = 10;

/**
 * Tela de usuarios como View: o HTML vem de resources/views/users.ejs e o React
 * monta a lista de usuarios (e as tasks de cada um) dentro do #root.
 * O usuario logado vem do token ja verificado (request.user); a primeira
 * pagina de usuarios e lida aqui, sem a senha.
 *
 * Rota: GET /usuarios (protegida por RedirectIfGuestMiddleware)
 */
export default async function UsersViewController(request, response) {
    const user = await UserModel.findByPk(request.user.id);

    if (!user) {
        return response.redirect("/login");
    }

    const { rows, count } = await UserModel.findAndCountAll({
        attributes: { exclude: ["password"] },
        order: [["id", "DESC"]],
        limit: LIMIT,
        raw: true
    });

    const initialUsers = { page: 1, limit: LIMIT, total: count, data: rows };

    return response.status(200).render("users", { user, initialUsers });
}
