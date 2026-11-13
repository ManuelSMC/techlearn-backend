const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');
const { buildPaginationMeta } = require('../utils/pagination');
const { SALT_ROUNDS } = require('./auth.service');
const userRepository = require('../repositories/user.repository');
const instructorRepository = require('../repositories/instructor.repository');

async function list(query) {
  const { items, total } = await userRepository.list(query);
  return { items, meta: buildPaginationMeta(query.page, query.limit, total) };
}

/**
 * El admin da de alta a un instructor: crea la cuenta y su perfil en una
 * transacción, para que nunca quede una cuenta de instructor sin perfil.
 */
async function createInstructor({ name, email, password, specialty, bio, photoUrl }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = await userRepository.create({ name, email, passwordHash, role: ROLES.INSTRUCTOR }, connection);
    await instructorRepository.create({ userId, specialty, bio, photoUrl }, connection);
    await connection.commit();
    return userRepository.findById(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Habilitar / deshabilitar una cuenta (baja lógica). */
async function setStatus(adminUser, userId, isActive) {
  if (adminUser.id === userId) throw AppError.badRequest('No puedes cambiar el estado de tu propia cuenta');
  const user = await userRepository.findById(userId);
  if (!user) throw AppError.notFound('Usuario no encontrado');
  if (user.role === ROLES.ADMIN) throw AppError.forbidden('No se puede deshabilitar a otro administrador');
  await userRepository.setActive(userId, isActive);
  return userRepository.findById(userId);
}

module.exports = { list, createInstructor, setStatus };
