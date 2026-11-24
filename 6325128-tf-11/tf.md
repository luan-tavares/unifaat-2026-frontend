Nome: Felipe Damasceno
RA: 6325128
GitHub: https://github.com/FelipeDesda

Invalidação no worker: O ChatMessageEvent apenas distribui a mensagem e agenda o job. O worker é quem grava no Postgres; por isso, invalida as chaves depois que a gravação termina com sucesso, garantindo que o próximo GET consulte o dado atualizado. Se a invalidação fosse feita no evento, poderia ocorrer antes da persistência ou mesmo quando ela falhasse.
Redes do exporter: O exporter participa da edge-network para consultar o listener interno do Nginx e da data-network para ser alcançado pelo Prometheus. Assim, ele conecta as duas redes sem publicar sua porta no host; o Nginx permanece apenas na rede de borda e o Prometheus apenas na rede de dados.
O que o stub_status mede: Ele mostra as conexões ativas e seus estados (reading, writing e waiting), além do total de conexões aceitas, tratadas e requisições HTTP recebidas pelo Nginx. Isso inclui tráfego servido diretamente pelo Nginx, como arquivos estáticos, e conexões que não chegam ao Node; as métricas do nodeweb só observam o processo Node e as requisições que alcançam a aplicação.