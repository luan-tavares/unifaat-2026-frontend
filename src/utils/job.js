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

        // Só fecha a conexão se foi ESTE dispatch que a abriu. Dentro do websocket (ou de um worker)
        // a conexão já existe e é de outro: fechá-la derrubaria o servidor inteiro.
        const isOwner = !rabbit.isConnected()

        await rabbit.connect()

        try {
            return await rabbit.publish(queue, { job: name, payload }, options)
        } finally {
            if (isOwner) {
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

