Nome: Gabriel Reis Cunha
RA: 6325149
GitHub: https://github.com/gabrielreis354

Armadilha do dispatch: o `dispatch` do `createJob` chamava `rabbit.close()` no `finally`, sempre. O `rabbit` é um singleton: o processo todo compartilha uma única conexão. Num worker ou num comando isso é inofensivo, porque quem faz o `dispatch` abriu a conexão e pode fechá-la. Dentro do websocket, porém, a conexão já pertence ao servidor (ela publica no exchange e consome as filas dinâmicas `notifications` e `results`). Ao despachar a primeira imagem, o `dispatch` fechava essa conexão e o chat inteiro deixava de entregar mensagens. Corrigi guardando `const wasConnected = rabbit.isConnected()` antes do `rabbit.connect()` e fechando no `finally` só se `!wasConnected`, ou seja, apenas quando foi o próprio `dispatch` que abriu a conexão.
