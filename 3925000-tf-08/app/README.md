# TF-08 — To-do com React + TypeScript

## Executar

```bash
npm install
npm run dev
```

## Verificar TypeScript

```bash
npx tsc --noEmit
```

## Regras atendidas

- Estado de tasks e filtro centralizado no `App`.
- Componentes `TaskForm`, `TaskList` e `TaskItem` separados.
- Props e callbacks tipados, sem `any`.
- `useState<Task[]>([])` e filtro como união `Filter`.
- Campo controlado, inclusão, conclusão, exclusão e filtros.
- Contador derivado diretamente de `tasks`.
- Lista vazia exibe `Nenhuma task`.
- Atualizações imutáveis com `map`, `filter` e spread.
- Nenhum `useEffect` ou `useRef`.
