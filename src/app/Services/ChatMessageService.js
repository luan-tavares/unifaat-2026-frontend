import MessageModel from '../Models/MessageModel.js'

const RECENT_LIMIT = 10

/**
 * Consultas das mensagens do chat que o cache protege.
 */
export default {
    // As últimas mensagens gravadas (ordenadas por date, a mais nova primeiro)
    async recent() {
        return MessageModel.findAll({
            order: [['date', 'DESC']],
            limit: RECENT_LIMIT,
            raw: true
        })
    }
}
