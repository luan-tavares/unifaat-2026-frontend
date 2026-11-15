import UserModel from "../../../Models/UserModel.js";
import TaskModel from "../../../Models/TaskModel.js";

/**
 * Tela de tasks como View: o HTML vem de resources/views/tasks.ejs e o React
 * monta o CRUD dentro do #root, já com as tasks lidas aqui do banco.
 *
 * Rota: GET /tasks (protegida por RedirectIfGuestMiddleware)
 */
export default async function TasksViewController(request, response) {
    const user = await UserModel.findByPk(request.user.id);

    if (!user) {
        return response.redirect("/login");
    }

    const tasks = await TaskModel.findAll({
        where: { id_user: user.id },
        order: [["id", "ASC"]],
        raw: true
    });

    return response.status(200).render("tasks", { user, tasks });
}
