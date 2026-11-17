Nome: José Henrique Teixeira Luiz
RA: 3225002
GitHub: https://github.com/zzin742

Armadilha do dispatch: o `dispatch` do `createJob` (em `src/utils/job.js`) fazia
`rabbit.connect()` e, no `finally`, um `rabbit.close()` incondicional. Num
comando avulso isso está correto — o processo abre a conexão, publica na fila e
termina. Dentro do servidor websocket, não: ele já abre uma conexão no boot
(`await rabbit.connect()` no `_websocket.js`) e a usa o tempo todo, tanto para
publicar no exchange quanto para a fila dinâmica que recebe de volta. Quando o
`ChatImageEvent` chamava `dispatch`, o `finally` fechava **essa** conexão
compartilhada, e o servidor ficava sem RabbitMQ: a imagem até entrava na fila,
mas a mensagem de texto seguinte não era mais distribuída. O sintoma enganava,
porque a quebra aparecia no evento seguinte e não no upload. Corrigi guardando
`rabbit.isConnected()` antes de conectar: se a conexão já existia, o `dispatch`
não chama `connect()` nem `close()`; se foi ele que abriu, fecha no fim como
antes. Quem abriu é quem fecha.

---

## O que foi feito

### 1. Event "digitando…" (`chat:typing`)

`src/app/Events/Chat/ChatTypingEvent.js` só valida nome e sala e chama
`context.notify('chat:typing', { name, room })`. Não guarda estado nem agenda
nada: o servidor não tem como saber quando a pessoa **parou** de digitar, só
quando digitou. Quem decide a validade do aviso é a tela.

No `ChatApp.tsx`:

- o horário do último envio fica em `useRef`, e o `onChange` só emite se
  passaram 1,5 s. Em `useState` isso causaria um render a cada tecla, que é
  justamente o custo que o limite existe para evitar;
- o aviso some depois de 3 s sem `chat:typing` novo. Há **um timer por pessoa**,
  num `Map` dentro de um `useRef`; cada evento novo cancela o timer anterior
  daquela pessoa e agenda outro, senão o primeiro a expirar apagaria o aviso com
  ela ainda digitando;
- a mensagem de alguém também encerra o aviso dessa pessoa — ela parou de
  digitar porque enviou;
- o autor nunca vê o próprio aviso (comparação com `nameRef`, não com o `name`
  capturado no render);
- a limpeza do `useEffect` percorre o `Map` e cancela todos os timers pendentes.

### 2. Salas e `chat:leave`

`chat:join` passou a receber `{ name, room }` e faz `context.socket.join(room)`.
Sem o `join`, a sala existiria só no payload e todos continuariam recebendo
tudo. O `ChatLeaveEvent` faz `socket.leave(room)` **antes** do `notify`: assim
quem saiu não recebe o próprio aviso de saída.

Todos os eventos de chat levam `room`. No `_websocket.js`, o consumidor do
exchange virou uma função única que decide o destino pelo payload: com `room`,
`io.to(room).emit`; sem `room` (a lista de presença, que é informação de
conexão), continua `io.emit`.

No React, o `feed` guarda tudo e a tela filtra pela sala atual com `useMemo` —
filtrar na exibição, e não na chegada, preserva o histórico se a pessoa voltar à
sala. Trocar de sala emite `chat:leave` na antiga e `chat:join` na nova, nessa
ordem. "Saiu da sala" usa `bg-warning-subtle`, contra o `bg-success-subtle` de
"entrou".

### 3. Imagem processada por worker (`chat:image`)

O `ChatImageEvent` **não processa nada**: valida e chama
`ProcessChatImageJob.dispatch('images', ...)`. Gerar miniatura ali seguraria o
event loop do processo que mantém todas as conexões abertas.

O `ProcessChatImageJob` roda no worker da fila `images`, simula o peso com 3 s de
espera (o `sharp` exigiria recompilar a imagem do worker) e publica o resultado
em `rabbit.notify('results', 'chat:image', ...)`. O `_websocket.js` ganhou o
parâmetro `--results` e assina esse segundo exchange com a mesma função de
entrega.

O `docker-compose.yml` ganhou o `nodeworker-images-container`, cópia do worker
padrão com `command: ["--queue", "images"]` e sem `ports` — worker não é
servidor. É um worker separado de propósito: dividir a fila com os outros jobs
faria um upload atrasar tudo o que estivesse atrás dele.

No front, o botão `📎 imagem` dispara um `<input type="file">` escondido,
recusa acima de 500 KB com mensagem de erro, lê com `FileReader` e emite o
`dataURL`. O limite é repetido no Event: o da tela poupa rede, o do servidor
impede que alguém o contorne.

## Como conferir

```sh
docker compose up -d --build
```

Abra `http://localhost:8080/chat` em três abas com nomes diferentes, duas em
`# geral` e uma em `# dev`.

- **Digitando:** digite na aba A; B mostra "… está digitando…" e A não. O aviso
  some em ~3 s e também some quando a mensagem chega.
- **Salas:** a mensagem de `geral` não aparece em `dev`. "Sair da sala" volta
  para a tela do nome e a aba que ficou vê o aviso em âmbar.
- **Imagem:** acima de 500 KB é recusada na hora. Abaixo, a miniatura aparece
  para a sala **depois** de o worker processar.
- **A prova da separação:** `docker compose stop nodeworker-images-container`.
  O chat de texto continua funcionando e a imagem fica na fila; ao subir o
  worker de novo, ela chega.

`npx tsc --noEmit` passa sem erro e não há `any`, `let` ou `else` no
`ChatApp.tsx`. O `_websocket.js` não cita nenhum Event pelo nome — o
`loadEvents` descobre os arquivos sozinho.
