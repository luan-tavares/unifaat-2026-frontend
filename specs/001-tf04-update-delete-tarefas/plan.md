# PLAN: TF 04 — UPDATE/DELETE de tarefas

## Arquivos afetados
1. `src/frontend/public/js/render/taskRender.js`
2. `src/frontend/public/js/listeners/taskDeleteHandler.js`

Nenhum outro arquivo do projeto é tocado (backend, `js/api`, `taskToggleHandler.js` e
`tasksListRender.js` já atendem o contrato — confirmado por leitura direta na fase Specify).

## Mudanças técnicas

### 1. `taskRender.js`
- Descomentar as linhas 2-3 (imports de `taskToggleHandler` e `taskDeleteHandler`).
- Descomentar o bloco do checkbox (linhas 18-29): cria `<input type="checkbox">`, seta
  `checked = task.is_done`, liga `change → taskToggleHandler`, faz `prepend` no `<li>`, e
  aplica `text-decoration-line-through text-muted` no nome se `task.is_done`.
- Descomentar o bloco do botão (linhas 32-38): cria `<button class="btn btn-danger btn-sm">`,
  texto "Excluir", liga `click → taskDeleteHandler`, `append` no `<li>`.
- Remover os comentários `// TODO (TF)` que ficam órfãos depois de descomentado.

### 2. `taskDeleteHandler.js`
Adicionar confirmação e feedback de erro, mantendo o restante do fluxo igual:
```js
export default async function taskDeleteHandler(event) {
    const liElement = event.target.closest("li");
    const idUser = liElement.userId;
    const taskId = liElement.taskId;

    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

    try {
        await taskDeleteApi(idUser, taskId);
        await tasksListRender(idUser);
    } catch (error) {
        alert("Erro ao excluir tarefa");
        console.error(error);
    }
}
```
Mesmo padrão de try/catch + alert já usado em `taskToggleHandler.js` — mantém consistência.

## Decisões
- `confirm()` em vez de `alert()` puro, pela razão já registrada na spec (RF5/seção 7).
- Nenhuma mudança de CSS/classe além das que já vêm comentadas no próprio arquivo — o enunciado
  e o código existente já resolveram o "como" visual (Bootstrap classes já usadas no resto do
  projeto: `btn btn-danger btn-sm`, `form-check-input`, `text-decoration-line-through`).

## Riscos
- Baixíssimo: mudança pequena, isolada, em código que segue exatamente o padrão de arquivos
  irmãos já funcionando (`taskToggleHandler.js` como referência para o catch do delete).
