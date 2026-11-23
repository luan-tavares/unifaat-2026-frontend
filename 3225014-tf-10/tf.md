Nome: Felipe Gomes Mariano
RA: 3225014
GitHub: https://github.com/felipem004/unifaat-2026-frontend

Armadilha do dispatch: o método `dispatch` do `createJob` abre a conexão com o RabbitMQ, publica a mensagem e fecha a conexão no bloco `finally`. Dentro do `_websocket.js`, porém, a conexão com o RabbitMQ já está aberta desde a subida do servidor (para assinar o exchange e receber eventos). Quando o `ChatImageEvent` chama `ProcessChatImageJob.dispatch(...)`, o `finally` chama `rabbit.close()`, derrubando a única conexão compartilhada — e com ela a assinatura do exchange, o que faz o servidor de WebSocket parar de receber e distribuir mensagens para todos os clientes.

A correção está no próprio `createJob` (já aplicada no projeto): antes de chamar `rabbit.connect()`, o `dispatch` guarda se a conexão já estava aberta (`const wasConnected = rabbit.isConnected()`). No `finally`, só fecha se foi o próprio `dispatch` que abriu (`if (!wasConnected) { await rabbit.close() }`). Assim, quando o websocket já tem uma conexão ativa, o `dispatch` a reutiliza e não a fecha ao terminar.
