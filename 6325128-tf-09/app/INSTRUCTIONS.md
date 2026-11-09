# Gerenciador de Usuários e Tasks

Este projeto foi desenvolvido conforme as especificações do Trabalho Final, utilizando React, TypeScript, Vite e Axios.

## Estrutura do Projeto

```
app/
├── src/
│   ├── api/
│   │   └── clientApi.ts          # Cliente Axios configurado
│   ├── components/
│   │   ├── UserList.tsx          # Lista paginada de usuários
│   │   └── UserTasks.tsx         # Tasks do usuário selecionado
│   ├── hooks/
│   │   └── useAxios.ts           # Custom hook para requisições
│   ├── types.ts                  # Interfaces TypeScript
│   ├── App.tsx                   # Componente principal
│   ├── App.css                   # Estilos
│   └── main.tsx                  # Entry point
└── package.json
```

## Funcionalidades Implementadas

### ✅ Custom Hook useAxios
- Gerencia estados de `data`, `error` e `isLoading`
- Usa `useEffect` com dependências primitivas `[url, attempt]`
- Implementa `AbortController` para cancelamento de requisições
- Ignora erros de cancelamento (não exibe na tela)
- Método `refetch()` para recarregar dados

### ✅ UserList (Lista de Usuários)
- Paginação com 5 usuários por página
- Botões "Anterior" e "Próxima" (desabilitado quando `next === null`)
- Seleção de usuário por clique
- Estados de loading e erro com botão "Tentar de novo"

### ✅ UserTasks (Tasks do Usuário)
- Lista tasks do usuário selecionado (até 20)
- **key={user.id}** para garantir limpeza ao trocar usuário
- Toggle do status `is_done` com PUT na API
- Estado `isSaving` durante salvamento
- Tratamento de erro no PUT

### ✅ Filtro Local (useRef)
- Campo de texto com `useRef<HTMLInputElement>`
- Foco automático ao montar (useEffect com [])
- Botão "Limpar" que apaga o texto e retorna o foco
- Filtragem local sem chamar a API

### ✅ useRef Não-Renderizável
- Contador de respostas em `useRef<number>`
- Incrementado quando `data` chega
- Exibido via console.log no botão "Mostrar contador"

### ✅ Sincronização do Título da Aba
- `document.title` mostra: `{Nome} · {N} tasks`
- Volta ao título padrão quando nenhum usuário está selecionado
- Implementado com useEffect e cleanup

### ✅ Regras de Código
- TypeScript em modo strict
- Sem `any`, tudo tipado
- Tipos explícitos: `Props`, generics, etc.
- Apenas `const` (sem `let`)
- Estados booleanos com prefixo `is`
- Imutabilidade preservada
- `useEffect` com dependências corretas e cleanup
- `ref.current` usado apenas em handlers e efeitos
- `key` estável (id, não índice)
- Early return (sem else)

## Como Executar

### Pré-requisitos
1. Backend rodando em `http://localhost:8080`
2. Node.js instalado

### Instalação
```bash
cd app
npm install
```

### Desenvolvimento
```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Build
```bash
npm run build
```

## Testando Funcionalidades

### Teste de Erro
1. Pare o backend: `docker compose stop`
2. Clique em um usuário
3. Você verá a mensagem de erro com botão "Tentar de novo"

### Teste de Cancelamento
1. Clique rapidamente em vários usuários diferentes
2. O useEffect cancela requisições anteriores
3. Apenas a última resposta será exibida

### Teste do Filtro
1. Selecione um usuário com várias tasks
2. Digite no campo de filtro
3. A lista filtra localmente (sem chamar API)
4. Clique "Limpar" e o foco volta ao campo

### Teste do Contador
1. Clique em vários usuários
2. Clique no botão "Mostrar contador"
3. Veja no console quantas respostas foram recebidas

### Teste do Título
1. Selecione um usuário
2. Veja o título da aba mudando
3. Feche o navegador e note que o título volta ao padrão

## API Endpoints Usados

- `GET /users?page={page}&limit=5` - Lista usuários paginada
- `GET /users/{id}/tasks?page=1&limit=20` - Tasks do usuário
- `PUT /users/{id}/tasks/{taskId}` - Atualiza status da task

## Tecnologias

- React 19.3
- TypeScript 7.0 (strict mode)
- Vite 8.3
- Axios 1.7
- AbortController para cancelamento
