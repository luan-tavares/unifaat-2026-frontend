import express from 'express';
import chalk from 'chalk';
import dotenv from 'dotenv';

import router from './backend/routes/router.js';
import app from "./backend/bootstrap/app.js";

dotenv.config();

/** Inicializador */
app();

/** Iniciar roteador */
const web = express();

/** Registrar as Rotas */
web.use('/', router);

const port = process.env.NODE_WEB_PORT || 8080;

web.listen(port, () => {
    console.log(chalk.green(`Servidor node web rodando na porta ${port}`));
});