const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/**
 * Valida el JWT y carga el usuario en req.user.
 * Además de la firma, confirma que la cuenta siga activa: si un admin
 * da de baja a un usuario, su token deja de funcionar de inmediato.
 */
async function loadUser(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw AppError.unauthorized('Token inválido o expirado');
  }

  const user = await userRepository.findById(Number(payload.sub));
  if (!user || !user.isActive) {
    throw AppError.unauthorized('La cuenta no existe o está deshabilitada');
  }
  return user;
}

// Requiere sesión iniciada.
async function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized('Se requiere iniciar sesión');
  req.user = await loadUser(token);
  next();
}

// Sesión opcional: si hay token válido carga el usuario; si no, continúa como visitante.
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) req.user = await loadUser(token);
  next();
}

module.exports = { authenticate, optionalAuth };
