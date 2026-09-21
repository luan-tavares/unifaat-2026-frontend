# TASKS: TF05 — Migração /me/tasks, edição de nome e paginação

- [ ] T1: Migrar `taskDeleteApi.ts` para `DELETE /me/tasks/{id}` (remove `idUser`).
- [ ] T2: Migrar `taskUpdateApi.ts` para `PUT /me/tasks/{id}` (remove `idUser`).
- [ ] T3: Migrar `tasksListApi.ts` para `GET /me/tasks` (remove `idUser`).
- [ ] T4: Ajustar `taskDeleteHandler.ts` e `taskToggleHandler.ts` para as novas assinaturas (sem `idUser`).
- [ ] T5: Criar `listeners/taskEditHandler.ts` (span → input, Enter/Escape/blur).
- [ ] T6: Atualizar `render/taskRender.ts` — classe `task-name` no span + botão "Editar".
- [ ] T7: Criar `render/paginationRender.ts` (Anterior/Próxima + "Página X de Y").
- [ ] T8: Atualizar `render/tasksListRender.ts` — usar `tasksListApi({ page })` e anexar `paginationRender`.
- [ ] T9: Verificar — `tsc --noEmit`, rebuild do Vite sem erro, teste manual no navegador (listar/editar/excluir/paginar/concluir), confirmar via Network que só `/me/tasks*` é chamado.
