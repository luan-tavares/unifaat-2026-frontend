import MessageModel from '../Models/MessageModel.js'

const RECENT_LIMIT = 10

/**
 * Consultas das mensagens do chat que o cache protege. A consulta fica aqui, nunca no Controller:
 * o Controller só decide de onde vem a resposta (Redis ou banco).
 */
export default {
    /**
     * As 10 últimas mensagens gravadas (mais nova primeiro).
     * raw: true devolve objetos simples, prontos para virar JSON e ir para o Redis.
     */
    async recent() {
        return MessageModel.findAll({
            attributes: ['id', 'name', 'message', 'date'],
            order: [['date', 'DESC']],
            limit: RECENT_LIMIT,
            raw: true
        })
    }
}
