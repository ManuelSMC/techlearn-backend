const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Conectado a MySQL');
  } catch (error) {
    console.error('No se pudo conectar a MySQL:', error.message);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`API TechLearn escuchando en http://localhost:${env.port}/api/v1`);
  });
}

start();
