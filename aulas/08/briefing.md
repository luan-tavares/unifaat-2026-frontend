Briefing para produção audiovisual e de conteúdo
Aula Completa
2026.2



Professor: Luan Tavares Lourenço
Disciplina: Frontend


Aula:
1☐ 2☐ 3☐ 4☐ 5☐ 6☐ 7☐ 8☒ 9☐ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐


Título da aula:

React: Gerenciamento de Estados


Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução

Até a Aula 07 o frontend do curso foi construído "na mão": o JavaScript procura elementos no DOM, escuta eventos, altera `innerText`, cria e remove nós. Funciona, e foi importante para entender o que o navegador faz de verdade. O problema aparece quando a tela cresce: cada pedaço de informação passa a morar em vários lugares ao mesmo tempo (numa variável, no DOM, num atributo, no `localStorage`), e o programador vira o responsável por manter todos eles sincronizados. É nesse ponto que entra o React.

Esta aula apresenta o React por um caminho incomum: ela começa **por baixo**, na memória. Antes de falar de componente, falamos de call stack, heap, tipos primitivos e tipos de referência, porque o comportamento do React (por que ele exige `setEstado`, por que proíbe alterar um array no lugar, por que compara valores por referência) é consequência direta de como a memória funciona. Quem entende a memória entende o React sem decorar regras.

Depois disso a aula apresenta o React, o que ele resolve e a proposta dele; as extensões `.jsx` e `.tsx` (usaremos `.tsx`, já que temos TypeScript); a anatomia de um componente (parâmetros, código e `return`); e como instalar tudo, incluindo os tipos do React e o `tsconfig`. Em seguida vem o centro da aula: **estado**. Começamos pelo conceito zero da computação, a máquina de Alan Turing, para entender o que é estado de verdade antes de ver o `useState`. Fechamos com os generics aplicados a componentes e com exemplos em que parâmetros e estados, juntos, fazem todo o código do componente rodar.

A aula é conduzida com explicações animadas em passos (passo 1, 2, 3), mostrando na própria tela o que acontece na memória e no ciclo do componente. Dois pontos ficam **de fora de propósito** e são o tema da próxima aula: **referências** (`useRef`) e **efeitos** (`useEffect`). Eles só fazem sentido depois que o estado estiver sólido.

2 - Memória: Heap, Call Stack e os Tipos do JavaScript

2.1 - Todo Programa Precisa de Memória

Quando um programa JavaScript roda, as variáveis, os objetos e as funções precisam existir em algum lugar: na memória RAM. O motor do JavaScript (o V8, no Chrome e no Node) organiza essa memória em duas regiões que a gente precisa conhecer: a **call stack** (pilha de chamadas) e o **heap**. A explicação abaixo é um **modelo mental**: o V8 faz otimizações que mudam detalhes internos, mas o modelo explica corretamente todo o comportamento que um programador observa.

2.2 - Call Stack: a Pilha de Chamadas

A call stack é a região organizada da memória, que funciona como uma pilha de pratos (**LIFO**: o último a entrar é o primeiro a sair). Toda vez que uma função é chamada, o motor empilha um **frame** (quadro) contendo os parâmetros recebidos e as variáveis locais daquela chamada. Quando a função retorna, o frame é desempilhado e **tudo o que havia nele deixa de existir**.

```javascript
function dobro(n) {
    const resultado = n * 2
    return resultado
}

function principal() {
    const x = 10
    const y = dobro(x)
    console.log(y)
}

principal()
```

O passo a passo, do ponto de vista da pilha:

1. `principal()` é chamada: frame de `principal` entra na pilha, com `x` e `y`;
2. `x = 10` é gravado no frame de `principal`;
3. `dobro(x)` é chamada: frame de `dobro` entra por cima, com `n = 10` e `resultado`;
4. `dobro` retorna `20`: o frame de `dobro` é descartado, e `n` e `resultado` somem;
5. `y = 20` é gravado no frame de `principal`;
6. `principal` termina: o frame dela é descartado, e a pilha fica vazia.

Duas consequências importantes. A primeira: a pilha tem tamanho limitado, e uma recursão sem fim estoura esse limite (o famoso **stack overflow**). A segunda, que vai voltar com força no React: **variáveis locais de uma função morrem quando ela termina**. Cada nova chamada começa com frame novo, sem lembrar nada da chamada anterior.

2.3 - Heap: a Região Dinâmica

O heap é uma região grande e sem a organização da pilha. É onde vivem os valores que **não cabem na regra "nasce e morre junto com a função"**: objetos, arrays e funções. Um objeto criado dentro de uma função pode continuar existindo depois que ela retorna, desde que alguém ainda aponte para ele. Quando **nenhuma variável alcança mais** o objeto, o **garbage collector** (coletor de lixo) libera aquele espaço.

```javascript
function createTask() {
    const task = { name: "Estudar React", is_done: false }
    return task
}

const mine = createTask()
console.log(mine.name)
```

O frame de `createTask` foi descartado no `return`, mas o objeto `{ name, is_done }` continua vivo no heap, porque `mine` ainda aponta para ele.

2.4 - Primitivos x Referências

É aqui que as duas regiões se ligam aos tipos do JavaScript:

| Categoria | Tipos | O que a variável guarda |
|---|---|---|
| **Primitivos** | `number`, `string`, `boolean`, `null`, `undefined`, `bigint`, `symbol` | o **próprio valor** (imutável) |
| **Referência** | objetos, arrays, funções (e tudo que deriva deles) | um **endereço** que aponta para o objeto no heap |

Na variável de um tipo primitivo mora o valor. Na variável de um tipo de referência mora apenas um **endereço**; o objeto de verdade está no heap. Veja a diferença na cópia:

```javascript
let idade = 20
let copia = idade
copia = 21

console.log(idade)  // 20 — copiou o VALOR; as duas variáveis são independentes
console.log(copia)  // 21
```

```javascript
const a = { nome: "Ana" }
const b = a
b.nome = "Bia"

console.log(a.nome)  // "Bia" — copiou o ENDEREÇO; a e b apontam para o MESMO objeto
console.log(a === b) // true
```

Em `const b = a` ninguém copiou o objeto: foi copiado o endereço. Existe **um** objeto no heap e **duas** variáveis apontando para ele. Alterar por `b` altera o que `a` enxerga.

2.5 - Comparar e Alterar: o Que o React Vai Cobrar de Nós

Os operadores `===` e `Object.is` comparam o **conteúdo da variável**: o valor, nos primitivos, e o endereço, nas referências. Por isso:

```javascript
console.log(5 === 5)                       // true  — mesmo valor
console.log("oi" === "oi")                 // true  — mesmo valor
console.log({ n: 1 } === { n: 1 })         // false — dois objetos, dois endereços
console.log([1, 2] === [1, 2])             // false — dois arrays, dois endereços
```

E para "alterar" um objeto sem mexer no original, criamos um **novo objeto** (novo endereço) copiando o conteúdo com o operador spread:

```javascript
const task = { name: "Estudar", is_done: false }
const atualizada = { ...task, is_done: true }

console.log(task.is_done)         // false — o original ficou intacto
console.log(atualizada.is_done)     // true
console.log(task === atualizada)    // false — endereços diferentes
```

Com arrays é igual: `[...lista, novo]` cria um array novo, e `lista.map(...)` e `lista.filter(...)` também devolvem arrays novos. Já `lista.push(novo)` altera o array **no lugar**, sem mudar o endereço. Essa distinção (alterar no lugar x criar um novo) é exatamente o que decide se o React percebe uma mudança. Guarde essa ideia: ela volta na seção de estado.

3 - Apresentando o React

3.1 - Por Que Organizar um Frontend É Mais Difícil Que um Backend

Um controller de backend tem um ciclo curto e previsível: chega uma requisição, o código lê dados, monta a resposta e **termina**. Cada requisição começa do zero, com o frame limpo da pilha. O estado de longa duração mora fora do código, no banco.

O frontend é o oposto: é um processo **vivo e longo**. A página fica aberta por minutos ou horas, e durante esse tempo:

- o usuário gera eventos em qualquer ordem (clique, digitação, scroll, tecla, redimensionar);
- dados chegam do servidor a qualquer momento, e depois de requisições feitas em momentos diferentes;
- a mesma informação aparece em vários lugares da tela (o nome do usuário no cabeçalho, no perfil e numa lista);
- **a fonte da verdade está espalhada**: um valor numa variável JavaScript, outro no `value` de um `input`, outro numa classe CSS, outro no `localStorage`.

O resultado é o mesmo que a gente sentiu nas aulas anteriores: quanto mais a tela cresce, mais difícil lembrar de "atualizar tudo que depende disso". Esquecer um ponto gera tela incoerente: o contador mostra 3 num lugar e 2 em outro. O backend tem a vantagem de nunca precisar *manter* uma tela consistente ao longo do tempo; o frontend precisa.

3.2 - Imperativo x Declarativo

O JavaScript que escrevemos até aqui é **imperativo**: descrevemos **como** mudar a tela, passo a passo.

```javascript
let contador = 0

const botao = document.querySelector("#botao")
const saida = document.querySelector("#saida")

botao.addEventListener("click", () => {
    contador++
    saida.innerText = String(contador)
})
```

Repare que há dois lugares com o número: a variável `contador` e o texto dentro de `#saida`. O código precisa atualizar os dois, na ordem certa. Se uma segunda parte da tela também exibir o contador, é mais uma linha para lembrar.

Existe um jeito mais **antigo** de escrever, o **declarativo**: em vez de ligar o evento por código, ele é **declarado na própria tag** do HTML, no atributo `onclick`.

```html
<button onclick="somar()">
    Cliques: <span id="saida">0</span>
</button>
```

Quem dispara a ação está escrito no próprio HTML, sem `addEventListener`. Era assim antigamente, e esse estilo caiu em desuso (a recomendação passou a ser separar o HTML do JavaScript). O **React voltou com essa ideia**: no JSX, o evento volta a ser declarado na tag, com `onClick={...}`, mas agora combinado com a regra de que a tela é consequência do dado, e o React se encarrega de alterar só o que mudou.

```tsx
import { useState } from "react"

export function Contador() {
    const [contador, setContador] = useState(0)

    return (
        <button onClick={() => setContador(contador + 1)}>
            Cliques: {contador}
        </button>
    )
}
```

Só existe **uma** fonte da verdade (o `contador`). Ninguém escreve "atualize o texto do botão": a tela é **consequência** do dado.

3.3 - O Que o React Resolve

A ideia central cabe numa linha: **a interface é uma função do estado**.

```text
UI = f(estado)
```

Dado um mesmo estado, o React sempre produz a mesma tela. Quando o estado muda, o React executa a função de novo, compara a tela nova com a anterior e **altera no DOM somente o que mudou**. O programador deixa de escrever "o que fazer no DOM quando o botão for clicado" e passa a escrever "como a tela se parece para cada estado possível". É uma troca de problema: manter dezenas de pontos sincronizados vira descrever um único ponto, e a sincronização é tarefa do React.

3.4 - A Proposta: Componentes

Para manter organização em telas grandes, o React divide a interface em **componentes**: pedaços independentes e reutilizáveis, cada um responsável por uma parte da tela. Um componente é uma **função** que recebe dados de entrada (os **parâmetros**, chamados de `props`) e **retorna** a descrição da tela daquele pedaço.

A tela de tasks do nosso projeto, por exemplo, vira uma árvore de componentes:

```text
<TaskApp>                  ← a tela
  ├── <TaskForm>   ← campo de texto + botão
  └── <TaskList>
        ├── <TaskItem>
        ├── <TaskItem>
        └── <TaskItem>
```

Cada componente cuida só do que é dele, e o encaixe entre eles é feito pelos parâmetros. O mesmo `TaskItem` serve para qualquer task; só muda o dado que recebe.

4 - JSX e TSX

4.1 - O Que É JSX

O `return` de um componente parece HTML dentro do JavaScript. Não é HTML: é **JSX** (JavaScript XML), uma extensão de sintaxe que o compilador (no nosso caso o Vite) transforma em chamadas de função comuns do JavaScript. O navegador nunca vê o JSX; ele recebe o resultado já compilado.

```tsx
const name = <h1 className="destaque">Olá, React</h1>
```

vira, depois de compilado, algo equivalente a uma chamada de função que **descreve** um `h1` com a classe `destaque` e o texto `Olá, React`. O resultado dessa chamada é um objeto comum (que vive no heap, claro) e é esse objeto que o React compara e transforma em DOM de verdade.

As diferenças em relação ao HTML que mais pegam quem está começando:

- **`className`** em vez de `class` (porque `class` é palavra reservada do JavaScript);
- **`onClick`**, **`onChange`** (camelCase) em vez de `onclick`, e recebem uma **função**, não uma string;
- **chaves `{ }`** abrem uma expressão JavaScript dentro do JSX: `<p>Total: {itens.length}</p>`;
- **todo elemento precisa ser fechado**, inclusive os vazios: `<input />`, `<img />`;
- o componente retorna **um único elemento raiz** (se precisar de vários, usa-se um *fragment*: `<>` ... `</>`).

4.2 - `.jsx` x `.tsx`

A extensão do arquivo diz ao compilador o que esperar dentro dele:

| Extensão | Linguagem | JSX permitido? |
|---|---|---|
| `.js` | JavaScript | não |
| `.jsx` | JavaScript | **sim** |
| `.ts` | TypeScript | não |
| `.tsx` | TypeScript | **sim** |

Um arquivo `.ts` não aceita JSX: o `<` seria interpretado como operador de comparação ou como *type assertion*. Por isso, **qualquer arquivo que contenha JSX precisa terminar em `x`**. Como o curso usa TypeScript, **usaremos `.tsx`** para componentes, e continuamos usando `.ts` para arquivos que não têm interface (tipos, utilitários, chamadas de API).

5 - Anatomia de um Componente

5.1 - As Três Partes

Todo componente, por maior que seja, tem a mesma anatomia: **parâmetros**, **código** e **retorno**.

```tsx
type SaudacaoProps = {
    nome: string
    idade?: number
}

export function Saudacao({ nome, idade }: SaudacaoProps) {
    // 2) CÓDIGO: JavaScript/TypeScript comum, roda a cada renderização
    const rotulo = (idade ?? 0) >= 18 ? "maior de idade" : "menor de idade"

    // 3) RETORNO: o JSX que descreve a tela
    return (
        <p>
            Olá, {nome} ({rotulo})
        </p>
    )
}
```

1. **Parâmetros**: o componente recebe **um único objeto**, o `props`. Aqui o desestruturamos direto na assinatura (`{ nome, idade }`) e tipamos com o `type SaudacaoProps`. Campos opcionais usam `?`.
2. **Código**: tudo que vem antes do `return` é TypeScript comum: cálculos, `if`, funções auxiliares. É a parte que **roda de novo a cada renderização**.
3. **Retorno**: é o que **renderiza**. O JSX devolvido pelo `return` vira a tela, usando as variáveis do código acima; a cada renderização o React recebe um JSX novo.

Para usar o componente, escrevemos uma tag cujo nome é o da função (**sempre com letra maiúscula**; é assim que o React distingue `<Saudacao />` de uma tag HTML como `<section>`) e passamos os parâmetros como atributos:

```tsx
<Saudacao nome="Ana" idade={20} />
```

Texto fixo vai entre aspas; qualquer outro valor (número, booleano, variável, função, objeto) vai entre chaves.

5.2 - Props São Somente Leitura

Um componente **não pode alterar** os parâmetros que recebeu. O dado pertence ao componente de cima; o filho só **lê**. Essa regra é a mesma que vimos no heap: se o filho alterasse um objeto recebido, estaria mudando um objeto no heap que também pertence ao pai, sem o React ficar sabendo. Quando o filho precisa provocar uma mudança, ele recebe do pai uma **função** (um callback) e a chama; quem altera o dado continua sendo o dono dele.

Essa é a **inversão de controle** que já conhecemos: o pai **injeta** a função (`onToggle={toggle}`, passando a referência, sem executá-la), e a filha apenas **executa** `onToggle(task)` quando o clique acontece. A filha decide **quando** chamar; o pai decide **o que** acontece. É o mesmo mecanismo do `addEventListener` (nós entregamos a função, o navegador a chama no evento) e dos middlewares do Express. Por trás está o que vimos na memória: a função é um objeto no heap, e o que viaja pelo parâmetro é o seu endereço.

5.3 - Conteúdo Aninhado: `children`

Além dos parâmetros nomeados, todo componente recebe uma prop especial, `children`, que é o conteúdo escrito **entre a tag de abertura e a de fechamento**:

```tsx
import type { ReactNode } from "react"

type CartaoProps = {
    name: string
    children: ReactNode
}

export function Cartao({ name, children }: CartaoProps) {
    return (
        <section className="cartao">
            <h2>{name}</h2>
            {children}
        </section>
    )
}
```

```tsx
<Cartao titulo="Tasks de hoje">
    <p>Nenhuma task pendente.</p>
</Cartao>
```

`ReactNode` é o tipo do React para "qualquer coisa que o React sabe desenhar": texto, número, elemento JSX, lista deles, `null`.

5.4 - Renderização Condicional e Listas

Como o JSX só aceita **expressões** (e `if` é um comando, não uma expressão), as duas necessidades mais comuns têm idiomas próprios:

```tsx
// Condicional: o && devolve o JSX se a condição for verdadeira
{tasks.length === 0 && <p>Nenhuma task.</p>}

// Lista: map transforma cada item em um elemento; key identifica cada um
<ul>
    {tasks.map(task => (
        <li key={task.id}>{task.name}</li>
    ))}
</ul>
```

A `key` precisa ser **única e estável** (um `id`, nunca o índice quando a lista pode mudar de ordem). É com ela que o React descobre qual item mudou, em vez de reconstruir a lista inteira.

6 - Instalando React e TypeScript

6.1 - Os Pacotes

O React é dividido em dois pacotes, porque o "núcleo" não depende de navegador:

- **`react`**: o núcleo, com os componentes, os hooks (`useState` e companhia) e o JSX;
- **`react-dom`**: a ponte com o navegador, que sabe transformar o resultado do React em DOM de verdade.

Para o TypeScript entender esses pacotes, instalamos também os **tipos** (que, como já vimos com outras bibliotecas, vêm em pacotes `@types/...`), e o plugin do Vite que sabe compilar JSX:

```bash
npm install react react-dom
npm install -D @types/react @types/react-dom @vitejs/plugin-react
```

6.2 - O Caminho Rápido: o Template do Vite

Para começar um projeto novo, o próprio Vite gera tudo já configurado, com TypeScript:

```bash
npm create vite@latest meu-app -- --template react-ts
cd meu-app
npm install
npm run dev
```

Num projeto que já existe (como o nosso, que já usa o Vite), o caminho é adicionar os pacotes acima e ajustar duas configurações, mostradas a seguir.

6.3 - Plugin no Vite

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
})
```

Sem o plugin, o Vite não sabe o que fazer com o JSX. Com ele, o JSX é compilado, e o Vite mantém o **HMR**: ao salvar um componente, a tela atualiza sem recarregar a página.

6.4 - O `tsconfig`, Rapidamente

O `tsconfig.json` que já usamos precisa de duas mudanças:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["resources/js/**/*.ts", "resources/js/**/*.tsx"]
}
```

- **`"jsx": "react-jsx"`**: ensina o TypeScript a entender o JSX e usa a transformação moderna, que **dispensa** `import React from "react"` no topo de cada arquivo. (O valor antigo, `"react"`, exigia esse import.)
- **`include` com `*.tsx`**: sem isso o TypeScript ignora os arquivos de componente.

Os demais campos continuam como no projeto. O `"strict": true` segue ligado e é ele que faz o TypeScript reclamar quando um estado pode ser `null`, o que vamos aproveitar bastante.

6.5 - Montando o React na Página

O React precisa de **um único elemento** do HTML para se pendurar. Todo o resto da tela é gerado a partir dele:

```html
<body>
    <div id="root"></div>
    <script type="module" src="/js/main.tsx"></script>
</body>
```

```tsx
import { createRoot } from "react-dom/client"
import { Contador } from "./Contador"

createRoot(document.getElementById("root")!).render(<Contador />)
```

O `!` depois de `getElementById(...)` é o *non-null assertion* do TypeScript: afirmamos que o elemento existe (o método devolve `HTMLElement | null`). A partir daqui, o `<Contador />` é a raiz da árvore de componentes.

7 - Estado

7.1 - O Conceito Zero: Alan Turing e a Máquina de Estados

Para entender estado em React, vale voltar ao começo da computação. Em 1936, **Alan Turing** descreveu uma máquina abstrata (hoje chamada **máquina de Turing**) para definir matematicamente o que significa "calcular". Ela tem poucas peças:

- uma **fita** infinita dividida em células, cada uma com um símbolo;
- um **cabeçote** que lê e escreve o símbolo da célula atual e anda uma célula para a esquerda ou para a direita;
- um **estado atual**, escolhido entre um conjunto finito de estados;
- uma **tabela de transição**: dado o *estado atual* e o *símbolo lido*, ela diz qual símbolo escrever, para onde andar e **qual será o próximo estado**.

A peça que nos interessa é o **estado**. É ele que dá "memória" à máquina: com o **mesmo símbolo** na fita, a máquina faz coisas diferentes dependendo do estado em que está. O estado é, em uma frase, **tudo o que o sistema precisa lembrar sobre o passado para decidir o que fazer agora**. Todo computador, do relógio digital ao navegador, é descendente dessa ideia.

Outro jeito de enxergar o estado é como o famoso **snapshot** (uma foto) do sistema naquele instante, exatamente a ideia por trás de um **commit do Git**: cada commit não guarda "o que mudou", e sim o projeto inteiro naquele momento, e o que leva de um commit ao próximo é uma mudança. Com o estado é igual: ele é a foto completa do que o programa sabe agora, e cada evento produz a foto seguinte. Essa imagem volta na seção 7.6, quando vermos que cada renderização enxerga uma "foto" do estado.

Quem já programou com orientação a objetos conhece o conceito por outro nome: o **estado de um objeto** são os valores **atuais das propriedades** daquele objeto instanciado a partir de uma classe.

```typescript
class Task {
    isDone = false

    constructor(public name: string) {}

    complete() {
        this.isDone = true
    }
}

const task = new Task("Estudar") // estado: { name: "Estudar", isDone: false }
task.complete()                  // estado: { name: "Estudar", isDone: true }
```

Duas instâncias da mesma classe podem estar em estados diferentes, e um método (o evento) leva o objeto de um estado ao próximo. No React o estado do componente segue a mesma lógica, só que guardado pelo React em vez de numa propriedade de classe.

Um exemplo do dia a dia é o semáforo, que é uma **máquina de estados** pequena:

```text
        passa o tempo            passa o tempo            passa o tempo
VERDE ─────────────────▶ AMARELO ─────────────────▶ VERMELHO ───────────┐
  ▲                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

O "evento" é o mesmo nos três casos (passou o tempo), mas o resultado depende do estado atual. Em TypeScript, essa tabela de transição é um objeto, e os estados possíveis são uma união de literais:

```typescript
type Semaforo = "verde" | "amarelo" | "vermelho"

const proximo: Record<Semaforo, Semaforo> = {
    verde: "amarelo",
    amarelo: "vermelho",
    vermelho: "verde"
}

console.log(proximo["verde"]) // "amarelo"
```

7.2 - O Que É Estado e o Que É Gerenciamento de Estado

**Estado** é qualquer dado que **muda ao longo do tempo** e cuja mudança precisa **ser refletida na tela**: o texto digitado num campo, a lista de tarefas, o item selecionado, se um modal está aberto, se uma requisição está carregando.

Já **gerenciar estado** é responder, para cada dado, a quatro perguntas:

1. **Quem é o dono?** (qual componente guarda o dado);
2. **Quem pode ler?** (quais componentes recebem esse dado por parâmetro);
3. **Quem pode mudar?** (quem tem acesso à função que altera);
4. **Quem precisa ser avisado** quando mudar (quem precisa ser redesenhado).

Sem uma biblioteca como o React, essas quatro perguntas ficavam espalhadas pelo código (era o que fazíamos com `addEventListener` e `innerText`). O React centraliza as respostas: o dono declara o estado; os outros recebem por parâmetro; e a mudança só acontece por um caminho oficial, que avisa a todos.

7.3 - Por Que Uma Variável Comum Não Serve

Vamos tentar fazer um contador com uma variável comum:

```tsx
// ERRADO: o `let` só existe aqui para mostrar o problema; em componente usamos `const`
export function ContadorQuebrado() {
    let contador = 0

    function incrementar() {
        contador++
        console.log(contador)
    }

    return <button onClick={incrementar}>Cliques: {contador}</button>
}
```

Ao clicar, o console mostra `1`, `2`, `3`, mas a **tela continua em "Cliques: 0"**. Há dois motivos independentes, e os dois já conhecemos:

1. **O React não foi avisado.** Mudar uma variável local não dispara nenhuma renderização. O React só roda a função do componente de novo quando alguém avisa que o estado mudou.
2. **Mesmo que a função rodasse de novo, a variável voltaria a zero.** Lembre da call stack: um componente é uma função, e cada execução dela ganha um **frame novo**, com `let contador = 0` executado do zero. O frame da execução anterior foi descartado, e o `contador` morreu junto com ele.

Ou seja: o dado precisa **sobreviver às execuções da função** (estar fora da pilha, no heap) e a mudança dele precisa **avisar o React**. É exatamente isso que o `useState` faz.

7.4 - `useState`

```tsx
import { useState } from "react"

export function Contador() {
    const [contador, setContador] = useState(0)

    return (
        <button onClick={() => setContador(contador + 1)}>
            Cliques: {contador}
        </button>
    )
}
```

`useState(0)` devolve um **par** (por isso a desestruturação de array):

- o **valor atual** do estado (`contador`);
- a **função que altera** o estado (`setContador`): o único caminho oficial.

O `0` é o **valor inicial**, usado apenas na primeira renderização. Por baixo dos panos, o React guarda esse valor numa estrutura que ele mesmo mantém **no heap**, associada àquela instância do componente. A função do componente nasce e morre a cada execução na pilha, mas o estado fica guardado do lado de fora, esperando a próxima.

Uma regra decorre disso: o React identifica cada `useState` pela **ordem das chamadas** dentro do componente. Por isso os hooks só podem ser chamados no **nível de cima** da função, nunca dentro de `if`, laço ou função aninhada; se a ordem mudasse de uma execução para outra, o React entregaria o valor errado a cada variável.

7.5 - O Ciclo: o Estado Muda, o Componente Inteiro Roda de Novo

Este é o ponto central da aula. Quando alguém chama `setContador(1)`, acontece sempre a mesma sequência:

1. **Evento**: o usuário clica no botão e o React chama o `onClick`;
2. **`setContador(contador + 1)`**: o React registra o novo valor do estado e **agenda uma nova renderização**;
3. **A função do componente é executada de novo, inteira**, do início ao `return`: um frame novo na pilha, o código todo roda outra vez;
4. **O `useState` devolve o valor novo** (não mais o inicial), então `contador` agora vale `1` nessa execução;
5. **O `return` produz um JSX novo**, que descreve a tela para esse estado;
6. **O React compara** o JSX novo com o anterior e **altera no DOM só o que mudou** (aqui, o texto do botão);
7. A função termina, o frame é descartado, e o componente fica esperando o próximo evento.

Cada execução da função é chamada de **renderização**. Perceba como tudo se encaixa: **estado e parâmetros são as entradas, o JSX é a saída, e todo o código no meio roda a cada renderização**. Se um valor derivado depende do estado, basta calculá-lo no código, sem precisar de outro estado:

```tsx
export function Carrinho() {
    const [quantidade, setQuantidade] = useState(1)

    // Derivado: recalculado a cada renderização, sempre coerente com o estado
    const total = quantidade * 29.9
    const rotulo = quantidade === 1 ? "item" : "itens"

    return (
        <div>
            <p>{quantidade} {rotulo}: R$ {total.toFixed(2)}</p>
            <button onClick={() => setQuantidade(quantidade + 1)}>+</button>
            <button onClick={() => setQuantidade(quantidade - 1)} disabled={quantidade === 1}>-</button>
        </div>
    )
}
```

Aqui só existe **um** estado (`quantidade`); `total` e `rotulo` são calculados a cada renderização e, por isso, nunca ficam dessincronizados. Esta é a vitória sobre o modelo imperativo da seção 3.2.

7.6 - Cada Renderização Enxerga Uma "Foto" do Estado

Dentro de uma renderização, o valor de `contador` **não muda**: é uma constante daquela execução da função. Isso explica um comportamento que costuma surpreender:

```tsx
function somarTres() {
    setContador(contador + 1)
    setContador(contador + 1)
    setContador(contador + 1)
}
```

Se `contador` vale `0`, cada linha pede `setContador(1)`, e o resultado final é **1**, e não 3. As três linhas enxergaram a mesma "foto" (`contador === 0`). Quando o novo valor depende do **anterior**, passamos ao `setContador` uma **função**, que o React chama com o valor mais recente:

```tsx
function somarTres() {
    setContador(atual => atual + 1)
    setContador(atual => atual + 1)
    setContador(atual => atual + 1)
}
```

Agora o resultado é **3**: cada chamada recebe o resultado da anterior. Regra prática: **se o novo estado depende do antigo, use sempre a forma de função.** Na dúvida, use-a também nos demais casos: ela nunca erra.

7.7 - Estado com Objetos e Arrays: Nunca Alterar no Lugar

Voltamos ao que construímos na seção 2. O React decide se precisa renderizar de novo comparando o valor novo com o antigo, e essa comparação (`Object.is`) funciona como o `===`: **para objetos e arrays, ela compara endereços.**

```tsx
type Task = { id: number; name: string; is_done: boolean }

const [tasks, setTasks] = useState<Task[]>([])

// ERRADO: altera o array no lugar. O endereço continua o mesmo, o React
// compara endereço com endereço, vê "igual" e NÃO redesenha a tela.
function adicionarErrado(nova: Task) {
    tasks.push(nova)
    setTasks(tasks)
}

// CERTO: cria um array NOVO (endereço novo). O React percebe a diferença.
function adicionar(nova: Task) {
    setTasks([...tasks, nova])
}
```

Os mesmos três movimentos cobrem quase todos os casos:

```tsx
// Adicionar: spread
setTasks([...tasks, nova])

// Remover: filter devolve um array novo
setTasks(tasks.filter(task => task.id !== id))

// Alterar um item: map devolve um array novo, e o item alterado é um objeto novo
setTasks(tasks.map(task => {
    if (task.id !== id) return task
    return { ...task, is_done: !task.is_done }
}))
```

O princípio chama-se **imutabilidade**: o estado nunca é editado, apenas **substituído** por uma cópia atualizada. É o que faz o React saber, com uma comparação de endereço barata, que algo mudou.

8 - Generics nos Componentes

8.1 - `useState<T>`

O `useState` é uma função genérica, como as que estudamos na revisão da Aula 06. Simplificando sua assinatura:

```typescript
function useState<S>(inicial: S): [S, (novo: S | ((atual: S) => S)) => void]
```

O parâmetro de tipo `S` é o tipo do estado: o primeiro elemento do par é um `S`, e a função que altera aceita um `S` ou uma função de `S` para `S` (a forma funcional da seção 7.6). Na maioria das vezes o TypeScript **infere** `S` a partir do valor inicial:

```tsx
const [contador, setContador] = useState(0)        // S = number
const [nome, setNome] = useState("")               // S = string
const [isOpen, setIsOpen] = useState(false)        // S = boolean
```

Quando o valor inicial **não diz tudo** sobre o tipo, informamos o generic explicitamente entre `< >`:

```tsx
// Array vazio: sem o generic, o TypeScript infere never[] e não aceita nenhum item
const [tasks, setTasks] = useState<Task[]>([])

// Ainda não há valor: começa em null e depois vira uma Task
const [selecionada, setSelecionada] = useState<Task | null>(null)

// Estado como união de literais: só aceita os três valores do semáforo
const [cor, setCor] = useState<Semaforo>("vermelho")
```

Com o generic correto, o TypeScript protege o estado: `setCor("azul")` é erro de compilação, e `selecionada.name` só compila depois de provar que `selecionada` não é `null`.

8.2 - Tipando Parâmetros: o `type Props`

O generic dos parâmetros é o próprio tipo do objeto `props`, como já vimos na seção 5. A convenção é um `type NomeDoComponenteProps` logo acima do componente. Funções (callbacks) também entram nesse tipo, e é assim que o filho avisa o pai:

```tsx
type TaskItemProps = {
    task: Task
    onToggle: (task: Task) => void
}

function TaskItem({ task, onToggle }: TaskItemProps) {
    const decoracao = task.is_done ? "line-through" : "none"

    return (
        <li style={{ textDecoration: decoracao }} onClick={() => onToggle(task)}>
            {task.name}
        </li>
    )
}
```

8.3 - Componentes Genéricos

Quando o componente precisa funcionar com **qualquer tipo** de dado, o próprio componente vira genérico, igual a uma função genérica. Uma lista reaproveitável, que serve para tarefas, usuários ou qualquer outra coisa:

```tsx
import type { ReactNode } from "react"

type ListaProps<T> = {
    itens: T[]
    chave: (item: T) => string | number
    renderItem: (item: T) => ReactNode
}

export function Lista<T>({ itens, chave, renderItem }: ListaProps<T>) {
    return (
        <ul>
            {itens.map(item => (
                <li key={chave(item)}>{renderItem(item)}</li>
            ))}
        </ul>
    )
}
```

Na hora de usar, o TypeScript **infere `T`** a partir de `itens`, e já tipa os callbacks:

```tsx
<Lista
    itens={tasks}
    chave={task => task.id}
    renderItem={task => task.name}
/>
```

Aqui `T` é `Task`, então `task.name` é conferido pelo compilador; trocar `itens` por uma lista de usuários troca `T` para `Usuario` sem mudar uma linha do componente.

Um detalhe de sintaxe que só existe em `.tsx`: numa função de seta genérica, o `<T>` seria confundido com uma tag JSX. A saída é uma vírgula: `const Lista = <T,>(props: ListaProps<T>) => { ... }`. Com `function`, como acima, o problema não existe.

9 - Juntando Tudo: Parâmetros e Estados Fazendo o Componente Rodar

9.1 - O Fluxo de Dados

O desenho final cabe em duas regras:

- **Para baixo, por parâmetros**: o dono do estado passa o dado para os filhos como `props`;
- **Para cima, por callbacks**: o filho chama uma função recebida por parâmetro, e quem altera o estado é o dono.

```text
        ┌──────────────────────────┐
        │  TaskApp                 │  ← dono do estado (tasks, name)
        │  useState(...)           │
        └─────┬──────────▲─────────┘
     task     │          │   onToggle(task)
   (props ↓)  │          │   (callback ↑)
        ┌─────▼──────────┴─────────┐
        │  TaskItem                │  ← só lê props e chama a função
        └──────────────────────────┘
```

9.2 - O Exemplo Completo: o CRUD de Tasks em React

Vamos reescrever a tela de tasks do projeto (a mesma do CRUD das aulas anteriores) como componentes. Os tipos e as funções de API são os que já existem em `resources/js/types/api.ts` e `resources/js/api/`: nada de backend novo. O componente raiz é o dono do estado e faz o C, o U e o D do CRUD; o R (a leitura) é a lista desenhada a partir do estado.

```tsx
import { useState } from "react"
import type { Task } from "../types/api"
import { taskCreateApi } from "../api/taskCreateApi"
import { taskUpdateApi } from "../api/taskUpdateApi"
import { taskDeleteApi } from "../api/taskDeleteApi"

type TaskItemProps = {
    task: Task
    onToggle: (task: Task) => void
    onDelete: (id: number) => void
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
    const decoration = task.is_done ? "line-through" : "none"

    return (
        <li className="list-group-item d-flex justify-content-between">
            <span style={{ textDecoration: decoration }} onClick={() => onToggle(task)}>
                {task.name}
            </span>
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(task.id)}>
                Excluir
            </button>
        </li>
    )
}

type TaskAppProps = {
    idUser: number
    initialTasks: Task[]
}

export function TaskApp({ idUser, initialTasks }: TaskAppProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [name, setName] = useState("")

    const pending = tasks.filter(task => !task.is_done).length

    // C: create
    async function create() {
        if (name.trim() === "") return

        const created = await taskCreateApi(idUser, { name })
        setTasks(current => [...current, created])
        setName("")
    }

    // U: update (marcar/desmarcar como feita)
    async function toggle(task: Task) {
        const updated = await taskUpdateApi(idUser, task.id, { is_done: !task.is_done })
        setTasks(current => current.map(item => {
            if (item.id !== updated.id) return item
            return updated
        }))
    }

    // D: delete
    async function remove(id: number) {
        await taskDeleteApi(idUser, id)
        setTasks(current => current.filter(task => task.id !== id))
    }

    return (
        <section>
            <div className="input-group mb-3">
                <input
                    className="form-control"
                    value={name}
                    onChange={event => setName(event.target.value)}
                />
                <button className="btn btn-primary" onClick={create}>Adicionar</button>
            </div>

            <p>{pending} pendente(s)</p>

            <ul className="list-group">
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggle} onDelete={remove} />
                ))}
            </ul>
        </section>
    )
}
```

Acompanhe o código com o que aprendemos:

- **Dois estados** (`tasks` e `name`), com o generic `<Task[]>` explícito porque o valor inicial vem de fora;
- `initialTasks` chega por **parâmetro** e vira o valor inicial do estado (a origem dele é a View, na seção 9.4);
- `value={name}` + `onChange` fazem do `input` um **campo controlado**: o estado é a fonte da verdade, e o campo apenas o exibe;
- `pending` é **derivado**: recalculado a cada renderização, sem estado próprio;
- as funções de API devolvem o `Task` que o servidor gravou (com o `id` de verdade), e é **esse** objeto que entra no estado;
- como as chamadas são assíncronas, usamos a **forma de função** (`setTasks(current => ...)`) da seção 7.6: quando a resposta chega, o `tasks` do momento do clique já pode estar velho, e `current` é sempre o valor mais recente;
- nenhuma operação altera o array no lugar: sempre geram um **novo** (seção 7.7);
- `TaskItem` recebe tudo por **parâmetro** e avisa o pai por **callback**; ele não tem estado nenhum.

9.3 - Seguindo uma Renderização, Passo a Passo

Com a lista vazia, o usuário digita "Estudar React" e clica em *Adicionar*:

1. A cada letra digitada, `onChange` chama `setName`; a função `TaskApp` roda de novo e o `input` mostra o valor atualizado;
2. O clique chama `create`: `name` vale `"Estudar React"` (a "foto" desta renderização) e a função faz o POST em `/users/{idUser}/tasks`;
3. A resposta chega com o `Task` criado (um objeto novo no **heap**, com `id` e `is_done: false`);
4. `setTasks(current => [...current, created])` entrega ao React um **array novo** (endereço novo) e `setName("")` pede o campo vazio;
5. O React agenda **uma** nova renderização com os dois estados atualizados;
6. `TaskApp` roda de novo: `pending` vale `1`, o `.map` produz um `<TaskItem />`, e o `input` volta vazio;
7. O React compara o resultado com o anterior e acrescenta ao DOM **apenas** o novo `<li>` e o texto do contador.

Clicar no nome da task repete o ciclo: `toggle` chama o PUT, o servidor devolve a task com `is_done` invertido, `map` gera um array novo com aquele objeto trocado, e tudo que depende de `is_done` (o risco no texto e o contador de pendentes) é recalculado sozinho. Excluir é o mesmo caminho com `filter`.

9.4 - O React Dentro de uma View EJS

Na Aula 07 a tela de login virou uma **View**: o servidor monta o HTML com EJS e o Nginx/Express o entrega depois de passar pelos middlewares (por exemplo, o de sessão). O React não substitui isso: ele ocupa **um pedaço** dessa View. O servidor continua responsável pela página, pela proteção por middleware e por entregar os dados iniciais; o React cuida da parte da tela que precisa reagir a eventos.

A View `resources/views/tasks.ejs` ganha um elemento âncora (o `root` da seção 6.5) e carrega o entry compilado pelo helper `vite()`:

```ejs
<head>
  <%- vite(["css/app.css", "js/app.ts", "js/pages/tasks.tsx"]) %>
</head>

<body class="d-flex flex-column min-vh-100 bg-light">
  <header class="bg-primary text-white py-4 px-4 shadow-sm">
    <h1 class="h3 m-0">Tasks de <%= user.name %></h1>
  </header>

  <main class="container flex-grow-1 py-5">
    <%# O servidor entrega o id do usuário e as tasks já lidas do banco %>
    <div id="root"
         data-id-user="<%= user.id %>"
         data-tasks="<%= JSON.stringify(tasks) %>"></div>
  </main>
</body>
```

O `<%= ... %>` do EJS **escapa** o conteúdo, então o JSON pode ir com segurança dentro do atributo. A rota é `GET /tasks`, protegida por um middleware de página que é o espelho do `RedirectIfAuthenticatedMiddleware` da Aula 07: sem cookie `auth_token` válido, redireciona para `/login` **antes** de o HTML existir.

```javascript
router.get('/tasks', RedirectIfGuestMiddleware, TasksViewController);
```

```javascript
export default async function TasksViewController(request, response) {
    const user = await UserModel.findByPk(request.user.id);

    if (!user) {
        return response.redirect("/login");
    }

    const tasks = await TaskModel.findAll({
        where: { id_user: user.id },
        order: [["id", "ASC"]],
        raw: true
    });

    return response.status(200).render("tasks", { user, tasks });
}
```

E o entry `resources/js/pages/tasks.tsx` lê os `data-*` do `root` e monta o componente:

```tsx
import { createRoot } from "react-dom/client"
import type { Task } from "../types/api"
import { TaskApp } from "../components/TaskApp"

const root = document.getElementById("root")!
const idUser = Number(root.dataset.idUser)
const initialTasks: Task[] = JSON.parse(root.dataset.tasks ?? "[]")

createRoot(root).render(<TaskApp idUser={idUser} initialTasks={initialTasks} />)
```

Três coisas para guardar:

- **O dado inicial vira parâmetro**: a View entrega as tasks, e o `TaskApp` as recebe como `initialTasks`. Daí em diante, o dono do dado é o **estado** do componente;
- **Dá para comparar os dois mundos**: um *partial* do EJS (`include("partials/header")`) também reaproveita um pedaço e recebe dados, mas roda **uma vez no servidor** e entrega HTML pronto. O componente React roda **no navegador, de novo a cada mudança de estado**;
- **Para o Vite compilar o `.tsx`**, o plugin do React entra no `vite.config.js` (seção 6.3), a nova entrada entra no `rollupOptions.input` ao lado das entradas já existentes, e o `tsconfig` inclui `*.tsx` (seção 6.4).

9.5 - O Que Fica Para a Próxima Aula

Este briefing não cobre dois recursos que completam o quadro e serão o tema da próxima aula:

- **Referências (`useRef`)**: um valor que sobrevive às renderizações (como o estado), mas **sem** disparar uma nova renderização quando muda; usado, por exemplo, para acessar um elemento do DOM;
- **Efeitos (`useEffect`)**: código que precisa rodar **por causa** de uma renderização (buscar dados na API, assinar um evento), em vez de rodar durante o cálculo do JSX.

Os dois funcionam como saídas controladas do ciclo "estado → renderização → tela" que acabamos de estudar, e só têm sentido depois que esse ciclo estiver claro.

Questões do TA:


QUESTÃO 1

Considere o código:

```javascript
const a = { nome: "Ana" }
const b = a
b.nome = "Bia"
console.log(a.nome)
```

Sobre o comportamento desse código, é correto afirmar que:

A) Imprime `"Ana"`, porque `const b = a` copia o objeto inteiro para uma nova região do heap, deixando `a` e `b` independentes.

B) Imprime `"Bia"`, porque objetos são tipos de referência: `a` e `b` guardam o mesmo endereço, que aponta para um único objeto no heap, e alterar por uma variável é visível pela outra.

C) Imprime `"Bia"`, porque tanto objetos quanto números primitivos ficam sempre no heap e são copiados por referência.

D) Gera erro, porque uma variável declarada com `const` não pode ser usada para alterar nenhuma propriedade do objeto.

E) Imprime `undefined`, porque o frame da call stack onde `b` foi criado é descartado antes do `console.log`.

Gabarito: B

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2

Sobre o React, o JSX e a anatomia de um componente, é correto afirmar que:

A) Um componente pode receber qualquer quantidade de parâmetros posicionais, e um arquivo `.ts` aceita JSX normalmente, desde que o `tsconfig` esteja configurado.

B) O navegador interpreta o JSX diretamente, sem nenhuma etapa de compilação, e por isso o Vite só é necessário para servir os arquivos.

C) O componente deve alterar diretamente as `props` recebidas para comunicar mudanças ao componente pai.

D) Um componente é uma função que recebe um único objeto de parâmetros (`props`), executa código TypeScript comum e retorna JSX; como o curso usa TypeScript, os arquivos que contêm JSX usam a extensão `.tsx`.

E) O nome de um componente deve começar com letra minúscula, para que o React o diferencie das tags HTML.

Gabarito: D

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 3

Um aluno escreveu um contador usando `let contador = 0` dentro do componente e `contador++` no clique do botão. Ao clicar, o valor muda no console, mas a tela continua mostrando `0`. Sobre o problema e sua solução, é correto afirmar que:

A) O problema é o `++`; trocar por `contador = contador + 1` resolve, pois o React detecta atribuições.

B) O problema é a ausência da `key`; adicionar `key` ao botão faz o React redesenhar a tela.

C) Uma variável local é recriada a cada execução da função (cada execução tem um frame novo na call stack) e alterá-la não avisa o React; com `useState`, o valor fica guardado fora da função e o `setContador` agenda uma nova renderização, que executa o componente inteiro de novo com o valor atualizado.

D) O problema é o `console.log`; sem ele a tela é atualizada automaticamente.

E) Basta declarar a variável com `const` fora do componente, pois assim o React passa a monitorar suas alterações.

Gabarito: C

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 4

Considere o estado `const [tasks, setTasks] = useState<Task[]>([])`. Sobre atualizá-lo e sobre o generic, é correto afirmar que:

A) `setTasks([...tasks, nova])` cria um array novo, com endereço diferente, e o React percebe a mudança; já `tasks.push(nova); setTasks(tasks)` mantém o mesmo endereço e não provoca nova renderização. O generic `<Task[]>` é necessário porque, sem ele, o array vazio seria inferido como `never[]`.

B) `tasks.push(nova); setTasks(tasks)` é a forma recomendada, pois evita copiar o array e o React compara o conteúdo item a item.

C) O generic `<Task[]>` é opcional, porque o TypeScript sempre infere `Task[]` a partir de um array vazio.

D) `setTasks` só aceita um novo array se ele tiver exatamente o mesmo tamanho do anterior.

E) Os dois jeitos, `push` seguido de `setTasks(tasks)` e `setTasks([...tasks, nova])`, são equivalentes, pois o React sempre compara o conteúdo dos arrays.

Gabarito: A

Misturar as alternativas? ( x) Sim (  ) Não
