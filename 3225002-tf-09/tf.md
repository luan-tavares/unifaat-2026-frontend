# TF-09 — React: Referências e Efeitos

Nome: José Henrique Teixeira Luiz
RA: 3225002
GitHub: https://github.com/zzin742

## Como rodar

Backend do curso, na raiz do repositório:

```sh
docker compose up -d --build
docker compose run --rm nodecommand-container migrate
docker compose run --rm nodecommand-container seed
```

App:

```sh
cd app
npm install
npm run dev
```

O app abre em `http://localhost:5173`, que é uma das origens liberadas no
CORS do backend. Verificação de tipos: `npx tsc --noEmit` dentro de `app/`.

## Estrutura

```
app/src/
  tipos.ts                   User, Task, PaginatedResponse<T>
  api/clientApi.ts           axios.create com a baseURL
  hooks/useAxios.ts          o custom hook
  App.tsx                    dono do usuário escolhido
  components/
    UserList.tsx             lista paginada
    UserTasks.tsx            tasks, filtro, marcar como feita
```

## O hook

`useAxios<T>(url: string | null)` devolve `{ data, error, isLoading, refetch }`.

Três decisões dentro dele valem explicação.

**`refetch` muda um contador, não chama a função direto.** O hook guarda
`attempt` em estado, e ele está nas dependências ao lado de `url`. O
`refetch` só faz `setAttempt(atual => atual + 1)`; quem refaz o trabalho
é o efeito. Isso mantém as dependências **só primitivas** — um objeto ou
uma função criada no corpo do componente faria o efeito rodar a cada
render.

**A limpeza aborta a requisição anterior.** `AbortController` criado no
efeito, `signal` passado ao Axios, `controller.abort()` no retorno. Sem
isso, trocar de usuário rápido mostra as tasks do usuário anterior: a
ordem de chegada das respostas não segue a ordem dos pedidos, e a
resposta velha sobrescreve a nova.

**Cancelamento não vira erro na tela.** No `catch`, `isCancel(err)`
retorna cedo. Foi o próprio app que abortou ao trocar de usuário —
mostrar isso faria a navegação rápida parecer falha.

Com `url === null` o hook fica parado. É como o componente diz "ainda
não há nada para buscar" sem precisar de um `if` antes da chamada do
hook, que quebraria a ordem dos hooks.

## Os dois `useRef`

**O campo de filtro** (`useRef<HTMLInputElement>(null)`): foco automático
num efeito com `[]`, e o botão "Limpar" apaga o texto e devolve o foco no
handler.

**O contador de bastidor** (`useRef<number>(0)`): quantas respostas de
tasks chegaram. Em `ref` porque alterá-lo **não deve redesenhar a tela** —
em estado, cada resposta forçaria um render a mais sem nada novo para
mostrar. Aparece só no botão "Mostrar", pelo `console.log`. Os dois são
lidos e alterados apenas em handlers e efeitos, nunca durante a
renderização.

## Dois detalhes que não são óbvios

**`key={escolhido.id}` no `UserTasks`.** Trocar de usuário remonta o
componente, então o filtro e o contador de bastidor começam limpos em vez
de carregarem o do usuário anterior. A limpeza do efeito já impede a
resposta velha de aparecer; a `key` resolve o estado local.

**`useCallback` no `onTotal`.** Essa função entra nas dependências de um
efeito dentro do `UserTasks`. Recriada a cada render do `App`, o efeito
lá rodaria sempre.

## Restrições do enunciado

- Sem `fetch`, sem React Query, sem SWR — só Axios, sempre pelo `clientApi`
- Nenhuma função `async` passada ao `useEffect`: declarada dentro e chamada
- TypeScript `strict` — **o template do Vite não traz `strict` ligado**,
  então foi acrescentado em `tsconfig.app.json` e `tsconfig.node.json`
- Sem `any`, `type Props` em cada componente, generics explícitos
- Só `const`; nenhum `let`
- Sem `else` / `else if` — saída cedo e operador ternário
- `key` pelo `id`, nunca pelo índice
- O PUT acontece em handler, nunca em efeito, e chama `refetch()` ao terminar
