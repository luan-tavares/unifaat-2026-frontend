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

        // Quem já tem a conexão aberta (o websocket) a mantém: o dispatch só fecha a que ele mesmo abriu.
        // Sem isso, o dispatch derrubaria a conexão do RabbitMQ que o servidor usa para assinar os exchanges.
        const wasConnected = rabbit.isConnected()

        await rabbit.connect()

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

