Nome: Andreyh Rodrigues de Souza
RA: 6325231
GitHub: https://github.com/Andreyh117

Armadilha do dispatch: o `rabbit` é um módulo único (singleton), então o `_websocket.js` e o `dispatch` do `createJob` usam a mesma conexão do RabbitMQ. O `dispatch` fazia `rabbit.connect()` (que só devolvia a conexão já aberta pelo websocket) e, no `finally`, sempre chamava `rabbit.close()`: depois do primeiro `chat:image`, ele fechava o canal e a conexão que o servidor websocket estava usando, derrubando o `subscribe` dos exchanges `notifications` e `results` (as filas dinâmicas morriam junto com o canal e o servidor parava de entregar os eventos aos clients). Corrigi em `src/utils/job.js`: antes do `connect`, o `dispatch` guarda `const wasConnected = rabbit.isConnected()` e, no `finally`, só chama `rabbit.close()` se `wasConnected` era `false`, ou seja, só fecha a conexão se foi ele mesmo que a abriu (como num controller ou num comando). Dentro do websocket a conexão continua aberta.
