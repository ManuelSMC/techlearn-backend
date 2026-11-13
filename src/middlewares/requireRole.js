const AppError = require('../utils/AppError');

/**
 * Permite el acceso solo a los roles indicados.
 * Uso: router.post('/', authenticate, requireRole('instructor'), controller)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) throw AppError.unauthorized('Se requiere iniciar sesión');
    if (!allowedRoles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };
}

module.exports = requireRole;
