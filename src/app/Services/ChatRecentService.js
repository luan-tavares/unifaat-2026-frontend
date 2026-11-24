import { QueryTypes } from 'sequelize'
import sequelize from '../../database/connections/sequelize.js'

/**
 * Consulta as 10 mensagens mais recentes do chat (tabela messages, ordenadas por date DESC).
 * Fica no Service para o Controller nunca tocar no banco diretamente.
 */
export default {
    async recent() {
        return sequelize.query(
            `SELECT id, name, ip, message, date
               FROM messages
              ORDER BY date DESC
              LIMIT 10`,
            { type: QueryTypes.SELECT }
        )
    }
}
