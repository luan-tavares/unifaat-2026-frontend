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
    .option('--port <port>', 'Porta do servidor WebSocket')
    .option('--results <exchange>', 'Exchange de onde chegam os resultados processados pelos workers')
    .parse(process.argv)

const options = program.opts()
const exchange = options.exchange || 'notifications'
const port = Number(options.port || 3001)
const results = options.results || 'results'

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

// Entrega o evento aos clients deste servidor. Com room no payload, só para quem está NA SALA
// (io.to(room)); sem room (ex.: a lista de presença), para todos (io.emit).
const deliver = (event, payload) => {
    if (payload && payload.room) {
        io.to(payload.room).emit(event, payload)
        return
    }

    io.emit(event, payload)
}

// Volta do exchange de eventos: cria a fila dinâmica DESTE servidor e entrega aos SEUS clients conectados
await rabbit.subscribe(exchange, (event, payload) => {
    // A lista de presença das réplicas é só informação de conexão: não vai direto para a tela
    if (event === 'presence:instance') {
        presence.receive(payload)
        return
    }

    deliver(event, payload)
})

// Volta do exchange de resultados: o que os workers terminaram (ex.: chat:image) entra pela fila
// dinâmica deste servidor no "results" e é entregue à sala, igual a qualquer outro evento.
await rabbit.subscribe(results, (event, payload) => {
    deliver(event, payload)
})

const shutdown = async () => {
    console.log('\nEncerrando websocket...')
    io.close()
    await rabbit.close()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

httpServer.listen(port, () => {
    console.log(`Websocket iniciado na porta ${port}. Exchange: ${exchange}. Resultados: ${results}`)
})
