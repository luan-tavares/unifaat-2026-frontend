import { randomUUID } from 'node:crypto'
import { createEvent } from '../../../utils/event.js'
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const socket = context.socket
        const { room, name } = socket.data
        if (!room || room !== payload?.room || !socket.rooms.has(room)) return
        await socket.leave(room)
        delete socket.data.room
        delete socket.data.name
        await context.presence.publish()
        await context.notify('chat:left', { id: randomUUID(), userId: socket.id, name, room, sentAt: Date.now() })
    }
})
