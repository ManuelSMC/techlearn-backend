const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const { ROLES } = require('../utils/constants');
const userRepository = require('../repositories/user.repository');

const SALT_ROUNDS = 10;
// Hash ficticio: se compara aunque el correo no exista para que la respuesta tarde lo mismo
// y no se pueda adivinar qué correos están registrados (enumeración de usuarios).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);
const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';

function buildSession(user) {
  return { token: signToken(user), user };
}

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // El registro público SIEMPRE crea cuentas con rol "user".
  // Si el correo ya existe, MySQL lanza ER_DUP_ENTRY y el middleware de errores responde 409.
  const id = await userRepository.create({ name, email, passwordHash, role: ROLES.USER });
  const user = await userRepository.findById(id);
  return buildSession(user);
}

async function login({ email, password }) {
  const account = await userRepository.findByEmailWithPassword(email);
  const passwordMatches = await bcrypt.compare(password, account ? account.passwordHash : DUMMY_HASH);

  if (!account || !passwordMatches) throw AppError.unauthorized(INVALID_CREDENTIALS);
  if (!account.isActive) throw AppError.forbidden('Tu cuenta está deshabilitada. Contacta al administrador');

  const user = await userRepository.findById(account.id);
  return buildSession(user);
}

module.exports = { register, login, SALT_ROUNDS };
