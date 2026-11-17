import { randomUUID } from 'node:crypto'
import { createEvent } from '../../../utils/event.js'
export default createEvent({
    name: 'chat:join',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = payload?.room
        const socket = context.socket
        if (!name || !['geral', 'dev'].includes(room)) return
        if (socket.data.room === room && socket.data.name === name) return
        const previous = socket.data.room
        if (previous) {
            await socket.leave(previous)
            await context.notify('chat:left', { id: randomUUID(), userId: socket.id, name: socket.data.name, room: previous, sentAt: Date.now() })
        }
        await socket.join(room)
        socket.data.name = name
        socket.data.room = room
        await context.presence.publish()
        await context.notify('chat:joined', { id: randomUUID(), userId: socket.id, name, room, sentAt: Date.now() })
    }
})
