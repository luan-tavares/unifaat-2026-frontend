import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

// Espera que simula o custo de processar a imagem. O `sharp` não está instalado
// no projeto e instalá-lo exigiria recompilar a imagem do worker; o que o TF
// quer demonstrar é que o trabalho pesado sai do websocket, e três segundos
// bloqueando o worker mostram isso tão bem quanto um resize real.
const PESO_MS = 3000

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Processa a imagem do chat fora do websocket.
 *
 * O `handle` roda no worker da fila `images`. Enquanto ele dorme, o servidor
 * websocket segue distribuindo texto normalmente — essa é a prova de que a
 * separação funciona. Pare o worker e mande uma imagem: o texto continua, e a
 * imagem fica na fila esperando o worker voltar.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        if (!name || !room || !filename || !data) {
            return
        }

        console.log(`Processando imagem de ${name} na sala ${room}: ${filename}`)

        await esperar(PESO_MS)

        // A "miniatura" é o próprio dataURL: sem o sharp não há redimensionamento
        // de verdade. O caminho de volta é que importa aqui — o resultado sai por
        // um exchange diferente (`results`), e não pela fila de trabalho.
        const thumb = data

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })

        console.log(`Imagem de ${name} pronta e publicada em results`)
    }
})
