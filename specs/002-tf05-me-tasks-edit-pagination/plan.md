# PLAN: TF05 — Migração /me/tasks, edição de nome e paginação

## Stack / arquitetura
Sem novas dependências. TypeScript puro compilado pelo Vite (`node24-vite-compiler`
+ `node-vite-hmr`), consumido pelo `nodeweb-container` (nginx serve o `public/`
gerado). Segue a estrutura já existente: `js/api` (HTTP), `js/listeners`
(handlers de evento), `js/render` (DOM), `js/types` (tipos compartilhados).

## Decisões técnicas

1. **Edição de nome — confirmação**: Enter confirma e salva; Escape cancela
   (recarrega a lista sem chamar a API); blur (clicar fora) também confirma —
   evita o input ficar "preso" em modo edição sem exigir um botão "Salvar"
   dedicado (KISS/YAGNI, mantendo consistência com o padrão simples do
   projeto). Um guard (`settled`) evita chamada dupla quando Escape dispara
   blur em seguida.
2. **Paginação — estilo**: botões "Anterior"/"Próxima" (não numerados),
   conforme aprovado na SPEC.
3. **`render/paginationRender.ts` como arquivo próprio**: o projeto já teve
   esse padrão antes da migração pra TS (`paginationRender.js`, removido na
   Aula 05) — recriar como módulo isolado segue a convenção existente de "um
   arquivo de render por responsabilidade" (`taskRender` renderiza 1 task,
   `tasksListRender` orquestra a lista, `paginationRender` só os controles).
   Recebe `(listApi, onPageChange)` — callback em vez de importar
   `tasksListRender` diretamente, evitando acoplamento/import circular.
4. **`pages/tasks.ts` não muda**: ele chama `tasksListRender(idUser)` e
   `tasksListeners(idUser)`, nunca as APIs migradas diretamente — o `idUser`
   continua existindo ali (dono da tela), só não desce até `_clientApi`.
5. **`taskCreateApi` fica fora do escopo** — TF05 não pede migração dela.

## Arquivos afetados

### Modificar

**`js/api/taskDeleteApi.ts`**
```ts
export async function taskDeleteApi(taskId: number): Promise<void> {
  const { data } = await clientApi.delete(`/me/tasks/${taskId}`);
  return data;
}
```

**`js/api/taskUpdateApi.ts`**
```ts
export async function taskUpdateApi(
  taskId: number,
  updates: Partial<Pick<Task, "name" | "is_done">>
): Promise<Task> {
  const { data } = await clientApi.put<Task>(`/me/tasks/${taskId}`, updates);
  return data;
}
```

**`js/api/tasksListApi.ts`**
```ts
export async function tasksListApi(
  { page = 1, limit = 10 }: PaginationParams = {}
): Promise<PaginatedResponse<Task>> {
  const { data } = await clientApi.get<PaginatedResponse<Task>>("/me/tasks", {
    params: { page, limit },
  });
  return data;
}
```

**`js/listeners/taskDeleteHandler.ts`** — `taskDeleteApi(idUser, taskId)` →
`taskDeleteApi(taskId)` (resto igual: confirm + alert de erro já existem).

**`js/listeners/taskToggleHandler.ts`** — `taskUpdateApi(idUser, taskId, {is_done})`
→ `taskUpdateApi(taskId, { is_done })`.

**`js/render/taskRender.ts`** — adiciona classe `task-name` no `<span>` (pra
`taskEditHandler` achar o elemento) e um botão "Editar" entre o nome e o
"Excluir", ligado a `taskEditHandler`.

**`js/render/tasksListRender.ts`** — chama `tasksListApi({ page })` (sem
`idUser`); ao final, anexa `paginationRender(listApi, onPageChange)` ao
container (só quando há dados).

### Criar

**`js/listeners/taskEditHandler.ts`** — transforma o `.task-name` num
`<input>` focado; `Enter` chama `taskUpdateApi(taskId, { name })` e recarrega
a lista; `Escape` cancela (recarrega sem chamar API); `blur` confirma. Erros
via `alert` + `console.error`, mesmo padrão dos outros handlers.

**`js/render/paginationRender.ts`** — `paginationRender(listApi: PaginatedResponse<Task>, onPageChange: (page: number) => void): HTMLElement`.
Calcula `totalPages = Math.ceil(total / limit)`; desabilita "Anterior" na
página 1 e "Próxima" na última página; texto central "Página X de Y".

### Sem alteração
`pages/tasks.ts`, `listeners/tasksListeners.ts`, `types/api.ts`,
`types/dom.ts`, `api/taskCreateApi.ts`.

## Verificação planejada
1. `npx --yes -p typescript@5.9.3 tsc --noEmit -p src/tsconfig.json` — sem
   erros de tipo.
2. `docker compose up -d` já ativo — Vite compiler rebuilda em watch mode
   automaticamente ao salvar; conferir logs sem erro de build.
3. Teste manual no navegador (`http://localhost:8081/tasks.html`): listar,
   editar nome (Enter e Escape), excluir, marcar concluída, paginar (criar
   >10 tarefas ou usar seed) — todas batendo em `/me/tasks*` (checar aba
   Network).
4. Conferir que as rotas antigas (`/users/{idUser}/tasks`) não são mais
   chamadas pelo frontend após a migração.
