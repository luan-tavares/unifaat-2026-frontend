# Unifaat :: Frontend :: 2026.2

Repositório centralizado para todas as aulas do bimestre de Frontend. Aqui você encontra os slides, briefings e os projetos compartilhados de cada bimestre.

---

## 📚 Aulas do Bimestre

| Aula | Material |
|------|----------|
| **Aula 01** - Servidor de Arquivos Estáticos e DOM | [Acesso](./aulas/01/README.md) |
| **Aula 02** - CSS, Seletores e JS Reativo | [Acesso](./aulas/02/README.md) |
| **Aula 03** - Vite, Forms e Listeners | [Acesso](./aulas/03/README.md) |
| **Aula 04** - Navegadores Web e API | [Acesso](./aulas/04/README.md) |
| **Aula 05** - Pré Compiladores e Typescript | [Acesso](./aulas/05/README.md) |

---

## Estrutura do Repositório

```
.
├── src/                      # Projeto compartilhado - Bimestre 01 (usado em TODAS as aulas)
│   ├── backend/              # API Node.js (Express-like)
│   ├── frontend/             # Aplicação Vue 3 com Vite
│   ├── docker/               # Configurações Docker
│   ├── package.json
│   └── readme.md             # Documentação detalhada do projeto
│
├── aulas/                     # Materiais de todas as aulas
│   └── 04/                    # Aula 04 - Navegadores Web e API
│       ├── slide/             # Slides em PDF
│       └── briefing.md        # Briefing da aula
│
├── docker/                    # Dockerfiles (raiz)
├── docker-compose.yml         # Orquestração dos containers
├── .env                       # Variáveis de ambiente (raiz)
├── .env.example               # Template de .env
├── .env.docker                # Variáveis do Docker
├── package.json               # Scripts auxiliares (raiz)
└── README.md                  # Este arquivo
```

---

## Como Usar

### 1. Clonar o Repositório

```sh
git clone https://github.com/luan-tavares/unifaat-2026-frontend.git
cd unifaat-2026-frontend
```

### 2. Configurar Variáveis de Ambiente

```sh
cp .env.example .env
```

Edite o `.env` na **raiz** e preencha as variáveis vazias:

```env
POSTGRES_HOST=postgres_host
POSTGRES_DB=unifaat
POSTGRES_PORT=6789
POSTGRES_USER=aluno                    # ← PREENCHER
POSTGRES_PASSWORD=123456               # ← PREENCHER
NODE_WEB_PORT=3000
JWT_SECRET=seu_segredo_super_seguro    # ← PREENCHER (mude em produção!)
```

### 3. Instalar dependências

```sh
npm i
```

### 4. Subir a aplicação com Docker

```sh
docker compose up --build
```

Aguarde até ver as mensagens:
- `Servidor node web rodando na porta 3000` ✅
- `VITE v8.3.0  ready in XXX ms` ✅

### 5. Em outro terminal, executar Migrations e Seeds

```sh
npm run migrate
npm run seed
```

Você verá:
```
✓ Executada: 001_create_users_table.js
✓ Executada: 002_create_tasks_table.js
✓ Usuários criados
✓ Tarefas criadas
```

Pronto! A aplicação está completamente configurada e rodando.

---

## Acessar os Materiais das Aulas

Com o Docker em execução, você pode visualizar todos os slides e materiais das aulas em:

**`http://localhost:8080/aulas/`**

Você encontrará uma página com todas as aulas disponíveis, seus slides em PDF, briefings e materiais de apoio organizados de forma amigável para navegação.

---

## Como Fazer o Trabalho Final (TF)

**IMPORTANTE:** Para acessar a descrição completa do Trabalho Final (TF), você **DEVE**:

1. Entrar no diretório da aula em questão
   - Exemplo: `aulas/04/`
   
2. Abrir o arquivo **`README.md`** lá
   - Ele contém:
     - Descrição detalhada do TF
     - Arquivos que você precisa editar
     - Como rodar localmente
     - **Link para enviar sua solução**

**Prazo Aula 04 - Navegadores Web e API:** 21/09/2026T23:59:59

**Não confunda:** Este README aqui é para setup geral. O README dentro de cada aula (`aulas/04/README.md`, etc) é que tem a descrição do TF específico.

---

## Acessar a Aplicação

Com o Docker rodando, você pode acessar:

| Recurso | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | `http://localhost:8080` | Aplicação Vue.js |
| **Vite Dev (HMR)** | `http://localhost:5172` | Frontend em desenvolvimento com hot reload |
| **Aulas e Materiais** | `http://localhost:8080/aulas/` | Todos os slides e materiais das aulas |
| **API Docs** | `http://localhost:3000/docs` | Documentação Swagger da API |

---

## Projeto Compartilhado do Bimestre 01 (src/)

O `src/` é o projeto base do **primeiro bimestre** que evolui ao longo das aulas. Ele contém:

- **Backend**: API Node.js com Express, PostgreSQL
- **Frontend**: Aplicação Vue 3 com Vite
- **Docker**: Stack completo com NGINX, Node.js, PostgreSQL e Vite HMR

**Acesso às aplicações:**
- Frontend estático: `http://localhost:8080`
- Vite Dev (HMR): `http://localhost:5172`
- API Node.js: `http://localhost:3000` (interno)
- PostgreSQL: `localhost:6789`

---

## Containers Docker

### Containers de Infraestrutura

| Container               | Imagem Base          | Função                                                      | Porta Interna |
|-------------------------|-----------------------|--------------------------------------------------------------|---------------|
| `nginx-container`       | `nginx:1.25-alpine`  | Servir arquivos estáticos HTTP (reverse proxy).               | 80            |
| `nodeweb-container`     | `node:25`             | Rodar a API/aplicação Node (servida via `nodemon _web.js`).   | 3000          |
| `nodecommand-container` | `node:25`             | Rodar comandos CLI avulsos (`migrate`, `seed`) via `_command.js`. | —          |
| `nodevitehmr-container` | `node:25`             | Servir o frontend via Vite HMR                                | 5172          |
| `nodevitecompiler-container` | `node:24`        | Pré-compilar o frontend (`vite build --watch`): TypeScript, Bootstrap, Axios e FontAwesome viram JS/CSS puro em `public/`. | —          |
| `postgres-container`    | `postgres:18`         | Banco de dados PostgreSQL da aplicação.                       | 5432          |

### Volumes Persistentes

| Volume                              | Utilizado por             | Finalidade                                                              |
|--------------------------------------|---------------------------|--------------------------------------------------------------------------|
| `public-volume:/var/www`            | `nginx-container`         | Disponibilizar os arquivos estáticos compilados do frontend (`public/`).  |
| `./aulas:/var/www/aulas`            | `nginx-container`         | Disponibilizar materiais das aulas (slides, PDFs, etc).                 |
| `./src/logs/nginx:/var/log/nginx`   | `nginx-container`         | Persistir os logs do NGINX fora do container.                            |
| `./src/backend:/app/backend`        | `nodeweb-container`       | Disponibilizar o código do backend dentro do container.                  |
| `./src/_web.js:/app/_web.js`        | `nodeweb-container`       | Arquivo de entrada da aplicação web.                                     |
| `public-volume:/app/frontend/public`| `nodeweb-container`       | Ler os arquivos compilados do frontend (mesmo volume do NGINX).          |
| `./src/_command.js:/app/_command.js`| `nodecommand-container`   | Arquivo de entrada dos comandos CLI.                                     |
| `./src/frontend:/app/frontend`      | `nodevitehmr-container`   | Disponibilizar o código frontend para Vite.                              |
| `./src/frontend/resources:/app/resources` | `nodevitecompiler-container` | Código-fonte que o Vite observa e compila (`vite build --watch`). |
| `public-volume:/app/public`         | `nodevitecompiler-container` | Escrever o resultado da compilação (mesmo volume do NGINX e do Node web). |
| `nodemodules-volume:/app/node_modules` | node containers       | Isolar o `node_modules` instalado em build-time.                        |
| `postgres-volume:/var/lib/postgresql` | `postgres-container`    | Persistir os dados do banco entre reinicializações.                      |

### Redes

Todos os containers estão conectados à rede Docker personalizada `app_network`.

### Portas Expostas Externamente

| Serviço     | Porta Interna | Porta Externa | Acesso Externo        |
|-------------|---------------|---------------|-----------------------|
| NGINX       | 80            | **8080**      | http://localhost:8080 |
| VITE HMR    | 5172          | **5172**      | http://localhost:5172 |
| PostgreSQL  | 5432          | **6789**      | localhost:6789        |

---

## Comandos Comuns

```sh
# Instalar dependências
npm run i

# Subir a aplicação
docker compose up --build

# Rodar migrations pendentes
npm run migrate

# Popular banco com dados iniciais
npm run seed

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um container específico
docker compose logs nodeweb-container

# Parar containers (sem remover)
docker compose stop

# Remover containers
docker compose down

# Remover tudo (containers + volumes)
docker compose down -v

# Rodar servidor web local
npm run web

# Rodar com nodemon (desenvolvimento)
npm run dev
```

---

## Dicas Úteis

- Sempre faça as alterações em `src/` — é o projeto compartilhado
- Cada aula tem seus próprios tópicos listados em `aulas/[numero]/briefing.md`
- Os slides estão em PDF em `aulas/[numero]/slide/`
- Mantenha o `.env` atualizado e **nunca** commite variáveis sensíveis
- Todos os comandos npm rodam da raiz do repositório
- Para editar código do backend, modifique em `src/backend/`
- Para editar código do frontend, modifique em `src/frontend/public/`

---

## Referências

- [Documentação completa do Projeto (src/)](./src/readme.md)
- [Briefing Aula 04](./aulas/04/briefing.md)

---

Desenvolvido por **Luan Tavares** para UNIFAAT
