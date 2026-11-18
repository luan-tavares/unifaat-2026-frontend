Nome: Hector Marcelo Pedroso dos Santos
RA: 6125136
GitHub: https://github.com/hectorbackfront

Armadilha do dispatch: o `dispatch` do `createJob` fazia `await rabbit.connect()` e, no `finally`, `await rabbit.close()`. Como o `rabbit.js` guarda uma única conexão e um único canal por processo, quando o `ChatImageEvent` chamava `ProcessChatImageJob.dispatch(...)` dentro do servidor websocket, o `close()` derrubava a conexão do RabbitMQ que o próprio websocket usava para publicar (`notify`) e para receber (`subscribe`): depois da primeira imagem o chat deixava de distribuir mensagens. A correção foi checar `rabbit.isConnected()` antes do `connect()` e guardar o resultado em `isOwner`; no `finally`, o `dispatch` só chama `rabbit.close()` se ele mesmo abriu a conexão. Em um controller ou comando (sem conexão aberta) o comportamento continua igual, e dentro do websocket a conexão compartilhada é preservada.
