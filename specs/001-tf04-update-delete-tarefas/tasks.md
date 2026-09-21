# TASKS: TF 04 — UPDATE/DELETE de tarefas

- [ ] T1: Editar `taskRender.js` — descomentar imports, checkbox e botão excluir; remover
      comentários `// TODO (TF)` remanescentes.
      Verificável: arquivo sem blocos `/* */` residuais, sem `// TODO (TF)`.
- [ ] T2: Editar `taskDeleteHandler.js` — adicionar `confirm()` de guarda e `alert()` no catch.
      Verificável: função recusa prosseguir se `confirm()` retornar `false`.
- [ ] T3: Validar no navegador (app já rodando em `http://localhost:8081`):
      - Listar tarefas mostra checkbox + botão Excluir em cada item (CA1, CA4).
      - Marcar/desmarcar aplica strikethrough e persiste após F5 (CA2, CA3).
      - Excluir com cancelar não remove nada (CA5); excluir confirmando remove e não reaparece
        após F5 (CA6).
      - Criar/listar continuam sem erro no console (CA7).
