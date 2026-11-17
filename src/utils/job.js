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

        // A ARMADILHA: antes, este bloco fazia connect() e, no finally, close()
        // incondicional. Num comando avulso isso é correto — o processo abre a
        // conexão, publica e sai. Dentro do servidor websocket, não: ele já tem
        // uma conexão aberta no boot, usada pelo exchange e pela presença. O
        // close() do dispatch derrubava ESSA conexão, e o chat parava de
        // distribuir eventos depois do primeiro envio de imagem.
        //
        // O sintoma enganava: a imagem até chegava na fila, e a quebra aparecia
        // no evento seguinte, sem relação aparente com o upload.
        //
        // Agora quem abriu é quem fecha.
        const jaEstavaConectado = rabbit.isConnected()

        if (!jaEstavaConectado) {
            await rabbit.connect()
        }

        try {
            return await rabbit.publish(queue, { job: name, payload }, options)
        } finally {
            if (!jaEstavaConectado) {
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

