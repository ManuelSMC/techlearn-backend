const AppError = require('../utils/AppError');
const env = require('../config/env');

function notFound(req, res, next) {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

/**
 * Middleware global de errores. Express 5 envía aquí automáticamente
 * los errores lanzados en funciones async, sin necesidad de try/catch.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'El cuerpo de la petición no es un JSON válido' });
  }

  // Archivo demasiado grande o campos inesperados al subir imágenes (multer)
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'La imagen no puede pesar más de 2 MB' : 'Solo se puede subir una imagen en el campo "image"';
    return res.status(400).json({ success: false, message });
  }

  // Violación de llave única en MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos' });
  }

  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // Error inesperado: se registra completo, pero al cliente no se le exponen detalles internos.
  console.error(err);
  const body = { success: false, message: 'Error interno del servidor' };
  if (env.nodeEnv === 'development') body.error = err.message;
  return res.status(500).json(body);
}

module.exports = { notFound, errorHandler };
