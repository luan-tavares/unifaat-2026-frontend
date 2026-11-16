import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'
import { sleep } from '../../utils/sleep.js'

/**
 * Processa a imagem FORA do websocket, no worker da fila "images".
 * Aqui mora o trabalho "pesado" (gerar a miniatura). Para a entrega não depender
 * de dependência nativa, simulamos o peso com uma espera de 3 s (como o README permite)
 * e usamos o próprio dataURL como miniatura, exibida em tamanho pequeno pelo React.
 * Terminado o trabalho, o resultado volta por OUTRO exchange ("results"): cada websocket
 * tem a sua fila dinâmica ligada a ele e entrega o chat:image aos clients da sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        // Simula o processamento pesado (redimensionar/gerar miniatura) fora do websocket.
        await sleep(3)

        const thumb = data

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })

        console.log(`Imagem processada no worker: ${filename} (sala ${room}, de ${name})`)
    }
})
