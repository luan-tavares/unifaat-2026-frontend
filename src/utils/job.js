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

        // Processo curto (controller, comando) abre e fecha. Processo longo (websocket) já está conectado:
        // fechar aqui derrubaria a conexão dele (e as assinaturas dos exchanges). Só fecha o que ele mesmo abriu.
        const isAlreadyConnected = rabbit.isConnected()

        await rabbit.connect()

        try {
            return await rabbit.publish(queue, { job: name, payload }, options)
        } finally {
            if (!isAlreadyConnected) {
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

