import { Command } from 'commander'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import loadEvents from './utils/loadEvents.js'
import { createPresence } from './utils/presence.js'
import rabbit from './database/connections/rabbit.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const program = new Command()

program
    .name('websocket')
    .description('Servidor WebSocket: segura as conexões dos clients e distribui eventos pelo RabbitMQ')
    .option('--exchange <exchange>', 'Nome do exchange fanout que este servidor assina')
    .option('--results <results>', 'Exchange por onde os workers devolvem resultado')
    .option('--port <port>', 'Porta do servidor WebSocket')
    .parse(process.argv)

const options = program.opts()
const exchange = options.exchange || 'notifications'
// Exchange separado para o caminho de volta dos workers. Poderia ser o mesmo
// `notifications`, mas separar deixa explícito quem publica o quê: o websocket
// publica no primeiro, o worker publica no segundo.
const results = options.results || 'results'
const port = Number(options.port || 3001)

const events = await loadEvents(path.join(__dirname, 'app', 'Events'))

if (Object.keys(events).length === 0) {
    console.warn('Atenção: nenhum Event registrado em app/Events')
}

const httpServer = createServer()
const io = new Server(httpServer, { serveClient: false })

await rabbit.connect()

// O Event só enxerga "notify": o exchange fica preso aqui, na hora de montar
const notify = (event, payload) => rabbit.notify(exchange, event, payload)

// Quem está online: cada réplica só conhece os sockets dela, então a lista circula pelo exchange
const presence = createPresence({ io, notify })

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`)

    // Quem entra já recebe a lista de quem está online
    socket.emit('presence:list', presence.list())

    for (const event of Object.values(events)) {
        socket.on(event.name, (payload) => {
            event.handle(payload, { socket, notify, presence }).catch((error) => {
                console.error(`Erro no Event ${event.name}:`, error)
            })
        })
    }

    socket.on('disconnect', () => {
        console.log(`Cliente saiu: ${socket.id}`)
        presence.publish().catch((error) => console.error('Erro ao publicar a presença:', error))
    })
})

const entregar = (event, payload) => {
    // A lista de presença das réplicas é só informação de conexão: não vai direto para a tela
    if (event === 'presence:instance') {
        presence.receive(payload)
        return
    }

    const room = payload?.room

    // Com sala, entrega só a quem deu socket.join(room). Sem sala (presence:list,
    // por exemplo), continua indo para todo mundo — é informação de conexão, não
    // conteúdo de sala.
    if (room) {
        io.to(room).emit(event, payload)
        return
    }

    io.emit(event, payload)
}

// Volta do exchange: cria a fila dinâmica DESTE servidor e entrega aos SEUS clients conectados
await rabbit.subscribe(exchange, entregar)

// Caminho de volta dos workers: o resultado do processamento pesado chega por
// aqui, depois de o worker terminar. Para o client não há diferença — é um
// evento como outro qualquer, entregue para a mesma sala. Este arquivo não
// conhece o nome de nenhum Event: o loadEvents registra, e o consumidor só
// repassa o que vier.
await rabbit.subscribe(results, entregar)

const shutdown = async () => {
    console.log('\nEncerrando websocket...')
    io.close()
    await rabbit.close()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

httpServer.listen(port, () => {
    console.log(`Websocket iniciado na porta ${port}. Exchanges: ${exchange} e ${results}`)
})
