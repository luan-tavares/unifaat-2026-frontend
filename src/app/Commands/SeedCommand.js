import path from 'node:path'
import { pathToFileURL } from 'node:url'
import postgres from '../../database/connections/postgres.js'
import CONSTANTS from '../../bootstrap/config.js'

export default {
    name: 'seed',
    description: 'Popula o banco com dados de exemplo',

    async handle() {
        const initialSeedPath = path.resolve(CONSTANTS.DIR, 'database', 'seeds', 'initialSeed.js')
        const tasksSeedPath = path.resolve(CONSTANTS.DIR, 'database', 'seeds', 'tasksSeed.js')

        const initialSeedModule = await import(pathToFileURL(initialSeedPath).href)
        const tasksSeedModule = await import(pathToFileURL(tasksSeedPath).href)

        if (typeof initialSeedModule.default !== 'function') {
            throw new Error('Initial seed não exporta uma função padrão')
        }

        if (typeof tasksSeedModule.default !== 'function') {
            throw new Error('Tasks seed não exporta uma função padrão')
        }

        console.log('Executando seed inicial...')
        await postgres.query('BEGIN')

        try {
            await initialSeedModule.default(postgres)
            console.log('✓ Usuários criados')

            await tasksSeedModule.default(postgres)
            console.log('✓ Tarefas criadas')

            await postgres.query('COMMIT')
            console.log('Seed concluída com sucesso.')
        } catch (error) {
            await postgres.query('ROLLBACK')
            throw error
        } finally {
            await postgres.close()
        }
    }
}
