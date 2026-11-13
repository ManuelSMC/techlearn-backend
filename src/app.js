const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Necesario detrás del proxy de Railway para que el rate limit lea la IP real.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '100kb' }));
if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
