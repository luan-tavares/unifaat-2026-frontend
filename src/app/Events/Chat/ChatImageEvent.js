import { randomUUID } from 'node:crypto'
import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'
const MAX_BYTES = 500 * 1024
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const { socket } = context
        const { name, room } = socket.data
        const data = payload?.data
        const filename = String(payload?.filename ?? '').trim().slice(0, 150)
        if (!name || room !== payload?.room || !socket.rooms.has(room) || !filename) return
        if (typeof data !== 'string' || data.length > Math.ceil(MAX_BYTES / 3) * 4 + 100) return
        const match = /^data:image\/(?:png|jpeg|gif|webp|bmp|avif|x-icon|vnd\.microsoft\.icon);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(data)
        if (!match || Buffer.from(match[1], 'base64').length > MAX_BYTES) return
        await ProcessChatImageJob.dispatch('images', { id: randomUUID(), userId: socket.id, name, room, filename, data }, { persistent: true })
    }
})
