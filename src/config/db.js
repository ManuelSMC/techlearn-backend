const mysql = require('mysql2/promise');
const env = require('./env');

// Pool de conexiones: reutiliza conexiones en lugar de abrir una por petición.
const baseOptions = {
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL llega como number y no como string
  timezone: 'Z',
};

const pool = env.db.url
  ? mysql.createPool({ uri: env.db.url, ...baseOptions })
  : mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      ...baseOptions,
    });

module.exports = pool;
