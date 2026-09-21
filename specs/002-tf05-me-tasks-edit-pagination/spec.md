# SPEC: TF05 — Migração para /me/tasks, edição de nome e paginação de tarefas

## 1. Objetivo
Completar o gerenciador de tarefas migrando as chamadas de API para as rotas
contextuais `/me/tasks` (o `idUser` deixa de ir na URL, vem do JWT), adicionar
edição do **nome** da tarefa e exibir controles de **paginação** na listagem —
tudo tipado em TypeScript, para o TF da Aula 05.

## 2. Contexto / Motivação (Why)
O backend já expõe as rotas contextuais (`/me/tasks`, autenticadas via JWT) e já
pagina a listagem (`GET /me/tasks?page=&limit=` → `PaginatedResponse<Task>`),
mas o frontend ainda usa as rotas antigas (`/users/{idUser}/tasks`) e ignora
paginação e edição de nome. Isso é requisito explícito do TF05
(`aulas/05/TF05.md`), a ser entregue via formulário do professor.

## 3. Escopo

### Dentro do escopo
- Migrar `taskDeleteApi.ts`, `taskUpdateApi.ts`, `tasksListApi.ts` para
  `/me/tasks/...` (removendo `idUser` da assinatura/URL).
- Ajustar todos os chamadores dessas funções (`taskDeleteHandler.ts`,
  `taskToggleHandler.ts`, `tasksListRender.ts`, `pages/tasks.ts`) para a nova
  assinatura — `idUser` continua existindo na UI (dono da lista na tela), só
  não vai mais para o backend.
- Botão "Excluir" na UI (já existe em `taskRender.ts` desde o merge do TF04 —
  só precisa apontar pra API migrada).
- Edição de nome da tarefa: UI (botão "Editar" ou duplo-clique → input) +
  `listeners/taskEditHandler.ts` (novo arquivo) chamando
  `taskUpdateApi(taskId, { name })`.
- Paginação na listagem: botões "Anterior"/"Próxima" (habilitados/desabilitados
  conforme `page`, `limit`, `total`), recarregando via
  `tasksListRender(idUser, novaPagina)`.
- Tratamento de erro com feedback ao usuário (padrão já usado no projeto:
  `alert(...)` + `console.error(...)`) em toda ação nova/alterada.
- Tipagem completa (sem `any`), reaproveitando `Task` e `PaginatedResponse<T>`
  de `types/api.ts`.

### Fora do escopo (NÃO fazer)
- Remover ou alterar as rotas antigas `/users/{idUser}/tasks/...` no backend
  (o TF pede pra não mexer nelas).
- Trocar bibliotecas/frameworks (continua só Bootstrap + Axios).
- Mudar o fluxo de criação de tarefa ou de login/autenticação.
- Estilização além do necessário para os novos controles funcionarem
  (paginação, edição) ficarem legíveis com as classes Bootstrap já usadas no
  projeto.

## 4. Requisitos funcionais
- RF1: `taskDeleteApi(taskId)` chama `DELETE /me/tasks/{id}` (sem `idUser`).
- RF2: `taskUpdateApi(taskId, updates)` chama `PUT /me/tasks/{id}` (sem
  `idUser`).
- RF3: `tasksListApi({ page, limit })` chama `GET /me/tasks?page=&limit=` (sem
  `idUser`).
- RF4: Usuário consegue excluir uma tarefa pelo botão "Excluir" (com
  confirmação, comportamento já existente preservado) usando a API migrada.
- RF5: Usuário consegue editar o nome de uma tarefa pela UI; ao confirmar,
  `taskUpdateApi(taskId, { name })` é chamado e a lista é recarregada.
- RF6: A listagem exibe controles "Anterior"/"Próxima"; "Anterior" fica
  desabilitado na página 1, "Próxima" fica desabilitado na última página
  (calculada a partir de `total` e `limit`).
- RF7: Trocar de página chama `tasksListRender(idUser, novaPagina)` e
  atualiza a lista exibida.
- RF8: Erros de qualquer uma das ações (excluir, editar, paginar) mostram
  mensagem ao usuário e são logados no console.

## 5. Requisitos não-funcionais / Restrições
- TypeScript estrito, sem `any` solto (`tsconfig.json` já usa `strict: true`).
- Seguir a estrutura de pastas existente (`js/api`, `js/listeners`,
  `js/render`, `js/types`).
- Não quebrar o que já funciona: listar, criar, marcar como concluída.
- Sem frameworks além dos já usados (Bootstrap, Axios).

## 6. Critérios de aceitação (verificáveis)
- [ ] CA1: Dado o app rodando (`docker compose up`), quando eu excluo uma
      tarefa na tela de tasks, então a requisição vai para
      `DELETE /me/tasks/{id}` (sem `/users/{idUser}` na URL) e a tarefa some
      da lista.
- [ ] CA2: Dado uma tarefa na lista, quando eu edito o nome e confirmo, então
      a requisição vai para `PUT /me/tasks/{id}` com `{ name }` no body, e o
      novo nome aparece na lista após recarregar.
- [ ] CA3: Dado mais tarefas do que `limit` (10), quando a página carrega,
      então aparecem os botões de paginação; "Próxima" leva à página 2 e
      busca via `GET /me/tasks?page=2&limit=10`.
- [ ] CA4: Na página 1, o botão "Anterior" está desabilitado; na última
      página (conforme `total`/`limit`), o botão "Próxima" está desabilitado.
- [ ] CA5: Marcar/desmarcar "concluída" (checkbox) continua funcionando,
      agora via `/me/tasks/{id}`.
- [ ] CA6: `npx tsc --noEmit` (ou build do Vite) não acusa erros de tipo nos
      arquivos alterados/criados.
- [ ] CA7: Simular um erro de rede/API em excluir, editar ou paginar mostra
      alerta ao usuário (sem quebrar a tela).

## 7. Riscos e questões em aberto
- UI de edição (botão "Editar" vs. duplo-clique): vou seguir com **botão
  "Editar"** ao lado do "Excluir" por consistência visual com o botão
  existente — confirmar se é essa a preferência do Gabriel.
- Estilo dos controles de paginação (texto "Anterior/Próxima" vs. números de
  página): TF permite qualquer um; vou usar Anterior/Próxima por ser mais
  simples (YAGNI) — confirmar.
- `ListTaskController` também retorna um campo `next`, não mencionado no
  TF05.md; não é necessário para calcular "desabilitar Próxima" (dá pra usar
  `page * limit < total`), então não será usado — só documentando que existe.
