const AppError = require('../utils/AppError');
const { buildPaginationMeta } = require('../utils/pagination');
const instructorRepository = require('../repositories/instructor.repository');

async function listPublic(query) {
  const { items, total } = await instructorRepository.listPublic(query);
  return { items, meta: buildPaginationMeta(query.page, query.limit, total) };
}

async function getPublicProfile(id) {
  const instructor = await instructorRepository.findPublicById(id);
  if (!instructor) throw AppError.notFound('Instructor no encontrado');
  return instructor;
}

async function getMyProfile(user) {
  if (!user.instructorId) throw AppError.forbidden('Tu cuenta no tiene un perfil de instructor');
  return instructorRepository.findById(user.instructorId);
}

async function updateMyProfile(user, data) {
  if (!user.instructorId) throw AppError.forbidden('Tu cuenta no tiene un perfil de instructor');
  await instructorRepository.updateProfile(user.instructorId, data);
  return instructorRepository.findById(user.instructorId);
}

module.exports = { listPublic, getPublicProfile, getMyProfile, updateMyProfile };
