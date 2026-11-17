import { randomUUID } from 'node:crypto'
import { createEvent } from '../../../utils/event.js'
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const { socket } = context
        const { name, room } = socket.data
        const text = String(payload?.text ?? '').trim().slice(0, 500)
        if (!text || !name || room !== payload?.room || !socket.rooms.has(room)) return
        await context.notify('chat:message', { id: randomUUID(), userId: socket.id, name, room, text, sentAt: Date.now() })
    }
})
