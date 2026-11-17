import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async ({ id, userId, name, room, filename, data }) => {
        // Simulacao de processamento pesado permitida no enunciado.
        await new Promise(resolve => setTimeout(resolve, 3000))
        await rabbit.notify('results', 'chat:image', { id, userId, name, room, filename, thumb: data, sentAt: Date.now() })
    }
})
