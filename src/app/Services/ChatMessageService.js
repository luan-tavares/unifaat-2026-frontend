import MessageModel from '../Models/MessageModel.js'

const RECENT_LIMIT = 10

/**
 * Consultas das mensagens do chat (tabela messages, gravada pelo worker da fila save-message).
 * O Controller só orquestra: a consulta ao Postgres fica aqui.
 */
export default {
    // As 10 últimas mensagens, da mais nova para a mais antiga
    async recent() {
        return MessageModel.findAll({
            attributes: ['id', 'name', 'message', 'date'],
            order: [['date', 'DESC']],
            limit: RECENT_LIMIT,
            raw: true
        })
    }
}
