import { QueryTypes } from 'sequelize'
import sequelize from '../../database/connections/sequelize.js'

/**
 * A consulta "cara" do cache: o ranking do chat (quem mais falou). Varre a tabela messages inteira
 * e agrupa por nome. Quanto mais mensagens, mais cara: é o que o cache evita repetir.
 */
export default {
    async recentMessages() {
        return sequelize.query(
            `SELECT id, ip, name, message, date
               FROM messages
              ORDER BY date DESC
              LIMIT 10`,
            { type: QueryTypes.SELECT }
        )
    },

    async ranking() {
        return sequelize.query(
            `SELECT name,
                    COUNT(*) AS total,
                    MAX(date) AS last_message_at
               FROM messages
              GROUP BY name
              ORDER BY total DESC
              LIMIT 10`,
            { type: QueryTypes.SELECT }
        )
    }
}
