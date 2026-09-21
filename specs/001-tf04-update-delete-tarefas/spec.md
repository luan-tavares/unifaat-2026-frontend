# SPEC: TF 04 — Marcar tarefa como concluída (UPDATE) e Excluir tarefa (DELETE)

## 1. Objetivo
Completar a UI do gerenciador de tarefas (`src/frontend/public/`) para permitir que o usuário
marque/desmarque uma tarefa como concluída e exclua uma tarefa, entregando o Trabalho Final 04.

## 2. Contexto / Motivação (Why)
Enunciado oficial em `aulas/04/README.md`. O CRUD de tarefas já lista e cria; faltam UPDATE
(`is_done`) e DELETE na interface. Backend (`UpdateTaskController`, `DeleteTaskController`,
rotas `PUT`/`DELETE /users/{idUser}/tasks/{id}`) e a camada `js/api` (`taskUpdateApi.js`,
`taskDeleteApi.js`) e `js/listeners` (`taskToggleHandler.js`, `taskDeleteHandler.js`) **já
existem e já estão corretos** — checagem feita lendo os arquivos antes desta spec. O único
código pendente está em `taskRender.js`, hoje comentado com `// TODO (TF)`.

## 3. Escopo

### Dentro do escopo
- Descomentar e ligar em `taskRender.js`: checkbox (`change` → `taskToggleHandler`) e botão
  "Excluir" (`click` → `taskDeleteHandler`), incluindo os 2 imports no topo do arquivo.
- Confirmar visualmente que marcar a tarefa aplica `strikethrough`/`text-muted` e que excluir
  pede confirmação (`confirm`) antes de chamar a API.
- Validar end-to-end no navegador (listar, criar, marcar/desmarcar, excluir) sem regressão.

### Dentro do escopo (correção pós-checkpoint)
- `taskDeleteHandler.js`: adicionar `confirm()` antes de chamar a API (RF5) e um `alert()` de
  erro no `catch` (hoje só loga no console — a regra "Trate erros com mensagens ao usuário" do
  enunciado se aplica a ele também). Achado durante o Plan, revisando o handler com mais
  atenção: ele chama a API direto, sem confirmação — diferente do que eu tinha registrado na
  primeira leitura da spec.

### Fora do escopo (NÃO fazer)
- Alterar `taskToggleHandler.js`, `taskUpdateApi.js`, `taskDeleteApi.js` ou qualquer
  rota/controller do backend — já funcionam.
- Adicionar frameworks, libs de UI ou abstrações novas.
- Qualquer refatoração fora de `taskRender.js`/`taskDeleteHandler.js` não exigida pelo enunciado.

## 4. Requisitos funcionais
- RF1: Cada item de tarefa exibe um checkbox antes do nome, refletindo `task.is_done`.
- RF2: Marcar/desmarcar o checkbox dispara `PUT /users/{idUser}/tasks/{id}` com
  `{ is_done: boolean }` e re-renderiza a lista.
- RF3: Tarefa concluída aparece com texto tachado (`text-decoration-line-through`) e
  esmaecido (`text-muted`).
- RF4: Cada item exibe um botão "Excluir".
- RF5: Clicar em "Excluir" pede confirmação via `confirm()`; só prossegue se confirmado (o
  enunciado usa `alert` genericamente, mas o `confirm()` nativo é o correto para "confirmar
  antes de deletar" — `alert()` não tem opção de cancelar).
- RF6: Confirmando, dispara `DELETE /users/{idUser}/tasks/{id}` e recarrega a lista.

## 5. Requisitos não-funcionais / Restrições
- Sem frameworks além do já usado no projeto (JS vanilla + Bootstrap classes já presentes).
- Seguir o padrão de pastas existente (`js/api`, `js/listeners`, `js/render`).
- Erros de rede/API devem mostrar mensagem ao usuário (`alert`) e logar no console — já é o
  comportamento de `taskToggleHandler.js`; `taskDeleteHandler.js` hoje só loga no console sem
  alertar o usuário (gap pré-existente, fora do escopo desta spec — não faz parte dos arquivos
  a mexer segundo o enunciado).
- Não pode quebrar listagem nem criação de tarefas.

## 6. Critérios de aceitação (verificáveis)
- [ ] CA1: Ao abrir a lista de tarefas, cada item mostra um checkbox com o estado correto de
      `is_done`.
- [ ] CA2: Marcar o checkbox de uma tarefa pendente chama a API PUT, a tarefa passa a aparecer
      tachada, e o estado persiste após reload da página (F5).
- [ ] CA3: Desmarcar uma tarefa concluída reverte o strikethrough e persiste após reload.
- [ ] CA4: Cada item mostra o botão "Excluir".
- [ ] CA5: Clicar em "Excluir" e cancelar o `confirm()` não remove a tarefa nem chama a API.
- [ ] CA6: Clicar em "Excluir" e confirmar remove a tarefa da lista (via DELETE + reload) e ela
      não reaparece após reload da página.
- [ ] CA7: Listar e criar tarefas continuam funcionando sem erros no console.

## 7. Riscos e questões em aberto
- O enunciado diz "usar `alert`" para confirmar exclusão; `alert()` não bloqueia/cancela nada
  (só ok). Vou usar `confirm()`, que é o padrão nativo correto para essa finalidade — mais
  alinhado ao objetivo pedido ("confirmar antes de deletar") do que uma leitura literal do
  enunciado. Sinalizado aqui para aprovação.
