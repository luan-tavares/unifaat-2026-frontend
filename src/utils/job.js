import rabbit from '../database/connections/rabbit.js'

export function createJob({ name, handle }) {
    if (!name || typeof name !== 'string') {
        throw new Error('Job precisa receber um name válido.')
    }

    if (!handle || typeof handle !== 'function') {
        throw new Error('Job precisa receber um handle(payload) válido.')
    }

    async function dispatch(queue, payload = {}, options = {}) {
        if (!queue) {
            throw new Error('dispatch requer o parâmetro queue.')
        }

        if (!name || typeof name !== 'string') {
            throw new Error('dispatch requer o nome do job como string.')
        }

        // Só fecha a conexão se ELA foi aberta aqui. Dentro do websocket (ou do worker) a conexão já existe
        // e é usada por outras coisas (a fila dinâmica do exchange): fechá-la derrubaria o servidor.
        const wasConnected = rabbit.isConnected()

        if (!wasConnected) {
            await rabbit.connect()
        }

        try {
            return await rabbit.publish(queue, { job: name, payload }, options)
        } finally {
            if (!wasConnected) {
                await rabbit.close()
            }
        }
    }

    return {
        name,
        handle,
        dispatch
    }
}

