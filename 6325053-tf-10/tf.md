Nome: Matheus Viana
RA: 6325053
GitHub: https://github.com/Matiasdocs

Armadilha do dispatch: o `createJob.dispatch` (utils/job.js) chamava `rabbit.close()`
sempre no `finally`. Isso funciona para processos curtos — o controller HTTP e os
comandos abrem a conexão, publicam o job e encerram. Só que o `_websocket.js` mantém a
conexão do RabbitMQ aberta o tempo todo: é ela que sustenta as assinaturas (`subscribe`)
das filas dinâmicas dos exchanges `notifications` e `results`. Quando o `ChatImageEvent`
chamava `ProcessChatImageJob.dispatch('images', ...)` de dentro do websocket, o `finally`
do dispatch fechava essa conexão compartilhada, derrubando a fila dinâmica do servidor e
parando o chat inteiro (ninguém mais recebia mensagens). A correção foi registrar, antes
de conectar, se a conexão já estava aberta (`const wasConnected = rabbit.isConnected()`) e,
no `finally`, fechar apenas quando foi o próprio dispatch que a abriu
(`if (!wasConnected) { await rabbit.close() }`). Assim, no websocket (conexão já aberta) o
dispatch não fecha nada e a assinatura continua viva; no controller/comando (sem conexão
prévia) ele abre e fecha normalmente, como antes.
