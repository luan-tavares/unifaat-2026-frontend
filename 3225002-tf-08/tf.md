# TF-08 — React: Gerenciamento de Estados

Nome: José Henrique Teixeira Luiz
RA: 3225002
GitHub: https://github.com/zzin742

## Como rodar

```bash
cd app
npm install
npm run dev
```

Verificação de tipos: `npx tsc --noEmit` dentro de `app/`.

## O que o app faz

| Requisito | Onde |
|---|---|
| Adicionar por campo controlado; nome vazio não adiciona | `TaskForm.tsx` |
| Marcar/desmarcar ao clicar na task | `TaskItem.tsx` → `handleToggle` do `App` |
| Excluir | `TaskItem.tsx` → `handleDelete` do `App` |
| Filtrar por Todas / Pendentes / Feitas | `App.tsx`, estado `Filter` |
| Contador "N pendente(s)" derivado da lista | `App.tsx`, sem estado próprio |
| "Nenhuma task" com a lista filtrada vazia | `TaskList.tsx` |

## Estrutura

```
app/src/
  tipos.ts                 Task e Filter
  App.tsx                  dono do estado
  components/
    TaskForm.tsx           campo controlado
    TaskList.tsx           lista filtrada e o estado vazio
    TaskItem.tsx           uma linha
```

O `App` é o único dono do estado. Os filhos recebem dados por props e
avisam por callback — nenhum deles guarda cópia do que o pai já sabe. A
exceção é o texto em digitação, que é estado do `TaskForm` porque mais
ninguém precisa dele.

## Três decisões que valem explicação

**Filtro como `Record`, não como cadeia de `if`.**

```ts
const PASSA_NO_FILTRO: Record<Filter, (task: Task) => boolean> = {
  all: () => true,
  pending: (task) => !task.isDone,
  done: (task) => task.isDone,
};
```

Se amanhã entrar um quarto valor em `Filter`, o compilador exige a
entrada no `Record`. Numa cadeia de `if`, o caso novo cairia em silêncio
no último ramo.

**`key` é o id, nunca o índice.** Com índice, excluir a primeira task
faria o React reaproveitar o estado interno da linha errada para todas
as de baixo — o conteúdo parece certo e o comportamento não é.

**Excluir para a propagação do clique.** O botão fica dentro da área
clicável que alterna a task. Sem `stopPropagation`, excluir também
alternaria no caminho.

## Contador derivado

```tsx
const pendentes = tasks.filter(PASSA_NO_FILTRO.pending).length;
```

Calculado a cada desenho, sem segundo `useState`. Guardar a contagem em
estado criaria duas verdades para o mesmo fato, e uma delas ficaria
velha na primeira vez que alguém esquecesse de atualizar.

## Restrições do enunciado

- Sem `useEffect` e sem `useRef`
- Sem biblioteca além do que o Vite gera
- TypeScript `strict` — **o template do Vite não traz `strict` ligado**,
  então ele foi acrescentado em `tsconfig.app.json` e `tsconfig.node.json`
- Sem `any`, `type Props` em cada componente, `useState<Task[]>([])`
- Só `const`; nenhum `let`
- Sem `else` / `else if` (saída cedo e operador ternário)
- Imutabilidade: `[...atuais, nova]`, `map`, `filter`
- `setTasks(atuais => ...)` sempre que o novo valor depende do anterior
