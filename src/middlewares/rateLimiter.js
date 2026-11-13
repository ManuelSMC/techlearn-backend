const { rateLimit } = require('express-rate-limit');

const message = (text) => ({ success: false, message: text });

// Límite general para toda la API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Demasiadas peticiones, intenta más tarde'),
});

// Límite estricto para login y registro (protección contra fuerza bruta).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Demasiados intentos. Intenta de nuevo en 15 minutos'),
});

module.exports = { apiLimiter, authLimiter };
