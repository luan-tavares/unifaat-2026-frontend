Nome: Matheus Mantovani
RA: 1120245
GitHub: https://github.com/Manntto

Armadilha do dispatch: O método dispatch do createJob sempre chamava rabbit.close() no bloco finally, mesmo quando a conexão com o RabbitMQ já estava aberta (mantida pelo websocket para assinar o exchange). Isso derrubava a conexão do websocket ao primeiro dispatch de um job, impedindo que qualquer evento subsequente chegasse aos clientes. A correção foi verificar com rabbit.isConnected() antes de conectar, e só fechar a conexão no finally se foi o próprio dispatch que a abriu — se já estava conectada, o dispatch não fecha. Assim o websocket mantém sua conexão estável enquanto usa o RabbitMQ para publicar jobs.
