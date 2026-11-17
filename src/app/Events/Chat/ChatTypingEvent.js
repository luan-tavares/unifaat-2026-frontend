import { createEvent } from '../../../utils/event.js'
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const { socket } = context
        const { name, room } = socket.data
        if (!name || room !== payload?.room || !socket.rooms.has(room)) return
        await context.notify('chat:typing', { userId: socket.id, name, room })
    }
})
