import { createEvent } from '../../../utils/event.js'

/**
 * Chat: "fulano está digitando…".
 *
 * O Event não guarda estado nenhum e não agenda nada: ele só repassa o aviso
 * pelo exchange. Quem decide por quanto tempo o aviso fica na tela é o React,
 * com um temporizador próprio — o servidor não tem como saber quando a pessoa
 * parou de digitar, só quando ela digitou.
 *
 * O arquivo não precisa ser citado em lugar nenhum: o loadEvents varre
 * app/Events e registra pelo `name`.
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)

        if (!name) {
            return
        }

        // A sala viaja no payload porque o consumidor do exchange decide o
        // destino por ela: sem `room`, o aviso vazaria para as outras salas.
        const room = String(payload?.room ?? '').trim()

        if (!room) {
            return
        }

        await context.notify('chat:typing', { name, room, sentAt: Date.now() })
    }
})
