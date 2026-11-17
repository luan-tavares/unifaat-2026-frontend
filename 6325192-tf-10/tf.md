Nome: Emar Cristian Silva Teruo Ito
RA: 6325192
GitHub: https://github.com/iHawlKz7

Armadilha do dispatch: o createJob sempre encerrava a conexão RabbitMQ no finally, inclusive quando ela já pertencia ao servidor WebSocket. Isso derrubava a conexão compartilhada e suas filas exclusivas de notificações. A correção consulta rabbit.isConnected() antes de conectar e só chama rabbit.close() se o dispatch tiver aberto a conexão. Assim, o websocket mantém suas assinaturas enquanto o worker executa os jobs da fila images. A miniatura usa a alternativa de simulação de processamento por três segundos autorizada no enunciado, com a imagem exibida em tamanho reduzido no frontend.
