/**
 * Error controlado de la aplicación. El middleware de errores lo convierte
 * en una respuesta HTTP con el código y mensaje indicados.
 */
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message = 'Solicitud inválida', details) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new AppError(401, message);
  }

  static forbidden(message = 'No tienes permiso para realizar esta acción') {
    return new AppError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(404, message);
  }

  static conflict(message = 'El recurso ya existe') {
    return new AppError(409, message);
  }
}

module.exports = AppError;
