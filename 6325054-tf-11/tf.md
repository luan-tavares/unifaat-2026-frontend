Nome: Leonardo Contini
RA: 6325054
GitHub: https://github.com/Leonardocontini

Invalidação no worker: A invalidação fica no worker `save-message` porque ele é quem realmente grava a mensagem no banco. Só quem escreveu no banco sabe que o dado mudou. O `ChatMessageEvent` apenas recebe o evento do WebSocket e publica o job na fila; nesse momento a mensagem ainda não existe no Postgres. Se o `del` fosse feito no Event, o cache seria apagado antes da mensagem ser gravada: o próximo GET poderia buscar o banco e ainda não encontrar a mensagem nova, gerando um MISS sem ganho nenhum. Com o `del` no worker, que roda após o `MessageModel.create`, a invalidação acontece exatamente quando o dado novo está disponível.

Redes do exporter: O exporter precisa de duas redes. Ele entra na `edge-network` para alcançar o nginx (que só existe nessa rede, pois não enxerga o banco). Ele entra na `data-network` para ser alcançado pelo Prometheus (que só existe nessa rede, pois não publica porta na borda). Sem a `edge-network` o exporter não consegue ler o `stub_status`; sem a `data-network` o Prometheus não consegue coletar o `/metrics` do exporter. Nenhuma porta é publicada no host porque o tráfego é todo interno entre containers.

O que o stub_status mede: O `stub_status` conta no nível do Nginx: conexões abertas, requisições aceitas e conexões em andamento. Ele enxerga todo tráfego que chega ao Nginx, incluindo arquivos estáticos servidos diretamente (CSS, JS, imagens) e requisições que são barradas por regras de configuração antes de chegar ao Node. O `/metrics` do nodeweb só conta as requisições que passaram pelo proxy e foram tratadas pelo Express; arquivos estáticos servidos pelo Nginx (ou pelo volume público) nunca chegam ao Node e portanto nunca aparecem nas métricas do nodeweb.
