import clientApi from "./_clientApi.js";

export async function taskCreateApi(task) {
    const { data } = await clientApi.post("/me/tasks", task);

    return data;
}