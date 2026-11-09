# TF-09 · Usuários e tarefas

Aplicação React + TypeScript para consultar usuários e as tarefas de cada um
na API do curso. O projeto usa Axios por meio de `src/api/clientApi.ts` e o
hook `src/hooks/useAxios.ts` para carregar dados com cancelamento de requisições.

## Pré-requisitos

- Node.js e npm
- Backend do curso disponível em `http://localhost:8080`

Na raiz do repositório, inicie e prepare o backend:

```sh
docker compose up -d --build
docker compose run --rm nodecommand-container migrate
docker compose run --rm nodecommand-container seed
```

## Executar

Na pasta `2325096-tf-09/app`:

```sh
npm install
npm run dev
```

Abra `http://localhost:5173`. Essa porta é liberada pelo CORS do backend.

## Verificar

```sh
npx tsc --noEmit
npm run build
```

O app lista usuários em páginas de cinco itens. Ao selecionar uma pessoa,
mostra até vinte tarefas, permite filtrá-las localmente e alternar o estado de
conclusão. As respostas e erros da API são apresentados na própria tela.
