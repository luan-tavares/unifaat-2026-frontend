import MessageModel from '../Models/MessageModel.js'

const RECENT_LIMIT = 10

/**
 * Consultas das mensagens do chat (tabela messages). O Controller não sabe SQL: só pede ao Service.
 */
export default {
    // As 10 últimas mensagens, da mais nova para a mais antiga (o ip fica de fora: não é dado público)
    async recent() {
        return MessageModel.findAll({
            attributes: ['id', 'name', 'message', 'date'],
            order: [['date', 'DESC'], ['id', 'DESC']],
            limit: RECENT_LIMIT,
            raw: true
        })
    }
}
